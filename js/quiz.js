// Oturum motoru. Dort mod da ayni nesneyi farkli yapilandirmayla kullanir.

import * as store from './store.js';
import { dayKey } from './ui.js';
import { MAX_QUESTION_MS } from './timing.js';

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
  altkonu: {
    key: 'altkonu',
    title: 'Alt konu çalışması',
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

export function createSession({ mode, questions, title = null, scope = null, totalSeconds = null }) {
  const config = MODES[mode] || MODES.konu;

  return {
    mode: config.key,
    config,
    title: title || config.title,
    /**
     * Oturumun konu kapsami: { kind: 'konu' | 'altkonu', value } ya da null.
     * Sonuc ekrani yanlis tekrarini buna gore daraltir; motorun kendisi kullanmaz.
     */
    scope,
    questions,
    /**
     * Her soru icin: { id, picked, correct, hintMs, elapsedMs, pausedMs, at }
     * elapsedMs / pausedMs duraklamali sayactan gelir (js/timing.js); at cevabin
     * verildigi andir - kayit sonradan diske yazilsa da zaman damgasi kaymaz.
     */
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
    submit(pickedIndex, { hintMs = null, elapsedMs = 0, pausedMs = 0 } = {}) {
      const question = this.current();
      if (!question || this.answers[this.index]) return null;

      const correct = pickedIndex === question.answer;
      const record = {
        id: question.id,
        picked: pickedIndex,
        correct,
        hintMs,
        elapsedMs,
        pausedMs,
        at: Date.now(),
      };
      this.answers[this.index] = record;

      store.recordAnswer(question.id, { correct, hintMs });

      if (config.countsForDaily) store.bumpDaily(dayKey(), correct);

      return record;
    },

    /**
     * Cevaplanmamis sorulari bos gecmis say (sure dolunca kullanilir).
     * current: ekranda duran ama cevaplanmamis sorunun olcumu ({ ms, pausedMs }) ya da null.
     * Yalnizca o soru "gorulmus" (shown) isaretlenir; hic ekrana gelmemis sorular sure
     * kaydi acmaz - 0 saniyelik sahte kayitlar ortalamayi bozardi.
     */
    markRemainingSkipped(current = null) {
      for (let i = 0; i < this.questions.length; i++) {
        if (this.answers[i] === null) {
          const shown = current !== null && i === this.index;
          this.answers[i] = {
            id: this.questions[i].id,
            picked: null,
            correct: false,
            hintMs: null,
            elapsedMs: shown ? current.ms : 0,
            pausedMs: shown ? current.pausedMs : 0,
            at: Date.now(),
            skipped: true,
            shown,
          };
          // Bos birakilan soru "yanlis" sayilmaz ve kutusu degismez; yalnizca gorulmus
          // isaretlenir ki "hic denenmemis" havuzunda kalip ayni gun geri gelmesin.
          store.recordSkipped(this.questions[i].id);
        }
      }
    },

    /** Kaldigi yeri diske yazmak icin sadelestirilmis hal. */
    snapshot() {
      return {
        ids: this.questions.map((q) => q.id),
        index: this.index,
        answers: this.answers,
      };
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

    /**
     * Oturum sonu sure ozeti - HESAP burada, gosterim sonuc ekraninda.
     *
     * Uc ayri kova, ust uste binmez (toplam = cevaplanan + bos + supheli):
     *  - cevaplanan: temiz olcum, ORTALAMA yalnizca bundan hesaplanir
     *  - bos: gorunup cevaplanmadan gecilen soru; toplama girer, ortalamaya girmez
     *  - supheli: 15 dakikayi asan kayit; kacirilan bir duraklatma senaryosunun
     *    ortalamayi bozmamasi icin ayrilir, ama toplamda ve listede gorunur
     * Hic ekrana gelmemis sorular hicbir kovaya girmez.
     */
    timingSummary() {
      const rows = [];

      for (let i = 0; i < this.answers.length; i++) {
        const answer = this.answers[i];
        if (!answer) continue;
        if (answer.skipped && !answer.shown) continue;

        const question = this.questions[i] || {};
        const ms = Math.max(0, Math.round(answer.elapsedMs || 0));
        rows.push({
          number: i + 1,
          ms,
          suspect: ms > MAX_QUESTION_MS,
          blank: Boolean(answer.skipped),
          label: question.subtopic || question.topic || '',
        });
      }

      const total = (list) => list.reduce((sum, row) => sum + row.ms, 0);
      const suspects = rows.filter((row) => row.suspect);
      const blanks = rows.filter((row) => !row.suspect && row.blank);
      const clean = rows.filter((row) => !row.suspect && !row.blank);

      return {
        totalMs: total(rows),
        answeredMs: total(clean),
        answeredCount: clean.length,
        avgMs: clean.length > 0 ? Math.round(total(clean) / clean.length) : 0,
        blankMs: total(blanks),
        blankCount: blanks.length,
        suspectMs: total(suspects),
        suspectCount: suspects.length,
        top: rows.slice().sort((a, b) => b.ms - a.ms).slice(0, 3),
      };
    },

    finish({ timedOut = false, current = null } = {}) {
      if (this.finished) return this;
      this.markRemainingSkipped(current);
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
