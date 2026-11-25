/* Galería pública Club Krueka.
   Obras de alumnos: sólo RPC de aprobados. Los modelos se etiquetan aparte. */
(function(){
'use strict';
const API='https://janebfpnknapvntfqolf.supabase.co/rest/v1/rpc/club_krueka_public_galeria';
const KEY='sb_publishable_mSuSFqWycvm9dQQzjpeaRA_kAyZOJl0';
const cats=[
 ['todos','Todas','#f6f2e8'],
 ['juegos','Videojuegos','#f5bb85'],['paginas','Páginas web','#b7c9e3'],['aplicaciones','Aplicaciones web','#c5c6e9'],['blogs','Blogs','#d1d9b8'],
 ['historietas','Historietas','#e8a7b2'],['cuentos','Cuentos','#bed8c6'],['libros','Libros','#e9d2a2'],
 ['dramas','Dramas','#e1aeb4'],['animes','Anime original','#c9bde1'],
 ['flyers','Afiches','#f4cb72'],['dibujos','Dibujos','#e8b7a7'],
 ['animaciones','Animaciones','#afd1d9'],['videos','Videos','#b3cceb']
];
const demo=Array.isArray(window.KruekaEjemplos?.catalog)?window.KruekaEjemplos.catalog:[];
const category=new Map(cats.map(([id,name,wash])=>[id,{id,name,wash}]));
const sections={alumnos:document.getElementById('alumnos'),ejemplos:document.getElementById('ejemplos')};
const elems={
 studentCount:document.getElementById('student-count'),
 demoCount:document.getElementById('demo-count'),
 studentCards:document.getElementById('gallery-cards'),
 demoCards:document.getElementById('example-cards'),
 status:document.getElementById('gallery-status'),
 total:document.getElementById('total'),
 reload:document.getElementById('reload')
};
let approved=[],scope='todas',filter='todos',term='',state='loading';
const fold=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es');
function makeButton(text,parent,pressed,clicked){
 const b=document.createElement('button');b.type='button';b.textContent=text;
 b.setAttribute('aria-pressed',String(pressed));b.onclick=clicked;parent.append(b);
}
function initFilters(){
 document.getElementById('category-picker').open=matchMedia('(min-width:701px)').matches;
 const nav=document.getElementById('categories');
 nav.replaceChildren();
 for(const [id,label] of cats)makeButton(label,nav,filter===id,()=>chooseCategory(id));
 document.querySelectorAll('[data-scope]').forEach(b=>{
  b.onclick=()=>{scope=b.dataset.scope;document.querySelectorAll('[data-scope]').forEach(v=>v.setAttribute('aria-pressed',String(v.dataset.scope===scope)));render();};
 });
}
function chooseCategory(id){
 filter=id;document.getElementById('selected-category').textContent=category.get(id).name;
 document.querySelectorAll('#categories button').forEach((v,i)=>v.setAttribute('aria-pressed',String(cats[i][0]===id)));render();
}
function matches(item){
 if(filter!=='todos'&&item.category!==filter)return false;
 return !term||fold(item.title+' '+(item.short||'')+' '+(category.get(item.category)?.name||'')).includes(term);
}
function artwork(cat){
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),use=document.createElementNS(ns,'use');
 svg.setAttribute('viewBox','0 0 100 72');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');
 use.setAttribute('href','assets/club/taller-pictogramas.svg#'+(cat.id==='todos'?'dibujos':cat.id));
 svg.append(use);return svg;
}
function cardFor(item,example){
 const cat=category.get(item.category)||{id:'todos',name:'Creación del Club',wash:'#f4cb93'};
 const a=document.createElement('article');a.className='kr-card';a.dataset.category=cat.id;
 const link=document.createElement('a');link.className='kr-card-link';
 const reader=cat.id==='libros'||cat.id==='historietas'||cat.id==='cuentos'||cat.id==='blogs';
 const action=cat.id==='juegos'?'Jugar':reader?'Leer':cat.id==='videos'||cat.id==='animaciones'?'Ver':'Explorar';
 const name=String(item.title||'Mi creación').slice(0,80);
 link.href=example?'club-krueka-ejemplo.html?ejemplo='+encodeURIComponent(item.id):
   'club-krueka-obra.html?obra='+encodeURIComponent(item.id);
 link.target='_blank';link.rel='noopener noreferrer';link.setAttribute('aria-label',action+': '+name+' (nueva pestaña)');
 const cover=document.createElement('div');cover.className='kr-card-cover';cover.style.setProperty('--wash',cat.wash);
 const tag=document.createElement('span');tag.textContent=example?'Modelo del Club':'Obra aprobada';
 cover.append(tag,artwork(cat));
 const info=document.createElement('div');info.className='kr-card-info';
 const meta=document.createElement('span');meta.className='kr-card-meta';meta.textContent=cat.name;
 const title=document.createElement('h3');title.textContent=name;
 info.append(meta,title);
 if(example){const desc=document.createElement('p');desc.textContent=String(item.short||'').slice(0,130);info.append(desc);}
 const cta=document.createElement('span');cta.className='kr-card-action';cta.textContent=action;
 const arrow=document.createElement('b');arrow.className='kr-arrow';arrow.setAttribute('aria-hidden','true');cta.append(arrow);
 info.append(cta);link.append(cover,info);a.append(link);
 return a;
}
function emptyMessage(parent,title,description){
 const box=document.createElement('div');box.className='status';
 const strong=document.createElement('strong');strong.textContent=title;
 const p=document.createElement('p');p.textContent=description;box.append(strong,p);parent.append(box);
}
function plural(n,s,p){return n+' '+(n===1?s:p);}
function render(){
 const s=approved.filter(matches),m=demo.filter(matches);
 const showStudent=scope!=='ejemplos',showDemo=scope!=='alumnos';
 sections.alumnos.hidden=!showStudent;sections.ejemplos.hidden=!showDemo;
 elems.studentCards.replaceChildren();elems.demoCards.replaceChildren();
 if(showStudent){
  for(const item of s)elems.studentCards.append(cardFor(item,false));
  if(!s.length){
   if(state==='error')emptyMessage(elems.studentCards,'No pudimos cargar las obras.','Revisá tu conexión y pulsá «Actualizar obras». Los modelos del Club siguen disponibles.');
   else if(state==='loading')emptyMessage(elems.studentCards,'Buscando obras aprobadas…','Podés explorar los modelos mientras se carga la galería.');
   else if(term||filter!=='todos')emptyMessage(elems.studentCards,'No hay obras de alumnos con este filtro.','Probá otra categoría o cambiá lo que buscaste.');
   else emptyMessage(elems.studentCards,'Todavía no hay obras publicadas.','Los proyectos aparecen acá cuando el profe los aprueba.');
  }
 }
 if(showDemo){
  for(const item of m)elems.demoCards.append(cardFor(item,true));
  if(!m.length)emptyMessage(elems.demoCards,'No hay modelos con ese filtro.','Probá otra categoría o cambiá lo que buscaste.');
 }
 const total=(showStudent?s.length:0)+(showDemo?m.length:0);
 elems.studentCount.textContent=state==='ready'?plural(s.length,'obra','obras'):'';
 elems.demoCount.textContent=plural(m.length,'modelo','modelos');
 elems.total.textContent=plural(total,'resultado','resultados');
 elems.status.textContent=state==='ready'?plural(s.length,'obra aprobada','obras aprobadas')+' en esta selección.':
  state==='loading'?'Cargando creaciones aprobadas…':'No se pudo cargar la lista de obras aprobadas.';
}
async function load(){
 state='loading';elems.reload.disabled=true;render();
 try{
  const res=await fetch(API,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:'{}'});
  const data=await res.json();
  if(!res.ok||!Array.isArray(data))throw Error('No se pudo consultar');
  approved=data.filter(item=>item&&typeof item.id==='string'&&typeof item.title==='string');
  state='ready';
  const selected=new URLSearchParams(location.search).get('obra');
  if(selected&&approved.some(p=>String(p.id)===selected))location.replace('club-krueka-obra.html?obra='+encodeURIComponent(selected));
 }catch(_err){
  approved=[];state='error';
 }finally{
  elems.reload.disabled=false;render();
 }
}
elems.reload.onclick=load;
document.getElementById('search-form').onsubmit=e=>{e.preventDefault();term=fold(document.getElementById('search').value.trim());render();};
document.getElementById('search').addEventListener('input',e=>{term=fold(String(e.target.value||'').trim());render()});
initFilters();load();
})();
