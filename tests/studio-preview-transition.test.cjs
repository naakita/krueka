const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../js/club-studio-ai.js'),'utf8');

function setup(){
 let current=null;
 const panel={remove(){if(current)current.isConnected=false;current=null;}};
 const env={
  document:{readyState:'loading',addEventListener(){},getElementById(id){return id==='ks-frame'?current:id==='krueka-studio'?panel:null;},querySelectorAll(){return [];}},
  addEventListener(){},removeEventListener(){},clearTimeout(){},
  setTimeout(){throw Error('La transición no debe depender de temporizadores.');},
  esc:value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
 };
 env.window=env;vm.createContext(env);vm.runInContext(source,env);
 const studio=env.StudioIA;studio.projectId='project-a';studio.cloudReady=true;
 function frame(){
  const f={isConnected:true,off:false,requests:[],messages:[],focusCount:0,visible:'',onload:null,
   classList:{contains(name){return name==='off'&&f.off;}},
   focus(){f.focusCount++;},
   newWindow(){return {postMessage(data){f.messages.push(JSON.parse(JSON.stringify(data)));}};},
   load(){f.onload?.();},
   ack(request,sourceWindow=request.window){studio.onMessage({source:sourceWindow,data:{type:'krueka-preview-ready',revision:request.revision}});},
   commit(index){
    const request=f.requests[index];assert.ok(request,'La navegación debe haberse iniciado');f.visible=request.html;
    const script=request.html.match(/<script data-krueka-preview-bridge\b[^>]*>([\s\S]*?)<\/script>/)?.[1];
    assert.ok(script,'El HTML real debe incluir el bridge de Studio');
    const events=new Map();
    const child={document:{currentScript:{getAttribute(name){return name==='data-krueka-preview-revision'?request.revision:null;}},
      addEventListener(name,fn){events.set(name,fn);}},
     addEventListener(){},parent:{postMessage(data){studio.onMessage({source:request.window,data});}}};
    vm.createContext(child);vm.runInContext(script,child);
    assert.ok(events.has('DOMContentLoaded'),'La confirmación espera al documento de esta revisión');
    events.get('DOMContentLoaded')();
   }
  };
  f.contentWindow=f.newWindow();
  Object.defineProperty(f,'srcdoc',{get(){return f.requests.at(-1)?.html||'';},set(html){
   const revision=html.match(/data-krueka-preview-revision="([^"]+)"/)?.[1];
   assert.ok(revision,'Cada navegación iniciada debe tener una revisión única');
   f.requests.push({html,revision,window:f.contentWindow});
  }});
  return f;
 }
 const initial=frame();current=initial;
 const show=(label,play=false)=>{studio.files={'index.html':'<!doctype html><html><head><title>'+label+'</title></head><body><h1>'+label+'</h1></body></html>'};studio.renderPreview(play);};
 return {studio,frame:initial,makeFrame:frame,show,setFrame(value){current=value;}};
}

test('dos cambios antes de terminar la carga conservan únicamente la última vista solicitada',()=>{
 const {frame,show}=setup();
 show('Misión estelar');show('Animación',true);show('Dibujo');
 assert.equal(frame.requests.length,1,'No se inicia otra navegación mientras la inicial sigue pendiente');
 frame.commit(0);
 assert.equal(frame.requests.length,2);assert.match(frame.requests[1].html,/<h1>Dibujo<\/h1>/);
 assert.doesNotMatch(frame.requests[1].html,/<h1>Animación<\/h1>/);
 frame.commit(1);assert.match(frame.visible,/<h1>Dibujo<\/h1>/);
 assert.equal(frame.messages.length,0,'El Probar sustituido de Animación no debe reproducir Dibujo');
});

test('solo la última revisión confirmada recibe foco y la orden de reproducir',()=>{
 const {frame,show}=setup();
 show('Anterior',true);show('Última',true);
 frame.commit(0);assert.equal(frame.messages.length,0);assert.equal(frame.focusCount,0);
 frame.commit(1);
 assert.deepEqual(frame.messages,[{type:'krueka-preview-play'}]);assert.equal(frame.focusCount,1);
 frame.ack(frame.requests[0]);frame.ack(frame.requests[1]);
 assert.equal(frame.messages.length,1,'Confirmaciones viejas o repetidas no repiten la reproducción');
});

