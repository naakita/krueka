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
function draw(canvas,cfg,selected,play){
 const ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height,w=cfg.world,cell=58,ox=W/2,oy=88;
 ctx.clearRect(0,0,W,H);
 const sky=w.time==='night'?'#09182b':w.time==='sunset'?'#3b3851':'#86b7c8';
 ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
 const tile=(x,y)=>({x:ox+(x-y)*cell/2,y:oy+(x+y)*cell/4});
 for(let y=0;y<8;y++)for(let x=0;x<12;x++){const p=tile(x,y);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+cell/2,p.y+cell/4);ctx.lineTo(p.x,p.y+cell/2);ctx.lineTo(p.x-cell/2,p.y+cell/4);ctx.closePath();ctx.fillStyle=(x+y)%2?'#4e8c58':'#579861';ctx.fill();ctx.strokeStyle='#ffffff12';ctx.stroke();}
 const objs=[...w.map].sort((a,b)=>(a.x+a.y)-(b.x+b.y));
 for(const o of objs){const p=tile(o.x,o.y),sel=o.id===selected;ctx.save();ctx.translate(p.x,p.y+cell/4);ctx.scale(o.scale,o.scale);if(sel){ctx.strokeStyle='#7ee8ff';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,0,28,13,0,0,Math.PI*2);ctx.stroke();}
  if(o.type==='road'){ctx.fillStyle='#4b5563';ctx.fillRect(-30,-7,60,14);ctx.strokeStyle='#f5d76e';ctx.setLineDash([7,5]);ctx.beginPath();ctx.moveTo(-27,0);ctx.lineTo(27,0);ctx.stroke();ctx.setLineDash([]);}
  else if(o.type==='tree'){ctx.fillStyle='#68462f';ctx.fillRect(-4,-28,8,28);ctx.fillStyle='#1f6b45';for(const [dx,dy,r] of [[0,-42,17],[-12,-31,14],[12,-31,14]]){ctx.beginPath();ctx.arc(dx,dy,r,0,Math.PI*2);ctx.fill();}}
  else if(o.type==='rock'){ctx.fillStyle='#7b8794';ctx.beginPath();ctx.moveTo(-18,0);ctx.lineTo(-12,-22);ctx.lineTo(7,-29);ctx.lineTo(21,-8);ctx.lineTo(14,0);ctx.closePath();ctx.fill();}
  else if(o.type==='house'){ctx.fillStyle='#e9e2d0';ctx.fillRect(-22,-37,44,37);ctx.fillStyle='#b94f42';ctx.beginPath();ctx.moveTo(-28,-37);ctx.lineTo(0,-57);ctx.lineTo(28,-37);ctx.closePath();ctx.fill();ctx.fillStyle='#4d6d7d';ctx.fillRect(-6,-18,12,18);}
  else if(o.type==='tower'){ctx.fillStyle='#c7d0d8';ctx.fillRect(-16,-55,32,55);ctx.fillStyle='#5b6672';ctx.fillRect(-20,-60,40,10);ctx.fillStyle='#243949';ctx.fillRect(-5,-20,10,20);}
  else if(o.type==='portal'){ctx.strokeStyle='#6ee7ff';ctx.lineWidth=7;ctx.shadowColor='#6ee7ff';ctx.shadowBlur=16;ctx.beginPath();ctx.ellipse(0,-25,18,28,0,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;}
  else if(o.type==='chest'){ctx.fillStyle='#8b5a2b';ctx.fillRect(-16,-20,32,20);ctx.fillStyle='#d9ad53';ctx.fillRect(-2,-20,5,20);ctx.fillRect(-16,-12,32,4);}
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