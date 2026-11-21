/* Editor de programacion web sin instalaciones. Reutiliza guardado y revision de Studio. */
(function(){
'use strict';
if(window.StudioProgramacion||!window.StudioIA||!window.StudioKits)return;
var kit={id:'arcade-web',icon:'⌘',title:'Mi primer juego web',tag:'HTML, CSS y JavaScript',description:'Programá un videojuego en el navegador y compartilo tras aprobación docente.',challenge:'Cambiá la velocidad y los colores; probá y explicá lo ocurrido.'};
StudioKits.catalog.unshift(kit);
var originalCreate=StudioKits.create.bind(StudioKits);
var html='<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Atrapa estrellas</title><link rel="stylesheet" href="style.css"></head><body><main><h1>🚀 Atrapa estrellas</h1><p>Mové el personaje con las flechas para sumar puntos.</p><p>Puntos: <strong id="puntos">0</strong></p><canvas id="juego" width="640" height="360" tabindex="0"></canvas><div class="controles"><button data-move="ArrowLeft">◀</button><button data-move="ArrowUp">▲</button><button data-move="ArrowDown">▼</button><button data-move="ArrowRight">▶</button></div><button id="reiniciar">Reiniciar</button></main><script src="script.js"></script></body></html>';
var css='*{box-sizing:border-box}body{margin:0;background:#0c1734;color:#f5fbff;font-family:system-ui;text-align:center}main{width:min(740px,96%);margin:22px auto}h1{color:#ffdc69}canvas{display:block;width:100%;height:auto;background:#102c55;border:4px solid #68d5ff;border-radius:14px}button{border:0;background:#1b84c6;color:white;padding:12px;border-radius:9px;font-weight:bold;cursor:pointer;margin:6px}.controles{display:flex;justify-content:center;flex-wrap:wrap}';
var script=[
'// Editá las reglas de tu juego.',
'const canvas=document.getElementById("juego"),ctx=canvas.getContext("2d");',
'const jugador={x:300,y:170,tamano:28,velocidad:22};',
'let estrella={x:110,y:110},puntos=0;',
'function nuevaEstrella(){estrella.x=20+Math.random()*(canvas.width-40);estrella.y=20+Math.random()*(canvas.height-40)}',
'function dibujar(){ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle="#ffda62";ctx.beginPath();ctx.arc(estrella.x,estrella.y,12,0,Math.PI*2);ctx.fill();ctx.fillStyle="#6af2ad";ctx.fillRect(jugador.x,jugador.y,jugador.tamano,jugador.tamano)}',
'function mover(t){if(t==="ArrowLeft")jugador.x-=jugador.velocidad;if(t==="ArrowRight")jugador.x+=jugador.velocidad;if(t==="ArrowUp")jugador.y-=jugador.velocidad;if(t==="ArrowDown")jugador.y+=jugador.velocidad;jugador.x=Math.max(0,Math.min(canvas.width-jugador.tamano,jugador.x));jugador.y=Math.max(0,Math.min(canvas.height-jugador.tamano,jugador.y));if(Math.hypot(jugador.x+14-estrella.x,jugador.y+14-estrella.y)<32){puntos++;document.getElementById("puntos").textContent=puntos;nuevaEstrella()}dibujar()}',
'document.addEventListener("keydown",e=>{if(e.key.startsWith("Arrow")){e.preventDefault();mover(e.key)}});',
'document.querySelectorAll("[data-move]").forEach(b=>b.addEventListener("click",()=>mover(b.dataset.move)));',
'document.getElementById("reiniciar").onclick=()=>{puntos=0;document.getElementById("puntos").textContent=0;jugador.x=300;jugador.y=170;nuevaEstrella();dibujar()};dibujar();'
].join('\n');
var sample={'index.html':html,'style.css':css,'script.js':script,'LEEME.md':'# Mi juego web\nCambiá el título en HTML, los colores en CSS y velocidad:22 en JavaScript. Probá, guardá y enviá al profe. Nunca publiques datos personales.'};
const templates={
 'pagina-web':{title:'Mi página web',description:'Armá una página con encabezado, menú, texto e imágenes.',heading:'Mi página web',body:'<p>Contá de qué trata tu página.</p>',script:'// Agregá interacciones a tu página.'},
 'aplicacion-web':{title:'Mi aplicación web',description:'Creá una aplicación sencilla que responde a lo que hace el usuario.',heading:'Lista de tareas',body:'<form id="tareas"><label>Nueva tarea <input name="tarea" required></label><button type="button" id="agregar">Agregar</button></form><ul id="lista"></ul>',script:`const form = document.getElementById('tareas');
function agregarTarea(){
 const texto = form.elements.tarea.value.trim();
 if (!texto) return;
 const item = document.createElement('li');
 item.textContent = texto;
 document.getElementById('lista').append(item);
 form.reset();
}
document.getElementById('agregar').addEventListener('click', agregarTarea);
form.elements.tarea.addEventListener('keydown', event => {
 if(event.key!=='Enter')return;
 event.preventDefault();
 agregarTarea();
});`}
};
for(const [id,template] of Object.entries(templates))StudioKits.catalog.push({id,icon:id==='pagina-web'?'🌐':'📱',title:template.title,description:template.description,tag:'HTML · CSS · JavaScript'});
function webTemplate(id){
 const t=templates[id];
 return {
  'index.html':'<!doctype html>\n<html lang="es">\n<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+t.title+'</title><link rel="stylesheet" href="style.css"></head>\n<body>\n<main>\n<h1>'+t.heading+'</h1>\n'+t.body+'\n</main>\n<script src="script.js"></script>\n</body>\n</html>',
  'style.css':'*{box-sizing:border-box}body{margin:0;font:16px/1.5 system-ui;color:#173052;background:#eaf3fb}main{max-width:720px;margin:auto;padding:clamp(16px,5vw,45px)}a{color:#12568d}button,input{font:inherit;padding:8px}img{max-width:100%;height:auto}details{margin:10px 0}',
  'script.js':t.script,
  'tipo-club.txt':id==='pagina-web'?'paginas':'aplicaciones'
 };
}
StudioKits.create=function(id){
 if(id==='arcade-web')return {...sample};
 return Object.hasOwn(templates,id)?webTemplate(id):originalCreate(id);
};
const blocks={
 encabezado:['Encabezado','<h2>Nuevo encabezado</h2>'],
 menu:['Menú','<nav aria-label="Menú"><a href="#seccion">Ir a la sección</a></nav><section id="seccion"><h2>Sección</h2></section>'],
 submenu:['Submenú','<details><summary>Más opciones</summary><a href="#seccion">Ver sección</a></details>'],
 texto:['Texto','<p>Escribí tu texto aquí.</p>'],
 imagen:['Imagen','<img alt="Describí la imagen" width="240" height="120" src="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27240%27 height=%27120%27%3E%3Crect width=%27240%27 height=%27120%27 fill=%27%23cee5f5%27/%3E%3C/svg%3E">'],
 boton:['Botón','<button type="button">Mi botón</button>'],
 formulario:['Formulario','<form><label>Respuesta <input name="respuesta"></label><button type="button">Listo</button></form>'],
 tarjeta:['Tarjeta','<article><h2>Título de la tarjeta</h2><p>Agregá una idea, una imagen o un enlace.</p></article>'],
 lista:['Lista','<ul><li>Primera idea</li><li>Segunda idea</li></ul>'],
 contador:['Contador','<section><h2>Contador</h2><p>Toques: <output>0</output></p><button type="button" onclick="const total=this.parentElement.querySelector(&quot;output&quot;);total.value=Number(total.value)+1">Sumar</button></section>'],
 pregunta:['Pregunta','<details><summary>¿Cuál es tu pregunta?</summary><p>Escribí acá la respuesta que se revela.</p></details>']
};
function insertBlock(html,key){
 if(!Object.hasOwn(blocks,key))return html;
 const code='\n'+blocks[key][1]+'\n';
 const closing=/<\/main\s*>/i.test(html)?/<\/main\s*>/i:/<\/body\s*>/i;
 return closing.test(html)?html.replace(closing,match=>code+match):html+code;
}
function starterFor(s){
 return {paginas:'pagina-web',aplicaciones:'aplicacion-web'}[s.files?.['tipo-club.txt']]||'arcade-web';
}
if(window.StudioCreative&&Array.isArray(StudioCreative.paths))StudioCreative.paths.unshift({id:'programacion',icon:'⌘',title:'Programación web',tag:'HTML · CSS · JS',color:'mint',text:'Creá videojuegos escribiendo código y probalos en vivo.',first:'arcade-web',kits:['arcade-web','web']});
var paths=['index.html','style.css','script.js'],panel=null,shell=null,editor=null,preview=null,previewParent=null,previewSibling=null,timer=null,activeFile='index.html',active=false;
function isWeb(s){return !!s.files && typeof s.files['index.html']==='string';}
function actualPaths(s){
 const html=String(s.files['index.html']||'');
 const find=(tag,attr,ext)=>{
  const regex=new RegExp('<'+tag+'\\b[^>]*?'+attr+'=["\\x27]([^"\\x27]+)["\\x27][^>]*>','gi');
  let match,last=null;
  while((match=regex.exec(html))){
   const loc=match[1].replace(/^\.\//,'').split(/[?#]/)[0];
   if(loc.endsWith(ext)&&typeof s.files[loc]==='string')last=loc;
  }
  return last;
 };
 const css=find('link','href','.css')||Object.keys(s.files).find(n=>n.endsWith('.css'));
 const js=find('script','src','.js')||Object.keys(s.files).find(n=>n.endsWith('.js')&&n!=='game-config.js');
 return {'index.html':'index.html','style.css':css||null,'script.js':js||null};
}
function tabPath(s,name){
 if(name==='preview')return name;
 const map=actualPaths(s);
 return map[name]|| (typeof s.files[name]==='string'?name:null);
}
function state(text){const el=shell?.querySelector('#kp-program-state');if(el)el.textContent=text;}
function mount(s){
 const p=document.getElementById('krueka-studio');if(!p)return;
 if(panel===p&&shell?.isConnected)return;
 panel=p;active=false;activeFile='index.html';
 preview=p.querySelector('.ks-preview');previewParent=preview?.parentNode||null;previewSibling=preview?.nextSibling||null;
 const tab=document.createElement('button');tab.type='button';tab.className='ks-btn';tab.dataset.tab='programacion';tab.textContent='⌘ Programación web';tab.classList.add('kp-entry-highlight');tab.onclick=()=>s.showTab('programacion');p.querySelector('.ks-tabs').prepend(tab);
 shell=document.createElement('section');shell.id='kp-program-shell';shell.className='kp-program-shell';shell.hidden=true;shell.setAttribute('aria-label','Espacio de programación web');
 shell.innerHTML=
 '<header class="kp-program-header">'+
  '<div class="kp-program-brand"><span class="kp-program-mark">⌘</span><div><b>Krueka Code</b><small id="kp-program-title">Mi videojuego</small></div></div>'+
  '<nav class="kp-program-tabs" aria-label="Elegí qué editar">'+
   '<button type="button" data-kp-file="index.html">HTML · Contenido</button>'+
   '<button type="button" data-kp-file="style.css">CSS · Diseño</button>'+
   '<button type="button" data-kp-file="script.js">JS · Acciones</button>'+
   '<button type="button" data-kp-file="preview">◉ Vista previa</button>'+
  '</nav>'+
  '<div class="kp-program-actions">'+
   '<button type="button" id="kp-program-save" class="kp-program-btn">Guardar</button>'+
   '<button type="button" id="kp-program-submit" class="kp-program-btn kp-program-primary">Enviar al profe</button>'+
   '<details class="kp-program-menu"><summary>Proyecto ▾</summary><div class="kp-program-dropdown">'+
    '<button type="button" id="kp-program-new">＋ Nuevo proyecto</button>'+
    '<button type="button" id="kp-program-list">Mis proyectos</button>'+
    '<button type="button" id="kp-program-rename">Cambiar nombre</button>'+
    '<button type="button" id="kp-program-export">Descargar</button>'+
    '<a href="programacion-juegos.html" target="_blank" rel="noopener noreferrer">Galería de juegos ↗</a>'+
   '</div></details>'+
   '<button type="button" id="kp-program-back" class="kp-program-back">Talleres</button>'+
  '</div>'+
 '</header>'+
 '<main class="kp-program-body">'+
  '<section class="kp-program-code" aria-label="Editor de código">'+
   '<div class="kp-program-pane-head"><strong id="kp-program-filename">index.html</strong><span>Escribí tu código</span></div>'+
   '<div id="kp-program-create" class="kp-program-create" hidden><h2>Elegí un proyecto web</h2><p>Este proyecto utiliza otro tipo de editor. No vamos a modificarlo.</p><button type="button" id="kp-program-start">Crear con HTML, CSS y JavaScript</button></div>'+
   '<details class="kp-blocks" id="kp-blocks"><summary>Bloques HTML</summary><div id="kp-block-list"></div><p id="kp-block-drop">Arrastrá un bloque aquí o pulsá su nombre.</p></details>'+
   '<textarea id="kp-program-editor" spellcheck="false" aria-label="Editor de código del archivo elegido"></textarea>'+
  '</section>'+
  '<section class="kp-program-preview" aria-label="Vista previa del proyecto">'+
   '<div class="kp-program-pane-head"><strong>Vista previa</strong><button type="button" id="kp-program-run">▶ Ejecutar</button></div>'+
   '<div id="kp-program-preview-slot"></div>'+
  '</section>'+
 '</main>'+
 '<footer class="kp-program-footer"><span id="kp-program-state" role="status">Tu código se guarda en Krueka.</span><span>HTML: estructura · CSS: diseño · JavaScript: comportamiento</span></footer>';
 p.appendChild(shell);
 editor=shell.querySelector('#kp-program-editor');
 const addBlock=key=>{
  if(s.busy||!s.cloudReady||starterFor(s)==='arcade-web'||!Object.hasOwn(blocks,key))return;
  const before=s.files['index.html'],after=insertBlock(before,key);
  choose(s,'index.html');
  editor.value=after;editor.dispatchEvent(new Event('input',{bubbles:true}));
  editor.focus();
 };
 const tray=shell.querySelector('#kp-block-list'),drop=shell.querySelector('#kp-block-drop');
 for(const [key,[label]] of Object.entries(blocks)){
  const button=document.createElement('button');
  button.type='button';button.draggable=true;button.textContent=label;
  button.onclick=()=>addBlock(key);
  button.ondragstart=event=>{event.dataTransfer.setData('application/x-krueka-block',key);event.dataTransfer.effectAllowed='copy';};
  tray.append(button);
 }
 for(const target of [drop,editor]){
  target.addEventListener('dragover',event=>{if(event.dataTransfer.types.includes('application/x-krueka-block'))event.preventDefault();});
  target.addEventListener('drop',event=>{
   const key=event.dataTransfer.getData('application/x-krueka-block');
   if(key){event.preventDefault();addBlock(key);}
  });
 }
 shell.querySelectorAll('[data-kp-file]').forEach(b=>b.onclick=()=>choose(s,b.dataset.kpFile));
 editor.addEventListener('focus',()=>{if(s.cloudReady&&!s.busy)s.checkpoint();});
 editor.addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();editor.setRangeText('  ',editor.selectionStart,editor.selectionEnd,'end');editor.dispatchEvent(new Event('input',{bubbles:true}));}});
 editor.addEventListener('input',()=>{
   if(!s.cloudReady||s.busy||!isWeb(s)||!activeFile||typeof s.files[activeFile]!=='string'){editor.value=s.files[activeFile]||'';return;}
   try{s.validFiles({...s.files,[activeFile]:editor.value});}
   catch(err){editor.value=s.files[activeFile]||'';state('Límite del proyecto: '+err.message);return;}
   s.files[activeFile]=editor.value;s.changed();state('Cambios pendientes de guardar…');
   clearTimeout(timer);timer=setTimeout(()=>{if(active&&isWeb(s)){s.preview='index.html';s.renderPreviewOptions();s.renderPreview();state('✓ Vista previa actualizada con los cambios de código.');}},700);
 });
 shell.querySelector('#kp-program-save').onclick=async()=>{if(s.busy||!s.cloudReady)return;state('Guardando…');const ok=await s.save();state(ok?'✓ Proyecto guardado en Krueka':'No se pudo guardar. Revisá la conexión e intentá de nuevo.');};
 shell.querySelector('#kp-program-submit').onclick=async()=>{if(s.busy||!s.cloudReady)return;state('Enviando a revisión…');await s.submit();};
 shell.querySelector('#kp-program-run').onclick=()=>{if(!isWeb(s)){state('Primero elegí un proyecto web.');return;}s.preview='index.html';s.renderPreviewOptions();s.renderPreview();const iframe=shell.querySelector('#ks-frame');if(iframe)iframe.focus();state('Vista previa actualizada.');};
 shell.querySelector('#kp-program-back').onclick=()=>s.showTab('home');
 shell.querySelector('#kp-program-new').onclick=()=>{shell.querySelector('.kp-program-menu').open=false;s.createKit(starterFor(s));};
 shell.querySelector('#kp-program-start').onclick=()=>s.createKit('arcade-web');
 shell.querySelector('#kp-program-list').onclick=()=>{shell.querySelector('.kp-program-menu').open=false;s.showProjects();};
 shell.querySelector('#kp-program-export').onclick=()=>{shell.querySelector('.kp-program-menu').open=false;s.download();};
 shell.querySelector('#kp-program-rename').onclick=()=>{
   shell.querySelector('.kp-program-menu').open=false;
   const value=prompt('Nombre de tu proyecto',s.title||'Mi videojuego');
   if(value===null)return;
   const title=value.trim().slice(0,80);if(!title){state('Escribí un nombre para tu proyecto.');return;}
   s.title=title;const input=p.querySelector('#ks-title');if(input)input.value=title;s.changed();sync(s);state('Nombre cambiado. Guardá tu proyecto.');
 };
}
function choose(s,name){
 if(!shell)return;
 const onlyPreview=name==='preview',real=tabPath(s,name);
 if(!onlyPreview&&!real){state('Ese tipo de archivo no existe en este proyecto.');return;}
 activeFile=onlyPreview?'preview':real;
 shell.classList.toggle('kp-preview-only',onlyPreview);
 shell.querySelectorAll('[data-kp-file]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.kpFile===name)));
 const filename=shell.querySelector('#kp-program-filename');if(filename)filename.textContent=onlyPreview?'':real;
 if(!onlyPreview){editor.value=s.files[real]||'';editor.focus();}
 if(onlyPreview&&active)s.renderPreview();
}
function sync(s){
 if(!shell?.isConnected)return;
 const ok=isWeb(s);
 shell.querySelector('#kp-program-title').textContent=String(s.title||'Mi videojuego').slice(0,80);
 shell.querySelector('#kp-program-create').hidden=ok;
 editor.hidden=!ok;
 shell.querySelector('#kp-blocks').hidden=!ok||starterFor(s)==='arcade-web';
 const detected=actualPaths(s);
 shell.querySelectorAll('[data-kp-file]').forEach(b=>{
  const key=b.dataset.kpFile;
  if(key==='preview')return;
  b.disabled=key!=='index.html'&&!detected[key];
  b.title=detected[key]?'Editar '+detected[key]:'Este proyecto no contiene ese archivo';
 });
 editor.readOnly=s.busy||!s.cloudReady;
 if(ok&&activeFile!=='preview'&&document.activeElement!==editor){
  if(typeof s.files[activeFile]!=='string')activeFile='index.html';
  editor.value=s.files[activeFile]||'';
 }
 shell.querySelector('#kp-program-run').disabled=!ok;
 shell.querySelector('#kp-program-save').disabled=s.busy||!s.cloudReady;
 shell.querySelector('#kp-program-submit').disabled=s.busy||!s.cloudReady;
}
function show(s){
 mount(s);
 if(!preview||!previewParent)return;
 if(panel.querySelector('#ks-code')?.classList.contains('on'))s.toggleCode();
 if(panel.classList.contains('ks-play-only'))panel.classList.remove('ks-play-only');
 if(panel.classList.contains('ks-chat-focus')&&window.StudioFocusChat)StudioFocusChat.exit(s);
 shell.querySelector('#kp-program-preview-slot').appendChild(preview);
 shell.hidden=false;active=true;
 panel.classList.add('kp-program-mode');
 sync(s);
 const key=activeFile==='preview'?'preview':
   Object.entries(actualPaths(s)).find(([,v])=>v===activeFile)?.[0]||'index.html';
 choose(s,key);s.preview='index.html';s.renderPreviewOptions();s.renderPreview();
}
function hide(s){
 if(!shell||!active)return;
 clearTimeout(timer);
 shell.hidden=true;active=false;panel.classList.remove('kp-program-mode');
 if(preview&&previewParent){if(previewSibling&&previewSibling.parentNode===previewParent)previewParent.insertBefore(preview,previewSibling);else previewParent.appendChild(preview);}
 if(document.getElementById('ks-frame'))s.renderPreview();
}
var studio=window.StudioIA;
// Mantener el comportamiento tipo Liveweave: CSS y JS se aplican aunque el
// alumno todavía no haya escrito <link> o <script src> en su HTML.
const baseBuildForCoding=studio.buildPreview;
studio.buildPreview=function(path){
 let doc=baseBuildForCoding.apply(this,arguments);
 if(path!=='index.html'||!this.files||typeof this.files['index.html']!=='string')return doc;
 const original=String(this.files['index.html']),assets=actualPaths(this);
 const linkedCss=/<link\b[^>]*href=["'][^"']+\.css(?:[?#][^"']*)?["']/i.test(original);
 const linkedJs=/<script\b[^>]*src=["'][^"']+\.js(?:[?#][^"']*)?["'][^>]*>/i.test(original);
 if(!linkedCss&&assets['style.css']&&typeof this.files[assets['style.css']]==='string'){
   const code=String(this.files[assets['style.css']]).replace(/<\/style/gi,'<\\/style');
   const style='<style data-file="'+assets['style.css']+'">'+code+'</style>';
   doc=/<\/head>/i.test(doc)?doc.replace(/<\/head>/i,style+'</head>'):style+doc;
 }
 if(!linkedJs&&assets['script.js']&&typeof this.files[assets['script.js']]==='string'){
   const code=String(this.files[assets['script.js']]).replace(/<\/script/gi,'<\\/script');
   const js='<script data-file="'+assets['script.js']+'">'+code+'</script>';
   doc=/<\/body>/i.test(doc)?doc.replace(/<\/body>/i,js+'</body>'):doc+js;
 }
 return doc;
};
// En todas las creaciones (tambien 3D), mostrar codigo y juego a la vez.
// La escritura ya activa el guardado de Studio y la vista previa con debounce.
if(!studio.__liveCodeInstalled){
 const fallbackToggle=studio.toggleCode;
 const fallbackPlay=studio.playCurrent;
 studio.playCurrent=function(){
   const host=document.getElementById('krueka-studio');
   if(!host?.classList.contains('ks-live-edit-mode'))return fallbackPlay.apply(this,arguments);
   host.classList.remove('ks-play-only');
   this.renderPreview(true);
   host.querySelector('#ks-frame')?.focus();
 };
 studio.toggleCode=function(){
   const host=document.getElementById('krueka-studio');
   const view=host?.querySelector('.ks-preview');
   const code=host?.querySelector('#ks-code');
   const frame=host?.querySelector('#ks-frame');
   const button=host?.querySelector('#ks-code-btn');
   if(!host||!view||!code||!frame||!button)return fallbackToggle.apply(this,arguments);
   const on=!host.classList.contains('ks-live-edit-mode');
   const needsPreview=frame.classList.contains('off');
   host.classList.toggle('ks-live-edit-mode',on);
   view.classList.toggle('ks-live-code',on);
   code.classList.toggle('on',on);
   frame.classList.remove('off');
   button.textContent=on?'Ocultar código':'Código';
   button.setAttribute('aria-pressed',String(on));
   if(on){
     this.renderFileList();
     this.renderEditor();
     if(needsPreview)this.renderPreview();
   }
 };
 studio.__liveCodeInstalled=true;
}
if(!studio.__programacionInstalled){
 const originalShow=studio.showTab,originalRefresh=studio.refreshAll,originalKit=studio.createKit,originalSwitch=studio.switchProject,originalLock=studio.lock,originalSubmit=studio.submit;
 studio.showTab=function(name){
  if(name!=='programacion')hide(this);
  const result=originalShow.apply(this,arguments);
  if(name==='programacion')show(this);
  return result;
 };
 studio.refreshAll=function(){const result=originalRefresh.apply(this,arguments);if(active)sync(this);return result;};
 studio.lock=function(){const result=originalLock.apply(this,arguments);if(active)sync(this);return result;};
 studio.createKit=async function(id){
  const before=this.projectId;
  await originalKit.apply(this,arguments);
  if((id==='arcade-web'||Object.hasOwn(templates,id))&&this.projectId!==before&&isWeb(this))this.showTab('programacion');
 };
 studio.switchProject=async function(id){
  await originalSwitch.apply(this,arguments);
  if(this.projectId===id&&starterFor(this)!=='arcade-web')this.showTab('programacion');
 };
 studio.submit=async function(){
  const restore=active;
  const submitted=await originalSubmit.apply(this,arguments);
  if(restore&&panel?.isConnected&&this.cloudReady){
   this.showTab('programacion');
   const message=String(this.history[this.history.length-1]?.text||'');
   if(message.startsWith('Proyecto enviado al profe'))state('✓ Proyecto enviado al profe. Está pendiente de revisión.');
   else if(message.startsWith('No se pudo enviar'))state(message);
   else state('Revisá el estado del proyecto en Mis proyectos.');
  }
  return submitted;
 };
 studio.__programacionInstalled=true;
}
window.StudioProgramacion={kit,isWeb,mount,sync,choose,insertBlock,starterFor};
})();
