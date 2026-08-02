// Baslangic: hash router, ust bar yonetimi, service worker kaydi.

import { clear, el } from './ui.js';

const appNode = document.getElementById('app');
const titleNode = document.getElementById('topbar-title');
const rightNode = document.getElementById('topbar-right');
const backBtn = document.getElementById('back-btn');

// Ekranlar tembel yuklenir; ilk acilista sadece home.js indirilir.
const SCREENS = {
  home: () => import('./screens/home.js'),
  session: () => import('./screens/session.js'),
  result: () => import('./screens/result.js'),
  topics: () => import('./screens/topics.js'),
  formulas: () => import('./screens/formulas.js'),
  stats: () => import('./screens/stats.js'),
};

/** Bir onceki ekranin birakmasi gereken kaynaklar (zamanlayici vb.). */
let leaveCurrentScreen = null;

/** Ust bardaki geri butonunun gidecegi yer; her render'da yeniden hesaplanir. */
let backHash = '#/';

/** Hash'i yol parcalarina ayirir: "#/oturum/konu/Açılar" -> ['oturum','konu','Açılar'] */
function parseHash() {
  const raw = location.hash.replace(/^#\/?/, '');
  return raw.split('/').filter(Boolean).map(decodeURIComponent);
}

function resolve(parts) {
  const [head, ...rest] = parts;
  switch (head) {
    case undefined:      return { name: 'home', params: [] };
    case 'oturum':       return { name: 'session', params: rest };
    case 'sonuc':        return { name: 'result', params: rest };
    case 'konular':      return { name: 'topics', params: rest };
    case 'formuller':    return { name: 'formulas', params: rest };
    case 'istatistik':   return { name: 'stats', params: rest };
    default:             return { name: 'home', params: [] };
  }
}

/** Iki duzeyli ekranlarin alt sayfasindan geri, ana ekrana degil ust listeye doner. */
function backTargetFor(route) {
  if (route.params.length === 0) return '#/';
  if (route.name === 'topics') return '#/konular';
  if (route.name === 'formulas') return '#/formuller';
  return '#/';
}

export function navigate(hash) {
  if (location.hash === hash) render();
  else location.hash = hash;
}

/** Ekranlarin ust bari ve gezinmeyi kontrol etmesi icin verilen baglam. */
function makeContext(params) {
  return {
    params,
    navigate,
    setTitle(text) {
      titleNode.textContent = text;
      document.title = text === 'DGS Geometri' ? text : `${text} · DGS Geometri`;
    },
    setRight(text = '', urgent = false) {
      rightNode.textContent = text;
      rightNode.classList.toggle('urgent', Boolean(urgent));
    },
    /** Ekrandan cikilirken cagrilacak temizlik islevi. */
    onLeave(fn) {
      leaveCurrentScreen = fn;
    },
  };
}

let renderToken = 0;

async function render() {
  const token = ++renderToken;

  if (leaveCurrentScreen) {
    try { leaveCurrentScreen(); } catch { /* temizlik hatasi gezinmeyi engellemesin */ }
    leaveCurrentScreen = null;
  }

  const parts = parseHash();
  const route = resolve(parts);
  const ctx = makeContext(route.params);

  // Varsayilanlar; ekran isterse degistirir.
  ctx.setTitle('DGS Geometri');
  ctx.setRight('');
  backBtn.hidden = route.name === 'home';
  backHash = backTargetFor(route);

  try {
    const module = await SCREENS[route.name]();
    if (token !== renderToken) return; // arada baska bir gezinme oldu

    const node = await module.render(ctx);
    if (token !== renderToken) return;

    clear(appNode);
    appNode.append(node);
    window.scrollTo(0, 0);
  } catch (error) {
    if (token !== renderToken) return;
    console.error('Ekran yuklenemedi:', error);
    clear(appNode);
    appNode.append(
      el('div', { class: 'error' },
        el('strong', null, 'Bir şeyler ters gitti.'),
        el('div', { class: 'small' }, String(error && error.message ? error.message : error))
      ),
      el('div', { style: 'height:12px' }),
      el('button', { class: 'btn', on: { click: () => navigate('#/') } }, 'Ana ekrana dön')
    );
  }
}

backBtn.addEventListener('click', () => {
  // history.back() oturum ortasinda soruya geri atabiliyor; sabit hedef daha ongorulebilir.
  navigate(backHash);
});

window.addEventListener('hashchange', render);
render();

// ---------- service worker ----------

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then((reg) => {
      reg.addEventListener('updatefound', () => {
        const incoming = reg.installing;
        if (!incoming) return;
        incoming.addEventListener('statechange', () => {
          // Zaten bir kontrolcu varsa bu bir guncelleme demektir.
          if (incoming.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateBanner(reg);
          }
        });
      });
    }).catch((error) => {
      // sw.js yoksa ya da kayit reddedildiyse uygulama yine calisir, sadece offline olmaz.
      console.info('Service worker kaydedilemedi:', error.message);
    });
  });
}

function showUpdateBanner(registration) {
  const banner = document.getElementById('update-banner');
  const button = document.getElementById('update-reload');
  banner.hidden = false;
  button.addEventListener('click', () => {
    registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
    // Yeni worker devralinca sayfa bir kez yenilenir.
    navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true });
  }, { once: true });
}
