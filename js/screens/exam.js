// Deneme cozme ekrani: #/deneme/<packId>
//
// Gercek sinav kosulu: sabit sira, toplam sure, cevap aninda degerlendirilmez. Deneme
// sirasinda hicbir cozum, dogru/yanlis isareti, formul karti ya da "Soru ne istiyor?"
// ipucu gorunmez; hepsi "Denemeyi bitir"den sonra sonuc ekraninda acilir.
//
// Iki turlu tarama icin: her soruya donulur, cevap degistirilir, soru isaretlenir.
// Soru haritasi cevapli / bos / isaretli sorulari ayri gosterir.
//
// Yarida birakilan deneme kaydedilmez (surdurme kapsam disi). Bu yuzden cikis korunur:
//   - Geri (telefonun geri tusu da, ust bardaki geri dugmesi de): deneme basinda gecmise
//     ayni URL'li bir koruma kaydi eklenir. Geri basilinca once o kayit duser ve onay
//     sorulur. Iptal: kayit yeniden eklenir, deneme oldugu gibi surer. Onay: bir kez daha
//     geri gidilir. URL degismedigi icin router (hashchange) hic tetiklenmez, ekran
//     yeniden cizilmez.
//   - Geri hareketini js/backstack.js yonetir: acik bir katman (karalama tam ekrani) varsa
//     geri once onu kapatir, bu korumaya hic ulasmaz. Katmanin kendi kapatma dugmesi
//     (Kucult) de onay sormaz: koruma kaydi hala tepede kalir.
//   - Sayfa kapatma / yenileme: beforeunload.

import { el, clear, richText, fmtTime, emptyState, sharedStem, createTriageToast, CHOICE_LETTERS }
  from '../ui.js';
import { parseFigure } from '../svg.js';
import { loadExam } from '../packs.js';
import { createExam } from '../exam.js';
import { createScratchpad } from '../scratchpad.js';
import { setBackGuard, dropLayers } from '../backstack.js';
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

  const LEAVE_MESSAGE = 'Deneme bitmedi. Çıkarsan bu deneme kaydedilmez. Yine de çıkılsın mı?';

  const examHash = location.hash;
  /** Koruma kaydi su an gecmisin tepesinde mi? */
  let guardArmed = false;
  /** Bitis sonrasi sonuca gecis bekleniyor: koruma kaydi dusunce sonuc acilir. */
  let resultHash = null;
  /** Cikis onaylandi: URL degisene kadar geri gidilir. */
  let leaving = false;

  function armGuard() {
    const state = history.state || {};
    // Sayfa yenilendiyse zaten koruma kaydinin ustundeyiz; ikinci kayit eklenmez.
    if (!state.dgsExamGuard) {
      // Derinlik ayni kalir: app.js'in dgsDepth sayaci koruma kaydini ayri ekran saymaz.
      history.pushState({ dgsDepth: state.dgsDepth, dgsExamGuard: true }, '', location.href);
    }
    guardArmed = true;
  }

  /** Katman acik degilken gelen geri hareketi (js/backstack.js iletir). */
  function onBack() {
    guardArmed = false;

    if (leaving) {
      // Yenilemeden kalma ikinci ayni-URL kaydi varsa onu da gec; URL degisince
      // hashchange ekrani degistirir, onLeave korumayi kaldirir.
      if (location.hash === examHash) history.back();
      return;
    }

    if (resultHash) {
      // Koruma kaydi dustu; sonuc deneme kaydinin yerine gecer. Sonuctan geri listeye iner.
      const target = resultHash;
      resultHash = null;
      releaseGuard();
      ctx.navigate(target, { replace: true });
      return;
    }

    if (exam.finished) return;

    // Koruma kaydi hala tepede: geri hareketi bir katman kaydini tuketti (Kucult ya da
    // yenilemeden kalma bayat katman kaydi), denemeden cikilmiyor.
    if (history.state && history.state.dgsExamGuard) {
      guardArmed = true;
      return;
    }

    if (window.confirm(LEAVE_MESSAGE)) {
      leaving = true;
      if (location.hash === examHash) history.back(); // deneme kaydindan da cik
    } else {
      armGuard();
    }
  }

  const releaseGuard = setBackGuard(onBack);
  ctx.onLeave(releaseGuard);
  armGuard();

  function finishExam({ timedOut = false } = {}) {
    if (exam.finished) return;
    stopCountdown();
    leaveQuestion();
    toast.dismiss();
    // Karalama tam ekransa gorunumu kapanir; kaydi asagidaki tek geri hareketiyle gider.
    const layerEntries = dropLayers();
    const record = exam.finish({ timedOut });
    const target = `#/denemeler/${encodeURIComponent(record.id)}`;

    // Biten deneme gecmiste kalmasin: sonuctan geri, denemeye degil listeye insin.
    // Once koruma kaydi (ve ustundeki katman kayitlari) dusurulur, sonuc geri hareketi
    // geldiginde deneme kaydinin yerine yazilir.
    if (guardArmed) {
      resultHash = target;
      history.go(-(layerEntries + 1));
    } else {
      releaseGuard();
      ctx.navigate(target, { replace: true });
    }
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
