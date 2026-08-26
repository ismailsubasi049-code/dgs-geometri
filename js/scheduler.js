// Hangi soru ne zaman gelecek? Dort modun soru listesini bu dosya kurar.
// Ogrenme modlarinda sira: once vadesi gelen tekrarlar, sonra geri kalanlar; her iki
// bolum de kendi icinde kolay -> orta -> zor.
// Dogru cozulmus sorular Leitner vadesi gelene kadar havuza girmez.
// Sureli mini test bunun disindadir, orada sorular karisik gelir.

import { loadAllQuestions, listTopics } from './packs.js';
import * as store from './store.js';
import { dayKey, daysBetween, seededRandom, hashSeed, shuffle } from './ui.js';

/** Tekrar onceligi: vadesi en cok gecmis ve en zayif kutudaki once gelsin. */
function dueOrder(a, b, today) {
  const sa = store.getStat(a.id);
  const sb = store.getStat(b.id);
  const overdueA = daysBetween(sa.due, today);
  const overdueB = daysBetween(sb.due, today);
  if (overdueA !== overdueB) return overdueB - overdueA;
  return sa.box - sb.box;
}

/** Zorluk blogu: 1 kolay, 2 orta, 3 zor. Alan yoksa ya da bozuksa orta sayilir. */
export function difficultyOf(question) {
  const value = Number(question.difficulty);
  if (!Number.isFinite(value)) return 2;
  return Math.min(3, Math.max(1, Math.round(value)));
}

/** Zorluk kovalari: [kolaylar, ortalar, zorlar]. Kova ICI sirayi cagiran belirler. */
function difficultyBuckets(questions) {
  const buckets = [[], [], []];
  for (const question of questions) buckets[difficultyOf(question) - 1].push(question);
  return buckets;
}

/**
 * Kolay -> orta -> zor bloklari. Blogun *icindeki* sira rastgele kalir;
 * boylece kademe korunur ama soru sirasi ezberlenmez.
 */
function orderByDifficulty(questions, rand = Math.random) {
  return difficultyBuckets(questions).flatMap((bucket) => shuffle(bucket, rand));
}

/**
 * Ayni kolay -> orta -> zor duzeni, ama blok icinde rastgelelik yok: vadesi gelen
 * tekrarlarda esit zorluktakiler dueOrder'a gore gelir (once en cok gecikmis,
 * esitlikte en zayif kutu). Kovalar difficultyBuckets'in urettigi yeni diziler,
 * yerinde siralamak cagiranin listesini bozmaz.
 */
function orderDueByDifficulty(questions, today) {
  return difficultyBuckets(questions)
    .flatMap((bucket) => bucket.sort((a, b) => dueOrder(a, b, today)));
}

/**
 * Havuzda kalmayi hak eden soru: ya hic denenmemis ya da Leitner vadesi gelmis.
 * Cevaplanan soru - dogru da olsa yanlis da olsa - en erken ertesi gun geri doner.
 * Yanlisini ayni gun calismak isteyen "Yanlislarim" moduna girer; o mod vadeye bakmaz.
 */
export function isActive(question, today = dayKey()) {
  return store.getStat(question.id).seen === 0 || store.isDue(question.id, today);
}

/**
 * Bu soru vadesi gelmis bir tekrar mi? Ogrenme havuzunu ikiye bolen kural budur;
 * soru ekrani da hangi bolumde oldugunu buradan ogrenir, kural iki yere kopyalanmasin.
 */
export function isRepeat(question, today = dayKey()) {
  return store.isDue(question.id, today);
}

/** Bir listedeki en yakin tekrar gunu; hicbiri planlanmamissa null. */
export function nextDueDay(questions) {
  let earliest = null;
  for (const question of questions) {
    const { due } = store.getStat(question.id);
    if (!due) continue;
    if (earliest === null || due < earliest) earliest = due;
  }
  return earliest;
}

/**
 * Ogrenme modlarinin sirasi: once Leitner'da tekrar zamani gelmis sorular, ardindan
 * geri kalanlar - ve her iki bolum kendi icinde kolaydan zora. Yani kolay tekrarlar,
 * orta tekrarlar, zor tekrarlar, sonra kolay yeniler, orta yeniler, zor yeniler.
 * Leitner onceligi degismez: hangi sorularin gelecegi ayni, yalnizca siralari degisir.
 * Sureli test bunu kullanmaz.
 * includeAll, "yine de bastan coz" yolu icin filtreyi devre disi birakir.
 */
function orderForLearning(questions, { today = dayKey(), rand = Math.random, includeAll = false } = {}) {
  const pool = includeAll ? questions : questions.filter((q) => isActive(q, today));

  const due = [];
  const rest = [];
  for (const question of pool) {
    if (isRepeat(question, today)) due.push(question);
    else rest.push(question);
  }

  // Vadesi gelen tekrar, geri kalanin onunde gelir; kendi icinde de kolaydan zora.
  return [...orderDueByDifficulty(due, today), ...orderByDifficulty(rest, rand)];
}

/**
 * Gunluk rutin. Ayni gun icinde hep ayni soru setini dondurur (tarih tohumlu),
 * boylece uygulamayi kapatip acmak seti degistirmez.
 */
