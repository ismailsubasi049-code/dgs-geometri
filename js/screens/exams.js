// Denemeler: #/denemeler (liste) ve #/denemeler/<sonucId> (kalici sonuc).
//
// Sonuc ekrani yalnizca store.exams'teki kayittan beslenir; deneme bittikten gunler sonra
// da ayni sayilarla acilir. Sorular gozden gecirme listesi icin paketten yuklenir;
// paketten kalkmis bir soru listede atlanir ama sayilar kayittan geldigi icin degismez.

import { el, emptyState, fmtTime, fmtNet } from '../ui.js';
import { listExams, loadExam } from '../packs.js';
import { scoreOf } from '../exam.js';
import { listExamResults, getExamResult } from '../store.js';
import { reviewItem, openRootIndexes } from './result.js';

const ROW = 'display:flex;justify-content:space-between;gap:10px';

function fmtDate(at) {
  if (!at) return '';
  return new Date(at).toLocaleString('tr-TR', {
    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  });
}

function statBox(label, value) {
  return el('div', { class: 'stat' },
    el('div', { class: 'k' }, label),
    el('div', { class: 'v' }, String(value)));
}

// ---------- liste ----------

async function renderList(ctx) {
  ctx.setTitle('Denemeler');

  const exams = await listExams();
  const results = listExamResults();
  const root = el('div', { class: 'stack' });

  if (exams.length === 0) {
    root.append(emptyState('📭', 'Deneme yok', 'Henüz yüklü bir deneme paketi yok.'));
  }

  const startList = el('div', { class: 'list' });
  for (const exam of exams) {
    const own = results.filter((r) => r.packId === exam.id);
    const last = own[0] ? scoreOf(own[0]) : null;
    startList.append(
      el('button', {
        class: 'row-item',
        type: 'button',
        on: { click: () => ctx.navigate(`#/deneme/${encodeURIComponent(exam.id)}`) },
      },
        el('span', null, '📝'),
        el('span', { class: 'grow' },
          el('div', { style: 'font-weight:600' }, exam.title || exam.id),
          el('div', { class: 'small muted' },
            [
              `${exam.count} soru`,
              exam.durationMin ? `${exam.durationMin} dakika` : null,
              own.length > 0 ? `${own.length} kez çözüldü` : 'hiç çözülmedi',
              last ? `son net ${fmtNet(last.net)}` : null,
            ].filter(Boolean).join(' · '))),
        el('span', { class: 'muted' }, 'Başla ›')
      )
    );
  }
  if (exams.length > 0) {
    root.append(
      el('div', { class: 'small muted' },
        'Sorular sınav sırasıyla gelir. Çözümler ve doğru/yanlış yalnız deneme bitince görünür.'),
      startList
    );
  }

  root.append(el('h2', { style: 'font-size:1rem;margin-top:6px' }, 'Geçmiş sonuçlar'));

  if (results.length === 0) {
    root.append(el('div', { class: 'small muted' },
      'Bitirdiğin her deneme burada saklanır; istediğin zaman yeniden açabilirsin.'));
    return root;
  }

  const history = el('div', { class: 'list' });
  for (const record of results) {
    const score = scoreOf(record);
    history.append(
      el('button', {
        class: 'row-item',
        type: 'button',
        on: { click: () => ctx.navigate(`#/denemeler/${encodeURIComponent(record.id)}`) },
      },
        el('span', { class: 'grow' },
          el('div', { style: 'font-weight:600' }, `Net ${fmtNet(score.net)}`),
          el('div', { class: 'small muted' },
            `${record.title} · ${fmtDate(record.startedAt)}`),
          el('div', { class: 'small muted' },
            `${score.correct} D · ${score.wrong} Y · ${score.blank} B · ${fmtTime(score.spentMs / 1000)}`
            + (record.timedOut ? ' · süre doldu' : ''))),
        el('span', { class: 'muted' }, '›')
      )
    );
  }
  root.append(history);
  return root;
}

// ---------- sonuc ----------

function sectionTable(sections) {
  if (sections.length === 0) return null;

  const head = el('tr', null,
    el('th', null, 'Bölüm'), el('th', null, 'D'), el('th', null, 'Y'),
    el('th', null, 'B'), el('th', null, 'Net'));

  const rows = sections.map((s) =>
    el('tr', null,
      el('td', null,
        el('div', null, s.title),
        el('div', { class: 'small muted' }, `${s.from}–${s.to}`)),
      el('td', null, String(s.correct)),
      el('td', null, String(s.wrong)),
      el('td', null, String(s.blank)),
      el('td', { class: 'net' }, fmtNet(s.net))));

  return el('div', { class: 'card stack' },
    el('div', { style: 'font-weight:600' }, 'Bölümlere göre'),
    el('table', { class: 'exam-table' }, el('thead', null, head), el('tbody', null, rows)));
}

function verdictText(row) {
  if (row.correct === true) return 'doğru';
  if (row.correct === false) return 'yanlış';
  return 'boş';
}

