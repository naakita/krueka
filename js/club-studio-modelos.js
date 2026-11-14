/* Modelos inspiradores del Club Krueka: crear copias editables, nunca publicar por defecto. */
(function(){
'use strict';
const list=window.KruekaEjemplos?.catalog||[],kits=window.StudioKits,club=window.ClubKrueka,studio=window.StudioIA,creative=window.StudioCreative;
if(!list.length||!kits||!club||!studio||!creative||window.KruekaModelos)return;
const templates={
 blog:{subtitle:'Ideas para inventar el futuro',art:'💡',panels:[
  {title:'Cómo nace una idea',text:'Observamos un problema de nuestro entorno y pensamos tres posibles soluciones.'},
  {title:'Probamos un prototipo',text:'Primero dibujamos. Después programamos. Finalmente pedimos a un compañero que lo pruebe.'},
  {title:'Compartimos lo aprendido',text:'Cada cambio nos ayudó a mejorar. ¿Qué crearías vos para ayudar a tu comunidad?'}
 ],color:'#0d88a8',tools:{layout:'Revista',font:'Moderna',backdrop:'#e7f6ff',action:'Ideas que se convierten en proyectos',author:'Equipo creativo'}},
 comic:{subtitle:'Un cómic de misterio, amistad y tecnología',art:'⚡',panels:[
  {title:'¡Una luz en el horizonte!',text:'Protagonista: ¡Tenemos que descubrir de dónde viene esa luz!'},
  {title:'El guardián del portal',text:'Lumo: El portal se abre cuando trabajamos juntos.'},
  {title:'Una nueva aventura',text:'Protagonista: ¡Lo conseguimos! ¿Qué habrá del otro lado?'}
 ],color:'#b43e86',tools:{layout:'Viñetas',font:'Cómic',backdrop:'#fff1f9',character:'🦊',partner:'🤖',action:'¡Nuestra gran aventura!',perScene:[
  {character:'🦊',speaker:'Vera',stage:'Ciudad del futuro',backdrop:'#f5a9f5',visual:'Personaje'},
  {character:'🤖',speaker:'Lumo',stage:'Portal brillante',backdrop:'#a9e5ff',visual:'Figura 3D',shape:'Cubo',hue:'#9e6ef3'},
  {character:'🦊',speaker:'Vera',stage:'Mundo desconocido',backdrop:'#c4f5e6',visual:'Personaje'}]}},
 cuento:{subtitle:'Una historia donde las ideas abren caminos',art:'🌳',panels:[
  {title:'Un mapa inesperado',text:'Nara encontró una hoja dorada donde estaba dibujada una ruta secreta.'},
  {title:'El árbol de las preguntas',text:'—¿Qué es más fuerte que el miedo? —preguntó el árbol. Nara pensó en sus amigos.'},
  {title:'La semilla de la amistad',text:'Con ayuda de todos cruzaron el río y descubrieron que compartir ideas cambia el mundo.'}
 ],color:'#21896f',tools:{layout:'Ilustrado',font:'Clásica',backdrop:'#ecfff5',action:'Una aventura empieza con una pregunta',character:'🦊'}},
 drama:{subtitle:'Una obra teatral original en tres actos',art:'🎭',panels:[
  {title:'El ruido misterioso',text:'Vera: ¿Escucharon eso? Parece venir del laboratorio.'},
  {title:'La pista secreta',text:'Leo: ¡Encontré un mapa detrás del armario!'},
  {title:'Una sorpresa compartida',text:'Lumo: ¡Era la máquina de ideas! ¡Misión cumplida!'}
 ],color:'#793eae',tools:{layout:'Escenario',font:'Moderna',backdrop:'#eceaff',action:'¡Se abre el telón!',perScene:[
  {character:'🧑‍🔬',speaker:'Vera',stage:'Aula oscura',backdrop:'#c6a5f4'},
  {character:'🧑‍🚀',speaker:'Leo',stage:'Laboratorio',backdrop:'#abdcee'},
  {character:'🤖',speaker:'Lumo',stage:'Gran escenario',backdrop:'#c9f0ce'}]}},
 anime:{subtitle:'Una aventura espacial animada original',art:'🌌',panels:[
  {title:'El poder despierta',text:'Vera: ¡Una señal nueva aparece en el cielo!'},
  {title:'El portal de energía',text:'Lumo: Para cruzar necesitamos valor y trabajo en equipo.'},
  {title:'La nueva constelación',text:'Vera: ¡La imaginación nos llevó más allá de las estrellas!'}
 ],color:'#6654e5',tools:{layout:'Storyboard',font:'Cómic',backdrop:'#eae6ff',effect:'Flotar',character:'🦸‍♀️',partner:'🤖',action:'¡La aventura comienza!',perScene:[
  {character:'🦸‍♀️',speaker:'Vera',stage:'Noche estelar',backdrop:'#bfc7ff'},
  {character:'🤖',speaker:'Lumo',stage:'Portal de energía',backdrop:'#d6b5f9',visual:'Figura 3D',shape:'Esfera',hue:'#91a7f5'},
  {character:'🦸‍♀️',speaker:'Vera',stage:'Nueva galaxia',backdrop:'#aae8ec'}]}},
 flyer:{subtitle:'Una invitación de ejemplo al mundo de las ideas',art:'🚀',panels:[
  {title:'🎮 Videojuegos originales',text:'Probá nuevas aventuras creadas por estudiantes.'},
  {title:'🤖 Tecnología creativa',text:'Descubrí prototipos, animaciones y dibujos.'},
  {title:'🎨 Arte y diseño',text:'Compartí personajes y colores inventados por vos.'}
 ],color:'#de5192',tools:{layout:'Cartel',font:'Moderna',backdrop:'#fff2db',action:'¡Un mundo de ideas para crear!',callToAction:'¡VenÍ a imaginar con nosotros!'}},
 dibujo:{subtitle:'Un taller de ilustración con colores y formas',art:'🎨',panels:[
  {title:'Formas y colores',text:'Un mismo dibujo puede cambiar completamente con otra paleta.'},
  {title:'Mi personaje original',text:'Dibujá una figura con un detalle que nadie haya imaginado antes.'},
  {title:'Mi exposición digital',text:'Probá un título y presentá tu obra al Club.'}
 ],color:'#ac4ea6',tools:{layout:'Lienzo',font:'Moderna',backdrop:'#f9efff',action:'Pintá una idea propia',strokes:[
  {type:'circle',color:'#ffd36b',width:6,points:[[120,80],[200,165]]},
  {type:'rectangle',color:'#3aa9e4',width:7,points:[[250,90],[360,245]]},
  {type:'pen',color:'#a24adc',width:9,points:[[80,245],[130,213],[192,235],[252,191],[320,230],[420,170]]}
 ]}}
};
function editable(s){
 if(s.category==='juegos')return window.KruekaEjemplos.make(s);
 if(s.category==='animaciones')return originalCreate('animation');
 if(s.category==='videos')return originalCreate('video-edit');
 const data=templates[s.id];if(!data)return originalCreate(s.starter);
 return club.build({kind:s.category,title:s.title,...data});
}
const originalCreate=kits.create.bind(kits);
kits.create=function(id){
 if(typeof id==='string'&&id.startsWith('modelo-')){
  const spec=list.find(x=>x.id===id.slice(7));
  if(spec)return editable(spec);
 }
 return originalCreate(id);
};
for(const model of list){
 const id='modelo-'+model.id;
 if(!kits.catalog.some(k=>k.id===id))kits.catalog.push({
  id,icon:model.icon,title:'⭐ '+model.title,tag:'MODELO PARA PERSONALIZAR',
  description:model.short+' · Partí de esta base para crear tu versión original.',
  challenge:'Probá el modelo, modificá al menos tres cosas y escribí qué aprendiste.'
 });
 const path=creative.paths.find(x=>x.id===model.category);
 if(path&&!path.kits.includes(id))path.kits.push(id);
}
// El modelo público se prueba sin cuenta. Para guardarlo como proyecto,
// el alumno decide explícitamente crear su copia cuando ya entró con código.
let asked=false;
const originalOpen=studio.open;
studio.open=async function(){
 const r=await originalOpen.apply(this,arguments);
 const requested=new URLSearchParams(location.search).get('plantilla');
 const spec=list.find(x=>x.id===requested);
 if(!spec||asked||!this.cloudReady)return r;
 asked=true;
 const dialog=this.dialog('Crear mi versión de '+spec.title,
  '<p>Esta es una <b>base editable del Club Krueka</b>. Se creará un proyecto nuevo en tu cuenta; los anteriores no se borrarán. Después podés personalizarlo y enviarlo al profe.</p><div class="row" style="display:flex;gap:10px;flex-wrap:wrap"><button class="ks-btn primary" id="krueka-use-model" type="button">✦ Crear mi versión</button><button class="ks-btn" id="krueka-cancel-model" type="button">Ahora no</button></div>');
 dialog.querySelector('#krueka-use-model').onclick=async()=>{
  await this.createKit('modelo-'+spec.id);
  try{history.replaceState(null,'',location.pathname);}catch(_e){}
 };
 dialog.querySelector('#krueka-cancel-model').onclick=()=>{
  dialog.remove();try{history.replaceState(null,'',location.pathname);}catch(_e){}
 };
 return r;
};
const previousShow=studio.showTab;
studio.showTab=function(tab){
 const r=previousShow.apply(this,arguments);
 if(tab==='home'){
  const home=document.getElementById('ks-creative-home');
  if(home&&!home.querySelector('#ck-explore-models')){
   const box=document.createElement('p');box.style.margin='16px 0';
   const a=document.createElement('a');a.id='ck-explore-models';a.href='club-krueka-galeria.html#ejemplos';a.target='_blank';a.rel='noopener noreferrer';
   a.textContent='💡 Ver los 10 ejemplos originales del Club y elegir una idea';
   a.style.cssText='display:inline-block;padding:12px 15px;border-radius:10px;background:#155579;color:#effffd;font-weight:800;text-decoration:none';
   box.append(a);home.prepend(box);
  }
 }
 return r;
};
window.KruekaModelos={catalog:list,editable};
})();