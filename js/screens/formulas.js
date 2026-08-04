// Formuller bolumu - iki duzeyli. Liste data/formuller/index.json'dan turer;
// yeni bir konu seti eklenince kendiliginden buyur.

import { el, emptyState, formulaCard } from '../ui.js';
import { listFormulaSets, loadSetByTopicId } from '../formulas.js';

/** Ust duzey: konu listesi. */
function renderSetList(ctx, sets) {
  const list = el('div', { class: 'list' });

  for (const set of sets) {
    list.append(
      el('button', {
        class: 'row-item',
        type: 'button',
        on: { click: () => ctx.navigate(`#/formuller/${encodeURIComponent(set.topicId)}`) },
      },
        el('span', null, '📐'),
        el('span', { class: 'grow' },
          el('div', { style: 'font-weight:600' }, set.title),
          el('div', { class: 'small muted' }, `${set.cardCount || 0} formül kartı`)
        ),
        el('span', { class: 'muted' }, '›')
      )
    );
  }

  return el('div', { class: 'stack' },
    el('div', { class: 'small muted' },
      'Her kart bir alt konunun formüllerini ve sık yapılan hataları toplar. Aynı kart, o konuda yanlış yaptığında çözümün altında da çıkar.'),
    list
  );
}

/** Alt duzey: bir konunun kartlari. Ilki acik, digerleri kapali gelir. */
function renderCards(ctx, set) {
  const list = el('div', { class: 'list' });

  set.cards.forEach((card, index) => {
    list.append(
      el('details', { class: 'formula-details', open: index === 0 },
        el('summary', { class: 'review-summary' },
          el('span', { class: 'grow' }, card.title),
          el('span', { class: 'muted small' }, `${card.items.length} formül`)
        ),
        formulaCard(card, { showTitle: false })
      )
    );
  });

  return el('div', { class: 'stack' },
    el('div', { class: 'small muted' }, `${set.cards.length} kart`),
    list
  );
}

export async function render(ctx) {
  const requestedId = ctx.params[0];

  if (requestedId) {
    const set = await loadSetByTopicId(requestedId);
    if (set && set.cards.length > 0) {
      ctx.setTitle(set.title);
      return renderCards(ctx, set);
    }
  }

  ctx.setTitle('Formüller');
  const sets = await listFormulaSets();

  if (sets.length === 0) {
    return el('div', { class: 'stack' },
      emptyState('📭', 'Formül kartı bulunamadı', 'data/formuller/index.json boş görünüyor.'),
      el('button', { class: 'btn primary', on: { click: () => ctx.goHome() } }, 'Ana ekrana dön')
    );
  }

  return renderSetList(ctx, sets);
}
