// Oturum sonucu: skor, ipucu kullanimi ve soru soru gozden gecirme.

import { el, richText, emptyState, fmtTime, formulaCard, sharedStem, CHOICE_LETTERS }
  from '../ui.js';
import { parseFigure } from '../svg.js';
import { getLastSession } from '../quiz.js';
import { getCardFor } from '../formulas.js';
import { wrongHashFor } from './session.js';

function verdictOf(record) {
  if (!record) return 'skip';
  if (record.skipped) return 'skip';
  return record.correct ? 'ok' : 'bad';
}

/**
 * Ortak kokun ACIK gelecegi sorularin indeksleri: her blogun listedeki ilk yanlis
 * ya da bos sorusu. Ayni bloktan birden fazla soru yanlissa kok bir kez acilir ve
 * acildigi yer dogru bilinen soru degil, donup bakilacak soru olur. Blogun hic
 * yanlisi yoksa kok hicbirinde acilmaz; liste kisa kalir, isteyen basligindan acar.
 */
function openRootIndexes(questions, answers) {
  const opened = new Set(); // kokun zaten acildigi blok kimlikleri
  const at = new Set();     // soru indeksi

  for (let i = 0; i < questions.length; i++) {
    const block = questions[i].block;
    if (!block || opened.has(block.id)) continue;
    if (verdictOf(answers[i]) === 'ok') continue;
    opened.add(block.id);
    at.add(i);
  }
  return at;
}

function reviewItem(question, record, index, openRoot) {
  const kind = verdictOf(record);
  const label = { ok: '✓ Doğru', bad: '✗ Yanlış', skip: '— Boş' }[kind];

  const summary = el('summary', { class: 'review-summary' },
    el('span', { class: 'grow' }, `${index + 1}. ${question.subtopic || question.topic || 'Soru'}`),
    el('span', { class: `verdict ${kind === 'skip' ? '' : kind}` }, label)
  );

  const detailStack = el('div', { class: 'stack', style: 'margin-top:10px' });

  // Ortak kok soru metninin ustunde; blok sorularinda kok sorunun yarisidir.
  if (question.block) detailStack.append(sharedStem(question.block, { open: openRoot }));

  const figure = parseFigure(question.figure, question.subtopic || 'Soru şekli');
  if (figure) detailStack.append(el('div', { class: 'figure' }, figure));

  detailStack.append(el('div', { html: richText(question.stem) }));

  detailStack.append(
    el('div', { class: 'asks-box' },
      el('div', { class: 'label' }, 'Soru ne istiyor?'),
      el('div', { html: richText(question.asks) })
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
      el('div', { class: 'solution-body', html: richText(question.solution || '—') })
    )
  );

  // Sureli testte cozumler yalnizca burada gorunur; yanlislarda formul kartini da ver.
  if (kind === 'bad') {
    const card = formulaCard(getCardFor(question), {
      label: 'Bu konunun formülleri',
      collapseFigures: true,
    });
    if (card) detailStack.append(card);
  }

  return el('details', { class: `review-item ${kind}`, open: kind !== 'ok' },
    summary, detailStack);
}

/**
 * Sure olcumu ozeti. Hesap js/quiz.js -> timingSummary(); burasi yalnizca basar.
 * Baski unsuru yok: hedef cizgisi, renk, uyari, kiyas yok - sade sayi.
 */
