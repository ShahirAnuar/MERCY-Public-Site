import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url).pathname;
class Element{
 constructor(tag,attrs={}){this.tagName=tag;this.attrs=attrs;this.id=attrs.id;this.hidden='hidden'in attrs;this.disabled='disabled'in attrs;this.value=attrs.value||'';this.textContent='';this.children=[];this.listeners={};this.dataset={};this.style={};this.elements={};this.classes=new Set((attrs.class||'').split(' '));this.classList={toggle:(c,v)=>v?this.classes.add(c):this.classes.delete(c),add:c=>this.classes.add(c),remove:c=>this.classes.delete(c),contains:c=>this.classes.has(c)};}
 addEventListener(k,fn){this.listeners[k]=fn;}
 setAttribute(k,v){this.attrs[k]=v;}
 append(...x){this.children.push(...x);}
 replaceChildren(...x){this.children=x;}
 reportValidity(){return true;}
 reset(){}
 focus(){}
 close(){this.open=false;}
 showModal(){this.open=true;}
 querySelector(s){return this.doc.querySelector(s)}
 querySelectorAll(){return this.children;}
}
function docFor(html){
 const all=[];
 for(const tag of html.matchAll(/<([a-z][a-z0-9-]*)(\s[^>]*|)>/gi)){const attrs={};for(const a of tag[2].matchAll(/([\w-]+)(?:="([^"]*)")?/g))attrs[a[1]]=a[2]??'';all.push(new Element(tag[1],attrs));}
 const doc={head:new Element('head'),hidden:false,addEventListener(){},querySelector(s){let el;if(s.startsWith('#'))el=all.find(e=>e.id===s.slice(1));else if(s.startsWith('.'))el=all.find(e=>e.classes.has(s.slice(1)));else if(s==='link[rel="manifest"]')el=all.find(e=>e.tagName==='link'&&e.attrs.rel==='manifest');else throw Error('Unimplemented real selector '+s);if(!el)throw Error('Selector not found in actual HTML: '+s);return el;},createElement(tag){const e=new Element(tag);e.doc=doc;return e;}};
 for(const el of all)el.doc=doc;doc.head.doc=doc;
 for(const form of all.filter(e=>e.tagName==='form'))for(const input of all.filter(e=>'name'in e.attrs))form.elements[input.attrs.name]=input;
 return doc;
}
function contextFor(html,fetch){
 const document=docFor(html),storage=new Map,events={},location={href:'https://mercyseries.com/reader/?session_id=cs_test_should_not_be_visible&safe=yes',search:''};let replaced='';
 const c={document,URL,URLSearchParams,location,history:{replaceState(a,b,url){replaced=url}},navigator:{},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)},crypto:{randomUUID:()=> '11111111-1111-1111-1111-111111111111'},fetch,atob:s=>Buffer.from(s,'base64').toString('binary'),setTimeout:()=>1,clearTimeout(){},setInterval:()=>1,clearInterval(){},window:{addEventListener(k,fn){events[k]=fn;},matchMedia:()=>({matches:false,addEventListener(){}})}};
 return {c,document,storage,replaced:()=>replaced};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
const affiliateHtml=fs.readFileSync(root+'affiliate-program/index.html','utf8');const affiliateScript=affiliateHtml.match(/<script>([\s\S]*?)<\/script>/)[1];
let initialized;
const a=contextFor(affiliateHtml,async url=>({ok:url.endsWith('/status'),json:async()=>({registrationOpen:true,termsVersion:'2026-10-31-v2'})}));
a.c.google={accounts:{id:{initialize:x=>initialized=x,renderButton(){}}}};vm.runInNewContext(affiliateScript,a.c);await settle();
assert.equal(a.document.querySelector('#affiliate-form').hidden,false);assert.equal(a.document.querySelector('#registration-fallback').hidden,true);assert.match(a.document.querySelector('#application-status').textContent,/Secure online registration is available/);assert.equal(a.document.head.children.length,1);
a.document.head.children[0].onload();await initialized.callback({credential:'a.'+Buffer.from(JSON.stringify({email:'buyer@example.test',name:'Buyer'})).toString('base64url')+'.b'});
assert.equal(a.document.querySelector('#registration-fields').disabled,false);assert.equal(a.document.querySelector('#affiliate-form').elements.email.value,'buyer@example.test');assert.equal(a.document.querySelector('#affiliate-form').elements.email.readOnly,true);
const b=contextFor(affiliateHtml,async()=>({ok:false}));vm.runInNewContext(affiliateScript,b.c);await settle();assert.equal(b.document.querySelector('#affiliate-form').hidden,true);assert.equal(b.document.querySelector('#registration-fallback').hidden,false);
const readerHtml=fs.readFileSync(root+'reader/index.html','utf8');const readerScript=readerHtml.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
const r=contextFor(readerHtml,async url=>({ok:true,json:async()=>url.endsWith('/verify-code')?{accessToken:'opaque-test',devices:1}:{exclusive:true}}));vm.runInNewContext(readerScript,r.c);
assert.equal(r.replaced(),'/reader/?safe=yes');assert.equal(r.document.querySelector('#checkout-notice').hidden,false);assert.ok(!r.document.querySelector('#checkout-notice').textContent.includes('cs_test'));r.document.querySelector('#reader-serial').value='MERCY-D-000123';r.document.querySelector('#reader-code').value='123456';await vm.runInNewContext('verifyCode()',r.c);assert.equal(r.storage.get('mercyReaderSerial'),'MERCY-D-000123');assert.equal(r.storage.get('mercyEmailAccess'),'opaque-test');
console.log('Actual HTML selector checks passed: registration API success opens form, Google callback enables fields, registration failure fallback, reader checkout URL redaction and serial fallback. No live requests made.');
