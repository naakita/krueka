const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const {File,Blob}=require('node:buffer');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'actividades-clase.html'),'utf8');
const source=fs.readFileSync(path.join(root,'js/krueka-clase-temporal.js'),'utf8');
const settle=()=>new Promise(resolve=>setImmediate(resolve));
const file=(name,size=24,type='')=>new File([new Uint8Array(size).fill(65)],name,{type,lastModified:123});
const mime={pdf:'application/pdf',txt:'text/plain',png:'image/png',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'};

class Element{
 constructor(tag,doc){this.tagName=tag.toUpperCase();this.doc=doc;this.children=[];this.parentNode=null;this.attributes={};this.listeners={};this._text='';this._value='';this.hidden=false;this.disabled=false;this.className='';this.files=[];}
 set textContent(value){this.replaceChildren();this._text=String(value);}
 get textContent(){return this._text+this.children.map(child=>child.textContent).join('');}
 set value(value){this._value=String(value);if(this.type==='file'&&value==='')this.files=[];}
 get value(){return this._value;}
 append(...nodes){for(const node of nodes){node.remove();node.parentNode=this;this.children.push(node);}}
 replaceChildren(...nodes){for(const node of this.children)node.parentNode=null;this.children=[];this._text='';this.append(...nodes);}
 remove(){if(this.parentNode){this.parentNode.children=this.parentNode.children.filter(n=>n!==this);this.parentNode=null;}}
 setAttribute(name,value){this.attributes[name]=String(value);}
 getAttribute(name){return this.attributes[name]??null;}
 addEventListener(type,callback){(this.listeners[type]??=[]).push(callback);}
 async fire(type){if(type==='click'&&this.disabled)return;const event={target:this,preventDefault(){}};for(const cb of this.listeners[type]||[])await cb(event);if(this['on'+type])await this['on'+type](event);}
 click(){if(this.tagName==='A')this.doc.downloads.push({name:this.download,blob:this.doc.urls.get(this.href)});return this.fire('click');}
 focus(){this.doc.activeElement=this;}
 scrollIntoView(){}
 reset(){for(const id of this.resetIds||[])this.doc.nodes.get(id).value='';}
 add(node){this.append(node);}
 querySelector(selector){return walk(this).find(n=>selector==='button'?n.tagName==='BUTTON':selector[0]==='.'?n.className.split(' ').includes(selector.slice(1)):false)||null;}
}
function walk(node){return node.children.flatMap(child=>[child,...walk(child)]);}
function findButton(node,text){const found=walk(node).find(n=>n.tagName==='BUTTON'&&n.textContent===text);assert.ok(found,'Botón presente: '+text);return found;}
function rows(node){return walk(node).filter(n=>n.className==='material-queue-row');}

function backend(){
 const state={logged:false,classes:[],materials:new Map(),attempts:[],creates:0,failures:new Map(),lostResponses:new Set(),progress:[],lookups:[],materialReads:[]};
 state.seed=(count=0)=>{
  const activity={id:'11111111-1111-4111-8111-'+String(state.classes.length+1).padStart(12,'0'),title:'Actividad de prueba',grade:'Curso',subject:'Materia',instructions:'Leé los materiales y realizá la actividad.',created_at:'2026-11-27T12:00:00Z',accepting:true};
  state.classes.push(activity);state.materials.set(activity.id,new Map());
  for(let i=0;i<count;i++)state.save(activity.id,webcrypto.randomUUID(),file('existente-'+i+'.bin'));
  return activity;
 };
 state.save=(activityId,id,selectedFile)=>{
  const items=state.materials.get(activityId);if(items.has(id))return items.get(id).metadata;
  const ext=selectedFile.name.split('.').pop(),metadata={id,file_name:selectedFile.name,size_bytes:selectedFile.size,mime_type:mime[ext]||'application/octet-stream',uploaded_at:'2026-11-27T12:00:00Z'};
  items.set(id,{metadata,file:selectedFile});return metadata;
 };
 state.list=id=>Array.from(state.materials.get(id)?.values()||[]).map(item=>({...item.metadata}));
 state.fetch=async(url,options)=>{
  const body=JSON.parse(options.body),ok=data=>({ok:true,json:async()=>({ok:true,...data})});
  if(body.action==='lookup'){
   state.lookups.push(body.code);const activity=state.classes[0];
   return ok({activity:{...activity,materials:state.list(activity.id)}});
  }
  if(body.action==='material'){
   state.materialReads.push(body);const item=state.materials.get(state.classes[0].id).get(body.material_id);
   return {ok:true,blob:async()=>new Blob([await item.file.arrayBuffer()],{type:item.metadata.mime_type})};
  }
  assert.equal(options.headers.authorization,'Bearer test-session');
  if(body.action==='list-classes')return ok({classes:state.classes.map(a=>({...a})),total:state.classes.length,page:0,page_size:12});
  if(body.action==='list-materials')return ok({materials:state.list(body.activity_id)});
  if(body.action==='create-class'){
   state.creates++;const activity=state.seed();Object.assign(activity,body);return ok({activity:{...activity},code:'ABCDEFGHJKLM'});
  }
  if(body.action==='delete-material'){state.materials.get(body.activity_id).delete(body.material_id);return ok({});}
  if(body.action==='submissions')return ok({items:[]});
  throw Error('Unexpected action '+body.action);
 };
 return state;
}
function harness(state,teacher=true,crypto=webcrypto){
 const doc={nodes:new Map(),downloads:[],urls:new Map()};
 doc.body=new Element('body',doc);doc.createElement=tag=>new Element(tag,doc);doc.getElementById=id=>doc.nodes.get(id);
 doc.querySelector=()=>null;
 for(const match of html.matchAll(/<(\w+)[^>]*\bid="([^"]+)"[^>]*>/g)){
  const element=new Element(match[1],doc);element.id=match[2];
  const type=match[0].match(/\btype="([^"]+)"/);if(type)element.type=type[1];
  doc.nodes.set(element.id,element);
 }
 doc.nodes.get('create-form').resetIds=['new-grade','new-subject','new-title','new-instructions','new-pdf'];
 doc.nodes.get('upload-form').resetIds=['student-name','student-file'];
 doc.nodes.get('class-status').value='all';doc.nodes.get('class-sort').value='recent';
 const handlers={},previewCalls=[];
 class XHR{
  constructor(){this.upload={};this.headers={};this.aborted=false;}
  open(method,url){this.method=method;this.url=url;}
  setRequestHeader(name,value){this.headers[name]=value;}
  send(form){
   assert.equal(this.headers.authorization,'Bearer test-session');assert.equal(this.method,'POST');
   assert.equal(form.get('action'),'upload-material');
   const id=form.get('upload_id'),activityId=form.get('activity_id'),selectedFile=form.get('material');
   state.attempts.push({id,activityId,name:selectedFile.name});
   Promise.resolve().then(async()=>{
    if(this.aborted)return;
    this.upload.onprogress?.({lengthComputable:true,loaded:1,total:2});
    state.progress.push(doc.nodes.get('new-material-queue').textContent);
    if(state.hold)await state.hold;
    if(this.aborted)return;
    if(state.lostResponses.delete(selectedFile.name)){
     state.save(activityId,id,selectedFile);this.onerror();return;
    }
    const failures=state.failures.get(selectedFile.name)||0;
    if(failures){state.failures.set(selectedFile.name,failures-1);this.onerror();return;}
    if(!state.materials.get(activityId).has(id)&&state.list(activityId).length>=20){
     this.status=400;this.responseText=JSON.stringify({ok:false,error:'Cada actividad admite hasta 20 materiales.'});this.onload();return;
    }
    const material=state.save(activityId,id,selectedFile);
    this.upload.onprogress?.({lengthComputable:true,loaded:2,total:2});
    this.status=200;this.responseText=JSON.stringify({ok:true,material});this.onload();
   }).catch(error=>{this.error=error;this.onerror();});
  }
  abort(){this.aborted=true;this.onabort?.();}
 }
 class LocalURL extends URL{}
 LocalURL.createObjectURL=blob=>{const id='blob:'+doc.urls.size;doc.urls.set(id,blob);return id;};
 LocalURL.revokeObjectURL=id=>doc.urls.delete(id);
 const window={
  addEventListener:(name,callback)=>{handlers[name]=callback;},
  turnstile:{getResponse:()=> 'proof',reset(){}},
  KruekaMaterialPreview:{open:(host,blob,name)=>{previewCalls.push({blob,name});host.hidden=false;return {destroy(){host.hidden=true;},expand(){}};}},
  supabase:{createClient:()=>({auth:{
   getSession:async()=>({data:{session:state.logged?{access_token:'test-session'}:null}}),
   signInWithPassword:async()=>{state.logged=true;return {error:null};},
   signOut:async()=>{state.logged=false;},signInWithOtp:async()=>({error:null})
  }})}
 };
 const context={window,document:doc,location:{search:teacher?'?docente=1':''},crypto,URLSearchParams,URL:LocalURL,FormData,Blob,Uint8Array,XMLHttpRequest:XHR,
  fetch:state.fetch,navigator:{clipboard:{writeText:async()=>{}}},confirm:()=>true,setTimeout,clearTimeout,Option:class extends Element{constructor(text,value){super('option',doc);this.textContent=text;this.value=value;}},console};
 vm.runInNewContext(source,context,{filename:'krueka-clase-temporal.js'});
 const by=id=>doc.nodes.get(id);
 return {doc,by,handlers,previewCalls,async login(){
  await settle();by('teacher-email').value='teacher@example.invalid';by('teacher-password').value='mock-password';
  await by('login-form').fire('submit');await settle();assert.equal(by('teacher-board').hidden,false);
 },async choose(input,files){input.files=files;await input.fire('change');},async submit(){
  by('new-grade').value='Curso de prueba';by('new-subject').value='Informática';by('new-title').value='Archivos de prueba';
  await by('create-form').fire('submit');await settle();
 }};
}

