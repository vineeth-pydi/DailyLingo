const RELEASE = 'dailylingo-v1';
// CacheStorage is shared by every app on an origin; isolate each Pages scope.
const CACHE = `${RELEASE}:${self.registration.scope}`;
const ASSETS = ['./', './index.html', './styles.css', './src/app.js', './src/core.js', './src/drafts.js', './src/content.js', './src/config.js', './src/speech.js', './src/audio-ui.js', './src/speech-feedback.js', './icon.svg', './icon-192.png', './icon-512.png', './manifest.webmanifest'];
const ASSET_URLS = new Set(ASSETS.map(path => new URL(path, self.registration.scope).href));
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key === CACHE) continue;
      const scopedRelease = key.startsWith('dailylingo-') && key.endsWith(`:${self.registration.scope}`);
      const legacyRelease = /^(?:freelingo|dailylingo)-(?:v1|[a-f0-9]{12})$/.test(key);
      if (!scopedRelease && !legacyRelease) continue;
      const oldCache = await caches.open(key);
      const requests = await oldCache.keys();
      // Keep legacy caches for another Pages path or an older installed app.
      if (requests.every(request => request.url.startsWith(self.registration.scope))) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  const allowed = ASSET_URLS.has(event.request.url);
  const appNavigation = event.request.mode === 'navigate' && event.request.url.startsWith(self.registration.scope);
  if (!allowed && !appNavigation) return;
  event.respondWith(fetch(event.request).then(response => {
    if (allowed && response.ok) {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE).then(cache => cache.put(event.request, copy)));
    }
    return response;
  }).catch(async () => {
    const cache = await caches.open(CACHE);
    return (await cache.match(event.request)) || (appNavigation ? await cache.match(new URL('./index.html', self.registration.scope).href) : null) || Response.error();
  }));
});
