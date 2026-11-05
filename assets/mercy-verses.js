/* Exact Arabic Quran text is supplied by Tanzil Project (CC BY 3.0).
   Corpus credits and the verbatim source notice are in quran-verses.json. */
(() => {
  'use strict';
  const instances = new WeakMap(), mounted = new Set();
  let sequence = 0, dataPromise, activePlayer = null;
  const assetBase=new URL('.',document.currentScript?.src||'https://mercyseries.com/assets/mercy-verses.js');
  const recitationAPI='https://mercy-malaysia-orders-reviews.shahiranuar.chatgpt.site/api/quran/recitation';
  const copy = {
    en: {show:'Reveal the verse',hide:'Hide the verse',loading:'Opening the verse…',failure:'The verse could not load. Please try again or open the source below.',arabic:'Arabic text',translation:'Translation of the meaning',source:'Arabic text: ',read:'Read on Quran.com',credit:'Source and translation credits',footnotes:'Translator’s notes'},
    ms: {show:'Paparkan ayat',hide:'Sembunyikan ayat',loading:'Sedang membuka ayat…',failure:'Ayat belum dapat dimuatkan. Cuba lagi atau buka sumber di bawah.',arabic:'Teks Arab',translation:'Terjemahan makna',source:'Teks Arab: ',read:'Baca di Quran.com',credit:'Sumber teks dan terjemahan',footnotes:'Nota penterjemah'},
    ar: {show:'عرض الآية',hide:'إخفاء الآية',loading:'جارٍ فتح الآية…',failure:'تعذر تحميل الآية. حاول مجددًا أو افتح المصدر أدناه.',arabic:'النص العربي',translation:'ترجمة المعنى',source:'النص العربي: ',read:'اقرأ على Quran.com',credit:'مصادر النص والترجمة',footnotes:'ملاحظات المترجم'}
  };
  const audioCopy={
    en:{play:'Play verse',pause:'Pause',resume:'Resume',stop:'Stop',reciter:'Reciter',loading:'Loading recitation…',ready:'Arabic recitation · Internet required',playing:'Playing',paused:'Recitation paused',done:'Recitation finished',failure:'Recitation could not play. Check your connection and press Play verse to retry.'},
    ms:{play:'Dengar ayat',pause:'Jeda',resume:'Sambung',stop:'Henti',reciter:'Qari',loading:'Memuatkan bacaan…',ready:'Bacaan Arab · Memerlukan internet',playing:'Sedang memainkan',paused:'Bacaan dijeda',done:'Bacaan selesai',failure:'Bacaan belum dapat dimainkan. Semak sambungan internet dan tekan Dengar ayat untuk mencuba lagi.'},
    ar:{play:'استمع إلى الآية',pause:'إيقاف مؤقت',resume:'استئناف',stop:'إيقاف',reciter:'القارئ',loading:'جارٍ تحميل التلاوة…',ready:'تلاوة عربية · يلزم الاتصال بالإنترنت',playing:'قيد التشغيل',paused:'توقفت التلاوة مؤقتًا',done:'انتهت التلاوة',failure:'تعذر تشغيل التلاوة. تحقّق من الاتصال واضغط استمع إلى الآية للمحاولة مجددًا.'}
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
      dataPromise=fetch(new URL('quran-verses.json?v=20261101',assetBase).href,{signal:controller.signal,credentials:'omit'}).then(response=>{
        if(!response.ok)throw new Error('Verse source unavailable');return response.json();
      }).then(data=>{if(!data||!data.verses)throw new Error('Invalid verse source');return data;}).catch(error=>{dataPromise=null;throw error;}).finally(()=>clearTimeout(timer));
    }
    return dataPromise;
  }
  function node(tag,className,text) {const element=document.createElement(tag);if(className)element.className=className;if(text!==undefined)element.textContent=text;return element;}
  function link(url,text) {const a=node('a','mercy-verse-source-link',text);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;}
  function recitationPlayer(host,parsed,getLanguage) {
    const box=node('span','mercy-verse-audio'),label=node('label'),select=node('select'),play=node('button'),pause=node('button'),stop=node('button'),status=node('span','mercy-verse-status'),audio=document.createElement('audio');
    const reciterLabel=node('span');label.append(reciterLabel,select);
    for(const [value,name] of [['alafasy','Mishary Rashid Alafasy'],['ajmi','Ahmad Al-Ajmi']]){const option=node('option','',name);option.value=value;select.append(option);}
    select.value='alafasy';try{const stored=localStorage.getItem('mercyQuranReciter');if(['alafasy','ajmi'].includes(stored))select.value=stored;}catch{}
    for(const button of [play,pause,stop])button.type='button';
    status.setAttribute('role','status');status.setAttribute('aria-live','polite');audio.preload='none';audio.hidden=true;
    const credit=link('https://www.mp3quran.net/eng','MP3Quran.net');box.append(label,play,pause,stop,status,credit,audio);host.append(box);
    let mode='ready',segments=null,index=0,run=0,timer=null,loadTimer=null,controller=null,destroyed=false,pendingPlay=false;
    const texts=()=>audioCopy[getLanguage()]||audioCopy.en;
    function refresh(){const t=texts();reciterLabel.textContent=t.reciter;select.setAttribute('aria-label',t.reciter);play.textContent=mode==='paused'?t.resume:t.play;pause.textContent=t.pause;stop.textContent=t.stop;pause.disabled=mode!=='playing';stop.disabled=!['playing','paused','loading'].includes(mode);play.disabled=mode==='loading'||mode==='playing';status.textContent=mode==='playing'?t.playing+' · '+parsed.chapter+':'+segments[index].ayah:t[mode]||t.ready;}
    function clearTimer(){if(loadTimer!==null){clearTimeout(loadTimer);loadTimer=null;}if(timer!==null){clearInterval(timer);timer=null;}}
    function cancel(next='ready'){run++;pendingPlay=false;controller?.abort();controller=null;clearTimer();audio.pause();mode=next;if(activePlayer===api)activePlayer=null;if(!destroyed)refresh();}
    function otherAudio(){window.MercyAudio?.stop();document.querySelectorAll('audio').forEach(other=>{if(other!==audio)other.pause();});}
    function validPayload(data){if(!Array.isArray(data?.segments)||data.segments.length!==parsed.keys.length)throw Error('Invalid recitation');for(let i=0;i<data.segments.length;i++){const segment=data.segments[i],url=new URL(segment.url);if(url.protocol!=='https:'||!(url.hostname==='mp3quran.net'||url.hostname.endsWith('.mp3quran.net'))||segment.surah!==parsed.chapter||segment.ayah!==parsed.start+i||!Number.isFinite(segment.start)||!Number.isFinite(segment.end)||segment.start<0||segment.end<=segment.start)throw Error('Invalid recitation');}return data.segments;}
    async function metadata(token){if(segments)return segments;const requestController=new AbortController();controller=requestController;const timeout=setTimeout(()=>requestController.abort(),25000);try{const url=new URL(recitationAPI);url.searchParams.set('reference',parsed.reference);url.searchParams.set('reciter',select.value);const response=await fetch(url.href,{credentials:'omit',signal:requestController.signal});if(!response.ok)throw Error('Recitation unavailable');const data=await response.json();if(destroyed||token!==run)return null;segments=validPayload(data);return segments;}finally{clearTimeout(timeout);if(controller===requestController)controller=null;}}
    function reachedEnd(){if(mode!=='playing'||pendingPlay)return;const segment=segments[index];if(audio.currentTime>=segment.end-.04){audio.pause();clearTimer();if(index+1<segments.length){index++;startSegment(run);}else cancel('done');}}
    function startSegment(token,resumeAt=null){if(destroyed||token!==run)return;const segment=segments[index];clearTimer();loadTimer=setTimeout(()=>{if(token===run)cancel('failure');},15000);pendingPlay=true;const source=new URL(segment.url).href;if(audio.src!==source){audio.src=source;audio.load();}
      function ready(){if(destroyed||token!==run)return;try{audio.currentTime=resumeAt!==null&&resumeAt>=segment.start&&resumeAt<segment.end?resumeAt:segment.start;otherAudio();activePlayer=api;Promise.resolve(audio.play()).then(()=>{if(destroyed||token!==run)return;pendingPlay=false;mode='playing';refresh();clearTimer();timer=setInterval(reachedEnd,50);}).catch(()=>{if(token===run)cancel('failure');});}catch{if(token===run)cancel('failure');}}
      if(audio.readyState>=1)ready();else audio.addEventListener('loadedmetadata',ready,{once:true});
    }
    async function begin(){if(destroyed)return;if(activePlayer&&activePlayer!==api)activePlayer.stop();otherAudio();const resumeAt=mode==='paused'?audio.currentTime:null;cancel();const token=run;activePlayer=api;mode='loading';refresh();try{if(!await metadata(token)||token!==run)return;if(resumeAt===null)index=0;startSegment(token,resumeAt);}catch{if(token===run)cancel('failure');}}
    function onPause(){if(mode!=='playing')return;audio.pause();clearTimer();mode='paused';refresh();}
    function onContext(){cancel();}function onError(){if(['playing','loading','paused'].includes(mode))cancel('failure');}
    const dialog=host.closest?.('dialog');dialog?.addEventListener('close',onContext);play.addEventListener('click',begin);pause.addEventListener('click',onPause);stop.addEventListener('click',()=>cancel());
    select.addEventListener('change',()=>{cancel();segments=null;try{localStorage.setItem('mercyQuranReciter',select.value);}catch{}});
    audio.addEventListener('timeupdate',reachedEnd);audio.addEventListener('ended',()=>{if(mode==='playing'){clearTimer();if(index+1<segments.length){index++;startSegment(run);}else cancel('done');}});audio.addEventListener('error',onError);
    const api={stop:()=>cancel(),refresh,destroy(){cancel();destroyed=true;dialog?.removeEventListener('close',onContext);audio.removeAttribute('src');audio.load();box.remove();}};refresh();return api;
  }
  function enhance(control,reference,options={}) {
    if(!control)return null;
    for(const api of mounted)if(!api.connected())api.destroy();
    const existing=instances.get(control),parsed=parse(reference);
    if(!parsed){existing?.destroy();return null;}
    if(existing?.reference===parsed.reference)return existing;
    if(existing)existing.destroy();
    const getLanguage=()=>{const requested=options.getLanguage?.()||document.documentElement.lang;return Object.hasOwn(copy,requested)?requested:'en';};
    const original={text:control.textContent,role:control.getAttribute('role'),tabindex:control.getAttribute('tabindex')};
    const panel=node('span','mercy-verse-panel');panel.id='mercy-verse-'+(++sequence);panel.hidden=true;panel.setAttribute('role','region');panel.setAttribute('aria-label','Qur’an '+parsed.reference);panel.setAttribute('translate','no');
    const content=node('span','mercy-verse-content');panel.append(content);
    control.classList.add('mercy-verse-toggle');control.setAttribute('aria-controls',panel.id);control.setAttribute('aria-expanded','false');
    if(control.tagName==='A'){control.href='https://quran.com/'+parsed.reference;control.setAttribute('role','button');}
    if(control.tagName!=='BUTTON'&&control.tagName!=='A'){control.setAttribute('role','button');control.tabIndex=0;}
    control.insertAdjacentElement('afterend',panel);
    const audioHost=node('span','mercy-verse-audio-host');panel.insertAdjacentElement('beforebegin',audioHost);const player=recitationPlayer(audioHost,parsed,getLanguage);
    let expanded=false,revision=0,destroyed=false;
    function fallback(t) {return link('https://quran.com/'+parsed.reference,t.read);}
    function richText(parent,html) {
      // Source text is retained verbatim in JSON; render only harmless formatting.
      if(!/[<&]/.test(html)){parent.textContent=html;return;}
      const parsedHTML=new DOMParser().parseFromString(html,'text/html');
      function copyChildren(source,target){for(const child of source.childNodes){if(child.nodeType===3)target.append(document.createTextNode(child.textContent));else if(child.nodeType===1){const tag=child.tagName.toLowerCase();if(['br','sup','sub','em','strong','b','i'].includes(tag)){const element=document.createElement(tag);copyChildren(child,element);target.append(element);}else if(!['script','style','iframe'].includes(tag))copyChildren(child,target);}}}
      copyChildren(parsedHTML.body,parent);
    }
    function labels() {const language=getLanguage(),t=copy[language],reference=(language==='ms'?'al-Quran ':'Qur’an ')+parsed.reference;control.textContent=reference;control.setAttribute('aria-label',(expanded?t.hide:t.show)+' · '+reference);return t;}
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
    function setOpen(next){if(!panel.parentNode)control.insertAdjacentElement('afterend',panel);expanded=next;revision++;control.setAttribute('aria-expanded',String(expanded));panel.hidden=!expanded;labels();if(expanded)load();else player.stop();}
    function click(event){if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();setOpen(!expanded);}
    function keydown(event){if(event.key===' '||(event.key==='Enter'&&control.tagName!=='BUTTON'&&control.tagName!=='A')){event.preventDefault();setOpen(!expanded);}}
    control.addEventListener('click',click);control.addEventListener('keydown',keydown);labels();
    const api={reference:parsed.reference,refresh(){player.stop();player.refresh();labels();if(expanded)load();},destroy(){destroyed=true;revision++;player.destroy();audioHost.remove();control.removeEventListener('click',click);control.removeEventListener('keydown',keydown);panel.remove();control.classList.remove('mercy-verse-toggle');control.removeAttribute('aria-expanded');control.removeAttribute('aria-controls');control.textContent=original.text;for(const name of ['role','tabindex']){if(original[name]===null)control.removeAttribute(name);else control.setAttribute(name,original[name]);}mounted.delete(api);instances.delete(control);},connected:()=>control.isConnected};
    instances.set(control,api);mounted.add(api);return api;
  }
  window.addEventListener('mercy-language-change',()=>{for(const api of mounted){if(!api.connected())api.destroy();else api.refresh();}});
  const stop=()=>activePlayer?.stop();window.addEventListener('mercy-reading-context-change',stop);window.addEventListener('pagehide',stop);document.addEventListener('play',event=>{if(activePlayer&&event.target?.closest?.('.mercy-verse-audio')===null)stop();},true);
  window.MercyVerses={enhance,parse,stop,cleanup(){for(const api of mounted)if(!api.connected())api.destroy();}};
})();
