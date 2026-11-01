/* Exact Arabic Quran text is supplied by Tanzil Project (CC BY 3.0).
   Corpus credits and the verbatim source notice are in quran-verses.json. */
(() => {
  'use strict';
  const instances = new WeakMap(), mounted = new Set();
  let sequence = 0, dataPromise;
  const copy = {
    en: {show:'Reveal the verse',hide:'Hide the verse',loading:'Opening the verse…',failure:'The verse could not load. Please try again or open the source below.',arabic:'Arabic text',translation:'Translation of the meaning',source:'Arabic text: ',read:'Read on Quran.com',credit:'Source and translation credits',footnotes:'Translator’s notes'},
    ms: {show:'Paparkan ayat',hide:'Sembunyikan ayat',loading:'Sedang membuka ayat…',failure:'Ayat belum dapat dimuatkan. Cuba lagi atau buka sumber di bawah.',arabic:'Teks Arab',translation:'Terjemahan makna',source:'Teks Arab: ',read:'Baca di Quran.com',credit:'Sumber teks dan terjemahan',footnotes:'Nota penterjemah'}
  };
  function parse(reference) {
    const match = /^(\d{1,3}):(\d{1,3})(?:[-–](\d{1,3}))?$/.exec(String(reference || '').trim());
    if (!match) return null;
    const chapter=Number(match[1]), start=Number(match[2]), end=Number(match[3] || match[2]);
    if(chapter<1||chapter>114||start<1||end<start||end>286||end-start>30)return null;
    return {chapter,start,end,reference:chapter+':'+start+(end===start?'':'-'+end),keys:Array.from({length:end-start+1},(_,i)=>chapter+':'+(start+i))};
  }
  function corpus() {
    if (!dataPromise) {
      const controller = new AbortController(), timer=setTimeout(()=>controller.abort(),12000);
      dataPromise=fetch('/assets/quran-verses.json?v=20261101',{signal:controller.signal,credentials:'omit'}).then(response=>{
        if(!response.ok)throw new Error('Verse source unavailable');return response.json();
      }).then(data=>{if(!data||!data.verses)throw new Error('Invalid verse source');return data;}).catch(error=>{dataPromise=null;throw error;}).finally(()=>clearTimeout(timer));
    }
    return dataPromise;
  }
  function node(tag,className,text) {const element=document.createElement(tag);if(className)element.className=className;if(text!==undefined)element.textContent=text;return element;}
  function link(url,text) {const a=node('a','mercy-verse-source-link',text);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;}
  function enhance(control,reference,options={}) {
    if(!control)return null;
    for(const api of mounted)if(!api.connected())api.destroy();
    const existing=instances.get(control),parsed=parse(reference);
    if(!parsed){existing?.destroy();return null;}
    if(existing?.reference===parsed.reference)return existing;
    if(existing)existing.destroy();
    const getLanguage=()=>options.getLanguage?.()==='ms'?'ms':'en';
    const original={text:control.textContent,role:control.getAttribute('role'),tabindex:control.getAttribute('tabindex')};
    const panel=node('span','mercy-verse-panel');panel.id='mercy-verse-'+(++sequence);panel.hidden=true;panel.setAttribute('role','region');panel.setAttribute('aria-label','Qur’an '+parsed.reference);panel.setAttribute('translate','no');
    const content=node('span','mercy-verse-content');panel.append(content);
    control.classList.add('mercy-verse-toggle');control.setAttribute('aria-controls',panel.id);control.setAttribute('aria-expanded','false');
    if(control.tagName==='A'){control.href='https://quran.com/'+parsed.reference;control.setAttribute('role','button');}
    if(control.tagName!=='BUTTON'&&control.tagName!=='A'){control.setAttribute('role','button');control.tabIndex=0;}
    control.insertAdjacentElement('afterend',panel);
    let expanded=false,revision=0,destroyed=false;
    function fallback(t) {return link('https://quran.com/'+parsed.reference,t.read);}
    function richText(parent,html) {
      // Source text is retained verbatim in JSON; render only harmless formatting.
      if(!/[<&]/.test(html)){parent.textContent=html;return;}
      const parsedHTML=new DOMParser().parseFromString(html,'text/html');
      function copyChildren(source,target){for(const child of source.childNodes){if(child.nodeType===3)target.append(document.createTextNode(child.textContent));else if(child.nodeType===1){const tag=child.tagName.toLowerCase();if(['br','sup','sub','em','strong','b','i'].includes(tag)){const element=document.createElement(tag);copyChildren(child,element);target.append(element);}else if(!['script','style','iframe'].includes(tag))copyChildren(child,target);}}}
      copyChildren(parsedHTML.body,parent);
    }
    function labels() {const t=copy[getLanguage()];control.textContent=(getLanguage()==='ms'?'al-Quran ':'Qur’an ')+parsed.reference+' · '+(expanded?t.hide:t.show);return t;}
    function render(data,t,language) {
      content.replaceChildren();
      for(const key of parsed.keys){
        const verse=data.verses[key];if(!verse?.arabic)throw new Error('Verse missing from source');
        const passage=node('span','mercy-verse-passage');
        const label=node('span','mercy-verse-number','Qur’an '+key);
        const arabic=node('span','mercy-verse-arabic',verse.arabic);arabic.lang='ar';arabic.dir='rtl';
        passage.append(label,arabic);
        const translated=verse[language];
        if(translated?.text){
          const title=node('span','mercy-verse-translation-label',t.translation);
          const text=node('span','mercy-verse-translation');richText(text,translated.text);text.lang=language;
          passage.append(title,text);
          if(translated.footnotes){const notes=node('span','mercy-verse-notes');notes.append(document.createTextNode(t.footnotes+': '));richText(notes,translated.footnotes);passage.append(notes);}
        }
        content.append(passage);
      }
      const credits=node('span','mercy-verse-credits');credits.append(document.createTextNode(t.source),link('https://tanzil.net/','Tanzil Project'),document.createTextNode(' · CC BY 3.0'));
      const edition=data.translations?.[language];
      if(edition){credits.append(document.createTextNode(' · '+t.translation+': '),link(edition.url,edition.name+' · v'+edition.version+' · QuranEnc.com'));}
      credits.append(document.createTextNode(' · '),fallback(t));content.append(credits);
    }
    async function load() {
      const id=++revision,language=getLanguage(),t=labels();
      const state=node('span','mercy-verse-status',t.loading);state.setAttribute('role','status');content.replaceChildren(state);
      try {const data=await corpus();if(destroyed||!expanded||id!==revision||language!==getLanguage())return;render(data,t,language);}
      catch {if(destroyed||!expanded||id!==revision)return;const error=node('span','mercy-verse-status',t.failure);error.setAttribute('role','status');content.replaceChildren(error,fallback(t));}
    }
    function setOpen(next){if(!panel.parentNode)control.insertAdjacentElement('afterend',panel);expanded=next;revision++;control.setAttribute('aria-expanded',String(expanded));panel.hidden=!expanded;labels();if(expanded)load();}
    function click(event){if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();setOpen(!expanded);}
    function keydown(event){if(event.key===' '||(event.key==='Enter'&&control.tagName!=='BUTTON'&&control.tagName!=='A')){event.preventDefault();setOpen(!expanded);}}
    control.addEventListener('click',click);control.addEventListener('keydown',keydown);labels();
    const api={reference:parsed.reference,refresh(){labels();if(expanded)load();},destroy(){destroyed=true;revision++;control.removeEventListener('click',click);control.removeEventListener('keydown',keydown);panel.remove();control.classList.remove('mercy-verse-toggle');control.removeAttribute('aria-expanded');control.removeAttribute('aria-controls');control.textContent=original.text;for(const name of ['role','tabindex']){if(original[name]===null)control.removeAttribute(name);else control.setAttribute(name,original[name]);}mounted.delete(api);instances.delete(control);},connected:()=>control.isConnected};
    instances.set(control,api);mounted.add(api);return api;
  }
  window.addEventListener('mercy-language-change',()=>{for(const api of mounted){if(!api.connected())api.destroy();else api.refresh();}});
  window.MercyVerses={enhance,parse,cleanup(){for(const api of mounted)if(!api.connected())api.destroy();}};
})();
