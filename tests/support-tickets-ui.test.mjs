import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
class Element {
  constructor(tag='div'){this.tagName=tag;this.children=[];this.listeners={};this.value='';this.textContent='';this.hidden=false;this.disabled=false;this.attributes={};}
  addEventListener(name,callback){this.listeners[name]=callback;}
  setAttribute(name,value){this.attributes[name]=value;}
  append(...children){this.children.push(...children);}
  replaceChildren(...children){this.children=children;}
  reportValidity(){return true;}
  reset(){for(const id of ['problem-category','problem-subject','problem-reference','problem-message'])get(id).value='';}
  set innerHTML(value){throw Error('Untrusted ticket content must never use innerHTML');}
}
const nodes=new Map(),get=id=>nodes.get(id)||(nodes.set(id,new Element()),nodes.get(id));
const calls=[];let failSubmit=false,heldList=null,pendingResolve=null;
const ticket={id:'12345678-1234-4123-8123-123456789abc',reference:'MERCY-HELP-12345678',category:'verification',subject:'<img src=x onerror=alert(1)>',message:'My card verification is still pending.',relatedReference:'benefit123',status:'waiting_on_user',revision:2,createdAt:'2026-11-01T00:00:00Z',messages:[{id:'owner1',author:'owner',message:'<script>evil()</script>Please send clearer proof through the application.',createdAt:'2026-11-01T01:00:00Z'}]};
const context={console,URLSearchParams,crypto:{randomUUID:()=> 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'},location:{search:'?topic=verification'},window:{addEventListener(){},MercyLanguage:{translate:x=>x,refresh(){}}},document:{getElementById:get,createElement:tag=>new Element(tag),documentElement:{lang:'en'},head:{append(){}}},fetch:async(url,options={})=>{
  calls.push({url,options});
  if(options.method==='POST'&&url.endsWith('/api/support/tickets')){if(failSubmit)throw Error('Temporary connection failure');return {ok:true,json:async()=>({ok:true,ticket})};}
  if(options.method==='POST'&&url.endsWith('/reply'))return {ok:true,json:async()=>({ok:true,ticket:{...ticket,revision:3}})};
  if(heldList)return await new Promise(resolve=>{pendingResolve=resolve});
  return {ok:true,json:async()=>({ok:true,tickets:url.includes('cursor=')?[{...ticket,id:'next-ticket',reference:'MERCY-HELP-87654321'}]:[ticket],cursor:url.includes('cursor=')?null:'next-cursor'})};
}};
const html=fs.readFileSync('support/index.html','utf8');
const source=html.match(/<script id="support-tickets-script">([\s\S]*?)<\/script>/)[1].replace('startSupportSignIn();','globalThis.ui={signedIn,loadTickets,clearPrivate,renderTickets};');
vm.runInNewContext(source,context);
assert.equal(get('problem-category').value,'verification','topic query selects proof support');
await context.ui.signedIn({credential:'google-account-a'});
assert.equal(get('problem-fields').disabled,false);
assert.equal(calls.at(-1).options.headers.authorization,'Bearer google-account-a');
assert.equal(get('support-tickets').children.length,1);
const card=get('support-tickets').children[0];
assert.equal(card.children[0].children[0].textContent,ticket.subject,'subject is text rather than executable markup');
assert.equal(card.children[2].children[1].textContent,ticket.message,'original problem remains visible even when owner replies exist');
assert.equal(card.children[3].children[1].textContent,ticket.messages[0].message);
assert.equal(card.children[3].children[1].attributes['data-private'],'','private text excluded from website translation');
const replyForm=card.children.at(-1),replyInput=replyForm.children[0].children[0];
replyInput.value='I have uploaded the clearer current proof.';
await replyForm.listeners.submit({preventDefault(){}});
const replyCall=calls.find(call=>call.url.endsWith('/reply'));
assert.deepEqual(JSON.parse(replyCall.options.body),{message:'I have uploaded the clearer current proof.',expectedRevision:2});
assert.equal(replyCall.options.headers.authorization,'Bearer google-account-a');
get('problem-category').value='verification';get('problem-subject').value='Current Pharmacy proof';get('problem-message').value='Please help with my student card verification.';get('problem-reference').value='benefit-ref';
failSubmit=true;
await get('problem-form').listeners.submit({preventDefault(){}});
assert.equal(get('problem-message').value,'Please help with my student card verification.','failed request retains report draft');
assert.equal(get('problem-fields').disabled,false);
const first=calls.filter(call=>call.options.method==='POST'&&call.url.endsWith('/api/support/tickets')).at(-1);
failSubmit=false;
await get('problem-form').listeners.submit({preventDefault(){}});
const second=calls.filter(call=>call.options.method==='POST'&&call.url.endsWith('/api/support/tickets')).at(-1);
assert.equal(JSON.parse(first.options.body).clientRequestId,JSON.parse(second.options.body).clientRequestId,'retry uses same idempotency key');
assert.equal(JSON.parse(second.options.body).category,'verification');
assert.equal(JSON.parse(second.options.body).email,undefined,'support identity comes from the verified token');
assert.equal(get('problem-message').value,'','successful report clears the submitted draft');
await context.ui.loadTickets(true);
assert.equal(get('support-tickets').children.length,2,'paginated own tickets append');
assert.equal(get('support-more').hidden,true);
heldList=true;
const inflight=context.ui.loadTickets(false);
await Promise.resolve();
context.ui.clearPrivate();
assert.equal(get('support-tickets').children.length,0,'sign-out removes private conversation');
assert.equal(get('problem-fields').disabled,true);
pendingResolve({ok:true,json:async()=>({ok:true,tickets:[ticket],cursor:null})});
await inflight;
assert.equal(get('support-tickets').children.length,0,'stale response cannot restore signed-out account data');
assert.equal(get('my-support-tickets').hidden,true);
for(const id of ['recover-form','gift-form','feedback-form','chat-form'])assert.ok(html.includes('id="'+id+'"'),'preserves '+id);
assert.ok(html.includes('/affiliate-program/uitm-pharmacy/'));
console.log('Support UI: private authenticated requests, safe text rendering, original messages, reply revisions, draft/idempotency retries, pagination, sign-out race guards, existing help flows passed.');
