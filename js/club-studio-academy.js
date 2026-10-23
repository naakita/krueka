/* Academia de videojuegos Krueka · cursos originales, sin contenidos de pago ni servicios externos. */
(function(){
'use strict';
if(window.KruekaAcademy)return;
const FILENAME='curso-krueka.json';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const courses=[
{id:'fundamentos',kind:'stars',icon:'🚀',name:'Fundamentos de videojuegos',level:'Principiante',desc:'Aprendé cómo funciona un videojuego, personalizá reglas y publicá una creación propia.',lessons:[
['Conocé el motor','Un motor de videojuegos une imágenes, controles y reglas para crear una experiencia interactiva.','Entrá al Studio y reconocé la vista previa, las pestañas y el botón Guardar.','Pulsá Probar y mové tu personaje usando el teclado o los botones.','Ubicá Bases y reglas y explicá para qué sirve cada control.','¿Qué diferencia hay entre editar un juego y jugarlo?'],
['Construí una escena','La escena es el lugar donde sucede el juego: fondo, personajes y obstáculos.','Abrí Bases y reglas y elegí un escenario distinto.','Cambiá el personaje o el título del juego.','Aplicá los cambios y compará visualmente el antes y el después.','¿Qué cambió en la escena sin cambiar las reglas?'],
['Agregá comportamientos','Un comportamiento determina cómo responde un objeto al movimiento o al contacto.','Jugá y observá cómo se mueve el personaje.','En Bases y reglas, compará dos velocidades posibles.','Probá nuevamente y observá el efecto sobre los obstáculos.','¿Con cuál velocidad controlaste mejor al personaje?'],
['Entendé la lógica','Las reglas responden a situaciones: si ocurre algo, entonces el juego reacciona.','Jugá y buscá un ejemplo de choque, punto o recompensa.','Abrí Código y localizá game-config.js y game.js.','Identificá qué parte es configuración y cuál contiene las reglas.','Contá un ejemplo de condición y resultado que viste en el juego.'],
['Trabajá con variables','Una variable guarda un valor que puede cambiar, como vidas, tiempo o puntos.','Abrí Bases y reglas y anotá el valor de Vidas.','Cambialo y comprobá cuántos errores admite tu juego.','Encontrá ese mismo valor dentro de game-config.js.','¿Para qué sirve guardar vidas en una variable?'],
['Diseñá tu mapa','Un mapa organiza caminos, zonas seguras, obstáculos y objetivos.','Dibujá en papel o en LEEME.md un recorrido de inicio a meta.','Jugá la base y reconocé las zonas seguras y los peligros.','En Código, explorá cómo se distribuyen los elementos de la escena.','¿Cómo harías que el recorrido tenga un comienzo y un final claros?'],
['Leé expresiones','Una expresión combina números y operaciones para calcular un resultado.','Cambiá la velocidad y observá qué número cambia en la configuración.','Buscá en game.js una suma, comparación o multiplicación.','Explicá cómo afecta ese cálculo al movimiento o la puntuación.','¿Qué operación encontraste y qué calcula?'],
['Organizá componentes','Separar recursos y reglas facilita mejorar un juego sin romper todo.','Reconocé index.html, style.css, game-config.js y game.js.','Indicá qué archivo controla la presentación y cuál la lógica.','Modificá solo una regla en Bases y reglas y comprobá que lo demás se conserva.','¿Por qué conviene mantener separados los archivos?'],
['Ajustá tamaños','El tamaño de pantalla influye en los controles y la lectura de un juego.','Probá la vista de computadora.','Activá el botón Celular y buscá si los botones son cómodos.','Regresá a computadora y anotá una mejora para pantallas pequeñas.','¿Qué problema encontraste o qué comprobaste en ambos tamaños?'],
['Mejorá el rendimiento','Un juego eficiente evita trabajo innecesario y debe responder con fluidez.','Jugá un minuto y prestá atención a la respuesta del movimiento.','Compará el mismo juego en pantalla grande y en modo celular.','Elegí un ajuste sencillo de reglas y probá si conserva la jugabilidad.','¿Qué significa que un juego funcione con fluidez?'],
['Prepará una publicación','Publicar es compartir un juego probado, sin exponer datos personales.','Elegí un título claro y escribí una breve descripción en LEEME.md.','Probá el inicio, los controles y el final del juego.','Usá Descargar para obtener una copia; pedí revisión al profe antes de compartirla públicamente.','¿Qué datos personales no deberían aparecer en un juego publicado?'],
['Afiná el control','Un control debe ser previsible y cómodo para quien juega.','Probá movimientos cortos y largos.','Ajustá la velocidad y repetí exactamente la misma prueba.','Compará teclado y controles táctiles cuando estén disponibles.','¿Qué cambio hizo más fácil controlar el juego?'],
['Combiná reglas','Las reglas interactúan: cambiar tiempo y velocidad a la vez modifica la dificultad.','Guardá una versión con tiempo y vidas originales.','Probá otra combinación de tiempo, velocidad y vidas.','Elegí la versión más justa y explicá por qué.','¿Qué dos variables influyeron juntas en el desafío?'],
['Probá situaciones especiales','Los errores suelen aparecer cuando el jugador gana, pierde o reinicia.','Jugá hasta ganar o perder.','Usá Reiniciar y comprobá qué valores vuelven a comenzar.','Registrá en LEEME.md un problema detectado o una prueba superada.','¿Qué debería pasar si el jugador se queda sin vidas?'],
['Proyecto final: tu primer juego','Una creación terminada tiene reglas claras, pruebas y explicación de las decisiones.','Personalizá título, fondo, dificultad y personaje.','Jugá dos partidas completas y corregí una dificultad.','Guardá en Krueka y usá Enviar al profe para solicitar revisión privada.','¿Qué mejoraste y cómo comprobaste que funciona?']
]},
{id:'ciudad3d',kind:'cinematic3d',icon:'🏙️',name:'Creá una aventura en ciudad 3D',level:'Intermedio',desc:'Construí una ciudad explorable con personajes, recorridos y misiones. No incluye conducción de vehículos en esta base.',lessons:[
['Conocé el escenario 3D','Un mundo tridimensional utiliza profundidad, cámaras y objetos ubicados en el espacio.','Creá la base HORIZON FORGE desde este curso.','Pulsá Probar y caminá usando los controles disponibles.','Reconocé el punto de partida y la meta de la misión.','¿Qué te permite hacer una cámara 3D que no hace una escena fija?'],
['Elegí un distrito','Un distrito reúne edificios, calles y zonas con una misma ambientación.','Abrí Bases y reglas y elegí ciudad, fábrica o puerto.','Compará dos opciones de iluminación.','Probá ambas versiones desde el mismo punto de partida.','¿Qué ambiente comunica mejor la historia de tu juego?'],
['Diseñá personajes','Los personajes deben distinguirse y cumplir una función en la historia.','Abrí la etapa Personajes del editor.','Modificá un nombre y un rasgo visual de un personaje.','Probá cómo se ve en el escenario sin cambiar a los demás.','¿Cuál es el papel de cada personaje en tu aventura?'],
['Programá el movimiento','La velocidad y el salto determinan cómo se recorre el mundo.','Probá caminar, correr y saltar.','En el editor, buscá las opciones de movimiento disponibles.','Ajustá un parámetro y repetí el recorrido anterior.','¿Qué cambió en el desplazamiento?'],
['Agregá retos','Una misión necesita obstáculos y metas alcanzables.','Observá los obstáculos y la patrulla del escenario.','Planificá un recorrido alternativo para llegar a la salida.','Probá el recorrido sin modificar el código del motor.','¿El jugador puede completar la misión sin quedar atrapado?'],
['Creá diálogos','El diálogo ayuda a explicar la historia y los objetivos.','Entrá a la etapa Acciones y voces.','Cambiá una frase de interacción; conservá los subtítulos.','Acercate al personaje y probá la interacción correspondiente.','¿El diálogo ayuda al jugador a entender qué debe hacer?'],
['Ajustá la dificultad','Una buena misión exige atención, pero permite aprender y mejorar.','Jugá la misión completa una vez.','Identificá una zona demasiado fácil o difícil.','Ajustá una regla disponible y repetí la misma ruta.','¿Cómo hiciste más justa la misión?'],
['Presentá tu ciudad 3D','El proyecto final debe reunir ambiente, personaje, recorrido y objetivo.','Elegí el mejor ambiente y revisá el diálogo.','Completá una partida, incluyendo el objetivo final.','Guardá en Krueka y enviá al profe para revisión.','¿Qué parte de tu ciudad hace que el juego sea divertido?']
]},
{id:'supervivencia',kind:'neon-rift',icon:'⚔️',name:'Supervivencia por oleadas',level:'Intermedio',desc:'Aprendé a crear desafíos de acción, enemigos, mejoras y repetición de partidas usando el juego NEON RIFT.',lessons:[
['Explorá la arena','En una arena de supervivencia, el jugador debe esquivar peligros y permanecer activo.','Creá NEON RIFT desde este curso.','Jugá y practicá movimiento, disparos y habilidad DASH.','Observá cómo comienza y termina una ronda.','¿Qué acciones ayudan a sobrevivir?'],
['Entendé las oleadas','Las oleadas organizan los enemigos en desafíos sucesivos.','Jugá hasta que aparezca una nueva oleada.','Abrí Bases y reglas y observá el control de oleadas.','Probá una versión corta y otra más larga.','¿Qué diferencia hay entre una partida de una oleada y otra de tres?'],
['Ajustá enemigos','Los enemigos crean presión mediante su movimiento y sus ataques.','Observá el patrón de los enemigos sin disparar durante unos segundos.','Abrí game-config.js para encontrar las reglas editables.','Cambiá un parámetro admitido y comprobá que no impide jugar.','¿Qué hace predecible o difícil a un enemigo?'],
['Trabajá con vidas','La cantidad de vidas determina cuánto dura un intento.','Jugá con la cantidad original de vidas.','En Bases y reglas, elegí una cantidad diferente.','Compará cuánto podés avanzar en ambas pruebas.','¿Cómo afecta el número de vidas al desafío?'],
['Diseñá una habilidad','Una habilidad especial ofrece una decisión táctica al jugador.','Probá DASH y observá cuándo vuelve a estar disponible.','Explicá cuándo conviene usarla en lugar de disparar.','Registrá una mejora que propondrías para esa habilidad.','¿Qué ventaja y qué límite tiene DASH?'],
['Equilibrá la dificultad','La dificultad depende de varios valores, no solamente de agregar enemigos.','Compará dos velocidades o dos valores de daño.','Probá cada versión con la misma estrategia.','Dejá en tu proyecto los valores que consideres más justos.','¿Qué combinación te dio un reto entretenido?'],
['Entendé la repetición','Volver a jugar permite practicar y descubrir estrategias distintas.','Terminá una partida y reiniciá.','Probá una segunda estrategia desde el comienzo.','Anotá qué información te sirvió de la partida anterior.','¿Qué aprendiste entre la primera partida y la segunda?'],
['Proyecto final: arena propia','Una arena completa combina controles claros, enemigos y dificultad equilibrada.','Poné un título propio y ajustá vidas, velocidad, daño y oleadas.','Jugá una partida hasta su final y corregí un problema.','Guardá tu juego y envialo al profe desde Krueka.','¿Cuál fue la mejora principal de tu arena?']
]},
{id:'plataformas',kind:'platform',icon:'🦊',name:'Creá un juego de plataformas',level:'Principiante',desc:'Diseñá saltos, obstáculos, recompensas y una meta en un videojuego 2D.',lessons:[
['Conocé las plataformas','Un juego de plataformas combina saltos, superficies y un objetivo.','Creá Salto al bosque desde este curso.','Jugá y reconocé el suelo, las plataformas y los peligros.','Practicá el salto hasta llegar a una recompensa.','¿Qué necesita el personaje para alcanzar una plataforma?'],
['Controlá saltos y gravedad','La gravedad hace que el personaje vuelva al suelo después de saltar.','Saltá varias veces y observá la altura aproximada.','Explorá game.js para encontrar movimiento y gravedad.','Explicá con tus palabras qué pasa al dejar de subir.','¿Qué ocurriría si no existiera gravedad?'],
['Creá recompensas','Los objetos coleccionables dan objetivos y motivan a explorar.','Recorré el juego y reconocé los cristales.','En Bases y reglas cambiá la meta de puntos.','Probá si la meta es alcanzable en una partida.','¿Cómo sabés que una meta es justa?'],
['Diseñá obstáculos','Los obstáculos invitan a controlar el tiempo y la dirección de cada salto.','Jugá buscando dónde aparecen los peligros.','Dibujá un nivel alternativo en LEEME.md con tres obstáculos.','Probá el nivel existente y explicá qué cambiarías en el motor.','¿Qué hace que un obstáculo sea difícil pero posible?'],
['Ajustá dificultad y controles','La velocidad, el tiempo y las vidas determinan la experiencia de juego.','Cambiá dos valores en Bases y reglas.','Probá la nueva combinación con teclado y, si existen, botones táctiles.','Elegí la versión más accesible y guardala.','¿Qué cambio ayudó más al jugador?'],
['Proyecto final de plataformas','Un buen juego se puede explicar, jugar, probar y mejorar.','Elegí título, personaje y escenario propios.','Terminá una partida y verificá puntos, reinicio y controles.','Guardá y enviá la versión final al profe.','¿Qué parte del juego te gustaría mejorar en una segunda versión?']
]}
];
const state={index:0,overview:null,busy:false,panel:null,view:null};
function progress(studio){
 try{const p=JSON.parse(String(studio.files[FILENAME]||'null'));if(p&&p.version===1&&courses.some(c=>c.id===p.courseId)&&p.done&&typeof p.done==='object'&&!Array.isArray(p.done))return p;}catch(_e){}
 return null;
}
function current(studio){const p=progress(studio);return courses.find(c=>c.id===p?.courseId)||null;}
function count(p){return Object.values(p?.done||{}).filter(x=>x&&x.complete===true).length;}
function status(studio,msg){const el=state.view?.querySelector('#ka-status');if(el)el.textContent=msg;}
async function persist(studio,p){
 if(studio.busy||!studio.cloudReady)throw Error('Tu proyecto debe estar abierto y conectado a Krueka.');
 const raw=JSON.stringify(p,null,2),files=studio.validFiles({...studio.files,[FILENAME]:raw});
 studio.checkpoint();studio.files=files;studio.changed();
 const ok=await studio.save();if(!ok)throw Error('No se pudo guardar en la nube. No cierres el proyecto; reintentá Guardar.');
}
function styles(){
 if(document.getElementById('ka-style'))return;
 const css=document.createElement('style');css.id='ka-style';
 css.textContent=[
 '#krueka-studio .ka{padding:22px;overflow:auto;height:100%;color:#eaf2ff;font:inherit}',
 '#krueka-studio .ka *{box-sizing:border-box}',
 '#krueka-studio .ka-top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:20px}',
 '#krueka-studio .ka-eyebrow{font-weight:800;color:#77d9ff;font-size:11px;letter-spacing:.1em}',
 '#krueka-studio .ka h2{font-size:clamp(23px,3vw,34px);margin:8px 0;line-height:1.15}',
 '#krueka-studio .ka h3{font-size:18px;margin:0 0 8px}',
 '#krueka-studio .ka p{color:#b6c6de;line-height:1.55}',
 '#krueka-studio .ka-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}',
 '#krueka-studio .ka-card,#krueka-studio .ka-panel{border:1px solid #31465f;border-radius:16px;padding:19px;background:linear-gradient(145deg,#162338,#101927)}',
 '#krueka-studio .ka-card{display:flex;flex-direction:column;gap:9px}',
 '#krueka-studio .ka-card p{margin:0 0 auto}',
 '#krueka-studio .ka-icon{font-size:28px}',
 '#krueka-studio .ka-chip{font-size:11px;font-weight:800;color:#95ccff}',
 '#krueka-studio .ka-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;border-radius:10px;padding:11px 14px;border:1px solid #536b86;background:#26364d;color:#fff;cursor:pointer;font:inherit;font-weight:700}',
 '#krueka-studio .ka-btn.primary{background:#3076e8;border-color:#518dfa}',
 '#krueka-studio .ka-btn:disabled{opacity:.5;cursor:not-allowed}',
 '#krueka-studio .ka-actions{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}',
 '#krueka-studio .ka-track{height:8px;border-radius:9px;background:#283b53;overflow:hidden}',
 '#krueka-studio .ka-track i{display:block;height:100%;background:#54cbab}',
 '#krueka-studio .ka-layout{display:grid;grid-template-columns:175px minmax(0,1fr);gap:14px}',
 '#krueka-studio .ka-outline{display:flex;flex-direction:column;gap:6px;max-height:480px;overflow:auto}',
 '#krueka-studio .ka-outline button{font:inherit;text-align:left;color:#c8dbef;border:1px solid #2e435d;background:#101b2b;border-radius:9px;padding:10px;cursor:pointer}',
 '#krueka-studio .ka-outline button[aria-current="step"]{border-color:#59b6ff;background:#163d65;color:#fff}',
 '#krueka-studio .ka-outline .done{color:#8df3bd}',
 '#krueka-studio .ka-steps{list-style:none;padding:0;display:grid;gap:12px}',
 '#krueka-studio .ka-steps li{padding:12px 14px;background:#0d1b2c;border-left:3px solid #5daeff;border-radius:9px;line-height:1.5}',
 '#krueka-studio .ka-steps b{display:block;color:#a6d9ff;font-size:12px;margin-bottom:4px}',
 '#krueka-studio .ka-verify{display:grid;gap:10px;margin:18px 0}',
 '#krueka-studio .ka-verify label{display:flex;gap:10px;align-items:flex-start;line-height:1.4}',
 '#krueka-studio .ka-verify input{width:17px;height:17px;flex:none;accent-color:#48bb93}',
 '#krueka-studio .ka textarea{width:100%;min-height:85px;resize:vertical;border:1px solid #4d6987;border-radius:10px;background:#081626;color:#fff;padding:12px;font:inherit}',
 '#krueka-studio .ka-notice{border:1px solid #46668a;padding:12px;border-radius:10px;color:#c5d8eb;font-size:12px;background:#102137}',
 '#krueka-studio .ka-mini{font-size:12px;color:#9aafc6}',
 '@media(max-width:900px){#krueka-studio .ka-grid{grid-template-columns:1fr}#krueka-studio .ka-layout{grid-template-columns:1fr}#krueka-studio .ka-outline{max-height:180px}#krueka-studio .ka{padding:13px}}'
 ].join('');
 document.head.appendChild(css);
}
function home(studio){
 const p=progress(studio),assigned=current(studio);
 state.view.innerHTML='<div class="ka-top"><div><span class="ka-eyebrow">CLUB DE INFORMÁTICA · ACADEMIA KRUEKA</span><h2>Creá videojuegos aprendiendo.</h2><p>37 lecciones originales, organizadas en cuatro cursos. El editor y los proyectos son de Krueka; no necesitás comprar cursos externos.</p></div></div>'+
 (assigned?'<div class="ka-panel"><b>Tu curso de este proyecto: '+esc(assigned.name)+'</b><p>'+count(p)+' de '+assigned.lessons.length+' lecciones marcadas como realizadas.</p><div class="ka-track"><i style="width:'+(100*count(p)/assigned.lessons.length)+'%"></i></div><div class="ka-actions"><button class="ka-btn primary" data-resume="'+assigned.id+'">Continuar mi curso →</button><button class="ka-btn" id="ka-submit">Enviar proyecto al profe</button></div></div>':'<p class="ka-notice">Cada curso crea un proyecto nuevo. Podés recuperar cualquiera desde «Mis proyectos» del Studio. El avance de cada curso viaja con ese proyecto cuando se guarda en Krueka.</p>')+
 '<div class="ka-grid" style="margin-top:14px">'+courses.map(c=>'<article class="ka-card"><span class="ka-icon">'+c.icon+'</span><small class="ka-chip">'+esc(c.level)+' · '+c.lessons.length+' lecciones</small><h3>'+esc(c.name)+'</h3><p>'+esc(c.desc)+'</p><div class="ka-actions"><button class="ka-btn" data-overview="'+c.id+'">Ver temario</button><button class="ka-btn primary" data-start="'+c.id+'">Crear mi proyecto →</button></div></article>').join('')+'</div><p class="ka-mini">Importante: las casillas de avance son una autoevaluación, no una calificación automática. El profe revisa los proyectos enviados.</p><p id="ka-status" role="status" aria-live="polite"></p>';
 state.view.querySelectorAll('[data-overview]').forEach(b=>b.onclick=()=>{state.overview=b.dataset.overview;overview(studio,b.dataset.overview);});
 state.view.querySelectorAll('[data-start]').forEach(b=>b.onclick=()=>begin(studio,b.dataset.start));
 state.view.querySelectorAll('[data-resume]').forEach(b=>b.onclick=()=>{state.overview=null;state.index=0;render(studio);});
 const submit=state.view.querySelector('#ka-submit');if(submit)submit.onclick=()=>studio.submit();
}
function overview(studio,id){
 const c=courses.find(x=>x.id===id);if(!c)return home(studio);
 state.view.innerHTML='<button class="ka-btn" id="ka-back">← Volver a cursos</button><div class="ka-top"><div><span class="ka-eyebrow">'+esc(c.level)+' · '+c.lessons.length+' CLASES DE 60 MINUTOS</span><h2>'+c.icon+' '+esc(c.name)+'</h2><p>'+esc(c.desc)+'</p></div></div><section class="ka-panel"><h3>Qué vas a aprender</h3><ol>'+c.lessons.map(l=>'<li style="margin:9px 0">'+esc(l[0])+' — '+esc(l[1])+'</li>').join('')+'</ol><button class="ka-btn primary" id="ka-start">Crear mi proyecto y empezar →</button></section><p id="ka-status" role="status" aria-live="polite"></p>';
 state.view.querySelector('#ka-back').onclick=()=>{state.overview=null;home(studio)};
 state.view.querySelector('#ka-start').onclick=()=>begin(studio,id);
}
async function begin(studio,id){
 const c=courses.find(x=>x.id===id);if(!c||state.busy)return;
 if(studio.busy||!studio.cloudReady){status(studio,'Ingresá con tu código personal y comprobá que tu proyecto esté conectado.');return;}
 if(!confirm('Este curso creará un proyecto NUEVO en Mis proyectos. Tu trabajo actual no se borrará. ¿Continuar?'))return;
 state.busy=true;status(studio,'Creando tu proyecto en Krueka…');
 try{
  const before=studio.projectId;
  await studio.createKit(c.kind);
  if(!studio.cloudReady||studio.projectId===before||StudioKits.read(studio.files)?.kind!==c.kind)throw Error('No se pudo confirmar la creación del proyecto. Revisá Mis proyectos.');
  const p={version:1,courseId:c.id,done:{}};
  await persist(studio,p);
  state.index=0;state.overview=null;studio.showTab('academy');
 }catch(e){status(studio,e.message||'No se pudo iniciar el curso.');}
 finally{state.busy=false;}
}
function lesson(studio,c,p){
 const i=Math.max(0,Math.min(c.lessons.length-1,state.index));state.index=i;
 const l=c.lessons[i],done=p.done[String(i)],completed=count(p),percent=Math.round(100*completed/c.lessons.length);
 state.view.innerHTML='<div class="ka-top"><div><button class="ka-btn" id="ka-catalog">← Cursos</button><p class="ka-eyebrow">'+esc(c.name)+' · '+(i+1)+' / '+c.lessons.length+'</p><h2>'+esc(l[0])+'</h2><p>'+esc(l[1])+'</p></div></div>'+
 '<div class="ka-track" role="progressbar" aria-valuemin="0" aria-valuemax="'+c.lessons.length+'" aria-valuenow="'+completed+'" aria-label="Lecciones realizadas"><i style="width:'+percent+'%"></i></div><p class="ka-mini">'+completed+' de '+c.lessons.length+' lecciones realizadas. Proyecto: '+esc(studio.title)+'</p>'+
 '<div class="ka-layout"><nav class="ka-outline" aria-label="Lecciones del curso">'+c.lessons.map((x,j)=>'<button data-lesson="'+j+'" aria-current="'+(j===i?'step':'false')+'" class="'+(p.done[String(j)]?.complete?'done':'')+'">'+(p.done[String(j)]?.complete?'✓ ':'')+(j+1)+'. '+esc(x[0])+'</button>').join('')+'</nav>'+
 '<section class="ka-panel"><span class="ka-eyebrow">ACTIVIDAD GUIADA · 60 MINUTOS</span><h3>Hacé esto en tu juego</h3><ol class="ka-steps">'+[l[2],l[3],l[4]].map((a,j)=>'<li><b>'+['10 min · OBSERVÁ','20 min · CONSTRUÍ','20 min · PROBÁ'][j]+'</b>'+esc(a)+'</li>').join('')+'</ol>'+
 '<div class="ka-actions"><button id="ka-editor" class="ka-btn">✎ Abrir editor</button><button id="ka-play" class="ka-btn primary">▶ Probar juego</button><button id="ka-code" class="ka-btn">Ver archivos</button></div>'+
 '<div class="ka-notice"><b>Últimos 10 minutos: explicá y comprobá.</b><p>'+esc(l[5])+'</p></div>'+
 '<div class="ka-verify"><label><input id="ka-check-work" type="checkbox"> Hice los cambios de esta lección.</label><label><input id="ka-check-test" type="checkbox"> Probé mi juego y observé el resultado.</label><label for="ka-note">Explicá qué hiciste y cómo salió la prueba (al menos 15 caracteres).</label><textarea id="ka-note" maxlength="600" placeholder="Cambié… Lo probé… Aprendí…">'+esc(done?.note||'')+'</textarea></div>'+
 '<div class="ka-actions"><button id="ka-complete" class="ka-btn primary" '+(done?.complete?'disabled':'')+'>'+(done?.complete?'✓ Lección registrada':'Registrar esta lección')+'</button><button id="ka-submit" class="ka-btn">Enviar proyecto al profe</button></div>'+
 '<p class="ka-mini">Registro personal de avance, no nota automática. Guardá y esperá «✓ Guardado en Krueka» antes de cerrar.</p><p id="ka-status" role="status" aria-live="polite"></p>'+
 '<div class="ka-actions"><button id="ka-prev" class="ka-btn" '+(i===0?'disabled':'')+'>← Anterior</button><button id="ka-next" class="ka-btn" '+(i===c.lessons.length-1?'disabled':'')+'>Siguiente →</button></div></section></div>';
 state.view.querySelector('#ka-catalog').onclick=()=>home(studio);
 state.view.querySelectorAll('[data-lesson]').forEach(b=>b.onclick=()=>{state.index=Number(b.dataset.lesson);render(studio)});
 state.view.querySelector('#ka-editor').onclick=()=>studio.showTab('create');
 state.view.querySelector('#ka-play').onclick=()=>studio.playCurrent();
 state.view.querySelector('#ka-code').onclick=()=>{if(!document.getElementById('ks-code').classList.contains('on'))studio.toggleCode();};
 state.view.querySelector('#ka-submit').onclick=()=>studio.submit();
 state.view.querySelector('#ka-prev').onclick=()=>{state.index--;render(studio)};
 state.view.querySelector('#ka-next').onclick=()=>{state.index++;render(studio)};
 state.view.querySelector('#ka-complete').onclick=async()=>{
  if(state.busy)return;
  const work=state.view.querySelector('#ka-check-work').checked,test=state.view.querySelector('#ka-check-test').checked,note=state.view.querySelector('#ka-note').value.trim();
  if(!work||!test){status(studio,'Primero realizá el trabajo y comprobá tu juego. Después marcá las dos casillas.');return;}
  if(note.length<15){status(studio,'Escribí al menos 15 caracteres para explicar lo que aprendiste.');return;}
  if(progress(studio)?.courseId!==c.id){status(studio,'Abriste otro proyecto. Volvé a elegir tu curso.');return;}
  state.busy=true;status(studio,'Guardando tu avance en Krueka…');
  try{const next={...p,done:{...p.done,[String(i)]:{complete:true,note:note.slice(0,600),date:new Date().toISOString()}}};await persist(studio,next);render(studio);status(studio,'Lección registrada y guardada con tu proyecto.');}
  catch(e){status(studio,e.message||'No se pudo guardar el avance.');}
  finally{state.busy=false;}
 };
}
function render(studio){
 if(!state.view?.isConnected)return;state.view.className='ks-tool ka';
 const p=progress(studio),c=current(studio);
 if(state.overview){overview(studio,state.overview);return;}
 if(c){lesson(studio,c,p);return;}home(studio);
}
function mount(studio){
 const panel=document.getElementById('krueka-studio');if(!panel)return;
 if(state.panel!==panel){
  state.panel=panel;state.overview=null;state.index=0;styles();
  const tabs=panel.querySelector('.ks-tabs'),button=document.createElement('button');
  button.className='ks-btn';button.dataset.tab='academy';button.textContent='📚 Cursos';button.type='button';button.setAttribute('aria-pressed','false');button.onclick=()=>studio.showTab('academy');tabs.appendChild(button);
  const work=panel.querySelector('.ks-work'),view=document.createElement('section');
  view.id='ks-academy';view.className='ks-tool ka';view.hidden=true;work.insertBefore(view,work.firstChild);state.view=view;
 }
}
function install(){
 const studio=window.StudioIA;if(!studio||studio.__academyInstalled)return false;
 const show=studio.showTab,adopt=studio.adopt;
 studio.showTab=function(name){
  mount(this);
  const result=show.call(this,name==='academy'?'create':name);
  if(state.view){state.view.hidden=name!=='academy';if(name==='academy'){const editor=document.getElementById('ks-create');if(editor)editor.hidden=true;this.tab='academy';render(this);}state.panel?.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tab===name)));}
  return result;
 };
 studio.adopt=function(p){const result=adopt.call(this,p);state.index=0;state.overview=null;if(this.tab==='academy')render(this);return result;};
 studio.__academyInstalled=true;return true;
}
window.KruekaAcademy={courses,progress,install,render};
install();
})();