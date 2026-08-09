// Ilerleme deposu: localStorage uzerinde tek anahtar, hafif Leitner tekrar sistemi.
// Tum yazmalar buradan gecer; baska hicbir modul localStorage'a dokunmaz.
//
// Yazma kurali: bellekteki kopya diske OLDUGU GIBI basilmaz. Her yazmadan once disk
// yeniden okunur ve iki taraf birlestirilir (mutate + mergeStates). Uygulama ayni anda
// iki yerde acikken - ana ekrana eklenmis PWA ile tarayici sekmesi ayni kaynagi paylasir -
// eski kalmis bir kopyanin tek bir dokunusla digerinin ilerlemesini silmesini bu engelliyor.
//
// Tekrar takvimi gun bazlidir ve hicbir soru cevaplandigi gun geri donmez (MIN_INTERVAL_DAYS).

import { dayKey, addDays, daysBetween } from './ui.js';

const KEY = 'dgs.progress.v1';

/** Leitner kutulari 1-5; bir soru dogru bilinince bir ust kutuya cikar. */
export const BOX_INTERVALS = [1, 1, 3, 7, 16];
export const MAX_BOX = BOX_INTERVALS.length;

/**
 * Bir soru, cevaplandigi gun bir daha havuza dusmez; en erken ertesi gun gelir.
 * Yanlisi ayni gun calismak isteyen "Yanlislarim" moduna girer - o mod vadeye bakmaz.
 */
const MIN_INTERVAL_DAYS = 1;

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

/** Bu oturum acilirken depoda kayitli bir ilerleme var miydi? İlk okumada belirlenir. */
let foundOnBoot = null;

/** Baska bir kopya yazdiginda haber verilecekler. */
const changeListeners = new Set();

/** Yazma basarisiz oldugunda haber verilecekler. */
const troubleListeners = new Set();

function notify(listeners, argument) {
  for (const listener of listeners) {
    try {
      listener(argument);
    } catch (error) {
      // Bir dinleyicinin hatasi digerlerini ve yazmayi engellemesin.
      console.warn('Depo dinleyicisi hata verdi:', error.message);
    }
  }
}

// ---------- disk ----------

/** Diskten okunan ham nesneyi eksiksiz bir duruma tamamlar. */
function normalize(parsed) {
  const base = defaultState();
  return {
    ...base,
    ...parsed,
    streak: { ...base.streak, ...(parsed.streak || {}) },
    settings: { ...base.settings, ...(parsed.settings || {}) },
    backup: { ...base.backup, ...(parsed.backup || {}) },
    questions: parsed.questions || {},
    daily: parsed.daily || {},
    sessions: parsed.sessions || {},
  };
}

/** Diskteki durum; kayit yoksa null. Bozuk veri ya da erisim yoksa da null. */
function readDisk() {
  try {
    const raw = localStorage.getItem(KEY);
    if (foundOnBoot === null) foundOnBoot = raw !== null;
    return raw ? normalize(JSON.parse(raw)) : null;
  } catch (error) {
    // Uygulama calismaya devam etsin, ilerleme bellekte tutulsun.
    console.warn('Ilerleme okunamadi:', error.message);
    if (foundOnBoot === null) foundOnBoot = false;
    storageWorks = false;
    return null;
  }
}

function load() {
  if (state) return state;
  state = readDisk() || defaultState();
  return state;
}

function write() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    storageWorks = true;
    return true;
  } catch (error) {
    // Kalici kilit yok: bir yazmanin basarisizligi sonrakileri sessizce yutmasin.
    // Kullanici da haberdar olsun diye dinleyicilere haber verilir.
    console.warn('Ilerleme kaydedilemedi:', error.message);
    storageWorks = false;
    notify(troubleListeners, error);
    return false;
  }
}

// ---------- birlestirme ----------

