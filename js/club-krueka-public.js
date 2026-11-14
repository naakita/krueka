/* Galería pública Club Krueka: catálogo visual.
   Obras de alumnos: sólo RPC de aprobados. Ejemplos: archivos estáticos propios, etiquetados. */
(function(){
'use strict';
const API='https://janebfpnknapvntfqolf.supabase.co/rest/v1/rpc/club_krueka_public_galeria';
const KEY='sb_publishable_mSuSFqWycvm9dQQzjpeaRA_kAyZOJl0';
const cats=[
 ['todos','🌟','Todas'],
 ['juegos','🎮','Videojuegos'],['paginas','🌐','Páginas web'],['aplicaciones','📱','Aplicaciones web'],['blogs','📰','Blogs'],
 ['historietas','💬','Historietas'],['cuentos','📖','Cuentos'],
 ['dramas','🎭','Dramas'],['animes','✨','Anime original'],
 ['flyers','📣','Afiches'],['dibujos','🎨','Dibujos'],
 ['animaciones','🎞️','Animaciones'],['videos','🎬','Videos']
];
const demo=Array.isArray(window.KruekaEjemplos?.catalog)?window.KruekaEjemplos.catalog:[];
const category=Object.fromEntries(cats.map(([id,emoji,name])=>[id,{id,emoji,name}]));
const colors={
 paginas:['#236e94','#265c75','#142647'],
 aplicaciones:['#485db3','#3d756e','#162144'],
 juegos:['#173a91','#7032b7','#0d0d35'],
 blogs:['#0c6780','#17637d','#0f1c37'],
 historietas:['#9d326b','#6a287c','#1b123d'],
 cuentos:['#2b9271','#236e94','#122a43'],
 dramas:['#ae5278','#54247d','#1b1439'],
 animes:['#8f44d2','#2966bb','#141441'],
 flyers:['#e86c32','#d34882','#642d71'],
 dibujos:['#b64bba','#5265c5','#1a1a56'],
 animaciones:['#138fab','#5555c7','#101c45'],
 videos:['#b94d6c','#5856c4','#1a1c44']
};
const sections={
 alumnos:document.getElementById('alumnos'),
 ejemplos:document.getElementById('ejemplos')
};
const elems={
 studentCount:document.getElementById('student-count'),
 demoCount:document.getElementById('demo-count'),
 studentCards:document.getElementById('gallery-cards'),
 demoCards:document.getElementById('example-cards'),
 status:document.getElementById('gallery-status'),
 total:document.getElementById('total'),
 spotlight:document.getElementById('destacado')
};
let approved=[],scope='todas',filter='todos',term='',loaded=false;
function makeButton(text,parent,pressed,clicked){
 const b=document.createElement('button');b.type='button';b.textContent=text;
 b.setAttribute('aria-pressed',String(pressed));b.onclick=clicked;parent.append(b);
}
function initFilters(){
 const nav=document.getElementById('categories');
 nav.replaceChildren();
 for(const [id,emoji,label] of cats){
  makeButton(emoji+' '+label,nav,filter===id,()=>chooseCategory(id));
 }
 document.querySelectorAll('[data-scope]').forEach(b=>{
  b.onclick=()=>{scope=b.dataset.scope;document.querySelectorAll('[data-scope]').forEach(v=>v.setAttribute('aria-pressed',String(v.dataset.scope===scope)));render();};
 });
}
function chooseCategory(id){filter=id;document.querySelectorAll('#categories button').forEach((v,i)=>v.setAttribute('aria-pressed',String(cats[i][0]===id)));render();}
function matches(item){
 if(filter!=='todos'&&item.category!==filter)return false;
 if(term&&!String(item.title+' '+(item.short||'')+' '+(category[item.category]?.name||'')).toLowerCase().includes(term))return false;
 return true;
}
function cardFor(item,example){
 const cat=category[item.category]||category.juegos;
 const palette=example?item.colors:(colors[item.category]||colors.juegos);
 const a=document.createElement('article');a.className='card';
 const link=document.createElement('a');link.className='card-link';
 link.href=example?'club-krueka-ejemplo.html?ejemplo='+encodeURIComponent(item.id):
   'club-krueka-obra.html?obra='+encodeURIComponent(item.id);
 link.target='_blank';link.rel='noopener noreferrer';link.setAttribute('aria-label',(example?'Probar ejemplo: ':'Abrir obra aprobada: ')+String(item.title||'Creación'));
 const cover=document.createElement('div');cover.className='cover';cover.style.setProperty('--a',palette[0]);cover.style.setProperty('--b',palette[1]);cover.style.setProperty('--c',palette[2]);
 const graphic=document.createElement('span');graphic.className='cover-emoji';graphic.textContent=example?item.icon:cat.emoji;
 const secondary=document.createElement('span');secondary.className='mini-emoji';secondary.textContent=example?item.secondary:'✦';
 const tag=document.createElement('span');tag.className='cover-label';tag.textContent=example?'💡 MODELO DEL CLUB':'✓ OBRA APROBADA';
 cover.append(graphic,secondary,tag);
 const info=document.createElement('div');info.className='card-info';
 const meta=document.createElement('span');meta.className='card-meta';meta.textContent=cat.name+(example?' · Ejemplo original':' · Alumno del club');
 const title=document.createElement('h3');title.textContent=String(item.title||'Mi creación').slice(0,80);
 const desc=document.createElement('p');desc.textContent=example?String(item.short||'').slice(0,130):'Creación publicada y aprobada para explorar.';
 const cta=document.createElement('span');cta.className='card-action';cta.textContent=cat.id==='juegos'?'▶ Jugar en nueva pestaña':'👁 Explorar en nueva pestaña';
 info.append(meta,title,desc,cta);link.append(cover,info);a.append(link);
 return a;
}
function emptyMessage(parent,title,description){
 const box=document.createElement('div');box.className='status';
 const strong=document.createElement('strong');strong.textContent=title;
 const p=document.createElement('p');p.textContent=description;box.append(strong,p);parent.append(box);
}
function render(){
 const s=approved.filter(matches),m=demo.filter(matches);
 const showStudent=scope!=='ejemplos',showDemo=scope!=='alumnos';
 sections.alumnos.hidden=!showStudent;sections.ejemplos.hidden=!showDemo;
 elems.spotlight.hidden=Boolean(term)||(scope==='alumnos')||filter!=='todos';
 elems.studentCards.replaceChildren();elems.demoCards.replaceChildren();
 if(showStudent){
  for(const item of s)elems.studentCards.append(cardFor(item,false));
  if(!s.length)emptyMessage(elems.studentCards,loaded?'Todavía no hay obras en esta selección.':'Conectando con las creaciones…',loaded?'Probá otra categoría o explorá los modelos del Club.':'Esperá unos segundos.');
 }
 if(showDemo){
  for(const item of m)elems.demoCards.append(cardFor(item,true));
  if(!m.length)emptyMessage(elems.demoCards,'Sin modelos con ese filtro','Probá otra categoría o cambiá la búsqueda.');
 }
 elems.studentCount.textContent=s.length+' creaciones';
 elems.demoCount.textContent=m.length+' modelos';
 elems.total.textContent=(showStudent?s.length:0)+(showDemo?m.length:0)+' resultados';
 elems.status.textContent=loaded?s.length+' obras aprobadas en esta selección.':'Cargando creaciones aprobadas…';
}
async function load(){
 elems.status.textContent='Consultando los proyectos aprobados del Club…';
 try{
  const res=await fetch(API,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:'{}'});
  const data=await res.json();
  if(!res.ok||!Array.isArray(data))throw Error('No se pudo consultar');
  approved=data.filter(item=>item&&typeof item.id==='string'&&typeof item.title==='string');
  loaded=true;render();
  const selected=new URLSearchParams(location.search).get('obra');
  if(selected&&approved.some(p=>String(p.id)===selected))location.replace('club-krueka-obra.html?obra='+encodeURIComponent(selected));
 }catch(_err){
  approved=[];loaded=true;render();
  elems.status.textContent='No pudimos comprobar las publicaciones. Verificá internet y pulsá Actualizar obras.';
 }
}
document.getElementById('reload').onclick=load;
document.getElementById('search-form').onsubmit=e=>{e.preventDefault();term=document.getElementById('search').value.trim().toLocaleLowerCase('es');render();};
document.getElementById('search').addEventListener('input',e=>{term=String(e.target.value||'').trim().toLocaleLowerCase('es');render()});
initFilters();render();load();
})();