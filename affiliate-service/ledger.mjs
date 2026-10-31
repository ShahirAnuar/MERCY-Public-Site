import {createHmac,timingSafeEqual} from 'node:crypto';
const PROGRAM='MERCY_GUIDE_DIGITAL_2026';
const ID=/^AFF-[A-Z0-9]{8,20}$/;

export function verifyStripeSignature(raw,header,secret,nowSeconds=Math.floor(Date.now()/1000)){
 if(!secret||!header)throw Error('Missing webhook secret or Stripe signature');
 const pieces=Object.fromEntries(String(header).split(',').map(x=>x.trim().split('=').slice(0,2)));
 const t=Number(pieces.t);
 if(!Number.isInteger(t)||Math.abs(nowSeconds-t)>300)throw Error('Stripe webhook timestamp outside tolerance');
 const candidates=String(header).split(',').map(x=>x.trim()).filter(x=>x.startsWith('v1=')).map(x=>x.slice(3));
 const expected=createHmac('sha256',secret).update(String(t)+'.').update(raw).digest();
 let verified=false;
 for(const candidate of candidates){
  if(!/^[a-f0-9]{64}$/i.test(candidate))continue;
  const supplied=Buffer.from(candidate,'hex');
  if(supplied.length===expected.length&&timingSafeEqual(supplied,expected))verified=true;
 }
 if(!verified)throw Error('Invalid Stripe webhook signature');
 const parsed=JSON.parse(Buffer.isBuffer(raw)?raw.toString('utf8'):String(raw));
 if(!parsed||typeof parsed!=='object'||!parsed.id||!parsed.type)throw Error('Invalid Stripe webhook payload');
 return parsed;
}
export function calculateCommission(customerCents,feeCents){
 if(!Number.isInteger(customerCents)||customerCents<900||customerCents>1600||!Number.isInteger(feeCents)||feeCents<0)throw Error('Unsupported payment or fee');
 if(customerCents-feeCents<700)throw Error('Payment cannot retain RM7 after actual processing fees');
 return {affiliateCents:customerCents-feeCents-700,publisherCents:700,feeCents};
}
export async function resolvePromotionOwner(discounts,getPromotionCode){
 if(!Array.isArray(discounts)||discounts.length===0)return null;
 if(discounts.length!==1)throw Error('Multiple discounts cannot be automatically attributed');
 const discount=discounts[0].discount||{};
 const id=typeof discount.promotion_code==='string'?discount.promotion_code:discount.promotion_code?.id;
 if(!/^promo_[A-Za-z0-9]+$/.test(id||''))throw Error('No trustworthy promotion code ID');
 const promo=await getPromotionCode(id);
 const owner=promo?.metadata?.affiliate_id,amount=Number(promo?.metadata?.discount_sen);
 if(promo?.active!==true||!ID.test(owner||'')||promo.metadata?.program!==PROGRAM||![100,200,300,400,500,600,700].includes(amount))throw Error('Stripe promotion is unowned or invalid');
 return {affiliateId:owner,discountCents:amount,promotionCodeId:id};
}
