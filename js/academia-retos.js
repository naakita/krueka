/* Academia IA · Microretos interactivos. Sin dependencias, sin generador IA ni datos personales. */
(function(){
'use strict';
var chapterNames=['Elegí la herramienta','Pedí con precisión','Armá tu prompt','Detectá errores','Conversá por etapas','Misión final'];
var chapterIcons=['🧠','🎯','🛠️','🔎','💬','🏆'];
var classNumbers=[1,1,2,3,3,4];
var missions=[
[
 {kind:'choose',tip:'La IA tiene distintas herramientas. Elegí la que sirve para cada desafío.',q:'Tu amigo quiere entender qué es una variable en un videojuego. ¿Qué usarías?',opts:['Un asistente que explique con ejemplos','Un generador de música','Un editor de fotografías'],right:0,success:'¡Bien! Un chatbot puede explicarte y hacerte preguntas para comprobar lo aprendido.',hint:'Buscá una herramienta que pueda conversar y explicar.'},
 {kind:'choose',tip:'Una IA para imágenes crea ilustraciones a partir de descripciones.',q:'Querés un dragón azul para el afiche del club. ¿Qué tipo de IA elegís?',opts:['Una IA que reconoce voz','Una IA generadora de imágenes','Un sistema de subtítulos'],right:1,success:'¡Exacto! Describí colores, personajes y estilo para crear una imagen.',hint:'Necesitás generar una ilustración, no analizar un sonido.'},
 {kind:'choose',tip:'Las respuestas de IA pueden contener errores aunque suenen seguras.',q:'Un chatbot afirma un dato histórico sin dar fuente. ¿Qué hacés?',opts:['Lo comparto inmediatamente','Le pido que lo diga con más confianza','Lo verifico en una fuente confiable'],right:2,success:'¡Eso es! Usar IA también significa pensar y comprobar.',hint:'La seguridad con la que escribe no demuestra que tenga razón.'}
],
[
 {kind:'choose',tip:'Un pedido vago deja demasiadas decisiones a la IA.',q:'¿Con cuál pedido mejorarías una web escolar?',opts:['Hacé una web mejor','Agregá un botón azul de Inicio sin cambiar el menú','Cambialo todo como quieras'],right:1,success:'Incluiste una acción concreta y algo que debe conservarse.',hint:'Elegí el que precisa qué cambiar y qué mantener.'},
 {kind:'choose',tip:'El contexto es la información que la IA necesita para ayudarte.',q:'«Creá una publicidad». ¿Qué información falta para hacer un buen anuncio?',opts:['El público y el producto','La velocidad del procesador','La contraseña del docente'],right:0,success:'¡Exacto! La audiencia y el producto cambian completamente el resultado.',hint:'Pensá para quién y sobre qué se está creando el anuncio.'},
 {kind:'choose',tip:'Antes de aceptar un resultado, decidí cómo lo vas a probar.',q:'Pediste un contador de monedas para un juego. ¿Cómo lo comprobarías?',opts:['Preguntando si la IA está segura','Probando si cada moneda suma un punto','Mirando solamente el diseño del personaje'],right:1,success:'¡Muy bien! Tu pedido ya tiene un criterio que podés verificar jugando.',hint:'La prueba debe demostrar que el contador funciona.'}
],
[
 {kind:'choose',tip:'Vas a crear TU PROPIO prompt. Primero elegí un proyecto.',q:'¿En qué querés aplicar la IA?',opts:['🎮 Crear un videojuego','🎨 Diseñar una campaña','📚 Aprender un tema'],right:-1,key:'area',values:['videojuego','campaña publicitaria','tema de estudio'],success:'¡Vamos! En los próximos pasos vas a construir un pedido completo.'},
 {kind:'write',key:'goal',min:20,tip:'OBJETIVO: definí qué querés conseguir.',q:'¿Qué querés lograr con tu proyecto?',hint:'Ejemplo de estructura: «Quiero crear un juego 2D donde…». Escribí tu propia idea.',needs:null},
 {kind:'write',key:'context',min:24,tip:'CONTEXTO: decile a la IA qué tenés o para quién trabajás.',q:'¿Qué información necesita conocer primero?',hint:'Mencioná edad, público, estado actual, recursos o conocimientos previos.',needs:null},
 {kind:'write',key:'task',min:28,tip:'TAREA: pedí una acción concreta y medible.',q:'¿Qué debe hacer exactamente la IA?',hint:'Indicá una acción y detalles específicos. Mejor: «Agregá 3 monedas…» que «Mejoralo».',needs:/(agreg|cre[aá]|explic|gener|escrib|diseñ|prepar|desarroll|propon|modific|mostr|revis|ayud|compar|elabor)/i},
 {kind:'write',key:'format',min:18,tip:'FORMATO: especificá cómo querés recibir la respuesta.',q:'¿Cómo debe entregarte el resultado?',hint:'Pedí una lista, pasos numerados, tabla, ejemplos o código.',needs:/(lista|pasos|tabla|puntos|numerad|ejempl|c[oó]digo|viñetas|p[aá]rrafo)/i},
 {kind:'write',key:'limits',min:22,tip:'LÍMITES: decí qué no debe inventar ni cambiar.',q:'¿Qué cosas debe respetar o evitar?',hint:'Empezá con «No inventes…», «Sin modificar…» o «Conservá…».',needs:/(no |sin |conserv|evit|solo |solamente|respet)/i},
 {kind:'write',key:'check',min:24,tip:'VERIFICACIÓN: prepará una prueba real.',q:'¿Cómo vas a saber si la respuesta sirve?',hint:'Escribí qué vas a probar, verificar, revisar o comparar.',needs:/(prob|verific|revis|comprob|compar|contar|leer|pregunt)/i},
 {kind:'review',tip:'¡Construiste un prompt con seis piezas! Ahora revisalo.',q:'Este es tu pedido completo. ¿Está claro y se puede comprobar?',success:'¡Buen trabajo! Ya podés copiarlo y usarlo en una herramienta autorizada.'}
],
[
 {kind:'choose',tip:'Una respuesta atractiva no siempre es correcta.',q:'La IA afirma que corrigió tu juego. ¿Cuál es la mejor reacción?',opts:['Lo entrego sin abrirlo','Lo pruebo y reviso el contador','Borro todos los archivos'],right:1,success:'¡Exacto! Las pruebas reales detectan problemas que un texto no muestra.',hint:'Buscá la opción que comprueba el funcionamiento.'},
 {kind:'choose',tip:'No todos los datos pueden compartirse con una IA.',q:'¿Qué dato es adecuado incluir en un prompt?',opts:['La contraseña de un compañero','Una descripción inventada del proyecto','La cédula de un familiar'],right:1,success:'Usá ejemplos ficticios, sin datos personales ni contraseñas.',hint:'La información privada no es necesaria para practicar.'},
 {kind:'choose',tip:'Las fuentes inventadas son un riesgo al trabajar con IA.',q:'La IA cita un enlace que no existe. ¿Qué corresponde hacer?',opts:['Solicitar una fuente verificable y comprobarla','Publicar igual porque hay un enlace','Pedir que invente otro enlace'],right:0,success:'¡Correcto! Una fuente debe existir y respaldar lo afirmado.',hint:'No basta con que parezca una dirección web.'}
],
[
 {kind:'write',key:'clarify',min:28,tip:'PASO 1: ACLARAR. No le pidas que adivine los detalles.',q:'Querés agregar un botón a una web. ¿Qué debe preguntarte la IA antes?',hint:'Escribí una pregunta sobre el botón, los archivos o los colores.',needs:/(\?|pregunt|aclar|qu[eé]|cu[aá]l|d[oó]nde)/i},
 {kind:'write',key:'execute',min:30,tip:'PASO 2: EJECUTAR. Pedí un único cambio concreto.',q:'Pedí que un botón cambie el color del título SIN romper el menú.',hint:'Mencioná el botón o título y cómo conservar el menú.',needs:/(bot[oó]n|t[ií]tulo)/i,extra:/(men[uú]|conserv|sin modificar|sin cambiar)/i},
 {kind:'write',key:'verify',min:28,tip:'PASO 3: COMPROBAR. Todo cambio debe poder probarse.',q:'¿Qué le pedirías a la IA para revisar el resultado?',hint:'Solicitá pruebas del botón y del menú, no solo una confirmación.',needs:/(prob|verific|comprob|revis|ensay)/i}
],
[
 {kind:'choose',tip:'RETO FINAL · Elegí el mejor camino.',q:'Necesitás una explicación para un alumno de 13 años. ¿Qué prompt es mejor?',opts:['Explicame algo','Explicá fracciones con dos ejemplos para 13 años en menos de 120 palabras','Hacé una explicación cualquiera'],right:1,success:'¡Sí! Tiene tema, público y formato.',hint:'Buscá destinatario, tema y límite.'},
 {kind:'choose',tip:'RETO FINAL · La IA puede desconocer datos.',q:'No conocés el presupuesto de un evento. ¿Qué le pedís?',opts:['Que invente una cifra y la presente como real','Que ignore los costos','Que pregunte lo que falta y declare suposiciones'],right:2,success:'¡Exacto! Nunca conviertas suposiciones en hechos.',hint:'Una IA debe distinguir los datos reales de las estimaciones.'},
 {kind:'choose',tip:'RETO FINAL · La privacidad es importante.',q:'¿Qué podés enviar para pedir ayuda?',opts:['La contraseña del aula','Una descripción del error sin datos personales','Una foto de un documento de identidad'],right:1,success:'Muy bien: describí el problema sin exponer a otras personas.',hint:'Evitá cualquier dato que identifique o permita entrar a una cuenta.'},
 {kind:'choose',tip:'RETO FINAL · Una corrección debe ser limitada.',q:'Tu web funciona, pero un botón falla. ¿Qué pedirías?',opts:['Corregí solo el botón y conservá el resto; indicá cómo probarlo','Reescribí toda la web sin revisar','Cambiá el diseño a tu gusto'],right:0,success:'¡Perfecto! Una corrección precisa reduce errores inesperados.',hint:'No modifiques aquello que ya funciona.'},
 {kind:'choose',tip:'RETO FINAL · Una fuente debe comprobarse.',q:'La IA presenta una noticia con fecha y enlace. ¿Qué hacés antes de usarla?',opts:['La comparto porque tiene fecha','La vuelvo a pedir con palabras más difíciles','Abro la fuente y compruebo fecha y contenido'],right:2,success:'¡Misión superada! Ya sabés pedir, mejorar y verificar resultados.',hint:'Comprobá los datos en la fuente original.'}
]
];
var COUNT=missions.reduce(function(n,m){return n+m.length;},0);
var root=document.getElementById('micro-course'), api=null, active=0, index=0, decision=null, msg='';
if(!root)return;
function h(tag,cls,value){var e=document.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=value;return e;}
function add(p,n){p.appendChild(n);return n;}
function button(label,cls,cb){var b=h('button',cls,label);b.type='button';b.addEventListener('click',cb);return b;}
function getProgress(){
 var s=api&&api.getState&&api.getState();
 if(!s)return {done:{},writing:{}};
 s.entries=s.entries||{};
 if(!s.entries.microV2||typeof s.entries.microV2!=='object')s.entries.microV2={done:{},writing:{}};
 var p=s.entries.microV2;p.done=p.done||{};p.writing=p.writing||{};return p;
}
function code(m,i){return m+'-'+i;}
function numDone(){var done=getProgress().done;return Object.keys(done).filter(function(k){return done[k]===true&&/^[0-5]-\d+$/.test(k);}).length;}
function fullyDone(m){return missions[m].every(function(_,i){return !!getProgress().done[code(m,i)];});}
function firstAvailable(){for(var m=0;m<missions.length;m++)if(!fullyDone(m))return m;return missions.length-1;}
function firstStep(m){for(var i=0;i<missions[m].length;i++)if(!getProgress().done[code(m,i)])return i;return 0;}
function statusLabel(s){var st=document.getElementById('micro-save');if(st)st.textContent=s;}
function clean(s){return String(s||'').trim();}
function sensitive(s){return /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?:\+?595\s*)?0?9\d{2}[\s.-]?\d{3}[\s.-]?\d{3}|\b(?:contraseñ|password|c[eé]dula|documento de identidad|direcci[oó]n de mi casa)\b/i.test(s);}
function promptText(){
 var w=getProgress().writing;
 return ['OBJETIVO: '+clean(w.goal),'CONTEXTO: '+clean(w.context),'TAREA: '+clean(w.task),'FORMATO: '+clean(w.format),'LÍMITES: '+clean(w.limits),'VERIFICACIÓN: '+clean(w.check)].join('\n\n');
}
function mark(){
 var p=getProgress();p.done[code(active,index)]=true;
 if(active===2&&index===0&&!p.writing.area)p.writing.area='videojuego';
 if(api.save)api.save();
 if(fullyDone(active)&&api.complete){
   var extra=active===2?{fields:{format:clean(p.writing.format)},prompt:promptText(),area:clean(p.writing.area)}:{};
   api.complete(active,extra);
 }
}
function next(){
 if(!getProgress().done[code(active,index)])return;
 decision=null;msg='';
 if(index<missions[active].length-1)index++;
 else if(active<missions.length-1){active++;index=firstStep(active);}
 else {renderCompleted();return;}
 render();
}
function choose(val){
 var step=missions[active][index];
 if(step.right!==-1&&val!==step.right){msg=step.hint||'Probá otra opción.';decision='wrong';render();return;}
 if(step.key&&step.values)getProgress().writing[step.key]=step.values[val];
 mark();decision='right';msg=step.success||'¡Bien!';render();
}
function checkWriting(value){
 var step=missions[active][index],v=clean(value);
 if(sensitive(v)){msg='No incluyas contraseñas, correos, teléfonos ni datos personales.';decision='wrong';render(v);return;}
 if(v.length<step.min){msg='Agregá un detalle concreto antes de continuar. '+step.hint;decision='wrong';render(v);return;}
 if(step.needs&&!step.needs.test(v)){msg='Falta algo importante. '+step.hint;decision='wrong';render(v);return;}
 if(step.extra&&!step.extra.test(v)){msg='Acordate de lo que debe conservarse. '+step.hint;decision='wrong';render(v);return;}
 getProgress().writing[step.key]=v;mark();msg='¡Listo! Ese detalle hace tu pedido más claro.';decision='right';render();
}
function header(){
 var wrap=add(root,h('section','mi-top'));
 var eyebrow=add(wrap,h('div','mi-eyebrow','🚀 LABORATORIO IA · APRENDÉ HACIENDO'));
 var stats=add(wrap,h('div','mi-stats'));
 add(stats,h('strong','',numDone()+' / '+COUNT+' retos'));
 add(stats,h('span','',numDone()*10+' XP'));
 var meter=add(wrap,h('div','mi-meter'));meter.setAttribute('role','progressbar');meter.setAttribute('aria-valuemin','0');meter.setAttribute('aria-valuemax',String(COUNT));meter.setAttribute('aria-valuenow',String(numDone()));var track=add(meter,h('span'));track.style.width=(numDone()/COUNT*100)+'%';
 add(wrap,h('p','mi-caption','Una idea breve · un desafío · una respuesta · avanzás'));
 add(wrap,h('p','mi-save','Progreso sincronizado con tu código')).id='micro-save';
 var nav=add(root,h('div','mi-nav'));
 chapterNames.forEach(function(name,i){
   var allowed=(api&&api.teacherDemo)||i<=firstAvailable()||fullyDone(i);
   var b=button(chapterIcons[i]+' '+(i+1),'mi-tab'+(i===active?' mi-active':'')+(fullyDone(i)?' mi-finished':''),function(){
     if(!allowed)return;active=i;index=firstStep(i);decision=null;msg='';render();
   });
   b.disabled=!allowed;b.title=name;b.setAttribute('aria-label','Misión '+(i+1)+': '+name);nav.appendChild(b);
 });
}
function render(keepValue){
 if(!api)return;
 root.replaceChildren();header();
 var s=missions[active][index];
 var panel=add(root,h('section','mi-card'));add(panel,h('span','mi-pill','CLASE '+classNumbers[active]+' · MISIÓN '+(active+1)));
 add(panel,h('h2','',chapterIcons[active]+' '+chapterNames[active]));
 add(panel,h('p','mi-tip',s.tip));
 add(panel,h('div','mi-step','RETO '+(index+1)+' DE '+missions[active].length));
 add(panel,h('h3','mi-question',s.q));
 var done=!!getProgress().done[code(active,index)];
 if(s.kind==='choose'){
   var opts=add(panel,h('div','mi-choices'));
   s.opts.forEach(function(v,i){
     var b=button(v,'mi-choice',function(){if(!done)choose(i);});b.disabled=done;opts.appendChild(b);
   });
 }else if(s.kind==='write'){
   var field=add(panel,h('textarea','mi-input'));field.rows=3;field.maxLength=300;field.placeholder='Escribí acá tu pedido, con tus propias palabras…';field.setAttribute('aria-label',s.q);
   field.value=keepValue!==undefined?keepValue:(getProgress().writing[s.key]||'');
   if(done)field.readOnly=true;
   if(!done){
     var row=add(panel,h('div','mi-actions'));
     row.appendChild(button('Comprobar mi pedido ✓','mi-primary',function(){checkWriting(field.value);}));
     row.appendChild(button('Ver una pista','mi-secondary',function(){msg=s.hint;decision='hint';render(field.value);}));
   }
 }else if(s.kind==='review'){
   var result=add(panel,h('pre','mi-prompt',promptText()));
   var row=add(panel,h('div','mi-actions'));
   row.appendChild(button('Copiar mi prompt','mi-secondary',function(){
     if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(promptText()).then(function(){statusLabel('Prompt copiado. Revisalo antes de compartir.');}).catch(function(){statusLabel('No se pudo copiar. Seleccioná el texto manualmente.');});
     else statusLabel('Seleccioná el texto para copiarlo.');
   }));
   if(!done)row.appendChild(button('¡Lo revisé! Continuar ✓','mi-primary',function(){mark();msg=s.success;decision='right';render();}));
 }
 if(msg){var f=add(panel,h('div','mi-feedback '+(decision==='right'?'mi-ok':'mi-note'),msg));f.setAttribute('role','status');f.setAttribute('aria-live','polite');}
 if(done){
   var actions=add(panel,h('div','mi-actions'));
   actions.appendChild(button(active===missions.length-1&&index===missions[active].length-1?'Ver mi logro 🏆':index===missions[active].length-1?'¡Misión superada! Siguiente →':'Continuar →','mi-primary',next));
 }
 if(index>0||active>0){add(panel,h('div','mi-footer')).appendChild(button('← Volver a practicar','mi-back',function(){
   if(index>0)index--;else{active--;index=missions[active].length-1;}decision=null;msg='';render();
 }));}
 if(s.kind==='write')add(panel,h('p','mi-note-small','El entrenador comprueba detalles y estructura; una IA real puede equivocarse y siempre hay que verificarla.'));
}
function renderCompleted(){
 if(!api)return;
 root.replaceChildren();header();
 var box=add(root,h('section','mi-card mi-success'));
 add(box,h('div','mi-trophy','🏆'));
 add(box,h('h2','','¡Dominaste los retos de IA!'));
 add(box,h('p','','Completaste '+numDone()+' desafíos de elección, práctica y comprobación.'));
 add(box,h('p','mi-caption','Esta es una insignia interna de práctica de Krueka, no una certificación externa.'));
 var actions=add(box,h('div','mi-actions'));
 actions.appendChild(button('Repasar mis misiones','mi-primary',function(){active=0;index=0;decision=null;msg='';render();}));
 actions.appendChild(button('Copiar mi prompt','mi-secondary',function(){
   if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(promptText()).then(function(){statusLabel('Prompt copiado.');}).catch(function(){});
 }));
}
window.KruekaRetos={
 open:function(config){
   api=config;active=Math.min(5,Math.max(0,config.teacherDemo?(config.start||0):firstAvailable()));index=firstStep(active);decision=null;msg='';render();
 },
 refresh:function(){if(!api)return;if(!api.teacherDemo&&active>firstAvailable())active=firstAvailable();index=firstStep(active);decision=null;msg='';render();},
 saveStatus:statusLabel,
 counts:function(){return {done:numDone(),total:COUNT,mission:active,step:index};}
};
})();