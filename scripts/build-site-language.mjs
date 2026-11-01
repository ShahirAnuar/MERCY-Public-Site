import {readFile,writeFile} from 'node:fs/promises';
const read=async name=>JSON.parse(await readFile('assets/'+name+'-language-ms.json','utf8'));
const dictionaries={core:{...await read('core'),...await read('uitm'),...await read('support'),...await read('kkm')},learn:await read('learn'),legal:await read('legal'),author:await read('author')};
const template=await readFile('assets/site-language.template.js','utf8');
await writeFile('assets/site-language.js',template.replace('/* DICTIONARIES */',JSON.stringify(dictionaries)));
console.log('Built local BM dictionaries: '+Object.values(dictionaries).reduce((n,x)=>n+Object.keys(x).length,0)+' entries');
