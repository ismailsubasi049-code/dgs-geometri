// Yedek akislari tek yerde:
//  - acilista ilerleme verisi bulunamazsa cikan geri yukleme kapisi,
//  - ana ekrandaki haftalik "yedegini yenile" hatirlatmasi,
//  - iki yerin de kullandigi indir / dosyadan yukle yardimcilari.
//
// Ilerleme tarayicinin localStorage'inda duruyor; tarayici verisi silindiginde
// haber vermeden gider. Bu dosya o sessiz kaybi gorunur kilar.

import { el, dayKey } from './ui.js';
import * as store from './store.js';

/** Yedegi dosya olarak indirir. Damga once vurulur ki dosyanin icinde de dogru tarih olsun. */
export function downloadBackup() {
  store.markBackupTaken();

  const blob = new Blob([store.exportJson()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = el('a', { href: url, download: `dgs-matematik-yedek-${dayKey()}.json` });

  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Dosya secici acar ve secilen yedegi yukler.
 * done(mesaj, basarili) yalnizca bir dosya secildiginde cagrilir; iptalde hic cagrilmaz.
 */
export function pickAndRestore(done) {
  const input = el('input', {
    type: 'file',
    accept: 'application/json,.json',
    style: 'display:none',
  });

  input.addEventListener('cancel', () => input.remove());
  input.addEventListener('change', async () => {
    const file = input.files && input.files[0];
    input.remove();
    if (!file) return;

    try {
      const result = store.importJson(await file.text());
      done(`Yedek yüklendi — ${result.seen} sorunun geçmişi geri geldi.`, true);
    } catch (error) {
      done(`Yüklenemedi: ${error.message}`, false);
    }
  });

  document.body.append(input);
  input.click();
}

// ---------- acilis kapisi ----------

/**
 * Ilerleme verisi yoksa sifirdan baslamadan once sorar.
 * Depolama hic calismiyorsa gosterilmez: orada geri yukleme de kalici olmaz,
 * ana ekran zaten kendi uyarisini veriyor.
 */
export function showRestoreGateIfNeeded() {
  if (!store.isPersistent() || store.hasStoredData()) return false;
  showGate();
  return true;
}

function showGate() {
  const status = el('div', { class: 'small muted' });
  const actions = el('div', { class: 'stack' });

  const gate = el('div', {
    class: 'gate',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': 'gate-title',
  },
    el('div', { class: 'gate-card', tabindex: '-1' },
      el('span', { class: 'emoji' }, '📦'),
      el('h2', { id: 'gate-title' }, 'İlerleme verisi bulunamadı.'),
      el('div', null, 'Yedekten geri yüklemek ister misin?'),
      el('div', { class: 'small muted' },
        'Uygulamayı ilk kez açıyorsan "Sıfırdan başla" de. Daha önce kullandıysan '
        + 'tarayıcı verilerin silinmiş olabilir — elindeki yedek dosyasıyla her şey geri gelir.'),
      actions,
      status
    )
  );

  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  function close() {
    document.body.style.overflow = previousOverflow;
    gate.remove();
  }

  const restoreButton = el('button', {
    class: 'btn primary',
    type: 'button',
    on: {
      click: () => {
        status.textContent = '';
        pickAndRestore((message, ok) => {
          status.textContent = message;
          // Yuklenen veriyle her ekranin bastan kurulmasi gerekiyor.
          if (ok) setTimeout(() => location.reload(), 600);
        });
      },
    },
  }, '⬆ Yedekten geri yükle');

  const freshButton = el('button', {
    class: 'btn',
    type: 'button',
    on: {
      click: () => {
        // Bos durumu hemen yaz: anahtar olusur, kapi bir daha acilmaz.
        store.persist();
        close();
      },
    },
  }, 'Sıfırdan başla');

  actions.append(restoreButton, freshButton);
  document.body.append(gate);
  gate.firstChild.focus();
}

// ---------- haftalik hatirlatma ----------

/**
 * Ana ekrana konacak yedek hatirlatmasi. Sirasi gelmediyse null doner,
 * boylece cagiran taraf kosul yazmadan dogrudan ekleyebilir.
 */
export function backupReminder() {
  const info = store.backupStatus();
  if (!info.due) return null;

  const text = info.lastAt
    ? `En son ${info.sinceDays} gün önce yedek aldın, yenilemek ister misin?`
    : `${info.sinceDays} gündür çalışıyorsun ama hiç yedek almadın.`;

  const notice = el('div', { class: 'notice' });
  const message = el('div', null, text);

  const buttons = el('div', { class: 'btn-row' },
    el('button', {
      class: 'btn primary',
      type: 'button',
      on: {
        click: () => {
          downloadBackup();
          buttons.remove();
          message.textContent = '✓ Yedek indirildi.';
        },
      },
    }, '⬇ Yedeği indir'),
    el('button', {
      class: 'btn',
      type: 'button',
      on: {
        click: () => {
          store.snoozeBackupReminder();
          notice.remove();
        },
      },
    }, 'Sonra')
  );

  notice.append(message, buttons);
  return notice;
}
