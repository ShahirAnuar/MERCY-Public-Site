'use strict';
const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict'), {test} = require('node:test');
const source = fs.readFileSync(new URL('../assets/reading-audio.js', 'file://' + __filename), 'utf8');
class Element {
  constructor(tag) { this.tagName = tag; this.children = []; this.listeners = new Map(); this.dataset = {}; this.attributes = {}; this.value = ''; this.textContent = ''; this.paused = true; }
  append(...nodes) { this.children.push(...nodes); for (const child of nodes) { child.parent = this; if (this.tagName === 'select' && (child.selected || !this.value)) this.value = child.value; } }
  replaceChildren(...nodes) { this.children = []; this.value = ''; this.append(...nodes); }
  setAttribute(key, value) { this.attributes[key] = value; }
  removeAttribute(key) { delete this.attributes[key]; }
  addEventListener(type, handler) { if (!this.listeners.has(type)) this.listeners.set(type, []); this.listeners.get(type).push(handler); }
  removeEventListener(type, handler) { this.listeners.set(type, (this.listeners.get(type) || []).filter(item => item !== handler)); }
  dispatch(type, value = {}) { for (const fn of this.listeners.get(type) || []) fn(value); }
  pause() { this.paused = true; }
  load() {}
  remove() { if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this); }
}
const find = (node, predicate) => predicate(node) ? node : node.children.map(child => find(child, predicate)).find(Boolean);
function setup(voices = [{name:'English',lang:'en-GB',voiceURI:'en',default:true}], speech = true) {
  const window = new Element('window'), spoken = [], timers = new Map(); let timerId = 0;
  window.setTimeout = fn => {timers.set(++timerId, fn); return timerId}; window.clearTimeout = id => timers.delete(id);
  if (speech) {
    window.speechSynthesis = Object.assign(new Element('speech'), {getVoices:()=>voices, speak(utterance) {spoken.push(utterance); utterance.onstart();}, cancel(){this.cancels=(this.cancels||0)+1}, pause(){this.paused=true},resume(){this.paused=false}});
    window.SpeechSynthesisUtterance = class {constructor(text){this.text=text}};
  }
  vm.runInNewContext(source, {window, document:{createElement:tag=>new Element(tag)}, Set, String, TypeError});
  const container = new Element('div');
  return {window, spoken, timers, container, mount:options=>window.MercyAudio.mount(container, options), voices};
}
const click = async button => {button.dispatch('click'); await Promise.resolve(); await Promise.resolve()};
test('speech chunks stay bounded and proceed sequentially through the entire current text', async()=>{
  const s=setup(), text='A thoughtful sentence on reading and kindness. '.repeat(60), app=s.mount({getText:async()=>text,getLanguage:()=> 'en'});
  const start=find(app.element,n=>n.tagName==='button'&&n.textContent==='Read aloud'); await click(start);
  assert.equal(s.spoken.length,1); let guard=0;
  while(s.spoken.at(-1)?.onend && ++guard<200){const utterance=s.spoken.at(-1); assert.ok(utterance.text.length<=180); assert.equal(utterance.lang,'en-GB'); utterance.onend(); if(find(app.element,n=>n.className==='mercy-audio-status').textContent==='Reading finished.')break;}
  assert.ok(s.spoken.length>1); assert.equal(s.spoken.map(x=>x.text).join(' '),text.trim()); assert.equal(s.timers.size,0);
});
test('language changes cancel a pending content load and do not use an English voice as Malay',async()=>{
  const s=setup(); let language='en', resolve;
  const app=s.mount({getText:()=>new Promise(r=>resolve=r),getLanguage:()=>language});
  const start=find(app.element,n=>n.tagName==='button'&&n.textContent==='Read aloud'); await click(start);
  language='ms'; s.window.dispatch('mercy-language-change'); resolve('Old language text.'); await Promise.resolve(); await Promise.resolve();
  assert.equal(s.spoken.length,0); assert.equal(start.disabled,true); assert.match(find(app.element,n=>n.className==='mercy-audio-status').textContent,/Tiada suara Bahasa Melayu/);
  s.voices.push({name:'Bahasa Melayu',lang:'ms-MY',voiceURI:'ms'}); s.window.speechSynthesis.dispatch('voiceschanged'); assert.equal(start.disabled,false);
  app.destroy(); assert.equal(s.container.children.length,0);
});
test('recitation and read-aloud never overlap, and explicit pause/resume/stop work',async()=>{
  const s=setup(), app=s.mount({getText:async()=> 'Current page.',getLanguage:()=> 'en'}), app2=s.mount({getText:async()=> 'Other page.',getLanguage:()=> 'en'});
  app.audio.paused=false; await click(find(app.element,n=>n.tagName==='button'&&n.textContent==='Read aloud')); assert.equal(app.audio.paused,true);
  const pause=find(app.element,n=>n.tagName==='button'&&n.textContent==='Pause'); await click(pause); assert.equal(s.window.speechSynthesis.paused,true); assert.equal(pause.textContent,'Resume');
  await click(pause); assert.equal(s.window.speechSynthesis.paused,false); assert.equal(pause.textContent,'Pause');
  app2.audio.paused=false; app2.audio.dispatch('play'); assert.equal(pause.disabled,true); assert.equal(app.audio.paused,true);
  await click(find(app2.element,n=>n.tagName==='button'&&n.textContent==='Read aloud')); assert.equal(app2.audio.paused,true);
  s.window.MercyAudio.stop(); assert.equal(find(app2.element,n=>n.tagName==='button'&&n.textContent==='Stop').disabled,true);
});
test('page context changes cancel speech without stopping a user-chosen surah',async()=>{
  const s=setup(), app=s.mount({getText:async()=> 'One page.',getLanguage:()=> 'en'});
  await click(find(app.element,n=>n.tagName==='button'&&n.textContent==='Read aloud'));
  s.window.dispatch('mercy-reading-context-change'); assert.equal(find(app.element,n=>n.tagName==='button'&&n.textContent==='Pause').disabled,true);
  app.audio.paused=false; s.window.dispatch('mercy-reading-context-change'); assert.equal(app.audio.paused,false);
});
test('unsupported browsers disable TTS but retain native surah controls',()=>{
  const s=setup([],false),app=s.mount({getLanguage:()=> 'ms'});
  assert.equal(find(app.element,n=>n.tagName==='button'&&n.textContent==='Baca dengan suara').disabled,true);
  assert.equal(app.audio.controls,true); assert.equal(app.audio.preload,'none'); assert.equal(app.audio.src,'/assets/audio/al-qalam.mp3'); assert.match(find(app.element,n=>n.className==='mercy-audio-status').textContent,/tidak menyokong/);
});
test('a speech engine stall becomes a recoverable error, and stale completion cannot restart speech',async()=>{
  const s=setup(),app=s.mount({getText:async()=> 'One sentence. Another sentence.',getLanguage:()=> 'en'});
  await click(find(app.element,n=>n.tagName==='button'&&n.textContent==='Read aloud')); const old=s.spoken[0];
  for(const fn of [...s.timers.values()])fn(); assert.match(find(app.element,n=>n.className==='mercy-audio-status').textContent,/could not start/);
  old.onend(); assert.equal(s.spoken.length,1); assert.equal(find(app.element,n=>n.tagName==='button'&&n.textContent==='Read aloud').disabled,false);
});
test('content preparation errors give the actionable message as plain text',async()=>{
  const s=setup(), app=s.mount({getText:async()=>{throw Error('Open your purchased book first. <b>Help</b>')},getLanguage:()=> 'en'});
  await app.read(); assert.equal(find(app.element,n=>n.className==='mercy-audio-status').textContent,'Open your purchased book first. <b>Help</b>');
  assert.equal(s.spoken.length,0);
});
test('cancellation releases pending text resources while pause retains them',async()=>{
  const s=setup(); let cancellations=0, resolve;
  const app=s.mount({getText:()=>new Promise(r=>resolve=r),getLanguage:()=> 'en',onCancel:()=>{cancellations++}});
  const pending=app.read(); const beforeStop=cancellations; app.stop(); assert.equal(cancellations,beforeStop+1);
  resolve('Prepared after cancellation.'); await pending; assert.equal(s.spoken.length,0);
  const other=s.mount({getText:async()=> 'A current page.',getLanguage:()=> 'en'});
  const beforeOther=cancellations; await other.read(); assert.equal(cancellations,beforeOther+1);
  const own=s.mount({getText:async()=> 'Read this sentence.',getLanguage:()=> 'en',onCancel:()=>{cancellations++}}); await own.read();
  const beforePause=cancellations; await click(find(own.element,n=>n.tagName==='button'&&n.textContent==='Pause')); assert.equal(cancellations,beforePause);
});
