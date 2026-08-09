// Soru paketlerini yukler ve bellekte tutar.
//
// Genisleme noktasi: data/index.json. Yeni bir paket eklemek icin data/packs/ altina JSON
// koymak ve index.json'a bir kayit satiri yazmak yeterli - bu dosya dahil hicbir kod degismez.
//
// Bir paket ya bir konunun tamami (duz konu) ya da bir alt konudur. Alt konu paketinde
// index.json kaydinda subtopicId/subtopic alanlari bulunur; duz konuda bulunmaz.
//
// Konularin ustunde bir ders (brans) duzeyi var: index.json'daki branches dizisi. Her konu
// bir branchId tasir; yazmayan konu geometri sayilir, boylece eski veri kirilmaz.

const INDEX_URL = './data/index.json';
const DATA_ROOT = './data/';

/** branchId yazmayan eski kayitlarin dustugu ders. */
const DEFAULT_BRANCH = 'geo';

let indexPromise = null;
const packPromises = new Map();
const questionsById = new Map();

async function fetchJson(url) {
  const response = await fetch(url, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`${url} yüklenemedi (HTTP ${response.status})`);
  return response.json();
}

/** data/index.json - paket kayitlari. */
export function loadIndex() {
  if (!indexPromise) {
    indexPromise = fetchJson(INDEX_URL).then((data) => {
      const packs = Array.isArray(data.packs) ? data.packs : [];
      // topics dizisi konu sirasini ve kararli konu id'sini verir; yoksa paketlerden turetilir.
      const topics = Array.isArray(data.topics) ? data.topics : [];
      const branches = Array.isArray(data.branches) ? data.branches : [];
      return { schemaVersion: data.schemaVersion || 1, branches, topics, packs };
    }).catch((error) => {
      indexPromise = null; // sonraki denemede tekrar sansi olsun
      throw error;
    });
  }
  return indexPromise;
}

/** Bir sorunun kullanilabilir olmasi icin gereken en az alanlar. */
function isValidQuestion(question, packId) {
  const problems = [];
  if (!question.id) problems.push('id yok');
  if (!question.stem) problems.push('stem yok');
  if (!question.asks) problems.push('asks yok');
  if (!Array.isArray(question.choices) || question.choices.length < 2) problems.push('choices eksik');
  if (!Number.isInteger(question.answer)) problems.push('answer tam sayı değil');
  else if (Array.isArray(question.choices) &&
           (question.answer < 0 || question.answer >= question.choices.length)) {
    problems.push('answer aralık dışı');
  }

  if (problems.length > 0) {
    console.warn(`Soru atlandı (${packId} / ${question.id || '?'}): ${problems.join(', ')}`);
    return false;
  }
  return true;
}

/** Tek bir paketi yukler; sorular id ile aranabilir hale gelir. */
export function loadPack(entry) {
  const id = entry.id;
  if (!packPromises.has(id)) {
    const promise = fetchJson(DATA_ROOT + entry.file).then((data) => {
      const raw = Array.isArray(data.questions) ? data.questions : [];
      const questions = raw.filter((q) => isValidQuestion(q, id)).map((q) => ({
        ...q,
        packId: id,
        topic: q.topic || entry.topic || entry.title,
        topicId: q.topicId || entry.topicId || null,
        // Alt konu paketinde her sorunun alt konusu paketten devralinir.
        subtopicId: q.subtopicId || entry.subtopicId || null,
        subtopic: q.subtopic || entry.subtopic || null,
      }));
      for (const question of questions) questionsById.set(question.id, question);
      return questions;
    }).catch((error) => {
      packPromises.delete(id);
      throw error;
    });
    packPromises.set(id, promise);
  }
  return packPromises.get(id);
}

/** Tum paketleri yukler. Bir paket bozuksa digerleri yine calisir. */
export async function loadAllQuestions() {
  const { packs } = await loadIndex();
  const results = await Promise.allSettled(packs.map(loadPack));

  const questions = [];
  for (let i = 0; i < results.length; i++) {
    if (results[i].status === 'fulfilled') {
      questions.push(...results[i].value);
    } else {
      console.error(`Paket yüklenemedi: ${packs[i].id}`, results[i].reason);
    }
  }
  return questions;
}

/** Yalnizca belirli paketlerin sorulari. */
export async function loadQuestionsFromPacks(packIds) {
  const { packs } = await loadIndex();
  const wanted = packs.filter((p) => packIds.includes(p.id));
  const lists = await Promise.all(wanted.map(loadPack));
  return lists.flat();
}

/**
 * Ders listesi. branches yazilmamissa konularin branchId'lerinden turetilir, boylece
 * eski bir index.json ile de calisir.
 * Donen her kayit: { id, title, emoji }
 */
export async function listBranches() {
  const { branches, topics } = await loadIndex();
  if (branches.length > 0) return branches;

  const seen = new Map();
  for (const topic of topics) {
    const id = topic.branchId || DEFAULT_BRANCH;
    if (!seen.has(id)) seen.set(id, { id, title: id, emoji: '📘' });
  }
  return [...seen.values()];
}

/**
 * Konu basina paket, alt konu ve soru sayisi - konu secim ekrani bunu kullanir.
 * Donen her kayit: { topicId, topic, branchId, packIds, count, subtopics[] }
 * subtopics bos ise o konu duzdur (alt konusu yoktur).
 */
export async function listTopics() {
  const { topics, packs } = await loadIndex();
  const byId = new Map();

  // Once index.json'daki sirayi kur, sonra paketleri ilgili konuya dagit.
  for (const topic of topics) {
    byId.set(topic.id, {
      topicId: topic.id,
      topic: topic.title,
      branchId: topic.branchId || DEFAULT_BRANCH,
      packIds: [],
      count: 0,
      subtopics: [],
    });
  }

  for (const pack of packs) {
    const title = pack.topic || pack.title;
    // topicId yoksa (eski sema) gorunen ad kimlik yerine gecer.
    const id = pack.topicId || title;
    if (!byId.has(id)) {
      byId.set(id, {
        topicId: id,
        topic: title,
        branchId: pack.branchId || DEFAULT_BRANCH,
        packIds: [],
        count: 0,
        subtopics: [],
      });
    }

    const entry = byId.get(id);
    const count = pack.count || 0;
    entry.packIds.push(pack.id);
    entry.count += count;

    if (pack.subtopicId) {
      entry.subtopics.push({
        subtopicId: pack.subtopicId,
        subtopic: pack.subtopic || pack.title,
        packId: pack.id,
        count,
      });
    }
  }

  // topics'te yazili ama paketi olmayan konu listede gorunmesin.
  return [...byId.values()].filter((entry) => entry.packIds.length > 0);
}

/** Yuklenmis sorulardan id ile arama. Once ilgili paketin yuklenmis olmasi gerekir. */
export function getLoadedQuestion(id) {
  return questionsById.get(id) || null;
}

/** Verilen id'lerin sorularini dondurur; eksik olanlari (silinmis paket) atlar. */
export async function resolveQuestions(ids) {
  if (ids.some((id) => !questionsById.has(id))) await loadAllQuestions();
  return ids.map((id) => questionsById.get(id)).filter(Boolean);
}