test('load de about:blank, otra ventana y una revisión antigua no desbloquean la cola',()=>{
 const {frame,show,studio}=setup();show('Inicial');show('Nueva');
 const active=frame.requests[0];
 frame.load();
 studio.onMessage({source:frame.contentWindow,data:{type:'krueka-preview-ready'}});
 studio.onMessage({source:frame.contentWindow,data:{type:'krueka-preview-ready',revision:'preview-vieja'}});
 frame.ack(active,{});
 assert.equal(frame.requests.length,1);
 frame.commit(0);assert.equal(frame.requests.length,2);
 frame.ack(active);assert.equal(frame.requests.length,2);
 frame.commit(1);assert.match(frame.visible,/<h1>Nueva<\/h1>/);
});

test('una petición idéntica se une durante la carga y conserva reinicios posteriores con o sin play',()=>{
 const {frame,show}=setup();
 show('Igual',true);show('Igual',false);show('Igual',false);
 assert.equal(frame.requests.length,1);frame.commit(0);assert.equal(frame.messages.length,0);
 show('Igual');show('Igual');assert.equal(frame.requests.length,2,'Programación y Bloques reinician sin pasar play');frame.commit(1);
 show('Igual',true);show('Igual',true);
 assert.equal(frame.requests.length,3,'Un Probar explícito reinicia una vez');
 frame.commit(2);assert.equal(frame.messages.length,1);
});

test('volver al contenido activo descarta el cambio intermedio pendiente',()=>{
 const {frame,show}=setup();show('A');show('B',true);show('A');
 frame.commit(0);assert.equal(frame.requests.length,1);assert.match(frame.visible,/<h1>A<\/h1>/);assert.equal(frame.messages.length,0);
});

test('cambiar de iframe descarta la cola anterior y sus mensajes tardíos',()=>{
 const {frame:old,makeFrame,setFrame,show}=setup();show('A');show('B',true);
 const next=makeFrame();old.isConnected=false;setFrame(next);show('C',true);
 assert.equal(next.requests.length,1);old.commit(0);
 assert.equal(old.requests.length,1,'No se despacha B sobre el iframe retirado');assert.equal(next.messages.length,0);
 assert.notEqual(next.requests[0].revision,old.requests[0].revision);
 next.commit(0);assert.match(next.visible,/<h1>C<\/h1>/);assert.equal(next.messages.length,1);
});

test('un contexto de navegación nuevo en el mismo nodo no hereda la carga anterior',()=>{
 const {frame,show}=setup();show('A');show('B',true);
 frame.contentWindow=frame.newWindow();show('C');
 assert.equal(frame.requests.length,2);frame.commit(0);
 assert.equal(frame.requests.length,2);assert.equal(frame.messages.length,0);
 frame.commit(1);assert.match(frame.visible,/<h1>C<\/h1>/);
});

test('cerrar limpia la transición y no deja contenido pendiente al volver a abrir',async()=>{
 const {frame,setFrame,show,studio}=setup();show('A');show('B',true);
 await studio.close();assert.equal(frame.isConnected,false);frame.commit(0);assert.equal(frame.requests.length,1);
 // Reusar el nodo hace visible la limpieza explícita, incluso sin depender de su identidad.
 frame.isConnected=true;setFrame(frame);show('C');assert.equal(frame.requests.length,2);
 frame.commit(1);assert.match(frame.visible,/<h1>C<\/h1>/);assert.equal(frame.messages.length,0);
});

test('un nuevo proyecto se abre aunque coincida el HTML y un iframe oculto no roba foco',()=>{
 const {frame,show,studio}=setup();show('Mismo contenido');frame.commit(0);
 studio.projectId='project-b';show('Mismo contenido',true);assert.equal(frame.requests.length,2);
 frame.off=true;frame.commit(1);assert.equal(frame.focusCount,0);assert.equal(frame.messages.length,0);
 show('Oculto');assert.equal(frame.requests.length,2);
 frame.off=false;show('Visible');assert.equal(frame.requests.length,3);frame.commit(2);assert.match(frame.visible,/<h1>Visible<\/h1>/);
});
