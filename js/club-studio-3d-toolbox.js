/* Krueka 3D Toolbox: plantillas originales, validación e intercambio de escenas.
   No descarga activos ni ejecuta archivos de terceros. */
(function(){
'use strict';
if(window.Krueka3DToolbox)return;
const MAX=48,LEGACY_ENGINE_SHA='2ccca19589275907a5f9a4e073c9aea2cbe93f3bbee82919678dd89aeda8c724',FILENAME='escena-krueka.json';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
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
function validate(cfg){
 const objs=Array.isArray(cfg.objects)?cfg.objects:[];
 const obstacles=objs.filter(o=>['crate','pillar','tree','house','car','wall','rock','lamp','mountain','airplane'].includes(o.type));
 const blocks=(x,z)=>obstacles.some(o=>Math.abs(x-o.x)<(o.type==='tree'?o.size*.25:o.size*.5)+.3&&Math.abs(z-o.z)<(o.type==='tree'?o.size*.25:o.size*.5)+.3);
 const seen=new Set(['0,11']),queue=[[0,11]],canReach=new Set();
 for(let i=0;i<queue.length;i++){
  const [x,z]=queue[i];for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const nx=x+dx,nz=z+dz,key=nx+','+nz;
   if(nx < -10||nx > 10||nz < -12||nz > 12||seen.has(key)||blocks(nx,nz))continue;
   seen.add(key);queue.push([nx,nz]);
  }
 }
 const crystals=objs.filter(o=>o.type==='crystal');
 const unreachable=crystals.filter(o=>!queue.some(([x,z])=>Math.hypot(x-o.x,z-o.z)<o.size*.6+.4));
 const finish=queue.some(([x,z])=>Math.abs(x)<1.4&&z<-11);
 const warnings=[];
 if(objs.length>MAX)warnings.push('El juego admite como máximo '+MAX+' objetos.');
 if(blocks(0,11))warnings.push('Un obstáculo cubre el punto de salida del personaje.');
 if(!finish)warnings.push('La salida del portal está bloqueada según la cuadrícula de prueba.');
 if(!crystals.length)warnings.push('No hay cristales: el portal se abrirá sin recolectar objetos.');
 if(unreachable.length)warnings.push(unreachable.length+' cristales no parecen alcanzables; revisá las barreras.');
 if(objs.length>36)warnings.push('Este mundo puede ir lento en PC antiguas: usá Calidad liviana.');
 return {ok:!warnings.some(w=>/bloquead|alcanzables|punto de salida/.test(w)),warnings,objects:objs.length,crystals:crystals.length,route:finish};
}
function read(cfg,studio){return window.Studio3D.normalise(window.StudioKits.read(studio.files)||cfg);}
function set(studio,next,selectedId,game){if(studio.busy||!studio.cloudReady)throw Error('Esperá a que termine el guardado o ingresá con tu código.');
 const safe=window.Studio3D.normalise(next);
 const files=studio.validFiles({...studio.files,...(game?{'game.js':game}:{}),'game-config.js':StudioKits.configFile(safe)});
 studio.checkpoint();studio.files=files;studio.selectedSceneObject=selectedId||safe.objects.find(o=>o.id===studio.selectedSceneObject)?.id||safe.objects[0]?.id||null;
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
 box('suelo',0,-.65,0,24,.6,28);
 for(const o of scene.objects){
  const n=o.id,x=o.x,z=o.z,s=o.size,h=o.height;
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
 if(hex!==LEGACY_ENGINE_SHA)throw Error('Este juego usa un motor distinto. Creá un Mundo 3D nuevo para usar esta herramienta sin cambiar tu código.');
 return latest;
}
async function commitScene(studio,next,selectedId,upgrade=false){
 const previous=studio.files,code=previous['game.js'],level=previous['game-config.js'],project=studio.projectId,owner=studio.sid?.();
 const game=upgrade||next.objects.some(o=>o.type==='character')?await characterEngine(studio):null;
 if(studio.files!==previous||studio.files['game.js']!==code||studio.files['game-config.js']!==level||studio.projectId!==project||studio.sid?.()!==owner)throw Error('Cambió el proyecto. Repetí la acción en el mundo que estás editando.');
 return set(studio,next,selectedId,game);
}
async function importScene(studio,file){
 if(!file||file.size>50000)throw Error('Elegí un archivo JSON de hasta 50 KB.');
 const incoming=JSON.parse(await file.text());
 if(!incoming||incoming.format!=='krueka-scene' || incoming.version!==1 || !incoming.scene || !Array.isArray(incoming.scene.objects))throw Error('Este no es un archivo de escena de Krueka.');
 if(incoming.scene.objects.length>MAX)throw Error('La escena supera el máximo de objetos.');
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
const enumOptions={theme:['station','forest','island'],lighting:['cryo','alert','sunset'],avatarStyle:['robot','piloto','explorador'],camera:['follow','orbit']};
const optionsByGroup={ambiente:['theme','lighting'],personaje:['avatarColor','avatarStyle'],movimiento:['speed','jumpEnabled','camera'],material:[],vehiculo:[],prop:[],reto:['seconds']};
const labels={theme:'Ambiente del suelo',lighting:'Iluminación',avatarStyle:'Modelo del personaje',avatarColor:'Color del personaje',camera:'Cámara',speed:'Velocidad',jumpEnabled:'Puede saltar',seconds:'Tiempo en segundos'};
const item=(type,label,x,z,size,height,color)=>({type,label,x,z,size,height,color});
const piece=(category,name,settings={},objects=[])=>({version:1,category,name,settings,objects});
function library(){
 const sets=Object.fromEntries(['city','forest','track'].map(id=>[id,template(id)]));
 const components=[];
 for(const [id,name] of [['city','Barrio con avenida'],['forest','Bosque con sendero'],['track','Circuito de práctica']]){
  const {theme,lighting,objects}=sets[id];
  components.push(piece('ambiente',name,{theme,lighting},objects.filter(o=>o.type!=='crystal').map(({id,...o})=>o)));
 }
 return [...components,
  piece('ambiente','Montañas nevadas',{theme:'island',lighting:'cryo'},[item('mountain','Pico norte',-8,-8,3.5,5,'#717d9e'),item('mountain','Pico este',8,-8,3.4,4.5,'#8896b5'),item('rock','Roca del sendero',-5,-2,1.1,1.1,'#9aa3ad')]),
  piece('ambiente','Orilla al atardecer',{theme:'island',lighting:'sunset'},[item('road','Pasarela',0,-2,3,.5,'#b98d64'),item('tree','Árbol de la orilla',-6,-4,1.5,3,'#39796a'),item('lamp','Luz del muelle',6,-4,.7,2.6,'#ffda77')]),
  piece('personaje','Robot violeta',{avatarStyle:'robot',avatarColor:'#a5b4fc'}),
  piece('personaje','Explorador del bosque',{avatarStyle:'explorador',avatarColor:'#4cae89'}),
  piece('personaje','Piloto celeste',{avatarStyle:'piloto',avatarColor:'#4ca9e8'}),
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
function mergePiece(cfg,p,protagonist=false){
 const objects=[...(cfg.objects||[])];
 const adding=p.category==='personaje'&&!protagonist;
 const pieces=adding?[{type:'character',label:p.name.slice(0,32),...freeCharacterSpot(objects),size:1,height:2,color:p.settings.avatarColor||cfg.avatarColor,avatarStyle:p.settings.avatarStyle||cfg.avatarStyle}]:p.objects;
 if(objects.length+pieces.length>MAX)throw Error('No hay espacio. El mundo admite hasta '+MAX+' objetos. No se agregó nada.');
 let seq=0;const used=new Set(objects.map(o=>o.id));
 pieces.forEach(o=>{
  if(objects.some(old=>old.type===o.type&&old.x===o.x&&old.z===o.z))throw Error('Coherencia · «'+o.label+'» ya está en esas coordenadas. Cambiá X o Z antes de agregar otra copia.');
  let id;do{id='pieza-'+(++seq);}while(used.has(id));used.add(id);objects.push({...o,id});});
 return Studio3D.normalise({...cfg,...(adding?{}:p.settings),objects});
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
function scenePanel(studio,section,cfg){
 const id=(studio.sid?.()||'')+'|'+studio.projectId;
 if(id!==panelOwner){panelOwner=id;panelState={group:'all',search:'',grid:true,zoom:1,pane:'3d',moving:false};}
 const ui=panelState,locked=()=>studio.busy||!studio.cloudReady;
 const article=document.createElement('section');article.id='k3d-scene-panel';article.className='ks-settings';
 article.innerHTML='<header><div><h3>Objetos de escena</h3><small>'+cfg.objects.length+' / '+MAX+' objetos</small></div><button type="button" class="ks-btn primary" id="k3d-quick-add" aria-expanded="false">＋ Agregar</button></header>'+
  '<div class="k3d-command" role="group" aria-label="Herramientas de escena">'+
  '<button type="button" class="ks-btn" data-view="map">Plano 2D</button><button type="button" class="ks-btn" data-view="3d">Vista 3D</button>'+
  '<button type="button" class="ks-btn" id="k3d-undo" data-suite-undo>↶ Deshacer</button><button type="button" class="ks-btn" id="k3d-redo" data-suite-redo>↷ Rehacer</button></div>'+
  '<div id="k3d-quick-fields" class="k3d-quick" hidden><label>Objeto nuevo<select id="k3d-new-kind"></select></label><button type="button" class="ks-btn primary" id="k3d-quick-put">Agregar a la escena</button></div>'+
  '<div class="ks-fields k3d-filters"><label>Buscar objetos<input type="search" id="k3d-search" placeholder="Ej.: robot"></label><label>Mostrar<select id="k3d-group"><option value="all">Todos los objetos</option></select></label></div>'+
  '<div id="k3d-map-controls" class="k3d-command" hidden><button type="button" id="k3d-grid" class="ks-btn">Cuadrícula</button><button type="button" id="k3d-zoom-out" class="ks-btn" aria-label="Alejar plano">−</button><button type="button" id="k3d-zoom-in" class="ks-btn" aria-label="Acercar plano">＋</button><button type="button" id="k3d-move" class="ks-btn">Mover en el plano</button></div>'+
  '<p id="k3d-map-help" hidden>Marcá un objeto. Para cambiarlo de lugar, activá «Mover en el plano» y tocá una posición. También podés usar X y Z en Propiedades.</p>'+
  '<div id="k3d-map-scroll" hidden><div id="k3d-map" aria-label="Plano del mundo visto desde arriba"></div></div>'+
  '<div id="k3d-scene-list" class="ks-scene-list" aria-label="Objetos de escena"></div>'+
  '<details id="k3d-properties"><summary>Propiedades del objeto</summary><div id="k3d-inspector"></div></details><p id="k3d-scene-feedback" class="ks-class-note" role="status"></p>';
 section.append(article);
 const q=name=>article.querySelector('#k3d-'+name),map=q('map'),status=q('scene-feedback');
 const btn=(text,onClick)=>{const b=document.createElement('button');b.type='button';b.className='ks-btn';b.textContent=text;b.onclick=onClick;return b;};
 let selected=cfg.objects.find(o=>o.id===studio.selectedSceneObject);
 if(ui.notice){status.textContent=ui.notice;ui.notice='';}
 q('quick-fields').hidden=!ui.addOpen;q('quick-add').setAttribute('aria-expanded',String(!!ui.addOpen));
 q('quick-add').onclick=()=>{ui.addOpen=q('quick-fields').hidden;q('quick-fields').hidden=!ui.addOpen;q('quick-add').setAttribute('aria-expanded',String(ui.addOpen));if(ui.addOpen)q('new-kind').focus();};
 for(const [key,label] of Object.entries(groupNames))q('group').add(new Option(label,key));
 const recent=studio.files['game.js']===Studio3D.create()['game.js'];
 for(const [key,[label]] of Object.entries(sceneTypes)){
  if(['mountain','airplane','shield','staff'].includes(key)&&!recent)continue;
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
  if(cfg.objects.length>=MAX){status.textContent='Llegaste a '+MAX+' objetos. Quitá uno antes de agregar otro.';return;}
  try{
   const spot=freeCharacterSpot(cfg.objects);
   const object={label:sceneTypes[source.type][0],size:1,height:source.type==='character'?2:1.5,color:source.type==='character'?'#a5b4fc':'#67e8f9',...source,...spot,id:unique()};
   if(copy)object.label=(source.label.slice(0,26)+' copia');
   ui.props=true;ui.search='';ui.group='all';
   update({...cfg,objects:[...cfg.objects,object]},object.id,'✓ '+object.label+' agregado al mundo.');
  }catch(e){status.textContent=e.message;}
 }
 q('quick-put').onclick=()=>add({type:q('new-kind').value});
 function select(o,fromMap=false){
  selected=o;studio.selectedSceneObject=o.id;
  q('properties').open=ui.props=true;
  document.getElementById('ks-frame')?.contentWindow?.postMessage({type:'krueka-scene-highlight',id:o.id},'*');
  paint();inspector();
  (fromMap?map:article).querySelector('[data-k3d-id="'+o.id+'"]')?.focus();
 }
 const place=(node,x,z)=>{node.style.left=((x+10)/20*88+6)+'%';node.style.top=((z+12)/24*88+6)+'%';};
 function paint(){
  const visible=cfg.objects.filter(o=>(ui.group==='all'||sceneTypes[o.type]?.[2]===ui.group)&&(o.label+' '+(sceneTypes[o.type]?.[0]||'')).toLocaleLowerCase().includes(ui.search.trim().toLocaleLowerCase()));
  const list=q('scene-list');list.replaceChildren();map.replaceChildren();
  for(const [label,x,z] of [['Inicio',0,11],['Portal',0,-12]]){
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
  if(!visible.length)list.textContent=cfg.objects.length?'No hay objetos que coincidan con el filtro.':'Todavía no agregaste objetos.';
 }
 function inspector(){
  const form=q('inspector');form.replaceChildren();
  if(!selected){form.textContent='Elegí un objeto de la lista o del plano.';return;}
  const o=selected,fields=document.createElement('div');fields.className='ks-fields';const inputs={};
  function field(name,title,type,min,max){
   const label=document.createElement('label');label.textContent=title;
   const el=document.createElement(type==='model'?'select':'input');
   if(type==='model')for(const [id,title] of [['robot','Robot'],['piloto','Piloto'],['explorador','Explorador']])el.add(new Option(title,id));
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

function builder(studio,el,cfg){
 const identity=(studio.sid?.()||'')+'|'+studio.projectId;
 if(identity!==draftOwner){draftOwner=identity;draftCode='';draftOpen=false;studio.builderCategory='ambiente';}
 const section=document.createElement('section');section.id='k3d-builder';section.className='ks-settings';
 section.innerHTML='<div class="ks-section-label">TU PROYECTO DE VIDEOJUEGO</div><h2>Construí tu mundo por partes</h2><p>Elegí una plantilla para sumar objetos y después movelos desde la lista de escena. Podés probar la misión sin escribir código.</p>'+
  '<div class="ks-scene-actions"><button type="button" class="ks-btn" id="k3d-new">＋ Nuevo mundo 3D</button><button type="button" class="ks-btn" id="k3d-projects">Mis proyectos</button><button type="button" class="ks-btn" id="k3d-save">Guardar proyecto</button><button type="button" class="ks-btn primary" id="k3d-play">▶ Probar mundo</button><button type="button" class="ks-btn" id="k3d-edit">Editar una pieza</button></div>'+
  '<div id="k3d-scene-slot"></div><details open><summary>1. Elegí una plantilla</summary><label>Categoría <select id="k3d-category"></select></label><label>Plantilla <select id="k3d-piece"></select></label><p id="k3d-about"></p>'+
  '<div class="ks-scene-actions"><button type="button" class="ks-btn primary" id="k3d-apply-part">Agregar al mundo</button><button type="button" class="ks-btn" id="k3d-copy-code">Copiar plantilla</button><button type="button" class="ks-btn" id="k3d-hero" hidden>Usar como protagonista</button></div></details>'+
  '<details id="k3d-paste-panel"><summary>2. Pegar o editar una plantilla</summary><label>Código de la plantilla<textarea id="k3d-paste-code" rows="7" maxlength="16000" spellcheck="false"></textarea></label><p>Para cambiar un color, editá <code>color</code>. Para cambiar un molde, elegí antes otra plantilla o editá el tipo con un valor de la misma categoría. Pegá JSON, no JavaScript.</p><div class="ks-scene-actions"><button type="button" class="ks-btn primary" id="k3d-apply-paste">Revisar y agregar</button><button type="button" class="ks-btn" id="k3d-save-part">Guardar en mis plantillas</button></div></details>'+
  '<section><h3>3. Revisá el recorrido</h3><div id="k3d-diagnostico" role="status"></div></section><p id="k3d-build-result" class="ks-class-note" role="status"></p>';
 el.prepend(section);
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
  if(p.category==='personaje'){query('about').textContent='Agrega un personaje de escena que queda en su lugar. «Usar como protagonista» cambia al que controlás.';return;}
  query('about').textContent=(counts?'Agrega '+counts+' objeto'+(counts===1?'':'s')+'. ':'')+
   (keys.length?'Ajusta: '+keys.map(k=>labels[k]).join(', ')+'. ':'')+
   (p.category==='vehiculo'||p.category==='prop'?'Decorativo: no se conduce ni activa acciones.':'Los objetos que ya tenés se conservan.');
 }
 const check=validate(cfg);
 query('diagnostico').replaceChildren(...[cfg.objects.length+' de '+MAX+' objetos · '+check.crystals+' cristales',...(check.warnings.length?check.warnings:['Sin alertas básicas. Probá con las flechas y llegá al portal.'])].map(text=>{
  const p=document.createElement('p');p.textContent=text;return p;
 }));
 if(studio.builderNotice){say(studio.builderNotice);studio.builderNotice='';}
 cat.onchange=options;selector.onchange=description;options();
 query('new').onclick=()=>newWorld(studio);query('projects').onclick=()=>studio.showProjects();
 query('save').onclick=async()=>{if(!studio.cloudReady||studio.busy)return;say(await studio.save()?'✓ Proyecto y piezas guardados. Buscalos en Mis proyectos.':'No se pudo guardar. Reintentá antes de salir.');};
 query('play').onclick=()=>studio.playCurrent();
 query('edit').onclick=()=>{const panel=el.querySelector('#k3d-scene-panel');if(!panel)return;panel.scrollIntoView({block:'nearest'});const props=panel.querySelector('#k3d-properties');props.open=true;props.querySelector('summary')?.focus();};
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
   const before=read(cfg,studio),next=mergePiece(before,p,protagonist),result=validate(next);
   if(!result.ok&&(p.category!=='personaje'||validate(before).ok))throw Error('Coherencia · '+result.warnings.find(w=>/bloquead|alcanzables|punto de salida/.test(w))+' No se aplicó el cambio.');
   studio.builderNotice='✓ '+p.name+' aplicado. Probá el mundo o usá Deshacer.';
   await commitScene(studio,next,next.objects.length>before.objects.length?next.objects.at(-1)?.id:null,upgrade);
  }catch(e){studio.builderNotice='';say(e.message);}
 }
 query('apply-part').onclick=()=>apply(JSON.stringify(selected()));
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
 '<h3>Comprobá tu nivel</h3><p>'+check.objects+' de '+MAX+' objetos · '+check.crystals+' cristales · '+(check.route?'Hay ruta al portal':'No se detecta una ruta al portal')+'</p>'+
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
  if(!confirm('Esta plantilla reemplazará todos los objetos actuales del mundo. Tus otros proyectos no cambiarán. ¿Continuar?'))return;
  try{set(studio,{...current,...p});}catch(e){msg(e.message);}
 });
 section.querySelector('#k3d-export').onclick=()=>download({format:'krueka-scene',version:1,scene:current},'mi-escena-3d-krueka.json');
 section.querySelector('#k3d-obj').onclick=()=>{const blob=new Blob([exportObj(current)],{type:'text/plain'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='escenario-krueka.obj';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);};
 section.querySelector('#k3d-import').onclick=()=>section.querySelector('#k3d-file').click();
 section.querySelector('#k3d-file').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;try{if(await importScene(studio,f))msg('Escena importada. Guardá y probá el juego.');}catch(error){msg('No se pudo importar: '+error.message);}};
}
function install(){
 if(!window.Studio3D||window.Studio3D.__toolboxReady)return false;
 const original=window.Studio3D.renderEditor;
 window.Studio3D.renderEditor=function(studio,el,cfg){const out=original(studio,el,cfg);append(studio,el,cfg);return out;};
 const studio=window.StudioIA;
 if(studio?.switchProject){
  const open=studio.switchProject;
  studio.switchProject=async function(id){const result=await open.apply(this,arguments);if(this.projectId===id&&StudioKits.read(this.files)?.kind==='explore3d')this.showTab('create');return result;};
 }
 window.Studio3D.__toolboxReady=true;return true;
}
window.Krueka3DToolbox={MAX,presets,resources,template,validate,exportObj,importScene,install,library,parsePiece,mergePiece,initialWorld,newWorld};
install();
})();