/* Krueka 3D Toolbox: plantillas originales, validación e intercambio de escenas.
   No descarga activos ni ejecuta archivos de terceros. */
(function(){
'use strict';
if(window.Krueka3DToolbox)return;
const MAX=48,LEGACY_ENGINE_SHA=new Set(['83d841570c0199972f8e06ec452f95887b15207294ddf52ea8980c35ebc53cb0','2ccca19589275907a5f9a4e073c9aea2cbe93f3bbee82919678dd89aeda8c724','6ac7fb92baebef6cbe7b33581328d73bd6b46971bac93b3b35c64ae49076c8bf','6fb29499505463c07798affd1679d74ecf416c5377e7d6b362c710c4da630951','6e5ecea16fec798f34a58733d2468bac4749217c1e6d35f210d4bdfbe0777350']),DEPTH=28,ZONE_MAX=4;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
// Blocks and courses built entirely from the existing, lightweight scene objects.
const terrainPiece=(type,label,x,z,size,height,color)=>({type,label,x,z,size,height,color});
const terrainCrystal=(label,x,z,color)=>terrainPiece('crystal',label,x,z,.9,1.2,color);
const presets={
 city:{name:'Ciudad low-poly',theme:'station',lighting:'sunset',generate(){
  const out=[];
  for(const x of [-8.5,8.5])for(const z of [-8,-3,3,8])out.push({type:'house',label:'Casa',x,z,size:2.4,height:3,color:x<0?'#b78d7a':'#759ac1'});
  for(const z of [-9,-5,-1,3,7])out.push({type:'road',label:'Avenida',x:0,z,size:2.4,height:.5,color:'#334155'});
  for(const x of [-5.6,5.6])for(const z of [-7,1,8])out.push({type:'lamp',label:'Farola',x,z,size:.8,height:3,color:'#fde68a'});
  for(const z of [-3,4])out.push({type:'car',label:'Auto estacionado',x:4.7,z,size:1.7,height:1.4,color:'#f472b6'});
  for(const x of [-3,3])out.push({type:'crystal',label:'Recompensa',x,z:-5,size:1,height:1.2,color:'#70f7f0'});
  return out;
 }},
 forest:{name:'Bosque aventura',theme:'forest',lighting:'cryo',generate(){
  const out=[];
  for(const x of [-9,-7,7,9])for(const z of [-9,-3,3,9])out.push({type:'tree',label:'Árbol',x,z,size:1.4,height:3.1,color:'#399b6d'});
  for(const [x,z] of [[-5,6],[5,7],[-6,-5],[5,-2],[-4,-9]])out.push({type:'rock',label:'Roca',x,z,size:1.2,height:1.3,color:'#8295a1'});
  for(const z of [7,2,-3,-8])out.push({type:'crystal',label:'Cristal',x:z>0?-2:2,z,size:1.1,height:1.2,color:'#73e3f9'});
  out.push({type:'arch',label:'Arco del bosque',x:0,z:-8,size:3,height:3,color:'#e7bd7e'});
  return out;
 }},
 track:{name:'Circuito 3D',theme:'island',lighting:'sunset',generate(){
  const out=[];
  for(const z of [-9,-5,-1,3,7])out.push({type:'road',label:'Pista principal',x:0,z,size:3,height:.5,color:'#475569'});
  for(const x of [-7,7])for(const z of [-9,-3,3,9])out.push({type:'wall',label:'Barrera',x,z,size:2.4,height:.9,color:'#b4bccb'});
  for(const [x,z] of [[-4,6],[4,3],[-4,-4],[4,-8]])out.push({type:'car',label:'Vehículo decorativo',x,z,size:1.4,height:1.5,color:'#fb7185'});
  for(const z of [8,2,-4,-8])out.push({type:'crystal',label:'Meta parcial',x:0,z,size:.7,height:1,color:'#e9d5ff'});
  out.push({type:'arch',label:'Arco de llegada',x:0,z:-10,size:3,height:3,color:'#facc15'});
  return out;
 }},
 cubes:{name:'Aldea de cubos',theme:'forest',lighting:'sunset',generate(){
  const o=[];
  for(const z of [8,3,-2,-7])o.push(terrainPiece('road','Sendero de tierra',0,z,3.2,.5,'#a57747'));
  for(const [x,z,wall] of [[-6.6,5,'#c79659'],[6.6,5,'#bd7858'],[-6.6,-4,'#aa774d'],[6.6,-4,'#d1ad73']]){
   o.push(terrainPiece('house','Cabaña de la aldea',x,z,2.5,2.8,wall));
   o.push(terrainPiece('crate','Huerto cuadrado',x+Math.sign(x)*2.4,z,1.45,.58,'#8dab58'));
  }
  for(const [x,z,height] of [[-9.5,9,1],[-9.5,3,1.3],[9.5,9,1],[9.5,1,1.15],[-8.5,-9,1.15],[8.5,-9,1.25]])o.push(terrainPiece('crate','Bloque de pasto',x,z,1.6,height,'#548a50'));
  for(const x of [-2.8,2.8])o.push(terrainPiece('lamp','Farol de madera',x,-3,.7,2.5,'#f6b553'));
  o.push(terrainPiece('arch','Entrada de la aldea',0,6,3.2,3.2,'#bc8b54'));
  o.push(terrainCrystal('Tesoro del huerto',-3.8,3.5,'#f7df78'),terrainCrystal('Tesoro del sendero',3.8,-6,'#88f2c5'));
  return o;
 }},
 mine:{name:'Mina de bloques',theme:'station',lighting:'alert',generate(){
  const o=[];
  for(const x of [-8.5,8.5])for(const z of [-8.5,-4.3,0,4.3,8.5]){
   o.push(terrainPiece('crate','Estrato de roca',x,z,2.7,2.5+(Math.abs(z)%2),'#526079'));
  }
  for(const z of [6,0,-6]){
   o.push(terrainPiece('arch','Soporte de madera',0,z,3.8,3.3,'#a47952'));
   o.push(terrainPiece('road','Galería central',0,z,3.3,.5,'#3d485b'));
  }
  for(const [x,z] of [[-5,5],[5,1],[-5,-4],[5,-8]])o.push(terrainPiece('lamp','Lámpara de mina',x,z,.6,2.2,'#eabb76'));
  for(const [x,z] of [[-5,7],[5,-4]])o.push(terrainPiece('pillar','Columna de piedra',x,z,1.2,2.6,'#68778e'));
  o.push(terrainCrystal('Gema verde',-3.3,3,'#58efae'),terrainCrystal('Gema azul',3.3,-3,'#71d9ff'),terrainCrystal('Gema violeta',0,-9,'#bd99ff'));
  return o;
 }},
 ice:{name:'Valle de hielo',theme:'island',lighting:'cryo',generate(){
  const o=[];
  for(const x of [-8.7,8.7])for(const [z,size,h] of [[8,2.5,1.6],[2.6,3,2.4],[-3,2.6,1.9],[-8.5,3,2.7]]){
   o.push(terrainPiece('crate','Banco de hielo',x,z,size,h,z>0?'#b5e4ee':'#82b6df'));
  }
  for(const [x,z,h] of [[-7,-9.8,3.5],[7,-9.8,4.5]])o.push(terrainPiece('mountain','Pico nevado',x,z,2.2,h,'#b9d8e5'));
  for(const [x,z] of [[-2.5,7.5],[2.5,3],[-2.5,-2],[2.5,-7]])o.push(terrainPiece('crate','Hielo bajo',x,z,1.8,.85,'#70a9d9'));
  for(const z of [6,1,-4,-9])o.push(terrainPiece('road','Paso escarchado',0,z,1.8,.5,'#d7f1ff'));
  for(const x of [-4.2,4.2])o.push(terrainPiece('beacon','Baliza polar',x,-5.6,.7,1.5,'#b0f9ff'));
  o.push(terrainCrystal('Copo del este',4.3,4.2,'#c1faff'),terrainCrystal('Copo del oeste',-4.3,-4.2,'#e2ecff'));
  return o;
 }},
 slalom:{name:'Parque de obstáculos',theme:'island',lighting:'sunset',generate(){
  const o=[],palette=['#f66b83','#ffc64e','#45dbab','#7599f8','#bb80ee'];
  for(const [i,z] of [7.2,3.4,-.3,-4,-7.8].entries()){
   const away=i%2===0?-1:1,color=palette[i];
   for(const x of [1.3,3.4,5.5])o.push(terrainPiece('crate','Bloque bajo del zigzag',away*x,z,1.48,.70+i%3*.13,color));
   o.push(terrainPiece('road','Carril alterno',-away*2.6,z,1.7,.5,color));
   o.push(terrainPiece('beacon','Marcador de color',-away*7,z,.6,1.3,color));
   if(i%2===0)o.push(terrainCrystal('Cristal del zigzag',-away*3.3,z+.4,'#fff1a8'));
  }
  o.push(terrainPiece('arch','Arco del parque',0,-9.7,3.2,2.8,'#f5d279'));
  return o;
 }},
 neon:{name:'Laboratorio neón',theme:'station',lighting:'cryo',generate(){
  const o=[];
  for(const [i,z] of [7.2,2,-3.2,-8.4].entries()){
   const x=i%2===0?3.2:-3.2,col=i%2===0?'#51cddb':'#be82f6';
   o.push(terrainPiece('wall','Panel de circuito',-x,z,3.5,1.4,col));
   o.push(terrainPiece('arch','Marco de luz',x,z-1,2.8,2.5,col));
   o.push(terrainPiece('road','Carril de laboratorio',x,z+.8,1.5,.5,col));
   for(const side of [-1,1])o.push(terrainPiece('lamp','Lámpara técnica',side*8.2,z,.64,2.9,col));
  }
  o.push(terrainPiece('drone','Dron de vigilancia',-5.8,0,1,1,'#ed739c'),terrainPiece('drone','Dron de vigilancia',5.8,-5,1,1,'#61d6d8'));
  o.push(terrainCrystal('Célula de energía',3.2,5.6,'#61f3ea'),terrainCrystal('Célula de energía',-3.2,-6,'#d7a5ff'));
  return o;
 }},
 fortress:{name:'Fortaleza de bloques',theme:'forest',lighting:'sunset',generate(){
  const o=[];
  for(const x of [-8.5,8.5])for(const z of [-8.3,-2.8,2.8,8.3]){
   o.push(terrainPiece('crate','Muro cuadrado',x,z,2.6,z<0?2.1:1.6,'#adb0aa'));
  }
  for(const [x,z] of [[-6.1,7.5],[6.1,7.5],[-6.1,-7.5],[6.1,-7.5]])o.push(terrainPiece('pillar','Torre cuadrada',x,z,1.9,3.4,'#77899a'));
  for(const [x,z] of [[-3.5,3.2],[3.5,.6],[-3.5,-2],[3.5,-4.6]])o.push(terrainPiece('wall','Muro del patio',x,z,3.5,1.6,'#9ca6ad'));
  for(const z of [7,-7])o.push(terrainPiece('arch',z>0?'Entrada del castillo':'Arco del patio',0,z,3.6,3,'#647c9c'));
  for(const x of [-4.5,4.5])o.push(terrainPiece('lamp','Farol del castillo',x,-6,.7,2.4,'#f4c46e'));
  o.push(terrainCrystal('Cristal del patio izquierdo',-5.6,0,'#93e7d6'),terrainCrystal('Cristal del patio derecho',5.6,-2.5,'#ffd685'),terrainCrystal('Cristal de la fortaleza',0,-9.4,'#d6c2ff'));
  return o;
 }}
};
const resources=[
 {name:'Blockbench',url:'https://blockbench.net/',detail:'Modelado 3D low-poly y animaciones · gratis, GPL · web/PC · programa externo'},
 {name:'Blender',url:'https://www.blender.org/',detail:'Modelado profesional, rigging y animación · gratis, GPL · requiere instalación'},
 {name:'Kenney',url:'https://kenney.nl/assets',detail:'Biblioteca de modelos y objetos para juegos · CC0 en las páginas de recursos'},
 {name:'Quaternius',url:'https://quaternius.com/',detail:'Modelos y personajes 3D optimizados · CC0'},
 {name:'Poly Haven',url:'https://polyhaven.com/',detail:'Modelos, materiales y HDRI profesionales · CC0 · recursos pesados'},
 {name:'Three.js',url:'https://threejs.org/',detail:'Motor gráfico web gratuito y abierto, MIT · aún no incorporado al motor propio'},
 {name:'Babylon.js',url:'https://www.babylonjs.com/',detail:'Motor 3D avanzado gratuito, Apache-2.0 · aún no incorporado al motor propio'}
];
function makeObject(spec,i){
 return {id:'kit-'+i+'-'+spec.type,type:spec.type,label:spec.label||spec.type,x:spec.x,z:spec.z,size:spec.size||1,height:spec.height||1.5,color:spec.color||'#67e8f9'};
}
function template(id){const p=presets[id];if(!p)return null;return {theme:p.theme,lighting:p.lighting,objects:p.generate().slice(0,MAX).map(makeObject)};}
const zoneOf=o=>o.zone||0,zGlobal=o=>o.z-DEPTH*zoneOf(o);
const zonesOf=cfg=>[{name:'Zona inicial',theme:cfg.theme},...(cfg.zones||[])];
const atZone=(cfg,zone)=>cfg.objects.filter(o=>zoneOf(o)===zone);
const activeZone=(studio,cfg)=>Math.max(0,Math.min(zonesOf(cfg).length-1,studio.expansionZone||0));
function appendZone(raw,id,source=0){
 const cfg=Studio3D.normalise(raw),zones=zonesOf(cfg),index=zones.length;
 if(index>=ZONE_MAX)throw Error('El recorrido admite hasta '+ZONE_MAX+' zonas.');
 if(!Number.isInteger(source)||!zones[source])throw Error('Seleccioná una zona válida.');
 let theme,name,sourceObjects;
 if(id==='copy'){({theme,name}=zones[source]);name=(name.slice(0,25)+' copia').slice(0,32);sourceObjects=atZone(cfg,source);}
 else if(id==='empty'){theme=zones[source].theme;name='Zona libre';sourceObjects=[];}
 else if(Object.hasOwn(presets,id)){const p=template(id);theme=p.theme;name=presets[id].name;sourceObjects=p.objects;}
 else throw Error('Elegí un ambiente válido.');
 const used=new Set(cfg.objects.map(o=>o.id));
 const added=sourceObjects.map((o,i)=>{let id='zona-'+(index+1)+'-objeto-'+(i+1),n=0;while(used.has(id))id='zona-'+(index+1)+'-objeto-'+(i+1)+'-'+(++n);used.add(id);return {...o,id,zone:index};});
 return Studio3D.normalise({...cfg,zones:[...cfg.zones,{name,theme}],objects:[...cfg.objects,...added]});
}
function validate(raw){
 const cfg=Studio3D.normalise(raw),objs=cfg.objects,last=zonesOf(cfg).length-1,portalZ=-12-DEPTH*last;
 const obstacles=objs.filter(o=>['crate','pillar','tree','house','car','wall','rock','lamp','mountain','airplane'].includes(o.type));
 const blocks=(x,z)=>obstacles.some(o=>Math.abs(x-o.x)<(o.type==='tree'?o.size*.25:o.size*.5)+.3&&Math.abs(z-zGlobal(o))<(o.type==='tree'?o.size*.25:o.size*.5)+.3);
 const seen=new Set(['0,11']),queue=[[0,11]];
 for(let i=0;i<queue.length;i++){
  const [x,z]=queue[i];for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const nx=x+dx,nz=z+dz,key=nx+','+nz;
   if(nx < -10||nx > 10||nz < portalZ||nz > 12||seen.has(key)||blocks(nx,nz))continue;
   seen.add(key);queue.push([nx,nz]);
  }
 }
 const crystals=objs.filter(o=>o.type==='crystal');
 const unreachable=crystals.filter(o=>!queue.some(([x,z])=>Math.hypot(x-o.x,z-zGlobal(o))<o.size*.6+.4));
 const finish=queue.some(([x,z])=>Math.abs(x)<1.4&&z<portalZ+1);
 const warnings=[];
 if(blocks(0,11))warnings.push('Un obstáculo cubre el punto de salida del personaje.');
 if(!finish)warnings.push('La salida del portal está bloqueada según la cuadrícula de prueba.');
 if(!crystals.length)warnings.push('No hay cristales: el portal se abrirá sin recolectar objetos.');
 if(unreachable.length)warnings.push(unreachable.length+' cristales no parecen alcanzables; revisá las barreras.');
 if(zonesOf(cfg).some((_,i)=>atZone(cfg,i).length>36))warnings.push('Las zonas cargadas pueden ir más lentas en PC antiguas: usá Calidad liviana.');
 return {ok:!warnings.some(w=>/bloquead|alcanzables|punto de salida/.test(w)),warnings,objects:objs.length,crystals:crystals.length,route:finish};
}
function read(cfg,studio){return window.Studio3D.normalise(window.StudioKits.read(studio.files)||cfg);}
function set(studio,next,selectedId,game){if(studio.busy||!studio.cloudReady)throw Error('Esperá a que termine el guardado o ingresá con tu código.');
 const safe=window.Studio3D.normalise(next);
 const files=studio.validFiles({...studio.files,...(game?{'game.js':game}:{}),'game-config.js':StudioKits.configFile(safe)});
 const visible=atZone(safe,activeZone(studio,safe));
 studio.checkpoint();studio.files=files;studio.selectedSceneObject=selectedId||visible.find(o=>o.id===studio.selectedSceneObject)?.id||visible[0]?.id||null;
 studio.changed();studio.refreshAll();studio.lock(false);return safe;
}
function download(data,name){
 const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
function exportObj(raw){
 const scene=window.Studio3D.normalise(raw),out=['# Krueka · geometria 3D low-poly · exportacion OBJ (sin animaciones ni texturas)','o Escenario_Krueka'];let index=1;
 const box=(name,x,y,z,w,h,d)=>{
  out.push('o '+name.replace(/[^a-zA-Z0-9_-]/g,'_'));const v=[
   [x-w/2,y,z-d/2],[x+w/2,y,z-d/2],[x+w/2,y,z+d/2],[x-w/2,y,z+d/2],
   [x-w/2,y+h,z-d/2],[x+w/2,y+h,z-d/2],[x+w/2,y+h,z+d/2],[x-w/2,y+h,z+d/2]];
  for(const p of v)out.push('v '+p.map(n=>Number(n.toFixed(4))).join(' '));
  for(const f of [[1,2,3,4],[5,8,7,6],[1,5,6,2],[2,6,7,3],[3,7,8,4],[4,8,5,1]])out.push('f '+f.map(i=>i+index-1).join(' '));
  index+=8;
 };
 const pyramid=(name,x,y,z,s,h)=>{
  out.push('o '+name.replace(/[^a-zA-Z0-9_-]/g,'_'));
  for(const p of [[x-s,y,z-s],[x+s,y,z-s],[x+s,y,z+s],[x-s,y,z+s],[x,y+h,z]])out.push('v '+p.map(n=>Number(n.toFixed(4))).join(' '));
  for(const f of [[1,2,3,4],[1,5,2],[2,5,3],[3,5,4],[4,5,1]])out.push('f '+f.map(i=>i+index-1).join(' '));
  index+=5;
 };
 zonesOf(scene).forEach((_,index)=>box(index?'suelo_zona_'+(index+1):'suelo',0,-.65,-DEPTH*index,24,.6,28));
 for(const o of scene.objects){
  const n=o.id,x=o.x,z=zGlobal(o),s=o.size,h=o.height;
  if(o.type==='crystal'){box(n+'_base',x,0,z,s,.15,s);pyramid(n+'_gema',x,.4,z,s*.35,s*.95);}
  else if(o.type==='tree'){box(n+'_tronco',x,0,z,s*.24,h*.45,s*.24);pyramid(n+'_copa',x,h*.2,z,s*.65,h*.9);}
  else if(o.type==='house'){box(n+'_pared',x,0,z,s,h*.75,s);pyramid(n+'_techo',x,h*.75,z,s*.72,h*.32);}
  else if(o.type==='car'){box(n+'_chasis',x,.2,z,s*.95,h*.3,s*1.6);box(n+'_cabina',x,h*.3+.18,z,s*.7,h*.35,s*.85);}
  else if(o.type==='mountain'){pyramid(n,x,0,z,s*.73,h);}
  else if(o.type==='airplane'){box(n+'_fuselaje',x,.27,z,s*.24,h*.42,s*1.27);box(n+'_alas',x,.39,z,s*1.52,.12,s*.32);}
  else if(o.type==='character'){box(n+'_cuerpo',x,h*.25,z,s*.68,h*.36,s*.45);box(n+'_cabeza',x,h*.61,z,s*.65,h*.29,s*.55);for(const dir of [-1,1]){box(n+'_pierna_'+dir,x+dir*s*.2,0,z,s*.23,h*.26,s*.29);box(n+'_brazo_'+dir,x+dir*s*.45,h*.27,z,s*.18,h*.28,s*.22);}}
  else if(o.type==='shield'){box(n,x,.24,z,s*.7,h,.17);}
  else if(o.type==='staff'){box(n,x,.1,z,s*.12,h,s*.12);}
  else if(o.type==='road')box(n,x,-.03,z,s,.06,s*1.8);
  else if(o.type==='wall')box(n,x,0,z,s,h,s*.24);
  else if(o.type==='rock')pyramid(n,x,0,z,s*.56,h);
  else if(o.type==='lamp'){box(n+'_poste',x,0,z,s*.15,h,s*.15);box(n+'_luz',x,h-.2,z,s*.6,.15,s*.5);}
  else if(o.type==='arch'){box(n+'_izquierda',x-s*.42,0,z,s*.2,h,s*.35);box(n+'_derecha',x+s*.42,0,z,s*.2,h,s*.35);box(n+'_alto',x,h-.22,z,s,.22,s*.4);}
  else box(n,x,0,z,s,h,s);
 }
 return out.join('\n')+'\n';
}
async function characterEngine(studio){
 const candidate=studio.files['game.js'],latest=Studio3D.create()['game.js'];
 if(candidate===latest)return latest;
 if(typeof candidate!=='string'||!globalThis.crypto?.subtle)throw Error('Este juego usa un motor distinto. Creá un Mundo 3D nuevo para usar esta herramienta sin cambiar tu código.');
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(candidate));
 const hex=Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');
 if(!LEGACY_ENGINE_SHA.has(hex))throw Error('Este juego usa un motor distinto. Creá un Mundo 3D nuevo para usar esta herramienta sin cambiar tu código.');
 return latest;
}
async function commitScene(studio,next,selectedId,upgrade=false){
 const previous=studio.files,code=previous['game.js'],level=previous['game-config.js'],project=studio.projectId,owner=studio.sid?.();
 const game=upgrade||next.zones?.length||next.objects.some(o=>o.type==='character')?await characterEngine(studio):null;
 if(studio.files!==previous||studio.files['game.js']!==code||studio.files['game-config.js']!==level||studio.projectId!==project||studio.sid?.()!==owner)throw Error('Cambió el proyecto. Repetí la acción en el mundo que estás editando.');
 return set(studio,next,selectedId,game);
}
async function importScene(studio,file){
 if(!file||file.size>100000)throw Error('Elegí un archivo JSON de hasta 100 KB.');
 const incoming=JSON.parse(await file.text());
 if(!incoming||incoming.format!=='krueka-scene' || incoming.version!==1 || !incoming.scene || !Array.isArray(incoming.scene.objects))throw Error('Este no es un archivo de escena de Krueka.');
 const importedZones=Array.isArray(incoming.scene.zones)?incoming.scene.zones:[];
 if(importedZones.length>=ZONE_MAX)throw Error('La escena supera el máximo de zonas.');
 const counts=Array(importedZones.length+1).fill(0);
 for(const o of incoming.scene.objects){
  const index=o?.zone??0;
  if(!Number.isInteger(index)||index<0||index>importedZones.length)throw Error('Hay una pieza asignada a una zona inexistente.');
  if(++counts[index]>MAX)throw Error('Una zona supera el máximo de objetos.');
 }
 const next=window.Studio3D.normalise(incoming.scene);
 if(!confirm('Se reemplazará el escenario de ESTE proyecto. Podés volver con Deshacer. ¿Importar?'))return false;
 await commitScene(studio,next);return true;
}
const MINE='mis-plantillas-3d.json';
const categories=[
 ['ambiente','Ambientes'],['personaje','Personajes'],['movimiento','Movimientos'],['material','Materiales'],
 ['vehiculo','Vehículos'],['prop','Accesorios de fantasía'],['reto','Retos']
];
const newTypes=['mountain','airplane','shield','staff'];
const types=['crystal','tree','house','car','road','wall','rock','lamp','arch','crate','pillar','beacon',...newTypes];
const avatars=Studio3D.avatarProfiles();
const enumOptions={theme:['station','forest','island'],lighting:['cryo','alert','sunset'],avatarStyle:Object.keys(avatars),camera:['follow','orbit']};
const optionsByGroup={ambiente:['theme','lighting'],personaje:['avatarColor','avatarStyle'],movimiento:['speed','jumpEnabled','camera'],material:[],vehiculo:[],prop:[],reto:['seconds']};
const labels={theme:'Ambiente del suelo',lighting:'Iluminación',avatarStyle:'Modelo del personaje',avatarColor:'Color del personaje',camera:'Cámara',speed:'Velocidad',jumpEnabled:'Puede saltar',seconds:'Tiempo en segundos'};
const item=(type,label,x,z,size,height,color)=>({type,label,x,z,size,height,color});
const piece=(category,name,settings={},objects=[])=>({version:1,category,name,settings,objects});
function library(){
 const aliases={city:'Barrio con avenida',forest:'Bosque con sendero',track:'Circuito de práctica'};
 const components=Object.entries(presets).map(([id,preset])=>{
  const {theme,lighting,objects}=template(id);
  // Library pieces decorate the current zone without adding new objectives.
  return piece('ambiente',aliases[id]||preset.name,{theme,lighting},objects.filter(o=>!['crystal','drone'].includes(o.type)).map(({id,...o})=>o));
 });
 return [...components,
  piece('ambiente','Montañas nevadas',{theme:'island',lighting:'cryo'},[item('mountain','Pico norte',-8,-8,3.5,5,'#717d9e'),item('mountain','Pico este',8,-8,3.4,4.5,'#8896b5'),item('rock','Roca del sendero',-5,-2,1.1,1.1,'#9aa3ad')]),
  piece('ambiente','Orilla al atardecer',{theme:'island',lighting:'sunset'},[item('road','Pasarela',0,-2,3,.5,'#b98d64'),item('tree','Árbol de la orilla',-6,-4,1.5,3,'#39796a'),item('lamp','Luz del muelle',6,-4,.7,2.6,'#ffda77')]),
  ...Object.entries(avatars).map(([avatarStyle,p])=>piece('personaje',p.name,{avatarStyle,avatarColor:p.color})),
  piece('movimiento','Caminar despacio',{speed:3,jumpEnabled:false,camera:'follow'}),
  piece('movimiento','Correr y saltar',{speed:7,jumpEnabled:true,camera:'follow'}),
  piece('movimiento','Explorar con cámara fija',{speed:5,jumpEnabled:true,camera:'orbit'}),
  piece('material','Bloque de madera',{},[item('crate','Madera',-4,3,1.6,1.2,'#9b6545')]),
  piece('material','Muro de piedra',{},[item('wall','Piedra',5,3,2.4,1.4,'#99a4b3')]),
  piece('material','Columna de metal',{},[item('pillar','Metal',5,-3,1.4,2.9,'#72899f')]),
  piece('vehiculo','Auto de paseo',{},[item('car','Auto',4,2,1.7,1.5,'#eb775f')]),
  piece('vehiculo','Avión de exhibición',{},[item('airplane','Avión',-5,-5,2.8,1.5,'#84b3e4')]),
  piece('vehiculo','Avioneta roja',{},[item('airplane','Avioneta',5,-5,2.1,1.5,'#eb6f83')]),
  piece('prop','Escudo de fantasía',{},[item('shield','Escudo',-3,-1,1.35,1.45,'#3e9f99')]),
  piece('prop','Vara de luz',{},[item('staff','Vara de luz',3,-2,1.1,1.85,'#9d7af0')]),
  piece('reto','Tres cristales para la misión',{seconds:120},[item('crystal','Cristal oeste',-4,4,1,1.1,'#64e1ee'),item('crystal','Cristal este',4,0,1,1.1,'#ffcd61'),item('crystal','Cristal del fondo',0,-8,1,1.1,'#ad9cff')])
 ];
}
function bounded(v,min,max){return typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;}
function pickSetting(key,v){
 if(Object.hasOwn(enumOptions,key))return enumOptions[key].includes(v);
 return key==='avatarColor'?/^#[0-9a-f]{6}$/i.test(String(v)):key==='speed'?bounded(v,2,9):
  key==='jumpEnabled'?typeof v==='boolean':key==='seconds'?Number.isInteger(v)&&bounded(v,30,300):false;
}
function syntaxError(error,raw){
 const reason=String(error?.message||'');
 const explicit=reason.match(/line (\d+) column (\d+)/i);
 const pos=reason.match(/position (\d+)/i);
 if(explicit)return 'Sintaxis · línea '+explicit[1]+', columna '+explicit[2]+': revisá las comillas, comas o llaves.';
 if(pos){const lines=raw.slice(0,Number(pos[1])).split('\n');return 'Sintaxis · línea '+lines.length+', columna '+(lines.at(-1).length+1)+': revisá las comillas, comas o llaves.';}
 const lines=raw.split('\n');return 'Sintaxis JSON: revisá comillas y comas; si falta una llave de cierre, mirá la línea '+lines.length+'.';
}
function parsePiece(raw){
 let p;const bad=m=>{throw Error('Coherencia · '+m);};
 if(typeof raw!=='string'||raw.length>16000)bad('Pegá una plantilla de hasta 16.000 caracteres.');
 try{p=JSON.parse(raw);}catch(e){throw Error(syntaxError(e,raw));}
 if(!p||p.version!==1||!Object.hasOwn(optionsByGroup,p.category)||typeof p.name!=='string'||!p.name.trim()||p.name.length>48||
  Object.keys(p).some(k=>!['version','category','name','settings','objects'].includes(k)))bad('La plantilla necesita versión 1, categoría, nombre, ajustes y objetos.');
 if(!p.settings||typeof p.settings!=='object'||Array.isArray(p.settings)||!Array.isArray(p.objects)||p.objects.length>30)bad('Revisá los ajustes y la lista de objetos (máximo 30).');
 const allowed=optionsByGroup[p.category];
 for(const [k,v] of Object.entries(p.settings))if(!allowed.includes(k)||!pickSetting(k,v))bad('En ajustes, «'+(labels[k]||k)+'» no admite ese valor o no corresponde a la categoría.');
 const validTypes={ambiente:types,personaje:[],movimiento:[],material:['crate','wall','pillar','road','rock'],vehiculo:['car','airplane'],prop:['shield','staff','beacon'],reto:['crystal']};
 const objects=p.objects.map((o,i)=>{
  const where='Objeto '+(i+1)+': ';
  if(!o||typeof o!=='object'||Object.keys(o).some(k=>!['type','label','x','z','size','height','color'].includes(k))||!validTypes[p.category].includes(o.type))bad(where+'el molde no existe en esta categoría.');
  if(typeof o.label!=='string'||!o.label.trim()||o.label.length>32)bad(where+'poné un nombre de hasta 32 caracteres.');
  if(!bounded(o.x,-10,10)||!bounded(o.z,-12,12))bad(where+'X debe ir de -10 a 10 y Z de -12 a 12.');
  if(!bounded(o.size,.4,4)||!bounded(o.height,.5,5))bad(where+'tamaño de 0.4 a 4 y altura de 0.5 a 5.');
  if(typeof o.color!=='string'||!/^#[0-9a-f]{6}$/i.test(o.color))bad(where+'el color debe tener formato #RRGGBB, por ejemplo #389A76.');
  return {type:o.type,label:o.label,x:o.x,z:o.z,size:o.size,height:o.height,color:o.color};
 });
 if(!objects.length&&!Object.keys(p.settings).length)bad('La plantilla no contiene ningún cambio.');
 return piece(p.category,p.name.trim(),p.settings,objects);
}
function freeCharacterSpot(objects){
 for(const z of [4,2,6,0,-2,8,-4,-6,-8,-10,10])for(const x of [3,-3,0,6,-6,9,-9])
  if(!objects.some(o=>Math.hypot(o.x-x,o.z-z)<Math.max(1.4,o.size*.7)))return {x,z};
 throw Error('No se encontró un lugar libre. Mové algún objeto para sumar otro personaje.');
}
function mergePiece(raw,p,protagonist=false,zone=0){
 const cfg=Studio3D.normalise(raw),objects=[...cfg.objects],local=atZone(cfg,zone);
 if(!zonesOf(cfg)[zone])throw Error('Seleccioná una zona existente.');
 const adding=p.category==='personaje'&&!protagonist;
 const pieces=adding?[{type:'character',label:p.name.slice(0,32),...freeCharacterSpot(local),size:1,height:2,color:p.settings.avatarColor||cfg.avatarColor,avatarStyle:p.settings.avatarStyle||cfg.avatarStyle}]:p.objects;
 if(local.length+pieces.length>MAX)throw Error('No hay espacio. Cada zona admite hasta '+MAX+' objetos. No se agregó nada.');
 let seq=0;const used=new Set(objects.map(o=>o.id));
 pieces.forEach(o=>{
  if(local.some(old=>old.type===o.type&&old.x===o.x&&old.z===o.z))throw Error('Coherencia · «'+o.label+'» ya está en esas coordenadas. Cambiá X o Z antes de agregar otra copia.');
  let id;do{id='pieza-'+(++seq);}while(used.has(id));used.add(id);const entry={...o,id,zone};objects.push(entry);local.push(entry);
 });
 const next={...cfg,...(adding?{}:p.settings),objects};
 if(zone&&p.settings.theme){next.theme=cfg.theme;next.zones=cfg.zones.map((entry,i)=>i===zone-1?{...entry,theme:p.settings.theme}:entry);}
 return Studio3D.normalise(next);
}
function initialWorld(){
 const files=Studio3D.create();
 files['game-config.js']=StudioKits.configFile(Studio3D.normalise({title:'Mi mundo 3D',theme:'forest',lighting:'sunset',objects:[
  {...item('crystal','Cristal de prueba',0,1,1,1,'#65d8ee'),id:'cristal-prueba'}
 ]}));
 files['tipo-club.txt']='juegos';
 files[MINE]='[]';
 return files;
}
async function newWorld(studio){
 if(!studio.cloudReady||studio.busy)return;
 const before=studio.projectId;
 await studio.startProject(initialWorld(),'Mi mundo 3D');
 if(studio.projectId!==before)studio.showTab('create');
}
function customParts(studio){
 try{const value=JSON.parse(studio.files[MINE]||'[]');return Array.isArray(value)?value.slice(0,12).map(x=>parsePiece(JSON.stringify(x))):[];}catch(_e){return [];}
}
let draftOwner='',draftCode='',draftOpen=false;
const sceneTypes={
 character:['Personaje','●','cast'],drone:['Dron','▲','cast'],
 crystal:['Cristal','◆','mission'],beacon:['Baliza','✦','mission'],
 tree:['Árbol','▲','terrain'],house:['Casa','⌂','terrain'],road:['Camino','═','terrain'],wall:['Muro','▬','terrain'],rock:['Roca','◆','terrain'],lamp:['Farola','✦','terrain'],mountain:['Montaña','▲','terrain'],arch:['Arco','∩','terrain'],
 crate:['Bloque','■','props'],pillar:['Columna','▏','props'],car:['Auto','▰','props'],airplane:['Avión','✈','props'],shield:['Escudo','◇','props'],staff:['Vara de luz','✦','props']
};
const groupNames={cast:'Personajes',terrain:'Escenario',props:'Piezas y vehículos',mission:'Retos y cristales'};
let panelOwner='',panelState={};
function avatarOptions(select){
 for(const [isBlock,title] of [[false,'Clásicos'],[true,'Estilo de bloques']]){
  const group=document.createElement('optgroup');group.label=title;
  for(const [id,p] of Object.entries(avatars))if(!!p.block===isBlock)group.append(new Option(p.short,id));
  select.append(group);
 }
}
const worldPosition=(x,z)=>[6+(x+10)*4.4,6+(z+12)*88/24];
function pieceEditor(studio,source,{existing=false}={}){
 const app=document.getElementById('krueka-studio');
 if(!app||studio.busy||!studio.cloudReady||app.querySelector('#k3d-piece-editor'))return;
 const openingProject=studio.projectId,ownership=studio.sid?.(),openingConfig=studio.files['game-config.js'];
 const cfg=read({},studio),dialog=document.createElement('dialog');
 const zone=existing?zoneOf(source):activeZone(studio,cfg),local=atZone(cfg,zone);
 if(!existing&&local.length>=MAX){window.alert('Esta zona ya tiene '+MAX+' objetos. Elegí otra zona o quitá uno.');return;}
 dialog.id='k3d-piece-editor';dialog.setAttribute('aria-labelledby','k3d-piece-title');dialog.className='ks-settings';
 dialog.innerHTML='<header><div><div class="ks-section-label" id="k3d-step">1 DE 2 · EDITÁ LA PIEZA</div><h2 id="k3d-piece-title">Editar pieza</h2></div><button type="button" id="k3d-piece-close" class="ks-btn">Cancelar</button></header>'+
  '<section id="k3d-detail-step"><div class="k3d-detail-layout"><div class="k3d-detail-preview"><iframe id="k3d-piece-model" title="Vista 3D de la pieza, independiente del mundo" sandbox="allow-scripts"></iframe><p>Girá la pieza con el mouse, el dedo o los botones.</p></div>'+
  '<div id="k3d-detail-fields"><label>Nombre<input id="k3d-piece-name" maxlength="32" required></label><label>Molde<select id="k3d-piece-type"></select></label><label id="k3d-piece-style-row">Forma del personaje<select id="k3d-piece-style"></select></label>'+
  '<div class="ks-fields"><label>Color<input id="k3d-piece-color" type="color"></label><label>Tamaño<input id="k3d-piece-size" type="number" min="0.4" max="4" step="0.1" required></label><label id="k3d-piece-height-row">Altura<input id="k3d-piece-height" type="number" min="0.5" max="5" step="0.1" required></label></div></div></div>'+
  '<div class="k3d-piece-actions"><button type="button" class="ks-btn primary" id="k3d-place-step">Elegir dónde colocar →</button></div></section>'+
  '<section id="k3d-position-step" hidden><p>Tocá el plano para elegir un lugar o ajustá las coordenadas. Nada cambia hasta confirmar.</p>'+
  '<div class="k3d-position-layout"><div id="k3d-placement-map" aria-label="Plano de colocación"></div><div class="k3d-position-fields"><label>Posición X · izquierda/derecha<input id="k3d-place-x" type="number" min="-10" max="10" step="any" required></label><label>Posición Z · adelante/atrás<input id="k3d-place-z" type="number" min="-12" max="12" step="any" required></label><p id="k3d-placement-note" role="status"></p></div></div>'+
  '<div class="k3d-piece-actions"><button type="button" class="ks-btn" id="k3d-piece-edit-back">← Volver a editar</button><button type="button" class="ks-btn" id="k3d-place-commit">Colocar en el mundo</button><button type="button" class="ks-btn primary" id="k3d-place-play">Colocar y probar</button></div></section>'+
  '<p id="k3d-piece-status" role="status"></p>';
 app.append(dialog);
 const q=name=>dialog.querySelector('#k3d-'+name),frame=q('piece-model'),status=q('piece-status');
 const detail=q('detail-step'),position=q('position-step'),map=q('placement-map');
 const fields={'label':q('piece-name'),'type':q('piece-type'),'avatarStyle':q('piece-style'),'color':q('piece-color'),'size':q('piece-size'),'height':q('piece-height')};
 let placing=false,committing=false;
 const kind=source.type||'character', current=cfg.objects.find(o=>o.id===source.id);
 let suggested={x:source.x,z:source.z};
 if(suggested.x==null||suggested.z==null){
  try{suggested=freeCharacterSpot(local);}catch(e){suggested={x:3,z:4};}
 }
 for(const [id,[name]] of Object.entries(sceneTypes))fields.type.add(new Option(name,id));
 const draft={id:source.id,type:kind,label:source.label||sceneTypes[kind][0],avatarStyle:source.avatarStyle||'robot',color:source.color||(kind==='character'?'#a5b4fc':'#67e8f9'),size:source.size??1,height:source.height??(kind==='character'?2:1.5),...suggested};
 avatarOptions(fields.avatarStyle);
 for(const [key,field] of Object.entries(fields))field.value=draft[key];
 const x=q('place-x'),z=q('place-z');x.value=draft.x;z.value=draft.z;
 const shape=()=>Studio3D.normalise({objects:[{
  ...draft,type:fields.type.value,label:fields.label.value.trim()||draft.label,
  size:Number.isFinite(fields.size.valueAsNumber)?fields.size.valueAsNumber:draft.size,
  height:Number.isFinite(fields.height.valueAsNumber)?fields.height.valueAsNumber:draft.height,
  avatarStyle:fields.avatarStyle.value,color:fields.color.value
 }]}).objects[0];
 const model=()=>{
  const o=shape();
  q('piece-title').textContent=o.label;
  q('piece-style-row').hidden=o.type!=='character';
  q('piece-height-row').hidden=['road','crystal','drone'].includes(o.type);
  frame.contentWindow?.postMessage({type:'krueka-piece-model',object:o},'*');
 };
 for(const field of Object.values(fields)){field.addEventListener('input',model);field.addEventListener('change',model);}
 fields.type.onchange=()=>{if(!existing&&fields.label.value===draft.label){draft.label=sceneTypes[fields.type.value][0];fields.label.value=draft.label;model();}};
 frame.onload=model;frame.srcdoc=Studio3D.piecePreview();
 function mark(text,x,z,tag,color){
  const point=document.createElement('span');const [left,top]=worldPosition(x,z);
  point.style.left=left+'%';point.style.top=top+'%';if(color)point.style.setProperty('--dot',color);
  point.className=tag;point.title=text;point.textContent=tag==='k3d-place-existing'?'•':text;map.append(point);return point;
 }
 for(const o of local)if(!existing||o.id!==source.id)mark(o.label,o.x,o.z,'k3d-place-existing',o.color);
 mark(zone?'Desde '+zonesOf(cfg)[zone-1].name:'Inicio',0,11,'k3d-place-landmark');
 mark(zone===zonesOf(cfg).length-1?'Portal':'Próxima zona',0,-12,'k3d-place-landmark');
 const marker=mark('✚',draft.x,draft.z,'k3d-place-marker',draft.color);
 function coords(){
  const vx=x.valueAsNumber,vz=z.valueAsNumber,valid=x.validity.valid&&z.validity.valid;
  marker.hidden=!valid;
  if(!valid){q('placement-note').textContent='Ingresá una posición dentro del plano.';return;}
  const [left,top]=worldPosition(vx,vz);marker.style.left=left+'%';marker.style.top=top+'%';
  marker.style.setProperty('--dot',fields.color.value);
  const occupied=local.some(o=>(!existing||o.id!==source.id)&&Math.hypot(o.x-vx,o.z-vz)<.8);
  q('placement-note').textContent=occupied?'Hay otro objeto cerca. Si querés, elegí un lugar libre.':'La cruz marca el lugar de tu pieza.';
 }
 x.oninput=z.oninput=coords;
 map.onclick=e=>{
  if(committing)return;
  const r=map.getBoundingClientRect(),c=(p,start,side,max)=>Math.max(-max,Math.min(max,Math.round(((p-start)/side-.5)*2*max/.88)));
  x.value=c(e.clientX,r.left,r.width,10);z.value=c(e.clientY,r.top,r.height,12);coords();
 };
 function go(to){
  placing=to;detail.hidden=placing;position.hidden=!placing;status.textContent='';
  q('step').textContent=placing?'2 DE 2 · UBICÁ LA PIEZA':'1 DE 2 · EDITÁ LA PIEZA';
  if(placing){coords();x.focus();}else{fields.label.focus();model();}
 }
 q('place-step').onclick=()=>{if(Object.values(fields).every(el=>el.closest('[hidden]')||el.reportValidity())&&fields.label.value.trim())go(true);else status.textContent='Revisá el nombre y las medidas de la pieza.';};
 q('piece-edit-back').onclick=()=>go(false);
 function dismiss(){if(!committing)dialog.close();}
 q('piece-close').onclick=dismiss;
 dialog.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey)e.stopPropagation();});
 dialog.addEventListener('cancel',e=>{if(committing)e.preventDefault();});
 dialog.addEventListener('close',()=>dialog.remove(),{once:true});
 async function place(play){
  if(committing||!placing||!x.reportValidity()||!z.reportValidity())return;
  if(studio.projectId!==openingProject||studio.sid?.()!==ownership||studio.files['game-config.js']!==openingConfig){status.textContent='El proyecto cambió. Cerrá esta ficha y volvé a abrir la pieza.';return;}
  if(studio.busy||!studio.cloudReady){status.textContent='Esperá a que termine el guardado e intentá de nuevo.';return;}
  const ids=new Set(cfg.objects.map(o=>o.id));let seq=0;
  const o={...shape(),zone,x:x.valueAsNumber,z:z.valueAsNumber};
  if(existing&&current)o.id=current.id;
  else {while(ids.has('objeto-'+(++seq)));o.id='objeto-'+seq;}
  const next=Studio3D.normalise({...cfg,objects:existing?cfg.objects.map(item=>item.id===o.id?o:item):[...cfg.objects,o]});
  if(existing&&!current)return;
  const result=validate(next),old=validate(cfg);
  const introduced=result.warnings.find(w=>/bloquead|alcanzables|punto de salida/.test(w)&&!old.warnings.includes(w));
  if(introduced){status.textContent=introduced+' Elegí otro lugar para colocar la pieza.';return;}
  committing=true;for(const button of dialog.querySelectorAll('button'))button.disabled=true;
  try{
   studio.builderNotice='✓ '+o.label+' '+(existing?'actualizado.':'colocado en el mundo.');
   await commitScene(studio,next,o.id,newTypes.includes(o.type));
   dialog.close();if(play)studio.playCurrent();
  }catch(e){studio.builderNotice='';status.textContent=e.message;}
  finally{committing=false;for(const button of dialog.querySelectorAll('button'))button.disabled=false;}
 }
 q('place-commit').onclick=()=>place(false);q('place-play').onclick=()=>place(true);
 dialog.showModal();fields.label.focus({preventScroll:true});
}

