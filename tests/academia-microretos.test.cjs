/* node --test tests/academia-microretos.test.cjs */
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const script=fs.readFileSync(path.join(__dirname,'..','js','academia-retos.js'),'utf8');
function session(state={version:1,entries:{}},demo=false,start=0){
 class Element{
   constructor(tag){this.tagName=tag;this.textContent='';this.className='';this.children=[];this.style={};this.attrs={};this.listeners={};this.value='';this.disabled=false;}
   appendChild(n){this.children.push(n);n.parent=this;return n}
   replaceChildren(...ns){this.children=ns;ns.forEach(n=>n.parent=this)}
   querySelectorAll(q){return [...this.children,...this.children.flatMap(n=>n.querySelectorAll(q))].filter(n=>q==='button'?n.tagName==='button':false)}
   querySelector(q){return q==='.adv-feedback'?[...this.children,...this.children.flatMap(n=>n.querySelectorAll('.adv-feedback'))].find(n=>n.className?.split(' ').includes('adv-feedback'))||null:null}
   remove(){if(this.parent)this.parent.children=this.parent.children.filter(n=>n!==this)}
   addEventListener(k,fn){this.listeners[k]=fn}
   setAttribute(k,v){this.attrs[k]=v}
 }
 const root=new Element('div');
 const document={
   getElementById(id){return id==='micro-course'?root:null},
   createElement(tag){return new Element(tag)}
 };
 const window={};
 const navigator={clipboard:{writeText:async()=>{}}};
 new Function('document','window','navigator',script)(document,window,navigator);
 const saved=[],finished=[];
 const api={
   teacherDemo:demo,start,
   getState(){return state},
   save(){saved.push(JSON.stringify(state.entries.microV2))},
   complete(m,extra){finished.push(m);state.entries['m'+m]={done:true,...extra}}
 };
 window.KruekaRetos.open(api);
 const flatten=n=>[n,...n.children.flatMap(flatten)];
 const buttons=()=>flatten(root).filter(n=>n.tagName==='button');
 const findButton=t=>buttons().find(n=>!n.disabled&&(n.textContent===t||flatten(n).some(x=>x.textContent===t)));
 const click=t=>{
   const b=findButton(t);assert.ok(b,'Botón habilitado: '+t);
   b.listeners.click();
 };
 const write=v=>{
   const input=flatten(root).find(n=>n.tagName==='textarea');
   assert.ok(input,'Hay un campo de escritura');
   input.value=v;click('Comprobar mi pedido ✓');
 };
 return {state,root,click,write,buttons,flatten,window,saved,finished,
  counters:()=>window.KruekaRetos.counts(),
  rendered:t=>flatten(root).some(n=>n.textContent===t)};
}
test('una respuesta equivocada no desbloquea el siguiente reto',()=>{
 const s=session();assert.ok(s.rendered('¡Tu próxima aventura digital empieza acá!'));s.click('🚀 Comenzar mi aventura →');s.click('Un generador de música');
 assert.equal(s.counters().done,0);
 assert.equal(s.counters().step,0);
 assert.equal(!!s.buttons().find(b=>b.textContent==='Continuar →'),false);
 s.click('Un asistente que explique con ejemplos');
 assert.equal(s.counters().done,1);
 s.click('Continuar →');
 assert.equal(s.counters().step,1);
});
test('los campos evitan datos sensibles y respuestas vacías',()=>{
 const s=session(undefined,true,2);
 s.click('🎮 Crear un videojuego');s.click('Continuar →');
 s.write('test@example.com es mi correo y quiero crear un videojuego');
 assert.equal(s.counters().done,1);
 s.write('texto corto');
 assert.equal(s.counters().done,1);
 s.write('Quiero desarrollar un juego educativo con niveles de dificultad.');
 assert.equal(s.counters().done,2);
});
test('se completan 25 desafíos, se genera prompt y se guarda después de cada reto',()=>{
 const s=session();s.click('🚀 Comenzar mi aventura →');let done=0;
 const answerSets=[
 ['Un asistente que explique con ejemplos','Una IA generadora de imágenes','Lo verifico en una fuente confiable'],
 ['Agregá un botón azul de Inicio sin cambiar el menú','El público y el producto','Probando si cada moneda suma un punto'],
 ['🎮 Crear un videojuego'],
 ['Lo pruebo y reviso el contador','Una descripción inventada del proyecto','Solicitar una fuente verificable y comprobarla'],
 [],
 ['Explicá fracciones con dos ejemplos para 13 años en menos de 120 palabras','Que pregunte lo que falta y declare suposiciones','Una descripción del error sin datos personales','Corregí solo el botón y conservá el resto; indicá cómo probarlo','Abro la fuente y compruebo fecha y contenido']
 ];
 const inputs={
  goal:'Quiero crear un videojuego de aventuras con tres niveles y monedas.',
  context:'Ya existe un personaje que corre y salta por distintas plataformas.',
  task:'Agregá tres monedas que desaparezcan al tocarlas y sumen al marcador.',
  format:'Respondé con pasos numerados y una lista de ejemplos.',
  limits:'No modifiques el movimiento ni inventes recursos nuevos.',
  check:'Voy a probar el nivel y verificar que el marcador sume tres puntos.',
  clarify:'Antes de modificar algo, preguntame cuál es el botón y dónde aparece.',
  execute:'Modificá el botón para cambiar el título, pero conservá el menú actual.',
  verify:'Indicame cómo probar el botón y verificar que el menú sigue funcionando.'
 };
 const max=[3,3,8,3,3,5];
 for(let m=0;m<6;m++){
  for(let k=0;k<max[m];k++){
   if(m===2&&k>=1&&k<=6){
    s.write(inputs[['goal','context','task','format','limits','check'][k-1]]);
   }else if(m===4){
    s.write(inputs[['clarify','execute','verify'][k]]);
   }else if(m===2&&k===7){
    s.click('¡Lo revisé! Continuar ✓');
   }else{
    s.click(answerSets[m][m===2?0:k]);
   }
   done++;
   assert.equal(s.counters().done,done,'Debe registrar cada paso');
   const advance=k===max[m]-1?(m===5?'Ver mi logro 🏆':'¡Misión superada! Siguiente →'):'Continuar →';
   s.click(advance);
  }
 }
 assert.equal(s.counters().done,25);
 assert.equal(s.saved.length,25);
 assert.deepEqual(s.finished,[0,1,2,3,4,5]);
 assert.ok(s.state.entries.m2.prompt.includes('OBJETIVO'));
 assert.ok(s.state.entries.m2.fields.format.length>=15);
 assert.ok(s.rendered('¡Dominaste los retos de IA!'));
 // Reingresar con estado guardado: la insignia debe seguir visible.
 const restored=session(s.state);
 restored.click('🏆 Ver mi insignia →');
 assert.ok(restored.rendered('¡Dominaste los retos de IA!'));
});
test('el docente puede abrir una misión avanzada sin completar las anteriores',()=>{
 const s=session(undefined,true,5);
 assert.equal(s.counters().mission,5);
 assert.equal(s.counters().done,0);
 s.click('Explicá fracciones con dos ejemplos para 13 años en menos de 120 palabras');
 assert.equal(s.counters().done,1);
});