/** Iki soru kaydindan daha ileri olani. Birlestirmede ilerleme geri gitmesin diye. */
function pickStat(mine, theirs) {
  if (!mine) return theirs;
  if (!theirs) return mine;
  if (mine.seen !== theirs.seen) return mine.seen > theirs.seen ? mine : theirs;
  const seenMine = mine.lastSeen || '';
  const seenTheirs = theirs.lastSeen || '';
  if (seenMine !== seenTheirs) return seenMine > seenTheirs ? mine : theirs;
  return mine.box >= theirs.box ? mine : theirs;
}

/**
 * Bellekteki kopya ile diskteki kopyayi birlestirir; catisan her alanda "daha ileri"
 * olan kazanir. Boylece eski kalmis bir sekmenin yazmasi bile ilerlemeyi geri alamaz.
 *
 * Silme isleri (clearSession gibi) birlestirmeden SONRA uygulanir - yoksa silinen kayit
 * diskten geri gelirdi. mutate() bu sirayi garanti ediyor.
 */
function mergeStates(mine, disk) {
  if (!disk) return mine;
  if (!mine) return disk;

  const questions = { ...disk.questions };
  for (const [id, stat] of Object.entries(mine.questions)) {
    questions[id] = pickStat(stat, questions[id]);
  }

  const daily = { ...disk.daily };
  for (const [day, record] of Object.entries(mine.daily)) {
    const other = daily[day];
    if (!other || (record.done || 0) >= (other.done || 0)) daily[day] = record;
  }

  const sessions = { ...disk.sessions };
  for (const [key, record] of Object.entries(mine.sessions)) {
    const other = sessions[key];
    if (!other || (record.savedAt || 0) >= (other.savedAt || 0)) sessions[key] = record;
  }

  // Seriyi en son calisilan gun belirler; en iyi seri iki taraftan buyuk olani.
  const streak = (mine.streak.lastDay || '') >= (disk.streak.lastDay || '') ? mine.streak : disk.streak;

  return {
    ...disk,
    // Ayarlarda disk taze kabul edilir; bu yazmanin kendi degisikligi zaten sonra uygulanacak.
    settings: { ...disk.settings },
    questions,
    daily,
    sessions,
    streak: { ...streak, best: Math.max(mine.streak.best || 0, disk.streak.best || 0) },
    installedAt: Math.min(mine.installedAt || Date.now(), disk.installedAt || Date.now()),
    backup: {
      lastAt: Math.max(mine.backup.lastAt || 0, disk.backup.lastAt || 0) || null,
      remindAt: Math.max(mine.backup.remindAt || 0, disk.backup.remindAt || 0) || null,
    },
  };
}

/**
 * Tek yazma yolu: once diski taze oku ve birlestir, sonra degisikligi uygula, sonra yaz.
 * Bu sira sayesinde hem baska kopyanin yazdigi kaybolmaz hem de silme islemleri tutar.
 */
function mutate(change) {
  state = mergeStates(load(), readDisk());
  const result = change ? change(state) : undefined;
  write();
  return result;
}

/** Diski yeniden okuyup bellege katar. Bir sey degistiyse dinleyicilere haber verir. */
function refreshFromDisk() {
  const before = state ? JSON.stringify(state) : null;
  state = mergeStates(load(), readDisk());
  if (JSON.stringify(state) === before) return false;
  notify(changeListeners, null);
  return true;
}

// Diger kopya yazdiginda bu belge de haberdar olsun. (Ayni belgede tetiklenmez.)
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    // key null: depolama tumden temizlenmis demektir.
    if (event.key !== null && event.key !== KEY) return;
    refreshFromDisk();
  });

  // Arka planda donmus bir sayfa "storage" olayini kacirabilir; one gelince tazele.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refreshFromDisk();
  });
}

/** Baska bir kopya ilerlemeyi degistirdiginde cagrilir. Aboneligi birakan islev doner. */
export function onExternalChange(fn) {
  changeListeners.add(fn);
  return () => changeListeners.delete(fn);
}

/** Bir yazma basarisiz oldugunda cagrilir. Aboneligi birakan islev doner. */
export function onStorageTrouble(fn) {
  troubleListeners.add(fn);
  return () => troubleListeners.delete(fn);
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
  mutate(null);
}

