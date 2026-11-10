const VERSION = '2026-11-11-full-book-v1';
const GUIDE_SCOPE = '/guide/international/';
const GUIDE_CACHE_PREFIX = 'the-guide-international-';
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('message', event => { if (event.data?.type === 'GUIDE_SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('activate', event => event.waitUntil((async () => {
  const names = await caches.keys();
  await Promise.all(names.filter(name => name.startsWith(GUIDE_CACHE_PREFIX)).map(name => caches.delete(name)));
  await self.clients.claim();
  const windows = await self.clients.matchAll({type:'window',includeUncontrolled:true});
  for (const client of windows) {
    const url = new URL(client.url);
    if (url.origin !== self.location.origin || !url.pathname.startsWith(GUIDE_SCOPE) || url.searchParams.get('guide_version') === VERSION) continue;
    url.searchParams.set('guide_version', VERSION);
    // Navigation fetches wait for activation. Start the refresh without making activation wait for that navigation.
    client.navigate(url.href).catch(() => {});
  }
})()));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(GUIDE_SCOPE)) return;
  event.respondWith(fetch(event.request, {cache:'no-store'}).catch(() => {
    if (event.request.mode !== 'navigate') return Response.error();
    return new Response('<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>The Guide update required</title><body style="background:#07182f;color:#fff8e8;font:1.1rem/1.6 system-ui;padding:2rem"><h1>Update The Guide before reading</h1><p>Reconnect to the internet and reopen the app to install the latest update. Your account allowance and reading position are kept.</p><button onclick="location.reload()">Try again</button></body></html>',{status:503,headers:{'content-type':'text/html;charset=UTF-8','cache-control':'no-store'}});
  }));
});


