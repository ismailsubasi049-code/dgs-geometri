// Istatistik, ayarlar ve yedekleme.
//
// Ilerleme localStorage'da duruyor; tarayici verisi temizlenirse gider.
// Bu yuzden disa/ice aktarma burada.

import { el, dayKey } from '../ui.js';
import { loadAllQuestions } from '../packs.js';
import { downloadBackup, pickAndRestore } from '../backup.js';
import * as store from '../store.js';

function statBox(label, value, hint = null) {
  return el('div', { class: 'stat' },
    el('div', { class: 'k' }, label),
    el('div', { class: 'v' }, String(value)),
    hint ? el('div', { class: 'small muted' }, hint) : null
  );
}

function settingsSection(onChanged) {
  const settings = store.getSettings();

  const dailyInput = el('input', {
    type: 'number', min: '3', max: '40', step: '1', value: String(settings.dailyCount),
    on: {
      change: (event) => {
        const value = Math.min(40, Math.max(3, Number(event.target.value) || 10));
        event.target.value = String(value);
        store.setSetting('dailyCount', value);
        onChanged();
      },
    },
  });

  const minutesInput = el('input', {
    type: 'number', min: '3', max: '60', step: '1', value: String(settings.testMinutes),
    on: {
      change: (event) => {
        const value = Math.min(60, Math.max(3, Number(event.target.value) || 12));
        event.target.value = String(value);
        store.setSetting('testMinutes', value);
        onChanged();
      },
    },
  });

  const instantInput = el('input', {
    type: 'checkbox',
    checked: settings.instantChoices,
    on: { change: (event) => store.setSetting('instantChoices', event.target.checked) },
  });

  return el('div', { class: 'stack' },
    el('h2', { style: 'font-size:1rem' }, 'Ayarlar'),
    el('label', { class: 'switch-row' },
      el('span', { class: 'grow' },
        el('div', null, 'Günlük soru sayısı'),
        el('div', { class: 'small muted' }, 'Günlük rutinde kaç soru gelsin')),
      dailyInput
    ),
    el('label', { class: 'switch-row' },
      el('span', { class: 'grow' },
        el('div', null, 'Mini test süresi'),
        el('div', { class: 'small muted' }, 'Dakika cinsinden geri sayım')),
      minutesInput
    ),
    el('label', { class: 'switch-row' },
      el('span', { class: 'grow' },
        el('div', null, 'Şıkları hemen aç'),
        el('div', { class: 'small muted' },
          'Kapalıyken şıklar "Soru ne istiyor?" satırını açana kadar pasif kalır')),
      instantInput
    )
  );
}

/** "Son yedek" satiri: hatirlatmanin saydigi gunle ayni kaynaktan gelir. */
function lastBackupLine() {
  const { lastAt, sinceDays } = store.backupStatus();
  if (!lastAt) return 'Henüz hiç yedek almadın.';
  if (sinceDays === 0) return 'Son yedek: bugün.';
  if (sinceDays === 1) return 'Son yedek: dün.';
  return `Son yedek: ${sinceDays} gün önce.`;
}

function backupSection(rerender) {
  const status = el('div', { class: 'small muted' }, lastBackupLine());

  const exportButton = el('button', {
    class: 'btn',
    type: 'button',
    on: {
      click: () => {
        downloadBackup();
        status.textContent = 'Yedek indirildi.';
      },
    },
  }, '⬇ Yedeği indir');

  const importButton = el('button', {
    class: 'btn',
    type: 'button',
    on: {
      click: () => {
        pickAndRestore((message, ok) => {
          status.textContent = message;
          if (ok) rerender();
        });
      },
    },
  }, '⬆ Yedekten geri yükle');

  const resetButton = el('button', {
    class: 'btn danger',
    type: 'button',
    on: {
      click: () => {
        const ok = window.confirm(
          'Tüm ilerleme silinecek: çözüm geçmişi, seri ve tekrar takvimi. Bu geri alınamaz. Emin misin?'
        );
        if (!ok) return;
        store.resetAll();
        status.textContent = 'İlerleme sıfırlandı.';
        rerender();
      },
    },
  }, 'İlerlemeyi sıfırla');

  return el('div', { class: 'stack' },
    el('h2', { style: 'font-size:1rem' }, 'Yedekleme'),
    el('div', { class: 'small muted' },
      'İlerleme telefonun tarayıcısında saklanıyor. Tarayıcı verilerini temizlersen ya da telefon değiştirirsen gider — arada bir yedek al.'),
    exportButton,
    importButton,
    status,
    el('div', { style: 'height:8px' }),
    resetButton
  );
}

export async function render(ctx) {
  ctx.setTitle('İstatistik ve ayarlar');

  const all = await loadAllQuestions();
  const summary = store.summary();
  const streak = store.getStreak();
  const today = dayKey();

  const accuracy = summary.attempts > 0
    ? Math.round((summary.correct / summary.attempts) * 100)
    : 0;
  const dueToday = all.filter((q) => store.isDue(q.id, today)).length;

  const root = el('div', { class: 'stack' });

  root.append(
    el('div', { class: 'stat-grid' },
      statBox('Doğruluk', `%${accuracy}`, `${summary.correct} / ${summary.attempts} deneme`),
      statBox('Denenen soru', `${summary.seen} / ${all.length}`),
      statBox('Pekişen', summary.mastered, '5. kutuya ulaşan'),
      statBox('Tekrar bekleyen', summary.pending, 'yanlış listesinde'),
      statBox('Bugün vadesi gelen', dueToday),
      statBox('Seri', `${streak.current} gün`, `en iyi: ${streak.best}`)
    )
  );

  // Konu bazinda dogruluk
  const byTopic = new Map();
  for (const question of all) {
    const stat = store.getStat(question.id);
    if (!byTopic.has(question.topic)) byTopic.set(question.topic, { correct: 0, attempts: 0, total: 0 });
    const entry = byTopic.get(question.topic);
    entry.total += 1;
    entry.correct += stat.correct;
    entry.attempts += stat.correct + stat.wrong;
  }

  const topicRows = [...byTopic.entries()].filter(([, entry]) => entry.attempts > 0);

  if (topicRows.length > 0) {
    const list = el('div', { class: 'list' });
    for (const [topic, entry] of topicRows) {
      const percent = Math.round((entry.correct / entry.attempts) * 100);
      list.append(
        el('div', { class: 'card' },
          el('div', { style: 'display:flex;justify-content:space-between;gap:10px' },
            el('span', null, topic),
            el('span', { class: 'muted small' }, `%${percent} · ${entry.attempts} deneme`)),
          el('div', { class: 'meter' },
            el('i', { class: percent >= 70 ? 'ok' : 'bad', style: `width:${percent}%` }))
        )
      );
    }
    root.append(el('h2', { style: 'font-size:1rem;margin-top:6px' }, 'Konulara göre'), list);
  }

  root.append(
    el('div', { style: 'height:8px' }),
    settingsSection(() => {}),
    el('div', { style: 'height:8px' }),
    backupSection(() => location.reload())
  );

  return root;
}
