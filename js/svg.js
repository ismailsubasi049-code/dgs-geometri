// Soru paketlerindeki SVG sekillerini beyaz listeden gecirerek DOM'a cevirir.
//
// Sekiller JSON icinde ham SVG metni olarak duruyor - geometri cizimleri icin tek esnek yol.
// innerHTML ile dogrudan basmak yerine ayristirip yeniden kuruyoruz; boylece disaridan
// kopyalanan bir pakette script, olay niteligi ya da dis kaynak bulunsa bile calismaz.

const SVG_NS = 'http://www.w3.org/2000/svg';

const ALLOWED_TAGS = new Set([
  'svg', 'g', 'defs', 'marker', 'title', 'desc',
  'line', 'polyline', 'polygon', 'path', 'circle', 'ellipse', 'rect',
  'text', 'tspan',
]);

const ALLOWED_ATTRS = new Set([
  // yerlesim
  'viewbox', 'preserveaspectratio', 'width', 'height', 'transform',
  'x', 'y', 'dx', 'dy', 'x1', 'y1', 'x2', 'y2',
  'cx', 'cy', 'r', 'rx', 'ry', 'd', 'points',
  // gorunum
  'fill', 'fill-opacity', 'fill-rule',
  'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-dashoffset',
  'stroke-linecap', 'stroke-linejoin', 'stroke-opacity', 'stroke-miterlimit',
  'opacity', 'vector-effect', 'shape-rendering',
  // yazi
  'font-size', 'font-family', 'font-weight', 'font-style',
  'text-anchor', 'dominant-baseline', 'letter-spacing',
  // isaretciler (ok uclari) - hepsi ayni belge icinde
  'marker-start', 'marker-mid', 'marker-end',
  'markerwidth', 'markerheight', 'refx', 'refy', 'orient', 'markerunits',
  // tanimlayicilar
  'id', 'class',
]);

/** url(#id) disindaki referanslari (ozellikle url(http...)) reddeder. */
const SAFE_URL_REF = /^url\(\s*['"]?#[\w:.-]+['"]?\s*\)$/i;
const MARKER_ATTRS = new Set(['marker-start', 'marker-mid', 'marker-end']);

function sanitizeElement(source) {
  const tag = source.localName.toLowerCase();
  if (!ALLOWED_TAGS.has(tag)) return null;

  const out = document.createElementNS(SVG_NS, tag);

  for (const attr of source.attributes) {
    const name = attr.name.toLowerCase();
    if (!ALLOWED_ATTRS.has(name)) continue;

    const value = attr.value;

    // fill/stroke url(...) ile isaretci gosterebilir; sadece ayni belge referansi kabul.
    if (value.trim().toLowerCase().startsWith('url(') && !SAFE_URL_REF.test(value.trim())) continue;
    if (MARKER_ATTRS.has(name) && !SAFE_URL_REF.test(value.trim())) continue;

    out.setAttribute(attr.name, value);
  }

  for (const child of source.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      out.append(child.nodeValue);
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const clean = sanitizeElement(child);
      if (clean) out.append(clean);
    }
  }

  return out;
}

/**
 * SVG metnini guvenli bir <svg> dugumune cevirir.
 * Metin bos, bozuk ya da <svg> ile baslamiyorsa null doner (soru sekilsiz gosterilir).
 */
export function parseFigure(svgText, label = 'Soru şekli') {
  if (!svgText || typeof svgText !== 'string') return null;

  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
  if (doc.getElementsByTagName('parsererror').length > 0) {
    console.warn('Şekil ayrıştırılamadı, atlanıyor.');
    return null;
  }

  const root = doc.documentElement;
  if (!root || root.localName.toLowerCase() !== 'svg') return null;

  const clean = sanitizeElement(root);
  if (!clean) return null;

  // viewBox varken sabit width/height olcegi bozuyor; CSS'e birak.
  if (clean.hasAttribute('viewBox')) {
    clean.removeAttribute('width');
    clean.removeAttribute('height');
  }

  clean.setAttribute('role', 'img');
  clean.setAttribute('focusable', 'false');
  if (label) clean.setAttribute('aria-label', label);

  return clean;
}
