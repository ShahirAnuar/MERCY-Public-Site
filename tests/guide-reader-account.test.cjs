'use strict';
const fs=require('node:fs'),vm=require('node:vm'),test=require('node:test'),assert=require('node:assert/strict');
const html=fs.readFileSync(new URL('../reader/index.html','file://'+__filename),'utf8');
const script=html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
const googleAccess=script.slice(script.indexOf('    async function readerGoogleAccess('),script.indexOf('    function loadReaderGoogleScript('));
const tokenAccess=script.slice(script.indexOf('    async function checkEmailAccess('),script.indexOf('    async function heartbeat('));
function context(data,status=200){
 const requests=[],stored=new Map([['mercyEmailAccess','old-token'],['mercyReaderSerial','original-order']]),access=[],calls={heartbeat:0,close:0,action:0,google:0};
 const c={api:'https://backend.example',accessStatus:{},signInRetry:{hidden:true},appAccessToken:'old-token',privateSerial:'original-order',fetch:async(url,init)=>{requests.push({url,init});return{ok:status===200,status,json:async()=>data}},localStorage:{setItem:(key,value)=>stored.set(key,value)},setAccess:(...args)=>access.push(args),accessConfirmed:()=> 'Account access confirmed.',beginHeartbeat:()=>calls.heartbeat++,accessDialog:{close:()=>calls.close++},pendingAccessAction:()=>calls.action++,configureReaderGoogle:()=>calls.google++};
 vm.runInNewContext(googleAccess+'\n'+tokenAccess,c);
 return{c,requests,stored,access,calls};
}
test('verified Google sign-in opens the entitled account without a serial/code prompt or device registration',async()=>{
 const r=context({ok:true,accessToken:'new-token',serial:'owned-order',license:{type:'purchased'},accountLimit:1,deviceLimit:null,concurrencyRestricted:false});
 await r.c.readerGoogleAccess('verified-google-credential');
 assert.equal(r.requests[0].url,'https://backend.example/api/reader/google-access');
 assert.equal(r.requests[0].init.headers.authorization,'Bearer verified-google-credential');
 assert.deepEqual(JSON.parse(r.requests[0].init.body),{serial:'original-order'});
 assert.equal(r.stored.get('mercyEmailAccess'),'new-token');assert.equal(r.stored.get('mercyReaderSerial'),'owned-order');
 assert.equal(r.access[0][0],true);assert.equal(r.calls.heartbeat,1);assert.equal(r.calls.action,1);assert.equal(r.calls.close,1);
 assert.doesNotMatch(html,/id="(?:reader-serial|reader-code|claim-code)"/);
});
test('exhausted account allowance cannot unlock another account or replace the existing credential',async()=>{
 const r=context({code:'account_limit'},403);await r.c.readerGoogleAccess('another-account');
 assert.equal(r.access[0][0],false);assert.match(r.access[0][1],/All account places/);
 assert.equal(r.stored.get('mercyEmailAccess'),'old-token');assert.equal(r.calls.action,0);assert.equal(r.calls.heartbeat,0);
});
test('an existing app token survives the update and is checked without a device limit payload',async()=>{
 const r=context({ok:true,serial:'owned-order',license:{type:'purchased'}});await r.c.checkEmailAccess();
 assert.equal(r.requests[0].init.headers['x-mercy-access'],'old-token');
 assert.deepEqual(JSON.parse(r.requests[0].init.body),{});assert.equal(r.access[0][0],true);assert.equal(r.calls.google,0);
 assert.equal(r.stored.get('mercyEmailAccess'),'old-token');
});
test('a denied old credential offers account sign-in while preserving stored purchase data',async()=>{
 const r=context({code:'expired'},401);await r.c.checkEmailAccess();
 assert.equal(r.access[0][0],false);assert.equal(r.calls.google,1);assert.equal(r.stored.get('mercyEmailAccess'),'old-token');assert.equal(r.stored.get('mercyReaderSerial'),'original-order');
});
