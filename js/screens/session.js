// Soru ekrani. Dort modun da kullandigi tek ekran; farki mod yapilandirmasi belirler.

import { el, clear, fmtTime, emptyState, CHOICE_LETTERS } from '../ui.js';
import { parseFigure } from '../svg.js';
import { createSession, MODES } from '../quiz.js';
import { buildDaily, buildWrongQueue, buildTest, buildTopicSet } from '../scheduler.js';
import { getSettings } from '../store.js';

/** Rota parametresinden soru listesini ve baslik bilgisini uretir. */
async function buildFor(mode, params) {
  switch (mode) {
    case 'gunluk': {
      const { questions } = await buildDaily();
      return {
        questions,
        title: 'Günlük rutin',
        empty: emptyState('📭', 'Soru bulunamadı', 'Henüz yüklü bir soru paketi yok.'),
      };
    }
    case 'yanlis': {
      const questions = await buildWrongQueue();
      return {
        questions,
        title: 'Yanlışlarım',
        empty: emptyState(
          '🎉',
          'Tekrar edilecek yanlış yok',
          'Yanlış yaptığın sorular burada birikir. Bir soru üst üste 2 kez doğru cevaplanınca listeden düşer.'
        ),
      };
    }
    case 'test': {
      const questions = await buildTest(10);
      return {
        questions,
        title: 'Mini test',
        empty: emptyState('📭', 'Soru bulunamadı', 'Test için yeterli soru yok.'),
      };
    }
    case 'konu':
    default: {
      const topic = params[0] || '';
      const questions = await buildTopicSet(topic);
      return {
        questions,
        title: topic || 'Serbest çözme',
        empty: emptyState('📭', 'Bu konuda soru yok', `"${topic}" konusuna ait soru bulunamadı.`),
      };
    }
  }
}

