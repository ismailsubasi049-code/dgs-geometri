// Service worker: uygulamayi ve soru paketlerini cache'e alir, internetsiz calismayi saglar.
//
// Guncelleme: bu sabiti artir. Eski cache silinir, sayfada "Yeni sürüm hazır" bandi cikar.
const VERSION = 'v26';
const CACHE = `dgs-${VERSION}`;

// Uygulama kabugu. Paketler ve formul setleri burada yok - onlar kendi index.json'larindan
// okunarak eklenir, boylece yeni bir paket/set eklemek icin bu dosyaya dokunmak gerekmez.
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './js/app.js',
  './js/ui.js',
  './js/store.js',
  './js/backup.js',
  './js/packs.js',
  './js/formulas.js',
  './js/scheduler.js',
  './js/quiz.js',
  './js/svg.js',
  './js/scratchpad.js',
  './js/screens/home.js',
  './js/screens/session.js',
  './js/screens/result.js',
  './js/screens/topics.js',
  './js/screens/formulas.js',
  './js/screens/stats.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png',
  './data/index.json',
  './data/formuller/index.json',
];

/** Tek tek ekler: bir dosya eksikse digerleri yine cache'lenir. */
async function cacheAllSettled(cache, urls) {
  const results = await Promise.allSettled(
    urls.map(async (url) => {
      const response = await fetch(url, { cache: 'no-cache' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await cache.put(url, response);
    })
  );
  const failed = results
    .map((r, i) => (r.status === 'rejected' ? urls[i] : null))
    .filter(Boolean);
  if (failed.length > 0) console.warn('[sw] cache\'lenemedi:', failed);
}

/** Bir index.json'u okuyup icinde listelenen dosyalari precache eder. */
async function cacheFromIndex(cache, indexUrl, toUrls) {
  try {
    const response = await fetch(indexUrl, { cache: 'no-cache' });
    const data = await response.json();
    await cacheAllSettled(cache, toUrls(data));
  } catch (error) {
    // Liste alinamadiysa uygulama yine kurulur; dosyalar ilk cevrimici
    // kullanimda runtime cache'ine dusecektir.
    console.warn(`[sw] liste okunamadı (${indexUrl}):`, error.message);
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cacheAllSettled(cache, APP_SHELL);

    await cacheFromIndex(cache, './data/index.json',
      (data) => (data.packs || []).map((pack) => `./data/${pack.file}`));

    await cacheFromIndex(cache, './data/formuller/index.json',
      (data) => (data.sets || []).map((set) => `./data/formuller/${set.file}`));
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(
      names.filter((name) => name.startsWith('dgs-') && name !== CACHE)
           .map((name) => caches.delete(name))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Sadece kendi kaynagimizdaki GET istekleri; digerlerine karisma.
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cached = await caches.match(request, { ignoreSearch: true });
    if (cached) return cached;

    try {
      const response = await fetch(request);
      // Sonradan eklenen paketler de boylece cache'e girer.
      if (response && response.ok && response.type === 'basic') {
        const cache = await caches.open(CACHE);
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      // Cevrimdisiyken sayfa yenilenirse kabugu ver.
      if (request.mode === 'navigate') {
        const shell = await caches.match('./index.html');
        if (shell) return shell;
      }
      throw error;
    }
  })());
});
