'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{test}=require('node:test');
const source=fs.readFileSync(new URL('../assets/mercy-verses.js','file://'+__filename),'utf8');
function setup(fetcher,{manualTimers=false}={}){
 const elements=[],events={},intervals=new Map(),timeouts=new Map();let seq=0,timeoutSeq=0;
 class Element{
  constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.attrs={};this.handlers={};this.textContent='';this.className='';this.value='';this.hidden=false;this.isConnected=true;this.parentNode={};this.currentTime=0;this.readyState=1;this.src='';this.plays=0;this.pauses=0;this.classList={add(){},remove(){}};elements.push(this)}
  append(...nodes){this.children.push(...nodes);for(const n of nodes)if(typeof n==='object')n.parentNode=this}setAttribute(k,v){this.attrs[k]=v}getAttribute(k){return this.attrs[k]??null}removeAttribute(k){delete this.attrs[k]}insertAdjacentElement(position,element){element.parentNode=this.parentNode}replaceChildren(...nodes){this.children=[];this.append(...nodes)}addEventListener(k,v,options){(this.handlers[k]??=[]).push({v,once:options?.once})}removeEventListener(k,v){this.handlers[k]=(this.handlers[k]||[]).filter(x=>x.v!==v)}async emit(k,event={}){for(const h of [...this.handlers[k]||[]]){await h.v({target:this,preventDefault(){},...event});if(h.once)this.removeEventListener(k,h.v)}}closest(selector){return selector==='dialog'?dialog:null}remove(){this.isConnected=false;this.parentNode=null}pause(){this.pauses++}play(){this.plays++;return Promise.resolve()}load(){}
 }
 const dialog=new Element('dialog');
 const document={currentScript:{src:'https://mercyseries.com/assets/mercy-verses.js?v=test'},documentElement:{lang:'en'},createElement:tag=>new Element(tag),createTextNode:text=>({textContent:text}),querySelectorAll:()=>elements.filter(x=>x.tagName==='AUDIO'),addEventListener(){}};
 const window={addEventListener(k,v){events[k]=v},MercyAudio:{stop(){}}};
 const context={document,window,URL,URLSearchParams,AbortController,WeakMap,Set,Map,console,localStorage:{getItem(){},setItem(){}},setTimeout:manualTimers?(fn,ms)=>{const id=++timeoutSeq;timeouts.set(id,{fn,ms});return id}:setTimeout,clearTimeout:manualTimers?id=>timeouts.delete(id):clearTimeout,setInterval(fn){const id=++seq;intervals.set(id,fn);return id},clearInterval(id){intervals.delete(id)},fetch:fetcher};vm.runInNewContext(source,context);
 const control=new Element('a');control.textContent='Qur’an 94:5-6';window.MercyVerses.enhance(control,'94:5-6',{getLanguage:()=>document.documentElement.lang});
 return {elements,document,window,events,dialog,control,intervals,timeouts};
}
const metadata={segments:[{surah:94,ayah:5,url:'https://server8.mp3quran.net/afs/094.mp3',start:10,end:12},{surah:94,ayah:6,url:'https://server8.mp3quran.net/afs/094.mp3',start:12,end:14}]};
const flush=()=>new Promise(r=>setImmediate(r));
test('verse playback requests the exact range, clips each ayah, resumes, and stops when the dialog closes',async()=>{
 const calls=[];const app=setup(async url=>{calls.push(url);return {ok:true,json:async()=>metadata}}),[play,pause,stop]=app.elements.filter(x=>x.tagName==='BUTTON'),audio=app.elements.find(x=>x.tagName==='AUDIO');
 assert.equal(calls.length,0);await play.emit('click');await flush();assert.match(calls[0],/reference=94%3A5-6/);assert.equal(audio.currentTime,10);assert.equal(audio.plays,1);
 audio.currentTime=11;await pause.emit('click');await play.emit('click');await flush();assert.equal(audio.currentTime,11,'resume keeps the current position');assert.equal(calls.length,1,'reuse only validated metadata');
 audio.currentTime=12;await audio.emit('timeupdate');await flush();assert.equal(audio.currentTime,12,'range continues at the next ayah');audio.currentTime=14;await audio.emit('timeupdate');assert.equal(app.intervals.size,0);assert.equal(play.disabled,false);
 await play.emit('click');await flush();await app.dialog.emit('close');assert.equal(app.intervals.size,0);assert.equal(stop.disabled,true);
});
test('a cancelled metadata request cannot start audio and external audio URLs are rejected',async()=>{
 let release;const pending=new Promise(r=>release=r);const app=setup(async()=>pending),[play,,stop]=app.elements.filter(x=>x.tagName==='BUTTON'),audio=app.elements.find(x=>x.tagName==='AUDIO');
 const loading=play.emit('click');await stop.emit('click');release({ok:true,json:async()=>metadata});await loading;await flush();assert.equal(audio.plays,0);
 const bad=setup(async()=>({ok:true,json:async()=>({segments:metadata.segments.map(x=>({...x,url:'https://attacker.test/audio.mp3'}))})}));await bad.elements.find(x=>x.tagName==='BUTTON').emit('click');await flush();assert.equal(bad.elements.find(x=>x.tagName==='AUDIO').plays,0);assert.match(bad.elements.find(x=>x.className==='mercy-verse-status').textContent,/could not play/);
});
test('Arabic controls stay Arabic and corpus loads from the shared asset origin for hosted VIP readers',async()=>{
 let corpusURL;const app=setup(async url=>{corpusURL=url;return {ok:true,json:async()=>({verses:{'94:5':{arabic:'نص'},'94:6':{arabic:'نص'}}})}});app.document.documentElement.lang='ar';app.events['mercy-language-change']();assert.equal(app.elements.find(x=>x.tagName==='BUTTON').textContent,'استمع إلى الآية');await app.control.emit('click');await flush();assert.match(corpusURL,/^https:\/\/mercyseries\.com\/assets\/quran-verses\.json/);
});

