/* Club Krueka · programación visual: acciones declarativas, sin ejecutar código del alumno en el editor. */
(function(){
'use strict';
if(window.StudioBloques||!window.StudioIA||!window.StudioKits||!window.StudioCreative)return;

const kit={id:'visual-blocks',icon:'🧩',title:'Mi videojuego por bloques',tag:'Scratch · lógica visual',description:'Arrastrá instrucciones, animá tu personaje y jugá sin instalar programas.',challenge:'Probá una condición, repetí una acción y creá tu propia función.'};
const lanes=[
 {id:'inicio',name:'Al comenzar',icon:'🚩',help:'Se ejecuta al pulsar Jugar.'},
 {id:'flechas',name:'Al tocar una flecha',icon:'🎮',help:'Se ejecuta cada vez que usás los controles.'},
 {id:'estrella',name:'Al recoger una estrella',icon:'⭐',help:'Se ejecuta cuando el personaje toca la estrella.'},
 {id:'segundo',name:'Cada segundo',icon:'⏱️',help:'Se ejecuta una vez por segundo mientras jugás.'},
 {id:'funcion',name:'Mi función',icon:'🧠',help:'Estas instrucciones se ejecutan cuando usás el bloque «Llamar mi función».'}
];
const palette=[
 {type:'mover',name:'Mover pasos',group:'Movimiento',color:'motion',label:'Pasos',value:38,min:1,max:180},
 {type:'girar',name:'Girar grados',group:'Movimiento',color:'motion',label:'Grados',value:45,min:-360,max:360},
 {type:'centro',name:'Volver al centro',group:'Movimiento',color:'motion'},
 {type:'decir',name:'Decir algo',group:'Apariencia',color:'looks',label:'Mensaje',value:'¡Hola, Club Krueka!',text:true},
 {type:'disfraz',name:'Cambiar personaje',group:'Apariencia',color:'looks',label:'Personaje',value:'🦊',options:['🐱','🦊','🐸','🤖','🐉','🚀','🐰']},
 {type:'fondo',name:'Cambiar fondo',group:'Apariencia',color:'looks',label:'Color',value:'#24395f',options:['#24395f','#215348','#5d325e','#754121','#111827']},
 {type:'sumar',name:'Sumar puntos',group:'Variables',color:'data',label:'Puntos',value:1,min:-10,max:20},
 {type:'velocidad',name:'Velocidad de movimiento',group:'Variables',color:'data',label:'Velocidad',value:38,min:5,max:180},
 {type:'repetir',name:'Repetir el siguiente bloque',group:'Control',color:'control',label:'Veces',value:3,min:1,max:12},
 {type:'si_puntos',name:'Si puntos ≥, ejecutar el siguiente',group:'Control',color:'control',label:'Puntos mínimos',value:3,min:0,max:100},
 {type:'llamar',name:'Llamar mi función',group:'Funciones',color:'functions'},
 {type:'animar',name:'Animar personaje',group:'Animación',color:'animation',label:'Intensidad',value:6,min:1,max:12}
];
const byType=Object.fromEntries(palette.map(p=>[p.type,p]));
const groups=[...new Set(palette.map(p=>p.group))];
const safe=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(n,min,max,fallback)=>{const v=Number(n);return Number.isFinite(v)?Math.min(max,Math.max(min,v)):fallback;};
function blank(){return {version:1,title:'Mi juego de estrellas',avatar:'🐱',goal:5,events:{inicio:[],flechas:[],estrella:[],segundo:[],funcion:[]}};}
function clean(raw){
 const result=blank(),source=raw&&typeof raw==='object'?raw:{};
 result.title=String(source.title||result.title).slice(0,80);
 result.avatar=['🐱','🦊','🐸','🤖','🐉','🚀','🐰'].includes(source.avatar)?source.avatar:'🐱';
 result.goal=clamp(source.goal,1,30,5);
 for(const lane of lanes){
  const list=Array.isArray(source.events?.[lane.id])?source.events[lane.id].slice(0,35):[];
  result.events[lane.id]=list.map((item,i)=>{
   const p=byType[item?.type];if(!p)return null;
   let value=p.value;
   if(p.options)value=p.options.includes(item.value)?item.value:p.value;
   else if(p.text)value=String(item.value??p.value).slice(0,70);
   else if(p.label)value=clamp(item.value,p.min,p.max,p.value);
   return {id:/^[a-z0-9-]{1,35}$/i.test(String(item.id))?item.id:'paso-'+i,type:p.type,...(p.label?{value}:{})};
  }).filter(Boolean);
 }
 return result;
}
function starter(){const data=blank();data.events.inicio=[{id:'inicio-1',type:'decir',value:'¡A buscar estrellas!'}];data.events.flechas=[{id:'flechas-1',type:'mover',value:38}];data.events.estrella=[{id:'estrella-1',type:'sumar',value:1},{id:'estrella-2',type:'animar',value:6}];return data;}
const html='<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mi videojuego por bloques</title><link rel="stylesheet" href="style.css"></head><body><main><header><div><small>CLUB KRUEKA · MI PRIMER VIDEOJUEGO</small><h1>Mi juego de estrellas</h1><p id="mensaje" role="status">¡Usá las flechas para jugar!</p></div><div class="hud"><strong id="puntos">0 puntos</strong><span id="meta">Meta: 5</span><button id="reiniciar" type="button">↻ Reiniciar</button></div></header><canvas id="juego" width="960" height="540" tabindex="0" aria-label="Juego de mover un personaje y recoger estrellas"></canvas><nav id="controles" aria-label="Controles del videojuego"><button type="button" data-key="ArrowLeft" aria-label="Izquierda">◀</button><button type="button" data-key="ArrowUp" aria-label="Arriba">▲</button><button type="button" data-key="ArrowDown" aria-label="Abajo">▼</button><button type="button" data-key="ArrowRight" aria-label="Derecha">▶</button></nav><p class="ayuda">Creado con programación visual en Club Krueka. Probá tus propias instrucciones.</p></main><script src="script.js"></script></body></html>';
const css='*{box-sizing:border-box}body{margin:0;background:#101b2d;color:#f0f7ff;font-family:system-ui,sans-serif}main{max-width:1040px;margin:auto;padding:clamp(10px,3vw,26px)}header{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:15px}header small{font-size:11px;letter-spacing:.14em;color:#a9d4f5}h1{font-size:clamp(22px,4vw,40px);margin:4px 0}header p{margin:6px 0 18px;color:#d3e5f7}.hud{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:15px}.hud strong,.hud span{padding:9px 13px;background:#ffffff15;border-radius:9px}.hud button,#controles button{border:1px solid #ffffff32;background:#246c9e;color:white;border-radius:12px;padding:10px 16px;min-height:44px;font:inherit;font-weight:700;cursor:pointer;touch-action:manipulation}canvas{display:block;width:100%;height:auto;border:2px solid #ffffff45;border-radius:18px;box-shadow:0 18px 42px #0005;background:#24395f}#controles{display:flex;justify-content:center;gap:10px;margin:15px 0}#controles button{min-width:54px}.ayuda{text-align:center;color:#a8bbd0;font-size:12px}@media(max-width:540px){.hud{gap:5px}.hud strong,.hud span{padding:6px 9px}#controles{gap:5px}#controles button{min-width:45px}}';
function gameSource(raw){
 const data=clean(raw);
 // La única parte variable es JSON validado. El motor no ejecuta texto del alumno como código.
 return '/* Creado con los bloques de Club Krueka. Editá bloques.json desde el taller. */\nconst PROGRAMA='+JSON.stringify(data).replace(/</g,'\\u003c').replace(/>/g,'\\u003e')+';\n('+gameRuntime.toString()+')();\n';
}
function gameRuntime(){
 'use strict';
 const canvas=document.getElementById('juego'),ctx=canvas.getContext('2d');
 const points=document.getElementById('puntos'),goal=document.getElementById('meta'),message=document.getElementById('mensaje');
 const player={x:460,y:260,angle:0,avatar:PROGRAMA.avatar,size:62,flash:0};
 const star={x:160,y:140};const state={score:0,speed:38,background:'#24395f',finished:false,frames:0};
 goal.textContent='Meta: '+PROGRAMA.goal;
 function positionStar(){star.x=65+Math.random()*830;star.y=65+Math.random()*410;}
 function say(text){message.textContent=String(text||'').slice(0,70);}
 function updateScore(){points.textContent=state.score+' punto'+(state.score===1?'':'s');if(state.score>=PROGRAMA.goal&&!state.finished){state.finished=true;say('🏆 ¡Misión cumplida! ¡Creaste tu propio juego!');}}
 function execute(list,key,depth,budget){
  if(depth>5||!Array.isArray(list)||budget.count>=180)return;
  for(let i=0;i<list.length&&budget.count<180;i++){
   const b=list[i];if(!b||!b.type)continue;budget.count++;
   const val=b.value;
   if(b.type==='repetir'||b.type==='si_puntos'){
    const next=list[++i];if(!next)continue;
    const count=b.type==='repetir'?Math.min(12,Math.max(1,Number(val)||1)):(state.score>=Number(val)?1:0);
    for(let j=0;j<count&&budget.count<180;j++)execute([next],key,depth+1,budget);
    continue;
   }
   if(b.type==='llamar'){execute(PROGRAMA.events.funcion,key,depth+1,budget);continue;}
   if(b.type==='mover'){
    const direction={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[key];
    const step=(Number(val)||38)*state.speed/38;
    player.x+=(direction?direction[0]:Math.cos(player.angle))*step;
    player.y+=(direction?direction[1]:Math.sin(player.angle))*step;
   }
   if(b.type==='girar')player.angle+=Number(val)*Math.PI/180;
   if(b.type==='centro'){player.x=460;player.y=260;}
   if(b.type==='decir')say(val);
   if(b.type==='disfraz')player.avatar=val;
   if(b.type==='fondo')state.background=val;
   if(b.type==='sumar'){state.score=Math.max(0,state.score+(Number(val)||0));updateScore();}
   if(b.type==='velocidad')state.speed=Number(val)||38;
   if(b.type==='animar')player.flash=Math.max(player.flash,Number(val)*9);
  }
  player.x=Math.max(36,Math.min(924,player.x));player.y=Math.max(36,Math.min(504,player.y));
 }
 function trigger(type,key){if(!state.finished)execute(PROGRAMA.events[type],key,0,{count:0});}
 function checkStar(){if(Math.hypot(player.x-star.x,player.y-star.y)<65){positionStar();trigger('estrella');}}
 function control(key){if(state.finished)return;trigger('flechas',key);checkStar();draw();}
 function reset(){state.score=0;state.speed=38;state.background='#24395f';state.finished=false;player.x=460;player.y=260;player.angle=0;player.avatar=PROGRAMA.avatar;player.flash=0;positionStar();say('¡Usá las flechas para jugar!');updateScore();trigger('inicio');draw();}
 function draw(){
  ctx.fillStyle=state.background;ctx.fillRect(0,0,960,540);
  ctx.fillStyle='#ffffff17';for(let i=0;i<35;i++){ctx.beginPath();ctx.arc((i*233)%960,(i*127)%540,2+i%3,0,2*Math.PI);ctx.fill();}
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='58px system-ui';ctx.shadowColor='#ffed8a';ctx.shadowBlur=24;ctx.fillText('⭐',star.x,star.y);ctx.shadowBlur=0;
  const size=player.size+(player.flash>0?Math.sin(state.frames*.55)*player.flash*.45:Math.sin(state.frames*.06)*3);
  ctx.save();ctx.translate(player.x,player.y);ctx.rotate(player.angle);ctx.font=Math.max(42,size)+'px system-ui';ctx.shadowBlur=18;ctx.shadowColor='#8fe7ff';ctx.fillText(player.avatar,0,0);ctx.restore();
  if(player.flash>0)player.flash=Math.max(0,player.flash-1);state.frames++;
  if(state.finished){ctx.fillStyle='#071629bf';ctx.fillRect(0,0,960,540);ctx.fillStyle='#fff';ctx.font='bold 50px system-ui';ctx.fillText('🏆 ¡GANASTE!',480,255);}
 }
 let last=0;function frame(time){if(time-last>32){last=time;draw();}requestAnimationFrame(frame);}
 document.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();control(e.key);}});
 document.querySelectorAll('[data-key]').forEach(button=>button.addEventListener('click',()=>control(button.dataset.key)));
 document.getElementById('reiniciar').addEventListener('click',reset);
 setInterval(()=>{if(!state.finished){trigger('segundo');checkStar();}},1000);
 reset();requestAnimationFrame(frame);
}
function filesFor(data){const value=clean(data);return {'index.html':html.replace('<h1>Mi juego de estrellas</h1>','<h1>'+safe(value.title)+'</h1>'),'style.css':css,'script.js':gameSource(value),'bloques.json':JSON.stringify(value,null,2),'LEEME.md':'# Mi videojuego por bloques\n\nEntrá en «Bloques visuales» para cambiar movimientos, apariencias, controles y funciones. Probá, guardá y enviá al profe.\n\nNo incluyas datos personales.'};}

