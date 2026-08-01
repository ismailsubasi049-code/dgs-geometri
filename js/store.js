// Ilerleme deposu: localStorage uzerinde tek anahtar, hafif Leitner tekrar sistemi.
// Tum yazmalar buradan gecer; baska hicbir modul localStorage'a dokunmaz.

import { dayKey, addDays, daysBetween } from './ui.js';

const KEY = 'dgs.progress.v1';

/** Leitner kutulari 1-5; bir soru dogru bilinince bir ust kutuya cikar. */
export const BOX_INTERVALS = [0, 1, 3, 7, 16];
export const MAX_BOX = BOX_INTERVALS.length;

/** Bir sorunun listeden dusmesi icin gereken ust uste dogru sayisi. */
const CLEAR_STREAK = 2;

function defaultState() {
  return {
    schema: 1,
    questions: {},
    daily: {},
    streak: { current: 0, best: 0, lastDay: null },
    settings: { dailyCount: 10, testMinutes: 12, instantChoices: false },
  };
}

export function defaultStat() {
  return {
    box: 1,
    seen: 0,
    correct: 0,
    wrong: 0,
    streakCorrect: 0,
    lastWrong: false,
    lastSeen: null,
    due: null,
    hintOpens: 0,
    hintMsTotal: 0,
  };
}

let state = null;
let storageWorks = true;

function load() {
  if (state) return state;

  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const base = defaultState();
      state = {
        ...base,
        ...parsed,
        streak: { ...base.streak, ...(parsed.streak || {}) },
        settings: { ...base.settings, ...(parsed.settings || {}) },
        questions: parsed.questions || {},
        daily: parsed.daily || {},
      };
    } else {
      state = defaultState();
    }
  } catch (error) {
    // Bozuk veri ya da erisim yok: uygulama calismaya devam etsin, ilerleme bellekte tutulsun.
    console.warn('Ilerleme okunamadi, sifirdan baslaniyor:', error.message);
    state = defaultState();
    storageWorks = false;
  }

  return state;
}

function save() {
  if (!storageWorks) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (error) {
    storageWorks = false;
    console.warn('Ilerleme kaydedilemedi:', error.message);
  }
}

/** Depolama gercekten calisiyor mu? (gizli sekme / dolu kota uyarisi icin) */
export function isPersistent() {
  load();
  return storageWorks;
}

// ---------- ayarlar ----------

export function getSettings() {
  return { ...load().settings };
}

export function setSetting(key, value) {
  load().settings[key] = value;
  save();
}

// ---------- soru istatistikleri ----------

export function getStat(id) {
  const stats = load().questions;
  return stats[id] ? { ...defaultStat(), ...stats[id] } : defaultStat();
}

export function allStats() {
  return load().questions;
}

/**
 * Bir cevabi isler ve tekrar takvimini gunceller.
 * hintMs: soru gorunduginden "soru ne istiyor?"a dokunulana kadar gecen sure (yoksa null).
 */
export function recordAnswer(id, { correct, hintMs = null } = {}) {
  const store = load();
  const stat = { ...defaultStat(), ...(store.questions[id] || {}) };
  const today = dayKey();

  stat.seen += 1;
  stat.lastSeen = today;

  if (hintMs !== null && hintMs >= 0) {
    stat.hintOpens += 1;
    stat.hintMsTotal += Math.round(hintMs);
  }

  if (correct) {
    stat.correct += 1;
    stat.streakCorrect += 1;
    stat.box = Math.min(MAX_BOX, stat.box + 1);
    if (stat.lastWrong && stat.streakCorrect >= CLEAR_STREAK) stat.lastWrong = false;
  } else {
    stat.wrong += 1;
    stat.streakCorrect = 0;
    stat.box = 1;
    stat.lastWrong = true;
  }

  stat.due = addDays(today, BOX_INTERVALS[stat.box - 1]);

  store.questions[id] = stat;
  save();
  return stat;
}

/** Vadesi gelmis mi? Hic gorulmemis sorular icin false doner (onlar "yeni" havuzunda). */
export function isDue(id, today = dayKey()) {
  const stat = load().questions[id];
  if (!stat || !stat.due) return false;
  return daysBetween(stat.due, today) >= 0;
}

// ---------- gunluk rutin ----------

export function getDaily(day = dayKey()) {
  const record = load().daily[day];
  return record ? { ids: [], done: 0, correct: 0, ...record } : null;
}

export function setDaily(day, patch) {
  const store = load();
  store.daily[day] = { ids: [], done: 0, correct: 0, ...(store.daily[day] || {}), ...patch };
  save();
  return store.daily[day];
}

/**
 * Gunluk rutin tamamlaninca seriyi gunceller.
 * Dun de yapilmissa seri artar, arada bosluk varsa 1'e doner.
 */
export function completeDay(day = dayKey()) {
  const store = load();
  const streak = store.streak;

  if (streak.lastDay === day) return { ...streak };

  const gap = streak.lastDay ? daysBetween(streak.lastDay, day) : null;
  streak.current = gap === 1 ? streak.current + 1 : 1;
  streak.best = Math.max(streak.best, streak.current);
  streak.lastDay = day;

  save();
  return { ...streak };
}

export function getStreak() {
  const streak = { ...load().streak };
  // Dun de bugun de calisilmadiysa seri fiilen kirilmistir; gosterirken bunu yansit.
  if (streak.lastDay) {
    const gap = daysBetween(streak.lastDay, dayKey());
    if (gap > 1) streak.current = 0;
  }
  return streak;
}

// ---------- toplu islemler ----------

export function summary() {
  const stats = Object.values(load().questions);
  const seen = stats.length;
  const correct = stats.reduce((sum, s) => sum + s.correct, 0);
  const wrong = stats.reduce((sum, s) => sum + s.wrong, 0);
  const mastered = stats.filter((s) => s.box >= MAX_BOX).length;
  const pending = stats.filter((s) => s.lastWrong).length;
  return { seen, correct, wrong, attempts: correct + wrong, mastered, pending };
}

export function exportJson() {
  return JSON.stringify(load(), null, 2);
}

/** Yedegi geri yukler. Bicim tutmuyorsa hata firlatir, mevcut veriye dokunmaz. */
export function importJson(text) {
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== 'object' || typeof parsed.questions !== 'object') {
    throw new Error('Bu dosya bir DGS Geometri yedeği değil.');
  }
  const base = defaultState();
  state = {
    ...base,
    ...parsed,
    streak: { ...base.streak, ...(parsed.streak || {}) },
    settings: { ...base.settings, ...(parsed.settings || {}) },
    questions: parsed.questions || {},
    daily: parsed.daily || {},
  };
  storageWorks = true;
  save();
  return summary();
}

export function resetAll() {
  state = defaultState();
  storageWorks = true;
  save();
}