function scenePanel(studio,section,cfg){
 const id=(studio.sid?.()||'')+'|'+studio.projectId;
 if(id!==panelOwner){panelOwner=id;panelState={group:'all',search:'',grid:true,zoom:1,pane:'3d',moving:false};}
 const zone=activeZone(studio,cfg),local=atZone(cfg,zone);
 const ui=panelState,locked=()=>studio.busy||!studio.cloudReady;
 const article=document.createElement('section');article.id='k3d-scene-panel';article.className='ks-settings';
 article.innerHTML='<header><div><h3>Objetos de escena</h3><small>'+local.length+' / '+MAX+' objetos · '+esc(zonesOf(cfg)[zone].name)+'</small></div><div class="k3d-add-buttons"><button type="button" class="ks-btn primary" id="k3d-new-character">＋ Personaje</button><button type="button" class="ks-btn" id="k3d-quick-add" aria-expanded="false">＋ Objeto</button></div></header>'+
  '<div class="k3d-command" role="group" aria-label="Herramientas de escena">'+
  '<button type="button" class="ks-btn" data-view="map">Plano 2D</button><button type="button" class="ks-btn" data-view="3d">Vista 3D</button>'+
  '<button type="button" class="ks-btn" id="k3d-undo" data-suite-undo>↶ Deshacer</button><button type="button" class="ks-btn" id="k3d-redo" data-suite-redo>↷ Rehacer</button></div>'+
  '<div id="k3d-quick-fields" class="k3d-quick" hidden><label>Objeto nuevo<select id="k3d-new-kind"></select></label><button type="button" class="ks-btn primary" id="k3d-quick-put">Editar pieza</button></div>'+
  '<div class="ks-fields k3d-filters"><label>Buscar objetos<input type="search" id="k3d-search" placeholder="Ej.: robot"></label><label>Mostrar<select id="k3d-group"><option value="all">Todos los objetos</option></select></label></div>'+
  '<div id="k3d-map-controls" class="k3d-command" hidden><button type="button" id="k3d-grid" class="ks-btn">Cuadrícula</button><button type="button" id="k3d-zoom-out" class="ks-btn" aria-label="Alejar plano">−</button><button type="button" id="k3d-zoom-in" class="ks-btn" aria-label="Acercar plano">＋</button><button type="button" id="k3d-move" class="ks-btn">Mover en el plano</button></div>'+
  '<p id="k3d-map-help" hidden>Marcá un objeto. Para cambiarlo de lugar, activá «Mover en el plano» y tocá una posición. También podés usar X y Z en Propiedades.</p>'+
  '<div id="k3d-map-scroll" hidden><div id="k3d-map" aria-label="Plano del mundo visto desde arriba"></div></div>'+
  '<div id="k3d-scene-list" class="ks-scene-list" aria-label="Objetos de escena"></div>'+
  '<details id="k3d-properties"><summary>Propiedades del objeto</summary><div id="k3d-inspector"></div></details><p id="k3d-scene-feedback" class="ks-class-note" role="status"></p>';
 section.append(article);
 const q=name=>article.querySelector('#k3d-'+name),map=q('map'),status=q('scene-feedback');
 const btn=(text,onClick)=>{const b=document.createElement('button');b.type='button';b.className='ks-btn';b.textContent=text;b.onclick=onClick;return b;};
 let selected=local.find(o=>o.id===studio.selectedSceneObject);
 if(ui.notice){status.textContent=ui.notice;ui.notice='';}
 q('quick-fields').hidden=!ui.addOpen;q('quick-add').setAttribute('aria-expanded',String(!!ui.addOpen));
 q('quick-add').onclick=()=>{ui.addOpen=q('quick-fields').hidden;q('quick-fields').hidden=!ui.addOpen;q('quick-add').setAttribute('aria-expanded',String(ui.addOpen));if(ui.addOpen)q('new-kind').focus();};
 for(const [key,label] of Object.entries(groupNames))q('group').add(new Option(label,key));
 for(const [key,[label]] of Object.entries(sceneTypes)){
  q('new-kind').add(new Option(label,key));
 }
 q('new-kind').value=ui.kind||'character';if(!q('new-kind').value)q('new-kind').value='character';
 q('new-kind').onchange=()=>ui.kind=q('new-kind').value;
 q('search').value=ui.search;q('group').value=ui.group;
 q('search').oninput=()=>{ui.search=q('search').value;paint();};
 q('group').onchange=()=>{ui.group=q('group').value;paint();};
 q('undo').disabled=!studio.undo?.length;q('redo').disabled=true;
 q('undo').onclick=()=>studio.restore();
 q('redo').onclick=()=>window.ClubWorkshopSuite?.redo?.();
 q('properties').open=!!ui.props;
 q('properties').ontoggle=()=>{if(article.isConnected)ui.props=q('properties').open;};
 async function update(next,select,message){
  if(locked()||!article.isConnected)return;
  ui.notice=message;
  try{await commitScene(studio,next,select);}
  catch(e){ui.notice='';status.textContent=e.message;}
 }
 const unique=()=>{const ids=new Set(cfg.objects.map(o=>o.id));let next=0;while(ids.has('objeto-'+(++next)));return 'objeto-'+next;};
 function add(source,copy=false){
  if(locked())return;
  if(local.length>=MAX){status.textContent='Esta zona llegó a '+MAX+' objetos. Elegí otra zona o quitá uno.';return;}
  try{
   const spot=freeCharacterSpot(local);
   const object={label:sceneTypes[source.type][0],size:1,height:source.type==='character'?2:1.5,color:source.type==='character'?'#a5b4fc':'#67e8f9',...source,...spot,id:unique(),zone};
   if(copy)object.label=(source.label.slice(0,26)+' copia');
   ui.props=true;ui.search='';ui.group='all';
   update({...cfg,objects:[...cfg.objects,object]},object.id,'✓ '+object.label+' agregado al mundo.');
  }catch(e){status.textContent=e.message;}
 }
 q('new-character').onclick=()=>pieceEditor(studio,{type:'character'});
 q('quick-put').onclick=()=>pieceEditor(studio,{type:q('new-kind').value});
 function select(o,fromMap=false){
  selected=o;studio.selectedSceneObject=o.id;
  q('properties').open=ui.props=true;
  document.getElementById('ks-frame')?.contentWindow?.postMessage({type:'krueka-scene-highlight',id:o.id},'*');
  paint();inspector();
  (fromMap?map:article).querySelector('[data-k3d-id="'+o.id+'"]')?.focus();
  if(!fromMap)pieceEditor(studio,o,{existing:true});
 }
 const place=(node,x,z)=>{node.style.left=((x+10)/20*88+6)+'%';node.style.top=((z+12)/24*88+6)+'%';};
 function paint(){
  const visible=local.filter(o=>(ui.group==='all'||sceneTypes[o.type]?.[2]===ui.group)&&(o.label+' '+(sceneTypes[o.type]?.[0]||'')).toLocaleLowerCase().includes(ui.search.trim().toLocaleLowerCase()));
  const list=q('scene-list');list.replaceChildren();map.replaceChildren();
  for(const [label,x,z] of [[zone?'← Zona anterior':'Inicio',0,11],[zone===zonesOf(cfg).length-1?'Portal':'Siguiente zona →',0,-12]]){
   const marker=document.createElement('span');marker.className='k3d-marker';marker.textContent=label;place(marker,x,z);map.append(marker);
  }
  for(const o of visible){
   const [kind,symbol]=sceneTypes[o.type];
   for(const onMap of [false,true]){
    const b=btn(onMap?symbol:o.label,()=>select(o,onMap));b.dataset.k3dId=o.id;b.setAttribute('aria-pressed',String(o.id===selected?.id));
    if(onMap){b.classList.add('k3d-point');b.style.setProperty('--object-color',o.color);b.title=o.label;b.setAttribute('aria-label',o.label);place(b,o.x,o.z);map.append(b);}
    else{const type=document.createElement('small');type.textContent=kind;b.append(type);list.append(b);}
   }
  }
  if(!visible.length)list.textContent=local.length?'No hay objetos que coincidan con el filtro.':'Todavía no agregaste objetos a esta zona.';
 }
 function inspector(){
  const form=q('inspector');form.replaceChildren();
  if(!selected){form.textContent='Elegí un objeto de la lista o del plano.';return;}
  const o=selected,fields=document.createElement('div');fields.className='ks-fields';const inputs={};
  function field(name,title,type,min,max){
   const label=document.createElement('label');label.textContent=title;
   const el=document.createElement(type==='model'?'select':'input');
   if(type==='model')avatarOptions(el);
   else{el.type=type;if(type==='text'){el.maxLength=32;el.required=true;}if(type==='number'){el.min=min;el.max=max;el.step='any';el.required=true;}}
   el.value=o[name];inputs[name]=el;label.append(el);fields.append(label);
  }
  field('label','Nombre','text');field('color','Color','color');
  if(o.type==='character')field('avatarStyle','Modelo del personaje','model');
  field('x','Posición X','number',-10,10);field('z','Posición Z','number',-12,12);
  field('size','Tamaño','number',.4,4);field('height','Altura','number',.5,5);
  const actions=document.createElement('div');actions.className='k3d-command';
  actions.append(btn('Aplicar cambios',()=>{
   if(!Object.values(inputs).every(input=>input.reportValidity()))return;
   const patch=Object.fromEntries(Object.entries(inputs).map(([key,el])=>[key,el.type==='number'?el.valueAsNumber:el.value]));
   move({...patch,label:patch.label.trim()||o.label},'✓ Objeto actualizado.');
  }),btn('Duplicar',()=>add(o,true)),btn('Quitar',()=>{
   ui.props=false;update({...cfg,objects:cfg.objects.filter(other=>other.id!==o.id)},null,'✓ Objeto quitado. Podés deshacer.');
  }));
  form.append(fields,actions);
 }
 function move(patch,msg){
  if(!selected)return;
  update({...cfg,objects:cfg.objects.map(o=>o.id===selected.id?{...o,...patch}:o)},selected.id,msg);
 }
 const mode=()=>{
  const show=ui.pane==='map';
  for(const name of ['map-scroll','map-controls','map-help'])q(name).hidden=!show;
  article.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===ui.pane)));
  map.classList.toggle('k3d-grid',ui.grid);map.classList.toggle('k3d-moving',ui.moving);
  map.style.width=(ui.zoom*100)+'%';q('grid').setAttribute('aria-pressed',String(ui.grid));q('move').setAttribute('aria-pressed',String(ui.moving));
  q('zoom-out').disabled=ui.zoom<=1;q('zoom-in').disabled=ui.zoom>=2;
 };
 article.querySelector('[data-view=map]').onclick=()=>{ui.pane='map';mode();};
 article.querySelector('[data-view="3d"]').onclick=()=>{ui.pane='3d';mode();document.getElementById('ks-frame')?.scrollIntoView({block:'nearest'});};
 q('grid').onclick=()=>{ui.grid=!ui.grid;mode();};
 q('zoom-in').onclick=()=>{ui.zoom=Math.min(2,ui.zoom+.25);mode();};
 q('zoom-out').onclick=()=>{ui.zoom=Math.max(1,ui.zoom-.25);mode();};
 q('move').onclick=()=>{if(!selected){status.textContent='Elegí primero un objeto.';return;}ui.moving=!ui.moving;mode();};
 map.onclick=e=>{
  if(!ui.moving||!selected||e.target.closest('button'))return;
  const r=map.getBoundingClientRect(),v=(p,start,side,max)=>Math.max(-max,Math.min(max,Math.round(((p-start)/side-.5)*2*max/.88)));
  ui.moving=false;move({x:v(e.clientX,r.left,r.width,10),z:v(e.clientY,r.top,r.height,12)},'✓ Objeto movido.');
 };
 paint();mode();inspector();
}