test('login → agregar dos tandas, quitar uno → crear 12 materiales → alumno descarga los 12 originales',async()=>{
 const server=backend(),teacher=harness(server);await teacher.login();
 const names=['guia.pdf','texto.txt','foto.png','documento.docx','audio.mp3','video.mp4','proyecto.sb3','programa.py','pagina.html','archivo.exe','README','datos.custom'];
 const files=names.map(name=>file(name));
 await teacher.choose(teacher.by('new-pdf'),files.slice(0,7));
 await teacher.choose(teacher.by('new-pdf'),[file('quitar.bin'),...files.slice(7)]);
 assert.equal(rows(teacher.by('new-material-queue')).length,13);
 const removed=rows(teacher.by('new-material-queue')).find(row=>row.textContent.includes('quitar.bin'));
 await findButton(removed,'Quitar').click();assert.equal(rows(teacher.by('new-material-queue')).length,12);
 assert.equal(server.attempts.length,0,'Seleccionar no empieza a subir');
 await teacher.submit();
 assert.equal(server.creates,1);assert.equal(server.attempts.length,12);assert.equal(server.list(server.classes[0].id).length,12);
 assert.equal(new Set(server.attempts.map(item=>item.id)).size,12);
 for(const attempt of server.attempts)assert.match(attempt.id,/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
 assert.ok(server.progress.some(text=>text.includes('Subiendo… 50%')),'Porcentaje real por archivo');
 const student=harness(server,false);student.by('student-code').value='ABCDEFGHJKLM';await student.by('lookup-form').fire('submit');
 const cards=student.by('student-materials-list').children;assert.equal(cards.length,12);
 assert.equal(cards.filter(card=>walk(card).some(n=>n.textContent==='Ver vista previa')).length,4);
 for(const card of cards)await findButton(card,'↓ Descargar archivo').click();
 assert.equal(student.doc.downloads.length,12);assert.equal(server.materialReads.length,12);
 for(let index=0;index<files.length;index++){
  assert.equal(student.doc.downloads[index].name,files[index].name);
  assert.deepEqual(Buffer.from(await student.doc.downloads[index].blob.arrayBuffer()),Buffer.from(await files[index].arrayBuffer()));
 }
 assert.equal(student.previewCalls.length,0,'Descargar no ejecuta el visor');
});

test('fallo parcial conserva archivos, código y actividad; reintentar sólo vuelve a enviar el pendiente con igual UUID',async()=>{
 const server=backend();server.failures.set('audio.mp3',1);
 const app=harness(server);await app.login();
 await app.choose(app.by('new-pdf'),[file('guia.pdf'),file('audio.mp3'),file('archivo.xyz')]);await app.submit();
 assert.equal(server.creates,1);assert.equal(server.attempts.length,3,'Un fallo no impide los archivos restantes');
 assert.equal(rows(app.by('new-material-queue')).length,3);assert.match(app.by('teacher-message').textContent,/mismo código/);
 const failed=rows(app.by('new-material-queue')).filter(row=>row.getAttribute('data-state')==='error');assert.equal(failed.length,1);
 assert.match(failed[0].textContent,/audio.mp3/);assert.equal(app.by('new-title').disabled,true);
 const first=server.attempts.find(item=>item.name==='audio.mp3');await app.submit();
 assert.equal(server.creates,1);assert.equal(server.attempts.length,4);
 assert.equal(server.attempts[3].id,first.id);assert.equal(server.list(server.classes[0].id).length,3);
 assert.equal(app.by('new-title').disabled,false);assert.equal(app.by('new-code').textContent,'ABCDEFGHJKLM');
});

test('respuesta perdida se reconcilia por upload_id, incluso con los 20 cupos ocupados',async()=>{
 const server=backend();server.lostResponses.add('material-19.bin');const app=harness(server);await app.login();
 await app.choose(app.by('new-pdf'),Array.from({length:20},(_,i)=>file('material-'+i+'.bin')));await app.submit();
 assert.equal(server.list(server.classes[0].id).length,20);assert.equal(server.attempts.length,20);
 assert.match(app.by('teacher-message').textContent,/Quedan 1 archivo/);await app.submit();
 assert.equal(server.creates,1);assert.equal(server.attempts.length,20,'El servidor confirmó el archivo por su id; no hace falta reenviarlo');
 assert.equal(server.list(server.classes[0].id).length,20);
});

test('Mis clases mantiene la cola tras actualizar; cuenta materiales existentes y conserva fallo con UUID estable',async()=>{
 const server=backend(),activity=server.seed(18);server.failures.set('uno.unknown',1);
 const app=harness(server);await app.login();
 const panel=()=>walk(app.by('classes')).find(n=>n.className==='material-panel');
 const input=walk(panel()).find(n=>n.tagName==='INPUT');
 await app.choose(input,[file('uno.unknown')]);await app.choose(input,[file('dos.sb3'),file('sin-cupo.bin')]);
 assert.equal(rows(panel()).length,2);assert.match(panel().textContent,/20 de 20/);assert.match(panel().textContent,/sin-cupo.bin/);
 assert.equal(server.attempts.length,0);await app.by('refresh-classes').click();await settle();
 assert.equal(rows(panel()).length,2,'Actualizar conserva los File elegidos');
 await findButton(panel(),'Subir 2 archivo(s)').click();
 assert.equal(server.list(activity.id).length,19);assert.equal(rows(panel()).filter(row=>row.getAttribute('data-state')==='error').length,1);
 await findButton(panel(),'Reintentar pendientes').click();await settle();
 assert.equal(server.list(activity.id).length,20);assert.equal(server.attempts.length,3);
 assert.equal(server.attempts[0].id,server.attempts[2].id);
});

test('sin filtro por extensión; rechaza vacíos y más de 10 MB, permite exactamente 10 MB y UUID seguro sin randomUUID',async()=>{
 const server=backend();const app=harness(server,true,{getRandomValues:array=>webcrypto.getRandomValues(array)});await app.login();
 await app.choose(app.by('new-pdf'),[file('vacio',0),file('grande.bin',10*1024*1024+1),file('limite.rar',10*1024*1024)]);
 assert.equal(rows(app.by('new-material-queue')).length,1);assert.match(app.by('new-material-queue').textContent,/vacio.*vacío/s);assert.match(app.by('new-material-queue').textContent,/grande.bin.*10 MB/s);
 await app.submit();assert.equal(server.attempts.length,1);assert.match(server.attempts[0].id,/-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-/);
});

test('una lista anterior que llega después de subir no borra filas ni reduce el contador de cupos',async()=>{
 const server=backend(),activity=server.seed(),fetch=server.fetch;
 let deferNext=false,release;
 server.fetch=async(url,options)=>{
  const reply=await fetch(url,options);
  if(JSON.parse(options.body).action==='list-materials'&&deferNext){
   deferNext=false;await new Promise(resolve=>{release=resolve;});
  }
  return reply;
 };
 const app=harness(server);await app.login();
 const panel=()=>walk(app.by('classes')).find(n=>n.className==='material-panel');
 await app.choose(walk(panel()).find(n=>n.tagName==='INPUT'),[file('material.bin')]);
 deferNext=true;await app.by('refresh-classes').click();await settle();assert.ok(release);
 await findButton(panel(),'Subir 1 archivo(s)').click();await settle();
 assert.equal(server.list(activity.id).length,1);assert.equal(rows(panel()).length,1);
 release();await settle();await settle();
 assert.equal(rows(panel()).length,1,'La respuesta vieja no quita el archivo confirmado');
 assert.match(panel().textContent,/1 de 20 materiales/);
});

test('la vista previa exige extensión y MIME compatibles; octet-stream, HTML y SVG siempre se descargan',async()=>{
 const server=backend(),activity=server.seed();
 for(const [name,type] of [['falso.pdf','application/octet-stream'],['imagen.svg','image/svg+xml'],['web.html','text/html'],['pdf','application/pdf'],['texto.txt','text/plain']]){
  const id=webcrypto.randomUUID();server.save(activity.id,id,file(name));server.materials.get(activity.id).get(id).metadata.mime_type=type;
 }
 const app=harness(server,false);app.by('student-code').value='ABCDEFGHJKLM';await app.by('lookup-form').fire('submit');
 const cards=app.by('student-materials-list').children;
 for(const card of cards){assert.ok(findButton(card,'↓ Descargar archivo'));}
 const previewCards=cards.filter(card=>walk(card).some(n=>n.textContent==='Ver vista previa'));assert.equal(previewCards.length,1);
 assert.match(previewCards[0].textContent,/texto.txt/);await findButton(previewCards[0],'Ver vista previa').click();
 assert.equal(app.previewCalls.length,1);assert.equal(app.previewCalls[0].name,'texto.txt');
});

test('cierre de sesión vacía archivos en memoria y aborta una subida en curso',async()=>{
 const server=backend(),app=harness(server);await app.login();await app.choose(app.by('new-pdf'),[file('archivo.dat')]);
 let release;server.hold=new Promise(resolve=>{release=resolve;});const submission=app.submit();
 while(!server.attempts.length)await settle();
 await app.by('sign-out').click();release();await submission;
 assert.equal(app.by('teacher-board').hidden,true);assert.equal(rows(app.by('new-material-queue')).length,0);
 assert.equal(server.list(server.classes[0].id).length,0);assert.equal(app.by('new-code').textContent,'');
 let warned=false;app.handlers.beforeunload({preventDefault(){warned=true;}});assert.equal(warned,false);
});
