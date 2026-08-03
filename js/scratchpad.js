// Karalama alani. Soru ekraninda parmakla cizilebilen kucuk bir tuval.
//
// Akisi kesmemesi icin varsayilan kapalidir; kapaliyken sadece tek satirlik bir
// dugme gorunur. Cizgiler strokes dizisinde tutulur, boylece ekran dondugunde
// (yeniden boyutlandirmada) cizim kaybolmaz.

import { el } from './ui.js';

const CANVAS_HEIGHT = 180;
const PEN_WIDTH = 2.5;
const PEN_COLOR = '#0f172a';

let nextId = 1;

/**
 * createScratchpad({ open }) -> { node, reset, setOpen, isOpen, destroy }
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

  const clearButton = el('button', {
    class: 'scratch-clear',
    type: 'button',
    on: { click: () => reset() },
  }, 'Temizle');

  const panel = el('div', { class: 'scratch-panel', id: panelId },
    canvas,
    el('div', { class: 'scratch-tools' }, clearButton)
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

  /** [[{x,y}, ...], ...] - CSS pikseli cinsinden, tuvalin sol ust kosesine gore. */
  let strokes = [];
  let current = null;
  let activePointerId = null;

  let cssWidth = 0;
  let cssHeight = CANVAS_HEIGHT;
  let isOpen = false;

  // ---------- cizim ----------

  function applyPenStyle() {
    ctx.lineWidth = PEN_WIDTH;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = PEN_COLOR;
    ctx.fillStyle = PEN_COLOR;
  }

  function drawDot(point) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, PEN_WIDTH / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawSegment(from, to) {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }

  /** Tumunu bastan cizer; sadece yeniden boyutlandirmada gerekir. */
  function redraw() {
    ctx.clearRect(0, 0, cssWidth, cssHeight);
    for (const stroke of strokes) {
      if (stroke.length === 1) {
        drawDot(stroke[0]);
        continue;
      }
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) ctx.lineTo(stroke[i].x, stroke[i].y);
      ctx.stroke();
    }
  }

  /**
   * Tuvali kendi CSS boyutuna ve ekran yogunluguna gore olceklendirir.
   * Panel kapaliyken genislik 0 olacagi icin bir sey yapmaz.
   */
  function resize() {
    const width = Math.round(canvas.getBoundingClientRect().width);
    if (width <= 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pixelWidth = Math.round(width * dpr);
    const pixelHeight = Math.round(CANVAS_HEIGHT * dpr);
    if (canvas.width === pixelWidth && canvas.height === pixelHeight) return;

    cssWidth = width;
    cssHeight = CANVAS_HEIGHT;
    // width/height yazmak baglami sifirlar: donusum ve kalem ayari sonra gelmeli.
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    applyPenStyle();
    redraw();
  }

  // ---------- girdi ----------

  function pointFrom(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function onPointerDown(event) {
    // Ayni anda tek parmak cizer; ikinci dokunus yok sayilir.
    if (activePointerId !== null) return;
    event.preventDefault();

    activePointerId = event.pointerId;
    // Yakalama basarisiz olursa (pointer araya girip birakildiysa) cizim yine surer.
    try {
      canvas.setPointerCapture(event.pointerId);
    } catch (error) {
      /* yoksay */
    }

    const point = pointFrom(event);
    current = [point];
    strokes.push(current);
    drawDot(point);
  }

  function onPointerMove(event) {
    if (event.pointerId !== activePointerId || !current) return;
    event.preventDefault();

    // Hizli hareketlerde ara noktalar da alinir; cizgi kose kose olmaz.
    const events = event.getCoalescedEvents ? event.getCoalescedEvents() : [event];
    for (const item of events.length > 0 ? events : [event]) {
      const point = pointFrom(item);
      const previous = current[current.length - 1];
      if (point.x === previous.x && point.y === previous.y) continue;
      current.push(point);
      drawSegment(previous, point);
    }
  }

  function endStroke(event) {
    if (event.pointerId !== activePointerId) return;
    activePointerId = null;
    current = null;
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', endStroke);
  canvas.addEventListener('pointercancel', endStroke);
  canvas.addEventListener('lostpointercapture', endStroke);

  // Tuvalin genisligi yalnizca viewport degisince degisir (.app sabit genislikli akiskan
  // bir kapsayici), o yuzden pencereyi dinlemek yeterli: ekran donmesi de buradan gelir.
  function onWindowResize() {
    if (isOpen) resize();
  }

  window.addEventListener('resize', onWindowResize);

  // ---------- dis arayuz ----------

  /** Cizimi siler. Panelin acik/kapali durumuna dokunmaz. */
  function reset() {
    strokes = [];
    current = null;
    activePointerId = null;
    ctx.clearRect(0, 0, cssWidth, cssHeight);
  }

  function setOpen(value) {
    isOpen = Boolean(value);
    panel.hidden = !isOpen;
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    // Kapaliyken tuvalin olculebilir genisligi yok; acilir acilmaz olcekle.
    if (isOpen) resize();
  }

  function destroy() {
    window.removeEventListener('resize', onWindowResize);
  }

  setOpen(open);

  return {
    node,
    reset,
    setOpen,
    get isOpen() {
      return isOpen;
    },
    destroy,
  };
}
