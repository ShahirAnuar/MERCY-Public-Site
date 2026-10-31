// MERCY's authored Malaysian BM translations. No content is sent to a translation service.
(() => {
 'use strict';
 const dictionaries=/* DICTIONARIES */;
 const path=location.pathname||'/',normalize=value=>String(value??'').replace(/\s+/g,' ').trim();
 const dictionary={...dictionaries.core,...(path.startsWith('/learn/')?dictionaries.learn:{}),...(/\/affiliate-program\/(?:terms|privacy)\//.test(path)?dictionaries.legal:{}),...(path.startsWith('/about-author/')?dictionaries.author:{})};
 const originals=new WeakMap(),attributes=new WeakMap();
 const ignored='script,style,code,pre,textarea,[contenteditable="true"],[translate="no"],.notranslate,[data-private],#private-name,#mercy-language-switch,#affiliate-id,#account-message,#payout-destination,#sales-body,#chat-messages,#chat-log,#assistant-chat,.g_id_signin';
 let language='en',scheduled=false,titleSource=document.title||'';
 function translate(value){
  const raw=String(value??''),key=normalize(raw);if(language!=='ms'||!key)return raw;
  let translated=dictionary[key];
  if(translated===undefined){
   const patterns=[
    [/^Buyer pays (RM[\d,.]+) · Estimated fee (RM[\d,.]+) · Affiliate earns (RM[\d,.]+) · Publisher receives (RM[\d,.]+)$/,'Pembeli membayar $1 · Anggaran fi $2 · Affiliate memperoleh $3 · Penerbit menerima $4'],
    [/^Buyer (RM[\d,.]+) · Affiliate (RM[\d,.]+)( provisional before tax| estimate) · Publisher (RM[\d,.]+)( · Issued| · Not issued)$/,'Pembeli $1 · Affiliate $2$3 · Penerbit $4$5'],
    [/^RM(\d+) off( · .+)?$/,'Diskaun RM$1$2'],
    [/^Story thread (.+?)( · a thought to carry)?$/,'Tema cerita $1$2'],
    [/^Qur’an ([\d:–-]+) · Read the verse$/,'Al-Quran $1 · Baca ayat'],
    [/^Reference: (.+)$/,'Rujukan: $1'],
    [/^Submitted (.+)$/,'Dihantar $1'],
    [/^Evidence valid until (.+)$/,'Bukti sah sehingga $1']
   ];
   for(const [pattern,replacement] of patterns)if(pattern.test(key)){translated=key.replace(pattern,replacement).replace(' provisional before tax',' sementara sebelum cukai').replace(' estimate',' anggaran').replace(' · Not issued',' · Belum dikeluarkan').replace(' · Issued',' · Dikeluarkan').replace(' · Awaiting code',' · Menunggu kod').replace(' · a thought to carry',' · renungan untuk diingati');break}
  }
  if(translated===undefined)return raw;
  const leading=raw.match(/^\s*/)[0],trailing=raw.match(/\s*$/)[0];return leading+translated+trailing;
 }
 function excluded(element){return !element||Boolean(element.closest?.(ignored))}
 function applyText(node){
  if(excluded(node.parentElement))return;
  let state=originals.get(node);if(!state||node.nodeValue!==state.last)state={original:node.nodeValue,last:node.nodeValue};
  const value=translate(state.original);if(node.nodeValue!==value)node.nodeValue=value;state.last=value;originals.set(node,state);
 }
 function applyAttributes(element){
  if(excluded(element))return;
  let states=attributes.get(element);if(!states){states={};attributes.set(element,states)}
  for(const name of ['placeholder','aria-label','title','alt']){
   const current=element.getAttribute(name);if(current===null)continue;
   let state=states[name];if(!state||current!==state.last)state={original:current,last:current};
   const value=translate(state.original);if(current!==value)element.setAttribute(name,value);state.last=value;states[name]=state;
  }
 }
 function refresh(root=document.body){
  if(!root)return;
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;while((node=walker.nextNode()))applyText(node);
  for(const el of document.querySelectorAll('[placeholder],[aria-label],[title],[alt]'))applyAttributes(el);
 }
 function updateControls(){
  for(const el of document.querySelectorAll('[data-mercy-lang]'))el.setAttribute('aria-pressed',String(el.getAttribute('data-mercy-lang')===language));
  const legacy=document.getElementById('langToggleBtn'),label=document.getElementById('currentLangLabel');
  if(legacy){legacy.onclick=()=>setLanguage(language==='ms'?'en':'ms');const label=language==='ms'?'Switch to English':'Tukar ke Bahasa Melayu';if(legacy.getAttribute('aria-label')!==label)legacy.setAttribute('aria-label',label)}
  if(label){const target=language==='ms'?'EN':'BM';if(label.textContent!==target)label.textContent=target}
 }
 function setLanguage(value,{persist=true}={}){
  language=value==='ms'?'ms':'en';document.documentElement.lang=language;document.title=translate(titleSource);
  if(persist)try{localStorage.setItem('mercyLanguage',language)}catch{}
  refresh();updateControls();window.dispatchEvent(new CustomEvent('mercy-language-change',{detail:{language}}));
 }
 function mount(){
  const style=document.createElement('style');style.textContent='#mercy-language-switch{position:fixed;right:max(.65rem,env(safe-area-inset-right));bottom:max(.65rem,env(safe-area-inset-bottom));z-index:1000;display:flex;gap:.2rem;padding:.3rem;border:1px solid #d5a63d;border-radius:999px;background:#071f48;box-shadow:0 3px 15px #0005;font:700 13px/1.3 system-ui,sans-serif}#mercy-language-switch button{font:inherit;min-height:38px;padding:.45rem .7rem;border:0;border-radius:999px;background:transparent;color:#fff8e8;cursor:pointer}#mercy-language-switch button[aria-pressed=true]{background:#efd587;color:#071f48}#mercy-language-switch button:focus-visible{outline:3px solid white;outline-offset:2px}@media print{#mercy-language-switch{display:none}}';(document.head||document.body).append(style);
  const control=document.createElement('div');control.id='mercy-language-switch';control.setAttribute('role','group');control.setAttribute('aria-label','Language / Bahasa');
  for(const [value,label] of [['en','English'],['ms','Bahasa Melayu']]){const button=document.createElement('button');button.type='button';button.textContent=label;button.setAttribute('data-mercy-lang',value);button.setAttribute('aria-pressed',String(value===language));button.addEventListener('click',()=>setLanguage(value));control.append(button)}
  document.body.append(control);
  let stored;try{stored=localStorage.getItem('mercyLanguage')}catch{}
  const requested=new URLSearchParams(location.search).get('lang');setLanguage(['ms','en'].includes(requested)?requested:stored||'en',{persist:Boolean(requested)});
  const observer=new MutationObserver(()=>{if(scheduled)return;scheduled=true;setTimeout(()=>{scheduled=false;refresh();updateControls()},40)});
  observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','aria-label','title','alt']});
 }
 function sourceText(node){if(node?.nodeType===3)return originals.get(node)?.original??node.nodeValue;if(node?.childNodes)return Array.from(node.childNodes).map(sourceText).join('');return node?.textContent||''}
 window.MercyLanguage={setLanguage,getLanguage:()=>language,translate,refresh,sourceText};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
