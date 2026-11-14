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
StudioKits.create=function(id){return id==='arcade-web'?Object.assign({},sample):originalCreate(id)};
if(window.StudioCreative&&Array.isArray(StudioCreative.paths))StudioCreative.paths.unshift({id:'programacion',icon:'⌘',title:'Programación web',tag:'HTML · CSS · JS',color:'mint',text:'Creá videojuegos escribiendo código y probalos en vivo.',first:'arcade-web',kits:['arcade-web','web']});
var paths=['index.html','style.css','script.js'],panel=null,shell=null,editor=null,preview=null,previewParent=null,previewSibling=null,timer=null,activeFile='index.html',active=false;
function isWeb(s){return paths.every(n=>typeof s.files[n]==='string')&&!s.files['game-config.js'];}
function state(text){const el=shell?.querySelector('#kp-program-state');if(el)el.textContent=text;}
function mount(s){
 const p=document.getElementById('krueka-studio');if(!p)return;
 if(panel===p&&shell?.isConnected)return;
 panel=p;active=false;activeFile='index.html';
 preview=p.querySelector('.ks-preview');previewParent=preview?.parentNode||null;previewSibling=preview?.nextSibling||null;
 const tab=document.createElement('button');tab.type='button';tab.className='ks-btn';tab.dataset.tab='programacion';tab.textContent='⌘ Programación';tab.onclick=()=>s.showTab('programacion');p.querySelector('.ks-tabs').appendChild(tab);
 shell=document.createElement('section');shell.id='kp-program-shell';shell.className='kp-program-shell';shell.hidden=true;shell.setAttribute('aria-label','Espacio de programación web');
 shell.innerHTML=
 '<header class="kp-program-header">'+
  '<div class="kp-program-brand"><span class="kp-program-mark">⌘</span><div><b>Krueka Code</b><small id="kp-program-title">Mi videojuego</small></div></div>'+
  '<nav class="kp-program-tabs" aria-label="Elegí qué editar">'+
   '<button type="button" data-kp-file="index.html">HTML</button>'+
   '<button type="button" data-kp-file="style.css">CSS</button>'+
   '<button type="button" data-kp-file="script.js">JavaScript</button>'+
   '<button type="button" data-kp-file="preview">◉ Vista previa</button>'+
  '</nav>'+
  '<div class="kp-program-actions">'+
   '<button type="button" id="kp-program-save" class="kp-program-btn">Guardar</button>'+
   '<button type="button" id="kp-program-submit" class="kp-program-btn kp-program-primary">Enviar al profe</button>'+
   '<details class="kp-program-menu"><summary>Proyecto ▾</summary><div class="kp-program-dropdown">'+
    '<button type="button" id="kp-program-new">＋ Nuevo juego</button>'+
    '<button type="button" id="kp-program-list">Mis proyectos</button>'+
    '<button type="button" id="kp-program-rename">Cambiar nombre</button>'+
    '<button type="button" id="kp-program-export">Descargar</button>'+
    '<a href="programacion-juegos.html" target="_blank" rel="noopener noreferrer">Galería de juegos ↗</a>'+
   '</div></details>'+
   '<button type="button" id="kp-program-back" class="kp-program-back">Volver</button>'+
  '</div>'+
 '</header>'+
 '<main class="kp-program-body">'+
  '<section class="kp-program-code" aria-label="Editor de código">'+
   '<div class="kp-program-pane-head"><strong id="kp-program-filename">index.html</strong><span>Escribí tu código</span></div>'+
   '<div id="kp-program-create" class="kp-program-create" hidden><h2>Elegí un juego web</h2><p>Este proyecto utiliza otro tipo de editor. No vamos a modificarlo.</p><button type="button" id="kp-program-start">Crear juego con HTML, CSS y JavaScript</button></div>'+
   '<textarea id="kp-program-editor" spellcheck="false" aria-label="Editor de código del archivo elegido"></textarea>'+
  '</section>'+
  '<section class="kp-program-preview" aria-label="Vista previa del videojuego">'+
   '<div class="kp-program-pane-head"><strong>Vista previa</strong><button type="button" id="kp-program-run">▶ Ejecutar</button></div>'+
   '<div id="kp-program-preview-slot"></div>'+
  '</section>'+
 '</main>'+
 '<footer class="kp-program-footer"><span id="kp-program-state" role="status">Tu código se guarda en Krueka.</span><span>HTML: estructura · CSS: diseño · JavaScript: comportamiento</span></footer>';
 p.appendChild(shell);
 editor=shell.querySelector('#kp-program-editor');
 shell.querySelectorAll('[data-kp-file]').forEach(b=>b.onclick=()=>choose(s,b.dataset.kpFile));
 editor.addEventListener('focus',()=>{if(s.cloudReady&&!s.busy)s.checkpoint();});
 editor.addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();editor.setRangeText('  ',editor.selectionStart,editor.selectionEnd,'end');editor.dispatchEvent(new Event('input',{bubbles:true}));}});
 editor.addEventListener('input',()=>{
   if(!s.cloudReady||s.busy||!isWeb(s)||!paths.includes(activeFile)){editor.value=s.files[activeFile]||'';return;}
   try{s.validFiles({...s.files,[activeFile]:editor.value});}
   catch(err){editor.value=s.files[activeFile]||'';state('Límite del proyecto: '+err.message);return;}
   s.files[activeFile]=editor.value;s.changed();state('Cambios pendientes de guardar…');
   clearTimeout(timer);timer=setTimeout(()=>{if(active&&isWeb(s)){s.preview='index.html';s.renderPreviewOptions();s.renderPreview();}},700);
 });
 shell.querySelector('#kp-program-save').onclick=async()=>{if(s.busy||!s.cloudReady)return;state('Guardando…');const ok=await s.save();state(ok?'✓ Proyecto guardado en Krueka':'No se pudo guardar. Revisá la conexión e intentá de nuevo.');};
 shell.querySelector('#kp-program-submit').onclick=async()=>{if(s.busy||!s.cloudReady)return;state('Enviando a revisión…');await s.submit();};
 shell.querySelector('#kp-program-run').onclick=()=>{if(!isWeb(s)){state('Primero elegí un proyecto web.');return;}s.preview='index.html';s.renderPreviewOptions();s.renderPreview();const iframe=shell.querySelector('#ks-frame');if(iframe)iframe.focus();state('Vista previa actualizada.');};
 shell.querySelector('#kp-program-back').onclick=()=>s.showTab('home');
 shell.querySelector('#kp-program-new').onclick=()=>{shell.querySelector('.kp-program-menu').open=false;s.createKit('arcade-web');};
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
 activeFile=name;
 const onlyPreview=name==='preview';
 shell.classList.toggle('kp-preview-only',onlyPreview);
 shell.querySelectorAll('[data-kp-file]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.kpFile===name)));
 const filename=shell.querySelector('#kp-program-filename');if(filename)filename.textContent=onlyPreview?'':name;
 if(!onlyPreview){editor.value=s.files[name]||'';editor.focus();}
 if(onlyPreview&&active)s.renderPreview();
}
function sync(s){
 if(!shell?.isConnected)return;
 const ok=isWeb(s);
 shell.querySelector('#kp-program-title').textContent=String(s.title||'Mi videojuego').slice(0,80);
 shell.querySelector('#kp-program-create').hidden=ok;
 editor.hidden=!ok;
 editor.readOnly=s.busy||!s.cloudReady;
 if(ok&&activeFile!=='preview'&&document.activeElement!==editor)editor.value=s.files[activeFile]||'';
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
 sync(s);choose(s,activeFile);s.preview='index.html';s.renderPreviewOptions();s.renderPreview();
}
function hide(s){
 if(!shell||!active)return;
 clearTimeout(timer);
 shell.hidden=true;active=false;panel.classList.remove('kp-program-mode');
 if(preview&&previewParent){if(previewSibling&&previewSibling.parentNode===previewParent)previewParent.insertBefore(preview,previewSibling);else previewParent.appendChild(preview);}
 if(document.getElementById('ks-frame'))s.renderPreview();
}
var studio=window.StudioIA;
if(!studio.__programacionInstalled){
 const originalShow=studio.showTab,originalRefresh=studio.refreshAll,originalKit=studio.createKit,originalLock=studio.lock,originalSubmit=studio.submit;
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
  if(id==='arcade-web'&&this.projectId!==before&&isWeb(this))this.showTab('programacion');
 };
 studio.submit=async function(){
  const restore=active;
  await originalSubmit.apply(this,arguments);
  if(restore&&panel?.isConnected&&this.cloudReady){
   this.showTab('programacion');
   const message=String(this.history[this.history.length-1]?.text||'');
   if(message.startsWith('Proyecto enviado al profe'))state('✓ Proyecto enviado al profe. Está pendiente de revisión.');
   else if(message.startsWith('No se pudo enviar'))state(message);
   else state('Revisá el estado del proyecto en Mis proyectos.');
  }
 };
 studio.__programacionInstalled=true;
}
window.StudioProgramacion={kit,isWeb,mount,sync,choose};
})();