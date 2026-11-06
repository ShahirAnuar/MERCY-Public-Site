import fs from 'node:fs';import vm from 'node:vm';
export function harness(search='?kind=oku_access'){
 const nodes=new Map(),requests=[];
 class Element{constructor(){this.value='';this.hidden=false;this.disabled=false;this.required=false;this.checked=false;this.textContent='';this.children=[];this.listeners={};this.files=[];this.options=[];this.dataset={};this.classList={toggle(){}}}addEventListener(k,fn){this.listeners[k]=fn}replaceChildren(...x){this.children=x;this.value=""}append(...x){this.children.push(...x);if(!this.value&&x[0]?.value)this.value=x[0].value}reportValidity(){return true}reset(){for(const item of nodes.values()){item.files=[];item.checked=false}}focus(){}querySelectorAll(){return[]}}
 const node=id=>{if(!nodes.has(id))nodes.set(id,new Element);return nodes.get(id)},form=node('benefit-form');
 node('kind').value='oku_access';const fields=node('application-fields');fields.disabled=true;
 const names={kind:'kind',legalName:'legal-name',relationship:'relationship',guardianName:'guardian-name',guardianRelationship:'guardian-relationship',adultApplicantConfirmed:'adult-confirmed',institutionName:'institution-name',registrationNumber:'registration-number',officialUrl:'official-url',operatingEvidenceDate:'evidence-date',consent:'proof-consent',authorityConfirmed:'authority-confirmed'};
 form.elements=new Proxy({},{get:(_,k)=>node(names[k]||k)});form.querySelectorAll=selector=>[node('proof-one'),node('proof-two')].filter(x=>!x.disabled);
 class Data{constructor(){this.disabledAtSnapshot=fields.disabled;this.map=new Map(Object.entries(names).filter(([name,id])=>!node(id).disabled).map(([name,id])=>[name,node(id).value]));this.map.set('proofs',[])}delete(k){this.map.delete(k)}append(k,v){this.map.set(k,[...(this.map.get(k)||[]),v])}get(k){return this.map.get(k)}getAll(k){return this.map.get(k)||[]}}
 const context={URL,URLSearchParams,Date,console,FormData:Data,window:{},location:{search},document:{getElementById:node,querySelectorAll:()=>[],createElement:()=>new Element,head:{append(){}}},fetch:async(url,options={})=>{requests.push({url,options});return {ok:true,json:async()=>({ok:true,applications:[]})}}};
 const source=fs.readFileSync('assets/community-initiative.js','utf8').replace('startGoogle();',"window.testForm={updateKind,updateRelationship,loadApplications,clearPrivateForm,setToken:v=>{credential=v;fields.disabled=!v}};");
 vm.runInNewContext(source,context);return {nodes,node,form,fields,requests,context,api:context.window.testForm};
}
