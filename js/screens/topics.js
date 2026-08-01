// Konu secimi. Liste data/index.json'dan turer; yeni paket eklenince kendiliginden buyur.

import { el, emptyState } from '../ui.js';
import { listTopics, loadAllQuestions } from '../packs.js';
import { getStat } from '../store.js';

export async function render(ctx) {
  ctx.setTitle('Konu seç');

  const [topics, all] = await Promise.all([listTopics(), loadAllQuestions()]);

  if (topics.length === 0) {
    return el('div', { class: 'stack' },
      emptyState('📭', 'Konu bulunamadı', 'Yüklü bir soru paketi yok.'),
      el('button', { class: 'btn primary', on: { click: () => ctx.navigate('#/') } }, 'Ana ekrana dön')
    );
  }

  // Konu basina gercek soru sayisi ve ilerleme (index.json'daki count yerine yuklenen veri).
  const stats = new Map();
  for (const question of all) {
    if (!stats.has(question.topic)) stats.set(question.topic, { total: 0, seen: 0, mastered: 0 });
    const entry = stats.get(question.topic);
    const stat = getStat(question.id);
    entry.total += 1;
    if (stat.seen > 0) entry.seen += 1;
    if (stat.box >= 5) entry.mastered += 1;
  }

  const list = el('div', { class: 'list' });

  for (const { topic } of topics) {
    const entry = stats.get(topic) || { total: 0, seen: 0, mastered: 0 };
    const percent = entry.total > 0 ? Math.round((entry.mastered / entry.total) * 100) : 0;

    list.append(
      el('button', {
        class: 'row-item',
        type: 'button',
        disabled: entry.total === 0,
        on: { click: () => ctx.navigate(`#/oturum/konu/${encodeURIComponent(topic)}`) },
      },
        el('span', { class: 'grow' },
          el('div', { style: 'font-weight:600' }, topic),
          el('div', { class: 'small muted' },
            `${entry.total} soru · ${entry.seen} denendi · ${entry.mastered} pekişti`),
          el('div', { class: 'meter' }, el('i', { class: 'ok', style: `width:${percent}%` }))
        ),
        el('span', { class: 'muted' }, '›')
      )
    );
  }

  return el('div', { class: 'stack' },
    el('div', { class: 'small muted' }, 'Seçtiğin konudaki sorular karışık sırayla, süresiz gelir.'),
    list
  );
}
