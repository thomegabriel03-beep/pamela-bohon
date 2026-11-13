/* Pamela Bohon · web app
   Páginas: busca sempre a versão mais nova (rede primeiro) e usa a cópia salva só sem internet.
   Imagens e ícones: usa a cópia salva e atualiza em segundo plano. */
const VERSAO = 'pb-v1';
const BASE = ['/', '/pamela.webp', '/icon-192.png', '/manifest.webmanifest'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // WhatsApp, fontes etc. seguem direto

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(r => {
        const copia = r.clone();
        caches.open(VERSAO).then(c => c.put('/', copia));
        return r;
      }).catch(() => caches.match('/'))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(salvo => {
      const rede = fetch(req).then(r => {
        if (r.ok) { const copia = r.clone(); caches.open(VERSAO).then(c => c.put(req, copia)); }
        return r;
      }).catch(() => salvo);
      return salvo || rede;
    })
  );
});
