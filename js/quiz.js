// Oturum motoru. Dort mod da ayni nesneyi farkli yapilandirmayla kullanir.

import * as store from './store.js';
import { dayKey } from './ui.js';

export const MODES = {
  gunluk: {
    key: 'gunluk',
    title: 'Günlük rutin',
    timed: false,
    showSolution: true,
    countsForDaily: true,
  },
  yanlis: {
    key: 'yanlis',
    title: 'Yanlışlarım',
    timed: false,
    showSolution: true,
    countsForDaily: false,
  },
  test: {
    key: 'test',
    title: 'Mini test',
    timed: true,
    showSolution: false, // cozumler sonuc ekraninda topluca
    countsForDaily: false,
  },
  konu: {
    key: 'konu',
    title: 'Serbest çözme',
    timed: false,
    showSolution: true,
    countsForDaily: false,
  },
};

/** Sonuc ekrani, biten oturumu buradan okur. */
let lastFinished = null;

export function getLastSession() {
  return lastFinished;
}

export function createSession({ mode, questions, title = null, totalSeconds = null }) {
  const config = MODES[mode] || MODES.konu;

  return {
    mode: config.key,
    config,
    title: title || config.title,
    questions,
    /** Her soru icin: { id, picked, correct, hintMs, elapsedMs } */
    answers: new Array(questions.length).fill(null),
    index: 0,
    totalSeconds: config.timed ? totalSeconds : null,
    startedAt: Date.now(),
    finished: false,
    /** Sure dolarak mi bitti? */
    timedOut: false,

    current() {
      return this.questions[this.index] || null;
    },

    isAnswered() {
      return this.answers[this.index] !== null;
    },

    /**
     * Secilen sikki isler ve ilerlemeyi kaydeder.
     * hintMs: soru gorunduginden ipucuna dokunulana kadar gecen sure.
     */
    submit(pickedIndex, { hintMs = null, elapsedMs = 0 } = {}) {
      const question = this.current();
      if (!question || this.answers[this.index]) return null;

      const correct = pickedIndex === question.answer;
      const record = { id: question.id, picked: pickedIndex, correct, hintMs, elapsedMs };
      this.answers[this.index] = record;

      store.recordAnswer(question.id, { correct, hintMs });

      if (config.countsForDaily) {
        const today = dayKey();
        const daily = store.getDaily(today) || { done: 0, correct: 0, ids: [] };
        store.setDaily(today, {
          done: daily.done + 1,
          correct: daily.correct + (correct ? 1 : 0),
        });
      }

      return record;
    },

    /** Cevaplanmamis sorulari bos gecmis say (sure dolunca kullanilir). */
    markRemainingSkipped() {
      for (let i = 0; i < this.questions.length; i++) {
        if (this.answers[i] === null) {
          this.answers[i] = {
            id: this.questions[i].id,
            picked: null,
            correct: false,
            hintMs: null,
            elapsedMs: 0,
            skipped: true,
          };
          // Bos birakilan soru "yanlis" sayilmaz, sadece tekrar havuzunda kalir.
        }
      }
    },

    hasNext() {
      return this.index < this.questions.length - 1;
    },

    next() {
      if (this.hasNext()) {
        this.index += 1;
        return true;
      }
      return false;
    },

    score() {
      const answered = this.answers.filter(Boolean);
      const correct = answered.filter((a) => a.correct).length;
      const skipped = answered.filter((a) => a.skipped).length;
      const wrong = answered.length - correct - skipped;
      const hintOpens = answered.filter((a) => a.hintMs !== null).length;
      return { correct, wrong, skipped, hintOpens, total: this.questions.length };
    },

    finish({ timedOut = false } = {}) {
      if (this.finished) return this;
      this.markRemainingSkipped();
      this.finished = true;
      this.timedOut = timedOut;
      this.endedAt = Date.now();

      // Gunluk rutin bastan sona tamamlandiysa seri artar.
      if (config.countsForDaily) {
        const score = this.score();
        if (score.correct + score.wrong >= this.questions.length && this.questions.length > 0) {
          store.completeDay();
        }
      }

      lastFinished = this;
      return this;
    },
  };
}
