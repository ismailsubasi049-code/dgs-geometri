// Formuller bolumu - uc duzeyli: ders -> konu -> kartlar. Liste
// data/formuller/index.json'dan turer; yeni bir konu seti eklenince kendiliginden buyur.
//
// Rota: #/formuller/{branchId}/{topicId}. Ders parcasi olmayan eski baglantilar
// (#/formuller/{topicId}) da calismaya devam eder.

import { el, emptyState, formulaCard } from '../ui.js';
import { listFormulaBranches, listFormulaSets, loadSetByTopicId } from '../formulas.js';

/** En ust duzey: ders listesi. Yalnizca derin baglantiyla #/formuller'e gelinirse gorunur. */
function renderBranchList(ctx, branches, sets) {
  const list = el('div', { class: 'list' });

  for (const branch of branches) {
    const own = sets.filter((set) => set.branchId === branch.id);
    const cardCount = own.reduce((sum, set) => sum + (set.cardCount || 0), 0);

    list.append(
      el('button', {
        class: 'row-item',
        type: 'button',
        disabled: own.length === 0,
        on: { click: () => ctx.navigate(`#/formuller/${encodeURIComponent(branch.id)}`) },
      },
        el('span', null, branch.emoji || '📘'),
        el('span', { class: 'grow' },
          el('div', { style: 'font-weight:600' }, branch.title),
          el('div', { class: 'small muted' }, own.length > 0
            ? `${own.length} konu · ${cardCount} formül kartı`
            : 'Formül kartı yok')
        ),
        el('span', { class: 'muted' }, '›')
      )
    );
  }

  return el('div', { class: 'stack' },
    el('div', { class: 'small muted' }, 'Hangi dersin formüllerine bakacaksın?'),
    list
  );
}

/** Orta duzey: bir dersin konu listesi. */
function renderSetList(ctx, branchId, sets) {
  const list = el('div', { class: 'list' });

  for (const set of sets) {
    list.append(
      el('button', {
        class: 'row-item',
        type: 'button',
        on: {
          click: () => ctx.navigate(
            `#/formuller/${encodeURIComponent(branchId)}/${encodeURIComponent(set.topicId)}`),
        },
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
      'Her kart bir alt konunun formüllerini, sık yapılan hataları ve çözümlü örnekleri toplar. Aynı kart, o konuda yanlış yaptığında çözümün altında da çıkar.'),
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
        formulaCard(card, { showTitle: false, showExamples: true })
      )
    );
  });

  return el('div', { class: 'stack' },
    el('div', { class: 'small muted' }, `${set.cards.length} kart`),
    list
  );
}

export async function render(ctx) {
  const [branches, sets] = await Promise.all([listFormulaBranches(), listFormulaSets()]);

  const [first, second] = ctx.params;
  const branch = first ? branches.find((b) => b.id === first) : null;

  // Ders parcasi olmayan eski baglanti: ilk parca dogrudan konu kimligi olabilir.
  const topicId = second || (branch ? null : first);

  if (topicId) {
    const set = await loadSetByTopicId(topicId);
    if (set && set.cards.length > 0) {
      ctx.setTitle(set.title);
      return renderCards(ctx, set);
    }
  }

  if (branch) {
    ctx.setTitle(branch.title);
    const own = sets.filter((set) => set.branchId === branch.id);
    if (own.length > 0) return renderSetList(ctx, branch.id, own);
  }

  ctx.setTitle('Formüller');

  if (sets.length === 0) {
    return el('div', { class: 'stack' },
      emptyState('📭', 'Formül kartı bulunamadı', 'data/formuller/index.json boş görünüyor.'),
      el('button', { class: 'btn primary', on: { click: () => ctx.goHome() } }, 'Ana ekrana dön')
    );
  }

  return renderBranchList(ctx, branches, sets);
}
