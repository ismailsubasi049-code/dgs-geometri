// Formul kartlarini yukler ve bellekte tutar. packs.js ile ayni deseni izler.
//
// Genisleme noktasi: data/formuller/index.json. Yeni bir konu seti eklemek icin
// data/formuller/ altina JSON koymak ve index.json'a bir satir yazmak yeterli.
//
// Bir kart soruya iki yoldan baglanir: alt konusu olan pakette subtopicId ile,
// duz konuda ise sorunun subtopic/label metni kartin aliases listesiyle eslesir.
//
// Setlerin ustunde bir ders (brans) duzeyi var. Brans listesi packs.js'ten degil kendi
// index.json'undan okunur - formuller bolumu soru paketlerinden bagimsiz kalsin diye.

const INDEX_URL = './data/formuller/index.json';
const DATA_ROOT = './data/formuller/';

/** branchId yazmayan eski kayitlarin dustugu ders. */
const DEFAULT_BRANCH = 'geo';

let indexPromise = null;
const setPromises = new Map();
const cardsBySubtopic = new Map();
const cardsByAlias = new Map();

async function fetchJson(url) {
  const response = await fetch(url, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`${url} yüklenemedi (HTTP ${response.status})`);
  return response.json();
}

/** data/formuller/index.json - konu seti kayitlari. */
export function loadFormulaIndex() {
  if (!indexPromise) {
    indexPromise = fetchJson(INDEX_URL).then((data) => {
      const sets = (Array.isArray(data.sets) ? data.sets : [])
        .map((set) => ({ ...set, branchId: set.branchId || DEFAULT_BRANCH }));
      const branches = Array.isArray(data.branches) ? data.branches : [];
      return { schemaVersion: data.schemaVersion || 1, branches, sets };
    }).catch((error) => {
      indexPromise = null; // sonraki denemede tekrar sansi olsun
      throw error;
    });
  }
  return indexPromise;
}

/** Bir kartin kullanilabilir olmasi icin gereken en az alanlar. */
function isValidCard(card, setId) {
  const problems = [];
  if (!card.id) problems.push('id yok');
  if (!card.title) problems.push('title yok');
  if (!Array.isArray(card.items) || card.items.length === 0) problems.push('items eksik');

  if (problems.length > 0) {
    console.warn(`Formül kartı atlandı (${setId} / ${card.id || '?'}): ${problems.join(', ')}`);
    return false;
  }
  return true;
}

/** Tek bir konu setini yukler; kartlar alt konu ve takma adla aranabilir hale gelir. */
export function loadFormulaSet(entry) {
  const key = entry.topicId;
  if (!setPromises.has(key)) {
    const promise = fetchJson(DATA_ROOT + entry.file).then((data) => {
      const raw = Array.isArray(data.cards) ? data.cards : [];
      const cards = raw.filter((c) => isValidCard(c, key)).map((c) => ({
        ...c,
        topicId: c.topicId || data.topicId || entry.topicId,
        topicTitle: data.title || entry.title,
      }));

      for (const card of cards) {
        if (card.subtopicId) cardsBySubtopic.set(card.subtopicId, card);
        for (const alias of card.aliases || []) cardsByAlias.set(alias, card);
      }
      return cards;
    }).catch((error) => {
      setPromises.delete(key);
      throw error;
    });
    setPromises.set(key, promise);
  }
  return setPromises.get(key);
}

/** Tum kartlari yukler. Bir set bozuksa digerleri yine calisir. */
export async function loadAllCards() {
  const { sets } = await loadFormulaIndex();
  const results = await Promise.allSettled(sets.map(loadFormulaSet));

  const cards = [];
  for (let i = 0; i < results.length; i++) {
    if (results[i].status === 'fulfilled') {
      cards.push(...results[i].value);
    } else {
      console.error(`Formül seti yüklenemedi: ${sets[i].topicId}`, results[i].reason);
    }
  }
  return cards;
}

/**
 * Bir soruya ait formul karti. Senkrondur - once loadAllCards() cagrilmis olmali.
 * Kart bulunamazsa null doner ve cagiran taraf hicbir sey gostermez.
 */
export function getCardFor(question) {
  if (!question) return null;
  if (question.subtopicId && cardsBySubtopic.has(question.subtopicId)) {
    return cardsBySubtopic.get(question.subtopicId);
  }
  for (const alias of [question.subtopic, question.label]) {
    if (alias && cardsByAlias.has(alias)) return cardsByAlias.get(alias);
  }
  return null;
}

/**
 * Formul setlerinin ders listesi. branches yazilmamissa setlerin branchId'lerinden turetilir.
 * Donen her kayit: { id, title, emoji }
 */
export async function listFormulaBranches() {
  const { branches, sets } = await loadFormulaIndex();
  if (branches.length > 0) return branches;

  const seen = new Map();
  for (const set of sets) {
    if (!seen.has(set.branchId)) seen.set(set.branchId, { id: set.branchId, title: set.branchId, emoji: '📘' });
  }
  return [...seen.values()];
}

/** Formuller ekranindaki konu listesi. branchId verilirse yalnizca o dersin setleri. */
export async function listFormulaSets(branchId = null) {
  const { sets } = await loadFormulaIndex();
  return branchId ? sets.filter((set) => set.branchId === branchId) : sets;
}

/** Tek bir konunun kartlari - Formuller ekraninin alt sayfasi bunu kullanir. */
export async function loadSetByTopicId(topicId) {
  const { sets } = await loadFormulaIndex();
  const entry = sets.find((set) => set.topicId === topicId);
  if (!entry) return null;
  return { title: entry.title, topicId: entry.topicId, cards: await loadFormulaSet(entry) };
}