test('los minijuegos opcionales son independientes de las 25 misiones',()=>{
 const s=session();
 s.click('Detective de Internet');
 s.click('La cantidad de compartidos demuestra que es real');
 assert.equal(s.counters().done,0);
 s.click('Necesito revisar fuente, fecha y contenido');
 s.click('Siguiente caso →');
 s.click('No la uso hasta conseguir una fuente verificable');
 s.click('Siguiente caso →');
 s.click('No comparto secretos ni datos personales');
 s.click('¡Laboratorio superado! →');
 assert.equal(s.state.entries.microV2.bonus.detective.done,true);
 s.click('Volver a mis mundos →');
 s.click('Fábrica de prompts');
 for(const choice of [
  'Creá un juego 2D donde se recojan cristales',
  'Ya existe un personaje que puede moverse a izquierda y derecha',
  'Devolvé 4 pasos numerados con los cambios',
  'Conservá los controles y no inventes archivos',
  'Indicá cómo probar que se recojan 3 cristales y se sumen puntos'
 ])s.click(choice);
 assert.equal(s.state.entries.microV2.bonus.promptLab.done,true);
 assert.ok(s.rendered('🧱 ¡Prompt construido!'));
 s.click('Volver a mis mundos →');
 s.click('Misión Pixel');
 for(let i=0;i<5;i++)s.click('→');
 assert.equal(s.state.entries.microV2.bonus.pixel.done,true);
 assert.equal(s.state.entries.microV2.bonus.pixel.gems.length,3);
 assert.equal(s.counters().done,0);
});
test('los retos guardados siguen al volver del mapa y no se pierden',()=>{
 const s=session();
 s.click('🚀 Comenzar mi aventura →');
 s.click('Un asistente que explique con ejemplos');
 s.click('← Volver a mis mundos');
 assert.equal(s.counters().done,1);
 s.click('🚀 Continuar mi aventura →');
 assert.equal(s.counters().done,1);
 s.click('Continuar →');
 assert.equal(s.counters().step,1);
});
