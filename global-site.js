(() => {
  "use strict";
  const themeNames = {book:"Book Theme",consultancy:"Polymath Nexus Theme",preschool:"Preschool · Ages 3–9"};
  const themeKey = "mercy-home-theme";
  const cookieGet = name => {
    const item = document.cookie.split("; ").find(part => part.startsWith(name+"="));
    return item ? decodeURIComponent(item.split("=").slice(1).join("=")) : "";
  };
  const saveTheme = theme => {
    try { localStorage.setItem(themeKey,theme); } catch (_) {}
    try { document.cookie = "mercy-theme="+encodeURIComponent(theme)+"; path=/; max-age=31536000; SameSite=Lax; domain=.mercyseries.com"; } catch (_) {}
  };
  const applyTheme = theme => {
    if (!themeNames[theme]) theme="book";
    document.documentElement.dataset.mercyTheme=theme;
    if (document.body) {
      document.body.dataset.mercyTheme=theme;
      document.body.dataset.theme=theme;
    }
    document.querySelectorAll("[data-theme-choice]").forEach(button => {
      button.setAttribute("aria-pressed",String(button.dataset.themeChoice===theme));
    });
    saveTheme(theme);
  };
  const getSavedTheme = () => {
    let theme=cookieGet("mercy-theme");
    if (!theme) { try { theme=localStorage.getItem(themeKey)||""; } catch (_) {} }
    return themeNames[theme] ? theme : "book";
  };
  const createMenu = () => {
    const menu=document.createElement("details");
    menu.className="brand-menu mercy-global-menu";
    menu.innerHTML='<summary class="brand" aria-label="MERCY home, themes and listening options">MERCY <span class="brand-caret" aria-hidden="true">▾</span></summary><div class="brand-menu-panel"><a class="return-home" href="/">← Return to homepage</a><hr><p class="menu-heading">Choose a theme</p><button type="button" data-theme-choice="book" aria-pressed="true">Book Theme</button><button type="button" data-theme-choice="consultancy" aria-pressed="false">Polymath Nexus Theme</button><button type="button" data-theme-choice="preschool" aria-pressed="false">Preschool · Ages 3–9</button><hr><p class="menu-heading">Listen to this page</p><button type="button" id="speech-play">▶ Read aloud</button><button type="button" id="speech-stop">■ Stop</button><label class="tap-read-option"><input type="checkbox" id="mercy-tap-to-read"><span>When enabled, tap a paragraph to stop current speech and start from that paragraph.</span></label><p class="speech-status" id="speech-status" aria-live="polite">Uses your browser’s available voice.</p></div>';
    return menu;
  };
  const ensureMenu = () => {
    let menu=document.querySelector("details.brand-menu");
    if (menu) {
      menu.classList.add("mercy-global-menu-home");
    } else {
      menu=createMenu();
      const header=document.querySelector("header");
      if (!header) {
        menu.classList.add("mercy-global-floating");
        document.body.prepend(menu);
      } else {
        const explicitBrand=header.querySelector("a.brand");
        if (explicitBrand) {
          explicitBrand.replaceWith(menu);
        } else {
          const visibleCandidate=[...header.querySelectorAll("a")].find(a=>/^\s*MERCY\b/i.test(a.textContent.trim()) && !a.closest("nav"));
          if (visibleCandidate) visibleCandidate.replaceWith(menu);
          else {
            const hiddenNavCandidate=[...header.querySelectorAll("nav a")].find(a=>/^\s*MERCY\b/i.test(a.textContent.trim()));
            if(hiddenNavCandidate) {
              const nav=hiddenNavCandidate.closest("nav");
              hiddenNavCandidate.remove();
              const host=nav.parentElement;
              host.insertBefore(menu,nav);
            } else {
              const host=header.querySelector(".header-inner,.max-w-7xl,.nav")||header;
              host.prepend(menu);
            }
          }
        }
      }
    }
    const panel=menu.querySelector(".brand-menu-panel");
    if (panel) {
      const isHome=location.pathname==="/" || location.pathname==="/index.html";
      if (!isHome && !panel.querySelector(".return-home")) {
        const link=document.createElement("a");
        link.className="return-home";link.href="/";link.textContent="← Return to homepage";
        panel.prepend(link);
        const divider=document.createElement("hr");
        link.after(divider);
      }
      if (!panel.querySelector("[data-theme-choice='book']")) {
        const heading=document.createElement("p");
        heading.className="menu-heading";heading.textContent="Choose a theme";
        panel.append(heading);
        [["book","Book Theme"],["consultancy","Polymath Nexus Theme"],["preschool","Preschool · Ages 3–9"]].forEach(([value,label])=>{
          const button=document.createElement("button");button.type="button";button.dataset.themeChoice=value;button.textContent=label;panel.append(button);
        });
      }
      if (!panel.querySelector("#speech-play")) {
        const heading=document.createElement("p");heading.className="menu-heading";heading.textContent="Listen to this page";panel.append(heading);
        const start=document.createElement("button");start.type="button";start.id="speech-play";start.textContent="▶ Read aloud";panel.append(start);
        const stop=document.createElement("button");stop.type="button";stop.id="speech-stop";stop.textContent="■ Stop";panel.append(stop);
      }
      if (!panel.querySelector("#mercy-tap-to-read")) {
        const label=document.createElement("label");label.className="tap-read-option";label.innerHTML='<input type="checkbox" id="mercy-tap-to-read"><span>When enabled, tap a paragraph to stop current speech and start from that paragraph.</span>';
        panel.querySelector("#speech-stop").after(label);
      }
      if (!panel.querySelector("#speech-status")) {
        const status=document.createElement("p");status.className="speech-status";status.id="speech-status";status.setAttribute("aria-live","polite");status.textContent="Uses your browser’s available voice.";panel.append(status);
      }
    }
    menu.addEventListener("toggle",()=>{
      if(menu.open && menu.classList.contains("mercy-global-menu")) {
        const r=menu.querySelector("summary").getBoundingClientRect();
        menu.style.setProperty("--mercy-menu-x",Math.max(10,Math.min(r.left,innerWidth-330))+"px");
        menu.style.setProperty("--mercy-menu-y",Math.min(r.bottom+8,innerHeight-90)+"px");
      }
    });
    return menu;
  };
  const companyMarkup='<strong>MERCY Global Series</strong><span class="company-copy">SSM registered business name: MERCY SERIES GLOBAL</span><span>SSM Business Registration No. 202603256493 (TR0350191-X)</span><span><a href="mailto:shahir@mercyseries.com">shahir@mercyseries.com</a></span>';
  const ensureCompanyFooter=()=>{
    let details=[...document.querySelectorAll(".mercy-company-details")];
    if (!details.length) {
      let footer=document.querySelector("footer");
      if(!footer){footer=document.createElement("footer");footer.className="mercy-company-footer";document.body.append(footer);}
      else footer.classList.add("mercy-company-footer");
      const item=document.createElement("div");item.className="mercy-company-details";item.setAttribute("aria-label","Company registration details");footer.append(item);details=[item];
    }
    details.forEach(item=>{item.setAttribute("aria-label","Company registration details");item.innerHTML=companyMarkup;});
  };
  const readPreference = () => {
    try { return localStorage.getItem("mercy-tap-to-read")==="true"; } catch (_) { return false; }
  };
  let tapToRead=readPreference();
  let queue=[],queueIndex=0,currentBlock=null;
  const status=()=>document.getElementById("speech-status");
  const setStatus=text=>{const node=status();if(node)node.textContent=text;};
  const getRoot=()=>document.querySelector("main,[role='main'],#app")||document.body;
  const readBlocks=()=>{
    const root=getRoot();
    return [...root.querySelectorAll("h1,h2,h3,h4,p,li,blockquote,td,th")]
      .filter(el=>!el.closest("script,style,button,a,nav,header,footer,.brand-menu,[hidden],[aria-hidden='true']"))
      .map(el=>({el,text:(el.innerText||el.textContent||"").replace(/\s+/g," ").trim()}))
      .filter(x=>x.text.length>0);
  };
  const stopSpeech=()=>{
    if("speechSynthesis" in window) window.speechSynthesis.cancel();
    document.querySelectorAll(".mercy-reading-current").forEach(el=>el.classList.remove("mercy-reading-current"));
    queue=[];queueIndex=0;currentBlock=null;
  };
  const speakNext=()=>{
    if(queueIndex>=queue.length){setStatus("Finished reading this page.");return;}
    const item=queue[queueIndex++];
    const utterance=new SpeechSynthesisUtterance(item.text);
    utterance.lang="en-GB";utterance.rate=1;
    utterance.onstart=()=>{
      document.querySelectorAll(".mercy-reading-current").forEach(el=>el.classList.remove("mercy-reading-current"));
      currentBlock=item.el;item.el.classList.add("mercy-reading-current");
      item.el.scrollIntoView({block:"nearest",behavior:"smooth"});
    };
    utterance.onend=()=>{item.el.classList.remove("mercy-reading-current");speakNext();};
    utterance.onerror=e=>{item.el.classList.remove("mercy-reading-current");if(e.error!=="canceled"&&e.error!=="interrupted")setStatus("Read-aloud stopped. Your browser may not have a voice available.");};
    window.speechSynthesis.speak(utterance);
  };
  const startAt=(element)=>{
    if(!("speechSynthesis" in window)||typeof SpeechSynthesisUtterance==="undefined"){setStatus("Read-aloud is not supported by this browser.");return;}
    const blocks=readBlocks();
    let index=element?blocks.findIndex(x=>x.el===element):0;
    if(index<0) index=0;
    stopSpeech();
    queue=blocks.slice(index).flatMap(item=>{
      let text=item.text,out=[];
      while(text.length>230){let cut=text.lastIndexOf(" ",230);if(cut<100)cut=230;out.push({el:item.el,text:text.slice(0,cut)});text=text.slice(cut).trim();}
      if(text)out.push({el:item.el,text});
      return out;
    });
    if(!queue.length){setStatus("There is no page text available to read.");return;}
    queueIndex=0;setStatus(element?"Reading from the selected paragraph.":"Reading this page aloud.");
    speakNext();
  };
  let pressTimer=null,pressTarget=null,pressX=0,pressY=0;
  const readerBlock=target=>target.closest("h1,h2,h3,h4,p,li,blockquote,td,th");
  const showReadButton=element=>{
    let button=document.querySelector(".mercy-read-from-here");
    if(!button){button=document.createElement("button");button.type="button";button.className="mercy-read-from-here";button.textContent="▶ Read from here";button.addEventListener("click",()=>{const el=pressTarget;button.remove();if(el)startAt(el);});document.body.append(button);}
    pressTarget=element;button.hidden=false;setStatus("Ready to read from the selected paragraph.");
  };
  const init=()=>{
    ensureMenu();
    ensureCompanyFooter();
    applyTheme(getSavedTheme());
    const tapToggle=document.getElementById("mercy-tap-to-read");
    if(tapToggle){tapToggle.checked=tapToRead;tapToggle.addEventListener("change",()=>{tapToRead=tapToggle.checked;try{localStorage.setItem("mercy-tap-to-read",String(tapToRead));}catch(_){}setStatus(tapToRead?"Tap a paragraph to restart reading from there.":"Tap-to-read is off. Long-press text and choose Read from here.");});}
    document.addEventListener("click",event=>{
      const themeButton=event.target.closest("[data-theme-choice]");
      if(themeButton){applyTheme(themeButton.dataset.themeChoice);return;}
      if(event.target.closest("#speech-play")){startAt(null);return;}
      if(event.target.closest("#speech-stop")){stopSpeech();setStatus("Read-aloud stopped.");return;}
      const block=readerBlock(event.target);
      if(block&&tapToRead&&!event.target.closest("a,button,input,select,textarea,summary,[role='button']")) startAt(block);
      if(!event.target.closest(".brand-menu")&&document.querySelector("details.brand-menu[open]"))document.querySelectorAll("details.brand-menu[open]").forEach(item=>item.open=false);
    },true);
    document.addEventListener("pointerdown",event=>{
      const block=readerBlock(event.target);
      if(!block||event.target.closest("a,button,input,select,textarea,summary,[role='button']"))return;
      pressTarget=block;pressX=event.clientX;pressY=event.clientY;
      clearTimeout(pressTimer);
      pressTimer=setTimeout(()=>showReadButton(block),650);
    },{passive:true});
    document.addEventListener("pointermove",event=>{
      if(pressTimer&&(Math.abs(event.clientX-pressX)>12||Math.abs(event.clientY-pressY)>12)){clearTimeout(pressTimer);pressTimer=null;}
    },{passive:true});
    ["pointerup","pointercancel","scroll"].forEach(name=>document.addEventListener(name,()=>{clearTimeout(pressTimer);pressTimer=null;},{passive:true}));
    document.addEventListener("keydown",event=>{if(event.key==="Escape"){stopSpeech();document.querySelectorAll("details.brand-menu[open]").forEach(item=>item.open=false);const button=document.querySelector(".mercy-read-from-here");if(button)button.remove();}});
    window.addEventListener("pagehide",stopSpeech);
    const play=document.getElementById("speech-play");if(play)play.setAttribute("aria-label","Read this page aloud");
    const stop=document.getElementById("speech-stop");if(stop)stop.setAttribute("aria-label","Stop reading aloud");
  };
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();