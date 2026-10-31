import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
class Element{constructor(tag='div'){this.tagName=tag;this.children=[];this.dataset={};this.attributes={};this.hidden=false;this.textContent='';this.classList={add(){}}}setAttribute(k,v){this.attributes[k]=v}append(...nodes){this.children.push(...nodes)}replaceChildren(...nodes){this.children=nodes;this.textContent=''}addEventListener(k,fn){this[k]=fn}querySelector(){return null}querySelectorAll(){return []}}
const keys=['science','history','psychology','ethics','faith','art'];
const payload=lang=>({language:lang,version:'test',threads:Array.from({length:86},(_,i)=>({number:i+1,chapter:i<23?1:i<48?2:3,title:'Thread '+(i+1),note:'A note',verse:'2:286',lenses:Object.fromEntries(keys.map(k=>[k,{answer:lang+' answer '+k+' '+(i+1),practice:lang+' optional practice '+k}]))}))});
const listeners={},calls=[];let lang='en',resolveMalay;
const document={readyState:'complete',documentElement:{lang:'en'},createElement:tag=>new Element(tag),querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){}};
const context={window:{MercyLanguage:{getLanguage:()=>lang},addEventListener:(k,fn)=>listeners[k]=fn},document,Map,Set,WeakMap,URLSearchParams,encodeURIComponent,Promise,console,fetch:async(url,options)=>{calls.push({url,options});if(url.includes('.ms.'))return new Promise(resolve=>resolveMalay=()=>resolve({ok:true,json:async()=>payload('ms')}));return {ok:true,json:async()=>payload('en')}},localStorage:{getItem(){throw Error('Public knowledge must not read reader credentials')}}};
vm.runInNewContext(fs.readFileSync('assets/learn-language.js','utf8'),context);
const api=context.window.MercyLearning;assert.equal(typeof api?.show,'function');
const panel=new Element(),choices=keys.map(k=>({dataset:{lens:k},setAttribute(k,v){this[k]=v}}));
const content=node=>[node.textContent,...node.children.flatMap(child=>content(child))].join(' ');
await api.show(2,'science',panel,choices);assert.match(content(panel),/en answer science 2/);assert.match(content(panel),/en optional practice science/);assert.equal(panel.hidden,false);assert.equal(choices[0]['aria-pressed'],'true');
assert.equal(calls[0].url,'/learn/answers.en.json');assert.equal(calls[0].options.credentials,'omit');assert.equal(calls[0].options.headers,undefined,'public requests contain no authentication headers');
await api.showAll(86,panel,choices);assert.equal(panel.children.filter(x=>x.dataset.lens).length,6,'all six substantive answers are shown');assert.match(content(panel),/en answer art 86/);assert.equal(calls.length,1,'public data is cached per language');
lang='ms';const pending=api.show(3,'faith',panel,choices);await Promise.resolve();assert.equal(typeof resolveMalay,'function');lang='en';await api.show(4,'art',panel,choices);resolveMalay();await pending;assert.match(content(panel),/en answer art 4/);assert.doesNotMatch(content(panel),/ms answer/,'late translated data must not overwrite a newer selection');
lang='ms';listeners['mercy-language-change']();await new Promise(resolve=>setImmediate(resolve));assert.match(content(panel),/ms answer art 4/,'language changes refresh the active answer without requiring another click');
assert.equal(fs.readFileSync('learn/lenses-access.js','utf8').includes('accounts.google'),false,'legacy lenses no longer load a sign-in service');
for(const chapter of [1,2,3]){const html=fs.readFileSync('learn/chapter-'+chapter+'/index.html','utf8');assert.match(html,/MercyLearning\.show\(/);assert.match(html,/MercyLearning\?\.open\(/);assert.doesNotMatch(html,/MercyLearnBM\?\.show/)}
console.log('All public lens answers: no credential access, six-answer display, caching, language refresh and stale response protection passed');
