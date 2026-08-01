// Oturum sonucu: skor, ipucu kullanimi ve soru soru gozden gecirme.

import { el, emptyState, fmtTime, CHOICE_LETTERS } from '../ui.js';
import { parseFigure } from '../svg.js';
import { getLastSession } from '../quiz.js';

function verdictOf(record) {
  if (!record) return 'skip';
  if (record.skipped) return 'skip';
  return record.correct ? 'ok' : 'bad';
}

function reviewItem(question, record, index) {
  const kind = verdictOf(record);
  const label = { ok: '✓ Doğru', bad: '✗ Yanlış', skip: '— Boş' }[kind];

  const summary = el('summary', { class: 'review-summary' },
    el('span', { class: 'grow' }, `${index + 1}. ${question.subtopic || question.topic || 'Soru'}`),
    el('span', { class: `verdict ${kind === 'skip' ? '' : kind}` }, label)
  );

  const detailStack = el('div', { class: 'stack', style: 'margin-top:10px' });

  const figure = parseFigure(question.figure, question.subtopic || 'Soru şekli');
  if (figure) detailStack.append(el('div', { class: 'figure' }, figure));

  detailStack.append(el('div', null, question.stem));

  detailStack.append(
    el('div', { class: 'asks-box' },
      el('div', { class: 'label' }, 'Soru ne istiyor?'),
      el('div', null, question.asks)
    )
  );

  const answerLine = record && record.picked !== null && record.picked !== undefined
    ? `Senin cevabın: ${CHOICE_LETTERS[record.picked]}) ${question.choices[record.picked]}`
    : 'Bu soruyu boş bıraktın.';

  detailStack.append(
    el('div', { class: 'small' },
      el('div', { class: kind === 'bad' ? 'verdict bad' : 'muted' }, answerLine),
      el('div', { class: 'verdict ok' },
        `Doğru cevap: ${CHOICE_LETTERS[question.answer]}) ${question.choices[question.answer]}`)
    )
  );

  detailStack.append(
    el('div', { class: 'solution' },
      el('div', { class: 'label' }, 'Çözüm'),
      el('div', { class: 'solution-body' }, question.solution || '—')
    )
  );

  return el('details', { class: `review-item ${kind}`, open: kind !== 'ok' },
    summary, detailStack);
}

export async function render(ctx) {
  const session = getLastSession();

  if (!session || !session.finished) {
    ctx.setTitle('Sonuç');
    return el('div', { class: 'stack' },
      emptyState('🤔', 'Gösterilecek sonuç yok', 'Bir oturum tamamlandığında sonucu burada görürsün.'),
      el('button', { class: 'btn primary', on: { click: () => ctx.navigate('#/') } }, 'Ana ekrana dön')
    );
  }

  ctx.setTitle(`${session.title} · sonuç`);

  const score = session.score();
  const spentSeconds = Math.round(((session.endedAt || Date.now()) - session.startedAt) / 1000);
  const percent = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

  const root = el('div', { class: 'stack' });

  if (session.timedOut) {
    root.append(el('div', { class: 'error' }, 'Süre doldu — kalan sorular boş sayıldı.'));
  }

  root.append(
    el('div', { class: 'card score' },
      el('div', { class: 'num' }, `${score.correct}`),
      el('div', { class: 'of' }, `/ ${score.total} doğru  ·  %${percent}`),
      el('div', { class: 'progressbar', style: 'margin-top:14px' },
        el('i', { style: `width:${percent}%` }))
    )
  );

  root.append(
    el('div', { class: 'stat-grid' },
      el('div', { class: 'stat' },
        el('div', { class: 'k' }, 'Yanlış'),
        el('div', { class: 'v' }, String(score.wrong))),
      el('div', { class: 'stat' },
        el('div', { class: 'k' }, 'Boş'),
        el('div', { class: 'v' }, String(score.skipped))),
      el('div', { class: 'stat' },
        el('div', { class: 'k' }, 'Süre'),
        el('div', { class: 'v' }, fmtTime(spentSeconds))),
      el('div', { class: 'stat' },
        el('div', { class: 'k' }, 'İpucu açtığın'),
        el('div', { class: 'v' }, `${score.hintOpens}/${score.total}`))
    )
  );

  if (score.hintOpens === score.total && score.total > 0) {
    root.append(el('div', { class: 'card small muted' },
      'Her soruda "Soru ne istiyor?" satırını açtın. Ayarlar\'dan şıkları hemen açık hale getirip ipucunu isteğe bağlı yapabilirsin.'));
  }

  root.append(el('h2', { style: 'font-size:1rem;margin-top:6px' }, 'Soruların üstünden geç'));

  const list = el('div', { class: 'list' });
  session.questions.forEach((question, index) => {
    list.append(reviewItem(question, session.answers[index], index));
  });
  root.append(list);

  const actions = el('div', { class: 'stack', style: 'margin-top:8px' });

  if (score.wrong > 0 || score.skipped > 0) {
    actions.append(
      el('button', {
        class: 'btn primary',
        on: { click: () => ctx.navigate('#/oturum/yanlis') },
      }, 'Yanlışlarımı şimdi tekrar et')
    );
  }

  actions.append(
    el('button', { class: 'btn', on: { click: () => ctx.navigate('#/') } }, 'Ana ekrana dön')
  );

  root.append(actions);
  return root;
}
