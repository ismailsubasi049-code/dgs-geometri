// Konu secimi - uc duzeyli: ders -> konu -> alt konu. Liste data/index.json'dan turer;
// yeni paket eklenince kendiliginden buyur. Alt konusu olan konu ara bir listeye acilir,
// olmayan dogrudan oturuma.
//
// Rota: #/konular/{branchId}/{topicId}. Ders parcasi olmayan eski baglantilar
// (#/konular/{topicId}) da calismaya devam eder.

import { el, emptyState } from '../ui.js';
import { listBranches, listTopics, loadAllQuestions } from '../packs.js';
import { getStat, MAX_BOX } from '../store.js';
import { isActive } from '../scheduler.js';

/**
 * Bir soru listesinin ilerleme ozeti.
 * remaining: su an havuza girecek soru sayisi.
 * pending: son denemesi yanlis olanlar - havuz bos olsa bile "tamamlandi" denemez.
 */
function progressOf(questions) {
  const entry = { total: questions.length, seen: 0, mastered: 0, remaining: 0, pending: 0 };
  for (const question of questions) {
    const stat = getStat(question.id);
    if (stat.seen > 0) entry.seen += 1;
    if (stat.box >= MAX_BOX) entry.mastered += 1;
    if (stat.lastWrong) entry.pending += 1;
    if (isActive(question)) entry.remaining += 1;
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

/** En ust duzey: ders listesi. Yalnizca derin baglantiyla #/konular'a gelinirse gorunur. */
function renderBranchList(ctx, branches, topics) {
  const list = el('div', { class: 'list' });

  for (const branch of branches) {
    const own = topics.filter((topic) => topic.branchId === branch.id);
    const count = own.reduce((sum, topic) => sum + topic.count, 0);

    list.append(
      el('button', {
        class: 'row-item',
        type: 'button',
        disabled: own.length === 0,
        on: { click: () => ctx.navigate(`#/konular/${encodeURIComponent(branch.id)}`) },
      },
        el('span', null, branch.emoji || '📘'),
        el('span', { class: 'grow' },
          el('div', { style: 'font-weight:600' }, branch.title),
          el('div', { class: 'small muted' }, own.length > 0
            ? `${own.length} konu · ${count} soru`
            : 'Soru paketleri henüz eklenmedi')
        ),
        el('span', { class: 'muted' }, '›')
      )
    );
  }

  return el('div', { class: 'stack' },
    el('div', { class: 'small muted' }, 'Hangi dersten çalışacaksın?'),
    list
  );
}

/** Orta duzey: bir dersin konu listesi. */
function renderTopicList(ctx, branchId, topics, byTopicId) {
  const list = el('div', { class: 'list' });

  for (const topic of topics) {
    const questions = byTopicId.get(topic.topicId) || [];
    const progress = progressOf(questions);
    const hasSubtopics = topic.subtopics.length > 0;

    const parts = [];
    if (hasSubtopics) parts.push(`${topic.subtopics.length} alt konu`);
    parts.push(`${progress.total} soru`, `${progress.remaining} çalışılacak`);

    list.append(progressRow({
      title: topic.topic,
      sub: parts.join(' · '),
      progress,
      disabled: progress.total === 0,
      onClick: () => ctx.navigate(hasSubtopics
        ? `#/konular/${encodeURIComponent(branchId)}/${encodeURIComponent(topic.topicId)}`
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
    sub: `${whole.total} soru karışık · ${whole.remaining} çalışılacak`,
    progress: whole,
    disabled: whole.total === 0,
    onClick: () => ctx.navigate(`#/oturum/konu/${encodeURIComponent(topic.topic)}`),
  }));

  for (const { subtopicId, subtopic } of topic.subtopics) {
    const own = bySubtopic.get(subtopicId) || [];
    const progress = progressOf(own);

    // Havuz bosken bile yanlisi olan sorular varsa "tamamlandi" demek yaniltici olur;
    // onlar ayni gun geri gelmiyor ama tekrar sirasinda bekliyor.
    const tail = `${progress.total} soru · ${progress.mastered} pekişti`;
    let sub;
    if (progress.remaining > 0) sub = `${progress.remaining} çalışılacak · ${tail}`;
    else if (progress.pending > 0) sub = `${progress.pending} yanlış tekrar bekliyor · ${tail}`;
    else sub = `Tamamlandı · ${tail}`;

    list.append(progressRow({
      title: subtopic,
      sub,
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
  const [branches, topics, all] = await Promise.all([
    listBranches(), listTopics(), loadAllQuestions(),
  ]);

  // Konu basina gercek soru listesi (index.json'daki count yerine yuklenen veri).
  const byTopicId = new Map();
  for (const question of all) {
    const key = question.topicId || question.topic;
    if (!byTopicId.has(key)) byTopicId.set(key, []);
    byTopicId.get(key).push(question);
  }

  const [first, second] = ctx.params;
  const branch = first ? branches.find((b) => b.id === first) : null;

  // Ders parcasi olmayan eski baglanti: ilk parca dogrudan konu kimligi olabilir.
  const topicId = second || (branch ? null : first);
  const topic = topicId ? topics.find((t) => t.topicId === topicId) : null;

  if (topic && topic.subtopics.length > 0) {
    ctx.setTitle(topic.topic);
    return renderSubtopicList(ctx, topic, byTopicId.get(topic.topicId) || []);
  }

  if (branch) {
    ctx.setTitle(branch.title);
    const own = topics.filter((t) => t.branchId === branch.id);

    if (own.length === 0) {
      return el('div', { class: 'stack' },
        emptyState('🧩', `${branch.title} soru paketleri henüz eklenmedi`,
          'Formül kartları hazır — konuya oradan bakabilirsin.'),
        el('button', {
          class: 'btn primary',
          on: { click: () => ctx.navigate(`#/formuller/${encodeURIComponent(branch.id)}`) },
        }, `${branch.title} formülleri`)
      );
    }

    return renderTopicList(ctx, branch.id, own, byTopicId);
  }

  ctx.setTitle('Konu seç');

  if (topics.length === 0) {
    return el('div', { class: 'stack' },
      emptyState('📭', 'Konu bulunamadı', 'Yüklü bir soru paketi yok.'),
      el('button', { class: 'btn primary', on: { click: () => ctx.goHome() } }, 'Ana ekrana dön')
    );
  }

  return renderBranchList(ctx, branches, topics);
}
