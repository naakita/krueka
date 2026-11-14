/* Club Krueka: categorías creativas y galería privada de proyectos aprobados.
 * Reutiliza las sesiones del Club, StudioIA y las RPC de revisión. */
(function(){
'use strict';
if(window.ClubKrueka||!window.StudioIA||!window.StudioKits||!window.StudioCreative)return;
const categories=[
 {id:'juegos',icon:'🎮',name:'Videojuegos',desc:'Creá niveles, personajes y desafíos.',kit:'arcade-web',kits:['arcade-web','stars','race','platform','odyssey3d']},
 {id:'blogs',icon:'📰',name:'Blogs',desc:'Publicá ideas, novedades y artículos.'},
 {id:'historietas',icon:'💬',name:'Historietas',desc:'Diseñá viñetas y diálogos.'},
 {id:'cuentos',icon:'📖',name:'Cuentos',desc:'Inventá historias y aventuras.'},
 {id:'dramas',icon:'🎭',name:'Dramas',desc:'Escribí escenas y personajes.'},
 {id:'animes',icon:'✨',name:'Anime original',desc:'Creá escenas animadas propias.'},
 {id:'flyers',icon:'📣',name:'Flyers y afiches',desc:'Diseñá publicidad y carteles.'},
 {id:'dibujos',icon:'🎨',name:'Dibujos',desc:'Componé ilustraciones digitales.'},
 {id:'animaciones',icon:'🎞️',name:'Animaciones',desc:'Dale movimiento a tus personajes.',kit:'animation'},
 {id:'videos',icon:'🎬',name:'Videos',desc:'Editá escenas y exportá tu trabajo.',kit:'video-edit'}
];
const texts={
 blogs:['Primera publicación','Mi idea favorita','Una noticia del club'],
 historietas:['¡Comienza la aventura!','Un desafío inesperado','La gran solución'],
 cuentos:['Había una vez...','Algo sorprendente ocurrió','Un final inolvidable'],
 dramas:['Escena 1: El encuentro','Escena 2: El conflicto','Escena 3: La solución'],
 animes:['Episodio 1: El poder despierta','Episodio 2: El reto','Episodio 3: Nuestra victoria'],
 flyers:['¿Qué ofrecemos?','¿Por qué participar?','¡Te esperamos!'],
 dibujos:['Mi personaje','Mis colores','Mi inspiración']
};
function safe(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function defaultData(id){
 const cat=categories.find(c=>c.id===id)||categories[0];
 return {kind:id,title:cat.name==='Dibujos'?'Mi ilustración': 'Mi '+cat.name.toLowerCase(),subtitle:'Una creación original del Club Krueka',art:id==='animes'?'⚡':id==='dibujos'?'🦊':id==='dramas'?'🎭':id==='cuentos'?'🏰':id==='flyers'?'🌟':id==='historietas'?'🐱':'💡',color:'#237fc3',panels:(texts[id]||[]).map((t,i)=>({title:t,text:['Presento mi idea y lo que quiero contar.','Aquí sucede algo interesante. ¿Qué pasará después?','Este es el resultado de mi creación.'][i]}))};
}
function color(value){return /^#[0-9a-f]{6}$/i.test(value||'')?value:'#237fc3';}
function normalized(raw){
 const d=raw&&typeof raw==='object'?raw:{};
 const category=categories.find(x=>x.id===d.kind&&!['juegos','animaciones','videos'].includes(x.id))?.id||'cuentos';
 const base=defaultData(category);
 return {kind:category,title:String(d.title||base.title).slice(0,80),subtitle:String(d.subtitle||base.subtitle).slice(0,140),
  color:color(d.color),art:String(d.art||base.art).slice(0,8),
  panels:[0,1,2].map(i=>({title:String(d.panels?.[i]?.title||base.panels[i].title).slice(0,95),text:String(d.panels?.[i]?.text||base.panels[i].text).slice(0,1200)}))};
}
function build(d){
 d=normalized(d);
 const art=safe(d.art),cat=d.kind;
 const article=d.panels.map((p,i)=>{
  const title=safe(p.title),body=safe(p.text).replace(/\n/g,'<br>');
  return '<article class="panel"><div class="panel-top"><span class="number">0'+(i+1)+'</span><span class="mini-art" aria-hidden="true">'+art+'</span></div><h2>'+title+'</h2><p>'+body+'</p></article>';
 }).join('');
 const note=cat==='animes'?'Escenas originales con movimiento.':cat==='dibujos'?'Arte digital con figuras y colores.':'Una obra original hecha en Krueka.';
 const cls=cat==='historietas'||cat==='dibujos'?'grid-panels':'cards';
 const draw=cat==='dibujos'?'<svg class="artwork" viewBox="0 0 600 250" role="img" aria-label="Ilustración geométrica"><circle cx="300" cy="130" r="100" fill="var(--accent)" opacity=".28"/><path d="M95 206 Q195 25 295 208 Q380 45 500 206" fill="none" stroke="var(--accent)" stroke-width="15" stroke-linecap="round"/><circle cx="190" cy="100" r="35" fill="#ffd36a"/><circle cx="427" cy="105" r="30" fill="#92e4ff"/><text x="300" y="165" text-anchor="middle" font-size="88">'+art+'</text></svg>':'';
 const poster=cat==='flyers'?' poster':'';
 const html='<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+safe(d.title)+'</title><link rel="stylesheet" href="style.css"></head><body class="'+cat+poster+'"><main><header><small>CLUB KRUEKA · '+safe(cat.toUpperCase())+'</small><h1>'+safe(d.title)+'</h1><p class="sub">'+safe(d.subtitle)+'</p></header><div class="hero" aria-hidden="true">'+art+'</div>'+draw+'<section class="'+cls+'">'+article+'</section><footer>'+safe(note)+' · Creá algo nuevo cada semana.</footer></main><script src="script.js"></script></body></html>';
 const css=':root{--accent:'+d.color+'}*{box-sizing:border-box}body{margin:0;background:#f0f5ff;color:#16324f;font:16px/1.5 system-ui,Arial}main{max-width:940px;margin:0 auto;padding:26px 20px}header{text-align:center;padding:28px 12px}header small{color:var(--accent);font-size:12px;letter-spacing:2px;font-weight:900}h1{font-size:clamp(30px,5vw,55px);margin:10px 0}p.sub{color:#496787;margin:4px 0 12px}.hero{background:linear-gradient(125deg,var(--accent),#142c56);border-radius:24px;text-align:center;padding:14px;font-size:75px;box-shadow:0 12px 35px #102f6030}.cards,.grid-panels{display:grid;grid-template-columns:repeat(auto-fit,minmax(215px,1fr));gap:16px;margin:25px 0}.panel{padding:22px;background:#fff;border:1px solid #cadbf1;border-radius:16px;box-shadow:0 6px 16px #20365210;min-height:210px;overflow-wrap:anywhere}.panel-top{display:flex;justify-content:space-between;align-items:center;color:var(--accent);font-weight:800}.mini-art{font-size:36px}.panel h2{font-size:20px}.panel p{white-space:normal;color:#334e66}.historietas .panel{border:3px solid #162e49;border-radius:8px}.historietas h2{background:#f6df63;padding:8px}.animes .mini-art,.animes .hero{animation:bob 1.7s ease-in-out infinite alternate}.flyers .hero{padding:24px;font-size:110px}.flyers main{max-width:740px}.flyers .cards{grid-template-columns:1fr}.flyers .panel{min-height:auto;text-align:center}.artwork{display:block;width:100%;max-height:250px;margin:20px auto;border-radius:18px;background:#dbeaff}footer{text-align:center;margin:30px 0;color:#6b7f92;font-size:12px}@keyframes bob{to{transform:translateY(-9px)}}@media(max-width:600px){main{padding:10px}header{padding:14px}.hero{font-size:60px}.cards{grid-template-columns:1fr}}';
 return {'index.html':html,'style.css':css,'script.js':'/* Creación del Club Krueka. Editá las escenas desde Mi obra. */','obra.json':JSON.stringify(d,null,2),'tipo-club.txt':cat,'LEEME.md':'# '+d.title+'\nCreá una obra propia, personalizá sus escenas y colores. Probá y enviá al profe para revisión. No uses nombres completos, fotos ni datos privados.'};
}
const originalCreate=StudioKits.create.bind(StudioKits);
StudioKits.create=function(id){return texts[id]?build(defaultData(id)):originalCreate(id);};
for(const c of categories)if(texts[c.id])StudioKits.catalog.push({id:c.id,icon:c.icon,title:c.name,tag:'CREACIÓN ORIGINAL',description:c.desc,challenge:'Escribí tres partes, cambiá el arte y probá el resultado.'});
const paths=StudioCreative.paths;
paths.length=0;
for(const c of categories)paths.push({id:c.id,icon:c.icon,title:c.name,tag:'ELEGÍ TU PRÓXIMA CREACIÓN',color:['blue','mint','violet','gold'][paths.length%4],text:c.desc,first:c.kit||c.id,kits:c.kits||[c.kit||c.id]});
const studio=StudioIA;
let panel=null,work=null,gallery=null,items=[],filter='todos',pending=null,lastId=null;
const allowed=categories.map(c=>c.id);
function isCreative(s){return allowed.includes(s.files['tipo-club.txt'])&&!!s.files['obra.json'];}
function rpc(s,name,params){
 if(window.KruekaStudioAccess)return KruekaStudioAccess.rpc(name,params);
 return db.rpc(name,params).then(({data,error})=>{if(error)throw error;return data;});
}
function mount(s){
 const p=document.getElementById('krueka-studio');if(!p)return;
 if(p===panel&&gallery?.isConnected)return;
 panel=p;lastId=null;
 const title=p.querySelector('.ks-brand');if(title)title.textContent='✦ Club Krueka';
 const tabs=p.querySelector('.ks-tabs');
 const a=document.createElement('button');a.className='ks-btn';a.dataset.tab='club-work';a.textContent='✏ Mi obra';a.onclick=()=>s.showTab('club-work');tabs.appendChild(a);
 const b=document.createElement('button');b.className='ks-btn';b.dataset.tab='club-gallery';b.textContent='🌟 Galería del Club';b.onclick=()=>s.showTab('club-gallery');tabs.appendChild(b);
 const home=p.querySelector('#ks-creative-home');
 if(home){const bar=document.createElement('div');bar.className='ck-home-actions';bar.innerHTML='<button class="ks-btn primary" id="ck-open-gallery">🌟 Ver creaciones de mis compañeros</button><p>Elegí lo que te gusta, creá, guardá y enviá al profe. Solo se comparten obras aprobadas.</p>';home.prepend(bar);bar.querySelector('button').onclick=()=>s.showTab('club-gallery');}
 work=document.createElement('section');work.className='ks-tool ck-editor';work.id='ks-club-work';work.hidden=true;
 work.innerHTML='<div class="ck-editor-head"><h2>✏ Editá tu creación</h2><p>Cambiá el título, los textos y el color. Mirá el resultado a la derecha.</p></div><form id="ck-form"><label>Título<input name="title" maxlength="80" required></label><label>Descripción<input name="subtitle" maxlength="140"></label><div class="ck-row"><label>Color de tu creación<input name="color" type="color"></label><label>Personaje o símbolo<input name="art" maxlength="8"></label></div><div id="ck-scenes"></div><div class="ck-editor-actions"><button type="button" class="ks-btn primary" id="ck-test">▶ Ver mi obra</button><button type="button" class="ks-btn" id="ck-save">Guardar</button><button type="button" class="ks-btn" id="ck-submit">Enviar al profe</button></div><p id="ck-status" role="status"></p></form>';
 p.querySelector('.ks-work').appendChild(work);
 work.querySelector('#ck-test').onclick=()=>s.playCurrent();
 work.querySelector('#ck-save').onclick=()=>s.save();
 work.querySelector('#ck-submit').onclick=()=>s.submit();
 work.querySelector('#ck-form').addEventListener('input',()=>{
  if(!s.cloudReady||s.busy||!isCreative(s))return;
  const form=work.querySelector('#ck-form'),old=read(s);
  const d={...old,title:form.elements.title.value,subtitle:form.elements.subtitle.value,
   color:form.elements.color.value,art:form.elements.art.value,
   panels:[0,1,2].map(i=>({title:form.elements['panel-title-'+i].value,text:form.elements['panel-text-'+i].value}))};
  try{s.validFiles({...s.files,...build(d)});}catch(e){work.querySelector('#ck-status').textContent=e.message;return;}
  s.files={...s.files,...build(d)};s.title=String(d.title||'Mi creación').slice(0,80);s.changed();
  work.querySelector('#ck-status').textContent='Cambios pendientes de guardar…';
  clearTimeout(pending);pending=setTimeout(()=>{if(!work.hidden){s.preview='index.html';s.renderPreviewOptions();s.renderPreview();}},550);
 });
 gallery=document.createElement('section');gallery.id='ks-club-gallery';gallery.className='ks-tool ck-gallery';gallery.hidden=true;
 gallery.innerHTML='<div class="ck-gallery-heading"><div><h2>🌟 Galería del Club Krueka</h2><p>Descubrí proyectos aprobados. Jugá, leé y explorá obras originales.</p></div><button class="ks-btn" id="ck-reload">↻ Actualizar</button></div><div class="ck-filters" id="ck-filters"></div><div id="ck-gallery-status" class="ck-gallery-status" role="status">Abrí la galería para ver las publicaciones.</div><div id="ck-gallery-cards" class="ck-gallery-cards"></div><div id="ck-viewer" class="ck-viewer" hidden><div class="ck-viewer-head"><strong id="ck-viewer-title"></strong><button class="ks-btn" id="ck-close-viewer">Cerrar obra</button></div><iframe id="ck-viewer-frame" sandbox="allow-scripts" referrerpolicy="no-referrer" title="Obra de un estudiante del Club"></iframe></div><p class="ck-safety">Las publicaciones se revisan antes de aparecer. No compartas información personal ni imágenes de otras personas.</p>';
 p.querySelector('.ks-work').appendChild(gallery);
 gallery.querySelector('#ck-reload').onclick=()=>load(s);
 gallery.querySelector('#ck-close-viewer').onclick=()=>closeViewer();
 const chips=[{id:'todos',name:'Todos',icon:'🌟'},...categories];
 gallery.querySelector('#ck-filters').replaceChildren(...chips.map(c=>{
  const btn=document.createElement('button');btn.type='button';btn.textContent=c.icon+' '+c.name;btn.dataset.category=c.id;btn.onclick=()=>{filter=c.id;renderCards(s);};return btn;
 }));
}
function read(s){try{return normalized(JSON.parse(s.files['obra.json']||'{}'));}catch(_e){return defaultData('cuentos');}}
function renderEditor(s){
 if(!isCreative(s))return;
 const d=read(s),form=work.querySelector('#ck-form');
 if(lastId!==s.projectId){s.checkpoint();lastId=s.projectId;}
 form.elements.title.value=d.title;form.elements.subtitle.value=d.subtitle;
 form.elements.color.value=d.color;form.elements.art.value=d.art;
 const wrap=work.querySelector('#ck-scenes');wrap.replaceChildren(...d.panels.map((p,i)=>{
  const section=document.createElement('fieldset');section.className='ck-scene';const lg=document.createElement('legend');lg.textContent='Parte '+(i+1);
  const l1=document.createElement('label');l1.textContent='Título';const input=document.createElement('input');input.name='panel-title-'+i;input.maxLength=95;input.value=p.title;l1.appendChild(input);
  const l2=document.createElement('label');l2.textContent='Texto o diálogo';const area=document.createElement('textarea');area.name='panel-text-'+i;area.maxLength=1200;area.rows=3;area.value=p.text;l2.appendChild(area);
  section.append(lg,l1,l2);return section;
 }));
 work.querySelector('#ck-status').textContent='Los cambios se guardan en tu proyecto personal.';
}
function closeViewer(){
 if(!gallery)return;const box=gallery.querySelector('#ck-viewer');
 if(box){box.hidden=true;box.querySelector('iframe').removeAttribute('srcdoc');}
}
function renderCards(s){
 if(!gallery)return;
 gallery.querySelectorAll('[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category===filter)));
 const list=items.filter(x=>filter==='todos'||x.category===filter),target=gallery.querySelector('#ck-gallery-cards');target.replaceChildren();
 gallery.querySelector('#ck-gallery-status').textContent=list.length?list.length+' creaciones aprobadas para explorar.':'Todavía no hay obras aprobadas en esta categoría.';
 for(const item of list){
  const cat=categories.find(c=>c.id===item.category)||categories[0],card=document.createElement('article');card.className='ck-card';
  const image=document.createElement('div');image.className='ck-card-icon';image.textContent=cat.icon;
  const heading=document.createElement('h3');heading.textContent=String(item.title||'Creación sin título').slice(0,80);
  const meta=document.createElement('small');meta.textContent=cat.name+' · Aprobado';
  const btn=document.createElement('button');btn.type='button';btn.className='ks-btn primary';btn.textContent=cat.id==='juegos'?'▶ Jugar':'👁 Ver creación';btn.onclick=()=>openViewer(s,item);
  card.append(image,heading,meta,btn);target.appendChild(card);
 }
}
async function load(s){
 const info=gallery.querySelector('#ck-gallery-status');info.textContent='Cargando las creaciones aprobadas…';
 try{const data=await rpc(s,'club_krueka_galeria',{p_student:s.sid(),p_device:s.did()});items=Array.isArray(data)?data:[];renderCards(s);}
 catch(e){items=[];renderCards(s);info.textContent='No se pudo cargar la galería: '+e.message;}
}
async function openViewer(s,item){
 const info=gallery.querySelector('#ck-gallery-status');info.textContent='Abriendo creación…';
 try{
  const d=await rpc(s,'club_krueka_obra',{p_student:s.sid(),p_device:s.did(),p_project:item.id});
  const files=s.validFiles(d.files);
  const html=StudioIA.buildPreview.call({files,dirname:StudioIA.dirname,resolve:StudioIA.resolve},'index.html');
  const box=gallery.querySelector('#ck-viewer');box.querySelector('#ck-viewer-title').textContent=String(item.title||'Creación').slice(0,80);
  box.hidden=false;box.querySelector('iframe').srcdoc=html;info.textContent='Obra aprobada. Podés explorarla desde aquí.';
  box.scrollIntoView({block:'nearest',behavior:'smooth'});
 }catch(e){info.textContent='No se pudo abrir esta creación: '+e.message;}
}
function ensureHome(s){
 const home=panel?.querySelector('#ks-creative-home');if(!home)return;
 const heading=home.querySelector('.kc-welcome h2');if(heading)heading.textContent='¿Qué querés crear hoy?';
 const desc=home.querySelector('.kc-welcome p');if(desc)desc.textContent='Elegí una idea, prepará tu obra y compartila con el Club cuando el profe la apruebe.';
 if(home.querySelector('.ck-home-actions'))return;
 const bar=document.createElement('div');bar.className='ck-home-actions';
 const btn=document.createElement('button');btn.type='button';btn.className='ks-btn primary';btn.textContent='🌟 Explorar creaciones del Club';btn.onclick=()=>s.showTab('club-gallery');
 const p=document.createElement('p');p.textContent='También podés continuar tus proyectos anteriores desde Mis proyectos.';
 bar.append(btn,p);home.prepend(bar);
}
const originalShow=studio.showTab,originalKit=studio.createKit,originalSwitch=studio.switchProject,originalClose=studio.close;
studio.showTab=function(name){
 const result=originalShow.apply(this,arguments);mount(this);
 if(name==='home')ensureHome(this);
 work.hidden=name!=='club-work';gallery.hidden=name!=='club-gallery';
 panel.classList.toggle('ck-club-gallery-open',name==='club-gallery');
 if(name==='club-work'){
  if(!isCreative(this)){work.querySelector('#ck-status').textContent='Seleccioná una plantilla de cuento, blog, historieta, drama, anime, flyer o dibujo en Talleres.';work.querySelector('#ck-form').hidden=true;}
  else{work.querySelector('#ck-form').hidden=false;renderEditor(this);}
 }
 if(name==='club-gallery'){closeViewer();filter='todos';load(this);}
 return result;
};
studio.createKit=async function(id){
 const previous=this.projectId;await originalKit.apply(this,arguments);
 if(texts[id]&&this.projectId!==previous&&isCreative(this))this.showTab('club-work');
};
studio.switchProject=async function(id){
 await originalSwitch.apply(this,arguments);
 if(this.projectId===id&&isCreative(this))this.showTab('club-work');
};
studio.close=async function(){clearTimeout(pending);closeViewer();panel=null;work=null;gallery=null;return originalClose.apply(this,arguments);};
window.ClubKrueka={categories,build,normalized,isCreative,load};
})();