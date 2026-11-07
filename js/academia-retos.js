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
var root=document.getElementById('micro-course'), api=null, active=0, index=0, decision=null, msg='', viewMode='hub', currentLab=null;
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

/* La portada y los juegos extra son independientes del avance obligatorio de 25 retos. */
var worldDescriptions=[
 'Elegí las herramientas que sirven para resolver problemas.',
 'Aprendé a dar instrucciones que no dejan dudas.',
 'Construí tu propio pedido profesional por partes.',
 'Detectá errores y comprobá lo que la IA dice.',
 'Aprendé a conversar, mejorar y corregir.',
 'Superá el desafío y obtené tu insignia.'
];
function bonusData(){
 var p=getProgress();
 p.bonus=p.bonus||{};
 p.bonus.detective=p.bonus.detective||{};
 p.bonus.promptLab=p.bonus.promptLab||{};
 p.bonus.pixel=p.bonus.pixel||{position:0,gems:[]};
 return p.bonus;
}
function earnedBonuses(){
 var b=bonusData();
 return Number(!!b.detective.done)+Number(!!b.promptLab.done)+Number(!!b.pixel.done);
}
function hub(){
 if(!api)return;
 viewMode='hub';
 root.replaceChildren();
 var home=add(root,h('div','adv-root'));
 var hero=add(home,h('section','adv-hero'));
 add(hero,h('div','adv-kicker','KRUEKA · ACADEMIA DE CREADORES'));
 add(hero,h('h1','','¡Tu próxima aventura digital empieza acá!'));
 add(hero,h('p','','No vas a leer un libro entero: vas a decidir, crear, jugar y descubrir. Completá retos, desbloqueá mundos y aprendé a usar la IA con criterio.'));
 var finished=numDone()===COUNT;
 add(hero,button(finished?'🏆 Ver mi insignia →':numDone()?'🚀 Continuar mi aventura →':'🚀 Comenzar mi aventura →','adv-big-button',function(){
   viewMode='mission';
   active=firstAvailable();index=firstStep(active);
   if(finished)renderCompleted();else render();
 }));
 var stats=add(hero,h('div','adv-stats'));
 add(stats,h('span','','⭐ '+(numDone()*10+earnedBonuses()*30)+' XP ganados'));
 add(stats,h('span','','🧩 '+numDone()+'/'+COUNT+' retos'));
 add(stats,h('span','','🏅 '+earnedBonuses()+'/3 insignias extra'));
 add(home,h('h2','adv-heading','🗺️ Elegí tu mundo'));
 add(home,h('p','adv-sub','Se desbloquean a medida que avanzás. Podés volver a practicar en cualquier momento.'));
 var worlds=add(home,h('section','adv-worlds'));
 chapterNames.forEach(function(title,i){
   var allowed=!!api.teacherDemo||i<=firstAvailable()||fullyDone(i);
   var world=button('','adv-world',function(){if(!allowed)return;active=i;index=firstStep(i);viewMode='mission';decision=null;msg='';render();});
   world.disabled=!allowed;
   world.appendChild(h('span','adv-world-emoji',chapterIcons[i]));
   world.appendChild(h('strong','',title));
   world.appendChild(h('small','',worldDescriptions[i]));
   world.appendChild(h('em','',fullyDone(i)?'✓ COMPLETADO':allowed?'► ENTRAR':'🔒 BLOQUEADO'));
   worlds.appendChild(world);
 });
 add(home,h('h2','adv-heading','🎮 Laboratorios para experimentar'));
 add(home,h('p','adv-sub','Minijuegos opcionales. Podés jugarlos sin perder el avance de las misiones.'));
 var labs=add(home,h('section','adv-labs'));
 [
  ['detective','🔍','Detective de Internet','Descubrí pistas falsas y aprendé a verificar.'],
  ['promptLab','🧱','Fábrica de prompts','Combiná piezas para crear un pedido preciso.'],
  ['pixel','👾','Misión Pixel','Mové tu héroe, reuní gemas y probá tu lógica.']
 ].forEach(function(x){
  var done=!!bonusData()[x[0]].done;
  var lab=button('','adv-lab',function(){currentLab=x[0];viewMode='bonus';renderBonus();});
  lab.appendChild(h('span','',x[1]));lab.appendChild(h('strong','',x[2]));lab.appendChild(h('p','',x[3]));lab.appendChild(h('b','',done?'✓ COMPLETADO · +30 XP':'JUGAR · +30 XP'));
  labs.appendChild(lab);
 });
 add(home,h('p','adv-muted','Tu progreso se guarda con tu código. Estos laboratorios son simulaciones educativas: no generan contenido mediante una IA real.'));
}
function labShell(label,title,desc){
 root.replaceChildren();
 var wrap=add(root,h('div','adv-root'));
 wrap.appendChild(button('← Volver al mapa','adv-back',hub));
 var panel=add(wrap,h('section','adv-game'));
 add(panel,h('div','adv-label','LABORATORIO INTERACTIVO · '+label));
 add(panel,h('h2','',title));
 add(panel,h('p','',desc));
 return panel;
}
function awardBonus(key){
 var b=bonusData()[key];
 if(!b.done){b.done=true;if(api.save)api.save();}
}
var cases=[
 {claim:'«Esta noticia es verdadera porque la compartieron 900 personas».',choices:['La cantidad de compartidos demuestra que es real','Necesito revisar fuente, fecha y contenido','Si tiene muchas reacciones, ya está verificada'],correct:1,why:'Una noticia viral también puede ser falsa. Buscá el origen y contrastá con fuentes confiables.'},
 {claim:'Una IA inventó una página web como fuente, pero el enlace no abre.',choices:['No la uso hasta conseguir una fuente verificable','La incluyo igual porque parece profesional','Invento otra dirección web parecida'],correct:0,why:'Las fuentes tienen que existir y respaldar lo que se afirma.'},
 {claim:'Un chatbot te pide la contraseña de tu compañero para hacer un trabajo escolar.',choices:['Se la paso si el trabajo es urgente','Le envío una captura con datos del compañero','No comparto secretos ni datos personales'],correct:2,why:'Nunca necesitás compartir contraseñas ni datos privados para practicar.'}
];
function renderDetective(){
 var b=bonusData().detective;
 if(b.done)return bonusWin('detective','🔍 ¡Detective experto!','Reconocés señales de riesgo y sabés comprobar información.');
 var i=0;while(b[i])i++;
 var c=cases[i],box=labShell('DETECTIVE','🔍 ¿Detectás la trampa?','Observá la situación y elegí la acción más segura. '+(i+1)+' de '+cases.length);
 add(box,h('div','adv-challenge',c.claim));
 var opts=add(box,h('div','adv-options'));
 c.choices.forEach(function(choice,j){
  opts.appendChild(button(choice,'adv-option',function(){
   if(j!==c.correct){
     feedbackBonus(box,'Todavía no: pensá si tenés una prueba o solo una afirmación.',false);return;
   }
   b[i]=true;if(api.save)api.save();
   feedbackBonus(box,'✓ '+c.why,true);
   opts.querySelectorAll('button').forEach(function(el){el.disabled=true;});
   box.appendChild(button(i===cases.length-1?'¡Laboratorio superado! →':'Siguiente caso →','adv-button',function(){
      if(i===cases.length-1)awardBonus('detective');renderDetective();
   }));
  }));
 });
}
var builderParts=[
 {title:'1. Objetivo',options:['Hacé algo lindo','Creá un juego 2D donde se recojan cristales','Decidí vos todo'],correct:1,hint:'Elegí una meta concreta que pueda comprobarse.'},
 {title:'2. Contexto',options:['No importa qué tengo','La idea está en mi cabeza','Ya existe un personaje que puede moverse a izquierda y derecha'],correct:2,hint:'La IA necesita saber qué hay construido.'},
 {title:'3. Formato',options:['Devolvé 4 pasos numerados con los cambios','Explicá como quieras','Escribí un montón de texto'],correct:0,hint:'El formato define cómo recibir los resultados.'},
 {title:'4. Límites',options:['Cambiá todo el proyecto','Conservá los controles y no inventes archivos','Borrá lo que no conozcas'],correct:1,hint:'Marcá qué cosas no debe cambiar.'},
 {title:'5. Comprobación',options:['Decí que está terminado','Que se vea bonito','Indicá cómo probar que se recojan 3 cristales y se sumen puntos'],correct:2,hint:'Una buena prueba debe poder hacerse jugando.'}
];
function assembledPrompt(){
 var values=bonusData().promptLab.values||{};
 return builderParts.map(function(part,i){return values[i]===undefined?'□ '+part.title+' pendiente':part.title+': '+part.options[values[i]];}).join('\n\n');
}
function renderBuilder(){
 var b=bonusData().promptLab;
 if(b.done)return bonusWin('promptLab','🧱 ¡Prompt construido!','Armá, probá y mejorá tus pedidos con detalles concretos.',assembledPrompt());
 b.values=b.values||{};
 var i=0;while(b.values[i]!==undefined)i++;
 var part=builderParts[i],box=labShell('FÁBRICA DE PROMPTS','🧱 Construí un pedido exacto','Elegí la pieza correcta para mejorar el prompt. '+(i+1)+' de '+builderParts.length);
 add(box,h('div','adv-label',part.title));
 var opts=add(box,h('div','adv-options'));
 part.options.forEach(function(choice,j){opts.appendChild(button(choice,'adv-option',function(){
   if(j!==part.correct){feedbackBonus(box,'Todavía no. '+part.hint,false);return;}
   b.values[i]=j;
   if(api.save)api.save();
   if(i===builderParts.length-1)awardBonus('promptLab');
   renderBuilder();
 }));});
 add(box,h('h3','','Vista previa de tu prompt'));
 add(box,h('pre','adv-choice-preview',assembledPrompt()));
}
function renderPixel(){
 var game=bonusData().pixel;
 if(game.done)return bonusWin('pixel','👾 ¡Todas las gemas!','Probaste los controles y comprobaste que el objetivo se cumple.');
 var box=labShell('MISIÓN PIXEL','👾 Rescatá los cristales','Mové tu explorador con los botones. Reuní los tres cristales sin salir del camino.');
 var row=add(box,h('div','adv-stats'));add(row,h('span','','💎 '+game.gems.length+'/3 cristales'));
 var board=add(box,h('div','adv-track'));board.setAttribute('role','group');board.setAttribute('aria-label','Tablero con seis posiciones');
 var gems=[1,3,5];
 for(var i=0;i<6;i++){
   var n=h('span',game.gems.includes(i)?'adv-collected':i===game.position?'adv-player':'',
     i===game.position?'🧑‍🚀':gems.includes(i)&&!game.gems.includes(i)?'💎':'·');
   n.setAttribute('aria-label','Posición '+(i+1)+(i===game.position?' explorador':'')+(gems.includes(i)?' cristal':''));
   board.appendChild(n);
 }
 var controls=add(box,h('div','adv-pad'));
 function move(offset){
   game.position=Math.min(5,Math.max(0,game.position+offset));
   if(gems.includes(game.position)&&!game.gems.includes(game.position))game.gems.push(game.position);
   if(game.gems.length===gems.length)awardBonus('pixel');
   else if(api.save)api.save();
   renderPixel();
 }
 var left=button('←','adv-button adv-secondary',function(){move(-1);});left.disabled=game.position===0;left.setAttribute('aria-label','Mover a la izquierda');
 var right=button('→','adv-button',function(){move(1);});right.disabled=game.position===5;right.setAttribute('aria-label','Mover a la derecha');
 controls.appendChild(left);controls.appendChild(right);
 add(box,h('p','adv-muted','Prueba de lógica: las reglas se cumplen solo si el personaje realmente recoge los tres cristales.'));
}
function feedbackBonus(panel,message,success){
 var old=panel.querySelector('.adv-feedback');if(old)old.remove();
 var e=add(panel,h('div','adv-feedback'+(success?'':' adv-hint'),message));
 e.setAttribute('role','status');return e;
}
function bonusWin(key,title,subtitle,prompt){
 var panel=labShell('MISIÓN COMPLETADA',title,subtitle);
 add(panel,h('div','adv-trophy','🏅'));
 add(panel,h('p','adv-announce','+30 XP · Desafío registrado en tu avance'));
 if(prompt){
   add(panel,h('pre','adv-choice-preview',prompt));
   panel.appendChild(button('Copiar prompt','adv-button adv-secondary',function(){
     if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(prompt).catch(function(){});
   }));
 }
 panel.appendChild(button('Volver a mis mundos →','adv-button',hub));
}
function renderBonus(){
 if(!api)return;
 viewMode='bonus';
 if(currentLab==='detective')renderDetective();
 else if(currentLab==='promptLab')renderBuilder();
 else renderPixel();
}

