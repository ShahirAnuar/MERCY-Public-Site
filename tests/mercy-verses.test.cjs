const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const source=readFileSync(path.join(root,'assets/mercy-verses.js'),'utf8');
const data=JSON.parse(readFileSync(path.join(root,'assets/quran-verses.json'),'utf8'));
class Element {
 constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.attributes={};this.events={};this._text='';this.isConnected=true;this.classList={add(){},remove(){}};}
 set textContent(value){this._text=String(value);this.children=[];}get textContent(){return this._text+this.children.map(x=>x.textContent).join('');}
 setAttribute(k,v){this.attributes[k]=String(v);}getAttribute(k){return this.attributes[k]??null;}removeAttribute(k){delete this.attributes[k];}
 append(...items){for(const item of items){this.children.push(item);item.parentNode=this;}}replaceChildren(...items){this.children=[];this._text='';this.append(...items);}
 insertAdjacentElement(position,node){this.after=node;node.parentNode=this.parentNode||{mock:true};}
 addEventListener(k,f){this.events[k]=f;}removeEventListener(k){delete this.events[k];}remove(){this.removed=true;}
}
function setup(fetchImpl){const listeners={};const window={addEventListener:(name,fn)=>listeners[name]=fn};const document={createElement:tag=>new Element(tag),createTextNode:text=>({textContent:text})};const context={window,document,fetch:fetchImpl,AbortController,setTimeout,clearTimeout};vm.runInNewContext(source,context);return {api:window.MercyVerses,listeners};}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function click(control,extra={}){let prevented=false;control.events.click({preventDefault(){prevented=true;},...extra});return prevented;}
test('reference parser covers all published references and rejects unsafe or unbounded values',()=>{
 const {api}=setup();const threads=JSON.parse(readFileSync(path.join(root,'learn/answers.en.json'),'utf8')).threads;
 for(const thread of threads){const ref=api.parse(thread.verse);assert.ok(ref,thread.verse);for(const key of ref.keys)assert.ok(data.verses[key]?.arabic,key);}
 for(const ref of ['0:1','115:1','2:0','2:2-1','2:1-286','2:1<script>','https://example.com'])assert.equal(api.parse(ref),null);
 assert.deepEqual(Array.from(api.parse('20:25–28').keys),['20:25','20:26','20:27','20:28']);
});
test('local corpus supplies source notice and every selected Arabic verse with EN/BM translations',()=>{
 assert.equal(Object.keys(data.verses).length,75);assert.match(data.source.notice,/CHANGING IT IS NOT ALLOWED/);assert.match(data.source.notice,/Copyright/);assert.equal(data.source.url,'https://tanzil.net/');
 for(const [key,verse]of Object.entries(data.verses)){assert.match(verse.arabic,/[\u0600-\u06ff]/,key);for(const language of ['en','ms'])assert.ok(verse[language]?.text?.length>4,key+' '+language);}
 assert.equal(data.translations.en.version,'1.0.20');assert.equal(data.translations.ms.name,'Abdullah Basumayyah');
});
test('click reveals the Arabic verse in place and a second click closes it; corpus is shared',async()=>{
 let calls=0;const {api}=setup(async()=>{calls++;return {ok:true,json:async()=>data};});const control=new Element('a');let language='en';control.textContent='Read verse';
 const instance=api.enhance(control,'94:7',{getLanguage:()=>language});assert.equal(api.enhance(control,'94:7'),instance);assert.equal(control.getAttribute('aria-expanded'),'false');
 assert.equal(click(control),true);await tick();assert.equal(control.getAttribute('aria-expanded'),'true');assert.equal(control.after.hidden,false);assert.ok(control.after.textContent.includes(data.verses['94:7'].arabic));assert.ok(control.after.textContent.includes(data.verses['94:7'].en.text));assert.match(control.after.textContent,/v1.0.20.*QuranEnc.com/);
 click(control);assert.equal(control.after.hidden,true);language='ms';instance.refresh();click(control);await tick();assert.ok(control.after.textContent.includes(data.verses['94:7'].ms.text));assert.equal(calls,1);instance.destroy();assert.equal(control.getAttribute('aria-expanded'),null);
});
test('closing during fetch never paints a stale response and external modified clicks still work',async()=>{
 let resolve;const {api}=setup(()=>new Promise(r=>resolve=r));const control=new Element('a');api.enhance(control,'2:153');assert.equal(click(control,{ctrlKey:true}),false);assert.equal(control.getAttribute('aria-expanded'),'false');click(control);click(control);resolve({ok:true,json:async()=>data});await tick();assert.equal(control.after.hidden,true);assert.equal(control.after.textContent.includes(data.verses['2:153'].arabic),false);
});
test('a failed load keeps a source link and permits retry',async()=>{
 let calls=0;const {api}=setup(async()=>{if(++calls===1)throw new Error('offline');return {ok:true,json:async()=>data};});const control=new Element('button');api.enhance(control,'39:53');click(control);await tick();assert.match(control.after.textContent,/could not load/);assert.match(control.after.textContent,/Read on Quran.com/);click(control);click(control);await tick();assert.ok(control.after.textContent.includes(data.verses['39:53'].arabic));assert.equal(calls,2);
});

test('a reused thread anchor receives the new reference and cleanup releases detached controls',async()=>{
 const {api}=setup(async()=>({ok:true,json:async()=>data}));const control=new Element('a');const old=api.enhance(control,'94:7');const panel=control.after;const current=api.enhance(control,'39:53');assert.notEqual(old,current);assert.equal(panel.removed,true);assert.equal(current.reference,'39:53');click(control);await tick();assert.ok(control.after.textContent.includes(data.verses['39:53'].arabic));assert.equal(control.after.textContent.includes(data.verses['94:7'].arabic),false);control.isConnected=false;api.cleanup();assert.equal(control.getAttribute('aria-expanded'),null);
});