function timingCard(record, score) {
  const t = score.timing;
  const seconds = (ms) => fmtTime(ms / 1000);
  const minutes = Math.round(t.triageMs / 60000);

  const overList = t.over.length > 0
    ? el('div', { class: 'stack' },
        t.over
          .slice()
          .sort((a, b) => b.ms - a.ms)
          .map((row) =>
            el('div', { class: 'small', style: ROW },
              el('span', null, `${row.no}. soru · ${verdictText(row)}${row.marked ? ' · işaretli' : ''}`),
              el('span', null, seconds(row.ms)))))
    : null;

  return el('div', { class: 'card stack' },
    el('div', { style: 'font-weight:600' }, 'Süre ölçümü'),
    el('div', { style: ROW },
      el('span', null, 'Toplam süre'),
      el('strong', null, `${seconds(score.spentMs)} / ${seconds(record.limitMs || 0)}`)),
    el('div', { style: ROW },
      el('span', null, 'Sorularda ölçülen'),
      el('strong', null, seconds(t.totalMs))),
    el('div', { style: ROW },
      el('span', null,
        `Cevaplanan ortalaması${t.answeredCount > 0 ? ` (${t.answeredCount} soru)` : ''}`),
      el('strong', null, t.answeredCount > 0 ? seconds(t.avgMs) : '—')),
    el('div', { style: ROW },
      el('span', null, `${minutes} dakikayı aşan`),
      el('strong', null, t.over.length > 0
        ? `${t.over.length} soru · ${seconds(t.overMs)}`
        : 'yok')),
    overList,
    el('div', { class: 'small muted' },
      'Soru süresi, sorunun ekranda kaldığı tüm ziyaretlerin toplamıdır; uygulama arka '
      + 'plandayken geçen süre dahil değil. Her sorunun süresi aşağıdaki listede yazar.')
  );
}

async function renderResult(ctx, resultId) {
  const record = getExamResult(resultId);
  ctx.setTitle('Deneme sonucu');

  if (!record) {
    return el('div', { class: 'stack' },
      emptyState('🤔', 'Sonuç bulunamadı', 'Bu deneme sonucu kayıtlı değil.'),
      el('button', { class: 'btn primary', on: { click: () => ctx.navigate('#/denemeler') } },
        'Denemelere dön'));
  }

  ctx.setTitle(`${record.title} · sonuç`);
  const score = scoreOf(record);
  const root = el('div', { class: 'stack' });

  if (record.timedOut) {
    root.append(el('div', { class: 'error' }, 'Süre doldu — cevaplanmayan sorular boş sayıldı.'));
  }

  root.append(
    el('div', { class: 'card score' },
      el('div', { class: 'small muted' }, fmtDate(record.startedAt)),
      el('div', { class: 'num' }, fmtNet(score.net)),
      el('div', { class: 'of' }, `net · ${score.total} soru · D − Y/4`)),
    el('div', { class: 'stat-grid' },
      statBox('Doğru', score.correct),
      statBox('Yanlış', score.wrong),
      statBox('Boş', score.blank),
      statBox('Süre', fmtTime(score.spentMs / 1000)))
  );

  const table = sectionTable(score.sections);
  if (table) root.append(table);

  root.append(timingCard(record, score));

  // Gozden gecirme: kayittaki sirayla; soru paketten kalkmissa atlanir.
  const data = await loadExam(record.packId).catch(() => null);
  const byId = new Map((data ? data.questions : []).map((q) => [q.id, q]));
  const pairs = record.rows
    .map((row) => ({ row, question: byId.get(row.id) }))
    .filter((pair) => pair.question);

  root.append(el('h2', { style: 'font-size:1rem;margin-top:6px' }, 'Soruların üstünden geç'));

  if (pairs.length === 0) {
    root.append(el('div', { class: 'small muted' },
      'Bu denemenin soruları artık yüklü değil; sayılar kayıttan gösterildi.'));
  } else {
    const sections = record.sections || [];
    const titleOf = (no) => {
      const s = sections.find((x) => no >= x.from && no <= x.to);
      return s ? s.title : null;
    };
    // result.js'in verdict bicimi: { picked, correct, skipped }
    const answers = pairs.map(({ row }) => ({
      picked: row.picked,
      correct: row.correct === true,
      skipped: row.picked === null,
    }));
    const openRoots = openRootIndexes(pairs.map((p) => p.question), answers);

    const list = el('div', { class: 'list' });
    pairs.forEach(({ row, question }, i) => {
      list.append(reviewItem(question, answers[i], row.no - 1, openRoots.has(i), {
        title: titleOf(row.no),
        extra: `${row.marked ? '🚩 ' : ''}${fmtTime((row.ms || 0) / 1000)}`,
        open: false,
      }));
    });
    root.append(list);
  }

  root.append(
    el('div', { class: 'stack', style: 'margin-top:8px' },
      el('button', { class: 'btn', on: { click: () => ctx.navigate('#/denemeler') } },
        'Denemelere dön'),
      el('button', { class: 'btn', on: { click: () => ctx.goHome() } }, 'Ana ekrana dön'))
  );

  return root;
}

export async function render(ctx) {
  const resultId = ctx.params[0];
  return resultId ? renderResult(ctx, resultId) : renderList(ctx);
}
