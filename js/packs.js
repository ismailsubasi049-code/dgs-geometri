// Soru paketlerini yukler ve bellekte tutar.
//
// Genisleme noktasi: data/index.json. Yeni bir paket eklemek icin data/packs/ altina JSON
// koymak ve index.json'a bir kayit satiri yazmak yeterli - bu dosya dahil hicbir kod degismez.

const INDEX_URL = './data/index.json';
const DATA_ROOT = './data/';

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
      return { schemaVersion: data.schemaVersion || 1, packs };
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

/** Konu basina paket ve soru sayisi - konu secim ekrani bunu kullanir. */
export async function listTopics() {
  const { packs } = await loadIndex();
  const byTopic = new Map();

  for (const pack of packs) {
    const topic = pack.topic || pack.title;
    if (!byTopic.has(topic)) byTopic.set(topic, { topic, packIds: [], count: 0 });
    const entry = byTopic.get(topic);
    entry.packIds.push(pack.id);
    entry.count += pack.count || 0;
  }

  return [...byTopic.values()];
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
