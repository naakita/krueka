/* Visor público aislado de modelos originales. */
(function(){
'use strict';
const params=new URLSearchParams(location.search);
const id=params.get('ejemplo')||'neon';
const model=window.KruekaEjemplos?.get(id);
const status=document.getElementById('status');
if(!model){status.textContent='Este modelo no existe. Volvé a la galería para elegir otro.';return;}
const book=id==='cuento'&&params.get('vista')==='libro'&&window.ClubTalleres;
const files=book?book.enhance({
 kind:'cuentos',title:model.title,subtitle:'Un cuento del Club Krueka',art:'🦊🌲',color:'#653823',
 panels:[
  {title:'La puerta escondida',text:'Una mañana, Nara encontró un mapa dibujado en una hoja dorada. Había dos senderos para llegar al árbol de los secretos.'},
  {title:'El sendero brillante',text:'Las luciérnagas dibujaban figuras entre las ramas. Nara siguió sus luces hasta el viejo puente, donde un búho custodiaba una caja de madera.'},
  {title:'El secreto del bosque',text:'La caja guardaba semillas y un mensaje: «El bosque crece con lo que compartimos». Nara llevó las semillas a su escuela. Cada compañero plantó una y escribió una historia para quien la encontrara.'},
 ],
 tools:{action:'El mapa de la hoja dorada',font:'Clásica'},
},{}):window.KruekaEjemplos.make(model);
if(id==='cuento'){
 const alternate=document.createElement('a');
 alternate.href='?ejemplo=cuento'+(book?'':'&vista=libro');
 alternate.textContent=book?'Elegir el camino de Nara →':'Hojear el libro →';
 document.getElementById('info').append(alternate);
}

const challenges={"neon":"Cambiá los colores de la nave, agregá una estrella especial y mejorá la puntuación.","blog":"Escribí una noticia del Club, agregá una ilustración propia y enlazá una fuente.","comic":"Inventá dos personajes y contá una aventura en tres viñetas con diálogos.","cuento":"Cambiá el escenario e inventá dos finales diferentes para que el lector elija.","drama":"Escribí tres actos, creá un conflicto y prepará la solución con tus personajes.","anime":"Diseñá un personaje original y hacelo aparecer en tres escenas diferentes.","flyer":"Diseñá un afiche para una actividad imaginaria con título, fecha y mensaje.","dibujo":"Combiná al menos tres herramientas para inventar la mascota de tu videojuego.","animacion":"Cambiá el movimiento, la velocidad y el color del robot, y contá qué pasó.","video":"Planificá una historia corta en cuatro escenas, con principio, desarrollo y final."};
const prompt=document.getElementById('model-challenge');
if(prompt)prompt.textContent='🎯 Tu desafío: '+(challenges[model.id]||'Creá una versión original y personalizala.');

const esc=s=>String(s||'').replace(/<\/script/gi,'<\\/script');
let doc=String(files['index.html']||'');
doc=doc.replace(/<link\b[^>]*href=["']style\.css["'][^>]*>/gi,()=>'<style>'+String(files['style.css']).replace(/<\/style/gi,'<\\/style')+'</style>');
doc=doc.replace(/<script\b[^>]*src=["']script\.js["'][^>]*><\/script>/gi,()=>'<script>'+esc(files['script.js'])+'</script>');
const policy='<meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; img-src data: blob:; style-src &#39;unsafe-inline&#39;; script-src &#39;unsafe-inline&#39;; connect-src &#39;none&#39;; font-src data:; media-src data: blob:; form-action &#39;none&#39;; base-uri &#39;none&#39;">';
doc=doc.replace(/<head\b[^>]*>/i,m=>m+policy);
document.getElementById('model-title').textContent=model.title;
document.getElementById('model-category').textContent='💡 MODELO ORIGINAL · '+model.tag;
document.title=model.title+' · Modelos del Club';
const frame=document.getElementById('preview');frame.srcdoc=doc;frame.hidden=false;status.hidden=true;
document.getElementById('start-model').href='club-krueka.html?plantilla='+encodeURIComponent(model.id);
document.getElementById('fullscreen').onclick=()=>{const stage=document.getElementById('preview-stage');if(stage.requestFullscreen)stage.requestFullscreen().catch(()=>{});};
const btn=document.getElementById('show-code');
let current='index.html';
function source(){document.getElementById('source').textContent=files[current];document.querySelectorAll('[data-file]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.file===current)));}
btn.onclick=()=>{const open=document.body.classList.toggle('code-open');btn.textContent=open?'✕ Ocultar código':'⌘ Ver código';if(open)source();};
document.querySelectorAll('[data-file]').forEach(b=>b.onclick=()=>{current=b.dataset.file;source()});
document.getElementById('copy').onclick=()=>navigator.clipboard?.writeText(files[current]).then(()=>{document.getElementById('copy').textContent='✓ Copiado';}).catch(()=>{});
})();