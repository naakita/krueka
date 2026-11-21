/* Biblioteca pública de Scratch y Roblox Studio: solo material educativo local, sin datos de alumnos. */
(function(){'use strict';
var library=window.KruekaGuiasCursos;
var article=document.getElementById('guia-lectura');
if(!library||!Array.isArray(library.tracks)||!library.tracks.length||!article){
 if(article)article.textContent='No se pudieron cargar las guías. Actualizá la página.';
 return;
}
var tracks=document.getElementById('guide-tracks');
var levels=document.getElementById('guide-levels');
var search=document.getElementById('guide-search');
var progress=document.getElementById('guide-progress');
var progressFill=document.getElementById('guide-progress-fill');
var progressTotal=document.getElementById('guide-completed-total');
var searchText='';
var params=new URLSearchParams(window.location.search);
var chosen=library.tracks.find(function(t){return t.id===params.get('ruta');})||library.tracks[0];
var selected=params.get('leccion');
var completed={};
try{completed=JSON.parse(sessionStorage.getItem('krueka-guide-progress-v1')||'{}')||{};}catch(_e){completed={};}
if(!completed||Array.isArray(completed)||typeof completed!=='object')completed={};

function node(tag,className,content){
 var el=document.createElement(tag);
 if(className)el.className=className;
 if(content!==undefined&&content!==null)el.textContent=String(content);
 return el;
}
function append(parent){for(var i=1;i<arguments.length;i++)if(arguments[i])parent.appendChild(arguments[i]);return parent;}
function allLessons(track){
 var flat=[];
 track.levels.forEach(function(level){level.lessons.forEach(function(lesson){flat.push({lesson:lesson,level:level});});});
 return flat;
}
function entries(){return allLessons(chosen);}
function findSelected(){return entries().find(function(entry){return entry.lesson.id===selected;});}
function saveProgress(){try{sessionStorage.setItem('krueka-guide-progress-v1',JSON.stringify(completed));}catch(_e){}}
function updateProgress(){
 var items=entries(),total=items.length,done=items.filter(function(entry){return completed[entry.lesson.id]===true;}).length;
 progressTotal.textContent=done+' / '+total;
 progress.setAttribute('aria-valuemax',String(total));
 progress.setAttribute('aria-valuenow',String(done));
 progressFill.style.width=(total?Math.round(100*done/total):0)+'%';
}
function makeButton(text,cls,onClick){var b=node('button',cls,text);b.type='button';b.addEventListener('click',onClick);return b;}
function choose(trackId,lessonId,focusArticle){
 var nextTrack=library.tracks.find(function(t){return t.id===trackId;});
 if(!nextTrack)return;
 chosen=nextTrack;
 var first=allLessons(chosen)[0];
 selected=allLessons(chosen).some(function(x){return x.lesson.id===lessonId;})?lessonId:first.lesson.id;
 searchText='';search.value='';
 render();
 try{var url=new URL(window.location.href);url.searchParams.set('ruta',chosen.id);url.searchParams.set('leccion',selected);history.replaceState(null,'',url.pathname+url.search+url.hash);}catch(_e){}
 if(focusArticle){article.focus({preventScroll:true});if(window.matchMedia&&window.matchMedia('(max-width:700px)').matches)article.scrollIntoView({behavior:'smooth',block:'start'});}
}
function renderTracks(){
 tracks.replaceChildren();
 library.tracks.forEach(function(track){
  var b=makeButton('', 'guide-track-button'+(chosen.id===track.id?' active':''),function(){choose(track.id,null,true);});
  b.dataset.track=track.id;
  b.setAttribute('aria-pressed',chosen.id===track.id?'true':'false');
  append(b,node('span','guide-track-icon',track.icon),node('strong','',track.name),node('small','',track.id==='scratch'?'Juegos 2D':'Mundos 3D'));
  tracks.appendChild(b);
 });
}
function matches(lesson){return (lesson.title+' '+lesson.goal+' '+lesson.steps.join(' ')).toLocaleLowerCase('es').includes(searchText);}
function renderLevels(){
 levels.replaceChildren();var visible=0;
 chosen.levels.forEach(function(level){
  var filtered=level.lessons.filter(matches);
  if(!filtered.length)return;
  visible+=filtered.length;
  var detail=node('details','guide-level');
  detail.open=searchText!==''||level.lessons.some(function(l){return l.id===selected;});
  var summary=node('summary');
  var copy=node('span');append(copy,node('span','guide-level-name',level.name),node('span','guide-level-meta',level.detail));
  summary.appendChild(copy);detail.appendChild(summary);
  var links=node('div','guide-level-list');
  filtered.forEach(function(lesson){
   var b=makeButton('', 'guide-lesson-button'+(selected===lesson.id?' active':'')+(completed[lesson.id]?' done':''),function(){choose(chosen.id,lesson.id,true);});
   if(selected===lesson.id)b.setAttribute('aria-current','step');
   append(b,node('span','guide-lesson-status',completed[lesson.id]?'✓':String(level.lessons.indexOf(lesson)+1)),node('span','',lesson.title));
   links.appendChild(b);
  });
  detail.appendChild(links);levels.appendChild(detail);
 });
 if(!visible)levels.appendChild(node('p','guide-no-results','No encontramos esa lección. Probá con otra palabra.'));
}
function section(title,icon){
 var sec=node('section','guide-section');
 var heading=node('h3');append(heading,node('span','guide-heading-icon',icon),node('span','',title));sec.appendChild(heading);
 return sec;
}
function referenceUrl(lesson){return Object.prototype.hasOwnProperty.call(library.references,lesson.reference)?library.references[lesson.reference]:chosen.actionUrl;}
function externalLink(text,url,cls){
 var a=node('a',cls,text);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;
}
function codeSnippet(code){
 var sec=section(chosen.id==='scratch'?'Bloques en orden':'Ejemplo de código o lista de revisión','</>');
 var top=node('div','guide-code-header');top.appendChild(node('strong','',chosen.id==='scratch'?'GUÍA DE BLOQUES · SCRATCH':'LUAU / PRÁCTICA · ROBLOX STUDIO'));
 var copy=makeButton('Copiar ejemplo','guide-copy',function(){
  var done=function(){copy.textContent='¡Copiado!';setTimeout(function(){copy.textContent='Copiar ejemplo';},1800);};
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(code).then(done,function(){copy.textContent='Seleccioná el texto para copiar';});}
  else copy.textContent='Seleccioná el texto para copiar';
 });
 top.appendChild(copy);
 var pre=node('pre','guide-code');pre.appendChild(node('code','',code));
 append(sec,top,pre,node('p','guide-code-help',chosen.id==='scratch'?'Estos nombres te indican qué bloques buscar en Scratch. Armá la secuencia arrastrándolos en el editor.':'Seguí la ubicación de cada script que se indica en los pasos. Revisá la ventana Output al probar.'));
 return sec;
}
function renderArticle(){
 var current=findSelected();if(!current)return;
 var lesson=current.lesson,level=current.level,items=entries();
 var position=items.findIndex(function(x){return x.lesson.id===lesson.id;});
 article.replaceChildren();article.dataset.track=chosen.id;
 var head=node('header','guide-article-head');
 var eye=node('div','guide-eyebrow');append(eye,node('span','guide-pill platform',chosen.icon+' '+chosen.name),node('span','guide-pill',level.name),node('span','guide-pill','Lección '+(position+1)+' de '+items.length));
 append(head,eye,node('h2','',lesson.title),node('p','guide-lead',lesson.goal));
 var actions=node('div','guide-article-head-actions');
 append(actions,externalLink(chosen.action+' ↗',chosen.actionUrl,'guide-launch'),externalLink('Consultar guía oficial ↗',referenceUrl(lesson),'guide-official'));
 head.appendChild(actions);article.appendChild(head);
 var notice=node('div','guide-notice');
 if(chosen.id==='roblox'){
  append(notice,node('strong','','Importante: Roblox Studio requiere instalarse en Windows o Mac. '),node('span','', 'No funciona dentro del navegador. Si la computadora del aula tiene modo kiosco, consultá al docente antes de instalar o abrir otra aplicación.'));
 }else{
  append(notice,node('strong','','Trabajá en Scratch desde la web. '),node('span','', 'Abrí el editor en otra pestaña, dejá esta guía a mano y construí tu proyecto a tu ritmo.'));
 }
 article.appendChild(notice);
 var steps=section('Seguí estos pasos','1–5');var ol=node('ol','guide-step-list');
 lesson.steps.forEach(function(step){ol.appendChild(node('li','',step));});steps.appendChild(ol);article.appendChild(steps);
 article.appendChild(codeSnippet(lesson.code));
 var checks=section('Probá y mejorá','✓');var cards=node('div','guide-card-grid');
 var check=node('div','guide-mini-card');append(check,node('h3','', '✓ Comprobá que funciona'),node('p','',lesson.check));
 var challenge=node('div','guide-mini-card challenge');append(challenge,node('h3','', '★ Desafío extra'),node('p','',lesson.challenge));
 append(cards,check,challenge);checks.appendChild(cards);checks.appendChild(append(node('p','guide-tip'),node('strong','','Si algo falla: '),node('span','',lesson.tip)));
 article.appendChild(checks);
 var footer=node('footer','guide-article-footer');var done=completed[lesson.id]===true;
 var complete=makeButton(done?'✓ Lección completada':'✓ Marcar como completada','guide-complete',function(){
  completed[lesson.id]=!completed[lesson.id];saveProgress();updateProgress();renderLevels();renderArticle();
  var latest=article.querySelector('.guide-complete');if(latest)latest.focus();
 });complete.setAttribute('aria-pressed',done?'true':'false');
 var controls=node('div','guide-next-controls');
 var prev=makeButton('← Anterior','guide-nav-btn',function(){choose(chosen.id,items[position-1].lesson.id,true);});prev.disabled=position===0;
 var next=makeButton('Siguiente →','guide-nav-btn next',function(){choose(chosen.id,items[position+1].lesson.id,true);});next.disabled=position===items.length-1;
 append(controls,prev,next);append(footer,complete,controls);article.appendChild(footer);
}
function render(){renderTracks();updateProgress();renderLevels();renderArticle();}
search.addEventListener('input',function(){searchText=search.value.trim().toLocaleLowerCase('es');renderLevels();});
var defaultLesson=entries()[0].lesson.id;
if(!findSelected())selected=defaultLesson;
render();
})();
