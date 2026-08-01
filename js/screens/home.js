// Ana ekran: gunun durumu, seri ve dort mod karti.

import { el } from '../ui.js';
import { overview } from '../scheduler.js';
import { isPersistent } from '../store.js';

function modeCard({ emoji, title, sub, badge, badgeQuiet, disabled, onClick }) {
  return el('button', {
    class: 'mode-card',
    type: 'button',
    disabled: Boolean(disabled),
    on: { click: onClick },
  },
    el('span', { class: 'emoji' }, emoji),
    el('span', { class: 'body' },
      el('span', { class: 'title' }, title),
      el('span', { class: 'sub' }, sub)
    ),
    badge !== null && badge !== undefined
      ? el('span', { class: `badge${badgeQuiet ? ' quiet' : ''}` }, String(badge))
      : null
  );
}

export async function render(ctx) {
  ctx.setTitle('DGS Geometri');

  const data = await overview();
  const root = el('div', { class: 'stack' });

  if (!isPersistent()) {
    root.append(el('div', { class: 'error small' },
      'Tarayıcı depolamaya izin vermiyor — ilerlemen bu oturumdan sonra kaybolacak.'));
  }

  // ---------- gunun durumu ----------

  const dailyDone = Math.min(data.dailyDone, data.dailyTotal);
  const dailyPercent = data.dailyTotal > 0 ? (dailyDone / data.dailyTotal) * 100 : 0;
  const dailyFinished = data.dailyTotal > 0 && dailyDone >= data.dailyTotal;

  root.append(
    el('div', { class: 'hero' },
      el('div', { class: 'row' },
        el('div', null,
          el('div', { class: 'small muted' }, 'Bugün'),
          el('div', { class: 'big' }, `${dailyDone} / ${data.dailyTotal} soru`)
        ),
        el('div', { class: 'center' },
          el('div', { class: 'big' }, `🔥 ${data.streak.current}`),
          el('div', { class: 'small muted' }, 'günlük seri')
        )
      ),
      el('div', { class: 'progressbar' }, el('i', { style: `width:${dailyPercent}%` })),
      dailyFinished
        ? el('div', { class: 'small', style: 'margin-top:8px;color:var(--ok)' },
            `Günlük rutin tamam — ${data.dailyCorrect} doğru. En iyi serin: ${data.streak.best} gün.`)
        : null
    )
  );

  // ---------- modlar ----------

  root.append(
    modeCard({
      emoji: '📅',
      title: dailyFinished ? 'Günlük rutini tekrar aç' : 'Günlük 10 soru',
      sub: dailyFinished
        ? 'Bugünün setini yeniden gözden geçir'
        : `Tekrar zamanı gelen ${data.dueCount} soru öncelikli`,
      badge: data.dailyTotal - dailyDone > 0 ? data.dailyTotal - dailyDone : '✓',
      badgeQuiet: dailyFinished,
      disabled: data.total === 0,
      onClick: () => ctx.navigate('#/oturum/gunluk'),
    })
  );

  root.append(
    modeCard({
      emoji: '🔁',
      title: 'Sadece yanlışlarım',
      sub: data.wrongCount > 0
        ? 'Üst üste 2 doğru cevaplayınca listeden düşer'
        : 'Şu an tekrar edilecek yanlış yok',
      badge: data.wrongCount,
      badgeQuiet: data.wrongCount === 0,
      disabled: data.wrongCount === 0,
      onClick: () => ctx.navigate('#/oturum/yanlis'),
    })
  );

  root.append(
    modeCard({
      emoji: '⏱️',
      title: 'Süreli mini test',
      sub: `10 soru · ${data.settings.testMinutes} dakika · çözümler sonda`,
      badge: null,
      disabled: data.total === 0,
      onClick: () => ctx.navigate('#/oturum/test'),
    })
  );

  root.append(
    modeCard({
      emoji: '📚',
      title: 'Konu seçip çöz',
      sub: `${data.topics.length} konu · ${data.total} soru · süresiz`,
      badge: null,
      disabled: data.total === 0,
      onClick: () => ctx.navigate('#/konular'),
    })
  );

  // ---------- alt satir ----------

  root.append(
    el('button', {
      class: 'row-item',
      type: 'button',
      style: 'margin-top:6px',
      on: { click: () => ctx.navigate('#/istatistik') },
    },
      el('span', null, '📊'),
      el('span', { class: 'grow' },
        el('div', null, 'İstatistik ve ayarlar'),
        el('div', { class: 'small muted' },
          `${data.summary.seen} soru denendi · ${data.summary.mastered} tanesi pekişti`)
      ),
      el('span', { class: 'muted' }, '›')
    )
  );

  if (data.total === 0) {
    root.append(el('div', { class: 'error small' },
      'Hiç soru yüklenemedi. data/index.json ve paket dosyalarını kontrol et.'));
  }

  return root;
}
