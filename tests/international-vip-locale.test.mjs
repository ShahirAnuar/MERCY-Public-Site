import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import vm from 'node:vm';
import {internationalLocaleModel} from '../guide/international/locale.mjs';
const source=readFileSync(new URL('../guide/international/app.mjs',import.meta.url),'utf8');
const sessionSource=source.slice(source.indexOf('async function session('),source.indexOf('function stopReading('));
for(const [edition,country,languages] of [['ypkdt','MY',['en','ms']],['parentingu','GB',['en','ar']]])test(edition+' session fixes the edition language pair without changing access',async()=>{
 const select={},stored=[],replaced=[],models=[];const context={credential:'verified',sessionPath:'/session',sessionId:'same-session',request:async(path,options,token)=>{assert.equal(token,'verified');assert.equal(JSON.parse(options.body).sessionId,'same-session');return {ok:true,edition};},preferences:{set:(...args)=>stored.push(args)},$:()=>select,location:{href:'https://mercyseries.com/guide/international/?lang=en'},URL,history:{state:null,replaceState:(state,title,url)=>replaced.push(String(url))},internationalLocaleModel,applyInternationalLocale:model=>models.push(model)};
 vm.runInNewContext(sessionSource,context);const result=await vm.runInNewContext('session("acquire")',context);assert.equal(result.ok,true);assert.equal(select.value,country);assert.equal(select.disabled,true);assert.deepEqual(models[0].languages,languages);assert.match(replaced[0],new RegExp('country='+country));assert.deepEqual(stored,[['editionCountry',country]]);
});

const errorSource=source.slice(source.indexOf('function readingError('),source.indexOf('async function renew('));
for(const language of ['en','ms','ar'])test('invited account-limit copy follows '+language+' without naming another organisation',()=>{
 const status={};const context={language,stopReading(){},$:()=>status};
 vm.runInNewContext(errorSource,context);vm.runInNewContext('readingError({code:"account_limit"})',context);
 assert.doesNotMatch(status.textContent,/YPKDT/);
 assert.match(status.textContent,language==='ar'?/[\u0600-\u06ff]/:language==='ms'?/Semua tempat/:/All Google/);
});
