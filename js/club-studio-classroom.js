/* Taller accesible: clase guiada y cambios locales explícitos cuando falta cupo de IA.
   No ejecuta texto del chat como código ni consulta al proveedor en modo local. */
(function(){
'use strict';
if(window.StudioClassroom)return;
let mounted=null,help='ai';
const examples='Probá: «vidas 5 y tiempo 90», «velocidad 180», «meta 15 puntos», «escenario bosque» o «personaje robot». Para ideas nuevas, elegí IA del taller o Bases y reglas.';
const plain=text=>String(text||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
function localChange(files,text){
 const cfg=StudioKits.read(files),input=plain(text),next=cfg?JSON.parse(JSON.stringify(cfg)):null,changes=[];
 const basic=cfg&&['stars','race','platform','quiz'].includes(cfg.kind),scene=cfg&&['explore3d','space3d'].includes(cfg.kind);
 if(!basic&&!scene)return {changes,notice:'Este proyecto usa un editor especial. Abrí Bases y reglas para personalizarlo sin IA.'};
 if(/\b(no|sin)\s+(camb|modific|agreg|pon|aument|baj)/.test(input))return {changes,notice:examples};
 const rule=(field,pattern,min,max,label)=>{
  const match=input.match(pattern);if(!match)return;
  const value=Math.max(min,Math.min(max,Number(match[1].replace(',','.'))));
  if(Number.isFinite(value)&&next[field]!==value){next[field]=value;changes.push(label+': '+value);}
 };
 if(cfg.kind!=='quiz'){
  rule('lives',/\bvidas?\s*(?:a|en|de|:|=)?\s*(\d+)\b/,1,9,'Vidas');
  rule('seconds',/\b(?:tiempo|segundos)\s*(?:a|en|de|:|=)?\s*(\d+)\b/,scene?(cfg.kind==='space3d'?60:30):15,cfg.kind==='space3d'?600:300,'Tiempo en segundos');
  rule('speed',/\bvelocidad\s*(?:a|en|de|:|=)?\s*(\d+(?:[.,]\d+)?)\b/,scene?2:80,scene?(cfg.kind==='space3d'?7:9):500,'Velocidad');
  if(basic)rule('target',/\b(?:meta|objetivo)\s*(?:a|en|de|:|=)?\s*(\d+)\b/,1,200,'Meta de puntos');
 }
 const name=String(text).match(/\b(?:nombre|titulo)\s*(?:a|es|:|=)?\s*[«"“]([^»"”]{1,60})[»"”]/i);
 if(name&&next.title!==name[1]){next.title=name[1];changes.push('Nombre: '+name[1]);}
 if(basic){
  const theme=input.match(/\b(?:escenario|fondo)\s*(?:a|en|de|:|=)?\s*(espacio|bosque|atardecer)\b/);
  if(theme){const value={espacio:'space',bosque:'forest',atardecer:'sunset'}[theme[1]];if(next.theme!==value){next.theme=value;changes.push('Escenario: '+theme[1]);}}
  if(cfg.kind!=='quiz'){
   const avatar=input.match(/\bpersonaje\s*(?:a|en|de|:|=)?\s*(robot|zorro|nave|auto|rana|astronauta)\b/);
   if(avatar){const value={robot:'🤖',zorro:'🦊',nave:'🚀',auto:'🏎️',rana:'🐸',astronauta:'🧑‍🚀'}[avatar[1]];if(next.avatar!==value){next.avatar=value;changes.push('Personaje: '+avatar[1]);}}
  }
 }
 if(scene){
  const light=input.match(/\b(?:luces?|iluminacion)\s*(?:a|en|de|:|=)?\s*(?:alerta\s*)?(rojas?|azules?|calidas?|apagadas?|atardecer)\b/);
  if(light){let value=/roja/.test(light[1])?'alert':/azul/.test(light[1])?'cryo':cfg.kind==='space3d'?(/apagada/.test(light[1])?'blackout':'warm'):'sunset';if(next.lighting!==value){next.lighting=value;changes.push('Iluminación: '+light[1]);}}
 }
 if(!changes.length)return {changes,notice:'No cambié archivos. La ayuda local reconoce reglas sencillas; no genera código nuevo. '+examples};
 const normal=cfg.kind==='space3d'?StudioMissions.normalise(next):cfg.kind==='explore3d'?Studio3D.normalise(next):next;
 return {changes,files:{...files,'game-config.js':StudioKits.configFile(normal)}};
}
function lesson(studio){
 const d=studio.dialog('Clase de hoy · mi juego, mis reglas',
  '<p class="ks-class-note"><b>Tema:</b> crear y mejorar un juego en el navegador.<br><b>Capacidad:</b> modificar reglas, probar su efecto y explicar una decisión.<br><b>Indicadores:</b> abre su proyecto, cambia dos reglas, comprueba que funciona y explica el resultado.</p>'+
  '<ol class="ks-class-steps"><li><b>10 min · Probá.</b> Usá Probar, movete con las flechas o los botones. Descubrí cómo se ganan puntos.</li>'+
  '<li><b>15 min · Cambiá.</b> En Bases y reglas elegí dos valores. También podés usar el chat: vidas 5 y tiempo 90. Ayuda local aplica esos cambios sin consumir IA.</li>'+
  '<li><b>15 min · Compará.</b> Probá otra vez. ¿El juego es más fácil o más difícil? Usá Deshacer si el resultado no sirve.</li>'+
  '<li><b>10 min · Explicá.</b> En Código → LEEME.md escribí qué cambiaste y cómo lo comprobaste.</li>'+
  '<li><b>10 min · Entregá.</b> Pulsá Guardar y Enviar al profe. Antes de cambiar de computadora, comprobá el mensaje Guardado y usá Salir.</li></ol>'+
  '<button id="ks-class-play" class="ks-btn primary">Probar mi juego</button> <button id="ks-class-rules" class="ks-btn">Abrir Bases y reglas</button>');
 d.querySelector('#ks-class-play').onclick=()=>{d.remove();studio.playCurrent();};
 d.querySelector('#ks-class-rules').onclick=()=>{d.remove();studio.showTab('create');};
}
function sync(studio){
 if(!mounted?.isConnected)return;
 const select=mounted.querySelector('#ks-help-mode');if(!select)return;
 if(!studio.aiReady&&help==='ai')help='local';
 select.value=help;select.options[0].disabled=!studio.aiReady;select.disabled=studio.busy||!studio.cloudReady;
 const send=mounted.querySelector('#ks-send'),tip=mounted.querySelector('#ks-compose-tip');
 if(send&&!studio.busy)send.textContent=help==='local'?'Aplicar ayuda local →':'Enviar a IA →';
 if(tip&&help==='local')tip.textContent='Ayuda local, sin IA generativa: cambia reglas sencillas. Ctrl + Enter para aplicar.';
 const status=mounted.querySelector('#ks-ai-status');
 if(status&&help==='local')status.textContent=(studio.aiReady?'Elegiste ayuda local.':'La IA no está disponible ahora.')+' Podés cambiar reglas y seguir tu clase sin consumir IA.';
}
function mount(studio){
 const panel=document.getElementById('krueka-studio');if(!panel)return;
 if(mounted!==panel){mounted=panel;help=studio.aiReady?'ai':'local';
  // La entrada directa empieza con chat y juego juntos, conservando el botón de concentración.
  if(window.KruekaStudioAccess&&window.StudioFocusChat)StudioFocusChat.exit(studio);
 }
 const section=panel.querySelector('#ks-ai');if(!section)return;
 if(!panel.querySelector('#ks-help-mode')){
  section.classList.add('ks-has-classroom');const tools=document.createElement('div');tools.className='ks-class-tools';
  tools.innerHTML='<label for="ks-help-mode">Ayuda</label><select id="ks-help-mode" aria-label="Tipo de ayuda"><option value="ai">IA del taller</option><option value="local">Ayuda local · sin IA</option></select><button class="ks-btn" id="ks-class-today" type="button">📖 Clase de hoy</button><button class="ks-btn" id="ks-class-status" type="button">Revisar IA</button>';
  section.insertBefore(tools,section.querySelector('.ks-modes'));
  tools.querySelector('select').onchange=e=>{help=e.target.value;studio.renderAIStatus();studio.lock(false);};
  tools.querySelector('#ks-class-today').onclick=()=>lesson(studio);
  tools.querySelector('#ks-class-status').onclick=async()=>{
   if(studio.busy||!studio.cloudReady)return;studio.busy=true;studio.lock(true);
   try{const result=await studio.request({action:'status'});studio.updateAI(result.ai);studio.say('sys',studio.aiReady?'La IA está configurada y sin pausa registrada. Podés elegir IA del taller para probar un pedido.':'La IA sigue pausada. Podés continuar con Ayuda local y Bases y reglas.');}
   catch(e){studio.say('sys','No se pudo revisar la IA: '+e.message);}
   finally{studio.busy=false;studio.renderAIStatus();studio.lock(false);}
  };
 }
 sync(studio);
}
function install(){
 const studio=window.StudioIA;if(!studio||studio.__classroomInstalled)return;
 const status=studio.renderAIStatus,lock=studio.lock,send=studio.send,request=studio.request;
 studio.request=async function(body){
  const result=await request.apply(this,arguments);if(body.action!=='list')return result;
  const params={p_student:this.sid(),p_device:this.did()};let ids;
  if(window.KruekaStudioAccess)ids=await KruekaStudioAccess.rpc('club_studio_proyectos',params);
  else{
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),18000);
   try{const res=await fetch(SUPABASE_URL+'/rest/v1/rpc/club_studio_proyectos',{method:'POST',headers:{apikey:SUPABASE_KEY,'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify(params)});ids=await res.json();if(!res.ok)throw Error(ids?.message||'No se pudo recuperar la lista del taller.');}
   finally{clearTimeout(timer);}
  }
  if(!Array.isArray(ids))throw Error('No se pudo recuperar la lista del taller.');
  return {...result,projects:(result.projects||[]).filter(p=>p.id==='legacy'||ids.includes(p.id))};
 };
 studio.renderAIStatus=function(){const r=status.apply(this,arguments);mount(this);return r;};
 studio.lock=function(){const r=lock.apply(this,arguments);sync(this);return r;};
 studio.send=async function(){
  if(help!=='local')return send.apply(this,arguments);
  if(this.busy||!this.cloudReady)return;
  const q=document.getElementById('ks-prompt'),text=q.value.trim();if(!text)return;
  this.busy=true;this.lock(true);
  try{
   this.say('user',text);const result=localChange(this.files,text);
   if(this.mode==='plan')this.say('sys','Ayuda local · plan de prueba: elegí una regla en Bases y reglas, anotá su valor, cambialo y compará el resultado con Probar. '+examples);
   else if(result.files){
    const files=this.validFiles(result.files);this.checkpoint();this.files=files;
    this.say('sys','Ayuda local · sin IA generativa.\n'+result.changes.join('\n')+'\nProbá el juego y compará el resultado.',{artifact:{title:this.title,files:['game-config.js']}});
    this.draft='';q.value='';
   }else{this.say('sys','Ayuda local · '+result.notice);this.draft=text;}
   if(this.mode==='plan'){this.draft='';q.value='';}
   this.changed();this.refreshAll();await this.save();
  }catch(e){this.draft=text;q.value=text;this.say('sys','No se completó la ayuda local: '+e.message);}
  finally{this.busy=false;this.renderAIStatus();this.lock(false);if(this.dirty)this.scheduleSave();}
 };
 studio.__classroomInstalled=true;
}
window.StudioClassroom={localChange,lesson,mount,sync,install};install();
})();
