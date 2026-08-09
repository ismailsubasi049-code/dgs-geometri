// Kucuk DOM ve bicimlendirme yardimcilari. Cerceve yok, hepsi bu kadar.

import { parseFigure } from './svg.js';

/**
 * el('div', { class: 'card' }, 'metin', digerEl)
 * Nitelikler: class, id, type, disabled, hidden, dataset:{...}, on:{click:fn}, html (guvenli
 * kaynaklar icin), geri kalan her sey setAttribute ile yazilir.
 */
export function el(tag, props = null, ...children) {
  const node = document.createElement(tag);

  if (props) {
    for (const [key, value] of Object.entries(props)) {
      if (value === null || value === undefined || value === false) continue;

      if (key === 'class') node.className = value;
      else if (key === 'dataset') Object.assign(node.dataset, value);
      else if (key === 'on') {
        for (const [evt, fn] of Object.entries(value)) node.addEventListener(evt, fn);
      } else if (key === 'html') node.innerHTML = value;
      else if (key === 'text') node.textContent = value;
      else if (value === true) node.setAttribute(key, '');
      else node.setAttribute(key, value);
    }
  }

  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }

  return node;
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

/** Saniyeyi 12:05 bicimine cevirir. */
export function fmtTime(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${mm}:${String(ss).padStart(2, '0')}`;
}

/** Yerel saate gore YYYY-MM-DD. (toISOString UTC'ye kaydigi icin kullanilmiyor.) */
export function dayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** dayKey'e gun ekler, yine dayKey dondurur. */
export function addDays(key, days) {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return dayKey(date);
}

/** İki gun anahtari arasindaki fark (b - a), gun cinsinden. */
export function daysBetween(a, b) {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  const da = new Date(ay, am - 1, ad);
  const db = new Date(by, bm - 1, bd);
  return Math.round((db - da) / 86400000);
}

const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

/** dayKey'i okunur hale getirir: bugun / yarin / "12 Ağustos". */
export function fmtDay(key) {
  if (!key) return null;
  const diff = daysBetween(dayKey(), key);
  if (diff <= 0) return 'bugün';
  if (diff === 1) return 'yarın';
  const [, month, day] = key.split('-').map(Number);
  return `${day} ${MONTHS[month - 1]}`;
}

/** Tohumlanabilir rastgele sayi uretici (mulberry32) - ayni gun ayni sirayi verir. */
export function seededRandom(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Metinden kararli bir sayi tohumu uretir. */
export function hashSeed(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Fisher-Yates; rand verilmezse Math.random. Diziyi kopyalayarak dondurur. */
export function shuffle(items, rand = Math.random) {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export const CHOICE_LETTERS = ['A', 'B', 'C', 'D', 'E'];

/**
 * Bir formul girdisinin sekli. figure alani yoksa (ya da SVG bozuksa) null doner.
 * collapse ise sekil "Sekil" dugmesi altina katlanir - oturum ve sonuc ekraninda
 * kart cok uzamasin diye.
 */
function itemFigure(item, collapse) {
  const svg = parseFigure(item.figure, item.formula);
  if (!svg) return null;

  const box = el('div', { class: 'figure formula-figure' }, svg);
  if (!collapse) return box;

  return el('details', { class: 'figure-details' }, el('summary', null, 'Şekil'), box);
}

/**
 * Kartin cozumlu ornekleri. Her ornek kapali gelir: once soru okunur, sonra cozum acilir.
 * Ornegi olmayan kart icin null doner.
 */
function cardExamples(card, collapseFigures) {
  const examples = Array.isArray(card.examples) ? card.examples.filter((e) => e && e.stem) : [];
  if (examples.length === 0) return null;

  return el('div', { class: 'formula-examples' },
    el('div', { class: 'examples-title' }, 'Örnekler'),
    examples.map((example) =>
      el('details', { class: 'example-item' },
        el('summary', null, example.stem),
        itemFigure({ figure: example.figure, formula: example.stem }, collapseFigures),
        el('div', { class: 'example-solution' }, example.solution || '')
      )
    )
  );
}

/**
 * Formul karti. data/formuller/ altindaki bir kart nesnesini DOM'a cevirir.
 * Yanlis cevap sonrasi, sonuc ekraninda ve Formuller ekraninda ayni bicim kullanilir.
 * label verilirse kartin ustune kucuk bir baslik satiri eklenir.
 * showTitle, basligi disarida gosteren yerlerde (acilir kart basligi) kapatilir.
 * collapseFigures, sekilleri acilir dugme altina alir.
 * showExamples varsayilan olarak kapalidir: yanlis cevap sonrasi cikan kart uzamasin diye
 * ornekleri yalnizca Formuller ekrani ister.
 */
export function formulaCard(
  card,
  { label = null, showTitle = true, collapseFigures = false, showExamples = false } = {}
) {
  if (!card) return null;

  return el('div', { class: 'formula-card' },
    label ? el('div', { class: 'label' }, label) : null,
    showTitle ? el('div', { class: 'formula-title' }, card.title) : null,
    card.items.map((item) =>
      el('div', { class: 'formula-item' },
        itemFigure(item, collapseFigures),
        el('div', { class: 'formula' }, item.formula),
        item.note ? el('div', { class: 'note' }, item.note) : null
      )
    ),
    Array.isArray(card.tips) && card.tips.length > 0
      ? el('ul', { class: 'tips' }, card.tips.map((tip) => el('li', null, tip)))
      : null,
    showExamples ? cardExamples(card, collapseFigures) : null
  );
}

/** Bos durum kutusu. */
export function emptyState(emoji, title, detail) {
  return el('div', { class: 'empty' },
    el('span', { class: 'emoji' }, emoji),
    el('div', { style: 'font-weight:600' }, title),
    detail ? el('div', { class: 'small' }, detail) : null
  );
}
