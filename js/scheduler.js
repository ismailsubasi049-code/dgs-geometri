// Hangi soru ne zaman gelecek? Dort modun soru listesini bu dosya kurar.

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
  const unseen = shuffle(all.filter((q) => store.getStat(q.id).seen === 0), rand);
  const rest = shuffle(
    all.filter((q) => store.getStat(q.id).seen > 0 && !store.isDue(q.id, today)),
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

/** Sureli mini test: her seferinde farkli, konulara yayilmis 10 soru. */
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

/** Konu secip serbest cozme. */
export async function buildTopicSet(topic) {
  const all = await loadAllQuestions();
  return shuffle(all.filter((q) => q.topic === topic));
}

/** Tek bir alt konuya odaklanma. */
export async function buildSubtopicSet(subtopicId) {
  const all = await loadAllQuestions();
  return shuffle(all.filter((q) => q.subtopicId === subtopicId));
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
