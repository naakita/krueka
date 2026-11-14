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
var paths=['index.html','style.css','script.js'],panel=null,view=null,timer=null;
function isWeb(s){return paths.every(n=>typeof s.files[n]==='string')&&!s.files['game-config.js']}
function mount(s){
 var p=document.getElementById('krueka-studio');if(!p||p===panel&&view&&view.isConnected)return;
 panel=p;var tabs=p.querySelector('.ks-tabs'),b=document.createElement('button');b.className='ks-btn';b.dataset.tab='programacion';b.textContent='⌘ Programación';b.onclick=()=>s.showTab('programacion');tabs.appendChild(b);
 view=document.createElement('section');view.id='ks-programacion';view.className='ks-tool kp-coding';view.hidden=true;
 var fields=paths.map(n=>'<label class="kp-code-pane"><span>'+n+'</span><textarea spellcheck="false" data-code="'+n+'" aria-label="Editar '+n+'"></textarea></label>').join('');
 view.innerHTML='<div class="kp-coding-top"><strong>⌘ Programación de videojuegos</strong><div class="kp-coding-actions"><button id="kp-code-play" class="ks-btn primary">▶ Probar</button><button id="kp-code-save" class="ks-btn">Guardar</button><a href="programacion-juegos.html" target="_blank" rel="noopener noreferrer" class="ks-btn kp-gallery-link">Galería ↗</a></div></div><div id="kp-not-web" class="kp-not-web" hidden><h3>Creá un juego web nuevo</h3><p>Este proyecto utiliza otro motor. No vamos a modificarlo.</p><button class="ks-btn primary" id="kp-new-web">＋ Crear juego web</button></div><div class="kp-code-grid" id="kp-code-grid">'+fields+'</div><div class="kp-code-foot"><span id="kp-code-state">Guardá tus cambios.</span><small>Se publica únicamente después de que el profe lo apruebe.</small></div>';
 p.querySelector('.ks-work').appendChild(view);
 view.querySelector('#kp-new-web').onclick=()=>s.createKit('arcade-web');
 view.querySelector('#kp-code-play').onclick=()=>{s.preview='index.html';if(p.querySelector('#ks-code').classList.contains('on'))s.toggleCode();s.playCurrent()};
 view.querySelector('#kp-code-save').onclick=()=>s.save();
 view.querySelectorAll('[data-code]').forEach(e=>{
  e.addEventListener('focus',()=>{if(s.cloudReady&&!s.busy)s.checkpoint()});
  e.addEventListener('keydown',ev=>{if(ev.key==='Tab'){ev.preventDefault();e.setRangeText('  ',e.selectionStart,e.selectionEnd,'end');e.dispatchEvent(new Event('input',{bubbles:true}))}});
  e.addEventListener('input',()=>{
   var n=e.dataset.code;if(s.busy||!s.cloudReady){e.value=s.files[n]||'';return}
   try{s.validFiles(Object.assign({},s.files,{[n]:e.value}))}catch(err){e.value=s.files[n]||'';view.querySelector('#kp-code-state').textContent=err.message;return}
   s.files[n]=e.value;s.changed();view.querySelector('#kp-code-state').textContent='Cambios pendientes…';
   clearTimeout(timer);timer=setTimeout(()=>{if(!view.hidden){s.preview='index.html';s.renderPreviewOptions();s.renderPreview()}},650);
  })
 });
}
function sync(s){
 if(!view||!view.isConnected)return;var ok=isWeb(s);
 view.querySelector('#kp-not-web').hidden=ok;view.querySelector('#kp-code-grid').hidden=!ok;
 view.querySelectorAll('[data-code]').forEach(e=>{if(document.activeElement!==e)e.value=s.files[e.dataset.code]||'';e.readOnly=s.busy||!s.cloudReady});
 view.querySelector('#kp-code-state').textContent=ok?'HTML: estructura · CSS: diseño · JS: movimiento y reglas':'Primero creá un juego web.';
}
var studio=window.StudioIA;
if(!studio.__programacionInstalled){
 var originalShow=studio.showTab,originalRefresh=studio.refreshAll,originalKit=studio.createKit,originalLock=studio.lock;
 studio.showTab=function(name){var result=originalShow.apply(this,arguments);mount(this);view.hidden=name!=='programacion';panel.classList.toggle('kp-program-mode',name==='programacion');if(name==='programacion'){if(panel.querySelector('#ks-code').classList.contains('on'))this.toggleCode();this.preview='index.html';this.renderPreviewOptions();this.renderPreview();sync(this)}return result};
 studio.refreshAll=function(){var result=originalRefresh.apply(this,arguments);if(view&&!view.hidden)sync(this);return result};
 studio.lock=function(){var result=originalLock.apply(this,arguments);if(view&&!view.hidden)view.querySelectorAll('[data-code]').forEach(e=>e.readOnly=this.busy||!this.cloudReady);return result};
 studio.createKit=async function(id){var before=this.projectId;await originalKit.apply(this,arguments);if(id==='arcade-web'&&this.projectId!==before&&isWeb(this))this.showTab('programacion')};
 studio.__programacionInstalled=true;
}
window.StudioProgramacion={kit,isWeb,mount,sync};
})();