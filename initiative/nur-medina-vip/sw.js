const VERSION="2026-11-11-full-book-v1";
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('message',event=>{if(event.data?.type==='GUIDE_SKIP_WAITING')self.skipWaiting()});
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 await self.clients.claim();
 const scope=new URL(self.registration.scope).pathname;
 for(const client of await self.clients.matchAll({type:'window',includeUncontrolled:true})){
  const url=new URL(client.url);if(url.origin!==self.location.origin||!url.pathname.startsWith(scope)||url.searchParams.get('guide_version')===VERSION)continue;
  // Navigation fetches may wait for activation. Never await them from here.
  url.searchParams.set('guide_version',VERSION);client.navigate(url.href).catch(()=>{});
 }
})()));
self.addEventListener('fetch',event=>{if(new URL(event.request.url).origin===self.location.origin)event.respondWith(fetch(event.request,{cache:'no-store'}))});