StudioKits.catalog.unshift(kit);
const create=StudioKits.create.bind(StudioKits);
StudioKits.create=function(id){return id===kit.id?filesFor(starter()):create(id);};
const art=StudioKits.art.bind(StudioKits);
StudioKits.art=function(id){return id===kit.id?'<svg viewBox="0 0 190 65" role="img" aria-label="Programación visual" xmlns="http://www.w3.org/2000/svg"><rect x="9" y="8" width="100" height="22" rx="7" fill="#2e70af"/><rect x="24" y="31" width="120" height="22" rx="7" fill="#9b7621"/><rect x="45" y="54" width="104" height="9" rx="4" fill="#8753a7"/><circle cx="145" cy="20" r="11" fill="#80cfbd"/></svg>':art(id);};
StudioCreative.paths.unshift({id:'bloques',icon:'🧩',title:'Programación por bloques',tag:'VIDEOJUEGOS PARA EMPEZAR',color:'mint',text:'Como en Scratch: armá instrucciones, funciones y animaciones. Después jugá tu creación.',first:kit.id,kits:[kit.id]});
if(window.ClubKrueka?.categories){const games=window.ClubKrueka.categories.find(c=>c.id==='juegos');if(games&&!games.kits.includes(kit.id))games.kits.unshift(kit.id);}

