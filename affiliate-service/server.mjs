// MERCY affiliate coupon service — Node.js 22+, built-in HTTP + fetch only.
// Run on a trusted server with STRIPE_RESTRICTED_KEY stored as a secret.
// This server NEVER uses the buyer's app activation serial as an affiliate ID.
import { createServer } from 'node:http';

const apiKey=process.env.STRIPE_RESTRICTED_KEY;
const identityApi='https://mercy-malaysia-orders-reviews.shahiranuar.chatgpt.site';
const guideProduct='prod_VXRT8IIXbvXctI';
const port=Number(process.env.PORT||3000);
const allowedOrigins=new Set(['https://mercyseries.com','https://www.mercyseries.com']);
const program='MERCY_GUIDE_DIGITAL_2026';
const json=(res,status,body)=>{res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','private, no-store');res.end(JSON.stringify(body))};
const couponId=n=>'MERCY_GUIDE_RM'+n+'_2026_V1';
const codeFor=(affiliate,n)=>'MERCY'+affiliate.slice(4)+'R'+n;
const validAffiliate=id=>/^AFF-[A-Z0-9]{8,20}$/.test(id||'');
const tier=n=>Number.isInteger(n)&&n>=1&&n<=7;
const errorText=e=>String(e?.message||e||'Unknown error').slice(0,200);

async function stripeRequest(route,opts={}){
 if(!apiKey)throw Error('Stripe restricted key is not configured');
 const headers={Authorization:'Bearer '+apiKey};
 if(opts.idempotencyKey)headers['Idempotency-Key']=opts.idempotencyKey;
 let body;
 if(opts.form){headers['Content-Type']='application/x-www-form-urlencoded';body=new URLSearchParams(opts.form).toString()}
 const response=await fetch('https://api.stripe.com/v1/'+route,{method:opts.form?'POST':'GET',headers,body,signal:AbortSignal.timeout(15000)});
 const data=await response.json().catch(()=>({}));
 if(!response.ok){const error=new Error(data.error?.message||'Stripe returned '+response.status);error.code=data.error?.code;error.status=response.status;throw error}
 return data;
}
async function stripeFind(affiliate,n){
 const code=codeFor(affiliate,n);
 const data=await stripeRequest('promotion_codes?'+new URLSearchParams({code,limit:'10'}));
 const found=(data.data||[]).filter(p=>String(p.code).toUpperCase()===code);
 if(found.length>1)throw Error('Duplicate code found in Stripe');
 const p=found[0];if(!p)return null;
 const id=typeof p.promotion?.coupon==='string'?p.promotion.coupon:p.promotion?.coupon?.id;
 if(!p.active||p.metadata?.affiliate_id!==affiliate||p.metadata?.discount_sen!==String(n*100)||p.metadata?.program!==program||id!==couponId(n))throw Error('Stripe code owner or amount mismatch');
 return {affiliateId:affiliate,discountAmountCents:n*100,couponCode:code,stripePromotionCodeId:p.id,active:true};
}
async function stripeCoupon(n){
 const id=couponId(n);
 try{
  const existing=await stripeRequest('coupons/'+encodeURIComponent(id));
  if(existing.amount_off!==n*100||existing.currency!=='myr'||existing.metadata?.program!==program)throw Error('Existing Stripe discount conflict');
  return existing;
 }catch(e){if(e.code!=='resource_missing')throw e}
 const form={id,amount_off:String(n*100),currency:'myr',duration:'once',name:'MERCY The Guide RM'+n+' off','applies_to[products][0]':guideProduct,'metadata[program]':program,'metadata[discount_sen]':String(n*100)};
 try{return await stripeRequest('coupons',{form,idempotencyKey:'mercy-guide-coupon-'+n+'-v1'})}
 catch(e){if(e.code==='resource_already_exists')return stripeRequest('coupons/'+encodeURIComponent(id));throw e}
}
async function issueOne(affiliate,n){
 const previous=await stripeFind(affiliate,n);
 if(previous)return previous;
 await stripeCoupon(n);
 const code=codeFor(affiliate,n);
 const form={code,active:'true','promotion[type]':'coupon','promotion[coupon]':couponId(n),'metadata[affiliate_id]':affiliate,'metadata[discount_sen]':String(n*100),'metadata[program]':program};
 try{await stripeRequest('promotion_codes',{form,idempotencyKey:'mercy-guide-'+code.toLowerCase()+'-v1'})}
 catch(e){if(e.code!=='resource_already_exists')throw e}
 const verified=await stripeFind(affiliate,n);
 if(!verified)throw Error('Stripe did not confirm the issued code');
 return verified;
}
async function verifyAffiliate(req){
 const header=req.headers.authorization||'';
 if(!/^Bearer [A-Za-z0-9._~-]{50,8192}$/.test(header))throw Error('Valid Google account sign-in required');
 const response=await fetch(identityApi+'/api/affiliate/me',{headers:{Authorization:header},signal:AbortSignal.timeout(12000),cache:'no-store'});
 if(!response.ok)throw Error('Affiliate authentication rejected');
 const data=await response.json();
 if(data.status!=='active'||!validAffiliate(data.affiliateId))throw Error('Active registered affiliate ID required');
 // The upstream MERCY backend must verify Google's signed JWT and its stored affiliate owner.
 return data.affiliateId;
}
async function collectBody(req,max=1024){
 let body='';for await(const chunk of req){body+=chunk.toString();if(body.length>max)throw Error('Request too large')}
 if(!body)return {};try{return JSON.parse(body)}catch{throw Error('Invalid JSON')}
}
async function handle(req,res){
 const origin=req.headers.origin;
 if(origin&&allowedOrigins.has(origin)){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS')}
 if(req.method==='OPTIONS'){res.statusCode=origin&&!allowedOrigins.has(origin)?403:204;return res.end()}
 if(origin&&!allowedOrigins.has(origin))return json(res,403,{error:'Not an approved MERCY origin'});
 const path=new URL(req.url,'http://localhost').pathname;
 if(path==='/healthz')return json(res,apiKey?200:503,{service:'mercy-affiliate-coupons',configured:Boolean(apiKey)});
 if(!path.startsWith('/api/affiliate/coupons'))return json(res,404,{error:'Not found'});
 let affiliate;
 try{affiliate=await verifyAffiliate(req)}catch(e){return json(res,401,{error:errorText(e)})}
 try{
  if(req.method==='GET'&&path==='/api/affiliate/coupons'){
   const coupons=[];for(let n=1;n<=7;n++){const found=await stripeFind(affiliate,n);if(found)coupons.push(found)}
   return json(res,200,{affiliateId:affiliate,coupons});
  }
  if(req.method==='POST'&&path==='/api/affiliate/coupons/request'){
   const payload=await collectBody(req);const n=payload.discountAmountCents/100;
   if(!tier(n))return json(res,400,{error:'Select a RM1–RM7 discount'});
   return json(res,200,await issueOne(affiliate,n));
  }
  if(req.method==='POST'&&path==='/api/affiliate/coupons/provision'){
   await collectBody(req);
   const coupons=[];for(let n=1;n<=7;n++)coupons.push(await issueOne(affiliate,n));
   return json(res,200,{affiliateId:affiliate,coupons,complete:true});
  }
  return json(res,404,{error:'Not found'});
 }catch(e){
  console.error('Coupon provisioning failed:',e.code||e.status||'error');
  return json(res,503,{error:'Stripe could not confirm the requested coupon(s). Please retry.'});
 }
}
export {couponId,codeFor,validAffiliate,tier,stripeFind,issueOne,verifyAffiliate,handle};
if(process.env.MERCY_TEST_MODE!=='1')createServer((req,res)=>{handle(req,res).catch(()=>json(res,500,{error:'Service temporarily unavailable'}))}).listen(port,'0.0.0.0',()=>console.log('MERCY coupons listening on port',port));
