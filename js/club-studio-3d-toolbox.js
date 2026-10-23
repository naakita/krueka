/* Krueka 3D Toolbox: plantillas originales, validación e intercambio de escenas.
   No descarga activos ni ejecuta archivos de terceros. */
(function(){
'use strict';
if(window.Krueka3DToolbox)return;
const MAX=48,FILENAME='escena-krueka.json';
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
 const obstacles=objs.filter(o=>['crate','pillar','tree','house','car','wall','rock','lamp'].includes(o.type));
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
function set(studio,next){if(studio.busy||!studio.cloudReady)throw Error('Esperá a que termine el guardado o ingresá con tu código.');
 const safe=window.Studio3D.normalise(next);
 const files=studio.validFiles({...studio.files,'game-config.js':StudioKits.configFile(safe)});
 studio.checkpoint();studio.files=files;studio.selectedSceneObject=safe.objects[0]?.id||null;
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
  else if(o.type==='road')box(n,x,-.03,z,s,.06,s*1.8);
  else if(o.type==='wall')box(n,x,0,z,s,h,s*.24);
  else if(o.type==='rock')pyramid(n,x,0,z,s*.56,h);
  else if(o.type==='lamp'){box(n+'_poste',x,0,z,s*.15,h,s*.15);box(n+'_luz',x,h-.2,z,s*.6,.15,s*.5);}
  else if(o.type==='arch'){box(n+'_izquierda',x-s*.42,0,z,s*.2,h,s*.35);box(n+'_derecha',x+s*.42,0,z,s*.2,h,s*.35);box(n+'_alto',x,h-.22,z,s,.22,s*.4);}
  else box(n,x,0,z,s,h,s);
 }
 return out.join('\n')+'\n';
}
async function importScene(studio,file){
 if(!file||file.size>50000)throw Error('Elegí un archivo JSON de hasta 50 KB.');
 const incoming=JSON.parse(await file.text());
 if(!incoming||incoming.format!=='krueka-scene' || incoming.version!==1 || !incoming.scene || !Array.isArray(incoming.scene.objects))throw Error('Este no es un archivo de escena de Krueka.');
 if(incoming.scene.objects.length>MAX)throw Error('La escena supera el máximo de objetos.');
 const next=window.Studio3D.normalise(incoming.scene);
 if(!confirm('Se reemplazará el escenario de ESTE proyecto. Podés volver con Deshacer. ¿Importar?'))return false;
 set(studio,next);return true;
}
function append(studio,el,cfg){
 if(!el||!el.isConnected||el.querySelector('#k3d-toolbox'))return;
 const current=read(cfg,studio),check=validate(current),section=document.createElement('section');section.id='k3d-toolbox';section.className='ks-settings';
 section.innerHTML='<p class="ks-section-label">LABORATORIO 3D · HERRAMIENTAS GRATUITAS</p>'+
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
 window.Studio3D.__toolboxReady=true;return true;
}
window.Krueka3DToolbox={MAX,presets,resources,template,validate,exportObj,importScene,install};
install();
})();