function zonesPanel(studio,el,host,cfg){
 const zones=zonesOf(cfg),zone=activeZone(studio,cfg),full=zones.length>=ZONE_MAX;
 const panel=document.createElement('section');
 panel.id='k3d-zone-manager';panel.className='ks-settings';
 panel.innerHTML='<h3>Ampliá tu mundo · '+zones.length+' de '+ZONE_MAX+' zonas</h3><p>Agregá una zona al final para caminar de un ambiente al siguiente. El portal queda en la última zona.</p>'+
  '<div class="ks-fields"><label>Zona que estás editando<select id="k3d-zone-select"></select></label><label>Ambiente de la nueva zona<select id="k3d-zone-template"></select></label></div>'+
  '<div class="ks-scene-actions"><button type="button" class="ks-btn" id="k3d-zone-copy">Duplicar zona actual</button><button type="button" class="ks-btn primary" id="k3d-zone-add">Agregar zona</button></div>'+
  (zone?'<label>Nombre de esta zona<input type="text" id="k3d-zone-name" maxlength="32" required></label><button type="button" class="ks-btn" id="k3d-zone-rename">Guardar nombre de zona</button>':'')+
  '<p id="k3d-zone-message" role="status"></p>';
 host.append(panel);
 const q=name=>panel.querySelector('#k3d-zone-'+name),selector=q('select'),preset=q('template'),note=q('message');
 for(const [i,entry] of zones.entries())selector.add(new Option((i+1)+'. '+entry.name+(i===zones.length-1?' · Portal':''),String(i)));
 selector.value=String(zone);
 for(const [id,p] of [['empty',{name:'Zona libre (sin objetos)'}],...Object.entries(presets)])preset.add(new Option(p.name,id));
 if([...preset.options].some(o=>o.value===studio.expansionPreset))preset.value=studio.expansionPreset;
 preset.onchange=()=>{studio.expansionPreset=preset.value;};
 const frame=document.getElementById('ks-frame');
 function focus(){
  if(panel.isConnected&&StudioKits.read(studio.files)?.kind==='explore3d')frame?.contentWindow?.postMessage({type:'krueka-scene-zone',zone},'*');
 }
 let previewFocus=frame?.kruekaZoneFocus;
 if(previewFocus)frame.removeEventListener('load',previewFocus);
 if(frame){frame.kruekaZoneFocus=focus;frame.addEventListener('load',focus);}
 focus();
 q('copy').disabled=q('add').disabled=preset.disabled=studio.busy||!studio.cloudReady||full;
 for(const button of [q('copy'),q('add')])button.dataset.limitReached=String(full);
 if(full)note.textContent='Llegaste a '+ZONE_MAX+' zonas. Todavía podés editar los ambientes y sus piezas.';
 selector.onchange=()=>{
  studio.expansionZone=Number(selector.value);studio.selectedSceneObject=null;
  Studio3D.renderEditor(studio,el,read(cfg,studio));
  el.querySelector('#k3d-zone-select')?.focus();
 };
 let committing=false;
 async function add(id){
  if(studio.busy||!studio.cloudReady||full||committing)return;
  committing=true;q('copy').disabled=q('add').disabled=selector.disabled=true;
  const from=studio.expansionZone;
  try{
   const prior=read(cfg,studio),next=appendZone(prior,id,zone);
   studio.expansionZone=next.zones.length;studio.builderNotice='✓ Nueva zona conectada al final. En el juego, cruzá la línea para entrar.';
   await commitScene(studio,next,null,true);
   el.querySelector('#k3d-zone-select')?.focus();
  }catch(e){
   studio.expansionZone=from;studio.builderNotice='';
   note.textContent=e.message;
  }finally{committing=false;if(panel.isConnected)q('copy').disabled=q('add').disabled=selector.disabled=false;}
 }
 q('copy').onclick=()=>add('copy');
 q('add').onclick=()=>add(preset.value);
 if(zone){
  const input=q('name');input.value=zones[zone].name;
  q('rename').onclick=()=>{
   const name=input.value.trim();
   if(!name){note.textContent='Escribí el nombre de la zona.';return;}
   const current=read(cfg,studio);
   const next={...current,zones:current.zones.map((entry,i)=>i===zone-1?{...entry,name}:entry)};
   void commitScene(studio,next).catch(e=>{note.textContent=e.message;});
  };
 }
}

