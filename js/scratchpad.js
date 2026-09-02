// Karalama alani. Soru ekraninda parmakla cizilebilen tuval.
//
// Akisi kesmemesi icin varsayilan kapalidir; kapaliyken sadece tek satirlik bir
// dugme gorunur. Cizgiler stroke listesinde tutulur: yeniden boyutlandirmada cizim
// kaybolmaz, "Geri al" son hareketi atar. Silgi de bir stroke oldugu icin geri alinabilir.

import { el } from './ui.js';

const CANVAS_HEIGHT = 180;
const PEN_WIDTH = 2.5;
const PEN_COLOR = '#0f172a';
/** Telefonda isabet ettirilebilecek kadar genis, fazlasini silmeyecek kadar dar. */
const ERASER_WIDTH = 18;
/** Geri al gecmisinin siniri; tasan en eski hareketler baseline tuvaline duzlestirilir. */
const MAX_STROKES = 30;

let nextId = 1;

/**
 * createScratchpad({ open }) -> { node, reset, setOpen, isOpen, setFullscreen, isFullscreen, destroy }
 * node, cagiran ekranin istedigi yere eklenir. Tek ornek uzun omurludur:
 * DOM'dan sokulup tekrar eklenmesi cizimi bozmaz.
 */
export function createScratchpad({ open = false } = {}) {
  const panelId = `scratch-panel-${nextId++}`;

  const canvas = el('canvas', {
    class: 'scratch-canvas',
    role: 'img',
    'aria-label': 'Karalama tuvali',
  });

  const fullButton = el('button', {
    class: 'scratch-btn',
    type: 'button',
    on: { click: () => setFullscreen(!isFullscreen) },
  }, 'Büyüt');

  // Tek dugme iki modu tasir: basili gorunum silgi modu demektir.
  const toolButton = el('button', {
    class: 'scratch-btn',
    type: 'button',
    'aria-pressed': 'false',
    'aria-label': 'Silgi modu',
    on: { click: () => setTool(tool === 'erase' ? 'pen' : 'erase') },
  }, 'Silgi');

  const undoButton = el('button', {
    class: 'scratch-btn',
    type: 'button',
    disabled: true,
    on: { click: () => undo() },
  }, 'Geri al');

  const clearButton = el('button', {
    class: 'scratch-btn',
    type: 'button',
    on: { click: () => reset() },
  }, 'Temizle');

  const panel = el('div', { class: 'scratch-panel', id: panelId },
    canvas,
    el('div', { class: 'scratch-tools' }, fullButton, toolButton, undoButton, clearButton)
  );

  const caret = el('span', { class: 'scratch-caret', 'aria-hidden': 'true' }, '▾');
  const toggle = el('button', {
    class: 'scratch-toggle',
    type: 'button',
    'aria-expanded': 'false',
    'aria-controls': panelId,
    on: { click: () => setOpen(!isOpen) },
  }, el('span', null, 'Karalama alanı'), caret);

  const node = el('div', { class: 'scratch' }, toggle, panel);

  const ctx = canvas.getContext('2d');

  /** [{ mode: 'pen'|'erase', points: [{x,y}, ...] }, ...] - CSS pikseli, tuvalin sol ust kosesine gore. */
  let strokes = [];
  let current = null;
  let activePointerId = null;
  /** setPointerCapture gercekten kuruldu mu; bayat pointer tespitinde kullanilir. */
  let captureHeld = false;
  let tool = 'pen';

  let cssWidth = 0;
  let cssHeight = CANVAS_HEIGHT;
  let dpr = 1;
  let isOpen = false;
  let isFullscreen = false;

  /**
   * MAX_STROKES tasinca en eski hareketler buraya duzlestirilir: geri alinamazlar ama
   * ekranda kalirlar. Boylece gecmis sinirliyken bile cizim kaybolmaz.
   * baselineWidth/Height, goruntunun kapsadigi CSS alanidir - tuval kuculse bile baseline
   * kucultulmez, yoksa tam ekranda cizilenler geri donulmez sekilde kirpilirdi.
   */
  let baseline = null;
  let baselineWidth = 0;
  let baselineHeight = 0;

  // ---------- cizim ----------

  function widthOf(mode) {
    return mode === 'erase' ? ERASER_WIDTH : PEN_WIDTH;
  }

  /** Silgi ayri bir renk degil: destination-out boyayi kaldirir, kagit CSS'ten gelir. */
  function applyStyle(target, mode) {
    target.lineCap = 'round';
    target.lineJoin = 'round';
    target.strokeStyle = PEN_COLOR;
    target.fillStyle = PEN_COLOR;
    target.lineWidth = widthOf(mode);
    target.globalCompositeOperation = mode === 'erase' ? 'destination-out' : 'source-over';
  }

  function drawDot(target, mode, point) {
    target.beginPath();
    target.arc(point.x, point.y, widthOf(mode) / 2, 0, Math.PI * 2);
    target.fill();
  }

  function drawSegment(target, from, to) {
    target.beginPath();
    target.moveTo(from.x, from.y);
    target.lineTo(to.x, to.y);
    target.stroke();
  }

  function drawStroke(target, stroke) {
    applyStyle(target, stroke.mode);
    const points = stroke.points;
    if (points.length === 1) {
      drawDot(target, stroke.mode, points[0]);
      return;
    }
    target.beginPath();
    target.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) target.lineTo(points[i].x, points[i].y);
    target.stroke();
  }

  /** Tumunu bastan cizer: yeniden boyutlandirmada, geri alda ve tam ekran gecisinde. */
  function redraw() {
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, cssWidth, cssHeight);
    // Kendi CSS olcusuyle cizilir; tuval buyudu diye eski cizim esnememeli.
    if (baseline) ctx.drawImage(baseline, 0, 0, baselineWidth, baselineHeight);
    for (const stroke of strokes) drawStroke(ctx, stroke);
    applyStyle(ctx, tool);
  }

  /** Duzlestirme hedefi; tuval buyuduyse baseline'i buyuterek yeniden kurar. */
  function baselineContext() {
    const needWidth = Math.max(baselineWidth, cssWidth);
    const needHeight = Math.max(baselineHeight, cssHeight);
    const pixelWidth = Math.round(needWidth * dpr);
    const pixelHeight = Math.round(needHeight * dpr);

    if (!baseline || baseline.width !== pixelWidth || baseline.height !== pixelHeight) {
      const next = document.createElement('canvas');
      next.width = pixelWidth;
      next.height = pixelHeight;
      const nextCtx = next.getContext('2d');
      nextCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (baseline) nextCtx.drawImage(baseline, 0, 0, baselineWidth, baselineHeight);
      baseline = next;
      baselineWidth = needWidth;
      baselineHeight = needHeight;
    }

    const target = baseline.getContext('2d');
    target.setTransform(dpr, 0, 0, dpr, 0, 0);
    return target;
  }

  /** Gecmisi sinirda tutar: en eski hareket geri alinamaz hale gelir ama ekrandan silinmez. */
  function pushStroke(stroke) {
    strokes.push(stroke);
    while (strokes.length > MAX_STROKES) drawStroke(baselineContext(), strokes.shift());
  }

  /**
   * Tuvali kendi CSS boyutuna ve ekran yogunluguna gore olceklendirir.
   * Panel kapaliyken (ya da node DOM disindayken) olculebilir boyut yok, bir sey yapmaz.
   */
  function resize() {
    const rect = canvas.getBoundingClientRect();
    const width = Math.round(rect.width);
    // Yukseklik de olculur: tam ekranda tuval CSS'ten esner, sabit degildir.
    const height = Math.round(rect.height);
    if (width <= 0 || height <= 0) return;

    const nextDpr = Math.min(window.devicePixelRatio || 1, 2);
    const pixelWidth = Math.round(width * nextDpr);
    const pixelHeight = Math.round(height * nextDpr);
    if (canvas.width === pixelWidth && canvas.height === pixelHeight) return;

    dpr = nextDpr;
    cssWidth = width;
    cssHeight = height;
    // width/height yazmak baglami sifirlar: donusum ve kalem ayari sonra gelmeli.
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    redraw();
  }

  // ---------- girdi ----------

  function releaseCapture(pointerId) {
    captureHeld = false;
    if (pointerId === null) return;
    try {
      if (canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId);
    } catch (error) {
      /* yoksay */
    }
  }

  function pointFrom(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  /**
   * Elimizdeki aktif pointer gercekten hala ekranda mi? Iki bagimsiz sinyal:
   *  - isPrimary: spesifikasyon geregi ortada baska aktif dokunus yokken gelen ilk parmak.
   *    Boyle bir olay geldiyse eskisi kesinlikle bitmis, bitis olayi bize ulasmamis demektir.
   *  - Yakalama kurulmusken hasPointerCapture'in false donmesi: pointer bittigi icin
   *    tarayici yakalamayi ortuk olarak birakmistir.
   * Ikinci sinyal captureHeld ile korunur: setPointerCapture hic kurulamadiysa
   * hasPointerCapture zaten false doner ve mesru ikinci parmak haksiz yere tahliye edilirdi.
   */
  function activePointerGone(event) {
    if (activePointerId === null) return false;
    if (event.isPrimary) return true;
    return captureHeld && !canvas.hasPointerCapture(activePointerId);
  }

  function onPointerDown(event) {
    // Tek yonlu giris kapisi birakma: bayat pointer burada tahliye edilir, yoksa tuval
    // bir daha hicbir sey cizmez. Avuc ya da hala basili duran ikinci parmak bu kapidan
    // gecmez, yani tek parmak kurali bozulmaz.
    if (activePointerGone(event)) abortStroke();

    // Ayni anda tek parmak cizer; ikinci dokunus yok sayilir.
    if (activePointerId !== null) return;
    event.preventDefault();

    activePointerId = event.pointerId;
    // Yakalama basarisiz olursa (pointer araya girip birakildiysa) cizim yine surer.
    try {
      canvas.setPointerCapture(event.pointerId);
      captureHeld = true;
    } catch (error) {
      /* yoksay */
    }

    const point = pointFrom(event);
    current = { mode: tool, points: [point] };
    pushStroke(current);
    applyStyle(ctx, tool);
    drawDot(ctx, tool, point);
    syncTools();
  }

  function onPointerMove(event) {
    if (event.pointerId !== activePointerId || !current) return;
    event.preventDefault();

    // Hizli hareketlerde ara noktalar da alinir; cizgi kose kose olmaz.
    const events = event.getCoalescedEvents ? event.getCoalescedEvents() : [event];
    const points = current.points;
    for (const item of events.length > 0 ? events : [event]) {
      const point = pointFrom(item);
      const previous = points[points.length - 1];
      if (point.x === previous.x && point.y === previous.y) continue;
      points.push(point);
      drawSegment(ctx, previous, point);
    }
  }

  /**
   * Darbeyi kapatir. Yalnizca aktif pointer'in bitis olayina cevap verir; baska bir
   * parmagin olayi buraya dusse de bir sey yapmaz. Yakalama da birakilir, yoksa tuval
   * DOM'dan sokulup geri eklendiginde bayat bir yakalama kalabilir.
   */
  function endStroke(event) {
    if (event.pointerId !== activePointerId) return;
    releaseCapture(activePointerId);
    activePointerId = null;
    current = null;
    syncTools();
  }

  /** Acik bir darbe varsa zorla kapatir; bitis olayi hic gelmeyen dokunuslar icin. */
  function abortStroke() {
    if (activePointerId === null) return;
    endStroke({ pointerId: activePointerId });
  }

  // Baslatma tuvalde: cizim yalnizca tuvale dokununca baslar.
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);

  /**
   * Bitis olaylari tuvalde DEGIL, pencerede dinlenir. Tuvalde dinlenirse parmak 180 px'lik
   * kutunun disinda kaldirildiginda birakma olayi baska bir ogeye duser, activePointerId
   * sonsuza kadar takili kalir ve tuval olur: onPointerDown aktif pointer varken erken
   * doner, "Geri al" da bloke olur - "karalama dondu" sikayeti tam olarak budur.
   * Ucu de kabarciklanir, dolayisiyla yakalama kurulmus olsun olmasin pencereye ulasirlar.
   * endStroke pointerId eslesmesine baktigi icin sayfadaki alakasiz dokunuslar no-op.
   * lostpointercapture ayrica tarayicinin dokunusu devraldigi durumu yakalar.
   */
  window.addEventListener('pointerup', endStroke);
  window.addEventListener('pointercancel', endStroke);
  window.addEventListener('lostpointercapture', endStroke);

  /**
   * Ekran kilidi, bildirim, uygulama degistirme: dokunus akisi haber verilmeden kesilir.
   * Iki yonde de kapatilir - geri donuldugunde parmagin hala basili olmasi gercekci degil,
   * en kotu ihtimalle darbe bolunur; takili kalmasi ise tuvali oldururdu.
   */
  function onVisibilityChange() {
    abortStroke();
  }

  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('pagehide', abortStroke);

  // Tuvalin genisligi yalnizca viewport degisince degisir (.app sabit genislikli akiskan
  // bir kapsayici), o yuzden pencereyi dinlemek yeterli: ekran donmesi de buradan gelir.
  function onWindowResize() {
    if (isOpen) resize();
  }

  window.addEventListener('resize', onWindowResize);

  // ---------- araclar ----------

  function syncTools() {
    // Cizim surerken undo() zaten calismiyor; dugme de bunu gostersin, sessizce olu kalmasin.
    undoButton.disabled = Boolean(current) || strokes.length === 0;
    toolButton.setAttribute('aria-pressed', tool === 'erase' ? 'true' : 'false');
    fullButton.textContent = isFullscreen ? 'Küçült' : 'Büyüt';
    fullButton.setAttribute('aria-label', isFullscreen ? 'Karalamayı küçült' : 'Karalamayı büyüt');
  }

  function setTool(value) {
    tool = value === 'erase' ? 'erase' : 'pen';
    applyStyle(ctx, tool);
    syncTools();
  }

  /** Son hareketi (kalem ya da silgi) iptal eder. Cizim surerken calismaz. */
  function undo() {
    if (current || strokes.length === 0) return;
    strokes.pop();
    redraw();
    syncTools();
  }

  // ---------- tam ekran ----------

  /** Gecmis kaydina dokunmadan yalnizca gorunumu kapatir. */
  function closeFullscreenView() {
    if (!isFullscreen) return;
    isFullscreen = false;
    node.classList.remove('scratch--full');
    document.body.classList.remove('scratch-fullscreen-open');
    resize();
    syncTools();
  }

  function setFullscreen(value) {
    if (value) {
      if (isFullscreen) return;
      isFullscreen = true;
      node.classList.add('scratch--full');
      document.body.classList.add('scratch-fullscreen-open');
      // Donanim geri tusu once karalamayi kapatsin. Hash degismedigi icin hashchange
      // tetiklenmez, router'in dgsDepth muhasebesi bozulmaz: derinlik damgasi tasinir.
      history.pushState({ ...(history.state || {}), dgsScratch: true }, '');
      resize();
      syncTools();
      return;
    }

    if (!isFullscreen) return;
    closeFullscreenView();
    // Girerken eklenen kaydi tuket; popstate geldiginde kapanacak bir sey kalmaz.
    if (history.state && history.state.dgsScratch) history.back();
  }

  function onPopState() {
    if (!isFullscreen) return;
    if (history.state && history.state.dgsScratch) return;
    closeFullscreenView();
  }

  window.addEventListener('popstate', onPopState);

  // ---------- dis arayuz ----------

  /** Cizimi ve geri al gecmisini siler. Panelin acik/kapali ve tam ekran durumuna dokunmaz. */
  function reset() {
    strokes = [];
    current = null;
    releaseCapture(activePointerId);
    activePointerId = null;
    baseline = null;
    baselineWidth = 0;
    baselineHeight = 0;
    tool = 'pen';
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, cssWidth, cssHeight);
    applyStyle(ctx, tool);
    syncTools();
  }

  function setOpen(value) {
    isOpen = Boolean(value);
    panel.hidden = !isOpen;
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    // Kapaliyken tuvalin olculebilir genisligi yok; acilir acilmaz olcekle.
    if (isOpen) resize();
    else setFullscreen(false);
  }

  function destroy() {
    window.removeEventListener('resize', onWindowResize);
    window.removeEventListener('popstate', onPopState);
    window.removeEventListener('pointerup', endStroke);
    window.removeEventListener('pointercancel', endStroke);
    window.removeEventListener('lostpointercapture', endStroke);
    window.removeEventListener('pagehide', abortStroke);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    abortStroke();
    // Ekrandan cikilirken gezinme surer; gecmise dokunmak riskli, sadece gorunumu kapat.
    closeFullscreenView();
  }

  setOpen(open);
  syncTools();

  return {
    node,
    reset,
    setOpen,
    get isOpen() {
      return isOpen;
    },
    setFullscreen,
    get isFullscreen() {
      return isFullscreen;
    },
    destroy,
  };
}
