/* Krueka Game Studio · editor visual de mundos RPG para navegador. */
(function(){
'use strict';
if(window.KruekaGameBuilder)return;
const TYPES={
 house:{label:'Casa',cat:'build',icon:'⌂',cost:120},tower:{label:'Torre',cat:'build',icon:'▥',cost:180},tree:{label:'Árbol',cat:'nature',icon:'♣',cost:25},
 rock:{label:'Roca',cat:'nature',icon:'◆',cost:15},road:{label:'Camino',cat:'roads',icon:'═',cost:10},portal:{label:'Portal',cat:'mission',icon:'◉',cost:250},
 enemy:{label:'Enemigo',cat:'actors',icon:'♟',cost:0},chest:{label:'Cofre',cat:'mission',icon:'▣',cost:80},hero:{label:'Héroe',cat:'actors',icon:'♜',cost:0}
};
const CATS={all:'Todo',build:'Construcciones',nature:'Naturaleza',roads:'Caminos',actors:'Personajes',mission:'Misión'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
function normalise(raw){
 const cfg=window.StudioHeroes?.clean?StudioHeroes.clean(raw):raw||{};
 const w=cfg.world||{};
 const map=Array.isArray(w.map)?w.map.slice(0,90).map((o,i)=>({
  id:/^[\w-]{1,32}$/.test(String(o.id))?String(o.id):'obj-'+i,type:TYPES[o.type]?o.type:'tree',
  x:clamp(o.x,0,11),y:clamp(o.y,0,7),rot:[0,90,180,270].includes(Number(o.rot))?Number(o.rot):0,
  scale:clamp(o.scale||1,.6,1.8),name:String(o.name||TYPES[o.type]?.label||'Objeto').slice(0,32)
 })):[];
 if(!map.length)map.push(
  {id:'hero-start',type:'hero',x:2,y:4,rot:0,scale:1,name:'Inicio del héroe'},
  {id:'house-1',type:'house',x:5,y:3,rot:0,scale:1,name:'Casa central'},
  {id:'tree-1',type:'tree',x:7,y:2,rot:0,scale:1,name:'Árbol'},
  {id:'portal-1',type:'portal',x:9,y:4,rot:0,scale:1,name:'Portal de misión'}
 );
 return {...cfg,world:{biome:w.biome||'forest',weather:w.weather||'clear',time:w.time||'day',mission:String(w.mission||'Llegá al portal y completá la misión.').slice(0,150),story:String(w.story||'').slice(0,300),inventory:Array.isArray(w.inventory)?w.inventory.slice(0,8):['Poción'],map}};
}
const protagonistImages=new Map();
function avatarImage(hero,canvas,cfg,selected,play){
 const src=String(hero?.portrait||'');
 if(!/^data:image\/webp;base64,[a-zA-Z0-9+/=]{1,40000}$/.test(src)||typeof Image==='undefined')return null;
 if(protagonistImages.has(src))return protagonistImages.get(src);
 if(protagonistImages.size>10)protagonistImages.clear();
 const image=new Image();protagonistImages.set(src,image);
 image.onload=()=>{if(canvas.isConnected)draw(canvas,cfg,selected,play);};
 image.onerror=()=>{protagonistImages.delete(src);};
 image.src=src;
 return image;
}
function draw(canvas,cfg,selected,play){
 const ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height,w=cfg.world,cell=58,ox=W/2,oy=88;
 ctx.clearRect(0,0,W,H);
 const sky=w.time==='night'?'#09182b':w.time==='sunset'?'#3b3851':'#86b7c8';
 ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
 const tile=(x,y)=>({x:ox+(x-y)*cell/2,y:oy+(x+y)*cell/4});
 for(let y=0;y<8;y++)for(let x=0;x<12;x++){const p=tile(x,y);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+cell/2,p.y+cell/4);ctx.lineTo(p.x,p.y+cell/2);ctx.lineTo(p.x-cell/2,p.y+cell/4);ctx.closePath();ctx.fillStyle=(x+y)%2?'#4e8c58':'#579861';ctx.fill();ctx.strokeStyle='#ffffff12';ctx.stroke();}
 const protagonist=cfg.heroes?.find(h=>h.id===cfg.active)||cfg.heroes?.[0];
 const portrait=avatarImage(protagonist,canvas,cfg,selected,play);
 const objs=[...w.map].sort((a,b)=>(a.x+a.y)-(b.x+b.y));
 for(const o of objs){const p=tile(o.x,o.y),sel=o.id===selected;ctx.save();ctx.translate(p.x,p.y+cell/4);ctx.scale(o.scale,o.scale);if(sel){ctx.strokeStyle='#7ee8ff';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,0,28,13,0,0,Math.PI*2);ctx.stroke();}
  if(o.type==='road'){ctx.fillStyle='#4b5563';ctx.fillRect(-30,-7,60,14);ctx.strokeStyle='#f5d76e';ctx.setLineDash([7,5]);ctx.beginPath();ctx.moveTo(-27,0);ctx.lineTo(27,0);ctx.stroke();ctx.setLineDash([]);}
  else if(o.type==='tree'){ctx.fillStyle='#68462f';ctx.fillRect(-4,-28,8,28);ctx.fillStyle='#1f6b45';for(const [dx,dy,r] of [[0,-42,17],[-12,-31,14],[12,-31,14]]){ctx.beginPath();ctx.arc(dx,dy,r,0,Math.PI*2);ctx.fill();}}
  else if(o.type==='rock'){ctx.fillStyle='#7b8794';ctx.beginPath();ctx.moveTo(-18,0);ctx.lineTo(-12,-22);ctx.lineTo(7,-29);ctx.lineTo(21,-8);ctx.lineTo(14,0);ctx.closePath();ctx.fill();}
  else if(o.type==='house'){ctx.fillStyle='#e9e2d0';ctx.fillRect(-22,-37,44,37);ctx.fillStyle='#b94f42';ctx.beginPath();ctx.moveTo(-28,-37);ctx.lineTo(0,-57);ctx.lineTo(28,-37);ctx.closePath();ctx.fill();ctx.fillStyle='#4d6d7d';ctx.fillRect(-6,-18,12,18);}
  else if(o.type==='tower'){ctx.fillStyle='#c7d0d8';ctx.fillRect(-16,-55,32,55);ctx.fillStyle='#5b6672';ctx.fillRect(-20,-60,40,10);ctx.fillStyle='#243949';ctx.fillRect(-5,-20,10,20);}
  else if(o.type==='portal'){ctx.strokeStyle='#6ee7ff';ctx.lineWidth=7;ctx.shadowColor='#6ee7ff';ctx.shadowBlur=16;ctx.beginPath();ctx.ellipse(0,-25,18,28,0,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;}
  else if(o.type==='chest'){ctx.fillStyle='#8b5a2b';ctx.fillRect(-16,-20,32,20);ctx.fillStyle='#d9ad53';ctx.fillRect(-2,-20,5,20);ctx.fillRect(-16,-12,32,4);}
  else if(o.type==='hero'&&portrait?.complete&&portrait.naturalWidth){ctx.save();ctx.shadowColor='#c2ecff';ctx.shadowBlur=9;ctx.drawImage(portrait,-21,-69,42,68);ctx.restore();ctx.fillStyle='#e8f9ff';ctx.font='bold 9px system-ui';ctx.textAlign='center';ctx.fillText(protagonist.name||'Protagonista',0,14,90);}
  else {ctx.fillStyle=o.type==='hero'?'#4dd8ff':'#ef6a72';ctx.beginPath();ctx.arc(0,-27,9,0,Math.PI*2);ctx.fill();ctx.fillRect(-8,-18,16,24);ctx.fillStyle='#e8edf2';ctx.fillRect(-12,5,9,15);ctx.fillRect(3,5,9,15);}
  ctx.restore();
 }
 if(w.weather==='rain'){ctx.strokeStyle='#d6efff66';for(let i=0;i<55;i++){const x=(i*79)%W,y=(i*47)%H;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-7,y+18);ctx.stroke();}}
 if(w.weather==='snow'){ctx.fillStyle='#fff9';for(let i=0;i<45;i++){ctx.beginPath();ctx.arc((i*83)%W,(i*61)%H,2,0,Math.PI*2);ctx.fill();}}
 if(play){ctx.fillStyle='#07111dcc';ctx.fillRect(12,12,245,48);ctx.fillStyle='#fff';ctx.font='bold 13px system-ui';ctx.fillText('▶ MODO JUEGO',24,32);ctx.font='11px system-ui';ctx.fillStyle='#b7cad9';ctx.fillText(w.mission,24,50,220);}
}
function render(studio,el,raw){
 const cfg=normalise(raw);studio.builderCat=studio.builderCat||'all';studio.builderTool=studio.builderTool||'house';studio.builderSelected=studio.builderSelected||cfg.world.map[0]?.id;studio.builderPlay=!!studio.builderPlay;
 el.innerHTML='<div class="kg-head"><div><span>KRUEKA GAME STUDIO</span><h2>Constructor visual de videojuegos</h2></div><div class="kg-actions"><button class="ks-btn primary" id="kg-heroes-top" type="button">⚔ Personajes · Render Pro</button><button class="ks-btn" id="kg-undo" '+(!studio.undo?.length?'disabled':'')+'>↶ Deshacer</button><button class="ks-btn primary" id="kg-play">'+(studio.builderPlay?'■ Editar':'▶ Jugar')+'</button></div></div>'+
 '<div class="kg-studio"><aside class="kg-library"><b>Biblioteca</b><div class="kg-cats">'+Object.entries(CATS).map(([id,l])=>'<button data-cat="'+id+'" aria-pressed="'+(studio.builderCat===id)+'">'+l+'</button>').join('')+'</div><div class="kg-assets">'+Object.entries(TYPES).filter(([,t])=>studio.builderCat==='all'||t.cat===studio.builderCat).map(([id,t])=>'<button data-tool="'+id+'" aria-pressed="'+(studio.builderTool===id)+'"><i>'+t.icon+'</i><span>'+t.label+'</span><small>'+t.cost+' pts</small></button>').join('')+'</div></aside>'+
 '<main class="kg-stage"><div class="kg-status"><span>'+esc(cfg.title||'Mi juego')+'</span><b>'+cfg.world.map.length+' objetos</b><b>'+esc(cfg.world.biome)+'</b><b>'+esc(cfg.world.weather)+'</b></div><canvas id="kg-canvas" width="900" height="570" aria-label="Mapa visual del videojuego"></canvas><div class="kg-hint">'+(studio.builderPlay?'Modo prueba: recorré mentalmente la misión y comprobá la distribución.':'Elegí un objeto y tocá una casilla del mapa para colocarlo. Tocá un objeto existente para seleccionarlo.')+'</div></main>'+
 '<aside class="kg-inspector"><b>Inspector</b><div id="kg-inspector"></div><hr><label>Escenario<select id="kg-biome">'+[['forest','Bosque'],['ruins','Ruinas'],['city','Ciudad'],['desert','Desierto'],['ice','Hielo'],['space','Espacio']].map(([v,l])=>'<option value="'+v+'" '+(cfg.world.biome===v?'selected':'')+'>'+l+'</option>').join('')+'</select></label><label>Clima<select id="kg-weather">'+[['clear','Despejado'],['mist','Niebla'],['rain','Lluvia'],['storm','Tormenta'],['snow','Nieve']].map(([v,l])=>'<option value="'+v+'" '+(cfg.world.weather===v?'selected':'')+'>'+l+'</option>').join('')+'</select></label><label>Misión<textarea id="kg-mission" maxlength="150">'+esc(cfg.world.mission)+'</textarea></label><button class="ks-btn primary" id="kg-save-world">Guardar mundo</button><button class="ks-btn" id="kg-hero">Editar héroes</button><button class="ks-btn" id="kg-ai">✨ Mejorar con IA</button></aside></div>';
 const canvas=el.querySelector('#kg-canvas');
 function save(next,checkpoint=true){if(checkpoint)studio.checkpoint();studio.files['game-config.js']=StudioKits.configFile(normalise(next));studio.changed();studio.refreshAll();studio.lock(false);}
 function paint(){draw(canvas,cfg,studio.builderSelected,studio.builderPlay);const o=cfg.world.map.find(x=>x.id===studio.builderSelected),box=el.querySelector('#kg-inspector');if(!o){box.innerHTML='<p>Seleccioná un objeto del mapa.</p>';return;}box.innerHTML='<label>Nombre<input id="kgi-name" maxlength="32" value="'+esc(o.name)+'"></label><div class="kg-grid"><label>X<input id="kgi-x" type="number" min="0" max="11" value="'+o.x+'"></label><label>Y<input id="kgi-y" type="number" min="0" max="7" value="'+o.y+'"></label><label>Giro<select id="kgi-rot">'+[0,90,180,270].map(v=>'<option '+(o.rot===v?'selected':'')+'>'+v+'</option>').join('')+'</select></label><label>Tamaño<input id="kgi-scale" type="number" min=".6" max="1.8" step=".1" value="'+o.scale+'"></label></div><div class="kg-row"><button class="ks-btn" id="kgi-dup">Duplicar</button><button class="ks-btn" id="kgi-del">Eliminar</button></div>';
  box.querySelectorAll('input,select').forEach(n=>n.onchange=()=>{const next=normalise(cfg),q=next.world.map.find(x=>x.id===o.id);q.name=box.querySelector('#kgi-name').value;q.x=clamp(box.querySelector('#kgi-x').value,0,11);q.y=clamp(box.querySelector('#kgi-y').value,0,7);q.rot=Number(box.querySelector('#kgi-rot').value);q.scale=clamp(box.querySelector('#kgi-scale').value,.6,1.8);save(next);});
  box.querySelector('#kgi-del').onclick=()=>{const next=normalise(cfg);next.world.map=next.world.map.filter(x=>x.id!==o.id);studio.builderSelected=next.world.map[0]?.id||'';save(next);};
  box.querySelector('#kgi-dup').onclick=()=>{if(cfg.world.map.length>=90)return;const next=normalise(cfg),q={...o,id:'obj-'+Date.now().toString(36),x:clamp(o.x+1,0,11),y:clamp(o.y+1,0,7),name:o.name+' copia'};next.world.map.push(q);studio.builderSelected=q.id;save(next);};
 }
 paint();
 el.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{studio.builderCat=b.dataset.cat;render(studio,el,cfg);});
 el.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>{studio.builderTool=b.dataset.tool;el.querySelectorAll('[data-tool]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});
 canvas.onclick=e=>{if(studio.builderPlay)return;const r=canvas.getBoundingClientRect(),mx=(e.clientX-r.left)*canvas.width/r.width,my=(e.clientY-r.top)*canvas.height/r.height,cell=58,ox=canvas.width/2,oy=88;let best=null,dist=1e9;for(let y=0;y<8;y++)for(let x=0;x<12;x++){const px=ox+(x-y)*cell/2,py=oy+(x+y)*cell/4+cell/4,d=(px-mx)**2+(py-my)**2;if(d<dist){dist=d;best={x,y}}}if(!best)return;const hit=cfg.world.map.slice().reverse().find(o=>o.x===best.x&&o.y===best.y);if(hit){studio.builderSelected=hit.id;paint();return;}if(cfg.world.map.length>=90)return;const id='obj-'+Date.now().toString(36),type=studio.builderTool||'house';cfg.world.map.push({id,type,x:best.x,y:best.y,rot:0,scale:1,name:TYPES[type].label});studio.builderSelected=id;save(cfg);};
 el.querySelector('#kg-play').onclick=()=>{studio.builderPlay=!studio.builderPlay;render(studio,el,cfg);};
 el.querySelector('#kg-undo').onclick=()=>studio.restore();
 el.querySelector('#kg-save-world').onclick=()=>{cfg.world.biome=el.querySelector('#kg-biome').value;cfg.world.weather=el.querySelector('#kg-weather').value;cfg.world.mission=el.querySelector('#kg-mission').value;save(cfg);};
 const openHeroEditor=()=>{studio.builderView='heroes';studio.builderPlay=false;studio.showTab('create');studio.renderCreator();const heroView=document.getElementById('ks-create');if(heroView)heroView.scrollTop=0;};
 el.querySelector('#kg-heroes-top').onclick=openHeroEditor;
 el.querySelector('#kg-hero').onclick=openHeroEditor;
 el.querySelector('#kg-ai').onclick=()=>{studio.showTab('ai');const p=document.getElementById('ks-prompt');studio.draft='Ayudame a mejorar mi mapa de juego. Conservá mis héroes y modificá solamente world.map o la misión en game-config.js. Hacé un solo cambio claro y explicame cómo probarlo.';if(p){p.value=studio.draft;p.focus()}studio.changed();};
}
function install(){
 if(!window.StudioIA||!window.StudioHeroes)return false;
 const old=StudioIA.renderCreator.bind(StudioIA);
 StudioIA.renderCreator=function(){const el=document.getElementById('ks-create');if(!el)return;const cfg=StudioKits.read(this.files);if(cfg?.kind==='hero-manager'){render(this,el,cfg);return;}return old();};
 return true;
}
const api={TYPES,CATS,normalise,draw,render,install};window.KruekaGameBuilder=api;
if(!install()){let n=0;const t=setInterval(()=>{if(install()||++n>30)clearInterval(t)},100);}
})();
/* Editor inicial de videojuegos: escena visual + eventos de condición y acción. */
(function(){
'use strict';
const S=window.StudioIA,K=window.StudioKits;
if(!S||!K||!Array.isArray(K.catalog)||typeof K.create!=='function'||typeof K.art!=='function'||window.StudioEscenas)return;
const ID='escena-visual',W=12,H=8;
const types={
 hero:{label:'Personaje',icon:'◆',color:'#60dbc5'},
 coin:{label:'Moneda',icon:'●',color:'#ffd270'},
 wall:{label:'Muro',icon:'▦',color:'#6780a2'},
 hazard:{label:'Peligro',icon:'▲',color:'#ff849d'},
 exit:{label:'Portal',icon:'◉',color:'#a8a2ff'}
};
const palette={forest:'Bosque',space:'Estación',sunset:'Atardecer'};
const ruleTypes={
 coin:{label:'El personaje toca una moneda',verb:'Sumar puntos y recoger la moneda',max:10},
 hazard:{label:'El personaje toca un peligro',verb:'Restar vidas y volver al inicio',max:3},
 exit:{label:'El personaje entra al portal',verb:'Ganar si alcanza la meta de puntos',max:99}
};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=(v,a,b,d)=>Number.isInteger(Number(v))?Math.max(a,Math.min(b,Number(v))):d;
function clean(raw){
 const c=raw&&typeof raw==='object'?raw:{};
 const cells=new Set(),ids=new Set(),single=new Set(),objects=[];
 for(const [i,o] of (Array.isArray(c.objects)?c.objects.slice(0,70):[]).entries()){
  if(!o||!Object.hasOwn(types,o.type))continue;
  const x=number(o.x,0,W-1,0),y=number(o.y,0,H-1,0),p=x+','+y;
  if(cells.has(p)||(['hero','exit'].includes(o.type)&&single.has(o.type)))continue;
  let id=/^[a-z0-9-]{1,33}$/.test(String(o.id))?String(o.id):'obj-'+i,k=0;
  while(ids.has(id))id='obj-'+i+'-'+(++k);
  cells.add(p);ids.add(id);single.add(o.type);
  objects.push({id,type:o.type,x,y,color:/^#[0-9a-f]{6}$/i.test(o.color)?o.color:types[o.type].color,label:String(o.label||types[o.type].label).slice(0,32)});
 }
 const used=new Set(),rules=[];
 for(const r of Array.isArray(c.rules)?c.rules.slice(0,3):[]){
  if(!r||!Object.hasOwn(ruleTypes,r.when)||used.has(r.when))continue;
  used.add(r.when);rules.push({when:r.when,amount:number(r.amount,r.when==='exit'?0:1,ruleTypes[r.when].max,1)});
 }
 return {kind:ID,title:String(c.title||'Mi primer juego').trim().slice(0,60)||'Mi primer juego',theme:Object.hasOwn(palette,c.theme)?c.theme:'forest',objects,rules};
}
function starter(layout='forest'){
 const basic=[['hero',1,5],['coin',3,5],['coin',5,3],['coin',8,2],['exit',10,2],['wall',4,5],['wall',4,4],['hazard',7,4]];
 const space=[['hero',1,6],['coin',3,6],['coin',5,4],['coin',8,1],['exit',10,1],['wall',6,5],['wall',6,4],['hazard',7,3]];
 const blank=[['hero',1,5],['exit',10,2]];
 const items=layout==='space'?space:layout==='blank'?blank:basic;
 return clean({theme:layout==='space'?'space':'forest',objects:items.map(([type,x,y],i)=>({id:'pieza-'+(i+1),type,x,y})),rules:layout==='blank'?[{when:'exit',amount:0}]:[{when:'coin',amount:1},{when:'hazard',amount:1},{when:'exit',amount:3}]});
}
function inspect(c){
 const issues=[],hero=c.objects.find(o=>o.type==='hero'),exit=c.objects.find(o=>o.type==='exit');
 const rule=when=>c.rules.find(r=>r.when===when);
 if(!hero)issues.push('Falta el personaje. Agregalo en Escena.');
 if(!exit)issues.push('Falta el portal. Agregalo en Escena.');
 if(!rule('exit'))issues.push('Falta la regla para ganar cuando se entra al portal.');
 const barriers=new Set(c.objects.filter(o=>o.type==='wall'||(o.type==='hazard'&&rule('hazard'))).map(o=>o.x+','+o.y));
 const reachable=new Set(),todo=hero?[[hero.x,hero.y]]:[];
 for(let i=0;i<todo.length;i++){
  const [x,y]=todo[i],key=x+','+y;if(reachable.has(key))continue;reachable.add(key);
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const a=x+dx,b=y+dy,key=a+','+b;
   if(a>=0&&a<W&&b>=0&&b<H&&!reachable.has(key)&&!barriers.has(key))todo.push([a,b]);
  }
 }
 if(hero&&exit&&!reachable.has(exit.x+','+exit.y))issues.push('El portal no tiene un camino seguro desde el personaje. Mové un muro o un peligro.');
 const points=c.objects.filter(o=>o.type==='coin'&&reachable.has(o.x+','+o.y)).length*(rule('coin')?.amount||0);
 if(rule('exit')?.amount>points)issues.push('La meta es '+rule('exit').amount+' pero solo hay '+points+' puntos disponibles por un camino seguro. Sumá monedas o bajá la meta.');
 return issues;
}
function runtime(){
 const cfg=window.KRUEKA_GAME,T={hero:'◆',coin:'●',wall:'▦',hazard:'▲',exit:'◉'};
 const at=(x,y)=>cfg.objects.find(o=>o.x===x&&o.y===y);
 const home=cfg.objects.find(o=>o.type==='hero'),go=id=>document.getElementById(id);
 function mk(tag,t){const el=document.createElement(tag);if(t)el.textContent=t;return el;}
 let x,y,score,lives,used,ended,message;
 function render(){
  const board=go('arena');board.replaceChildren();
  for(let yy=0;yy<8;yy++)for(let xx=0;xx<12;xx++){
   const o=at(xx,yy),p=mk('span');
   p.className='tile';
   if(xx===x&&yy===y){p.textContent=T.hero;p.style.color=home.color;}
   else if(o&&o.type!=='hero'&&!used.has(o.id)){p.textContent=T[o.type];p.style.color=o.color;}
   board.append(p);
  }
  go('score').textContent='Puntos: '+score+' · Vidas: '+lives;
  go('msg').textContent=message;
 }
 function reset(focus=false){
  score=0;lives=3;used=new Set();ended=false;x=home?.x;y=home?.y;
  message=home?'Usá las flechas para jugar.':'Falta el personaje; volvé al editor.';
  render();if(focus)go('arena').focus();
 }
 function move(dx,dy){
  if(!home||ended)return;
  const a=x+dx,b=y+dy;if(a<0||a>=12||b<0||b>=8)return;
  const o=at(a,b);if(o?.type==='wall')return;x=a;y=b;
  const r=o&&cfg.rules.find(z=>z.when===o.type);
  if(r&&o.type==='coin'&&!used.has(o.id)){used.add(o.id);score+=r.amount;message='¡Moneda recogida!';}
  if(r&&o.type==='hazard'){lives=Math.max(0,lives-r.amount);x=home.x;y=home.y;if(!lives)ended=true;message=ended?'Perdiste. Probá de nuevo.':'Perdiste vidas y volviste al inicio.';}
  if(r&&o.type==='exit'){ended=score>=r.amount;message=ended?'¡Ganaste!':'El portal pide '+r.amount+' puntos.';}
  render();
 }
 const dirs={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
 document.addEventListener('keydown',e=>{if(dirs[e.key]){e.preventDefault();move(...dirs[e.key]);}});
 document.querySelectorAll('[data-dir]').forEach(b=>b.onclick=()=>move(...dirs[b.dataset.dir]));
 go('reset').onclick=()=>reset(true);
 go('title').textContent=cfg.title;document.title=cfg.title;go('arena').dataset.theme=cfg.theme;reset();
}
const css='*{box-sizing:border-box}body{margin:0;background:#101929;color:#f0f7ff;font:15px/1.45 system-ui}main{max-width:840px;margin:auto;padding:clamp(9px,3vw,22px)}small{color:#80d9ca;letter-spacing:.14em;font-size:10px}h1{font-size:clamp(19px,3.3vw,31px);margin:4px 0}#score{font-weight:700}#arena{outline:2px solid #45667a;margin-top:12px;display:grid;grid-template-columns:repeat(12,minmax(0,1fr));border-radius:9px;overflow:hidden;--a:#23463f;--b:#172e34}#arena[data-theme=space]{--a:#2b3655;--b:#202743}#arena[data-theme=sunset]{--a:#604447;--b:#472f40}.tile{display:grid;place-items:center;aspect-ratio:1;background:var(--a);border-right:1px solid #ffffff1b;border-bottom:1px solid #ffffff1b;font-size:clamp(11px,4vw,28px);font-weight:800}.tile:nth-child(even){background:var(--b)}button{padding:7px 12px;min-height:35px;background:#244861;border:1px solid #6e99ac;border-radius:7px;color:white;font:inherit}nav{display:flex;gap:5px;flex-wrap:wrap}#msg{min-height:22px;color:#d9e5f2}';
function files(c=starter()){
 c=clean(c);
 return {'index.html':'<!doctype html><html lang="es-PY"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="style.css"></head><body><main><small>TALLER DE VIDEOJUEGOS</small><h1 id="title"></h1><div id="score"></div><div id="arena" tabindex="0" aria-label="Tablero del videojuego"></div><p id="msg" role="status"></p><nav aria-label="Controles"><button data-dir="ArrowLeft" aria-label="Izquierda">←</button><button data-dir="ArrowUp" aria-label="Arriba">↑</button><button data-dir="ArrowDown" aria-label="Abajo">↓</button><button data-dir="ArrowRight" aria-label="Derecha">→</button><button id="reset">Reiniciar</button></nav></main><script src="game-config.js"></script><script src="game.js"></script></body></html>',
 'style.css':css,'game.js':'('+runtime.toString()+')();','game-config.js':K.configFile(c),'tipo-club.txt':'juegos',
 'LEEME.md':'# Taller de videojuegos visual\n\nUbicá el personaje, las piezas y el portal en Escena. En Reglas, elegí una condición y revisá qué hace su acción. Probá de principio a fin antes de guardar o enviar. No hace falta conectar un proveedor de IA.'};
}
function mounted(studio,el,raw){
 const c=clean(raw);
 const identity=(studio.sid?.()||'')+'|'+studio.projectId;
 if(studio.visualIdentity!==identity){studio.visualIdentity=identity;studio.visualTab='scene';studio.visualPick='coin';studio.visualSelected='';studio.visualNotice='';}
 const part=studio.visualTab||'scene';
 el.innerHTML='<section id="kv-world" class="ks-settings"><header><small>CLUB KRUEKA / VIDEOJUEGOS</small><h2>Tu juego visual</h2><p>Armá la escena, elegí qué pasa y jugá para comprobarlo. No necesitás IA.</p></header>'+
  '<nav class="ks-scene-actions" aria-label="Etapas de creación"><button type="button" class="ks-btn" data-kv-tab="scene">1. Escena</button><button type="button" class="ks-btn" data-kv-tab="rules">2. Reglas</button><button type="button" class="ks-btn" data-kv-tab="test">3. Probar</button><button type="button" class="ks-btn" id="kv-save">Guardar proyecto</button></nav>'+
  '<div id="kv-panel"></div><p id="kv-notice" role="status"></p></section>';
 const panel=el.querySelector('#kv-panel'),msg=el.querySelector('#kv-notice');
 msg.textContent=studio.visualNotice||'';
 const tell=t=>{studio.visualNotice=t;msg.textContent=t;};
 const apply=(data,note='Cambio aplicado. Probá o guardá tu proyecto.')=>{
  if(studio.busy||!studio.cloudReady)return;
  const next=clean(data);
  studio.checkpoint();studio.files=studio.validFiles({...studio.files,'game-config.js':K.configFile(next)});
  studio.title=next.title;studio.visualNotice=note;studio.changed();studio.refreshAll();studio.lock(false);
 };
 el.querySelector('#kv-save').onclick=async()=>{if(!studio.busy&&studio.cloudReady)tell(await studio.save()?'Proyecto guardado. Buscalo luego en Mis proyectos.':'No se pudo guardar. Revisá tu conexión.');};
 el.querySelectorAll('[data-kv-tab]').forEach(b=>{
  b.setAttribute('aria-pressed',String(b.dataset.kvTab===part));
  b.onclick=()=>{studio.visualTab=b.dataset.kvTab;mounted(studio,el,c);el.querySelector('[data-kv-tab='+studio.visualTab+']')?.focus();if(studio.visualTab==='test')studio.renderPreview();};
 });
 if(part==='scene'){
  const selected=c.objects.find(o=>o.id===studio.visualSelected);
  const typesHTML=Object.entries(types).map(([k,t])=>'<button type="button" class="ks-btn" draggable="true" data-kv-tool="'+k+'">'+t.icon+' '+t.label+'</button>').join('');
  panel.innerHTML='<label>Nombre del juego <input id="kv-title" maxlength="60" value="'+esc(c.title)+'"></label><label>Ambiente <select id="kv-theme">'+Object.entries(palette).map(([id,label])=>'<option value="'+id+'" '+(c.theme===id?'selected':'')+'>'+label+'</option>').join('')+'</select></label>'+
   '<div class="kv-pal" aria-label="Piezas">'+typesHTML+'</div><p>Arrastrá una pieza al tablero, o elegila y tocá una casilla libre. Para mover una pieza puesta, seleccionala y tocá otro lugar.</p>'+
   '<div id="kv-grid" role="group" aria-label="Tablero editable"></div>'+
   '<details><summary>Otras escenas iniciales</summary><p>Estas opciones crean un proyecto separado. El actual no se reemplaza.</p><div class="ks-scene-actions"><button class="ks-btn" id="kv-new-space">Estación espacial</button><button class="ks-btn" id="kv-new-blank">Escena básica</button></div></details>'+
   '<div id="kv-inspector"></div>';
  const grid=panel.querySelector('#kv-grid');grid.dataset.theme=c.theme;
  const gridCells=new Map(c.objects.map(o=>[o.x+','+o.y,o]));
  const setSelect=id=>{studio.visualSelected=id;mounted(studio,el,c);};
  function place(spec,x,y){
   const current=gridCells.get(x+','+y);
   if(current){setSelect(current.id);return;}
   if(spec.startsWith('id:')){
    const id=spec.slice(3);if(!c.objects.some(o=>o.id===id))return;
    studio.visualSelected='';apply({...c,objects:c.objects.map(o=>o.id===id?{...o,x,y}:o)});return;
   }
   const t=Object.hasOwn(types,spec)?types[spec]:null;if(!t)return;
   if(['hero','exit'].includes(spec)&&c.objects.some(o=>o.type===spec)){tell('Ya existe '+t.label.toLowerCase()+'. Seleccionalo para moverlo.');return;}
   if(c.objects.length>=70){tell('Llegaste al máximo de 70 piezas. Quitá una antes de agregar otra.');return;}
   let n=1;while(c.objects.some(o=>o.id==='pieza-'+n))n++;
   const o={id:'pieza-'+n,type:spec,x,y,label:t.label,color:t.color};
   studio.visualSelected='';apply({...c,objects:[...c.objects,o]});
  }
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
   const o=gridCells.get(x+','+y),b=document.createElement('button');b.type='button';b.dataset.cell=x+','+y;
   b.setAttribute('aria-label',(o?o.label:'Casilla libre')+' '+(x+1)+', '+(y+1));
   if(o){b.textContent=types[o.type].icon;b.style.color=o.color;b.draggable=true;b.ondragstart=e=>e.dataTransfer.setData('application/x-krueka-piece','id:'+o.id);}
   if(o?.id===selected?.id&&o)b.classList.add('kv-selected');
   b.onclick=()=>place(selected?'id:'+selected.id:studio.visualPick,x,y);
   b.ondragover=e=>{if(e.dataTransfer.types.includes('application/x-krueka-piece'))e.preventDefault();};
   b.ondrop=e=>{const value=e.dataTransfer.getData('application/x-krueka-piece');if(value){e.preventDefault();place(value,x,y);}};
   grid.append(b);
  }
  // One Tab stop for the scene. Arrow keys move across its cells.
  const cellButtons=[...grid.querySelectorAll('[data-cell]')];
  for(const b of cellButtons)b.tabIndex=-1;
  (grid.querySelector('.kv-selected')||cellButtons[0]).tabIndex=0;
  grid.addEventListener('focusin',e=>{if(!e.target.matches('[data-cell]'))return;for(const b of cellButtons)b.tabIndex=b===e.target?0:-1;});
  grid.onkeydown=e=>{
   const key={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];
   if(!key||!e.target.dataset.cell)return;e.preventDefault();
   const [x,y]=e.target.dataset.cell.split(',').map(Number);
   grid.querySelector('[data-cell="'+(x+key[0])+','+(y+key[1])+'"]')?.focus();
  };
  panel.querySelectorAll('[data-kv-tool]').forEach(b=>{
   b.setAttribute('aria-pressed',String(!selected&&studio.visualPick===b.dataset.kvTool));
   b.onclick=()=>{studio.visualPick=b.dataset.kvTool;setSelect('');el.querySelector('[data-kv-tool='+studio.visualPick+']')?.focus();};
   b.ondragstart=e=>e.dataTransfer.setData('application/x-krueka-piece',b.dataset.kvTool);
  });
  panel.querySelector('#kv-title').onchange=e=>apply({...c,title:e.target.value});
  panel.querySelector('#kv-theme').onchange=e=>apply({...c,theme:e.target.value});
  async function newScene(layout){const prior=studio.projectId,title=layout==='space'?'Estación espacial':'Escena básica';await studio.startProject(files({...starter(layout),title}),title);if(prior!==studio.projectId)studio.showTab('create');}
  panel.querySelector('#kv-new-space').onclick=()=>newScene('space');
  panel.querySelector('#kv-new-blank').onclick=()=>newScene('blank');
  const detail=panel.querySelector('#kv-inspector');
  if(selected){
   detail.innerHTML='<h3>Pieza seleccionada</h3><label>Nombre <input id="kv-name" maxlength="32" value="'+esc(selected.label)+'"></label><label>Color <input id="kv-color" type="color" value="'+selected.color+'"></label><button type="button" class="ks-btn" id="kv-apply-piece">Aplicar a la pieza</button> <button type="button" class="ks-btn" id="kv-remove">Quitar pieza</button>';
   detail.querySelector('#kv-apply-piece').onclick=()=>apply({...c,objects:c.objects.map(o=>o.id===selected.id?{...o,label:detail.querySelector('#kv-name').value,color:detail.querySelector('#kv-color').value}:o)});
   detail.querySelector('#kv-remove').onclick=()=>{studio.visualSelected='';apply({...c,objects:c.objects.filter(o=>o.id!==selected.id)});};
  }else detail.textContent='Tocá una pieza del tablero para ver su nombre y color.';
 }else if(part==='rules'){
  panel.innerHTML='<h3>Si pasa esto → hacé esto</h3><p>Activá las reglas del juego y elegí los valores. Una regla puede cambiar cómo se juega sin tocar el escenario.</p>'+
   Object.entries(ruleTypes).map(([key,r])=>{const saved=c.rules.find(x=>x.when===key);return '<fieldset><legend>'+r.label+'</legend><label><input type="checkbox" data-kv-rule="'+key+'" '+(saved?'checked':'')+'> Activar</label><label>'+r.verb+' <input type="number" data-kv-amount="'+key+'" min="'+(key==='exit'?0:1)+'" max="'+r.max+'" value="'+(saved?.amount??1)+'"></label></fieldset>';}).join('')+
   '<button type="button" class="ks-btn primary" id="kv-apply-rules">Aplicar reglas</button>';
  panel.querySelector('#kv-apply-rules').onclick=()=>apply({...c,rules:[...panel.querySelectorAll('[data-kv-rule]:checked')].map(n=>({when:n.dataset.kvRule,amount:Number(panel.querySelector('[data-kv-amount='+n.dataset.kvRule+']').value)}))});
 }else{
  const alerts=inspect(c);panel.innerHTML='<h3>Probá como jugador</h3><p>Verificá las flechas, juntá puntos y llegá al portal. Al perder, probá Reiniciar.</p><ul id="kv-diagnosis"></ul><button type="button" class="ks-btn primary" id="kv-play">▶ Jugar en la vista previa</button>';
  for(const x of alerts.length?alerts:['No se detectaron problemas de recorrido. Jugá una partida completa igualmente.']){const li=document.createElement('li');li.textContent=x;panel.querySelector('ul').append(li);}
  panel.querySelector('#kv-play').onclick=()=>studio.playCurrent();
 }
}
const create=K.create.bind(K),art=K.art.bind(K);
K.catalog.unshift({id:ID,icon:'🎮',title:'Videojuego visual 2D',tag:'Escena · Reglas · Probar',description:'Arrastrá piezas, definí reglas y jugá sin cuentas externas ni créditos.'});
K.create=id=>id===ID?files():create(id);
K.art=id=>id===ID?'🎮':art(id);
const render=S.renderCreator;
S.renderCreator=function(){const c=K.read(this.files),el=document.getElementById('ks-create');return c?.kind===ID&&el?mounted(this,el,c):render.apply(this,arguments);};
const swap=S.switchProject;
S.switchProject=async function(id){const r=await swap.apply(this,arguments);if(this.projectId===id&&K.read(this.files)?.kind===ID){this.visualTab='scene';this.renderCreator();this.showTab('create');}return r;};
window.StudioEscenas={ID,clean,starter,inspect,files};
})();
