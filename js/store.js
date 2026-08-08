// Ilerleme deposu: localStorage uzerinde tek anahtar, hafif Leitner tekrar sistemi.
// Tum yazmalar buradan gecer; baska hicbir modul localStorage'a dokunmaz.

import { dayKey, addDays, daysBetween } from './ui.js';

const KEY = 'dgs.progress.v1';

/** Leitner kutulari 1-5; bir soru dogru bilinince bir ust kutuya cikar. */
export const BOX_INTERVALS = [0, 1, 3, 7, 16];
export const MAX_BOX = BOX_INTERVALS.length;

/** Bir sorunun listeden dusmesi icin gereken ust uste dogru sayisi. */
const CLEAR_STREAK = 2;

const DAY_MS = 86400000;

/** Son yedekten bu kadar gun gecince hatirlatma cikar. */
const BACKUP_REMIND_DAYS = 7;

/** "Sonra" denince hatirlatmanin susacagi sure. */
const BACKUP_SNOOZE_DAYS = 3;

function defaultState() {
  return {
    schema: 1,
    questions: {},
    daily: {},
    /** Yarim kalan ogrenme oturumlari: "altkonu:<id>" -> { ids, index, answers, savedAt } */
    sessions: {},
    streak: { current: 0, best: 0, lastDay: null },
    settings: { dailyCount: 10, testMinutes: 12, instantChoices: false },
    /** Hic yedek alinmadiysa hatirlatma bu tarihten sayilir. */
    installedAt: Date.now(),
    /** lastAt: son yedegin zamani. remindAt: bu ana kadar hatirlatma gosterilmez. */
    backup: { lastAt: null, remindAt: null },
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

/** Bu oturum acilirken depoda kayitli bir ilerleme var miydi? İlk load()'ta belirlenir. */
let foundOnBoot = null;

function load() {
  if (state) return state;

  try {
    const raw = localStorage.getItem(KEY);
    if (foundOnBoot === null) foundOnBoot = raw !== null;

    if (raw) {
      const parsed = JSON.parse(raw);
      const base = defaultState();
      state = {
        ...base,
        ...parsed,
        streak: { ...base.streak, ...(parsed.streak || {}) },
        settings: { ...base.settings, ...(parsed.settings || {}) },
        backup: { ...base.backup, ...(parsed.backup || {}) },
        questions: parsed.questions || {},
        daily: parsed.daily || {},
        sessions: parsed.sessions || {},
      };
    } else {
      state = defaultState();
    }
  } catch (error) {
    // Bozuk veri ya da erisim yok: uygulama calismaya devam etsin, ilerleme bellekte tutulsun.
    console.warn('Ilerleme okunamadi, sifirdan baslaniyor:', error.message);
    if (foundOnBoot === null) foundOnBoot = false;
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

/**
 * Uygulama acilirken kayitli bir ilerleme bulundu mu?
 * false ise ya ilk kurulum ya da tarayici verisi silinmis demektir - ikisi
 * birbirinden ayirt edilemez, cunku ayirt edecek isaret de ayni depoda olurdu.
 */
export function hasStoredData() {
  load();
  return foundOnBoot === true;
}

/** Durumu oldugu gibi yazar; "sifirdan basla" secildiginde anahtarin olusmasi icin. */
export function persist() {
  load();
  save();
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

// ---------- yarim kalan oturumlar ----------

/**
 * Alt konu / konu calismasinda kalinan yer. Anahtar: "altkonu:<subtopicId>".
 * Sureli test ve gunluk rutin burada tutulmaz; onlarin kendi akisi var.
 */
export function getSavedSession(key) {
  const record = load().sessions[key];
  if (!record || !Array.isArray(record.ids) || record.ids.length === 0) return null;
  return {
    ids: record.ids,
    index: Number.isInteger(record.index) ? record.index : 0,
    answers: Array.isArray(record.answers) ? record.answers : [],
    savedAt: record.savedAt || null,
  };
}

export function saveSession(key, { ids, index, answers }) {
  const store = load();
  store.sessions[key] = { ids, index, answers, savedAt: Date.now() };
  save();
}

export function clearSession(key) {
  const store = load();
  if (!(key in store.sessions)) return;
  delete store.sessions[key];
  save();
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

// ---------- yedek hatirlatmasi ----------

/**
 * Hatirlatma icin gereken her sey.
 * due: haftalik hatirlatmanin sirasi geldi mi?
 * Hic denemesi olmayan kullaniciya "yedek al" demenin anlami yok, o yuzden
 * kaybedilecek bir sey olmadan hatirlatma cikmaz.
 */
export function backupStatus() {
  const store = load();
  const now = Date.now();
  const reference = store.backup.lastAt || store.installedAt || now;
  const sinceDays = Math.max(0, Math.floor((now - reference) / DAY_MS));
  const snoozed = store.backup.remindAt ? now < store.backup.remindAt : false;

  return {
    lastAt: store.backup.lastAt,
    sinceDays,
    due: storageWorks && !snoozed && sinceDays >= BACKUP_REMIND_DAYS && summary().attempts > 0,
  };
}

/** Yedek indirildi: sayac sifirlanir, erteleme kalkar. */
export function markBackupTaken(at = Date.now()) {
  const store = load();
  store.backup = { lastAt: at, remindAt: null };
  save();
}

/** "Sonra" denildi: hatirlatma birkac gun susar, son yedek tarihi degismez. */
export function snoozeBackupReminder(days = BACKUP_SNOOZE_DAYS) {
  const store = load();
  store.backup.remindAt = Date.now() + days * DAY_MS;
  save();
}

// ---------- disa / ice aktarma ----------

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
    backup: { ...base.backup, ...(parsed.backup || {}) },
    questions: parsed.questions || {},
    daily: parsed.daily || {},
    sessions: parsed.sessions || {},
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
