/* node --test tests/academia-identidades.test.cjs */
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','js','academia-identidades.js'),'utf8');
class Element {
 constructor(tag){this.tagName=tag||'div';this.children=[];this.textContent='';this.className='';this.style={};this.attrs={};this.handlers={};this.value='';this.checked=false;this.hidden=false;this.disabled=false;this.firstChild=null;}
 appendChild(x){this.children.push(x);x.parent=this;if(!this.firstChild)this.firstChild=x;return x}
 replaceChildren(...items){this.children=items;this.firstChild=items[0]||null;items.forEach(n=>n.parent=this)}
 addEventListener(k,cb){this.handlers[k]=cb}
 setAttribute(k,v){this.attrs[k]=v}
 get options(){return this.children}
 reset(){this.value='';this.checked=false}
 set innerHTML(html){this.children=[];for(const m of String(html).matchAll(/id="([^"]+)"/g))elements[m[1]]=new Element('div')}
}
const elements={};
function E(id){return elements[id]||(elements[id]=new Element('div'))}
function flatten(el){return [el,...(el.children||[]).flatMap(flatten)]}
function setup(){
 Object.keys(elements).forEach(k=>delete elements[k]);
 const root=E('academy-identities');
 const document={getElementById:E,createElement:tag=>new Element(tag),createTextNode:text=>({textContent:text,children:[]})};
 const navigator={clipboard:{writeText:async()=>{}}};
 const window={};const calls=[];
 const one={student_id:'s1',name:'Alumno ficticio',active:true,email:null,accounts:[]};
 let student=[one];
 const client={async rpc(name,args){
   calls.push({name,...args});
   if(name!=='academia_identity_manage')return {data:{ok:false,error:'RPC inesperada'}};
   if(args.p_action==='list')return {data:{ok:true,students:student,mail_active:false}};
   if(args.p_action==='reserve'){
     if(!args.p_payload.consent_verified)return {data:{ok:false,error:'Consentimiento faltante'}};
     student=[{...one,email:'usuario@dominio.invalid',alias:args.p_payload.alias,consent_verified:true,accounts:[]}];
     return {data:{ok:true,email:'usuario@dominio.invalid',routing_state:'sin_configurar',mail_active:false}};
   }
   if(args.p_action==='platform_set')return {data:{ok:true,notice:'Estado registrado manualmente.'}};
   if(args.p_action==='revoke')return {data:{ok:true,notice:'Autorización revocada'}};
   return {data:{ok:false,error:'Acción no simulada'}};
 }};
 new Function('document','window','navigator','confirm',source)(document,window,navigator,()=>true);
 return {root,client,calls,get:E,window,all:()=>flatten(E('ki-students')),on:()=>student};
}
test('las identidades se ocultan hasta que inicia sesión un docente',async()=>{
 const t=setup();
 assert.ok(t.window.AcademiaIdentidades);
 assert.equal(t.calls.length,0);
 await t.window.AcademiaIdentidades.loadTeacher(t.client);
 assert.ok(t.calls.some(c=>c.p_action==='list'));
 assert.ok(t.get('ki-count').textContent.includes('1 alumnos'));
 t.window.AcademiaIdentidades.clear();
 assert.equal(t.get('ki-students').children.length,0);
});
test('la reserva exige consentimiento y avisa que el buzón no está activo',async()=>{
 const t=setup();await t.window.AcademiaIdentidades.loadTeacher(t.client);
 t.get('ki-student').value='s1';t.get('ki-alias').value='aliasdemostracion';
 await t.get('ki-reserve').handlers.submit({preventDefault(){}});
 assert.equal(t.calls.filter(x=>x.p_action==='reserve').length,0);
 t.get('ki-consent').checked=true;
 await t.get('ki-reserve').handlers.submit({preventDefault(){}});
 const call=t.calls.find(x=>x.p_action==='reserve');
 assert.equal(call.p_payload.student_id,'s1');
 assert.equal(call.p_payload.alias,'aliasdemostracion');
 assert.equal(call.p_payload.consent_verified,true);
 assert.ok(t.get('ki-message').textContent.includes('todavía no recibe correos'));
});
test('el docente puede registrar estados pero no se crean cuentas externas automáticamente',async()=>{
 const t=setup();await t.window.AcademiaIdentidades.loadTeacher(t.client);
 t.get('ki-student').value='s1';t.get('ki-alias').value='aliasdemostracion';t.get('ki-consent').checked=true;
 await t.get('ki-reserve').handlers.submit({preventDefault(){}});
 const actions=t.all().filter(x=>x.tagName==='button');
 const save=actions.find(x=>x.textContent==='Guardar estado externo');
 assert.ok(save);
 const field=t.all().find(x=>x.attrs?.['aria-label']==='Estado de inscripción externa');
 const plat=t.all().find(x=>x.attrs?.['aria-label']==='Plataforma externa de Alumno ficticio');
 assert.ok(field);assert.ok(plat);
 field.value='pendiente';plat.value='codeorg';
 await save.handlers.click();
 const call=t.calls.find(x=>x.p_action==='platform_set');
 assert.equal(call.p_payload.platform,'codeorg');
 assert.equal(call.p_payload.state,'pendiente');
});