function timingCard(summary) {
  if (!summary || summary.totalMs === 0) return null;

  const seconds = (ms) => fmtTime(ms / 1000);
  const ROW = 'display:flex;justify-content:space-between;gap:10px';

  // Saplanma satirlari: hangi sorularda takilindigi tek bakista gorunsun. Asan yoksa
  // ikinci satir hic kurulmaz - "0:00 · %0" bilgi tasimaz, sadece gurultu olur.
  const triageMinutes = Math.round((summary.triageMs || 120000) / 60000);
  const overLabel = `${triageMinutes} dakikayı aşan`;

  const rows = el('div', { class: 'stack' },
    el('div', { style: ROW },
      el('span', null, 'Toplam süre'),
      el('strong', null, seconds(summary.totalMs))),
    el('div', { style: ROW },
      el('span', null,
        `Cevaplanan ortalaması${summary.answeredCount > 0 ? ` (${summary.answeredCount} soru)` : ''}`),
      el('strong', null, summary.answeredCount > 0 ? seconds(summary.avgMs) : '—')),
    el('div', { style: ROW },
      el('span', null, overLabel),
      el('strong', null, summary.overCount > 0 ? `${summary.overCount} soru` : 'yok')),
    summary.overCount > 0
      ? el('div', { style: ROW },
          el('span', null, 'Bu sorularda geçen'),
          el('strong', null,
            `${seconds(summary.overMs)} · toplamın %${Math.round(summary.overShare * 100)} kadarı`))
      : null
  );

  const notes = el('div', { class: 'stack' });

  if (summary.blankCount > 0) {
    notes.append(el('div', { class: 'small muted' },
      `Boş bıraktığın ${summary.blankCount} soruda ${seconds(summary.blankMs)} geçti.`));
  }

  if (summary.suspectCount > 0) {
    notes.append(el('div', { class: 'small muted' },
      `${summary.suspectCount} kayıt 15 dakikayı aştı; şüpheli sayıldı, ortalamaya katılmadı.`));
  }

  const top = el('div', { class: 'stack' },
    el('div', { class: 'small muted' }, 'En uzun süren sorular'),
    summary.top.map((row) =>
      el('div', { class: 'small', style: ROW },
        el('span', null,
          `${row.number}. soru${row.label ? ` · ${row.label}` : ''}`
          + (row.blank ? ' · boş' : '') + (row.suspect ? ' · şüpheli' : '')),
        el('span', null, seconds(row.ms))))
  );

  return el('div', { class: 'card stack' },
    el('div', { style: 'font-weight:600' }, 'Süre ölçümü'),
    rows,
    notes,
    top,
    el('div', { class: 'small muted' },
      'Ölçüm, sorunun ekrana gelmesinden şıkkı işaretlemene kadar geçen süredir; '
      + 'çözüm okuma ve uygulama arka plandayken geçen süre buna dahil değil.')
  );
}

export async function render(ctx) {
  const session = getLastSession();

  if (!session || !session.finished) {
    ctx.setTitle('Sonuç');
    return el('div', { class: 'stack' },
      emptyState('🤔', 'Gösterilecek sonuç yok', 'Bir oturum tamamlandığında sonucu burada görürsün.'),
      el('button', { class: 'btn primary', on: { click: () => ctx.goHome() } }, 'Ana ekrana dön')
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

  const timing = timingCard(session.timingSummary());
  if (timing) root.append(timing);

  if (score.hintOpens === score.total && score.total > 0) {
    root.append(el('div', { class: 'card small muted' },
      'Her soruda "Soru ne istiyor?" satırını açtın. Ayarlar\'dan şıkları hemen açık hale getirip ipucunu isteğe bağlı yapabilirsin.'));
  }

  root.append(el('h2', { style: 'font-size:1rem;margin-top:6px' }, 'Soruların üstünden geç'));

  const list = el('div', { class: 'list' });
  const openRoots = openRootIndexes(session.questions, session.answers);
  session.questions.forEach((question, index) => {
    list.append(reviewItem(question, session.answers[index], index, openRoots.has(index)));
  });
  root.append(list);

  const actions = el('div', { class: 'stack', style: 'margin-top:8px' });

  // Kapsamli bir oturum bittiyse tekrar da o konuda kalir; ana ekrandaki genel giris
  // zaten ayri durdugu icin buradan tum derslerin yanlislarina dusmek istenmez.
  if (score.wrong > 0 || score.skipped > 0) {
    const scope = session.scope || null;
    const label = scope
      ? (scope.kind === 'altkonu'
          ? 'Bu alt konudaki yanlışlarımı tekrar et'
          : 'Bu konudaki yanlışlarımı tekrar et')
      : 'Yanlışlarımı şimdi tekrar et';

    actions.append(
      el('button', {
        class: 'btn primary',
        on: { click: () => ctx.navigate(wrongHashFor(scope)) },
      }, label)
    );
  }

  actions.append(
    el('button', { class: 'btn', on: { click: () => ctx.goHome() } }, 'Ana ekrana dön')
  );

  root.append(actions);
  return root;
}