function header(){
 var home=add(root,h('div','adv-backwrap'));home.appendChild(button('← Volver a mis mundos','adv-back',hub));
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
 actions.appendChild(button('Volver a mis mundos','mi-secondary',hub));
 actions.appendChild(button('Repasar mis misiones','mi-primary',function(){active=0;index=0;decision=null;msg='';render();}));
 actions.appendChild(button('Copiar mi prompt','mi-secondary',function(){
   if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(promptText()).then(function(){statusLabel('Prompt copiado.');}).catch(function(){});
 }));
}
window.KruekaRetos={
 open:function(config){
   api=config;active=Math.min(5,Math.max(0,config.teacherDemo?(config.start||0):firstAvailable()));index=firstStep(active);decision=null;msg='';
   viewMode=config.teacherDemo?'mission':'hub';
   if(viewMode==='hub')hub();
   else if(numDone()===COUNT&&!config.teacherDemo)renderCompleted();else render();
 },
 refresh:function(){if(!api)return;if(!api.teacherDemo&&active>firstAvailable())active=firstAvailable();
   if(viewMode==='hub'){hub();return;}
   if(viewMode==='bonus'){renderBonus();return;}
   index=firstStep(active);decision=null;msg='';
   if(!api.teacherDemo&&numDone()===COUNT)renderCompleted();else render();
 },
 saveStatus:statusLabel,
 counts:function(){return {done:numDone(),total:COUNT,mission:active,step:index};}
};
})();