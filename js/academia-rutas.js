/* Krueka · Ruta IA en tres niveles y talleres prácticos sin servicios externos. */
(function(){
'use strict';
var levels=[
 {icon:'🧠',name:'Fundamentos de IA',tag:'NIVEL 1',summary:'Enseñá ejemplos a un modelo y comprobá cuándo se equivoca.',project:'Entrenar un clasificador',sessions:['Qué es la IA','Ejemplos y datos','Etiquetamos frases','Entrenamos el modelo','Probamos nuevas frases','Detectamos errores','Mejoramos el entrenamiento','Proyecto: mi clasificador']},
 {icon:'🎬',name:'IA Creativa',tag:'NIVEL 2',summary:'Escribí buenos prompts y creá el guion de una historia.',project:'Crear una historia de tres escenas',sessions:['IA que genera contenido','Prompts claros','Personajes originales','Describir imágenes','Plan de animación','Voces y sonidos','Ética y verificación','Proyecto: mi historia']},
 {icon:'📱',name:'Apps con IA',tag:'NIVEL 3',summary:'Convertí una idea en una pantalla con un botón funcional.',project:'Construir una miniapp',sessions:['Elegí un problema','Diseñá la idea','Boceto de pantallas','Botones y eventos','Organizar datos','Mejorar con instrucciones','Probar y corregir','Proyecto: mi aplicación']}
];
var root=null,api=null,back=null,selected=0;
function e(tag,cls,t){var a=document.createElement(tag);if(cls)a.className=cls;if(t!==undefined)a.textContent=String(t);return a;}
function add(parent,child){parent.appendChild(child);return child;}
function btn(label,click,cls){var b=e('button',cls||'ruta-btn',label);b.type='button';b.addEventListener('click',click);return b;}
function store(){
 var s=api.getState();s.entries=s.entries||{};s.entries.rutaIA=s.entries.rutaIA||{projects:{}};
 s.entries.rutaIA.projects=s.entries.rutaIA.projects||{};return s.entries.rutaIA.projects;
}
function data(i){var all=store();all[i]=all[i]||{};return all[i];}
function save(){if(api.save)api.save();}
function safe(t){return !/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?:\+?595\s*)?0?9\d{2}[\s.-]?\d{3}[\s.-]?\d{3}|\b(?:contraseñ|password|c[eé]dula|documento de identidad)\b/i.test(t);}
function field(parent,label,placeholder,value,max){
 var l=add(parent,e('label','ruta-field'));add(l,e('span','',label));
 var x=add(l,e('textarea','ruta-input'));x.rows=2;x.maxLength=max||150;x.placeholder=placeholder;x.value=value||'';return x;
}
function feedback(parent,message){
 var n=parent.querySelector&&parent.querySelector('.ruta-message');if(n)n.remove();
 n=add(parent,e('p','ruta-message',message));n.setAttribute('role','status');return n;
}
function completed(i){return !!data(i).done;}
function finish(panel,i){
 panel.appendChild(btn(completed(i)?'🏅 Proyecto completado · Volver al mapa':'✓ Terminé y comprobé mi proyecto',function(){
   data(i).done=true;save();back();
 }));
}
function mount(home,config,open){
 api=config;
 var wrap=add(home,e('section','ruta-section'));
 add(wrap,e('h2','adv-heading','🚀 Ruta de IA: de aprender a crear'));
 add(wrap,e('p','adv-sub','Tres niveles de ocho encuentros. Estos talleres son el primer paso; los demás encuentros se seguirán desarrollando.'));
 var cards=add(wrap,e('div','ruta-grid'));
 levels.forEach(function(l,i){
   var card=add(cards,e('article','ruta-card'));
   add(card,e('span','ruta-icon',l.icon));add(card,e('span','ruta-tag',l.tag));
   add(card,e('h3','',l.name));add(card,e('p','',l.summary));
   var details=add(card,e('details','ruta-details'));add(details,e('summary','','Ver 8 encuentros'));
   var ol=add(details,e('ol'));l.sessions.forEach(function(title){add(ol,e('li','',title));});
   add(card,e('p','ruta-project','🎯 '+l.project));
   card.appendChild(btn(completed(i)?'✓ Volver al proyecto':'Abrir taller práctico →',function(){open(i);}));
 });
}
function open(target,config,i,onBack){root=target;api=config;back=onBack;selected=i;render();}
function shell(label){
 root.replaceChildren();
 var wrap=add(root,e('div','adv-root'));
 wrap.appendChild(btn('← Regresar al mapa',back,'adv-back'));
 var panel=add(wrap,e('section','ruta-work'));
 add(panel,e('span','ruta-tag','TALLER PRÁCTICO · '+levels[selected].tag));
 add(panel,e('h2','',levels[selected].icon+' '+label));
 return panel;
}
function tokenize(t){return String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(Boolean);}
function predict(examples,text){
 var a=new Set(tokenize(text)),best=0,labels=[];
 examples.forEach(function(ex){
   var b=new Set(tokenize(ex.text)),overlap=0;
   a.forEach(function(w){if(b.has(w))overlap++;});
   var union=new Set([...a,...b]).size,score=union?overlap/union:0;
   if(score>best){best=score;labels=[ex.label];}else if(score===best&&score>0){labels.push(ex.label);}
 });
 return best>0&&new Set(labels).size===1?labels[0]:'No sé';
}
var seeds=[
 {text:'Gracias por tu ayuda',label:'Amable'},
 {text:'Me gusta tu idea',label:'Amable'},
 {text:'Te felicito por tu trabajo',label:'Amable'},
 {text:'No quiero escucharte',label:'Descortés'},
 {text:'Tu idea no sirve',label:'Descortés'},
 {text:'No me importa tu opinión',label:'Descortés'}
];
function classifier(){
 var d=data(0);if(!Array.isArray(d.training))d.training=seeds.map(function(x){return {text:x.text,label:x.label};});
 var panel=shell('Entrená tu primer modelo');
 add(panel,e('p','ruta-info','Un clasificador sencillo aprende a comparar palabras de frases etiquetadas. No es un chatbot ni una red neuronal: vas a ver sus aciertos y límites.'));
 add(panel,e('h3','','1. Agregá ejemplos para entrenarlo'));
 add(panel,e('p','ruta-muted','Ya tiene '+d.training.length+' frases etiquetadas. Podés agregar hasta 12 ejemplos propios, pero que sean ficticios.'));
 var phrase=field(panel,'Tu frase inventada','¡Buen trabajo con tu proyecto!',null,95);
 var actions=add(panel,e('div','ruta-actions'));
 ['Amable','Descortés'].forEach(function(label){
   actions.appendChild(btn('Enseñar: '+label,function(){
     var t=phrase.value.trim();
     if(t.length<6||!safe(t)||d.training.length>=18){feedback(panel,'Escribí una frase ficticia de 6 a 95 caracteres, sin datos privados (máximo 18 ejemplos).');return;}
     d.training.push({text:t,label:label});save();render();
   }));
 });
 add(panel,e('h3','','2. Probalo con una frase nueva'));
 var test=field(panel,'Frase para comprobar','Gracias por ser tan amable',d.query||'',95);
 panel.appendChild(btn('🧪 Clasificar frase',function(){
   var t=test.value.trim();if(t.length<5||!safe(t)){feedback(panel,'Usá una frase de prueba sin datos personales.');return;}
   d.query=t;d.result=predict(d.training,t);d.tests=(d.tests||0)+1;d.reviewed=false;save();render();
 }));
 if(d.result){
   add(panel,e('div','ruta-result','Predicción: '+d.result+'. ¿Coincide con tu criterio? El modelo compara palabras, no comprende todo el contexto.'));
   var review=add(panel,e('div','ruta-actions'));
   review.appendChild(btn('✅ Acertó',function(){d.reviewed=true;d.incorrect=false;save();render();}));
   review.appendChild(btn('🛠️ Se confundió',function(){d.reviewed=true;d.incorrect=true;save();render();},'ruta-btn ruta-alt'));
   if(d.incorrect)add(panel,e('p','ruta-info','¡Un error también enseña! Agregá otro ejemplo con la etiqueta correcta y volvé a probar.'));
   if(d.reviewed&&d.tests>=1)finish(panel,0);
 }
 panel.appendChild(btn('↺ Reiniciar ejemplos',function(){
   d.training=seeds.map(function(x){return {text:x.text,label:x.label};});d.tests=0;d.result='';d.query='';d.reviewed=false;d.incorrect=false;d.done=false;save();render();
 },'ruta-btn ruta-alt'));
}
function storyboard(){
 var d=data(1),panel=shell('Creá tu historia de tres escenas');
 add(panel,e('p','ruta-info','Esta herramienta organiza un guion y construye un prompt para una IA. No genera imágenes ni videos automáticamente.'));
 var title=field(panel,'Título','El robot que descubrió un bosque',d.title||'',70);
 var hero=field(panel,'Personaje','Un robot explorador llamado Luma',d.hero||'',80);
 var scenes=[];
 ['Inicio','Desafío','Solución'].forEach(function(name,i){
   scenes.push(field(panel,'Escena '+(i+1)+' · '+name,'Escribí qué sucede...',d.scenes?.[i]||'',170));
 });
 panel.appendChild(btn('🎬 Organizar mi historia',function(){
   var values=[title.value.trim(),hero.value.trim(),...scenes.map(function(x){return x.value.trim();})];
   if(values.some(function(t,i){return t.length<(i<2?5:15)||!safe(t);})) {feedback(panel,'Escribí un título, personaje y tres escenas descriptivas sin datos personales.');return;}
   d.title=values[0];d.hero=values[1];d.scenes=values.slice(2);save();render();
 }));
 if(d.scenes&&d.scenes.length===3){
   var preview=add(panel,e('div','ruta-story'));
   add(preview,e('h3','',d.title));
   d.scenes.forEach(function(scene,i){var card=add(preview,e('article','ruta-scene'));add(card,e('strong','', ['🌅 Inicio','⚡ Desafío','🌟 Final'][i]));add(card,e('p','',scene));});
   var prompt='Generá un guion visual original en tres escenas. Historia: '+d.title+'. Personaje: '+d.hero+'. '+d.scenes.map(function(s,i){return 'Escena '+(i+1)+': '+s+'.';}).join(' ')+' Describí el escenario, la acción y el sonido. No incluyas datos privados.';
   panel.appendChild(btn('📋 Copiar prompt',function(){
     if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(prompt).then(function(){feedback(panel,'Prompt copiado.');}).catch(function(){feedback(panel,'No se pudo copiar; revisá los permisos del navegador.');});
     else feedback(panel,'No hay acceso al portapapeles; usá las escenas como guía.');
   },'ruta-btn ruta-alt'));
   panel.appendChild(btn('💾 Guardar historia (.txt)',function(){
    var body=d.title+'\n\nPersonaje: '+d.hero+'\n\n'+d.scenes.map(function(t,i){return 'ESCENA '+(i+1)+'\n'+t;}).join('\n\n');
    download(body,'mi-historia-krueka.txt','text/plain;charset=utf-8');
   },'ruta-btn ruta-alt'));
   finish(panel,1);
 }
}
function miniApp(){
 var d=data(2),panel=shell('Construí una miniapp que responde');
 add(panel,e('p','ruta-info','Diseñá una pantalla con un botón que funciona. Es un prototipo interactivo guardado en Krueka, no una app publicada en Internet.'));
 var name=field(panel,'Nombre de la app','Mi ayudante de estudio',d.name||'',70);
 var info=field(panel,'Para qué sirve','Una app que me ayuda a recordar mis metas',d.info||'',135);
 var label=field(panel,'Texto del botón','Dame un consejo',d.label||'',48);
 var response=field(panel,'Respuesta al tocar el botón','¡Terminá una tarea y celebrá!',d.response||'',150);
 panel.appendChild(btn('⚡ Construir mi app',function(){
   var vals=[name.value.trim(),info.value.trim(),label.value.trim(),response.value.trim()];
   if(vals.some(function(v,i){return v.length<([5,12,3,8][i])||!safe(v);})){feedback(panel,'Completá los cuatro campos con detalles útiles y sin información privada.');return;}
   Object.assign(d,{name:vals[0],info:vals[1],label:vals[2],response:vals[3]});save();render();
 }));
 if(d.name){
   var preview=add(panel,e('div','ruta-app'));
   add(preview,e('h3','',d.name));add(preview,e('p','',d.info));
   preview.appendChild(btn(d.label,function(){feedback(preview,d.response);}));
   panel.appendChild(btn('🔍 Probar y revisar la app',function(){feedback(panel,'Probá el botón de la vista previa y verificá que aparezca la respuesta correcta.');},'ruta-btn ruta-alt'));
   panel.appendChild(btn('💾 Descargar miniapp (.html)',function(){download(appHtml(d),'mi-app-krueka.html','text/html;charset=utf-8');},'ruta-btn ruta-alt'));
   finish(panel,2);
 }
}
function esc(t){return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function appHtml(d){
 return '<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(d.name)+'</title><style>body{font-family:system-ui;background:#e8f5ff;text-align:center;padding:10vw;color:#142b47}main{background:white;max-width:580px;margin:auto;padding:28px;border-radius:18px}button{background:#197a81;color:white;border:0;border-radius:12px;padding:15px;font:inherit;cursor:pointer}</style><main><h1>'+esc(d.name)+'</h1><p>'+esc(d.info)+'</p><button id="action">'+esc(d.label)+'</button><p id="reply" hidden>'+esc(d.response)+'</p></main><script>document.getElementById("action").addEventListener("click",function(){document.getElementById("reply").hidden=false;});</'+'script></html>';
}
function download(t,name,type){
 if(typeof Blob==='undefined'||typeof URL==='undefined'||!URL.createObjectURL)return;
 var blob=new Blob([t],{type:type}),url=URL.createObjectURL(blob),a=e('a');a.href=url;a.download=name;a.click();
 if(typeof setTimeout==='function')setTimeout(function(){URL.revokeObjectURL(url);},1000);
}
function render(){if(selected===0)classifier();else if(selected===1)storyboard();else miniApp();}
window.KruekaRutaIA={mount:mount,open:open,refresh:render,predict:predict};
})();