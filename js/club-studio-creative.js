/* Un solo recorrido de creación: talleres, editor visual, prueba, bitácora y entrega privada. */
(function(){
'use strict';
if(window.StudioCreative)return;
const paths=[
 {id:'games',icon:'◈',title:'Videojuegos 3D',tag:'CONSTRUÍ UN MUNDO',color:'blue',text:'Diseñá el escenario, ubicá objetos y probá tu propia misión.',first:'explore3d',kits:['explore3d','space3d','cinematic3d','hero-manager']},
 {id:'animation',icon:'✦',title:'Animación',tag:'DALE VIDA A TU HISTORIA',color:'mint',text:'Creá personajes, guardá poses y descubrí cómo se mueve una historia.',first:'animation',kits:['animation','cinematic3d']},
 {id:'video',icon:'▶',title:'Edición de video',tag:'CONVERTITE EN EDITOR',color:'violet',text:'Ordená escenas, recortá clips, agregá títulos y descargá tu montaje.',first:'video-edit',kits:['video-edit']},
 {id:'more',icon:'+',title:'Juegos 2D y más',tag:'SEGUÍ EXPLORANDO',color:'gold',text:'Carreras, plataformas, personajes y tu propio sitio creativo.',first:'platform',kits:['stars','race','platform','neon-rift','quiz','web']}
];
let mounted=null,home=null;
function kind(studio){return StudioKits.read(studio.files)?.kind;}
function isMedia(studio){return ['animation','video-edit'].includes(kind(studio));}
function homeMarkup(studio){
 return '<div class="kc-welcome"><span class="ks-section-label">TU ESTUDIO CREATIVO</span><h2>Hoy podés crear algo increíble.</h2><p>Elegí tu taller. Creá, probá y guardá una versión propia.</p><span class="kc-free">✓ Creá desde tu navegador</span></div>'+
 '<div class="kc-paths">'+paths.map(p=>'<article class="kc-path kc-'+p.color+'"><div class="kc-path-top"><span class="kc-icon" aria-hidden="true">'+p.icon+'</span><small>'+p.tag+'</small></div><h3>'+p.title+'</h3><p>'+p.text+'</p><div class="kc-path-actions"><button class="ks-btn primary" data-creative-start="'+p.first+'">Empezar →</button>'+(p.kits.length>1?'<button class="ks-btn" data-creative-path="'+p.id+'">Ver opciones</button>':'')+'</div></article>').join('')+'</div>'+
 '<section class="kc-continue"><small>YA TENÉS UN PROYECTO</small><strong>'+esc(studio.title)+'</strong><p>Podés continuarlo o elegir otro taller para crear un proyecto nuevo.</p><button id="kc-resume" class="ks-btn">Continuar mi creación →</button></section>';
}
function renderHome(studio){if(!home?.isConnected)return;home.innerHTML=homeMarkup(studio);home.querySelectorAll('[data-creative-start]').forEach(b=>b.onclick=()=>studio.createKit(b.dataset.creativeStart));home.querySelectorAll('[data-creative-path]').forEach(b=>b.onclick=()=>showOptions(studio,b.dataset.creativePath));home.querySelector('#kc-resume').onclick=()=>studio.showTab('create');}
function showOptions(studio,path){
 const selected=paths.find(p=>p.id===path),ids=selected?selected.kits:StudioKits.catalog.map(k=>k.id),kits=ids.map(id=>StudioKits.catalog.find(k=>k.id===id)).filter(Boolean);
 const dialog=studio.dialog(selected?selected.title:'Elegí tu próxima creación','<p>Cada opción crea un proyecto propio. Tus trabajos anteriores siguen en Mis proyectos.</p><div class="ks-kit-grid">'+kits.map(k=>'<button class="ks-kit" data-creative-kit="'+k.id+'"><span>'+StudioKits.art(k.id)+'</span><b>'+esc(k.title)+'</b><small>'+esc(k.description)+'</small></button>').join('')+'</div>');
 dialog.querySelectorAll('[data-creative-kit]').forEach(b=>b.onclick=()=>studio.createKit(b.dataset.creativeKit));
}
function decorateEditor(studio){
 const el=document.getElementById('ks-create');if(!el||el.querySelector('.kc-editor-guide'))return;
 const guide=document.createElement('div');guide.className='kc-editor-guide';guide.innerHTML='<span>1 · Creá</span><b>2 · Personalizá</b><button class="ks-btn" id="kc-test">3 · Probá</button><button class="ks-btn" id="kc-lesson">Guía de la clase</button>';
 el.insertBefore(guide,el.firstChild);guide.querySelector('#kc-test').onclick=()=>studio.playCurrent();guide.querySelector('#kc-lesson').onclick=()=>studio.showTab('learn');
 const log=document.createElement('section');log.className='ks-settings kc-log';log.innerHTML='<h3>Mi bitácora</h3><p>¿Qué cambiaste y cómo mejoró tu creación? Escribí dos o tres oraciones.</p><label for="kc-reflection">Mi decisión y mi prueba</label><textarea id="kc-reflection" maxlength="800" rows="4"></textarea><button id="kc-save-reflection" class="ks-btn">Guardar mi explicación</button><p class="ks-tip">Cuando termines, usá Guardar y Enviar al profe. Tu entrega es privada.</p>';
 const saved=String(studio.files['mi-proceso.txt']||'').slice(0,800);log.querySelector('textarea').value=saved;
 const apply=()=>{if(studio.busy||!studio.cloudReady)return;const value=log.querySelector('textarea').value.slice(0,800);if(value===String(studio.files['mi-proceso.txt']||''))return;try{const next=studio.validFiles({...studio.files,'mi-proceso.txt':value});studio.checkpoint();studio.files=next;studio.changed();}catch(e){studio.say('sys',e.message);}};
 log.querySelector('textarea').onchange=apply;log.querySelector('button').onclick=async()=>{apply();await studio.save();};el.appendChild(log);
}
function sync(studio){
 if(!mounted?.isConnected)return;
 const media=isMedia(studio),label=mounted.querySelector('.ks-preview-label');if(label)label.textContent=media?'Tu creación':'Tu juego';
 const enlarge=mounted.querySelector('#ks-play-space');if(enlarge)enlarge.textContent=mounted.classList.contains('ks-play-only')?'Volver al taller':media?'Ampliar creación':'Ampliar juego';
 if(media){
  const status=mounted.querySelector('#ks-ai-status'),select=mounted.querySelector('#ks-help-mode'),send=mounted.querySelector('#ks-send'),tip=mounted.querySelector('#ks-compose-tip');
  if(status)status.textContent='Guía de herramientas, sin IA generativa. Las fotos y los videos no se envían al chat de IA.';
  if(select){select.value='local';select.disabled=true;}
  if(send&&!studio.busy)send.textContent='Consultar guía →';
  if(tip)tip.textContent='Preguntá por poses, recortes, transiciones o exportación.';
  const prompt=mounted.querySelector('#ks-prompt');if(prompt)prompt.placeholder=kind(studio)==='animation'?'¿Cómo agrego una pose o cambio el movimiento?':'¿Cómo recorto un video o agrego una transición?';
  const today=mounted.querySelector('#ks-class-today');if(today)today.onclick=()=>studio.showTab('learn');
 }
 const modes=mounted.querySelector('.ks-modes');if(modes)modes.classList.toggle('kc-media-hidden',media);
 const reflection=mounted.querySelector('#kc-reflection');if(reflection)reflection.readOnly=studio.busy||!studio.cloudReady;
}
function mount(studio){
 const panel=document.getElementById('krueka-studio');if(!panel)return;
 if(mounted!==panel){
  mounted=panel;
  const tabs=panel.querySelector('.ks-tabs'),button=document.createElement('button');button.className='ks-btn';button.dataset.tab='home';button.textContent='◈ Talleres';button.setAttribute('aria-pressed','false');button.onclick=()=>studio.showTab('home');tabs.insertBefore(button,tabs.firstChild);
  const work=panel.querySelector('.ks-work');home=document.createElement('section');home.id='ks-creative-home';home.className='ks-tool kc-home';home.hidden=true;work.insertBefore(home,work.firstChild);
  const edit=tabs.querySelector('[data-tab="create"]');if(edit)edit.textContent='Mi creación';const learn=tabs.querySelector('[data-tab="learn"]');if(learn)learn.textContent='Mi clase';
  const create=panel.querySelector('#ks-new');if(create){create.textContent='＋ Crear';create.onclick=()=>studio.showTab('home');}
  panel.querySelector('.ks-brand').textContent='✦ Krueka Creativo';
 }
 sync(studio);
}
function guidance(type,input){
 const words=String(input).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 if(/export|descarg|formato|guardar.*video/.test(words))return 'En Mi creación, bajá hasta «Tu creación sale de Krueka» y pulsá Exportar video. Mantené la pestaña visible hasta terminar. Si usás videos, primero elegí los originales. Guardar conserva el proyecto editable; Exportar descarga el video final.';
 if(type==='animation'){
  if(/giro|rot|taman|escala/.test(words))return 'En Mi creación, elegí el personaje y una pose. Cambiá Giro o Tamaño y pulsá Guardar pose. Compará dos poses en distintos segundos usando la línea de tiempo de la vista previa.';
  return 'En Mi creación, elegí un personaje. En Poses, pulsá Nueva pose, elegí el segundo y cambiá X e Y. Guardá la pose y pulsá Reproducir en la vista previa. Movimiento suave interpola las poses; Por saltos cambia de una pose a otra. La guía explica controles: no genera código ni modifica tu historia.';
 }
 if(/recort|cort|duracion|tiempo/.test(words))return 'En Mi creación, elegí el clip. «Comenzar en el segundo» indica desde dónde se usa el original; Duración indica cuántos segundos entran al montaje. Pulsá Aplicar edición y reproducí esa parte para comprobar el recorte.';
 if(/transicion|fundido/.test(words))return 'Elegí una escena en la línea de tiempo. En Transición compará Corte directo y Fundido a negro. Pulsá Aplicar edición y reproducí el cambio entre esa escena y la siguiente.';
 return 'En Mi creación podés agregar escenas de texto, fotos o videos. Elegí una escena para cambiar título, subtítulo y duración. Las flechas Antes y Después cambian el orden. Las fotos y el montaje se guardan; al cambiar de PC tenés que volver a elegir los videos originales. La guía explica controles: no es IA generativa.';
}
function install(){
 const studio=window.StudioIA;if(!studio||studio.__creativeInstalled)return;
 const open=studio.open,tab=studio.showTab,creator=studio.renderCreator,status=studio.renderAIStatus,lock=studio.lock,start=studio.createKit,adopt=studio.adopt,send=studio.send;
 studio.showTab=function(name){
  mount(this);
  const result=tab.call(this,name==='home'?'create':name);
  if(home){home.hidden=name!=='home';if(name==='home')document.getElementById('ks-create').hidden=true;}
  this.tab=name;mounted?.classList.toggle('kc-home-active',name==='home');mounted?.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tab===name)));
  if(name==='home')renderHome(this);sync(this);return result;
 };
 studio.renderCreator=function(){const result=creator.apply(this,arguments);decorateEditor(this);return result;};
 studio.renderAIStatus=function(){const result=status.apply(this,arguments);mount(this);return result;};
 studio.lock=function(){const result=lock.apply(this,arguments);sync(this);return result;};
 studio.open=async function(){await open.apply(this,arguments);if(this.cloudReady&&document.getElementById('krueka-studio'))this.showTab('home');};
 studio.adopt=function(){const result=adopt.apply(this,arguments);renderHome(this);return result;};
 studio.createKit=async function(id){const previous=this.projectId;await start.apply(this,arguments);if(this.projectId!==previous&&StudioKits.read(this.files)?.kind===id){this.showTab('create');document.getElementById('ks-create')?.scrollTo(0,0);}};
 studio.send=async function(){
  if(!isMedia(this))return send.apply(this,arguments);
  if(this.busy||!this.cloudReady)return;const q=document.getElementById('ks-prompt'),value=q?.value.trim();if(!value)return;
  this.busy=true;this.lock(true);
  try{this.say('user',value);this.say('sys','Guía de herramientas · sin IA generativa\n'+guidance(kind(this),value));this.draft='';q.value='';this.changed();await this.save();}
  finally{this.busy=false;this.lock(false);}
 };
 studio.__creativeInstalled=true;
}
window.StudioCreative={paths,install,mount,showOptions,guidance};install();
})();
