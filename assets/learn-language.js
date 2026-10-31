// BM lens examples remain protected by the existing paid-reader entitlement.
(() => {
 let requestSequence=0;
 const language=()=>window.MercyLanguage?.getLanguage()||document.documentElement.lang;
 async function show(number,lens,panel,choices){
  const sequence=++requestSequence;
  panel.hidden=false;panel.textContent='Sedang membuka contoh lensa Bahasa Melayu…';
  function accessHelp(){panel.replaceChildren();const message=document.createElement('span');message.textContent='Contoh lensa Bahasa Melayu memerlukan akses aplikasi yang sah. Jika anda sudah membeli, buka aplikasi menggunakan nombor siri dan kod e-mel anda. Tidak perlu membeli semula. ';const link=document.createElement('a');link.href='/reader/?lang=ms';link.textContent='Buka aplikasi The Guide';panel.append(message,link)}
  try{
   const token=localStorage.getItem('mercyEmailAccess')||'',device=localStorage.getItem('mercyDeviceId')||'';
   if(!token||!device){accessHelp();return}
   const response=await fetch('https://mercy-malaysia-orders-reviews.shahiranuar.chatgpt.site/api/lenses/example?thread='+encodeURIComponent(number)+'&lens='+encodeURIComponent(lens)+'&lang=ms',{headers:{'x-mercy-access':token,'x-mercy-device':device},cache:'no-store'});
   const data=await response.json().catch(()=>({}));if(sequence!==requestSequence||language()!=='ms')return;
   if(!response.ok||typeof data.example!=='string'){accessHelp();return}
   panel.textContent=data.example;choices.forEach(item=>item.setAttribute('aria-pressed',String(item.dataset.lens===lens)));
  }catch{if(sequence===requestSequence&&language()==='ms')panel.textContent='Contoh lensa belum dapat dibuka. Semak sambungan internet dan buka aplikasi The Guide untuk mengesahkan akses anda.'}
 }
 window.MercyLearnBM={show};
 window.addEventListener('mercy-language-change',()=>{requestSequence++;const panel=document.querySelector('.lens-panel');if(panel){panel.hidden=true;panel.textContent=''}for(const button of document.querySelectorAll('.lens-buttons button'))button.setAttribute('aria-pressed','false')});
})();
