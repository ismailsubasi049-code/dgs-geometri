// Konu secimi - iki duzeyli. Liste data/index.json'dan turer; yeni paket eklenince
// kendiliginden buyur. Alt konusu olan konu ara bir listeye acilir, olmayan dogrudan oturuma.

import { el, emptyState } from '../ui.js';
import { listTopics, loadAllQuestions } from '../packs.js';
import { getStat } from '../store.js';

/** Bir soru listesinin ilerleme ozeti. */
function progressOf(questions) {
  const entry = { total: questions.length, seen: 0, mastered: 0 };
  for (const question of questions) {
    const stat = getStat(question.id);
    if (stat.seen > 0) entry.seen += 1;
    if (stat.box >= 5) entry.mastered += 1;
  }
  entry.percent = entry.total > 0 ? Math.round((entry.mastered / entry.total) * 100) : 0;
  return entry;
}

/** Ilerleme cubuklu liste satiri. */
function progressRow({ title, sub, progress, disabled, onClick }) {
  return el('button', {
    class: 'row-item',
    type: 'button',
    disabled: Boolean(disabled),
    on: { click: onClick },
  },
    el('span', { class: 'grow' },
      el('div', { style: 'font-weight:600' }, title),
      el('div', { class: 'small muted' }, sub),
      el('div', { class: 'meter' }, el('i', { class: 'ok', style: `width:${progress.percent}%` }))
    ),
    el('span', { class: 'muted' }, '›')
  );
}

/** Ust duzey: konu listesi. */
function renderTopicList(ctx, topics, byTopicId) {
  const list = el('div', { class: 'list' });

  for (const topic of topics) {
    const questions = byTopicId.get(topic.topicId) || [];
    const progress = progressOf(questions);
    const hasSubtopics = topic.subtopics.length > 0;

    const parts = [];
    if (hasSubtopics) parts.push(`${topic.subtopics.length} alt konu`);
    parts.push(`${progress.total} soru`, `${progress.mastered} pekişti`);

    list.append(progressRow({
      title: topic.topic,
      sub: parts.join(' · '),
      progress,
      disabled: progress.total === 0,
      onClick: () => ctx.navigate(hasSubtopics
        ? `#/konular/${encodeURIComponent(topic.topicId)}`
        : `#/oturum/konu/${encodeURIComponent(topic.topic)}`),
    }));
  }

  return el('div', { class: 'stack' },
    el('div', { class: 'small muted' }, 'Seçtiğin konudaki sorular karışık sırayla, süresiz gelir.'),
    list
  );
}

/** Alt duzey: bir konunun alt konulari. */
function renderSubtopicList(ctx, topic, questions) {
  const bySubtopic = new Map();
  for (const question of questions) {
    if (!question.subtopicId) continue;
    if (!bySubtopic.has(question.subtopicId)) bySubtopic.set(question.subtopicId, []);
    bySubtopic.get(question.subtopicId).push(question);
  }

  const whole = progressOf(questions);
  const list = el('div', { class: 'list' });

  // Once "tamami" satiri: alt konu ayrimi yapmadan konunun tumunu cozmek icin.
  list.append(progressRow({
    title: 'Tüm konu',
    sub: `${whole.total} soru karışık · ${whole.mastered} pekişti`,
    progress: whole,
    disabled: whole.total === 0,
    onClick: () => ctx.navigate(`#/oturum/konu/${encodeURIComponent(topic.topic)}`),
  }));

  for (const { subtopicId, subtopic } of topic.subtopics) {
    const own = bySubtopic.get(subtopicId) || [];
    const progress = progressOf(own);

    list.append(progressRow({
      title: subtopic,
      sub: `${progress.total} soru · ${progress.seen} denendi · ${progress.mastered} pekişti`,
      progress,
      disabled: progress.total === 0,
      onClick: () => ctx.navigate(`#/oturum/altkonu/${encodeURIComponent(subtopicId)}`),
    }));
  }

  return el('div', { class: 'stack' },
    el('div', { class: 'small muted' },
      `${topic.subtopics.length} alt konu. Zayıf olduğun başlığa doğrudan çalışabilirsin.`),
    list
  );
}

export async function render(ctx) {
  const [topics, all] = await Promise.all([listTopics(), loadAllQuestions()]);

  // Konu basina gercek soru listesi (index.json'daki count yerine yuklenen veri).
  const byTopicId = new Map();
  for (const question of all) {
    const key = question.topicId || question.topic;
    if (!byTopicId.has(key)) byTopicId.set(key, []);
    byTopicId.get(key).push(question);
  }

  const requestedId = ctx.params[0];
  const topic = requestedId ? topics.find((t) => t.topicId === requestedId) : null;

  if (topic && topic.subtopics.length > 0) {
    ctx.setTitle(topic.topic);
    return renderSubtopicList(ctx, topic, byTopicId.get(topic.topicId) || []);
  }

  ctx.setTitle('Konu seç');

  if (topics.length === 0) {
    return el('div', { class: 'stack' },
      emptyState('📭', 'Konu bulunamadı', 'Yüklü bir soru paketi yok.'),
      el('button', { class: 'btn primary', on: { click: () => ctx.navigate('#/') } }, 'Ana ekrana dön')
    );
  }

  return renderTopicList(ctx, topics, byTopicId);
}
