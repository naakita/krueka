/* node --test tests/academia-rutas.test.cjs */
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','js','academia-rutas.js'),'utf8');
class Element{
 constructor(tag){this.tagName=tag;this.children=[];this.className='';this.textContent='';this.attrs={};this.handlers={};this.value='';}
 appendChild(x){this.children.push(x);x.parent=this;return x}
 replaceChildren(...nodes){this.children=nodes;nodes.forEach(n=>n.parent=this)}
 setAttribute(k,v){this.attrs[k]=v}
 addEventListener(k,fn){this.handlers[k]=fn}
 querySelector(s){if(s==='.ruta-message')return flatten(this).find(n=>n.className==='ruta-message')||null;return null}
 remove(){if(this.parent)this.parent.children=this.parent.children.filter(n=>n!==this)}
 click(){this.onDownload?.(this)}
}
function flatten(e){return [e,...e.children.flatMap(flatten)]}
function setup(){
 const root=new Element('div'),doc={createElement(tag){return new Element(tag)}};
 const win={},navigator={clipboard:{writeText:async()=>{}}};
 const downloads=[];let lastBlob;
 const URLMock={createObjectURL(blob){lastBlob=blob;return 'blob:test'},revokeObjectURL(){}};
 class BlobMock{constructor(arr,options){this.text=arr.join('');this.type=options.type}}
 const originalClick=Element.prototype.click;
 Element.prototype.click=function(){downloads.push({name:this.download,text:lastBlob?.text});};
 new Function('document','window','navigator','URL','Blob','setTimeout',source)(doc,win,navigator,URLMock,BlobMock,()=>{});
 const state={version:1,entries:{microV2:{done:{'0-0':true},writing:{}}}},saved=[];
 const api={getState(){return state},save(){saved.push(JSON.stringify(state))}};
 const open=i=>win.KruekaRutaIA.open(root,api,i,()=>{});
 const click=t=>{
   const item=flatten(root).find(e=>e.tagName==='button'&&e.textContent===t);
   assert.ok(item,'No se encontró el botón '+t);
   item.handlers.click();
 };
 const fields=()=>flatten(root).filter(e=>e.tagName==='textarea');
 return {root,state,saved,downloads,open,click,fields,win,restore(){Element.prototype.click=originalClick}};
}
test('el modelo se entrena con ejemplos y puede reconocer incertidumbre',()=>{
 const p=setup();
 assert.equal(p.win.KruekaRutaIA.predict([{text:'Gracias por ayudarme',label:'Amable'}],'Gracias por ayudarme'),'Amable');
 assert.equal(p.win.KruekaRutaIA.predict([{text:'Gracias por ayudarme',label:'Amable'}],'luces espaciales'),'No sé');
 p.open(0);p.fields()[1].value='Gracias por ayudarme';p.click('🧪 Clasificar frase');
 assert.equal(flatten(p.root).some(e=>e.textContent==='✓ Terminé y comprobé mi proyecto'),false);
 p.click('✅ Acertó');
 assert.equal(flatten(p.root).some(e=>e.textContent==='✓ Terminé y comprobé mi proyecto'),true);
 p.click('✓ Terminé y comprobé mi proyecto');
 assert.equal(p.state.entries.rutaIA.projects[0].done,true);
 assert.equal(p.state.entries.microV2.done['0-0'],true);
 p.restore();
});
test('la historia permite crear tres escenas y descargarlas',()=>{
 const p=setup();p.open(1);
 const content=['Aventura en el bosque','Un robot explorador','El robot encuentra un mapa extraño en la montaña','La tormenta oculta el camino hacia su hogar','El robot construye un refugio y salva a sus amigos'];
 content.forEach((v,i)=>p.fields()[i].value=v);p.click('🎬 Organizar mi historia');
 assert.equal(flatten(p.root).filter(e=>e.className==='ruta-scene').length,3);
 p.click('💾 Guardar historia (.txt)');
 assert.ok(p.downloads.some(d=>d.name==='mi-historia-krueka.txt'&&d.text.includes('ESCENA 3')));
 p.click('✓ Terminé y comprobé mi proyecto');
 assert.equal(p.state.entries.rutaIA.projects[1].done,true);
 p.restore();
});
test('la miniapp funciona y la exportación HTML escapa texto ingresado',()=>{
 const p=setup();p.open(2);
 ['<script>alert(1)</script> app','Una miniapp para estudiar contenidos digitales','Dame una idea','Realizá una actividad y revisá el resultado'].forEach((v,i)=>p.fields()[i].value=v);
 p.click('⚡ Construir mi app');
 p.click('💾 Descargar miniapp (.html)');
 const output=p.downloads.find(d=>d.name==='mi-app-krueka.html')?.text;
 assert.ok(output&&output.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
 assert.equal(output.includes('<script>alert(1)</script>'),false);
 const preview=flatten(p.root).find(e=>e.className==='ruta-app');
 assert.ok(preview);
 const b=flatten(preview).find(e=>e.tagName==='button'&&e.textContent==='Dame una idea');
 b.handlers.click();
 assert.ok(flatten(preview).some(e=>e.textContent==='Realizá una actividad y revisá el resultado'));
 p.click('✓ Terminé y comprobé mi proyecto');
 assert.equal(p.state.entries.rutaIA.projects[2].done,true);
 p.restore();
});
