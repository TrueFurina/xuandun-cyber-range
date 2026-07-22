// ============================================================
// 玄盾 XUANDUN · Service Worker
// 应用外壳缓存 + 离线可用（cache-first for shell, network-first for navigations）
// ============================================================
const VERSION = 'xuandun-v1.0.0';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/icon.svg',
  './assets/css/tokens.css',
  './assets/css/app.css',
  './assets/js/main.js',
  './assets/js/router.js',
  './assets/js/store.js',
  './assets/js/landing.js',
  './assets/js/console.js',
  './assets/js/components.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // 跨域（字体等）走网络，失败静默
  if (url.origin !== self.location.origin) return;
  // 导航请求：network-first，离线回退缓存的 index
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).catch(() => caches.match('./index.html').then((r) => r || caches.match('./')))
    );
    return;
  }
  // 同源静态资源：cache-first，回填缓存
  e.respondWith(
    caches.match(req).then((cached) =>
      cached || fetch(req).then((resp) => {
        if (resp && resp.ok) { const copy = resp.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
        return resp;
      }).catch(() => cached)
    )
  );
});
