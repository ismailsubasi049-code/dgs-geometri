// Karalama alani. Soru ekraninda kalemle, parmakla ya da fareyle cizilebilen tuval.
//
// Akisi kesmemesi icin varsayilan kapalidir; kapaliyken sadece tek satirlik bir
// dugme gorunur. Cizgiler stroke listesinde tutulur: yeniden boyutlandirmada cizim
// kaybolmaz, "Geri al" son hareketi atar. Silgi de bir stroke oldugu icin geri alinabilir.
//
// Kalem (S Pen) icin: avuc korumasi, basinca duyarli kalinlik, yan tusla silgi.

import { el } from './ui.js';
import { openLayer } from './backstack.js';

/** Son kalem olayindan (hover dahil) bu sure icinde gelen parmak dokunuslari avuc sayilir. */
const PALM_TIMEOUT_MS = 1500;
/** S Pen yan tusu (buttons & 2) ya da silgi ucu (buttons & 32) basiliyken kalem siler. */
const PEN_BUTTON_ERASER = true;

const CANVAS_HEIGHT = 180;
/** Parmak ve farede sabit kalinlik (dokunmatik pressure hep 0.5 gelir, ona guvenilmez). */
const PEN_WIDTH = 2.5;
/** Kalemde kalinlik = MIN + basinc * (MAX - MIN); 0.5 basinc ~ PEN_WIDTH. */
const PEN_MIN_WIDTH = 1.2;
const PEN_MAX_WIDTH = 4.0;
/** Basincin ustel ortalamasinda yeni ornegin payi: kucuk = yumusak gecis. */
const PRESSURE_SMOOTHING = 0.35;
const PEN_COLOR = '#0f172a';
/** Telefonda isabet ettirilebilecek kadar genis, fazlasini silmeyecek kadar dar. */
const ERASER_WIDTH = 18;
/** Geri al gecmisinin siniri; tasan en eski hareketler baseline tuvaline duzlestirilir. */
const MAX_STROKES = 30;
/** Netlik ile bellek arasinda: S26 Ultra ~3.5 bildirir, tam ekranda 3 kat yeterince keskin. */
const MAX_DPR = 3;

/** Gecici teshis: URL'de ?pendebug=1 varsa kosede pointerType/pressure/buttons gosterilir. */
const PEN_DEBUG = new URLSearchParams(location.search).get('pendebug') === '1';

let nextId = 1;

// ---------- kalem izleme (modul geneli, tek dinleyici) ----------

/** Son kalem olayinin zamani; tum ornekler ayni kalemi paylasir. */
let lastPenTime = -Infinity;
let penTrackerInstalled = false;

function notePen(event) {
  if (event.pointerType === 'pen') lastPenTime = performance.now();
}

/**
 * Pencerede, yakalama asamasinda dinlenir: kalem tuvalin disinda havada dururken
 * (hover) bile zaman guncellenir ve tuvaldeki pointerdown'dan once islenir.
 */
function installPenTracker() {
  if (penTrackerInstalled) return;
  penTrackerInstalled = true;
  const options = { capture: true, passive: true };
  window.addEventListener('pointerdown', notePen, options);
  window.addEventListener('pointermove', notePen, options);
}

function penRecentlyActive() {
  return performance.now() - lastPenTime < PALM_TIMEOUT_MS;
}

// ---------- teshis kutusu (?pendebug=1) ----------

let debugBox = null;
let debugEvent = null;
let debugDecision = '-';
let debugWidth = '-';

function renderDebug() {
  if (!debugBox || !debugEvent) return;
  const e = debugEvent;
  debugBox.textContent =
    `${e.type}\n` +
    `type: ${e.pointerType}\n` +
    `pressure: ${Number(e.pressure).toFixed(3)}\n` +
    `buttons: ${e.buttons}\n` +
    `width: ${debugWidth}\n` +
    `karar: ${debugDecision}`;
}

function onDebugEvent(event) {
  debugEvent = event;
  renderDebug();
}

function installPenDebug() {
  if (!PEN_DEBUG || debugBox) return;
  debugBox = el('div', { class: 'pen-debug', 'aria-hidden': 'true' }, 'pendebug');
  document.body.append(debugBox);
  const options = { capture: true, passive: true };
  for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) {
    window.addEventListener(type, onDebugEvent, options);
  }
}

function debugNote(decision, width) {
  if (!PEN_DEBUG) return;
  debugDecision = decision;
  if (width !== undefined) debugWidth = typeof width === 'number' ? width.toFixed(2) : width;
  renderDebug();
}

