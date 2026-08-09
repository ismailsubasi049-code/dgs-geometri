// Baslangic: hash router, ust bar yonetimi, service worker kaydi.
//
// Gezinme kurali: ileri gitmek gecmise kayit ekler (push), geri gitmek kayit tuketir (pop).
// Her kaydin derinligi history.state.dgsDepth'te durur; acilista derinlik 0 daima ana ekrandir,
// boylece ana ekranda donanim geri tusu uygulamadan cikar.

import { clear, el } from './ui.js';
import { onExternalChange, onStorageTrouble } from './store.js';

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

/** Bir onceki ekranin birakmasi gereken kaynaklar (zamanlayici vb.). Hepsi calistirilir. */
let leaveHooks = [];

/** Derin baglantiyla acilista geri butonunun gidecegi yer; her render'da hesaplanir. */
let backHash = '#/';

/** Gecmis yigininda kacinci kayittayiz. 0 = ana ekran. */
let depth = 0;
let booted = false;

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

/**
 * Cok duzeyli ekranlarin alt sayfasindan geri, ana ekrana degil ust listeye doner.
 * Konu ve formul ekranlari uc duzeyli: ders -> konu -> icerik. Ders listesine ana
 * ekrandan dogrudan girildigi icin tek parcali rotadan geri ana ekrandir.
 */
function backTargetFor(route) {
  if (route.params.length < 2) return '#/';
  const branchId = encodeURIComponent(route.params[0]);
  if (route.name === 'topics') return `#/konular/${branchId}`;
  if (route.name === 'formulas') return `#/formuller/${branchId}`;
  return '#/';
}

/**
 * Mevcut kaydin derinligini belirler. Geri/ileri ile gelindiyse damga zaten vardir;
 * yeni bir push ise (location.hash atamasi state birakmaz) derinlik bir artar.
 */
function stampDepth() {
  const state = history.state;
  if (state && typeof state.dgsDepth === 'number') {
    depth = state.dgsDepth;
    return;
  }
  depth = booted ? depth + 1 : 0;
  history.replaceState({ ...(state || {}), dgsDepth: depth }, '');
}

/**
 * replace: true ise gecmise yeni kayit eklemez, mevcut kaydin uzerine yazar.
 * replaceState hashchange tetiklemedigi icin render elle cagrilir.
 */
export function navigate(hash, { replace = false } = {}) {
  if (location.hash === hash) {
    render();
  } else if (replace) {
    history.replaceState({ dgsDepth: depth }, '', hash);
    render();
  } else {
    location.hash = hash; // push -> hashchange -> render
  }
}

/** Ana ekrana doner ve arkasinda hicbir kayit birakmaz. */
export function goHome() {
  if (depth > 0) history.go(-depth);
  else navigate('#/', { replace: true });
}

/** Ekranlarin ust bari ve gezinmeyi kontrol etmesi icin verilen baglam. */
function makeContext(params) {
  return {
    params,
    navigate,
    goHome,
    setTitle(text) {
      titleNode.textContent = text;
      document.title = text === 'DGS Matematik' ? text : `${text} · DGS Matematik`;
    },
    setRight(text = '', urgent = false) {
      rightNode.textContent = text;
      rightNode.classList.toggle('urgent', Boolean(urgent));
    },
    /** Ekrandan cikilirken cagrilacak temizlik islevi; birden fazla kez cagrilabilir. */
    onLeave(fn) {
      leaveHooks.push(fn);
    },
  };
}

let renderToken = 0;

/** Su an cizili olan ekranin adi; disaridan gelen tazelemede karar vermek icin. */
let currentRouteName = 'home';

async function render() {
  const token = ++renderToken;

  const hooks = leaveHooks;
  leaveHooks = [];
  for (const hook of hooks) {
    try { hook(); } catch { /* temizlik hatasi gezinmeyi engellemesin */ }
  }

  stampDepth();

  const parts = parseHash();
  const route = resolve(parts);
  const ctx = makeContext(route.params);
  currentRouteName = route.name;

  // Varsayilanlar; ekran isterse degistirir.
  ctx.setTitle('DGS Matematik');
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
      el('button', { class: 'btn', on: { click: goHome } }, 'Ana ekrana dön')
    );
  }
}

// ---------- ilerleme depoya disaridan dokunulunca ----------

// Uygulama ayni anda iki yerde acik olabilir: ana ekrana eklenmis PWA ve tarayici sekmesi
// ayni depoyu paylasir. Diger kopya ilerlemeyi degistirdiginde ekrandaki sayilar
// eskimesin diye yeniden cizilir. Oturum ekrani bunun disinda: cozulmekte olan soru
// yeniden cizilirse kullanici yerini ve isaretledigi sikki kaybeder.
onExternalChange(() => {
  if (currentRouteName === 'session') return;
  render();
});

// Yazma basarisiz olursa ana ekrana donmeyi beklemeden, oturumun ortasinda da uyar.
onStorageTrouble(() => {
  const banner = document.getElementById('storage-banner');
  if (banner) banner.hidden = false;
});

document.getElementById('storage-dismiss').addEventListener('click', () => {
  document.getElementById('storage-banner').hidden = true;
});

backBtn.addEventListener('click', () => {
  // Geri gitmek kayit tuketir; boylece yigin buyumez ve donanim geri tusu ayni sirayi izler.
  // Derin baglantiyla acilis disinda depth her zaman > 0'dir.
  if (depth > 0) history.back();
  else navigate(backHash, { replace: true });
});

window.addEventListener('hashchange', render);

// Acilis. Sayfa yenilendiyse gecmis yigini ve damgalar yerinde durur, onlara guvenilir.
// Ilk girişte derinlik 0 ana ekrana sabitlenir; derin baglantiyla gelindiyse istenen ekran
// ana ekranin ustune push edilir, boylece geri once ana ekrana iner.
if (history.state && typeof history.state.dgsDepth === 'number') {
  booted = true;
  render();
} else {
  const initialHash = location.hash;
  // Yol ve sorgu korunur; yalnizca hash ana ekrana cekilir.
  history.replaceState({ dgsDepth: 0 }, '', `${location.pathname}${location.search}#/`);
  booted = true;

  if (initialHash && initialHash !== '#/' && initialHash !== '#') location.hash = initialHash;
  else render();
}

// Ilerleme verisi yoksa sifirdan baslamadan once sor. Kapi hangi ekranda olursak
// olalim ustte durdugu icin rota akisinin disinda, tembel yuklenerek acilir.
import('./backup.js')
  .then((module) => module.showRestoreGateIfNeeded())
  .catch((error) => console.info('Yedek kapısı açılamadı:', error.message));

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