export async function render(ctx) {
  const mode = MODES[ctx.params[0]] ? ctx.params[0] : 'konu';
  const rest = ctx.params.slice(1);
  const settings = getSettings();

  const { questions, title, empty } = await buildFor(mode, rest);
  ctx.setTitle(title);

  if (questions.length === 0) {
    return el('div', { class: 'stack' },
      empty,
      el('button', { class: 'btn primary', on: { click: () => ctx.navigate('#/') } }, 'Ana ekrana dön')
    );
  }

  const session = createSession({
    mode,
    questions,
    title,
    totalSeconds: settings.testMinutes * 60,
  });

  // ---------- sure ----------

  let timerId = null;

  function stopTimer() {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function startTimer() {
    if (!session.config.timed) return;
    const endsAt = session.startedAt + session.totalSeconds * 1000;

    const tick = () => {
      const left = Math.max(0, (endsAt - Date.now()) / 1000);
      ctx.setRight(fmtTime(left), left <= 60);
      // finishSession, isaretli ama onaylanmamis sikki de kaydeder.
      if (left <= 0) finishSession({ timedOut: true });
    };

    tick();
    timerId = setInterval(tick, 1000);
  }

  ctx.onLeave(stopTimer);

  // ---------- ekran ----------

  const root = el('div', { class: 'stack' });
  const progressFill = el('i', { style: 'width:0%' });
  const progressBar = el('div', { class: 'progressbar' }, progressFill);
  const counter = el('div', { class: 'small muted' });
  const body = el('div', { class: 'stack' });

  root.append(counter, progressBar, body);

  /** Test modunda secim, "Sonraki"ye basilana kadar degistirilebilir. */
  let pendingPick = null;
  let shownAt = 0;
  let hintMs = null;

  function finishSession({ timedOut = false } = {}) {
    stopTimer();
    // Testte sik isaretlenmis ama "Sonraki"ye basilmadan sure dolduysa o cevap da sayilir.
    if (pendingPick !== null && !session.isAnswered()) {
      session.submit(pendingPick, { hintMs, elapsedMs: Date.now() - shownAt });
    }
    session.finish({ timedOut });
    ctx.navigate('#/sonuc');
  }

  function showQuestion() {
    const question = session.current();
    const number = session.index + 1;

    pendingPick = null;
    hintMs = null;
    shownAt = Date.now();

    counter.textContent = `Soru ${number} / ${session.questions.length}`;
    progressFill.style.width = `${((number - 1) / session.questions.length) * 100}%`;

    clear(body);

    // konu / zorluk satiri
    body.append(
      el('div', { class: 'qmeta' },
        el('span', { class: 'chip' }, question.topic || 'Geometri'),
        question.subtopic ? el('span', null, question.subtopic) : null
      )
    );

    // sekil
    const figure = parseFigure(question.figure, question.subtopic || 'Soru şekli');
    if (figure) body.append(el('div', { class: 'figure' }, figure));

    // soru metni
    body.append(el('div', { class: 'stem' }, question.stem));

    // ---------- "soru ne istiyor?" kapisi ----------

    const asksSlot = el('div');
    body.append(asksSlot);

    const choicesWrap = el('div', { class: 'choices' });
    const choiceButtons = [];

    function unlockChoices() {
      choicesWrap.classList.remove('locked');
      for (const button of choiceButtons) button.disabled = false;
    }

    function revealAsks() {
      if (hintMs === null) hintMs = Date.now() - shownAt;
      clear(asksSlot);
      asksSlot.append(
        el('div', { class: 'asks-box' },
          el('div', { class: 'label' }, 'Soru ne istiyor?'),
          el('div', null, question.asks)
        )
      );
      unlockChoices();
    }

    asksSlot.append(
      el('button', { class: 'asks-btn', type: 'button', on: { click: revealAsks } },
        'Soru ne istiyor?')
    );

    // ---------- siklar ----------

    const feedback = el('div', { class: 'stack' });

    function lockAllChoices() {
      for (const button of choiceButtons) button.disabled = true;
    }

    function paintResult(record) {
      for (let i = 0; i < choiceButtons.length; i++) {
        const button = choiceButtons[i];
        button.classList.remove('pending');
        if (i === question.answer) button.classList.add('correct');
        else if (i === record.picked) button.classList.add('wrong');
      }
    }

    function commit(pickedIndex) {
      const record = session.submit(pickedIndex, {
        hintMs,
        elapsedMs: Date.now() - shownAt,
      });
      if (!record) return;
      lockAllChoices();

      if (session.config.showSolution) {
        paintResult(record);
        showFeedback(record);
      } else {
        advance();
      }
    }

    function onPick(pickedIndex) {
      if (session.config.timed) {
        // Testte secim gecicidir; "Sonraki"ye basilinca kesinlesir.
        pendingPick = pickedIndex;
        for (let i = 0; i < choiceButtons.length; i++) {
          choiceButtons[i].classList.toggle('pending', i === pickedIndex);
        }
        nextButton.disabled = false;
      } else {
        commit(pickedIndex);
      }
    }

    for (let i = 0; i < question.choices.length; i++) {
      const button = el('button', {
        class: 'choice',
        type: 'button',
        disabled: true,
        on: { click: () => onPick(i) },
      },
        el('span', { class: 'letter' }, CHOICE_LETTERS[i] || String(i + 1)),
        el('span', { class: 'text' }, String(question.choices[i]))
      );
      choiceButtons.push(button);
      choicesWrap.append(button);
    }

    choicesWrap.classList.add('locked');
    if (settings.instantChoices) unlockChoices();

    body.append(choicesWrap, feedback);

    // ---------- alt buton ----------

    const isLast = !session.hasNext();

    function advance() {
      if (isLast) finishSession();
      else {
        session.next();
        showQuestion();
        window.scrollTo(0, 0);
      }
    }

    const nextButton = el('button', {
      class: 'btn primary',
      type: 'button',
      on: {
        click: () => {
          if (session.config.timed) {
            if (pendingPick === null) return;
            commit(pendingPick);
          } else {
            advance();
          }
        },
      },
    }, isLast ? (session.config.timed ? 'Testi bitir' : 'Sonucu gör') : 'Sonraki soru');

    function showFeedback(record) {
      clear(feedback);
      feedback.append(
        el('div', { class: `verdict ${record.correct ? 'ok' : 'bad'}` },
          record.correct
            ? '✓ Doğru'
            : `✗ Yanlış — doğru cevap ${CHOICE_LETTERS[question.answer]}`),
        el('div', { class: 'solution' },
          el('div', { class: 'label' }, 'Çözüm'),
          el('div', { class: 'solution-body' }, question.solution || '—')
        ),
        nextButton
      );
      nextButton.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    if (session.config.timed) {
      // Testte buton hep gorunur ama secim yapilana kadar pasif.
      nextButton.disabled = true;
      feedback.append(nextButton);
    }
  }

  showQuestion();
  startTimer();

  return root;
}
