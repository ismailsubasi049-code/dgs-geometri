// Service worker: uygulamayi ve soru paketlerini cache'e alir, internetsiz calismayi saglar.
//
// Guncelleme: bu sabiti artir. Eski cache silinir, sayfada "Yeni sürüm hazır" bandi cikar.
const VERSION = 'v1';
const CACHE = `dgs-${VERSION}`;

// Uygulama kabugu. Paketler burada yok - onlar data/index.json'dan okunarak eklenir,
// boylece yeni bir paket eklemek icin bu dosyaya dokunmak gerekmez.
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './js/app.js',
  './js/ui.js',
  './js/store.js',
  './js/packs.js',
  './js/scheduler.js',
  './js/quiz.js',
  './js/svg.js',
  './js/screens/home.js',
  './js/screens/session.js',
  './js/screens/result.js',
  './js/screens/topics.js',
  './js/screens/stats.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png',
  './data/index.json',
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

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cacheAllSettled(cache, APP_SHELL);

    // Paket listesini index.json'dan oku ve hepsini precache et.
    try {
      const response = await fetch('./data/index.json', { cache: 'no-cache' });
      const data = await response.json();
      const packUrls = (data.packs || []).map((pack) => `./data/${pack.file}`);
      await cacheAllSettled(cache, packUrls);
    } catch (error) {
      // Paketler alinamadiysa uygulama yine kurulur; paketler ilk cevrimici
      // kullanimda runtime cache'ine dusecektir.
      console.warn('[sw] paket listesi okunamadı:', error.message);
    }
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
