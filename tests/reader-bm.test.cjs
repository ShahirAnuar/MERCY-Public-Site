'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {test}=require('node:test');
const html=fs.readFileSync(new URL('../reader/index.html','file://'+__filename),'utf8');
const script=html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
const pure=script.match(/\/\* BM PURE HELPERS \*\/([\s\S]*?)\/\* END BM PURE HELPERS \*\//)?.[1];
assert.ok(pure,'BM pure helpers must exist before changing the reader');
const helpers=new Function(pure+';return {preferredReaderLanguage,fitMalayText,validatedMalayTranslation};')();
test('explicit language wins, only BM/English preferences are accepted',()=>{
 assert.equal(helpers.preferredReaderLanguage('?lang=ms','en'),'ms');
 assert.equal(helpers.preferredReaderLanguage('?lang=en','ms'),'en');
 assert.equal(helpers.preferredReaderLanguage('?lang=ar','ms'),'ms');
 assert.equal(helpers.preferredReaderLanguage('','unexpected'),'en');
});
test('Malay narrative layout preserves all words and stays within the available height',()=>{
 const ctx={font:'',measureText(text){const font=Number.parseFloat(this.font);return {width:text.length*font*.48}}};
 const text='Ini sebuah kisah tentang Zayd.\n\nDia belajar bersama ayahnya dengan sabar. '.repeat(8);
 const result=helpers.fitMalayText(ctx,text,540,800,32,14);
 assert.equal(result.fits,true);assert.equal(result.lines.map(x=>x.text).filter(Boolean).join(' ').replace(/\s+/g,' ').trim(),text.replace(/\s+/g,' ').trim());
 for(const line of result.lines){assert.ok(line.y>=0);assert.ok(line.y+result.font<=800);assert.ok(ctx.measureText(line.text).width<=540+.1)}
 const impossible=helpers.fitMalayText(ctx,'perkataan '.repeat(5000),100,100,32,14);assert.equal(impossible.fits,false,'oversized text must use accessible text view instead of clipping');
});
test('translation payload validates page identity and six lens keys without HTML interpretation',()=>{
 const page={pdfPage:11,storyPage:1,text:'<b>Ini teks, bukan HTML.</b>'},thread={number:1,pdfPage:11,title:'Fikiran Zayd',note:'Nota',verse:'2:286',lenses:{science:'Sains',history:'Sejarah',psychology:'Psikologi',ethics:'Etika',faith:'Iman',art:'Seni'}};
 const result=helpers.validatedMalayTranslation({language:'ms',sourcePageCount:90,pages:[page],threads:[thread]});assert.equal(result.pages[0].text,page.text);
 assert.throws(()=>helpers.validatedMalayTranslation({language:'ms',sourcePageCount:90,pages:[page,page],threads:[thread]}));
 assert.throws(()=>helpers.validatedMalayTranslation({language:'ms',sourcePageCount:90,pages:[{...page,pdfPage:99}],threads:[thread]}));
 assert.throws(()=>helpers.validatedMalayTranslation({language:'ms',sourcePageCount:90,pages:[page],threads:[{...thread,lenses:{science:'Sains'}}]}));
});
// Exercise the real loader independently from PDF rendering and sign-in widgets.
const loader=script.match(/async function loadMalayTranslation\(\)\{([\s\S]*?)\n    function readerEditionMatches/)?.[0]?.replace(/\n    function readerEditionMatches$/,'');
assert.ok(loader,'Protected translation loader is present');
async function loaderContext({language='ms',access=true,responseStatus=200}={}){
 let calls=0,cleared=0;const ctx={readerLanguage:language,accessReady:access,appAccessToken:access?'private-test-token':'',deviceId:'device-test',malayData:null,malayLoading:null,api:'https://api.example.test',validatedMalayTranslation:helpers.validatedMalayTranslation,clearMalayData(){ctx.malayData=null;cleared++},setAccess(){ctx.accessReady=false},localStorage:{removeItem(){}},Error,fetch:async(url,opts)=>{calls++;assert.equal(url,'https://api.example.test/api/reader/translation?lang=ms');assert.equal(opts.headers['x-mercy-access'],'private-test-token');assert.equal(opts.headers['x-mercy-device'],'device-test');assert.equal(opts.cache,'no-store');return {ok:responseStatus===200,status:responseStatus,json:async()=>({language:'ms',sourcePageCount:90,pages:[{pdfPage:11,storyPage:1,text:'Kisah BM'}],threads:[]})}}};
 vm.runInNewContext(loader,ctx);return {ctx,run:()=>vm.runInNewContext('loadMalayTranslation()',ctx),calls:()=>calls,cleared:()=>cleared};
}
test('private BM content is never fetched without verified access or in English mode',async()=>{
 for(const options of [{access:false},{language:'en'}]){const c=await loaderContext(options);assert.equal(await c.run(),null);assert.equal(c.calls(),0)}
 const c=await loaderContext();assert.equal((await c.run()).pages[0].text,'Kisah BM');assert.equal(c.calls(),1);await c.run();assert.equal(c.calls(),1,'in-memory reuse only');
 const revoked=await loaderContext({responseStatus:401});await assert.rejects(()=>revoked.run());assert.equal(revoked.ctx.malayData,null);assert.equal(revoked.ctx.accessReady,false);assert.ok(revoked.cleared()>0);
});
const dictionaryStart=script.indexOf('    const readerUiMalay='),dictionaryEnd=script.indexOf('    function refreshReaderUi()',dictionaryStart);
const ui=new Function('let readerLanguage="ms";'+script.slice(dictionaryStart,dictionaryEnd)+';return {translate:translateReaderUiText,set:language=>readerLanguage=language};')();
test('UI translation preserves whitespace and private identifiers and restores English',()=>{
 assert.equal(ui.translate('   '),'   ');assert.equal(ui.translate('MERCY-D-000123'),'MERCY-D-000123');assert.equal(ui.translate('123456'),'123456');
 assert.equal(ui.translate('Start reading'),'Mula membaca');assert.equal(ui.translate('Opening page 11…'),'Membuka halaman 11…');
 ui.set('en');assert.equal(ui.translate('Mula membaca'),'Start reading');assert.equal(ui.translate('Membuka halaman 11…'),'Opening page 11…');
});
const editionMatch=script.match(/function readerEditionMatches\(\)\{[^\n]+/)?.[0];
assert.ok(editionMatch);
const edition=new Function('malayData','pdf',editionMatch+';return readerEditionMatches();');
test('an unverified page map never paints BM over the original PDF',()=>{
 assert.equal(edition({sourcePageCount:88,mappingVerified:false},{numPages:88}),false);
 assert.equal(edition({sourcePageCount:88,mappingVerified:true},{numPages:88}),true);
 assert.equal(edition({sourcePageCount:90,mappingVerified:true},{numPages:88}),false);
});
const downloadSource=script.match(/async function downloadBook\([^\n]+/)?.[0];assert.ok(downloadSource);
test('BM text fallback opens directly without downloading the English PDF',async()=>{
 let shown=0,fetches=0;const ctx={readerLanguage:'ms',malayData:{mappingVerified:false},loadMalayTranslation:async()=>ctx.malayData,showMalayText:()=>shown++,status:{},api:'https://api.test',appAccessToken:'private',deviceId:'device',fetch:async()=>{fetches++;throw Error('Unexpected English PDF download')},openBytes:async()=>{}};vm.runInNewContext(downloadSource,ctx);await vm.runInNewContext('downloadBook()',ctx);assert.equal(shown,1);assert.equal(fetches,0);
});
