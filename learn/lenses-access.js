// Legacy companion pages use the same free public answers as the current guide.
(() => {
 function connect(){if(window.MercyLearning)window.mercyLens={show:(...args)=>window.MercyLearning.show(...args)};}
 if(window.MercyLearning){connect();return}
 const script=document.createElement('script');script.src='/assets/learn-language.js?v=open-answers-1';script.onload=connect;script.onerror=()=>{};document.head.append(script);
})();
