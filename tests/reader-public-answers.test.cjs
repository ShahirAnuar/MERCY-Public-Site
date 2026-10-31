'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{test}=require('node:test');
const html=fs.readFileSync(new URL('../reader/index.html','file://'+__filename),'utf8'),script=html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
const pure=script.match(/\/\* BM PURE HELPERS \*\/([\s\S]*?)\/\* END BM PURE HELPERS \*\//)[1];
assert.match(pure,/function validatedPublicAnswers/,'public six-lens answers must be validated independently from licensed story access');
const {validatedPublicAnswers,publicAnswerText}=new Function(pure+';return {validatedPublicAnswers,publicAnswerText};')();
const keys=['science','history','psychology','ethics','faith','art'];
const fixture=language=>({language,version:'test',threads:Array.from({length:86},(_,i)=>({number:i+1,chapter:1,title:(language==='ms'?'Topik ':'Thread ')+(i+1),note:'Nota',verse:'2:286',lenses:Object.fromEntries(keys.map(k=>[k,{answer:(language==='ms'?'Jawapan sebenar ':'Actual answer ')+k,practice:'A practical exercise'}]))}))});
test('all 86 public threads require actual answers for every lens',()=>{
 assert.equal(validatedPublicAnswers(fixture('ms'),'ms').threads.length,86);
 const broken=fixture('en');delete broken.threads[85].lenses.art.answer;assert.throws(()=>validatedPublicAnswers(broken,'en'));
 assert.throws(()=>validatedPublicAnswers(fixture('ms'),'en'));
 const text=publicAnswerText(fixture('ms').threads[0].lenses.science,'ms');assert.match(text,/^Jawapan sebenar science/);assert.match(text,/Latihan pilihan/);
});
const loader=script.slice(script.indexOf('    async function loadPublicAnswers('),script.indexOf('    function readerEditionMatches'));
assert.match(loader,/async function loadPublicAnswers/);
test('answer loading is public and never sends serials or credentials',async()=>{
 let calls=0;const c={Map,publicAnswerCache:new Map,publicAnswerLoading:new Map,validatedPublicAnswers,fetch:async(url,options)=>{calls++;assert.equal(url,'/learn/answers.ms.json');assert.equal(options.credentials,'omit');assert.equal(options.cache,'no-store');assert.equal(options.headers,undefined);return {ok:true,json:async()=>fixture('ms')}}};vm.runInNewContext(loader,c);await vm.runInNewContext('loadPublicAnswers("ms")',c);await vm.runInNewContext('loadPublicAnswers("ms")',c);assert.equal(calls,1);
});
class Node{constructor(){this.textContent='';this.hidden=false;this.disabled=false;this.children=[];this.listeners={};this.dataset={}}replaceChildren(){this.children=[]}append(node){this.children.push(node)}setAttribute(k,v){this[k]=v}addEventListener(k,v){this.listeners[k]=v}}
const render=script.slice(script.indexOf('    async function renderThread('),script.indexOf('    function openThread('));assert.match(render,/async function renderThread/);
function renderer(load){const nodes=Object.fromEntries(['#thread-kicker','#thread-title','#thread-note','#thread-verse'].map(id=>[id,new Node]));const c={readerLanguage:'ms',currentThread:{number:1},threadRenderEpoch:0,lensesLocked:true,lensNames:['Science','History','Psychology','Ethics','Faith','Art'],dialog:{querySelector:id=>nodes[id]},lensButtons:new Node,lensPanel:new Node,document:{createElement:()=>new Node},loadPublicAnswers:load,publicAnswerText,refreshReaderUi(){}};vm.runInNewContext(render,c);return {c,nodes,run:()=>vm.runInNewContext('renderThread(currentThread)',c)}}
test('other-device state never withholds public lens answers',async()=>{const r=renderer(async()=>fixture('ms'));await r.run();assert.equal(r.c.lensButtons.children.length,6);r.c.lensButtons.children[0].listeners.click();assert.match(r.c.lensPanel.textContent,/^Jawapan sebenar science/);assert.doesNotMatch(r.c.lensPanel.textContent,/paused|dijeda/)});
test('a slower previous-language response cannot replace current-language answers',async()=>{let enResolve,msResolve;const pending={en:new Promise(r=>enResolve=r),ms:new Promise(r=>msResolve=r)};const r=renderer(language=>pending[language]);r.c.readerLanguage='en';const old=r.run();r.c.readerLanguage='ms';const latest=r.run();msResolve(fixture('ms'));await latest;enResolve(fixture('en'));await old;assert.equal(r.nodes['#thread-title'].textContent,'Topik 1');r.c.lensButtons.children[0].listeners.click();assert.match(r.c.lensPanel.textContent,/^Jawapan sebenar/) });
const languageChange=script.slice(script.indexOf('    async function setReaderLanguage('),script.indexOf("    languagePicker.addEventListener('change'"));
test('changing an open public discussion to BM does not fetch the licensed story',async()=>{let privateFetches=0,rendered=0;const c={readerLanguage:'en',bmFallbackShown:false,dialog:{open:true},currentThread:{number:1},accessReady:true,localStorage:{setItem(){}},refreshReaderUi(){},loadMalayTranslation:async()=>{privateFetches++;throw Error('Licensed story should not be requested')},status:{},pdf:{numPages:88},showPage:async()=>{},renderThread:async()=>rendered++};vm.runInNewContext(languageChange,c);await vm.runInNewContext('setReaderLanguage("ms")',c);assert.equal(privateFetches,0);assert.equal(rendered,1)});
