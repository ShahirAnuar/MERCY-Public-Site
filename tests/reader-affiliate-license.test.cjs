'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{test}=require('node:test');
const html=fs.readFileSync(new URL('../reader/index.html','file://'+__filename),'utf8'),script=html.match(/<script type="module">([\s\S]*?)<\/script>/)[1],pure=script.match(/\/\* BM PURE HELPERS \*\/([\s\S]*?)\/\* END BM PURE HELPERS \*\//)[1];
assert.match(pure,/function verifiedReaderLicense/,'affiliate edition metadata must be derived from verified server responses');
const verify=new Function(pure+';return verifiedReaderLicense;')();
const affiliate={type:'affiliate',label:'Affiliate version — Not for sale',notForSale:true,transferable:false};
test('only a complete verified affiliate license produces the non-sale edition label',()=>{
 assert.equal(verify(affiliate).label,'Affiliate version — Not for sale');
 for(const value of [null,undefined,{type:'purchased'},{type:'affiliate'}, {...affiliate,notForSale:false},{...affiliate,transferable:true},{edition:'affiliate'}])assert.equal(verify(value),null);
 assert.doesNotMatch(script,/searchParams\.get\(['"]edition['"]\)/,'an edition query cannot mint an affiliate license');
});
const footer=script.slice(script.indexOf('    function drawAffiliateLicenseFooter('),script.indexOf('    function englishThreadFromAnnotation'));
assert.match(footer,/function drawAffiliateLicenseFooter/);
test('affiliate footer occupies only the added canvas area below the book page',()=>{
 const events=[],ctx={save(){},restore(){},fillRect(...args){events.push(['rect',...args])},fillText(...args){events.push(['text',...args])},measureText(text){return {width:text.length*8}}};
 const canvas={width:900,height:1395,getContext:()=>ctx};const c={readerLicense:affiliate,accessReady:true};vm.runInNewContext(footer,c);assert.equal(vm.runInNewContext('drawAffiliateLicenseFooter(canvas,1350)',{...c,canvas}),true);assert.equal(events[0][2],1350);assert.equal(events[0][4],45);assert.equal(events[1][1],'AFFILIATE VERSION · NOT FOR SALE');assert.ok(events[1][3]>=1350);
 events.length=0;c.readerLicense=null;vm.runInNewContext(footer,c);assert.equal(vm.runInNewContext('drawAffiliateLicenseFooter(canvas,1350)',{...c,canvas}),false);assert.equal(events.length,0);
});
const labels=script.slice(script.indexOf('    function updateLicenseLabels('),script.indexOf('    function clearMalayData('));
assert.match(labels,/function updateLicenseLabels/);
test('badges and BM reading labels disappear when access or affiliate status is lost',()=>{
 const badge={hidden:true,textContent:''},banner={hidden:true,textContent:''};const c={accessReady:true,readerLicense:affiliate,readerLanguage:'ms',licenseBadge:badge,malayLicenseBanner:banner};vm.runInNewContext(labels,c);vm.runInNewContext('updateLicenseLabels()',c);assert.equal(badge.hidden,false);assert.match(badge.textContent,/Affiliate version — Not for sale/);assert.match(banner.textContent,/Versi Affiliate/);
 c.accessReady=false;vm.runInNewContext('updateLicenseLabels()',c);assert.equal(badge.hidden,true);assert.equal(banner.hidden,true);assert.equal(badge.textContent,'');
 c.accessReady=true;c.readerLicense=null;vm.runInNewContext('updateLicenseLabels()',c);assert.equal(badge.hidden,true);
});
test('all PDF canvases use the footer hook and verification paths update license metadata',()=>{
 assert.match(script,/drawAffiliateLicenseFooter\(targetCanvas,contentPixelHeight\)/);
 assert.match(script,/setAccess\(true,[^\n]+data\.license/);
 assert.match(script,/setVerifiedLicense\(data\.license\)/);
 assert.match(html,/id="reader-license-badge"/);assert.match(html,/id="bm-license-banner"/);
});
const licenseSetter=script.match(/function setVerifiedLicense\([^\n]+/)?.[0];assert.ok(licenseSetter);
test('losing verified access clears the label without starting another protected render',()=>{let redraws=0;const c={readerLicense:affiliate,licenseRevision:0,accessReady:false,pdf:{numPages:88},busy:false,pageNumber:1,verifiedReaderLicense:verify,updateLicenseLabels(){},showPage(){redraws++}};vm.runInNewContext(licenseSetter,c);vm.runInNewContext('setVerifiedLicense(null)',c);assert.equal(c.readerLicense,null);assert.equal(redraws,0)});
