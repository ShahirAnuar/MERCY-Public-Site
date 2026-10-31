import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {verifyStripeSignature,calculateCommission,resolvePromotionOwner} from './ledger.mjs';

test('Stripe webhook signature must be valid and recent',()=>{
 const secret='whsec_test_only_not_real';
 const now=1793430000;
 const body='{"id":"evt_test","type":"checkout.session.completed"}';
 const sig=createHmac('sha256',secret).update(now+'.'+body).digest('hex');
 assert.deepEqual(verifyStripeSignature(body,'t='+now+',v1='+sig,secret,now),JSON.parse(body));
 assert.throws(()=>verifyStripeSignature(body+' ', 't='+now+',v1='+sig,secret,now),/signature/);
 assert.throws(()=>verifyStripeSignature(body,'t='+(now-1000)+',v1='+sig,secret,now),/timestamp/);
 assert.throws(()=>verifyStripeSignature(body,'t='+now+',v1=BAD',secret,now),/signature/);
});

test('actual payment fee determines the affiliate amount without eroding publisher RM7 allocation',()=>{
 assert.deepEqual(calculateCommission(1600,148),{affiliateCents:752,publisherCents:700,feeCents:148});
 assert.deepEqual(calculateCommission(1400,142),{affiliateCents:558,publisherCents:700,feeCents:142});
 assert.deepEqual(calculateCommission(900,127),{affiliateCents:73,publisherCents:700,feeCents:127});
 assert.throws(()=>calculateCommission(900,250),/cannot retain/);
});

test('promotion-code ownership is taken from Stripe metadata, never client_reference_id',async()=>{
 const items=[{discount:{promotion_code:'promo_verified'}}];
 const fetcher=async id=>({id,active:true,metadata:{affiliate_id:'AFF-DDE33B64C781',program:'MERCY_GUIDE_DIGITAL_2026',discount_sen:'300'}});
 const value=await resolvePromotionOwner(items,fetcher);
 assert.equal(value.affiliateId,'AFF-DDE33B64C781');
 assert.equal(value.discountCents,300);
 assert.equal(value.promotionCodeId,'promo_verified');
 await assert.rejects(resolvePromotionOwner(items,async()=>({active:true,metadata:{affiliate_id:'BAD',program:'MERCY_GUIDE_DIGITAL_2026',discount_sen:'300'}})),/unowned/);
});
