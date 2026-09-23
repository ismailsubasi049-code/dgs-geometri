// Deneme cozme ekrani: #/deneme/<packId>
//
// Gercek sinav kosulu: sabit sira, toplam sure, cevap aninda degerlendirilmez. Deneme
// sirasinda hicbir cozum, dogru/yanlis isareti, formul karti ya da "Soru ne istiyor?"
// ipucu gorunmez; hepsi "Denemeyi bitir"den sonra sonuc ekraninda acilir.
//
// Iki turlu tarama icin: her soruya donulur, cevap degistirilir, soru isaretlenir.
// Soru haritasi cevapli / bos / isaretli sorulari ayri gosterir.
//
// Yarida birakilan deneme kaydedilmez (surdurme kapsam disi). Ust bardaki geri dugmesi
// ve sayfa kapatma bunun icin onay ister.

import { el, clear, richText, fmtTime, emptyState, sharedStem, createTriageToast, CHOICE_LETTERS }
  from '../ui.js';
import { parseFigure } from '../svg.js';
import { loadExam } from '../packs.js';
import { createExam } from '../exam.js';
import { createScratchpad } from '../scratchpad.js';
import { createQuestionTimer } from '../timing.js';
import { getSettings } from '../store.js';

export async function render(ctx) {
  const packId = ctx.params[0] || '';
  const data = await loadExam(packId);

  if (!data || data.questions.length === 0) {
    ctx.setTitle('Deneme');
    return el('div', { class: 'stack' },
      emptyState('📭', 'Deneme bulunamadı', 'Bu deneme paketi yüklenemedi.'),
      el('button', { class: 'btn primary', on: { click: () => ctx.navigate('#/denemeler') } },
        'Denemelere dön')
    );
  }

  ctx.setTitle(data.entry.title || 'Deneme');

  const settings = getSettings();
  const wantsTimer = Boolean(settings.showQuestionTimer);
  const wantsTriage = Boolean(settings.triageWarning);
  const triageMinutes = Math.max(1, Number(settings.triageMinutes) || 2);
  const triageMs = triageMinutes * 60000;

  const exam = createExam({
    entry: data.entry,
    questions: data.questions,
    sections: data.sections,
    durationMin: data.durationMin,
    triageMs,
  });
  const total = exam.questions.length;

  // ---------- olcum ve uyari ----------

  const timer = createQuestionTimer();
  ctx.onLeave(timer.destroy);

  const toast = createTriageToast(triageMinutes);
  ctx.onLeave(toast.dismiss);

  const scratch = createScratchpad({ open: false });
  ctx.onLeave(scratch.destroy);

  /** Ekrandan ayrilan sorunun olcumunu o sorunun toplamina ekler. */
  function leaveQuestion() {
    exam.addTime(exam.index, timer.stop());
  }

  const qtimerValue = el('span', { class: 'qtimer-value' }, '0:00');

  // Gorunur sayac ve triyaj ayni aboneye bagli; ikisi de kapaliysa abone yok, olcum yine surer.
  // Esik, sorunun birikmis suresine gore: iki ziyarette 1 + 1,5 dk gecen soru da uyari alir.
  if (wantsTimer || wantsTriage) {
    timer.subscribe(({ ms }) => {
      const spent = exam.ms[exam.index] + ms;
      if (wantsTimer) qtimerValue.textContent = fmtTime(spent / 1000);
      if (wantsTriage && !exam.triage.has(exam.index) && spent >= triageMs) {
        exam.triage.set(exam.index, { atMs: spent, thresholdMs: triageMs });
        toast.show();
      }
    });
  }

  // ---------- toplam sure ----------

  let countdownId = null;

  function stopCountdown() {
    if (countdownId !== null) {
      clearInterval(countdownId);
      countdownId = null;
    }
  }

  function startCountdown() {
    const endsAt = exam.startedAt + exam.limitMs;
    const tick = () => {
      const left = Math.max(0, (endsAt - Date.now()) / 1000);
      ctx.setRight(`kalan ${fmtTime(left)}`, left <= 300);
      if (left <= 0) finishExam({ timedOut: true });
    };
    tick();
    countdownId = setInterval(tick, 1000);
  }

  ctx.onLeave(stopCountdown);

  // ---------- yarida cikis korumasi ----------

  function onBeforeUnload(event) {
    if (exam.finished) return;
    event.preventDefault();
    event.returnValue = '';
  }
  window.addEventListener('beforeunload', onBeforeUnload);
  ctx.onLeave(() => window.removeEventListener('beforeunload', onBeforeUnload));

  ctx.guardLeave(() => (exam.finished
    ? null
    : 'Deneme bitmedi. Çıkarsan bu deneme kaydedilmez. Yine de çıkılsın mı?'));

  function finishExam({ timedOut = false } = {}) {
    if (exam.finished) return;
    stopCountdown();
    leaveQuestion();
    toast.dismiss();
    scratch.setFullscreen(false);
    const record = exam.finish({ timedOut });
    // Biten deneme gecmiste kalmasin: sonuctan geri, denemeye degil listeye insin.
    ctx.navigate(`#/denemeler/${encodeURIComponent(record.id)}`, { replace: true });
  }

  function confirmFinish() {
    const { blank, marked } = exam.counts();
    const parts = [];
    if (blank > 0) parts.push(`${blank} soru boş`);
    if (marked > 0) parts.push(`${marked} soru işaretli`);
    const detail = parts.length > 0 ? `\n${parts.join(', ')}.` : '';
    if (window.confirm(`Denemeyi bitirmek istiyor musun?${detail}`)) finishExam();
  }

  // ---------- iskelet ----------

  const root = el('div', { class: 'stack' });
  const counter = el('div', { class: 'small muted' });
  const markButton = el('button', {
    class: 'exam-mark',
    type: 'button',
    on: {
      click: () => {
        exam.toggleMark();
        paintMark();
        paintMap();
      },
    },
  });

  const progressFill = el('i', { style: 'width:0%' });
  const body = el('div', { class: 'stack' });

  // Soru haritasi: acik/kapali hali <details>'in kendisinde durur, sorular arasi korunur.
  const mapSummary = el('span', { class: 'grow' });
  const mapGrid = el('div', { class: 'exam-grid' });
  const cells = exam.questions.map((_, i) => {
    const cell = el('button', {
      class: 'exam-cell',
      type: 'button',
      'aria-label': `Soru ${exam.numberOf(i)}`,
      on: { click: () => go(i) },
    }, String(exam.numberOf(i)));
    mapGrid.append(cell);
    return cell;
  });
  const mapBox = el('details', { class: 'exam-map' },
    el('summary', null, mapSummary),
    mapGrid,
    el('div', { class: 'exam-legend small muted' },
      el('span', null, el('i', { class: 'exam-cell answered' }), 'cevaplı'),
      el('span', null, el('i', { class: 'exam-cell' }), 'boş'),
      el('span', null, el('i', { class: 'exam-cell marked' }), 'işaretli'))
  );

  root.append(
    el('div', { class: 'session-head' },
      counter,
      el('div', { class: 'session-head-right' },
        wantsTimer
          ? el('span', { class: 'qtimer' }, el('span', { class: 'qtimer-label' }, 'bu soru'), qtimerValue)
          : null,
        markButton)
    ),
    el('div', { class: 'progressbar' }, progressFill),
    mapBox,
    body
  );

  function paintMark() {
    const on = exam.marked.has(exam.index);
    markButton.setAttribute('aria-pressed', on ? 'true' : 'false');
    markButton.textContent = on ? '🚩 İşaretli' : '🚩 İşaretle';
  }

  function paintMap() {
    const { answered, blank, marked } = exam.counts();
    mapSummary.textContent = `Soru haritası · Cevaplı ${answered} · Boş ${blank} · İşaretli ${marked}`;
    cells.forEach((cell, i) => {
      cell.classList.toggle('answered', exam.picks[i] !== null);
      cell.classList.toggle('marked', exam.marked.has(i));
      cell.classList.toggle('current', i === exam.index);
    });
    progressFill.style.width = `${(answered / total) * 100}%`;
  }

  function go(i) {
    if (i === exam.index || exam.finished) return;
    leaveQuestion();
    exam.goTo(i);
    showQuestion();
    window.scrollTo(0, 0);
  }

  // ---------- soru ----------

  function showQuestion() {
    const i = exam.index;
    const question = exam.current();

    toast.dismiss();
    timer.start();
    if (wantsTimer) qtimerValue.textContent = fmtTime(exam.ms[i] / 1000);

    counter.textContent = `Soru ${exam.numberOf(i)} / ${total}`;
    paintMark();
    paintMap();

    scratch.setFullscreen(false);
    clear(body);

    const section = exam.sectionOf(i);
    body.append(
      el('div', { class: 'qmeta' },
        el('span', { class: 'chip' }, section ? section.title : (question.topic || 'Deneme')))
    );

    if (question.block) body.append(sharedStem(question.block, { open: true }));

    const figure = parseFigure(question.figure, section ? section.title : 'Soru şekli');
    if (figure) body.append(el('div', { class: 'figure' }, figure));

    body.append(el('div', { class: 'stem', html: richText(question.stem) }));

    scratch.reset();
    body.append(scratch.node);

    // Siklar hep acik; secim yalnizca vurgulanir, dogru/yanlis boyasi yok.
    // Secili sikka ikinci dokunus cevabi siler.
    const choiceButtons = question.choices.map((choice, c) =>
      el('button', {
        class: 'choice',
        type: 'button',
        on: {
          click: () => {
            exam.pick(c);
            paintChoices();
            paintMap();
          },
        },
      },
        el('span', { class: 'letter' }, CHOICE_LETTERS[c] || String(c + 1)),
        el('span', { class: 'text' }, String(choice))
      )
    );

    function paintChoices() {
      choiceButtons.forEach((button, c) => {
        button.classList.toggle('pending', exam.picks[i] === c);
      });
    }
    paintChoices();

    body.append(el('div', { class: 'choices' }, choiceButtons));

    body.append(
      el('div', { class: 'btn-row' },
        el('button', {
          class: 'btn',
          type: 'button',
          disabled: i === 0,
          on: { click: () => go(i - 1) },
        }, '‹ Önceki'),
        el('button', {
          class: 'btn',
          type: 'button',
          disabled: i === total - 1,
          on: { click: () => go(i + 1) },
        }, 'Sonraki ›')
      ),
      el('button', { class: 'btn primary', type: 'button', on: { click: confirmFinish } },
        'Denemeyi bitir')
    );
  }

  showQuestion();
  startCountdown();

  return root;
}
