import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const listeners={},nodes=[],attrs=[],storage=new Map();
class Element{constructor(tag='DIV',id=''){this.tagName=tag;this.id=id;this.attributes={};this.children=[];this.style={};this.parentElement=null;this.classList={add(){},contains(){return false}}}setAttribute(k,v){this.attributes[k]=String(v)}getAttribute(k){return this.attributes[k]??null}append(...items){for(const x of items){x.parentElement=this;this.children.push(x)}}closest(){return this.id==='private-name'?this:null}addEventListener(k,fn){this[k]=fn}querySelectorAll(){return []}}
const body=new Element('BODY'),html=new Element('HTML');html.lang='en';
const text=(value,parent=body)=>{const n={nodeType:3,nodeValue:value,parentElement:parent};nodes.push(n);return n};
const heading=text('  Buy the app  '),privateName=text('Buy the app',new Element('SPAN','private-name')),number=text('RM 16.00'),dynamic=text('Preparing sign-in…');
const input=new Element('INPUT');input.value='Buy the app';input.setAttribute('placeholder','Full name');attrs.push(input);
const doc={readyState:'complete',documentElement:html,body,title:'MERCY',createElement:tag=>new Element(tag.toUpperCase()),createTreeWalker:()=>{let i=0;return {nextNode:()=>nodes[i++]||null}},querySelectorAll:()=>attrs,getElementById:()=>null,addEventListener(k,f){listeners[k]=f}};
const context={URLSearchParams,window:{},document:doc,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},location:{search:''},NodeFilter:{SHOW_TEXT:4},MutationObserver:class{constructor(fn){context.observer=fn}observe(){}},CustomEvent:class{constructor(type,value){this.type=type;Object.assign(this,value)}},setTimeout:fn=>{fn();return 1},clearTimeout(){},console};context.window=context;context.dispatchEvent=e=>{context.lastEvent=e};
vm.runInNewContext(fs.readFileSync('assets/site-language.js','utf8'),context);
assert.equal(typeof context.MercyLanguage?.setLanguage,'function','public language API exists');
context.MercyLanguage.setLanguage('ms');assert.equal(html.lang,'ms');assert.equal(storage.get('mercyLanguage'),'ms');assert.equal(heading.nodeValue,'  Beli aplikasi  ');assert.equal(number.nodeValue,'RM 16.00');assert.equal(input.value,'Buy the app','user-entered values are never translated');assert.equal(privateName.nodeValue,'Buy the app','marked private nodes stay intact');assert.equal(input.getAttribute('placeholder'),'Nama penuh');
context.MercyLanguage.setLanguage('en');assert.equal(heading.nodeValue,'  Buy the app  ');assert.equal(input.getAttribute('placeholder'),'Full name');
dynamic.nodeValue='Full name';context.MercyLanguage.setLanguage('ms');assert.equal(dynamic.nodeValue,'Nama penuh','newly generated English text is translated');
context.MercyLanguage.setLanguage('en');assert.equal(dynamic.nodeValue,'Full name','English restoration uses the latest source');assert.equal(context.lastEvent.detail.language,'en');
console.log('BM/English switch: persistence, source restoration, dynamic text, placeholders and private input protection passed');
