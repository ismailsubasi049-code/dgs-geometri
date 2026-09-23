// Deneme motoru. js/quiz.js'teki oturum motorundan AYRI, cunku akisi farkli:
//   - dogrusal degil: her soruya donulur, cevap degistirilir, silinir, isaretlenir;
//   - cevap aninda degerlendirilmez: dogru/yanlis yalnizca finish() ile hesaplanir;
//   - ogrenme ilerlemesine (Leitner, gunluk sayac, global sure kayitlari) hic yazmaz.
// Tek kalici cikti, finish()'in kurdugu sonuc kaydidir (store.exams). Sonuc ekrani
// yalnizca bu kayittan beslenir; paket sonradan degisse de kayittaki sayilar bozulmaz.
//
// Sure olcumu: bir soruda gecen sure, o sorunun ekranda kaldigi TUM ziyaretlerin
// toplamidir (duraklamali sayac, js/timing.js). Denemede cevap degistirilebildigi icin
// "sik isaretlenene kadar" tanimi burada anlamsiz; soruya ayrilan emek ekranda kalinan suredir.

import * as store from './store.js';
import { MAX_QUESTION_MS } from './timing.js';

/**
 * questions: kaynak sirasinda soru dizisi (js/packs.js -> loadExam).
 * sections: [{ from, to, title }] - soru numarasi (no) araliklari.
 */
export function createExam({ entry, questions, sections = [], durationMin, triageMs = 120000 }) {
  const n = questions.length;

  return {
    entry,
    questions,
    sections,
    limitMs: Math.round(durationMin * 60000),
    triageMs,
    startedAt: Date.now(),
    finished: false,

    index: 0,
    /** Secilen sik indeksi; null = bos. */
    picks: new Array(n).fill(null),
    marked: new Set(),
    /** Soru basina biriken olcum. */
    ms: new Array(n).fill(0),
    pausedMs: new Array(n).fill(0),
    /** Triyaj uyarisi cikmis sorular: indeks -> { atMs, thresholdMs } */
    triage: new Map(),

    current() {
      return this.questions[this.index] || null;
    },

    /** Sorunun deneme numarasi: paketteki no, yoksa sira. */
    numberOf(i) {
      const no = Number(this.questions[i] && this.questions[i].no);
      return Number.isInteger(no) && no > 0 ? no : i + 1;
    },

    /** Sorunun bolumu (sections araligi); yoksa null. */
    sectionOf(i) {
      const no = this.numberOf(i);
      return this.sections.find((s) => no >= s.from && no <= s.to) || null;
    },

    goTo(i) {
      if (i < 0 || i >= n) return false;
      this.index = i;
      return true;
    },

    /** Ayni sikka ikinci dokunus cevabi siler (soru bos kalir). */
    pick(choice) {
      if (this.finished) return;
      this.picks[this.index] = this.picks[this.index] === choice ? null : choice;
    },

    toggleMark() {
      if (this.marked.has(this.index)) this.marked.delete(this.index);
      else this.marked.add(this.index);
    },

    /** Ekrandan ayrilan sorunun olcumunu biriktirir. */
    addTime(i, { ms = 0, pausedMs = 0 } = {}) {
      this.ms[i] += Math.max(0, Math.round(ms));
      this.pausedMs[i] += Math.max(0, Math.round(pausedMs));
    },

    counts() {
      const answered = this.picks.filter((p) => p !== null).length;
      return { answered, blank: n - answered, marked: this.marked.size, total: n };
    },

    /** Kalici sonuc kaydini kurar ve yazar. Ikinci cagri ayni kaydi dondurur. */
    finish({ timedOut = false } = {}) {
      if (this.finished) return this.record;
      this.finished = true;
      const endedAt = Date.now();

      const rows = this.questions.map((question, i) => {
        const picked = this.picks[i];
        const row = {
          id: question.id,
          no: this.numberOf(i),
          picked,
          correct: picked === null ? null : picked === question.answer,
          ms: this.ms[i],
        };
        if (this.pausedMs[i] > 0) row.pausedMs = this.pausedMs[i];
        if (this.marked.has(i)) row.marked = true;
        if (this.triage.has(i)) row.triageWarned = true;
        return row;
      });

      this.record = {
        id: `${this.entry.id}:${this.startedAt}`,
        packId: this.entry.id,
        title: this.entry.title || this.entry.id,
        startedAt: this.startedAt,
        endedAt,
        limitMs: this.limitMs,
        timedOut,
        triageMs: this.triageMs,
        sections: this.sections.map(({ from, to, title }) => ({ from, to, title })),
        rows,
      };

      store.addExamResult(this.record);
      return this.record;
    },
  };
}

/** D - Y/4; bos cezasiz. */
export function netOf(correct, wrong) {
  return correct - wrong / 4;
}

function tally(rows) {
  const correct = rows.filter((r) => r.correct === true).length;
  const wrong = rows.filter((r) => r.correct === false).length;
  const blank = rows.length - correct - wrong;
  return { correct, wrong, blank, total: rows.length, net: netOf(correct, wrong) };
}

/**
 * Sonuc kaydinin butun hesaplari - liste ve sonuc ekrani ayni sayilari buradan okur.
 * Sure ozeti js/quiz.js -> timingSummary ile ayni kovalari kullanir: supheli (15 dk
 * ustu) ortalamaya girmez, bos sorunun suresi toplama girer ortalamaya girmez;
 * esigi asanlar kovalardan bagimsiz bir kesittir.
 */
export function scoreOf(record) {
  const rows = Array.isArray(record.rows) ? record.rows : [];
  const all = tally(rows);

  const sections = (record.sections || []).map((section) => ({
    ...section,
    ...tally(rows.filter((r) => r.no >= section.from && r.no <= section.to)),
  }));

  const triageMs = record.triageMs || 120000;
  const totalMs = rows.reduce((sum, r) => sum + (r.ms || 0), 0);
  const clean = rows.filter((r) => r.picked !== null && (r.ms || 0) <= MAX_QUESTION_MS && r.ms > 0);
  const cleanMs = clean.reduce((sum, r) => sum + r.ms, 0);
  const over = rows.filter((r) => (r.ms || 0) >= triageMs);

  return {
    ...all,
    sections,
    spentMs: Math.max(0, (record.endedAt || 0) - (record.startedAt || 0)),
    timing: {
      totalMs,
      triageMs,
      avgMs: clean.length > 0 ? Math.round(cleanMs / clean.length) : 0,
      answeredCount: clean.length,
      over,
      overMs: over.reduce((sum, r) => sum + r.ms, 0),
    },
  };
}
