/* Render Pro — vista GLB CC0, retratos WebP privados y alternativa SVG.
   Motor: @google/model-viewer Apache-2.0, carga diferida desde CDN; modelos Quaternius CC0. */
(function(){
'use strict';
if(window.StudioRenderPro)return;
const LIB='https://cdnjs.cloudflare.com/ajax/libs/model-viewer/4.1.0/model-viewer.min.js';
const SOURCE='https://raw.githubusercontent.com/Papyszoo/CC0-Public-Domain-Models/77343cac874f06b73d16ad0063339df7c9ca254c/packs/quaternius-rpg-characters/models/';
const NAMES={warrior:'Guerrero medieval',ranger:'Arquera exploradora',wizard:'Mago arcano',rogue:'Pícaro',cleric:'Clérigo',monk:'Monje'};
const names=Object.keys(NAMES);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const url=(model,ext)=>SOURCE+model+'/'+model+'.'+ext;
let loading=null,installed=false;
function getLoader(){
 if(window.customElements?.get('model-viewer'))return Promise.resolve();
 if(loading)return loading;
 loading=new Promise((resolve,reject)=>{
  const s=document.createElement('script');s.type='module';s.src=LIB;
  s.onload=()=>Promise.race([customElements.whenDefined('model-viewer'),new Promise((_,rej)=>setTimeout(()=>rej(Error('El render 3D tardó demasiado en iniciar.')),12000))]).then(resolve,reject);
  s.onerror=()=>reject(Error('No se pudo cargar el motor gratuito de render 3D.'));
  document.head.appendChild(s);
 }).catch(e=>{loading=null;throw e});
 return loading;
}
function validPortrait(s){return /^data:image\/webp;base64,[a-zA-Z0-9+/=]{1,40000}$/.test(s)}
function compress(image){
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
 if(!ctx)throw Error('Este equipo no permite procesar el retrato.');
 let w=420,h=540,result='';
 for(let round=0;round<5;round++){
  canvas.width=w;canvas.height=h;
  const ratio=Math.max(w/image.naturalWidth,h/image.naturalHeight);
  const rw=image.naturalWidth*ratio,rh=image.naturalHeight*ratio;
  ctx.clearRect(0,0,w,h);ctx.drawImage(image,(w-rw)/2,(h-rh)/2,rw,rh);
  for(const q of [.72,.62,.52,.42,.32]){
   result=canvas.toDataURL('image/webp',q);
   if(validPortrait(result))return result;
  }
  w=Math.round(w*.84);h=Math.round(h*.84);
 }
 throw Error('La imagen es demasiado grande para el proyecto. Probá con otra.');
}
function decorate(studio,el,raw){
 if(!studio||!el||!window.StudioHeroes||el.querySelector('.kr-render-pro'))return;
 const cfg=StudioHeroes.clean(raw);
 const hero=cfg.heroes.find(h=>h.id===(studio.heroSelected||cfg.active))||cfg.heroes[0];
 const box=el.querySelector('.kh-live');
 if(!box)return;
 const panel=document.createElement('section');
 panel.className='ks-settings kr-render-pro';
 panel.innerHTML='<div class="kr-rp-title"><div><div class="ks-section-label">RENDER PRO · ARTE Y 3D</div><h3>Tu héroe con más detalle</h3></div><span>GRATIS</span></div>'+
 '<p>Ahora podés ver un modelo tridimensional real, girarlo y examinar su equipamiento. También podés importar tu ilustración HD para la ficha. La vista 3D utiliza modelos estilizados gratuitos, no reproduce automáticamente un personaje fotorrealista.</p>'+
 '<div class="ks-fields"><label>Molde 3D<select id="kr-rp-model" data-piece="renderModel">'+names.map(id=>'<option value="'+id+'" '+(hero.renderModel===id?'selected':'')+'>'+NAMES[id]+'</option>').join('')+'</select></label>'+
 '<label>Iluminación<select id="kr-rp-light"><option value="studio">Estudio cinematográfico</option><option value="sunset">Atardecer cálido</option><option value="dark">Fantasia oscura</option></select></label></div>'+
 '<div class="kr-rp-frame"><div class="kr-rp-fallback" id="kr-rp-fallback">'+StudioHeroes.art(hero)+'</div><div class="kr-rp-view" id="kr-rp-view" hidden></div><p class="kr-rp-state" id="kr-rp-state" role="status">Vista ligera disponible. Activá Render 3D cuando tengas conexión y una computadora compatible.</p></div>'+
 '<div class="kr-rp-toolbar"><button class="ks-btn primary" type="button" id="kr-rp-load">◈ Activar Render 3D</button><button class="ks-btn" type="button" id="kr-rp-spin" disabled>⟳ Girar</button><button class="ks-btn" type="button" id="kr-rp-shot" disabled>↓ Guardar PNG</button></div>'+
 '<p class="ks-tip">En modo 3D podés arrastrar para girar y usar la rueda para acercar. Los colores y accesorios del editor SVG no alteran automáticamente la geometría del modelo 3D; podés elegir otro molde y guardar esa elección.</p>'+
 '<div class="kr-rp-import"><h3>Retrato de ilustración HD</h3><p>Para conseguir el acabado de fantasía detallada que buscás, usá una ilustración propia o con permiso. Krueka la comprime y la guarda dentro de <b>tu proyecto privado</b>, sin enviarla a servicios públicos de generación.</p>'+
 '<label class="kr-rp-upload">Seleccionar imagen (PNG, JPG, WebP)<input type="file" id="kr-rp-file" accept="image/png,image/jpeg,image/webp"></label>'+
 '<div class="kr-rp-toolbar"><button class="ks-btn" type="button" id="kr-rp-remove" '+(!hero.portrait?'disabled':'')+'>Quitar retrato</button><button class="ks-btn" type="button" id="kr-rp-back">← Volver al mundo</button></div>'+
 '<p id="kr-rp-import-state" class="ks-tip" role="status">El retrato aparecerá en la ficha y la colección cuando presiones Guardar en la parte superior.</p></div>'+
 '<p class="kr-rp-credit">Modelos 3D: Quaternius · licencia CC0. Motor: model-viewer · Apache-2.0. Herramienta libre para modelar: <a target="_blank" rel="noopener noreferrer" href="https://web.blockbench.net/">Blockbench web</a>.</p>';
 box.insertAdjacentElement('afterend',panel);
 const $=id=>panel.querySelector('#'+id),status=$('kr-rp-state'),importStatus=$('kr-rp-import-state');
 const setStatus=(x)=>{status.textContent=x;};
 const view=$('kr-rp-view'),fallback=$('kr-rp-fallback'),modelChoice=$('kr-rp-model');
 let viewer=null,orbit=false;
 const light=()=>{
  if(!viewer)return;
  const chosen=$('kr-rp-light').value;
  viewer.exposure=chosen==='dark'?.7:chosen==='sunset'?1.45:1.1;
  viewer.shadowIntensity=chosen==='dark'?.65:1.15;
  viewer.style.background=chosen==='sunset'?'radial-gradient(circle at 60% 30%,#665038,#171b2f)':chosen==='dark'?'radial-gradient(circle at 60% 32%,#203048,#030914)':'radial-gradient(circle at 50% 28%,#3c5665,#111b2c)';
 };
 const modelSrc=id=>url(names.includes(id)?id:'warrior','glb');
 const loadModel=async()=>{
  if(!window.WebGLRenderingContext){setStatus('Este equipo no tiene WebGL. Usá la ilustración ligera o un retrato HD.');return;}
  $('kr-rp-load').disabled=true;setStatus('Cargando motor gratuito y modelo 3D…');
  try{
   await getLoader();
   if(!panel.isConnected)return;
   if(!viewer){
    viewer=document.createElement('model-viewer');
    viewer.setAttribute('camera-controls','');
    viewer.setAttribute('interaction-prompt','none');
    viewer.setAttribute('shadow-intensity','1');
    viewer.setAttribute('shadow-softness','.75');
    viewer.setAttribute('tone-mapping','aces');
    viewer.setAttribute('environment-image','neutral');
    viewer.setAttribute('loading','eager');
    viewer.setAttribute('reveal','auto');
    viewer.setAttribute('camera-target','auto auto auto');
    viewer.setAttribute('alt','Héroe 3D de fantasía gratuito');
    viewer.addEventListener('load',()=>{setStatus('Modelo 3D listo: girá para examinarlo. Los modelos son estilizados.');$('kr-rp-spin').disabled=false;$('kr-rp-shot').disabled=false;light();});
    viewer.addEventListener('error',()=>{setStatus('El modelo 3D no pudo descargarse. La ficha 2D sigue disponible.');view.hidden=true;fallback.hidden=false;});
    view.appendChild(viewer);
   }
   fallback.hidden=true;view.hidden=false;
   viewer.src=modelSrc(modelChoice.value);
   light();
  }catch(e){setStatus(e.message||'No se pudo abrir el render 3D.');fallback.hidden=false;view.hidden=true;}
  finally{$('kr-rp-load').disabled=false;}
 };
 $('kr-rp-load').onclick=loadModel;
 modelChoice.addEventListener('change',()=>{if(viewer){viewer.src=modelSrc(modelChoice.value);setStatus('Cambiando modelo 3D…');}});
 $('kr-rp-light').onchange=light;
 $('kr-rp-spin').onclick=()=>{if(!viewer)return;orbit=!orbit;viewer.autoRotate=orbit;$('kr-rp-spin').textContent=orbit?'■ Parar giro':'⟳ Girar';};
 $('kr-rp-shot').onclick=()=>{
  if(!viewer||typeof viewer.toDataURL!=='function')return setStatus('La captura no está disponible en este navegador.');
  try{const a=document.createElement('a');a.download=(hero.name||'heroe').replace(/[^a-z0-9_-]/gi,'-').slice(0,40)+'-3d.png';a.href=viewer.toDataURL('image/png');a.click();setStatus('Se preparó la captura PNG del modelo 3D.');}
  catch(_e){setStatus('La captura PNG no está disponible; podés continuar usando la vista 3D.');}
 };
 function savePortrait(portrait){
  const current=StudioKits.read(studio.files),x=StudioHeroes.clean(current);
  const selected=x.heroes.find(h=>h.id===hero.id);
  if(!selected)throw Error('No se encontró el héroe seleccionado.');
  selected.portrait=portrait;
  const contents=StudioKits.configFile(x);
  if(typeof studio.validFiles==='function')studio.validFiles({...studio.files,'game-config.js':contents});
  studio.checkpoint();studio.files['game-config.js']=contents;studio.changed();studio.refreshAll();studio.lock(false);
 }
 $('kr-rp-file').onchange=async e=>{
  const f=e.target.files?.[0];if(!f)return;
  if(!['image/png','image/jpeg','image/webp'].includes(f.type)||f.size>12*1024*1024){importStatus.textContent='Elegí un archivo de imagen válido de hasta 12 MB.';return;}
  importStatus.textContent='Preparando retrato liviano para guardar en Krueka…';
  const obj=URL.createObjectURL(f),img=new Image();
  try{
   await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('No pudimos abrir esta imagen.'));img.src=obj;});
   if(!img.naturalWidth||!img.naturalHeight||img.naturalWidth*img.naturalHeight>35000000)throw Error('Imagen demasiado grande. Elegí una más pequeña.');
   const portrait=compress(img);
   savePortrait(portrait);
  }catch(err){if(panel.isConnected)importStatus.textContent=err.message||'No se pudo guardar el retrato.';}
  finally{URL.revokeObjectURL(obj);}
 };
 $('kr-rp-remove').onclick=()=>{try{savePortrait('');}catch(e){importStatus.textContent=e.message;}};
 $('kr-rp-back').onclick=()=>{studio.builderView='world';studio.renderCreator();};
}
function install(){
 if(installed||!window.StudioIA||!window.StudioHeroes||!window.KruekaGameBuilder)return false;
 const old=StudioIA.renderCreator.bind(StudioIA);
 StudioIA.renderCreator=function(){
  const cfg=StudioKits.read(this.files),el=document.getElementById('ks-create');
  if(cfg?.kind==='hero-manager'&&this.builderView==='heroes'&&el){StudioHeroes.renderEditor(this,el,cfg);return;}
  return old();
 };
 installed=true;return true;
}
window.StudioRenderPro={NAMES,SOURCE,LIB,validPortrait,compress,decorate,install};
if(!install()){
 let n=0;const timer=setInterval(()=>{if(install()||++n>30)clearInterval(timer)},100);
}
})();