test('a stale play completion cannot pause a newer recitation on the same player',async()=>{
 const app=setup(async()=>({ok:true,json:async()=>metadata})),[play,,stop]=app.elements.filter(x=>x.tagName==='BUTTON'),audio=app.elements.find(x=>x.tagName==='AUDIO'),pending=[];
 audio.pause=()=>{audio.pauses++;audio.paused=true};audio.play=()=>{audio.plays++;audio.paused=false;return new Promise(resolve=>pending.push(resolve))};
 await play.emit('click');await flush();assert.equal(pending.length,1);
 await stop.emit('click');assert.equal(audio.paused,true);
 await play.emit('click');await flush();assert.equal(pending.length,2);
 pending[1]();await flush();assert.equal(audio.paused,false);assert.equal(play.disabled,true);
 const pauses=audio.pauses;pending[0]();await flush();
 assert.equal(audio.pauses,pauses,'the obsolete promise does not pause the current playback');assert.equal(audio.paused,false);assert.equal(play.disabled,true);
 await stop.emit('click');
});
test('buffering playback retains its deadline after metadata and a failed seek recovers immediately',async()=>{
 const app=setup(async()=>({ok:true,json:async()=>metadata}),{manualTimers:true}),[play,,stop]=app.elements.filter(x=>x.tagName==='BUTTON'),audio=app.elements.find(x=>x.tagName==='AUDIO');let release;
 audio.pause=()=>{audio.paused=true};audio.play=()=>{audio.paused=false;return new Promise(resolve=>release=resolve)};
 await play.emit('click');await flush();const deadline=[...app.timeouts.values()].find(timer=>timer.ms===15000);
 assert(deadline,'the loading deadline remains active while play waits for buffering');deadline.fn();
 assert.equal(audio.paused,true);assert.equal(play.disabled,false);assert.equal(stop.disabled,true);assert.equal(app.timeouts.size,0);assert.match(app.elements.find(x=>x.className==='mercy-verse-status').textContent,/could not play/);
 release();await flush();assert.equal(audio.paused,true);assert.equal(play.disabled,false,'a late play completion cannot revive a timed-out session');
 const broken=setup(async()=>({ok:true,json:async()=>metadata}),{manualTimers:true}),brokenAudio=broken.elements.find(x=>x.tagName==='AUDIO');
 Object.defineProperty(brokenAudio,'currentTime',{get(){return 0},set(){throw Error('Seek unavailable')}});
 await broken.elements.find(x=>x.tagName==='BUTTON').emit('click');await flush();
 assert.equal(broken.timeouts.size,0);assert.equal(brokenAudio.plays,0);assert.match(broken.elements.find(x=>x.className==='mercy-verse-status').textContent,/could not play/);
});
