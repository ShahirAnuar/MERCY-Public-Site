import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const affiliate=readFileSync('affiliate-program/index.html','utf8');
assert.match(affiliate,/RM9\.52/,'Full-price affiliate estimate must use the new allocation');
assert.doesNotMatch(affiliate,/Publisher receives RM7|Up to RM7\.52|receives RM7/);
const rows=[...affiliate.matchAll(/<tr data-discount="(\d+)">([\s\S]*?)<\/tr>/g)];
assert.equal(rows.length,8,'All discount levels should be present');
for(const [,discount,html] of rows){const cells=[...html.matchAll(/<td>(.*?)<\/td>/g)].map(x=>x[1]);const cents=cells.slice(1).map(x=>Math.round(Number(x.replace('RM',''))*100));const [paid,fee,aff,pub]=cents;assert.equal(paid,1600-Number(discount)*100);assert.equal(fee,Math.round(paid*.03)+100);assert.equal(aff+pub,paid-fee);assert(aff>pub);assert(pub<=500)}
const dashboard=readFileSync('affiliate-program/dashboard/index.html','utf8');
assert.match(dashboard,/id="payout-form"/);assert.match(dashboard,/\/api\/affiliate\/payout\/preferences/);assert.match(dashboard,/\/api\/affiliate\/payout\/request/);assert.match(dashboard,/scheduleConfirmed/);
const support=readFileSync('support/index.html','utf8');assert.match(support,/id="chat-form"/);assert.match(support,/\/api\/support\/chat/);assert.doesNotMatch(support,/tavus/i);
for(const path of ['affiliate-program/index.html','affiliate-program/dashboard/index.html','support/index.html']){const html=readFileSync(path,'utf8');for(const script of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(script[1].trim())new vm.Script(script[1]);const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);assert.equal(new Set(ids).size,ids.length,path+' duplicate ids');}
console.log('Affiliate rate table, payout/chat contracts and script checks passed');