/**
 * createScratchpad({ open }) -> { node, reset, setOpen, isOpen, setFullscreen, isFullscreen, destroy }
 * node, cagiran ekranin istedigi yere eklenir. Tek ornek uzun omurludur:
 * DOM'dan sokulup tekrar eklenmesi cizimi bozmaz.
 */
export function createScratchpad({ open = false } = {}) {
  installPenTracker();
  installPenDebug();

  const panelId = `scratch-panel-${nextId++}`;

  const canvas = el('canvas', {
    class: 'scratch-canvas',
    role: 'img',
    'aria-label': 'Karalama tuvali',
  });

  // Tahmin edilen noktalar ve darbenin henuz kalicilasmamis ucu burada cizilir; her
  // harekette silinir, kalici tuvale ve stroke listesine hic girmez.
  const ink = el('canvas', { class: 'scratch-ink', 'aria-hidden': 'true' });

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
    el('div', { class: 'scratch-surface' }, canvas, ink),
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
  const inkCtx = ink.getContext('2d');

  /**
   * [{ mode: 'pen'|'erase', points: [{x, y, w?}, ...] }, ...] - CSS pikseli, tuvalin sol
   * ust kosesine gore. w yalnizca kalem darbelerinde vardir; yoksa moda gore sabit kalinlik.
   */
  let strokes = [];
  let current = null;
  let activePointerId = null;
  /** Aktif pointer'in tipi: isPrimary her tip icin ayri hesaplandigi icin gerekli. */
  let activePointerType = null;
  /** Aktif kalem darbesinin yumusatilmis basinci; ilk ornekte kurulur. */
  let smoothedPressure = null;
  /** setPointerCapture gercekten kuruldu mu; bayat pointer tespitinde kullanilir. */
  let captureHeld = false;
  let tool = 'pen';

  let cssWidth = 0;
  let cssHeight = CANVAS_HEIGHT;
  let dpr = 1;
  let isOpen = false;
  let isFullscreen = false;
  /** Tam ekran acikken geri yigindaki kaydi (js/backstack.js). */
  let layer = null;

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

  function widthAt(stroke, point) {
    return point.w ?? widthOf(stroke.mode);
  }

  function midpoint(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
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

  function drawDot(target, stroke, point) {
    target.beginPath();
    target.arc(point.x, point.y, widthAt(stroke, point) / 2, 0, Math.PI * 2);
    target.fill();
  }

  /**
   * i. noktanin getirdigi parca: noktalar duz cizgiyle degil, orta noktalardan gecen
   * egrilerle birlesir (kontrol noktasi bir onceki nokta). Son orta noktadan son noktaya
   * kalan uc, drawTail ile darbe bitince cizilir. Her parca kendi kalinligini tasir.
   */
  function drawSegment(target, stroke, i) {
    const points = stroke.points;
    const from = points[i - 1];
    const end = midpoint(from, points[i]);
    target.lineWidth = widthAt(stroke, from);
    target.beginPath();
    if (i === 1) {
      target.moveTo(from.x, from.y);
      target.lineTo(end.x, end.y);
    } else {
      const start = midpoint(points[i - 2], from);
      target.moveTo(start.x, start.y);
      target.quadraticCurveTo(from.x, from.y, end.x, end.y);
    }
    target.stroke();
  }

  function drawTail(target, stroke) {
    const points = stroke.points;
    if (points.length < 2) return;
    const last = points[points.length - 1];
    const start = midpoint(points[points.length - 2], last);
    target.lineWidth = widthAt(stroke, last);
    target.beginPath();
    target.moveTo(start.x, start.y);
    target.lineTo(last.x, last.y);
    target.stroke();
  }

  function drawStroke(target, stroke) {
    applyStyle(target, stroke.mode);
    const points = stroke.points;
    if (points.length === 1) {
      drawDot(target, stroke, points[0]);
      return;
    }
    for (let i = 1; i < points.length; i++) drawSegment(target, stroke, i);
    drawTail(target, stroke);
  }

  function clearPreview() {
    inkCtx.clearRect(0, 0, cssWidth, cssHeight);
  }

  /**
   * Onizleme katmani: darbenin ucu + tarayicinin tahmin ettigi noktalar. Silgide yapilmaz,
   * cunku destination-out ayri bir katmanda gorunur bir sey uretmez.
   */
  function drawPreview(predicted) {
    clearPreview();
    if (!current || current.mode === 'erase') return;
    applyStyle(inkCtx, current.mode);
    drawTail(inkCtx, current);
    if (predicted.length === 0) return;
    const last = current.points[current.points.length - 1];
    inkCtx.lineWidth = widthAt(current, last);
    inkCtx.beginPath();
    inkCtx.moveTo(last.x, last.y);
    for (const point of predicted) inkCtx.lineTo(point.x, point.y);
    inkCtx.stroke();
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

    const nextDpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
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
    ink.width = pixelWidth;
    ink.height = pixelHeight;
    inkCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    redraw();
    if (current) drawPreview([]);
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

  function pointFrom(event, rect) {
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  /** Arac dugmesi silgideyse ya da kalemin yan tusu/silgi ucu basiliysa silinir. */
  function modeFor(event) {
    if (tool === 'erase') return 'erase';
    if (PEN_BUTTON_ERASER && event.pointerType === 'pen' && (event.buttons & (2 | 32))) return 'erase';
    return 'pen';
  }

  /**
   * Kalem darbesinde noktanin kalinligi; digerlerinde undefined (sabit kalinlik).
   * Basinc ustel ortalamayla yumusatilir; 0 gelen ornekler (bazi cihazlarda ilk temas)
   * yok sayilir, onceki deger korunur.
   */
  function sampleWidth(event, mode) {
    if (activePointerType !== 'pen' || mode !== 'pen') return undefined;
    const raw = Number(event.pressure);
    if (raw > 0) {
      smoothedPressure = smoothedPressure === null
        ? raw
        : smoothedPressure + (raw - smoothedPressure) * PRESSURE_SMOOTHING;
    }
    const pressure = smoothedPressure ?? 0.5;
    return Math.round((PEN_MIN_WIDTH + pressure * (PEN_MAX_WIDTH - PEN_MIN_WIDTH)) * 100) / 100;
  }

  function makePoint(event, rect, mode) {
    const point = pointFrom(event, rect);
    const width = sampleWidth(event, mode);
    if (width !== undefined) point.w = width;
    return point;
  }

  function beginStroke(mode, point) {
    current = { mode, points: [point] };
    pushStroke(current);
    applyStyle(ctx, mode);
    drawDot(ctx, current, point);
    debugNote(mode === 'erase' ? 'sil' : 'çiz', widthAt(current, point));
  }

  /**
   * Elimizdeki aktif pointer gercekten hala ekranda mi? Iki bagimsiz sinyal:
   *  - isPrimary: spesifikasyon geregi ortada baska aktif dokunus yokken gelen ilk parmak.
   *    Boyle bir olay geldiyse eskisi kesinlikle bitmis, bitis olayi bize ulasmamis demektir.
   *    isPrimary her pointer tipi icin ayri hesaplanir: kalem cizerken gelen ilk avuc
   *    dokunusu da isPrimary'dir, o yuzden yalnizca ayni tipteki pointer sayilir.
   *  - Yakalama kurulmusken hasPointerCapture'in false donmesi: pointer bittigi icin
   *    tarayici yakalamayi ortuk olarak birakmistir.
   * Ikinci sinyal captureHeld ile korunur: setPointerCapture hic kurulamadiysa
   * hasPointerCapture zaten false doner ve mesru ikinci parmak haksiz yere tahliye edilirdi.
   */
  function activePointerGone(event) {
    if (activePointerId === null) return false;
    if (event.isPrimary && event.pointerType === activePointerType) return true;
    return captureHeld && !canvas.hasPointerCapture(activePointerId);
  }

  /** Acik darbeyi gecmisten de siler: kalem inerken suren parmak darbesi avuctur. */
  function discardStroke() {
    const index = strokes.lastIndexOf(current);
    if (index !== -1) strokes.splice(index, 1);
    abortStroke();
    redraw();
  }

  function onPointerDown(event) {
    const type = event.pointerType;

    // Avuc korumasi: kalem az once kullanildiysa (havada durmasi dahil) parmak cizmez.
    if (type === 'touch' && penRecentlyActive()) {
      event.preventDefault();
      debugNote('avuç: yok sayıldı');
      return;
    }

    // Kalem indiginde suren bir parmak darbesi varsa o, kalemden once degen avuctur.
    if (type === 'pen' && current && activePointerType === 'touch') discardStroke();

    // Tek yonlu giris kapisi birakma: bayat pointer burada tahliye edilir, yoksa tuval
    // bir daha hicbir sey cizmez. Avuc ya da hala basili duran ikinci parmak bu kapidan
    // gecmez, yani tek parmak kurali bozulmaz.
    if (activePointerGone(event)) abortStroke();

    // Ayni anda tek pointer cizer; ikinci dokunus yok sayilir.
    if (activePointerId !== null) {
      debugNote('ikinci pointer: yok sayıldı');
      return;
    }
    // Farede yalnizca sol tus cizer.
    if (type === 'mouse' && event.button !== 0) return;
    event.preventDefault();

    activePointerId = event.pointerId;
    activePointerType = type;
    smoothedPressure = null;
    // Yakalama basarisiz olursa (pointer araya girip birakildiysa) cizim yine surer.
    try {
      canvas.setPointerCapture(event.pointerId);
      captureHeld = true;
    } catch (error) {
      /* yoksay */
    }

    const mode = modeFor(event);
    beginStroke(mode, makePoint(event, canvas.getBoundingClientRect(), mode));
    syncTools();
  }

  function onPointerMove(event) {
    if (event.pointerId !== activePointerId || !current) return;
    event.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const mode = modeFor(event);

    // Kalemin yan tusu darbe ortasinda basildi/birakildi: darbe burada kapanir, ayni
    // noktadan yeni modda yenisi baslar. Ikisi ayri ayri geri alinabilir.
    if (mode !== current.mode) {
      applyStyle(ctx, current.mode);
      drawTail(ctx, current);
      const last = current.points[current.points.length - 1];
      const start = { x: last.x, y: last.y };
      const width = sampleWidth(event, mode);
      if (width !== undefined) start.w = width;
      beginStroke(mode, start);
      syncTools();
    }

    // Hizli hareketlerde ara noktalar da alinir; cizgi kose kose olmaz.
    const coalesced = event.getCoalescedEvents ? event.getCoalescedEvents() : [];
    const points = current.points;
    applyStyle(ctx, current.mode);
    for (const item of coalesced.length > 0 ? coalesced : [event]) {
      const point = makePoint(item, rect, current.mode);
      const previous = points[points.length - 1];
      if (point.x === previous.x && point.y === previous.y) continue;
      points.push(point);
      drawSegment(ctx, current, points.length - 1);
    }

    const predicted = event.getPredictedEvents ? event.getPredictedEvents() : [];
    drawPreview(predicted.map((item) => pointFrom(item, rect)));
    debugNote(current.mode === 'erase' ? 'sil' : 'çiz', widthAt(current, points[points.length - 1]));
  }

  /**
   * Darbeyi kapatir. Yalnizca aktif pointer'in bitis olayina cevap verir; baska bir
   * parmagin olayi buraya dusse de bir sey yapmaz. Yakalama da birakilir, yoksa tuval
   * DOM'dan sokulup geri eklendiginde bayat bir yakalama kalabilir.
   */
  function endStroke(event) {
    if (event.pointerId !== activePointerId) return;
    if (current) {
      // Son orta noktadan parmagin kalktigi noktaya kalan uc artik kalici.
      applyStyle(ctx, current.mode);
      drawTail(ctx, current);
    }
    clearPreview();
    releaseCapture(activePointerId);
    activePointerId = null;
    activePointerType = null;
    smoothedPressure = null;
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
  // S Pen yan tusu / farenin sag tusu tuvalde baglam menusu acmasin.
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

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
      // Tam ekran bir katmandir: geri hareketi (donanim tusu dahil) once onu kapatir,
      // ekranin korumasina (deneme cikis onayi) ulasmaz. Bkz. js/backstack.js.
      layer = openLayer(() => {
        layer = null;
        closeFullscreenView();
      });
      resize();
      syncTools();
      return;
    }

    if (!isFullscreen) return;
    closeFullscreenView();
    // Girerken eklenen kaydi tuketir; varilan kayit korumayi tetiklemez.
    if (layer) layer.close();
  }

  // ---------- dis arayuz ----------

  /** Cizimi ve geri al gecmisini siler. Panelin acik/kapali ve tam ekran durumuna dokunmaz. */
  function reset() {
    strokes = [];
    current = null;
    releaseCapture(activePointerId);
    activePointerId = null;
    activePointerType = null;
    smoothedPressure = null;
    baseline = null;
    baselineWidth = 0;
    baselineHeight = 0;
    tool = 'pen';
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, cssWidth, cssHeight);
    clearPreview();
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
    window.removeEventListener('pointerup', endStroke);
    window.removeEventListener('pointercancel', endStroke);
    window.removeEventListener('lostpointercapture', endStroke);
    window.removeEventListener('pagehide', abortStroke);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    abortStroke();
    // Ekrandan cikilirken gezinme surer; gecmise dokunmak riskli, sadece gorunumu kapat.
    if (layer) layer.forget();
    layer = null;
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
