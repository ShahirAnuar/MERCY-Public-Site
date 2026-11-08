'use strict';
const fs=require('node:fs'),vm=require('node:vm'),test=require('node:test'),assert=require('node:assert/strict');
function worker(path,scope,prefix){
 const listeners={},deleted=[],navigated=[],calls=[];let claimed=0;
 const clients=[{url:'https://mercyseries.com'+scope+'?lang=ms',navigate:async url=>navigated.push(url)},{url:'https://mercyseries.com'+scope+'?guide_version=2026-11-08-unlocked-v1',navigate:async url=>navigated.push(url)},{url:'https://mercyseries.com/game/',navigate:async url=>navigated.push(url)},{url:'https://other.example'+scope,navigate:async url=>navigated.push(url)}];
 const self={location:{origin:'https://mercyseries.com'},skipWaiting:async()=>{},clients:{claim:async()=>claimed++,matchAll:async()=>clients},addEventListener:(name,fn)=>listeners[name]=fn};
 const fetch=async(request,options)=>{calls.push({request,options});throw Error('offline')};
 const caches={keys:async()=>[prefix+'old','unrelated-game-cache','checkout-assets'],delete:async name=>deleted.push(name)};
 vm.runInNewContext(fs.readFileSync(new URL('../'+path,'file://'+__filename),'utf8'),{self,caches,fetch,URL,Response});
 return{listeners,deleted,navigated,calls,claimed:()=>claimed};
}
for(const [path,scope,prefix]of [['reader/service-worker.js','/reader/','the-guide-app-'],['guide/international/sw.js','/guide/international/','the-guide-international-']]){
 test(path+' activates immediately, deletes its own cache only and refreshes old Guide windows',async()=>{
  const w=worker(path,scope,prefix);let pending;w.listeners.activate({waitUntil:p=>pending=p});await pending;
  assert.deepEqual(w.deleted,[prefix+'old']);assert.equal(w.claimed(),1);assert.equal(w.navigated.length,1);
  const url=new URL(w.navigated[0]);assert.equal(url.pathname,scope);assert.equal(url.searchParams.get('lang'),'ms');assert.equal(url.searchParams.get('guide_version'),'2026-11-08-unlocked-v1');
 });
 test(path+' never serves a stale offline reader shell',async()=>{
  const w=worker(path,scope,prefix);let pending;w.listeners.fetch({request:{method:'GET',url:'https://mercyseries.com'+scope,mode:'navigate'},respondWith:p=>pending=p});
  const res=await pending;assert.equal(res.status,503);assert.match(await res.text(),/Update The Guide before reading/);assert.equal(w.calls[0].options.cache,'no-store');
 });
}
