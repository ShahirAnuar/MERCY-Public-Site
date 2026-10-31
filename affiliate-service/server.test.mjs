import test from 'node:test';
import assert from 'node:assert/strict';

process.env.MERCY_TEST_MODE='1';
process.env.STRIPE_RESTRICTED_KEY='rk_test_do_not_use';
const {couponId,codeFor,validAffiliate,tier,stripeFind,issueOne}=await import('./server.mjs');
const owner='AFF-DDE33B64C781';
const program='MERCY_GUIDE_DIGITAL_2026';
const reply=(body,ok=true,status=200)=>({ok,status,json:async()=>body});

test('every affiliate gets seven different stable public promotion-code identifiers',()=>{
 const other='AFF-ABCDEF123456';
 const codes=[...Array(7)].map((_,i)=>codeFor(owner,i+1));
 const others=[...Array(7)].map((_,i)=>codeFor(other,i+1));
 assert.equal(new Set([...codes,...others]).size,14);
 assert.equal(codes[1],'MERCYDDE33B64C781R2');
 assert.equal(codes[6],'MERCYDDE33B64C781R7');
 assert.equal(validAffiliate(owner),true);
 assert.equal(validAffiliate('not-an-affiliate'),false);
 assert.equal(tier(8),false);
});

test('existing Stripe-owned coupon is returned without another Stripe write',async()=>{
 const original=globalThis.fetch;const calls=[];
 try{
  globalThis.fetch=async(url,options={})=>{
   calls.push({url,method:options.method});
   const code=new URL(url).searchParams.get('code');
   assert.equal(code,codeFor(owner,2));
   return reply({data:[{id:'promo_owner_2',active:true,code,metadata:{affiliate_id:owner,discount_sen:'200',program},promotion:{coupon:couponId(2)}}]});
  };
  const result=await issueOne(owner,2);
  assert.equal(result.couponCode,codeFor(owner,2));
  assert.equal(result.affiliateId,owner);
  assert.equal(calls.length,1);
  assert.equal(calls[0].method,'GET');
 }finally{globalThis.fetch=original}
});

test('unknown tier is created product-scoped and attributed to the verified account',async()=>{
 const original=globalThis.fetch;let created=false,couponCreated=false,promotionCreated=false;
 try{
  globalThis.fetch=async(url,options={})=>{
   const path=new URL(url).pathname;
   if(path==='/v1/promotion_codes'&&options.method==='GET'){
    return reply({data:created?[{id:'promo_owner_3',active:true,code:codeFor(owner,3),metadata:{affiliate_id:owner,discount_sen:'300',program},promotion:{coupon:couponId(3)}}]:[]});
   }
   if(path==='/v1/coupons/'+couponId(3)&&options.method==='GET'){
    if(couponCreated)return reply({id:couponId(3),amount_off:300,currency:'myr',metadata:{program}});
    return reply({error:{code:'resource_missing',message:'No coupon'}},false,404);
   }
   const body=new URLSearchParams(options.body);
   if(path==='/v1/coupons'&&options.method==='POST'){
    assert.equal(body.get('amount_off'),'300');
    assert.equal(body.get('applies_to[products][0]'),'prod_VXRT8IIXbvXctI');
    couponCreated=true;
    return reply({id:couponId(3),amount_off:300,currency:'myr',metadata:{program}});
   }
   if(path==='/v1/promotion_codes'&&options.method==='POST'){
    assert.equal(body.get('code'),codeFor(owner,3));
    assert.equal(body.get('metadata[affiliate_id]'),owner);
    assert.equal(body.get('promotion[coupon]'),couponId(3));
    promotionCreated=true;created=true;
    return reply({id:'promo_owner_3'});
   }
   throw Error('Unexpected Stripe request '+url);
  };
  const result=await issueOne(owner,3);
  assert.equal(result.couponCode,codeFor(owner,3));
  assert.equal(couponCreated,true);
  assert.equal(promotionCreated,true);
 }finally{globalThis.fetch=original}
});

test('coupon with a different owner fails closed before any write',async()=>{
 const original=globalThis.fetch;
 try{
  globalThis.fetch=async(url,options)=>{
   if(options.method!=='GET')throw Error('Unexpected mutation');
   return reply({data:[{code:codeFor(owner,4),id:'promo_conflict',active:true,metadata:{affiliate_id:'AFF-WRONG123456',discount_sen:'400',program},promotion:{coupon:couponId(4)}}]});
  };
  await assert.rejects(issueOne(owner,4),/owner or amount mismatch/);
 }finally{globalThis.fetch=original}
});
