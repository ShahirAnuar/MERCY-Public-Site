import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {createHmac} from 'node:crypto';

process.env.MERCY_TEST_MODE='1';
process.env.STRIPE_RESTRICTED_KEY='rk_test_retired_service';
process.env.STRIPE_WEBHOOK_SECRET='whsec_test_retirement';
const {handle}=await import('./server.mjs');

async function request(url,{method='POST',body='',headers={}}={}){
 const req=Readable.from([Buffer.from(body)]);
 Object.assign(req,{url,method,headers});
 let output='';const responseHeaders={};
 const res={statusCode:0,setHeader:(key,value)=>responseHeaders[key.toLowerCase()]=value,end:value=>{output=value||''}};
 await handle(req,res);
 return {status:res.statusCode,headers:responseHeaders,body:output?JSON.parse(output):null};
}
function signature(raw){
 const timestamp=Math.floor(Date.now()/1000);
 return `t=${timestamp},v1=${createHmac('sha256',process.env.STRIPE_WEBHOOK_SECRET).update(`${timestamp}.${raw}`).digest('hex')}`;
}

test('retired service closes all public registration, coupon and dashboard HTTP routes before identity or Stripe reads',async()=>{
 const original=globalThis.fetch;let calls=0;
 try{
  globalThis.fetch=async()=>{calls++;throw Error('Withdrawn service must not verify or provision')};
  for(const path of ['/api/affiliate/register','/api/affiliate/me','/api/affiliate/coupons','/api/affiliate/coupons/request','/api/affiliate/coupons/provision','/api/affiliate/dashboard']){
   const response=await request(path,{headers:{origin:'https://mercyseries.com',authorization:'Bearer previously_active_account'}});
   assert.equal(response.status,410,path);
   assert.equal(response.body.code,'legacy_affiliate_service_retired');
   assert.equal(response.body.applicationUrl,'https://mercyseries.com/community-access/');
   assert.equal(response.headers['cache-control'],'private, no-store');
  }
  assert.equal(calls,0);
 }finally{globalThis.fetch=original}
});

test('signed paid checkouts acknowledge retirement without creating legacy commissions',async()=>{
 const original=globalThis.fetch;let calls=0;
 try{
  globalThis.fetch=async()=>{calls++;throw Error('Retired paid-event policy must not write')};
  for(const type of ['checkout.session.completed','checkout.session.async_payment_succeeded']){
   const raw=JSON.stringify({id:'evt_retired',type,data:{object:{id:'cs_retired',payment_status:'paid'}}});
   const response=await request('/api/stripe/webhook',{body:raw,headers:{'stripe-signature':signature(raw)}});
   assert.equal(response.status,200);
   assert.deepEqual(response.body,{received:true,legacyPolicyRetired:true,commissionRecorded:false});
  }
  assert.equal(calls,0);
 }finally{globalThis.fetch=original}
});

test('retired webhook still rejects unauthenticated events',async()=>{
 const raw=JSON.stringify({id:'evt_forged',type:'charge.refunded',data:{object:{id:'ch_forged'}}});
 const response=await request('/api/stripe/webhook',{body:raw,headers:{'stripe-signature':'t=0,v1=forged'}});
 assert.equal(response.status,400);
 assert.match(response.body.error,/verified|processed/);
});

test('signed historical refunds still reverse the matching original ledger entry',async()=>{
 const original=globalThis.fetch;const writes=[];
 try{
  globalThis.fetch=async(url,options={})=>{
   assert.equal(new URL(url).pathname,'/v1/payment_intents/pi_historical');
   if(options.method==='GET')return {ok:true,json:async()=>({id:'pi_historical',metadata:{mercy_affiliate_id:'AFF-DDE33B64C781',mercy_affiliate_program:'MERCY_GUIDE_DIGITAL_2026',mercy_affiliate_status:'pending'}})};
   writes.push(new URLSearchParams(options.body));
   return {ok:true,json:async()=>({id:'pi_historical'})};
  };
  const raw=JSON.stringify({id:'evt_historical_refund',type:'charge.refunded',data:{object:{id:'ch_historical',payment_intent:'pi_historical',refunded:true}}});
  const response=await request('/api/stripe/webhook',{body:raw,headers:{'stripe-signature':signature(raw)}});
  assert.equal(response.status,200);
  assert.equal(writes.length,1);
  assert.equal(writes[0].get('metadata[mercy_affiliate_status]'),'reversed');
 }finally{globalThis.fetch=original}
});
