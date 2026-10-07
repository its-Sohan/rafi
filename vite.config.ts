import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({ plugins: [react(), {
  name: 'offline-shell',
  apply: 'build',
  enforce: 'post',
  generateBundle(_options, bundle) {
    const files = [...new Set(['/', '/index.html', '/favicon.svg', '/manifest.webmanifest', ...Object.keys(bundle).filter(name => !name.endsWith('.map')).map(name => `/${name}`)])]
    const version = `hisab-${Date.now()}`
    this.emitFile({ type: 'asset', fileName: 'sw.js', source: `
const CACHE = ${JSON.stringify(version)};
const FILES = ${JSON.stringify(files)};
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => {
    const previous = keys.filter(key => key.startsWith('hisab-') && key !== CACHE).sort().pop();
    return Promise.all(keys.filter(key => key.startsWith('hisab-') && key !== CACHE && key !== previous).map(key => caches.delete(key)));
  }).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request, { cache: 'no-store' }).then(async response => response.ok ? response : (await caches.open(CACHE)).match('/index.html')).catch(async () => (await caches.open(CACHE)).match('/index.html')));
  } else {
    event.respondWith(caches.open(CACHE).then(cache => cache.match(event.request, { ignoreVary: true })).then(async cached => cached || await caches.match(event.request, { ignoreVary: true }) || fetch(event.request)));
  }
});
` })
  },
}] })
