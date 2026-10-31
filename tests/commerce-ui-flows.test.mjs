import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
class Element{
 constructor(){this.value='';this.hidden=false;this.disabled=false;this.checked=false;this.textContent='';this.children=[];this.listeners={};this.dataset={};this.elements=new Proxy({}, {get:(t,p)=>t[p]??=new Element});this.classList={toggle(){}};}
 addEventListener(k,fn){this.listeners[k]=fn;} setAttribute(){} append(...items){this.children.push(...items)} replaceChildren(...items){this.children=items} querySelectorAll(){return this.children} querySelector(){return this.button??=new Element} reportValidity(){return true} focus(){} reset(){this.resetCalled=true}
}
function scope(){const nodes=new Map,get=id=>{if(!nodes.has(id))nodes.set(id,new Element);return nodes.get(id)},requests=[];let fail=false;
 const context={URL,URLSearchParams,location:{search:''},navigator:{clipboard:{writeText:async()=>{}}},window:{open(){}},document:{querySelector:get,getElementById:id=>get('#'+id),createElement:()=>new Element,createTextNode:text=>({textContent:text}),head:{append(){}}},FormData:class{constructor(form){this.form=form}[Symbol.iterator](){return Object.entries(this.form.data)[Symbol.iterator]()}},fetch:async(url,options={})=>{const payload=options.body?JSON.parse(options.body):null;requests.push({url,body:payload});return{ok:!fail,status:fail?503:200,json:async()=>fail?{error:'Service unavailable'}:url.endsWith('/api/support/chat')?{ok:true,answer:'Open the gift transfer form.'}:url.endsWith('/api/affiliate/dashboard')?{affiliateId:'AFF-TEST12345678',summary:{verifiedSales:1,pendingCents:0,availableCents:0,paidCents:0},sales:[{saleCents:1600,commissionCents:null,estimatedCommissionCents:952,status:'pending_fee_verification'}]}:{ok:true,configured:true,method:'duitnow',maskedDestination:'••••1234',scheduleConfirmed:false,message:'Queued for processing'}}}};
 return {context,get,requests,setFail:v=>{fail=v}};
}
{
 const t=scope(),html=fs.readFileSync('affiliate-program/dashboard/index.html','utf8');
 const script=html.match(/<script>([\s\S]*?)<\/script>/)[1].replace('configureCouponApi().then(startGoogle);',"globalThis.ui={showAccount,loadReports,loadPayoutPreferences,setCredential:v=>{credential=v}};");
 vm.runInNewContext(script,t.context);t.context.ui.setCredential('test');t.context.ui.showAccount({status:'active',affiliateId:'AFF-TEST12345678',shareUrl:'https://mercyseries.com/buy/?affiliate=AFF-TEST12345678'});
 const form=t.get('#payout-form');form.data={method:'duitnow',accountName:'Affiliate Name',duitnowId:'0123451234'};form.elements.duitnowId.value='0123451234';
 await form.listeners.submit({preventDefault(){},currentTarget:form});const save=t.requests.find(r=>r.url.endsWith('/api/affiliate/payout/preferences')&&r.body);assert.deepEqual(save.body,{method:'duitnow',accountName:'Affiliate Name',duitnowId:'0123451234'});assert.equal(form.elements.duitnowId.value,'');assert.match(t.get('#payout-destination').textContent,/1234/);assert.doesNotMatch(t.get('#payout-destination').textContent,/012345/);assert.match(t.get('#payout-schedule').textContent,/being prepared/);
 await t.get('#payout-request').listeners.click();assert(t.requests.some(r=>r.url.endsWith('/api/affiliate/payout/request')));assert.match(t.get('#payout-request-state').textContent,/Queued/);await t.context.ui.loadReports();const cells=t.get('#sales-body').children.at(-1).children;assert.equal(cells[3].textContent,'RM9.52 estimate');
}
{
 const t=scope(),html=fs.readFileSync('support/index.html','utf8');vm.runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],t.context);
 t.get('#chat-adult').checked=true;t.get('#chat-consent').checked=true;t.get('#chat-message').value='How do I send this as a gift?';const form=t.get('#chat-form');await form.listeners.submit({preventDefault(){},currentTarget:form});const req=t.requests.find(r=>r.url.endsWith('/api/support/chat'));assert.equal(req.body.consent,true);assert.equal(req.body.adultConfirmed,true);assert.deepEqual(req.body.history,[]);assert.equal(t.get('#chat-log').children.at(-1).children[1].textContent,'Open the gift transfer form.');
 const count=t.requests.length;t.get('#chat-message').value='My serial MERCY-D-123456';await form.listeners.submit({preventDefault(){},currentTarget:form});assert.equal(t.requests.length,count);assert.match(t.get('#chat-status').textContent,/Remove/);
 t.setFail(true);t.get('#chat-message').value='How do I install?';await form.listeners.submit({preventDefault(){},currentTarget:form});assert.match(t.get('#chat-status').textContent,/unavailable/);assert.match(t.get('#chat-log').children.at(-1).children[1].textContent,/guided help/);
}
console.log('Payout saving/masking, fee-pending reports, AI consent, privacy rejection and unavailable fallback checks passed');