let host=null,view=null,preview=null,oldParent=null,oldSibling=null,active=false,lane='inicio',group='Movimiento',data=null,job=null,seq=0;
const isBlocks=s=>typeof s.files?.['bloques.json']==='string';
function current(s){try{return clean(JSON.parse(s.files['bloques.json']));}catch(_e){return starter();}}
function status(t){const el=view?.querySelector('#kb-status');if(el)el.textContent=t;}
function mount(s){
 const panel=document.getElementById('krueka-studio');if(!panel)return;
 if(host===panel&&view?.isConnected)return;
 host=panel;active=false;data=null;lane='inicio';group='Movimiento';
 preview=panel.querySelector('.ks-preview');oldParent=preview?.parentNode||null;oldSibling=preview?.nextSibling||null;
 const tab=document.createElement('button');tab.type='button';tab.className='ks-btn';tab.dataset.tab='bloques';tab.textContent='🧩 Bloques visuales';tab.onclick=()=>s.showTab('bloques');panel.querySelector('.ks-tabs').prepend(tab);
 view=document.createElement('section');view.className='kb-shell';view.id='kb-shell';view.hidden=true;view.setAttribute('aria-label','Editor de programación por bloques');
 view.innerHTML='<header class="kb-top"><div><small>CLUB KRUEKA · TALLER DE VIDEOJUEGOS</small><h2>🧩 Programación visual</h2><p>Elegí bloques, combiná instrucciones y probá lo que creaste.</p></div><label class="kb-project-title">Nombre de tu juego<input id="kb-title" maxlength="80"></label><div class="kb-actions"><button type="button" id="kb-projects">Mis proyectos</button><button type="button" id="kb-new">Nuevo juego</button><button type="button" id="kb-save">Guardar</button><button type="button" id="kb-submit" class="kb-primary">Enviar al profe</button><button type="button" id="kb-back">← Talleres</button></div></header>'+
 '<div class="kb-body"><aside class="kb-palette"><h3>1. Elegí instrucciones</h3><nav id="kb-groups" aria-label="Categorías de bloques"></nav><p>Arrastrá un bloque al programa o pulsalo para agregarlo.</p><div id="kb-items"></div></aside><section class="kb-workspace"><div class="kb-work-head"><div><h3>2. Construí tu programa</h3><p id="kb-lane-help"></p></div><label>Meta de puntos <input id="kb-goal" type="number" min="1" max="30" value="5"></label></div><div class="kb-lanes" id="kb-lanes" role="tablist" aria-label="Eventos del juego"></div><div id="kb-steps" class="kb-steps" aria-live="polite"></div><p class="kb-hint">💡 «Repetir» y «Si puntos…» afectan al bloque que pongas inmediatamente después. «Mi función» se activa con «Llamar mi función».</p></section><section class="kb-stage"><div class="kb-stage-head"><div><h3>3. Jugá y probá</h3><p>Cada cambio se refleja en tu juego.</p></div><button id="kb-run" type="button">▶ Probar</button></div><div id="kb-preview"></div><p id="kb-status" role="status">Los cambios se guardan en tu proyecto del Club.</p></section></div>';
 panel.append(view);
 view.querySelector('#kb-back').onclick=()=>s.showTab('home');
 view.querySelector('#kb-projects').onclick=()=>s.showProjects();
 view.querySelector('#kb-run').onclick=()=>refreshPreview(s);
 view.querySelector('#kb-new').onclick=()=>{if(confirm('¿Crear otro videojuego por bloques? Guardaremos el actual antes de empezar.'))s.createKit(kit.id);};
 view.querySelector('#kb-save').onclick=async()=>{if(s.busy||!s.cloudReady)return;status('Guardando…');const ok=await s.save();status(ok?'✓ Juego guardado en Krueka.':'No se pudo guardar. Revisá la conexión.');};
 view.querySelector('#kb-submit').onclick=async()=>{if(s.busy||!s.cloudReady)return;status('Enviando al profe…');await s.submit();};
 view.querySelector('#kb-title').onchange=e=>{if(!editable(s))return;const title=e.target.value.trim().slice(0,80);if(!title){e.target.value=s.title;return;}data.title=title;s.title=title;const hidden=host.querySelector('#ks-title');if(hidden)hidden.value=title;commit(s);};
 view.querySelector('#kb-goal').onchange=e=>{if(!editable(s))return;e.target.value=String(clamp(e.target.value,1,30,data.goal));data.goal=Number(e.target.value);commit(s);};
}
function editable(s){return !!data&&s.cloudReady&&!s.busy&&isBlocks(s);}
function commit(s){
 if(!editable(s))return;
 try{const next=filesFor(data);s.validFiles({...s.files,...next});s.checkpoint();s.files={...s.files,...next};s.changed();status('Cambios pendientes de guardar…');}
 catch(e){status('No se pudo aplicar el cambio: '+e.message);return;}
 clearTimeout(job);job=setTimeout(()=>{if(active)refreshPreview(s);},380);
}
function renderPalette(s){
 const nav=view.querySelector('#kb-groups'),items=view.querySelector('#kb-items');
 nav.innerHTML=groups.map(g=>'<button type="button" data-group="'+safe(g)+'" aria-pressed="'+(g===group)+'">'+safe(g)+'</button>').join('');
 nav.querySelectorAll('button').forEach(b=>b.onclick=()=>{group=b.dataset.group;renderPalette(s);});
 items.replaceChildren();
 for(const p of palette.filter(p=>p.group===group)){
  const button=document.createElement('button');button.type='button';button.draggable=true;button.className='kb-block kb-'+p.color;button.textContent=p.name;
  button.onclick=()=>add(s,p.type);button.ondragstart=e=>{e.dataTransfer.setData('application/x-krueka-visual',p.type);e.dataTransfer.effectAllowed='copy';};items.append(button);
 }
}
function renderSteps(s){
 const tabs=view.querySelector('#kb-lanes');
 tabs.innerHTML=lanes.map(e=>'<button type="button" role="tab" data-lane="'+e.id+'" aria-selected="'+(lane===e.id)+'">'+e.icon+' '+e.name+'</button>').join('');
 tabs.querySelectorAll('button').forEach(b=>b.onclick=()=>{lane=b.dataset.lane;renderSteps(s);});
 const details=lanes.find(e=>e.id===lane);view.querySelector('#kb-lane-help').textContent=details.help;
 view.querySelector('#kb-goal').value=String(data.goal);
 view.querySelector('#kb-title').value=String(s.title||data.title).slice(0,80);
 const target=view.querySelector('#kb-steps');target.replaceChildren();
 data.events[lane].forEach((step,index)=>{
  const p=byType[step.type];if(!p)return;
  const row=document.createElement('article');row.className='kb-step kb-'+p.color;row.draggable=true;
  row.dataset.index=String(index);
  row.innerHTML='<div class="kb-step-main"><span class="kb-number">'+(index+1)+'</span><strong>'+safe(p.name)+'</strong></div><div class="kb-step-edit"></div><div class="kb-step-actions"><button type="button" data-move="-1" aria-label="Subir bloque">↑</button><button type="button" data-move="1" aria-label="Bajar bloque">↓</button><button type="button" data-remove aria-label="Quitar bloque">×</button></div>';
  if(p.label){
   const wrap=row.querySelector('.kb-step-edit'),label=document.createElement('label');label.textContent=p.label+' ';
   const input=p.options?document.createElement('select'):document.createElement('input');
   if(p.options){for(const value of p.options)input.add(new Option(value,value));}
   else{input.type=p.text?'text':'number';if(!p.text){input.min=p.min;input.max=p.max;input.step='1';}else input.maxLength=70;}
   input.value=step.value;input.setAttribute('aria-label',p.label+' del bloque '+(index+1));
   input.onchange=()=>{if(!editable(s))return;const old=data.events[lane][index];if(!old)return;let value=input.value;if(p.text)value=value.slice(0,70);else if(p.options)value=p.options.includes(value)?value:p.value;else value=clamp(value,p.min,p.max,old.value);old.value=value;input.value=value;commit(s);};
   label.append(input);wrap.append(label);
  }
  row.querySelector('[data-remove]').onclick=()=>{if(!editable(s))return;data.events[lane].splice(index,1);commit(s);renderSteps(s);};
  row.querySelectorAll('[data-move]').forEach(b=>b.onclick=()=>{if(!editable(s))return;const dest=index+Number(b.dataset.move),list=data.events[lane];if(dest<0||dest>=list.length)return;[list[index],list[dest]]=[list[dest],list[index]];commit(s);renderSteps(s);});
  row.ondragstart=e=>{e.dataTransfer.setData('application/x-krueka-row',String(index));e.dataTransfer.effectAllowed='move';};
  row.ondragover=e=>{if(e.dataTransfer.types.includes('application/x-krueka-row')||e.dataTransfer.types.includes('application/x-krueka-visual'))e.preventDefault();};
  row.ondrop=e=>{
   if(!editable(s))return;const type=e.dataTransfer.getData('application/x-krueka-visual'),source=e.dataTransfer.getData('application/x-krueka-row');
   if(type&&byType[type]){e.preventDefault();add(s,type,index);return;}
   if(source!==''){e.preventDefault();const from=Number(source),list=data.events[lane];if(!Number.isInteger(from)||from<0||from>=list.length)return;const [item]=list.splice(from,1);list.splice(index,0,item);commit(s);renderSteps(s);}
  };
  target.append(row);
 });
 const slot=document.createElement('div');slot.className='kb-drop';slot.textContent=data.events[lane].length?'＋ Soltá otro bloque aquí':'Soltá tus primeros bloques aquí o elegí uno a la izquierda';
 slot.ondragover=e=>{if(e.dataTransfer.types.includes('application/x-krueka-visual'))e.preventDefault();};
 slot.ondrop=e=>{const type=e.dataTransfer.getData('application/x-krueka-visual');if(type&&byType[type]){e.preventDefault();add(s,type);}};target.append(slot);
}
function add(s,type,at){
 if(!editable(s)||!byType[type])return;
 const list=data.events[lane];if(list.length>=35){status('Podés usar hasta 35 bloques por evento.');return;}
 const p=byType[type],item={id:'bloque-'+Date.now().toString(36)+'-'+(++seq),type};if(p.label)item.value=p.value;
 list.splice(at==null?list.length:at,0,item);commit(s);renderSteps(s);
}
function refreshPreview(s){if(!active||!isBlocks(s))return;s.preview='index.html';s.renderPreviewOptions();s.renderPreview();status('✓ Vista previa actualizada. Probá las flechas.');}
function sync(s){if(!view?.isConnected)return;view.querySelector('#kb-save').disabled=s.busy||!s.cloudReady;view.querySelector('#kb-submit').disabled=s.busy||!s.cloudReady;view.querySelector('#kb-goal').disabled=s.busy||!s.cloudReady;}
function show(s){
 mount(s);if(!view?.isConnected)return;view.hidden=false;active=true;host.classList.add('kb-mode');
 if(preview)view.querySelector('#kb-preview').append(preview);
 data=current(s);lane='inicio';renderPalette(s);renderSteps(s);sync(s);
 if(isBlocks(s))refreshPreview(s);else status('Creá un videojuego por bloques para empezar.');
}
function hide(s){
 if(!active)return;clearTimeout(job);active=false;view.hidden=true;host.classList.remove('kb-mode');
 if(preview&&oldParent){if(oldSibling&&oldSibling.parentNode===oldParent)oldParent.insertBefore(preview,oldSibling);else oldParent.append(preview);}
 if(document.getElementById('ks-frame'))s.renderPreview();
}
const studio=window.StudioIA,priorShow=studio.showTab,priorKit=studio.createKit,priorSwitch=studio.switchProject,priorRefresh=studio.refreshAll,priorLock=studio.lock,priorSubmit=studio.submit;
studio.showTab=function(name){if(name!=='bloques')hide(this);const result=priorShow.apply(this,arguments);if(name==='bloques')show(this);return result;};
studio.createKit=async function(id){const before=this.projectId;await priorKit.apply(this,arguments);if(id===kit.id&&this.projectId!==before&&isBlocks(this))this.showTab('bloques');};
studio.switchProject=async function(id){await priorSwitch.apply(this,arguments);if(this.projectId===id&&isBlocks(this))this.showTab('bloques');};
studio.refreshAll=function(){const result=priorRefresh.apply(this,arguments);if(active&&isBlocks(this)){data=current(this);renderSteps(this);sync(this);}return result;};
studio.lock=function(){const result=priorLock.apply(this,arguments);if(active)sync(this);return result;};
studio.submit=async function(){const wasActive=active,submitted=await priorSubmit.apply(this,arguments);if(wasActive&&this.cloudReady){this.showTab('bloques');status('Revisá la confirmación del envío en tu proyecto.');}return submitted;};
window.StudioBloques={kit,clean,starter,filesFor,gameSource,isBlocks};
})();
