import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const keys=['science','history','psychology','ethics','faith','art'];
for(const language of ['en','ms']){
 const data=JSON.parse(await readFile(new URL('../learn/answers.'+language+'.json',import.meta.url),'utf8'));
 assert.equal(data.language,language);assert.equal(data.threads.length,86);assert.deepEqual(data.threads.map(x=>x.number),Array.from({length:86},(_,i)=>i+1));
 const answers=[];
 for(const thread of data.threads){assert.equal(Object.keys(thread.lenses).length,6);for(const key of keys){const value=thread.lenses[key];assert.ok(value.answer.length>70,'Every lens needs an explanatory answer');assert.ok(value.practice.length>0);assert.notEqual(value.answer,value.practice,'An activity alone is not an answer');assert.doesNotMatch(value.answer,/coming soon|sign in to|purchase to|unavailable|TODO|TBD/i);answers.push(value.answer)}}
 assert.equal(answers.length,516);assert.equal(new Set(answers).size,516,'Every thread and lens needs its own explanation');assert.equal(data.threads[43].verse,'17:36');assert.equal(data.threads[85].verse,'39:53');
 assert.doesNotMatch(JSON.stringify(data),/privateSerial|accessToken|storyPage|sourceDocx|reader-email-codes/);
}
console.log('Public learning content: all 1,032 distinct EN/BM answers complete, activities separate, no private story data');
