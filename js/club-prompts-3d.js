/* Guía de programación. Sólo se copia el texto que el alumno ve. */
(function(){
 'use strict';
 const notebook='ficha-programacion-3d.json';
 const models={
  explorar:{name:'Exploración y recolección',idea:'Recorrer un jardín en primera persona, reunir tres semillas junto al lago y volver al punto de partida.',goal:'Al reunir la última semilla, dar una pista para volver a la entrada.',test:'Con una semilla pendiente no aparece la pista. Al juntar la última aparece una sola vez.'},
  carrera:{name:'Carrera por controles',idea:'Conducir por un circuito 3D y cruzar tres puertas en orden para completar una vuelta.',goal:'Conseguir que sólo la siguiente puerta válida cuente como control.',test:'Pasar por la puerta 2 antes de la 1 no suma. Cruzar 1 y luego 2 sí suma.'},
  misterio:{name:'Misterio y pistas',idea:'Explorar una biblioteca en 3D, descubrir tres pistas y abrir la puerta final.',goal:'Hacer que una pista descubierta se pueda leer otra vez sin sumar puntos.',test:'Al visitar la misma pista dos veces el contador se mantiene en uno.'},
  propio:{name:'Mi propia idea',idea:'',goal:'',test:''}
 };
 const stages={
  inicio:['Definir mi juego','Primero resumí mi idea en dos frases: qué hace el jugador y cómo gana. Separá lo que existe de lo que falta. Si falta una decisión esencial, haceme una sola pregunta. Proponé tres hitos pequeños, cada uno con una prueba. Esperá mi elección antes de escribir código.'],
  escena:['Construir una escena','Guiame para ubicar un piso y un punto de referencia en el mundo actual usando sus coordenadas. Si ya existen, enseñame a modificar uno. Conservá la cámara y el estilo acordados. Pedime predecir dónde se verá el cambio.'],
  movimiento:['Programar el movimiento','Trabajemos sólo la relación entre entrada, velocidad y tiempo por cuadro. Reutilizá los controles actuales y explicame qué número o cálculo cambiar. Compará el mismo recorrido con el valor anterior y el nuevo.'],
  limites:['Evitar atravesar objetos','Ayudame a comprobar un único límite u obstáculo con la lógica de colisión actual. Probemos acercarnos de frente y caminar a su costado. Conservá el movimiento libre en el resto del mundo.'],
  regla:['Programar una regla','Ayudame a implementar sólo la próxima regla de mi ficha. Identificá qué evento la activa y qué dato cambia. Incluí una prueba en que deba activarse y otra en que deba permanecer igual.'],
  final:['Terminar y reiniciar','Guiame para comprobar la condición de victoria y reiniciar una partida. Si ya funciona, ayudame a revisar un caso límite sin reconstruirla. Probemos completar el objetivo y jugar por segunda vez desde cero.'],
  acabado:['Mejorar el aspecto','Guiame para cambiar un solo detalle visible con los recursos existentes: por ejemplo, la luz, la posición de la cámara o el color de un objeto. Mantengamos legibles las pistas y probemos el juego en la computadora del aula.'],
  error:['Corregir un error','Compará el resultado esperado con lo que observé. Si falta evidencia, pedime el mensaje exacto o los pasos más cortos para repetir el problema. Proponé una hipótesis y una prueba antes de sugerir el cambio mínimo.'],
  retomar:['Retomar en otro chat','Retomá desde mi última prueba confirmada. Decime en una línea qué ya funciona y cuál es el próximo cambio según la ficha. No repitas hitos aprobados. Si la ficha y el código parecen distintos, pedime verificar ese punto antes de avanzar.']
 };
 const rules='Sos mi profe de programación en Club Krueka. Yo voy a escribir y probar el código. Hablame en español sencillo. Mi juego corre en el navegador con HTML, CSS y JavaScript. Usá el motor y los archivos que ya tengo. Conservá la cámara, el objetivo, los controles y lo que marqué como probado. No agregues instalaciones, CDN, librerías ni recursos en internet.\nPara un cambio de código: trabajemos en una sola cosa. Señalá el archivo y una línea real que pueda buscar, explicá qué hace, pedime predecir el resultado y mostrame sólo el cambio necesario. Si te falta código, pedime el fragmento exacto y esperá. No inventes archivos, botones ni funciones. Terminá con una prueba concreta y esperá mi respuesta. Marcamos el avance sólo cuando yo lo compruebe.';
 function el(tag,text){const node=document.createElement(tag);if(text)node.textContent=text;return node;}
 function mount(host,studio){
  let saved={};
  if(studio){try{saved=JSON.parse(studio.files[notebook]||'{}')||{};}catch(_){host.textContent='La ficha del proyecto no se pudo leer. Revisá '+notebook+' en Código.';return;}}
  const initial=Object.hasOwn(models,saved.model)?models[saved.model]:models.explorar;
  const form=el('div');form.className='kg-prompt-form';host.append(form);
  function field(label,key,options,value,help){
   const wrap=el('label',label),node=el(options?'select':'textarea');node.name=key;
   if(options)for(const [id,name] of Object.entries(options))node.add(new Option(name,id));
   else{node.rows=2;node.maxLength=key==='code'?5000:1800;}
   node.value=value||'';wrap.append(node);if(help)wrap.append(el('small',help));form.append(wrap);return node;
  }
  const model=field('¿Qué tipo de juego querés crear?','model',Object.fromEntries(Object.entries(models).map(([k,v])=>[k,v.name])),Object.hasOwn(models,saved.model)?saved.model:'explorar');
  const idea=field('Mi juego en una frase','idea',null,saved.idea??initial.idea,'Decí quién juega, qué hace y cómo gana.');
  const design=field('Lo que quiero conservar','design',null,saved.design,'Por ejemplo: cámara en primera persona, luz de atardecer, flechas y tres semillas.');
  const done=field('Ya probé y funciona','done',null,saved.done,'Anotá qué hiciste y qué viste. Dejalo vacío hasta probarlo.');
  const goal=field('Mi próximo cambio','goal',null,saved.goal??initial.goal);
  const test=field('¿Cómo voy a comprobarlo?','test',null,saved.test??initial.test);
  const stage=field('¿Para qué necesitás a la IA ahora?','stage',Object.fromEntries(Object.entries(stages).map(([k,v])=>[k,v[0]])),Object.hasOwn(stages,saved.stage)?saved.stage:'inicio');
  const code=field('Fragmento de Código o error observado (opcional)','code',null,'','Pegá sólo las líneas del juego que querés trabajar. Indicá el archivo. Omití nombres, códigos de ingreso y claves.');
  if(studio){
   const movement=studio.files['game.js']?.match(/^ function move\(dt\)\{[^]*?^ \}/m)?.[0];
   if(movement&&movement.length<=4500){
    const sample=el('button','Usar mi movimiento actual como primer ejercicio');sample.type='button';sample.className='ks-btn';
    sample.onclick=()=>{
     if(code.value.trim()&&!window.confirm('¿Reemplazar el fragmento del pedido por tu movimiento actual?'))return;
     stage.value='movimiento';code.value='game.js\n'+movement;
     goal.value='Ajustar la velocidad al caminar y conservar la velocidad de giro.';
     test.value='Desde el mismo punto, mantengo avanzar dos segundos antes y después. Comparo la distancia y compruebo que todavía puedo girar.';
     edit({target:stage});code.focus();
    };form.append(sample);
   }
  }
  const preview=el('details'),summary=el('summary','Leer o seleccionar mi prompt'),out=el('textarea');
  out.readOnly=true;out.rows=12;out.setAttribute('aria-label','Prompt para copiar');preview.append(summary,out);
  const copy=el('button','Copiar prompt para Duck.ai');copy.type='button';copy.className='ks-btn primary';
  const msg=el('p');msg.setAttribute('role','status');form.append(copy,preview,msg);
  const id=studio?.projectId;
  function fields(){return {model:model.value,idea:idea.value,design:design.value,done:done.value,goal:goal.value,test:test.value,stage:stage.value};}
  function build(){
   const s=fields(),files=studio?Object.keys(studio.files).filter(n=>/\.(js|html|css)$/.test(n)).join(', '):'Todavía no indiqué los nombres. Pedime el archivo pertinente.';
   out.value=[rules,'FICHA ACTUAL DEL JUEGO','Modelo: '+models[s.model].name,'Idea y victoria: '+(s.idea||'Por definir conmigo.'),'Diseño y controles acordados: '+(s.design||'Consultame antes de cambiar el diseño.'),'Proyecto: '+(studio?.title||'Práctica del Club'),'Archivos del proyecto: '+files,'Pruebas que yo confirmé: '+(s.done||'Todavía ninguna.'),'Único cambio que quiero trabajar: '+(s.goal||'Ayudame a elegir el primero.'),'Prueba prevista: '+(s.test||'Acordemos una prueba observable.'),'PEDIDO DE ESTA VEZ: '+stages[s.stage][1],code.value.trim()?'Fragmento o error que observé:\n'+code.value.trim():'Aún no adjunté código.'].join('\n\n');
  }
  function edit(e){
   if(e.target===model){
    const m=models[model.value];
    // Una elección explícita de modelo sólo sustituye los ejemplos todavía intactos.
    for(const [node,key] of [[idea,'idea'],[goal,'goal'],[test,'test']]){
     if(!node.value||Object.values(models).some(v=>v[key]===node.value))node.value=m[key];
    }
   }
   build();
   if(!studio||e.target===code)return;
   if(studio.busy||!studio.cloudReady||studio.projectId!==id){msg.textContent='Esperá a que el proyecto esté listo para guardar tu ficha.';return;}
   try{
    const updated=studio.validFiles({...studio.files,[notebook]:JSON.stringify(fields(),null,2)});
    studio.files=updated;studio.changed();msg.textContent='';
   }catch(err){msg.textContent='No se guardó la ficha: '+err.message;}
  }
  form.addEventListener('input',edit);
  copy.onclick=async()=>{
   build();
   try{await navigator.clipboard.writeText(out.value);msg.textContent='Prompt copiado. Pegalo en Duck.ai y hacé la prueba antes de anotar el avance.';}
   catch(_){preview.open=true;out.focus();out.select();msg.textContent='El texto está seleccionado. Usá Copiar o presioná Ctrl + C.';}
  };
  build();
 }
 const standalone=document.getElementById('guia-prompts-3d');
 if(standalone)mount(standalone,null);
 const studio=window.StudioIA;
 if(!studio)return;
 const render=studio.renderCreator;
 studio.renderCreator=function(){
  const result=render.apply(this,arguments),host=document.getElementById('ks-create');
  if(!host)return result;
  host.querySelector('.kg-prompt-panel')?.remove();
  const kind=window.StudioKits?.read(this.files)?.kind;
  if(this.files?.['tipo-club.txt']==='juegos'||kind==='pabellon-juego'){
   const box=el('details');box.className='kg-prompt-panel';box.append(el('summary','Programar con Duck.ai · Mi ficha y mis prompts'));
   box.append(el('p','Hacé un cambio por vez en Código y usá Probar. La ficha se guarda con tu proyecto. Si abrís otro chat, elegí «Retomar en otro chat» y copiá el prompt.'));
   host.prepend(box);mount(box,this);
  }
  return result;
 };
})();
