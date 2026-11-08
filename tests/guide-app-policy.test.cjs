'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');
const source = fs.readFileSync(new URL('../reader/app-policy.js', 'file://' + __filename), 'utf8');
const VERSION = '2026-11-08-unlocked-v1';
const API = 'https://mercy-malaysia-orders-reviews.shahiranuar.chatgpt.site';
const policy = () => ({version:VERSION,minVersion:VERSION,mandatory:true,deviceLocks:false,accountLimitsPreserved:true});
const response = (value, status = 200) => new Response(JSON.stringify(value), {status,headers:{'content-type':'application/json'}});
const flush = () => new Promise(resolve => setImmediate(resolve));
function runtime(handler, href = 'https://mercyseries.com/reader/') {
  const elements = new Map(), events = new Map(), classes = new Set(), requests = [], replacements = [];
  const storage = new Map([['mercyEmailAccess','existing-token'],['mercyReaderSerial','existing-order'],['mercyInternational.thread','42']]);
  let clock = 100_000, closeCalls = 0;
  const listen = (name, fn) => { if (!events.has(name)) events.set(name, []); events.get(name).push(fn); };
  function element() { return {hidden:false,disabled:false,textContent:'',dataset:{},setAttribute(){},addEventListener:listen,append(child){if(child.id)elements.set(child.id,child)},set innerHTML(value){for(const match of value.matchAll(/id="([^"]+)"/g)){const e=element();e.id=match[1];elements.set(e.id,e)}}}; }
  const document = {head:element(),body:element(),readyState:'complete',hidden:false,currentScript:{dataset:{guideApi:API}},createElement:element,getElementById:id=>elements.get(id),querySelectorAll:()=>[],addEventListener:listen,documentElement:{classList:{add:name=>classes.add(name),remove:name=>classes.delete(name)}}};
  const location = {href,replace(url){replacements.push(url);this.href=url}};
  const navigator = {serviceWorker:{getRegistrations:async()=>[]}};
  const window = {fetch:async(input,init)=>{requests.push({input,init});return handler(input,init)},addEventListener:listen,dispatchEvent:event=>{for(const fn of events.get(event.type)||[])fn(event)},close(){closeCalls++},speechSynthesis:{cancel(){}},MercyAudio:{stop(){}},localStorage:{getItem:key=>storage.get(key),setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)}};
  const context = {window,document,navigator,location,URL,Request,Headers,Response,CustomEvent:class {constructor(type,options){this.type=type;this.detail=options?.detail}},Date:{now:()=>clock},setInterval(){}};
  vm.runInNewContext(source,context);
  return {api:window.GuideAppPolicy,window,document,navigator,requests,storage,classes,elements,replacements,events,advance:ms=>clock+=ms,closed:()=>closeCalls,fire:(type,extra={})=>window.dispatchEvent({type,...extra})};
}
test('current policy permits registered content, versions Guide requests only and preserves credentials', async () => {
  const r=runtime(async input=>String(input).endsWith('/app-policy')?response(policy()):response({ok:true}));
  await r.api.ready;
  await r.window.fetch(API+'/api/book',{headers:{'x-mercy-access':'existing-token'}});
  await r.window.fetch('https://accounts.google.com/gsi/client');
  assert.equal(r.classes.has('guide-update-blocked'),false);
  assert.equal(r.requests[1].init.headers.get('x-guide-app-version'),VERSION);
  assert.equal(r.requests[1].init.headers.get('x-mercy-access'),'existing-token');
  assert.equal(r.requests[2].init,undefined);
  assert.equal(r.storage.get('mercyEmailAccess'),'existing-token');
  assert.equal(r.storage.get('mercyInternational.thread'),'42');
});
test('offline launch remains blocked and recovers after a successful online policy check', async () => {
  let connected=false;
  const r=runtime(async()=>{if(!connected)throw Error('offline');return response(policy())});
  let ready=false;r.api.ready.then(()=>ready=true);await flush();
  assert.equal(ready,false);assert.equal(r.classes.has('guide-update-blocked'),true);
  connected=true;r.fire('online');await r.api.ready;
  assert.equal(r.classes.has('guide-update-blocked'),false);
  assert.equal(r.storage.get('mercyEmailAccess'),'existing-token');
});
test('a mandatory newer version never exposes the reader or sends an authenticated content request', async () => {
  const r=runtime(async()=>response({...policy(),minVersion:'next-version'}));
  await flush();
  assert.equal(r.classes.has('guide-update-blocked'),true);
  assert.match(r.elements.get('guide-update-message').textContent,/newer Guide update/);
  assert.equal(r.requests.length,1);
  assert.equal(r.storage.get('mercyEmailAccess'),'existing-token');
});
test('an HTTP 426 received after startup stops content and keeps the account token', async () => {
  const r=runtime(async input=>String(input).endsWith('/app-policy')?response(policy()):response({code:'update_required'},426));
  await r.api.ready;
  await assert.rejects(r.window.fetch(API+'/api/reader/heartbeat'),error=>error.code==='update_required');
  assert.equal(r.classes.has('guide-update-blocked'),true);
  assert.equal(r.storage.get('mercyEmailAccess'),'existing-token');
});
test('a stale page restored from the back-forward cache is blocked before its recheck resolves', async () => {
  let complete;
  let count=0;
  const r=runtime(async()=>++count===1?response(policy()):new Promise(resolve=>complete=resolve));
  await r.api.ready;r.advance(61_000);r.fire('pageshow',{persisted:true});
  assert.equal(r.classes.has('guide-update-blocked'),true);
  complete(response(policy()));await flush();
  assert.equal(r.classes.has('guide-update-blocked'),false);
});
test('secret edition content receives the version header without changing its path or query', async () => {
  const r=runtime(async input=>String(input).endsWith('/app-policy')?response(policy()):response({ok:true}));
  await r.api.ready;
  const url=API+'/initiative/int-vip-01-private-edition/book?lang=ar';
  await r.window.fetch(url,{headers:{authorization:'Bearer google-test'}});
  assert.equal(r.requests[1].input,url);
  assert.equal(r.requests[1].init.headers.get('x-guide-app-version'),VERSION);
  assert.equal(r.requests[1].init.headers.get('authorization'),'Bearer google-test');
});
test('Update checks an existing secret-edition worker and reloads without discarding edition parameters', async () => {
  let updates=0;
  const r=runtime(async()=>response(policy()),API+'/initiative/int-vip-01-private-edition/?lang=ar#vip=private');
  await r.api.ready;
  r.navigator.serviceWorker.getRegistrations=async()=>[{scope:API+'/initiative/int-vip-01-private-edition/',async update(){updates++}}];
  await r.api.update();
  assert.equal(updates,1);
  const url=new URL(r.replacements[0]);
  assert.equal(url.searchParams.get('guide_version'),VERSION);
  assert.equal(url.searchParams.get('lang'),'ar');
  assert.equal(url.hash,'#vip=private');
  assert.equal(r.storage.get('mercyReaderSerial'),'existing-order');
});
test('Close attempts the browser close API and leaves a blocked fallback when it is denied', async () => {
  const r=runtime(async()=>response(policy()));await r.api.ready;r.api.close();
  assert.equal(r.closed(),1);assert.equal(r.classes.has('guide-update-blocked'),true);
  assert.match(r.elements.get('guide-update-message').textContent,/Reading is closed/);
});