export async function buildDaily() {
  const all = await loadAllQuestions();
  const today = dayKey();
  const target = store.getSettings().dailyCount;
  const record = store.getDaily(today);

  // Bugunun seti zaten belirlenmisse ona sadik kal.
  if (record && Array.isArray(record.ids) && record.ids.length > 0) {
    const byId = new Map(all.map((q) => [q.id, q]));
    const questions = record.ids.map((id) => byId.get(id)).filter(Boolean);
    if (questions.length > 0) return { questions, day: today, record };
  }

  const rand = seededRandom(hashSeed(today));

  const due = all.filter((q) => store.isDue(q.id, today)).sort((a, b) => dueOrder(a, b, today));
  // Yeni sorular kolaydan zora; blok icinde tarih tohumlu rastgelelik.
  const unseen = orderByDifficulty(all.filter((q) => store.getStat(q.id).seen === 0), rand);
  // Gorulmus ama vadesi gelmemisler yalnizca hedefi doldurur; burada zayif kutu once gelsin.
  // Bugun cevaplanmislar disarida kalir - ayni gun icinde ayni soru bir daha gelmemeli.
  const rest = shuffle(
    all.filter((q) => {
      const stat = store.getStat(q.id);
      return stat.seen > 0 && stat.lastSeen !== today && !store.isDue(q.id, today);
    }),
    rand
  ).sort((a, b) => store.getStat(a.id).box - store.getStat(b.id).box);

  const picked = [];
  for (const list of [due, unseen, rest]) {
    for (const question of list) {
      if (picked.length >= target) break;
      picked.push(question);
    }
  }

  const saved = store.setDaily(today, { ids: picked.map((q) => q.id), done: 0, correct: 0 });
  return { questions: picked, day: today, record: saved };
}

/** Son denemesi yanlis olan sorular; en eski gorulen basta. */
export async function buildWrongQueue() {
  const all = await loadAllQuestions();
  return all
    .filter((q) => store.getStat(q.id).lastWrong)
    .sort((a, b) => {
      const sa = store.getStat(a.id).lastSeen || '';
      const sb = store.getStat(b.id).lastSeen || '';
      return sa.localeCompare(sb);
    });
}

/**
 * Sureli mini test: her seferinde farkli, konulara yayilmis 10 soru.
 * Bilerek zorluk siralamasi YOK - sinav kosulunu taklit etmesi icin karisik gelir.
 */
export async function buildTest(count = 10) {
  const all = await loadAllQuestions();

  // Konu basina gruplayip sirayla cekmek, testin tek konuya yigilmasini onler.
  const byTopic = new Map();
  for (const question of shuffle(all)) {
    if (!byTopic.has(question.topic)) byTopic.set(question.topic, []);
    byTopic.get(question.topic).push(question);
  }

  const buckets = shuffle([...byTopic.values()]);
  const picked = [];
  let index = 0;
  while (picked.length < count && buckets.some((b) => b.length > index)) {
    for (const bucket of buckets) {
      if (picked.length >= count) break;
      if (bucket.length > index) picked.push(bucket[index]);
    }
    index++;
  }

  return shuffle(picked);
}

/**
 * Ogrenme havuzunu ve ekranin bos durumu ayirt etmesi icin gereken sayilari dondurur.
 * total: filtre oncesi soru sayisi, nextDue: havuz bossa bir sonraki tekrar gunu,
 * pending: son denemesi yanlis olan soru sayisi - "hepsini dogru cozdun" demeden once bakilir.
 */
function learningSet(own, includeAll, label) {
  return {
    questions: orderForLearning(own, { includeAll }),
    total: own.length,
    nextDue: nextDueDay(own),
    pending: own.filter((q) => store.getStat(q.id).lastWrong).length,
    label,
  };
}

/** Konu secip serbest cozme. */
export async function buildTopicSet(topic, { includeAll = false } = {}) {
  const all = await loadAllQuestions();
  return learningSet(all.filter((q) => q.topic === topic), includeAll, topic);
}

/** Tek bir alt konuya odaklanma. */
export async function buildSubtopicSet(subtopicId, { includeAll = false } = {}) {
  const all = await loadAllQuestions();
  const own = all.filter((q) => q.subtopicId === subtopicId);
  return learningSet(own, includeAll, own.length > 0 ? own[0].subtopic : null);
}

/** Ana ekranin ihtiyac duydugu sayilar. */
export async function overview() {
  const all = await loadAllQuestions();
  const today = dayKey();
  const settings = store.getSettings();
  const record = store.getDaily(today);

  const wrongCount = all.filter((q) => store.getStat(q.id).lastWrong).length;
  const dueCount = all.filter((q) => store.isDue(q.id, today)).length;
  const dailyTotal = Math.min(settings.dailyCount, all.length);

  return {
    total: all.length,
    topics: await listTopics(),
    wrongCount,
    dueCount,
    dailyDone: record ? record.done : 0,
    dailyCorrect: record ? record.correct : 0,
    dailyTotal,
    streak: store.getStreak(),
    settings,
    summary: store.summary(),
  };
}
