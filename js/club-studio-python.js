/* Club Krueka: programacion Python 3 dentro del navegador. */
(function(){
'use strict';
if(window.StudioPython||!window.StudioIA||!window.StudioKits||!window.StudioProgramacion)return;
const PYFILE='codigo-python.txt',MARKER='lenguaje.txt';
const sample=[
'import random','','# Cambia la velocidad y los colores del juego','velocidad = 8','x, y = 300, 175','estrella_x, estrella_y = 100, 100','puntos = 0','',
'def actualizar(teclas, dt):','    global x, y, estrella_x, estrella_y, puntos',
'    paso = velocidad * dt * 20',
'    if teclas.get("ArrowLeft") or teclas.get("a"): x -= paso',
'    if teclas.get("ArrowRight") or teclas.get("d"): x += paso',
'    if teclas.get("ArrowUp") or teclas.get("w"): y -= paso',
'    if teclas.get("ArrowDown") or teclas.get("s"): y += paso',
'    x = max(8, min(604, x))','    y = max(8, min(324, y))',
'    if abs(x-estrella_x) < 25 and abs(y-estrella_y) < 25:',
'        puntos += 1','        estrella_x = random.randint(20, 600)',
'        estrella_y = random.randint(20, 320)','',
'def dibujar():','    fondo("#102b50")',
'    circulo(estrella_x+12, estrella_y+12, 12, "#ffdd64")',
'    rectangulo(x, y, 28, 28, "#5af0b5")',
'    texto("Puntos: " + str(puntos), 18, 30, "#ffffff", 21)'
].join('\n');
// This function is serialized into project script.js. It never reads sessions or contacts Krueka.
function playerRoot(){
 'use strict';
 const CODE=__KRUEKA_PYTHON_SOURCE__;
 const engine='https://cdn.jsdelivr.net/pyodide/v314.0.8/full/';
 const canvas=document.getElementById('py-arena'),ctx=canvas.getContext('2d');
 const status=document.getElementById('py-status'),output=document.getElementById('py-output');
 let worker=null,working=false,pending=false,last=0,timer=null,loopId=0;
 const keys={};
 function message(t){status.textContent=String(t).slice(0,600);}
 function stop(){working=false;pending=false;clearTimeout(timer);cancelAnimationFrame(loopId);if(worker){worker.terminate();worker=null;}}
 function render(commands){
  if(!Array.isArray(commands))return;
  for(const c of commands.slice(0,260)){
   if(!Array.isArray(c))continue;
   const type=c[0],color=String(c[type==='text'?4:c.length-1]||'');
   if(type==='bg'){ctx.fillStyle=/^#[a-f0-9]{3,8}$/i.test(String(c[1]))?c[1]:'#102b50';ctx.fillRect(0,0,640,360);}
   if(type==='rect'){ctx.fillStyle=/^#[a-f0-9]{3,8}$/i.test(color)?color:'#fff';ctx.fillRect(...c.slice(1,5).map(n=>Number(n)||0));}
   if(type==='circle'){ctx.fillStyle=/^#[a-f0-9]{3,8}$/i.test(color)?color:'#fff';ctx.beginPath();ctx.arc(Number(c[1])||0,Number(c[2])||0,Math.max(0,Number(c[3])||0),0,Math.PI*2);ctx.fill();}
   if(type==='text'){ctx.fillStyle=/^#[a-f0-9]{3,8}$/i.test(color)?color:'#fff';ctx.font='bold '+Math.max(9,Math.min(44,Number(c[5])||18))+'px system-ui';ctx.fillText(String(c[1]).slice(0,100),Number(c[2])||0,Number(c[3])||0);}
  }
 }
 function isolatedWorker(){
  let python=null,ready=false;
  const url='https://cdn.jsdelivr.net/pyodide/v314.0.8/full/';
  function error(e){self.postMessage({type:'error',message:String(e&&e.message||e).slice(0,900)});}
  const helpers=[
   'import json',
   '_krueka_commands=[]',
   'def fondo(color): _krueka_commands.append(["bg",str(color)])',
   'def rectangulo(x,y,w,h,color): _krueka_commands.append(["rect",float(x),float(y),float(w),float(h),str(color)])',
   'def circulo(x,y,r,color): _krueka_commands.append(["circle",float(x),float(y),float(r),str(color)])',
   'def texto(s,x,y,color="#fff",tamano=18): _krueka_commands.append(["text",str(s),float(x),float(y),str(color),float(tamano)])'
  ].join('\n');
  self.onmessage=async function(ev){
   const m=ev.data||{};
   try{
    if(m.type==='start'){
     self.postMessage({type:'loading'});
     importScripts(url+'pyodide.js');
     python=await loadPyodide({indexURL:url});
     self.postMessage({type:'engine-ready'});
     python.setStdout({batched:function(s){self.postMessage({type:'print',message:String(s).slice(0,200)});}});
     python.runPython(helpers);
     python.runPython(String(m.code||'').slice(0,30000));
     if(!python.globals.has('actualizar')||!python.globals.has('dibujar'))throw Error('El juego necesita actualizar(teclas, dt) y dibujar().');
     ready=true;self.postMessage({type:'ready'});
    }else if(m.type==='tick'&&ready){
     python.globals.set('_teclas_json',JSON.stringify(m.keys||{}));
     python.globals.set('_paso',Math.min(.08,Math.max(.01,Number(m.dt)||.05)));
     python.runPython('_krueka_commands.clear()\nactualizar(json.loads(_teclas_json),_paso)\ndibujar()');
     const p=python.globals.get('_krueka_commands'),commands=p.toJs();
     p.destroy();self.postMessage({type:'frame',commands});
    }
   }catch(e){ready=false;error(e);}
  };
 }
 function begin(){
  stop();output.textContent='';message('Preparando el juego Python…');
  if(typeof Worker==='undefined'){message('Usá un navegador actualizado para ejecutar Python.');return;}
  const source='('+isolatedWorker.toString()+')();';
  const blob=new Blob([source],{type:'text/javascript'}),url=URL.createObjectURL(blob);
  try{worker=new Worker(url);}catch(e){URL.revokeObjectURL(url);message('No se pudo iniciar Python: '+e.message);return;}
  setTimeout(()=>URL.revokeObjectURL(url),1500);
  worker.onmessage=function(event){
   const m=event.data||{};
   if(m.type==='loading')message('Descargando Python… La primera carga puede tardar.');
   if(m.type==='engine-ready'){clearTimeout(timer);message('Python preparado. Verificando el programa…');timer=setTimeout(()=>{if(!working){message('El programa no responde. Revisá tus bucles y reiniciá.');stop();}},5000);}
   if(m.type==='ready'){clearTimeout(timer);working=true;pending=false;last=performance.now();message('¡Juego con Python funcionando! Usá las flechas o WASD.');loopId=requestAnimationFrame(tick);}
   if(m.type==='print')output.textContent=(output.textContent+'\n'+String(m.message)).trim().slice(-1400);
   if(m.type==='frame'){clearTimeout(timer);pending=false;render(m.commands);}
   if(m.type==='error'){message('Error de Python: '+m.message);stop();}
  };
  worker.onerror=function(){message('No se pudo cargar Python. Revisá internet e intentá de nuevo.');stop();};
  worker.postMessage({type:'start',code:CODE});
 }
 function tick(time){
  if(!working||!worker)return;
  if(time-last>=50&&!pending){
   const dt=Math.min(.08,Math.max(.01,(time-last)/1000));last=time;pending=true;
   worker.postMessage({type:'tick',dt,keys:Object.assign({},keys)});
   timer=setTimeout(()=>{if(pending){message('El programa no responde. Revisá sus bucles y ejecutá nuevamente.');stop();}},2500);
  }
  loopId=requestAnimationFrame(tick);
 }
 window.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key))e.preventDefault();keys[e.key]=true;});
 window.addEventListener('keyup',e=>{keys[e.key]=false;});
 window.addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
 document.querySelectorAll('[data-py-move]').forEach(b=>{
  const k=b.dataset.pyMove;
  b.addEventListener('pointerdown',e=>{e.preventDefault();keys[k]=true;});
  ['pointerup','pointerleave','pointercancel'].forEach(evt=>b.addEventListener(evt,()=>{keys[k]=false;}));
 });
 document.getElementById('py-restart').onclick=begin;
 window.addEventListener('pagehide',stop);
 begin();
}
function bootstrap(pycode){
 return '('+playerRoot.toString().replace('__KRUEKA_PYTHON_SOURCE__',JSON.stringify(String(pycode||'').slice(0,30000)).replace(/</g,'\\u003c'))+')();';
}
function starter(){
 return {
  'index.html':'<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="krueka-python-runtime" content="pyodide"><title>Mi primer videojuego Python</title><link rel="stylesheet" href="style.css"></head><body><main><h1>🐍 Atrapa estrellas · Python</h1><p>Escribí tu código y probá el juego. Mové el personaje con flechas o WASD.</p><canvas id="py-arena" width="640" height="360" tabindex="0"></canvas><div class="controls"><button data-py-move="ArrowLeft">◀</button><button data-py-move="ArrowUp">▲</button><button data-py-move="ArrowDown">▼</button><button data-py-move="ArrowRight">▶</button><button id="py-restart">↻ Reiniciar</button></div><p id="py-status" role="status">Preparando Python…</p><pre id="py-output"></pre></main><script src="script.js"></script></body></html>',
  'style.css':'*{box-sizing:border-box}body{margin:0;background:#0c1934;color:#eaf8ff;font:15px/1.5 system-ui;text-align:center}main{max-width:760px;margin:15px auto;padding:10px}h1{font-size:24px;color:#ffdd79}canvas{display:block;width:100%;height:auto;background:#102b50;border:3px solid #6ce5f8;border-radius:12px}button{margin:5px;padding:10px;min-width:42px;background:#1b78aa;border:0;border-radius:9px;color:white;font-weight:800;cursor:pointer;touch-action:none}#py-status{min-height:28px;color:#bde7f7}#py-output{text-align:left;white-space:pre-wrap;font-size:11px;max-height:100px;overflow:auto}',
  'codigo-python.txt':sample,
  'script.js':bootstrap(sample),
  'lenguaje.txt':'python-pyodide-v1',
  'LEEME.md':'# Python en Club Krueka\nEditá tu código desde la pestaña Python. El ejemplo usa actualizar(teclas, dt) y dibujar() con fondo, rectangulo, circulo y texto. Se ejecuta con Pyodide desde internet, sin instalar programas. Para conservarlo, guardá y enviá al docente.'
 };
}
const kit={id:'arcade-python',icon:'🐍',title:'Videojuego con Python',tag:'Python 3 en el navegador',description:'Programá personajes y movimientos con Python real sin instalar software.',challenge:'Cambiá la velocidad, los colores y las reglas para crear otro juego.'};
StudioKits.catalog.unshift(kit);
const create=StudioKits.create.bind(StudioKits);
StudioKits.create=function(id){return id===kit.id?starter():create(id);};
const basePreview=StudioIA.buildPreview;
StudioIA.buildPreview=function(path){
 const html=basePreview.apply(this,arguments);
 if(path!=='index.html'||this.files?.[MARKER]!=='python-pyodide-v1')return html;
 return html.replace("script-src 'unsafe-inline';","script-src 'unsafe-inline' 'wasm-unsafe-eval' https://cdn.jsdelivr.net;")
  .replace("connect-src 'none';","connect-src https://cdn.jsdelivr.net; worker-src blob:;");
};
const baseShow=StudioIA.showTab,baseRefresh=StudioIA.refreshAll,baseLock=StudioIA.lock,baseCreateKit=StudioIA.createKit;
let shell=null,area=null,tab=null,currentTab='python',running=false,previewTimer=null;
function isPython(s){return s?.files?.[MARKER]==='python-pyodide-v1'&&typeof s.files[PYFILE]==='string';}
function info(s){return shell?.querySelector('#kp-program-state');}
function statePython(t){const el=info();if(el)el.textContent=t;}
function wirePythonInGeneralEditor(s){
 const el=document.getElementById('ks-editor');
 if(!el||el.dataset.pythonLiveWired==='yes')return;
 el.dataset.pythonLiveWired='yes';
 el.addEventListener('input',()=>{
   if(!isPython(s)||s.current!==PYFILE||!s.cloudReady||s.busy)return;
   const code=el.value;
   const files={...s.files,[PYFILE]:code,'script.js':bootstrap(code)};
   try{s.validFiles(files);}catch(err){
     const state=document.getElementById('ks-save');
     if(state)state.textContent='Límite de código: '+err.message;
     return;
   }
   s.files=files;s.changed();
   clearTimeout(s.previewTimer);
   s.previewTimer=setTimeout(()=>{
     if(isPython(s)&&s.cloudReady&&!s.busy&&document.getElementById('ks-frame')){
       s.preview='index.html';s.renderPreviewOptions();s.renderPreview();
     }
   },1800);
 });
}
function showPython(s){
 currentTab='python';
 shell.classList.remove('kp-preview-only');area.hidden=false;shell.querySelector('#kp-program-editor').hidden=true;
 shell.querySelector('#kp-program-filename').textContent='Python · codigo-python.txt';
 tab.setAttribute('aria-pressed','true');
 shell.querySelectorAll('[data-kp-file]').forEach(b=>b.setAttribute('aria-pressed','false'));
 area.focus();
}
function chooseLanguage(s){
 const d=s.dialog('Crear videojuego con código','<p>Elegí un lenguaje. Tus proyectos anteriores permanecerán guardados.</p><div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:16px"><button id="kp-language-js" type="button" class="ks-btn primary">🟨 JavaScript · HTML y CSS</button><button id="kp-language-py" type="button" class="ks-btn primary">🐍 Python · Videojuego 2D</button></div>');
 d.querySelector('#kp-language-js').onclick=()=>s.createKit('arcade-web');
 d.querySelector('#kp-language-py').onclick=()=>s.createKit('arcade-python');
}
function integrate(s){
 const p=document.getElementById('kp-program-shell');if(!p)return;
 if(shell!==p){
  shell=p;const nav=p.querySelector('.kp-program-tabs');
  tab=document.createElement('button');tab.type='button';tab.id='kp-program-python-tab';tab.textContent='🐍 Python';tab.hidden=true;
  nav.insertBefore(tab,nav.querySelector('[data-kp-file="preview"]'));
  area=document.createElement('textarea');area.id='kp-python-editor';area.hidden=true;area.spellcheck=false;area.setAttribute('aria-label','Escribí aquí el código Python');
  p.querySelector('.kp-program-code').appendChild(area);
  tab.onclick=()=>showPython(s);
  area.addEventListener('focus',()=>{if(s.cloudReady&&!s.busy)s.checkpoint();});
  area.addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();area.setRangeText('    ',area.selectionStart,area.selectionEnd,'end');area.dispatchEvent(new Event('input',{bubbles:true}));}});
  area.addEventListener('input',()=>{
   if(!isPython(s)||!s.cloudReady||s.busy){area.value=s.files[PYFILE]||'';return;}
   const code=area.value,next={...s.files,[PYFILE]:code,'script.js':bootstrap(code)};
   try{s.validFiles(next);}catch(e){const el=info(s);if(el)el.textContent='Archivo demasiado grande: '+e.message;return;}
   s.files=next;s.changed();
   const el=info(s);if(el)el.textContent='Código Python modificado · Guardado automático pendiente';
   statePython('Código modificado · la vista previa se actualizará cuando termines de escribir.');
   clearTimeout(previewTimer);
   previewTimer=setTimeout(()=>{
     if(running&&isPython(s)&&s.cloudReady&&!s.busy){
       s.preview='index.html';s.renderPreviewOptions();s.renderPreview();
       statePython('✓ Vista previa de Python actualizada.');
     }
   },1800);
   const run=shell.querySelector('#kp-program-run');if(run)run.title='Ejecutar ahora el código Python modificado';
  });
  nav.querySelector('[data-kp-file="preview"]').addEventListener('click',()=>{currentTab='preview';tab.setAttribute('aria-pressed','false');});
  p.querySelector('#kp-program-new').onclick=()=>{p.querySelector('.kp-program-menu').open=false;chooseLanguage(s);};
  p.querySelector('#kp-program-start').onclick=()=>chooseLanguage(s);
 }
 const python=isPython(s);
 tab.hidden=!python;area.hidden=!python;
 p.querySelectorAll('[data-kp-file="index.html"],[data-kp-file="style.css"],[data-kp-file="script.js"]').forEach(b=>b.hidden=python);
 if(python){
  p.querySelector('#kp-program-editor').hidden=true;
  if(document.activeElement!==area)area.value=s.files[PYFILE];
  area.readOnly=s.busy||!s.cloudReady;
  if(currentTab==='preview'){p.classList.add('kp-preview-only');tab.setAttribute('aria-pressed','false');}
  else showPython(s);
  p.querySelector('.kp-program-footer span:last-child').textContent='Python 3 · actualizar · dibujar · rectangulo · circulo';
 }else{
  p.querySelector('#kp-program-editor').hidden=false;
  p.querySelector('.kp-program-footer span:last-child').textContent='HTML: estructura · CSS: diseño · JavaScript: comportamiento';
 }
}
StudioIA.showTab=function(name){
 if(name!=='programacion'){running=false;clearTimeout(previewTimer);}
 const r=baseShow.apply(this,arguments);
 if(name==='programacion'){running=true;currentTab=isPython(this)?'python':'index.html';integrate(this);}
 return r;
};
StudioIA.refreshAll=function(){const r=baseRefresh.apply(this,arguments);wirePythonInGeneralEditor(this);if(running)integrate(this);return r;};
StudioIA.lock=function(){const r=baseLock.apply(this,arguments);if(running)integrate(this);return r;};
StudioIA.createKit=async function(id){await baseCreateKit.apply(this,arguments);if(id==='arcade-python'&&isPython(this))this.showTab('programacion');};
window.StudioPython={starter,kit,isPython,bootstrap};
})();