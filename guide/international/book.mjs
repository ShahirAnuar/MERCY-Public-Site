// Reuse the illustrated local reader with the parent's verified access.
export function mountCompanionBook({getLanguage,getAccess,onPosition,onError,onFinish,onInstall,onLanguage}) {
 const reader=document.getElementById('reader');
 const backend='https://mercy-malaysia-orders-reviews.shahiranuar.chatgpt.site';
 let frame=null;
 function authenticate(){if(frame&&getAccess().credential)frame.contentWindow.postMessage({type:'GUIDE_READER_AUTH',...getAccess()},backend)}
 window.addEventListener('message',event=>{
  if(!frame||event.source!==frame.contentWindow||event.origin!==backend)return;
  const data=event.data;
  if(data?.type==='GUIDE_READER_READY')authenticate();
  else if(data?.type==='GUIDE_READER_ERROR')onError({status:Number(data.status)||0});
  else if(data?.type==='GUIDE_READER_FINISH')onFinish();
  else if(data?.type==='GUIDE_READER_INSTALL')onInstall();
  else if(data?.type==='GUIDE_READER_LANGUAGE')onLanguage(data.language);
  else if(data?.type==='GUIDE_READER_UPDATE_REQUIRED')window.GuideAppPolicy.block('Update The Guide before reading.');
  else if(data?.type==='GUIDE_READER_THREAD'&&Number.isInteger(data.thread))onPosition(data.thread);
 });
 return {
  show(entries){
   if(!Array.isArray(entries)||entries.length!==86)throw Error('The complete reading guide is unavailable.');
   frame?.remove();frame=document.createElement('iframe');
   frame.id='full-guide-frame';frame.title='MERCY — complete book and six lenses';
   frame.allow='fullscreen';frame.referrerPolicy='strict-origin-when-cross-origin';
   const url=new URL(backend+'/guide/international/reader/');
   url.searchParams.set('lang',getLanguage());
   url.searchParams.set('country',document.getElementById('international-country').value);
   frame.src=url.href;frame.addEventListener('load',authenticate);
   reader.append(frame);reader.hidden=false;
  },
  hide(){frame?.remove();frame=null;reader.hidden=true;window.MercyAudio?.stop()}
 };
}
