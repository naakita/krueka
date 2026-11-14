/* Galería pública de Club Krueka. Lectura de obras aprobadas solamente. */
(function(){
'use strict';
const URL='https://janebfpnknapvntfqolf.supabase.co/rest/v1/rpc/';
const KEY='sb_publishable_mSuSFqWycvm9dQQzjpeaRA_kAyZOJl0';
const cats=[
 {id:'todos',name:'Todas',icon:'🌟'},{id:'juegos',name:'Videojuegos',icon:'🎮'},
 {id:'blogs',name:'Blogs',icon:'📰'},{id:'historietas',name:'Historietas',icon:'💬'},
 {id:'cuentos',name:'Cuentos',icon:'📖'},{id:'dramas',name:'Dramas',icon:'🎭'},
 {id:'animes',name:'Anime original',icon:'✨'},{id:'flyers',name:'Afiches',icon:'📣'},
 {id:'dibujos',name:'Dibujos',icon:'🎨'},{id:'animaciones',name:'Animaciones',icon:'🎞️'},
 {id:'videos',name:'Videos',icon:'🎬'}
];
const filters=document.getElementById('filters'),status=document.getElementById('gallery-status'),
 cards=document.getElementById('gallery-cards'),viewer=document.getElementById('viewer'),
 frame=document.getElementById('viewer-frame');
let items=[],selected='todos',active=null,busy=false,lastFocus=null;
function rpc(name,data){
 return fetch(URL+name,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify(data||{})})
 .then(async r=>{const value=await r.json();if(!r.ok)throw Error(value.message||'No se pudo consultar la galería.');return value;});
}
function setStatus(message){status.textContent=message;}
function catFor(id){return cats.find(c=>c.id===id)||cats[1];}
function filterControls(){
 filters.replaceChildren(...cats.map(c=>{
  const b=document.createElement('button');b.type='button';b.textContent=c.icon+' '+c.name;
  b.setAttribute('aria-pressed',String(c.id===selected));
  b.onclick=()=>{selected=c.id;filterControls();render();};
  return b;
 }));
}
function render(){
 cards.replaceChildren();
 const visible=items.filter(i=>selected==='todos'||i.category===selected);
 if(!items.length){setStatus('Todavía no hay obras publicadas. Los trabajos aparecerán aquí después de ser aprobados por el docente.');return;}
 setStatus(visible.length?visible.length+' creaciones aprobadas para explorar.':'No hay creaciones en esta categoría todavía.');
 for(const item of visible){
  const c=catFor(item.category),card=document.createElement('article');card.className='card';
  const icon=document.createElement('div');icon.className='card-icon';icon.textContent=c.icon;
  const h=document.createElement('h3');h.textContent=String(item.title||'Creación del Club').slice(0,80);
  const p=document.createElement('p');p.textContent=c.name+' · Obra aprobada';
  const btn=document.createElement('a');btn.className='ck-open-public';btn.href='club-krueka-obra.html?obra='+encodeURIComponent(item.id);btn.target='_blank';btn.rel='noopener noreferrer';
  btn.textContent=item.category==='juegos'?'▶ Jugar en nueva pestaña':'👁 Abrir creación ↗';
  card.append(icon,h,p,btn);cards.appendChild(card);
 }
}
function buildPreview(files){
 const html=String(files['index.html']||''),css=String(files['style.css']||'');
 const safeCss=css.replace(/<\/style/gi,'<\\/style');
 let doc=html.replace(/<link\b[^>]*href=["'](?:\.\/)?style\.css["'][^>]*>/gi,
   '<style>'+safeCss+'</style>');
 // Only named project files returned by the approved-only RPC can run.
 // Their order in index.html is preserved for game-config.js before game.js.
 doc=doc.replace(/<script\b[^>]*src=["'](?:\.\/)?([a-z0-9_-]+\.js)["'][^>]*><\/script>/gi,
   (tag,name)=>Object.prototype.hasOwnProperty.call(files,name)
     ?'<script>'+String(files[name]||'').replace(/<\/script/gi,'<\\/script')+'</script>'
     :tag);
 let csp='<meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; script-src &#39;unsafe-inline&#39;; style-src &#39;unsafe-inline&#39;; img-src data: blob:; font-src data:; media-src data: blob:; connect-src &#39;none&#39;; form-action &#39;none&#39;; base-uri &#39;none&#39;">';
 if(/<meta\s+name=["']krueka-python-runtime["']\s+content=["']pyodide["']/i.test(html)){
  csp=csp.replace('script-src &#39;unsafe-inline&#39;;','script-src &#39;unsafe-inline&#39; &#39;wasm-unsafe-eval&#39; https://cdn.jsdelivr.net;')
         .replace('connect-src &#39;none&#39;;','connect-src https://cdn.jsdelivr.net; worker-src blob:;');
 }
 if(/<head\b[^>]*>/i.test(doc))return doc.replace(/<head\b[^>]*>/i,match=>match+csp);
 return csp+doc;
}

async function open(item,trigger){
 if(busy)return;busy=true;setStatus('Abriendo la creación aprobada…');
 try{
  const project=await rpc('club_krueka_public_obra',{p_project:item.id});
  if(!project?.files)throw Error('La obra no está disponible.');
  active=item;lastFocus=trigger||document.activeElement;
  frame.srcdoc=buildPreview(project.files);
  document.getElementById('viewer-title').textContent=String(item.title||'Creación del Club').slice(0,80);
  document.getElementById('viewer-category').textContent=catFor(item.category).name+' · Club Krueka';
  viewer.hidden=false;document.body.style.overflow='hidden';
  document.getElementById('viewer-close').focus();
  setStatus('Explorando una obra aprobada.');
  try{history.replaceState(null,'','?obra='+encodeURIComponent(item.id)+'#creaciones');}catch(_e){}
 }catch(e){setStatus('No se pudo abrir esta creación: '+e.message);}finally{busy=false;}
}
function close(){
 frame.removeAttribute('srcdoc');viewer.hidden=true;document.body.style.overflow='';
 active=null;if(lastFocus&&lastFocus.isConnected)lastFocus.focus();
 try{history.replaceState(null,'',location.pathname+'#creaciones');}catch(_e){}
}
document.getElementById('viewer-close').onclick=close;
viewer.addEventListener('click',e=>{if(e.target===viewer)close();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!viewer.hidden)close();});
document.getElementById('viewer-share').onclick=async()=>{
 if(!active)return;const url=location.origin+location.pathname+'?obra='+encodeURIComponent(active.id);
 try{await navigator.clipboard.writeText(url);document.getElementById('viewer-share').textContent='✓ Enlace copiado';}
 catch(_e){prompt('Copiá el enlace de esta creación:',url);}
};
async function load(){
 if(busy)return;
 setStatus('Cargando las creaciones aprobadas…');
 try{
  const data=await rpc('club_krueka_public_galeria',{});
  items=Array.isArray(data)?data:[];render();
  const chosen=new URLSearchParams(location.search).get('obra');
  if(chosen){const target=items.find(i=>String(i.id)===chosen);if(target)location.replace('club-krueka-obra.html?obra='+encodeURIComponent(target.id));}
 }catch(e){items=[];cards.replaceChildren();setStatus('No pudimos cargar la galería. Comprobá la conexión e intentá de nuevo.');}
}
document.getElementById('reload').onclick=load;
filterControls();load();
})();