function builder(studio,el,cfg){
 const identity=(studio.sid?.()||'')+'|'+studio.projectId;
 if(identity!==draftOwner){draftOwner=identity;draftCode='';draftOpen=false;studio.builderCategory='ambiente';}
 const section=document.createElement('section');section.id='k3d-builder';section.className='ks-settings';
 section.innerHTML='<div class="ks-section-label">TU PROYECTO DE VIDEOJUEGO</div><h2>Construí tu mundo por partes</h2><p>Editá una pieza en primer plano, elegí dónde colocarla y probá el mundo. Nada cambia hasta confirmar.</p>'+
  '<div class="ks-scene-actions"><button type="button" class="ks-btn" id="k3d-new">＋ Nuevo mundo 3D</button><button type="button" class="ks-btn" id="k3d-projects">Mis proyectos</button><button type="button" class="ks-btn" id="k3d-save">Guardar proyecto</button><button type="button" class="ks-btn primary" id="k3d-play">▶ Probar mundo</button><button type="button" class="ks-btn" id="k3d-edit">Editar una pieza</button></div>'+
  '<p class="ks-tip">Antes de salir, tocá «Guardar proyecto» y esperá la confirmación. La próxima clase, entrá con tu mismo código y abrilo en «Mis proyectos».</p><div id="k3d-zone-slot"></div><div id="k3d-scene-slot"></div><details open><summary>1. Elegí una plantilla</summary><label>Categoría <select id="k3d-category"></select></label><label>Plantilla <select id="k3d-piece"></select></label><p id="k3d-about"></p>'+
  '<div class="ks-scene-actions"><button type="button" class="ks-btn primary" id="k3d-apply-part">Agregar al mundo</button><button type="button" class="ks-btn" id="k3d-copy-code">Copiar plantilla</button><button type="button" class="ks-btn" id="k3d-hero" hidden>Usar como protagonista</button></div></details>'+
  '<details id="k3d-paste-panel"><summary>2. Pegar o editar una plantilla</summary><label>Código de la plantilla<textarea id="k3d-paste-code" rows="7" maxlength="16000" spellcheck="false"></textarea></label><p>Para cambiar un color, editá <code>color</code>. Para cambiar un molde, elegí antes otra plantilla o editá el tipo con un valor de la misma categoría. Pegá JSON, no JavaScript.</p><div class="ks-scene-actions"><button type="button" class="ks-btn primary" id="k3d-apply-paste">Revisar y agregar</button><button type="button" class="ks-btn" id="k3d-save-part">Guardar en mis plantillas</button></div></details>'+
  '<section><h3>3. Revisá el recorrido</h3><div id="k3d-diagnostico" role="status"></div></section><p id="k3d-build-result" class="ks-class-note" role="status"></p>';
 el.prepend(section);
 zonesPanel(studio,el,section.querySelector('#k3d-zone-slot'),cfg);
 scenePanel(studio,section.querySelector('#k3d-scene-slot'),cfg);
 const query=id=>section.querySelector('#k3d-'+id);
 const say=msg=>{query('build-result').textContent=msg;};
 const built=library(),saved=customParts(studio);
 const all=[...built,...saved.map(p=>({...p,saved:true}))];
 const cat=query('category'),selector=query('piece'),paste=query('paste-code'),pastePanel=query('paste-panel');
 paste.value=draftCode;pastePanel.open=draftOpen;
 paste.oninput=()=>{draftCode=paste.value;};
 pastePanel.ontoggle=()=>{if(pastePanel.isConnected)draftOpen=pastePanel.open;};
 for(const [id,text] of categories)cat.add(new Option(text,id));
 if(categories.some(([id])=>id===studio.builderCategory))cat.value=studio.builderCategory;
 function options(){
  studio.builderCategory=cat.value;
  selector.replaceChildren(...all.map((p,i)=>p.category===cat.value?new Option(p.name+(p.saved?' · Tu copia':''),String(i)):null).filter(Boolean));description();
 }
 function selected(){const {saved:_saved,...p}=all[Number(selector.value)]||{};return p;}
 function description(){
  const p=selected();const counts=p.objects?.length||0,keys=Object.keys(p.settings||{});
  query('hero').hidden=p.category!=='personaje';
  query('apply-part').textContent=p.category==='personaje'?'Editar personaje':counts===1&&!keys.length?'Editar pieza':'Agregar al mundo';
  if(p.category==='personaje'){query('about').textContent='Primero personalizá el personaje en primer plano. Después elegí dónde colocarlo. «Usar como protagonista» cambia al que controlás.';return;}
  query('about').textContent=(counts?'Agrega '+counts+' objeto'+(counts===1?'':'s')+'. ':'')+
   (keys.length?'Ajusta: '+keys.map(k=>labels[k]).join(', ')+'. ':'')+
   (p.category==='vehiculo'||p.category==='prop'?'Decorativo: no se conduce ni activa acciones.':'Los objetos que ya tenés se conservan.');
 }
 const check=validate(cfg);
 query('diagnostico').replaceChildren(...[cfg.objects.length+' objetos en '+zonesOf(cfg).length+' zona'+(cfg.zones.length?'s':'')+' · '+check.crystals+' cristales',...(check.warnings.length?check.warnings:['Sin alertas básicas. Probá con las flechas y llegá al portal.'])].map(text=>{
  const p=document.createElement('p');p.textContent=text;return p;
 }));
 if(studio.builderNotice){say(studio.builderNotice);studio.builderNotice='';}
 cat.onchange=options;selector.onchange=description;options();
 query('new').onclick=()=>newWorld(studio);query('projects').onclick=()=>studio.showProjects();
 query('save').onclick=async()=>{
  if(!studio.cloudReady||studio.busy){say('El guardado todavía no está disponible. Reintentá antes de salir.');return;}
  const id=studio.projectId,owner=studio.sid?.(),button=query('save');
  button.disabled=true;say('Guardando en Krueka…');
  try{
   const saved=await studio.save();
   if(!section.isConnected||studio.projectId!==id||studio.sid?.()!==owner)return;
   say(!saved?'No se pudo guardar. Reintentá antes de salir.':studio.dirty?'Hay cambios más recientes. Volvé a guardar antes de salir.':'✓ Proyecto y piezas guardados en Krueka. Podés continuar desde Mis proyectos.');
  }finally{button.disabled=false;}
 };
 query('play').onclick=()=>studio.playCurrent();
 query('edit').onclick=()=>{const o=cfg.objects.find(item=>item.id===studio.selectedSceneObject);if(o)pieceEditor(studio,o,{existing:true});else el.querySelector('#k3d-scene-panel')?.scrollIntoView({block:'nearest'});};
 query('copy-code').onclick=async()=>{
  paste.value=draftCode=JSON.stringify(selected(),null,2);draftOpen=pastePanel.open=true;
  try{await navigator.clipboard.writeText(paste.value);say('Plantilla copiada. Podés editarla o pegarla en otro mundo 3D compatible.');}
  catch(_e){paste.focus();paste.select();say('Plantilla seleccionada. Usá Ctrl + C para copiarla.');}
 };
 async function apply(raw,protagonist=false){
  if(studio.busy||!studio.cloudReady)return;
  try{
   const p=parsePiece(raw);
   const upgrade=p.objects.some(o=>newTypes.includes(o.type))||protagonist||p.category==='movimiento';
   const before=read(cfg,studio),next=mergePiece(before,p,protagonist,activeZone(studio,before)),result=validate(next);
   if(!result.ok&&(p.category!=='personaje'||validate(before).ok))throw Error('Coherencia · '+result.warnings.find(w=>/bloquead|alcanzables|punto de salida/.test(w))+' No se aplicó el cambio.');
   studio.builderNotice='✓ '+p.name+' aplicado. Probá el mundo o usá Deshacer.';
   await commitScene(studio,next,next.objects.length>before.objects.length?next.objects.at(-1)?.id:null,upgrade);
  }catch(e){studio.builderNotice='';say(e.message);}
 }
 query('apply-part').onclick=()=>{
  const p=selected();
  if(p.category==='personaje')pieceEditor(studio,{type:'character',label:p.name.slice(0,32),avatarStyle:p.settings.avatarStyle,color:p.settings.avatarColor});
  else if(p.objects?.length===1&&!Object.keys(p.settings).length)pieceEditor(studio,p.objects[0]);
  else apply(JSON.stringify(p));
 };
 query('hero').onclick=()=>apply(JSON.stringify(selected()),true);
 query('apply-paste').onclick=()=>apply(paste.value);
 query('save-part').onclick=()=>{
  if(studio.busy||!studio.cloudReady)return;
  try{
   const p=parsePiece(paste.value),list=customParts(studio);
   if(list.length>=12)throw Error('Podés guardar hasta 12 plantillas propias por proyecto.');
   if(list.some(x=>x.name===p.name))throw Error('Ya guardaste una plantilla con ese nombre. Cambiá “name” para guardar esta versión.');
   const files=studio.validFiles({...studio.files,[MINE]:JSON.stringify([...list,p],null,2)});
   studio.builderNotice='✓ Parte guardada en la biblioteca de este proyecto. Pulsá Guardar proyecto para conservarla.';
   studio.checkpoint();studio.files=files;studio.changed();studio.refreshAll();studio.lock(false);
  }catch(e){say(e.message);}
 };
}
function append(studio,el,cfg){
 if(!el||!el.isConnected||el.querySelector('#k3d-toolbox'))return;
 const current=read(cfg,studio),check=validate(current),section=document.createElement('details');section.id='k3d-toolbox';section.className='ks-settings';
 const manual=document.createElement('details');manual.className='ks-settings';manual.id='k3d-manual';
 const label=document.createElement('summary');label.textContent='Editar piezas, posiciones y colores';
 manual.append(label,...Array.from(el.childNodes));el.append(manual);
 builder(studio,el,current);
 section.innerHTML='<summary>Herramientas avanzadas de escena</summary><p class="ks-section-label">LABORATORIO 3D</p>'+
 '<h3>Construí un mundo en minutos</h3><p>Elegí un escenario original para aprender cómo se distribuyen las casas, los caminos, los vehículos y los desafíos. Solo reemplaza la escena de este proyecto después de tu confirmación.</p>'+
 '<div class="ks-scene-actions">'+Object.entries(presets).map(([id,p])=>'<button class="ks-btn" type="button" data-preset="'+id+'">'+esc(p.name)+'</button>').join('')+'</div>'+
 '<h3>Comprobá tu nivel</h3><p>'+check.objects+' objetos · '+zonesOf(current).length+' zonas · '+check.crystals+' cristales · '+(check.route?'Hay ruta al portal':'No se detecta una ruta al portal')+'</p>'+
 (check.warnings.length?'<ul>'+check.warnings.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'<p>✓ Sin advertencias básicas. Jugá la misión igualmente: esta comprobación no reemplaza una prueba real.</p>')+
 '<div class="ks-scene-actions"><button class="ks-btn" type="button" id="k3d-export">Descargar escena (.json)</button><button class="ks-btn" type="button" id="k3d-obj">Exportar geometría 3D (.obj)</button><button class="ks-btn" type="button" id="k3d-import">Abrir escena (.json)</button><input id="k3d-file" type="file" accept=".json,application/json" hidden></div>'+
 '<h3>Biblioteca gratuita de creación 3D</h3><p>El archivo .obj permite abrir una geometría estática simple en Blender, sin colores ni animaciones. Estos sitios son opcionales, externos y conviene abrirlos con supervisión del docente. No se descargan recursos ni se envían datos de alumnos automáticamente.</p>'+
 '<div class="ks-scene-list">'+resources.map(r=>'<a class="ks-btn" href="'+r.url+'" target="_blank" rel="noopener noreferrer" style="display:block;text-align:left;text-decoration:none"><b>'+esc(r.name)+' ↗</b><small style="display:block;font-size:11px;opacity:.8">'+esc(r.detail)+'</small></a>').join('')+'</div>'+
 '<p class="ks-tip">Los modelos 3D externos (.glb/.gltf) todavía no se importan al juego. Esta versión incluye objetos procedurales originales y escenas JSON nativas de Krueka. Los vehículos son decorativos, no conducibles.</p>'+
 '<p id="k3d-message" role="status" aria-live="polite"></p>';
 el.appendChild(section);
 const msg=s=>{const node=section.querySelector('#k3d-message');if(node)node.textContent=s;};
 section.querySelectorAll('[data-preset]').forEach(b=>b.onclick=()=>{
  const p=template(b.dataset.preset);if(!p)return;
  if(!confirm('Esta plantilla reemplazará los objetos de la zona seleccionada. Las otras zonas y proyectos no cambian. ¿Continuar?'))return;
  const zone=activeZone(studio,current),otherObjects=current.objects.filter(o=>zoneOf(o)!==zone);
  const next={...current,objects:otherObjects};
  try{
   const chosen=mergePiece(next,{category:'ambiente',name:'Plantilla',objects:p.objects,settings:{theme:p.theme,lighting:p.lighting}},false,zone);
   void commitScene(studio,chosen).catch(e=>msg(e.message));
  }catch(e){msg(e.message);}
 });
 section.querySelector('#k3d-export').onclick=()=>download({format:'krueka-scene',version:1,scene:current},'mi-escena-3d-krueka.json');
 section.querySelector('#k3d-obj').onclick=()=>{const blob=new Blob([exportObj(current)],{type:'text/plain'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='escenario-krueka.obj';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);};
 section.querySelector('#k3d-import').onclick=()=>section.querySelector('#k3d-file').click();
 section.querySelector('#k3d-file').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;try{if(await importScene(studio,f))msg('Escena importada. Guardá y probá el juego.');}catch(error){msg('No se pudo importar: '+error.message);}};
}
function install(){
 if(!window.Studio3D||window.Studio3D.__toolboxReady)return false;
 const original=window.Studio3D.renderEditor;
 window.Studio3D.renderEditor=function(studio,el,cfg){
  const owner=(studio.sid?.()||'')+'|'+studio.projectId;
  if(studio.expansionOwner!==owner){studio.expansionOwner=owner;studio.expansionZone=0;}
  studio.expansionZone=activeZone(studio,Studio3D.normalise(cfg));
  const out=original(studio,el,cfg);append(studio,el,cfg);return out;
 };
 const studio=window.StudioIA;
 if(studio?.switchProject){
  const open=studio.switchProject;
  studio.switchProject=async function(id){const result=await open.apply(this,arguments);if(this.projectId===id&&StudioKits.read(this.files)?.kind==='explore3d')this.showTab('create');return result;};
 }
 window.Studio3D.__toolboxReady=true;return true;
}
window.Krueka3DToolbox={editSelection(studio,id){const object=read({},studio).objects.find(o=>o.id===id);if(object)pieceEditor(studio,object,{existing:true});},MAX,ZONE_MAX,presets,resources,template,appendZone,validate,exportObj,importScene,install,library,parsePiece,mergePiece,initialWorld,newWorld};
install();
})();