// ---------- ayarlar ----------

export function getSettings() {
  return { ...load().settings };
}

export function setSetting(key, value) {
  mutate((store) => {
    store.settings[key] = value;
  });
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
  return mutate((store) => {
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

    // Aralik ne olursa olsun en erken yarin: ayni gun icinde soru geri gelmez.
    stat.due = addDays(today, Math.max(MIN_INTERVAL_DAYS, BOX_INTERVALS[stat.box - 1]));

    store.questions[id] = stat;
    return stat;
  });
}

/**
 * Bos birakilan soru (sure dolunca). Denenmis sayilmaz - dogru/yanlis sayaci artmaz,
 * kutu degismez - ama "hic gorulmemis" havuzunda da birakilmaz; yoksa ayni gun
 * icinde tekrar karsina cikardi. Vadesi ileride olan bir soru vadesini korur.
 */
export function recordSkipped(id) {
  return mutate((store) => {
    const stat = { ...defaultStat(), ...(store.questions[id] || {}) };
    const today = dayKey();
    const soonest = addDays(today, MIN_INTERVAL_DAYS);

    stat.seen += 1;
    stat.lastSeen = today;
    stat.due = stat.due && stat.due > soonest ? stat.due : soonest;

    store.questions[id] = stat;
    return stat;
  });
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
  return mutate((store) => {
    store.daily[day] = { ids: [], done: 0, correct: 0, ...(store.daily[day] || {}), ...patch };
    return store.daily[day];
  });
}

/**
 * Gunluk rutinde bir cevap islendi. Sayaclar disaridan okunup geri yazilmaz,
 * mutasyonun icinde artirilir; boylece taze kayit uzerinde calisilir.
 */
export function bumpDaily(day, correct) {
  return mutate((store) => {
    const record = { ids: [], done: 0, correct: 0, ...(store.daily[day] || {}) };
    record.done += 1;
    if (correct) record.correct += 1;
    store.daily[day] = record;
    return record;
  });
}

/**
 * Gunluk rutin tamamlaninca seriyi gunceller.
 * Dun de yapilmissa seri artar, arada bosluk varsa 1'e doner.
 */
export function completeDay(day = dayKey()) {
  return mutate((store) => {
    const streak = store.streak;
    if (streak.lastDay === day) return { ...streak };

    const gap = streak.lastDay ? daysBetween(streak.lastDay, day) : null;
    streak.current = gap === 1 ? streak.current + 1 : 1;
    streak.best = Math.max(streak.best, streak.current);
    streak.lastDay = day;

    return { ...streak };
  });
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
  mutate((store) => {
    store.sessions[key] = { ids, index, answers, savedAt: Date.now() };
  });
}

export function clearSession(key) {
  mutate((store) => {
    delete store.sessions[key];
  });
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
  mutate((store) => {
    store.backup = { lastAt: at, remindAt: null };
  });
}

/** "Sonra" denildi: hatirlatma birkac gun susar, son yedek tarihi degismez. */
export function snoozeBackupReminder(days = BACKUP_SNOOZE_DAYS) {
  mutate((store) => {
    store.backup.remindAt = Date.now() + days * DAY_MS;
  });
}

// ---------- disa / ice aktarma ----------

export function exportJson() {
  return JSON.stringify(load(), null, 2);
}

/**
 * Yedegi geri yukler. Bicim tutmuyorsa hata firlatir, mevcut veriye dokunmaz.
 * Bilerek yapilan bir degistirme oldugu icin birlestirme yok: dosyadaki hal ne ise o yazilir.
 */
export function importJson(text) {
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== 'object' || typeof parsed.questions !== 'object') {
    throw new Error('Bu dosya bir DGS Matematik yedeği değil.');
  }
  state = normalize(parsed);
  storageWorks = true;
  write();
  return summary();
}

/** Her seyi siler. Birlestirme yok; istenen sey zaten bos bir baslangic. */
export function resetAll() {
  state = defaultState();
  storageWorks = true;
  write();
}
