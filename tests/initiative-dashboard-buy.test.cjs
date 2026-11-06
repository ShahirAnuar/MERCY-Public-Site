'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
class Element{
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.value='';this.textContent='';this.hidden=false;this.disabled=false;this.children=[];this.listeners={};this.options=[];this.attributes={};this.dataset={};this.classList={add(){},remove(){},toggle(){}};this.elements=new Proxy({}, {get:(target,key)=>target[key]??=new Element('input')});}
 append(...children){this.children.push(...children);} replaceChildren(...children){this.children=children;} addEventListener(type,fn){this.listeners[type]=fn;} setAttribute(key,value){this.attributes[key]=String(value);} removeAttribute(key){delete this.attributes[key];if(key==='href')delete this.href;} getAttribute(key){return this.attributes[key]??null;} querySelector(){return this.button??=new Element('button');} reportValidity(){return true;}
 set innerHTML(value){throw Error('Server data must be rendered as plain text.');}
}
const publicRoot=new URL('../',`file://${__filename}`),read=path=>fs.readFileSync(new URL(path,publicRoot),'utf8');
function dashboard(fetcher=async()=>({ok:true,json:async()=>({})})){
 const nodes=new Map(),get=id=>nodes.get(id)||(nodes.set(id,new Element),nodes.get(id)),requests=[],opens=[],timers=new Map();let time=Date.parse('2026-11-06T08:00:00Z'),seq=0;
 class Clock extends Date{static now(){return time;}}
 const context={URL,URLSearchParams,Date:Clock,console,location:{search:''},navigator:{clipboard:{writeText:async value=>opens.push({copied:value})}},localStorage:{getItem(){return null;},setItem(){},removeItem(){}},window:{addEventListener(){},open:(...args)=>opens.push(args),location:{assign:url=>opens.push({app:url})}},document:{getElementById:get,createElement:tag=>new Element(tag),head:{append(){}}},FormData:class{constructor(form){this.form=form;}[Symbol.iterator](){return Object.entries(this.form.data)[Symbol.iterator]();}},setTimeout(fn){const id=++seq;timers.set(id,fn);return id;},clearTimeout(id){timers.delete(id);},fetch:async(url,options={})=>{requests.push({url,options});return fetcher(url,options);}};
 get('calculation-discount').value='0';get('calculation-tax').value='0';
 const html=read('affiliate-program/dashboard/index.html'),script=html.match(/<script>\s*([\s\S]*?)<\/script>/)[1].replace('configureCouponApi().then(startGoogle);','globalThis.ui={showAccount,showBenefit,showSevenCouponTiers,loadReports,loadCoupons,showPayoutPreference,estimateEarnings,maySell,settlementLabel,paymentLabel,setCredential(value){credential=value;}};');
 vm.runInNewContext(script,context);context.ui.setCredential('verified-google-token');
 return {context,get,requests,opens,timers,ui:context.ui,setTime:value=>{time=value;}};
}
const id='AFF-TEST12345678';
const app={ready:true,licenseType:'affiliate',notForSale:true,transferable:false,serial:'MERCY-D-000123',appUrl:'https://mercyseries.com/reader/?edition=affiliate'};
const participant=(kind='oku',extra={})=>({status:'active',affiliateId:id,shareUrl:'https://mercyseries.com/buy/?affiliate='+id,benefit:{status:'approved',kind,approvedAt:'2026-11-06T00:00:00Z'},eligibility:{canSell:true},appAccess:app,...extra});
test('the calculator explains the fixed and percentage fees at every discount tier and deducts tax separately',()=>{
 const h=dashboard();for(let discount=0;discount<=15;discount++){const row=h.ui.estimateEarnings(discount*100,20);assert.equal(row.paidCents,2500-discount*100);assert.equal(row.flatFeeCents,100);assert.equal(row.variableFeeCents,Math.round(row.paidCents*3/100));assert.equal(row.netCents,row.paidCents-row.feeCents-20);}
 assert.equal(h.ui.estimateEarnings(0).netCents,2325);assert.equal(h.ui.estimateEarnings(1500).netCents,870);assert.throws(()=>h.ui.estimateEarnings(1600));assert.throws(()=>h.ui.estimateEarnings(101));assert.throws(()=>h.ui.estimateEarnings(100,-1));
 h.get('calculation-discount').value='15';h.get('calculation-discount').listeners.change();assert.equal(h.get('calculator-output').children[0].children[0].children[7].children[1].textContent,'RM8.70');
});
test('each approved beneficiary type can sell, while withdrawn categories keep history but cannot reveal codes or free app access',()=>{
 for(const kind of ['oku','orphan','orphanage']){const h=dashboard();h.ui.showAccount(participant(kind));assert.equal(h.ui.maySell(),true);assert.equal(h.get('open-free-app').disabled,false);assert.match(h.get('eligibility-state').textContent,kind==='oku'?/Bagi Yang Memerlukan/:/Bagi Yang Ditinggalkan/);}
 for(const kind of ['kkm_staff','uitm_pharmacy','public']){const h=dashboard();h.ui.showAccount(participant(kind));assert.equal(h.get('dashboard').hidden,false);assert.equal(h.ui.maySell(),false);assert.equal(h.get('copy-link').disabled,true);assert.equal(h.get('coupon-submit').disabled,true);assert.equal(h.get('free-app-serial').value,'');h.ui.showSevenCouponTiers([{affiliateId:id,discountAmountCents:100,couponCode:'OLD-CODE',active:true}]);assert.equal(h.get('coupons-list').children.length,0);}
 const h=dashboard();h.ui.showAccount(participant('oku',{status:'withdrawn',eligibility:{canSell:false,reason:'Programme withdrawn.'}}));assert.equal(h.get('dashboard').hidden,false);assert.equal(h.ui.maySell(),false);assert.match(h.get('eligibility-state').textContent,/withdrawn/);
});
test('participant sharing refuses unexpected ports, secret query parameters and conflicting affiliate IDs',()=>{
 for(const shareUrl of ['https://mercyseries.com:444/buy/?affiliate='+id,'https://mercyseries.com/buy/?affiliate='+id+'&serial=MERCY-D-000001','https://mercyseries.com/buy/?affiliate='+id+'&affiliate=AFF-OTHER12345678']){const h=dashboard();h.ui.showAccount(participant('oku',{shareUrl}));assert.equal(h.get('affiliate-link').value,'');assert.equal(h.get('copy-link').disabled,true);h.get('whatsapp').listeners.click();assert.equal(h.opens.length,0);}
});
test('expiry closes previously enabled selling actions instead of sharing a stale code or app',async()=>{
 const h=dashboard();h.ui.showAccount(participant('oku',{benefit:{kind:'oku',status:'approved',validUntil:'2026-11-06T08:01:00Z'}}));h.ui.showSevenCouponTiers([{affiliateId:id,discountAmountCents:100,couponCode:'CURRENT-CODE',active:true}]);h.setTime(Date.parse('2026-11-06T08:02:00Z'));h.get('whatsapp').listeners.click();h.get('open-free-app').listeners.click();assert.equal(h.opens.length,0);await h.get('coupon-request').listeners.submit({preventDefault(){}});assert.equal(h.requests.length,0);
});
test('sales reports distinguish missing costs, Stripe availability and actual beneficiary payment',async()=>{
 const report={affiliateId:id,summary:{verifiedSales:3,pendingCents:2325,availableCents:1840,paidCents:870},sales:[{saleCents:2500,commissionCents:null,estimatedCommissionCents:2325,feeCents:null,taxCents:null,status:'pending_fee_verification'},{saleCents:2000,discountCents:500,feeCents:160,taxCents:0,commissionCents:1840,availableOn:'2026-11-06T00:00:00Z',settlementStatus:'available',payoutStatus:'awaiting_publisher_transfer'},{saleCents:1000,discountCents:1500,feeCents:130,taxCents:0,commissionCents:870,status:'paid',payoutStatus:'paid'}]};
 const h=dashboard(async()=>({ok:true,json:async()=>report}));h.ui.showAccount(participant());await h.ui.loadReports();const rows=h.get('sales-body').children;assert.equal(rows[0].children[3].textContent,'Not confirmed');assert.equal(rows[0].children[4].textContent,'Not confirmed');assert.equal(rows[0].children[5].textContent,'RM23.25 estimate');assert.match(rows[0].children[7].textContent,/Waiting for actual Stripe fee/);assert.match(rows[1].children[6].textContent,/Available to publisher/);assert.equal(rows[1].children[7].textContent,'Awaiting publisher transfer');assert.equal(rows[2].children[7].textContent,'Paid to participant');assert.equal(h.get('metric-available').textContent,'RM18.40');
});
test('a stale coupon response cannot restore codes after switching to a withdrawn account',async()=>{
 let release;const h=dashboard(async()=>new Promise(resolve=>release=resolve));h.ui.showAccount(participant());const pending=h.ui.loadCoupons();h.ui.showAccount(participant('oku',{affiliateId:'AFF-OTHER12345678',status:'withdrawn',eligibility:{canSell:false},shareUrl:''}));release({ok:true,json:async()=>({affiliateId:id,coupons:[{affiliateId:id,discountAmountCents:100,couponCode:'OLD-CODE',active:true}]})});await pending;assert.equal(h.get('coupons-list').children.length,0);assert.equal(h.get('copy-link').disabled,true);
});
function buy(search,fetcher=async()=>({ok:true,json:async()=>({})})){
 const nodes=new Map(),get=id=>nodes.get(id)||(nodes.set(id,new Element),nodes.get(id)),calls=[];const h=read('buy/index.html'),script=[...h.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(x=>x[1]).find(x=>x.includes("const api='https://mercy-malaysia-orders-reviews"));
 const source=script.slice(0,script.indexOf("      fetch(api+'/api/reviews')"))+'\n})();';
 const context={URL,URLSearchParams,AbortController,setTimeout,clearTimeout,location:{search},document:{getElementById:get},fetch:async(url,options)=>{calls.push({url,options});return fetcher(url,options);}};vm.runInNewContext(source,context);
 return {get,calls,flush:()=>new Promise(resolve=>setImmediate(resolve))};
}
const verified=(extra={})=>({ok:true,eligible:true,affiliateId:id,discountAmountCents:500,checkoutUrl:'https://buy.stripe.com/example?client_reference_id='+id+'&prefilled_promo_code=VALID-CODE',...extra});
test('direct purchases stay open while malformed, revoked and offline participant routes fail closed',async()=>{
 const direct=buy('');assert.equal(direct.get('digital-buy').href,'https://buy.stripe.com/14A3cu7rcbhu8HC10ogA80g');assert.equal(direct.calls.length,0);assert.match(direct.get('referral-checkout-status').textContent,/50%/);
 const bad=buy('?affiliate=not-a-participant');await bad.flush();assert.equal(bad.get('digital-buy').href,undefined);assert.equal(bad.calls.length,0);assert.equal(bad.get('direct-purchase-fallback').hidden,false);
 for(const fetcher of [async()=>({ok:false,json:async()=>({error:'withdrawn'})}),async()=>{throw Error('offline');}]){const h=buy('?affiliate='+id+'&coupon=VALID-CODE',fetcher);await h.flush();assert.equal(h.get('digital-buy').href,undefined);assert.equal(h.get('digital-buy').getAttribute('aria-disabled'),'true');assert.equal(h.get('direct-purchase-fallback').hidden,false);}
});
test('checkout is enabled only after matching current eligibility and owned coupon are verified',async()=>{
 let release;const h=buy('?affiliate='+id+'&coupon=VALID-CODE',async()=>new Promise(resolve=>release=resolve));assert.equal(h.get('digital-buy').href,undefined);release({ok:true,json:async()=>verified()});await h.flush();assert.equal(h.get('digital-price').textContent,'RM20.00');assert.equal(new URL(h.get('digital-buy').href).searchParams.get('client_reference_id'),id);assert.match(h.calls[0].url,/\/api\/affiliate\/attribution\?/);assert.equal(h.calls[0].options.credentials,'omit');
 for(const payload of [verified({eligible:false}),verified({affiliateId:'AFF-WRONG12345678'}),verified({checkoutUrl:'https://attacker.test/pay'}),verified({checkoutUrl:'https://buy.stripe.com/example?client_reference_id='+id+'&prefilled_promo_code=OTHER-CODE'}),verified({discountAmountCents:1600})]){const bad=buy('?affiliate='+id+'&coupon=VALID-CODE',async()=>({ok:true,json:async()=>payload}));await bad.flush();assert.equal(bad.get('digital-buy').href,undefined);}
});
test('coupon-only links resolve to the server-confirmed owner rather than inventing an affiliate',async()=>{
 const h=buy('?coupon=VALID-CODE',async()=>({ok:true,json:async()=>verified()}));await h.flush();assert.equal(new URL(h.get('digital-buy').href).searchParams.get('client_reference_id'),id);
 const duplicate=buy('?affiliate='+id+'&affiliate=AFF-OTHER12345678');await duplicate.flush();assert.equal(duplicate.calls.length,0);assert.equal(duplicate.get('digital-buy').href,undefined);
});
test('public pages remove obsolete staff benefits and dated public codes without deleting authenticated history',()=>{
 const dashboardHtml=read('affiliate-program/dashboard/index.html');assert.doesNotMatch(dashboardHtml,/UiTM|KKM|standard affiliates|verifiedStripeSnapshot|gift-coupons/);assert.match(dashboardHtml,/currently configured for a 5-business-day settlement delay/);assert.match(dashboardHtml,/Stripe does not automatically pay participants/);assert.deepEqual(JSON.parse(read('affiliate-program/dashboard/verified-stripe-coupons.json')).accounts,[]);
 for(const path of ['buy/index.html','affiliate-program/dashboard/index.html']){const html=read(path),ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);assert.equal(new Set(ids).size,ids.length);for(const script of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g))if(script[2].trim())script[1].includes('ld+json')?JSON.parse(script[2]):new vm.Script(script[2]);}
});
