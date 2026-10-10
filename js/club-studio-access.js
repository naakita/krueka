/* Entrada del taller: sólo código personal, sin SDK ni programas instalados.
   Este arranque usa sintaxis ES5 para informar compatibilidad antes de cargar el editor. */
var SUPABASE_URL='https://janebfpnknapvntfqolf.supabase.co';
var SUPABASE_KEY='sb_publishable_mSuSFqWycvm9dQQzjpeaRA_kAyZOJl0';
var Club={alumno:null,mapa:function(){}};
function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function deviceId(){return KruekaStudioAccess.session?KruekaStudioAccess.session.token:KruekaStudioAccess.browserId();}
var KruekaStudioAccess=(function(){
 'use strict';
 var api={session:null,ready:false,busy:false},memoryId=null,SESSION_KEY='krueka-studio-session-v1';
 var modules=['club-studio-kits.js','club-studio-3d.js','club-studio-missions.js','club-studio-heroes.js','club-studio-forge.js','club-studio-showcase.js','club-studio-ai.js','club-studio-game-builder.js','club-studio-render-pro.js','club-studio-alt-help.js','club-studio-focus-chat.js','club-studio-classroom.js'];
 function message(text,error){var el=document.getElementById('studio-login-message');el.textContent=text;el.className='studio-entry-message'+(error?' error':'');}
 function persist(session){try{if(session)sessionStorage.setItem(SESSION_KEY,JSON.stringify(session));else sessionStorage.removeItem(SESSION_KEY);}catch(_e){}}
 api.browserId=function(){
  if(memoryId)return memoryId;
  try{memoryId=localStorage.getItem('krueka_device');}catch(_e){}
  if(!memoryId){
   if(window.crypto&&crypto.getRandomValues){var n=new Uint8Array(16);crypto.getRandomValues(n);memoryId='web-';for(var i=0;i<n.length;i++)memoryId+=('0'+n[i].toString(16)).slice(-2);}
   else memoryId='web-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,12);
   try{localStorage.setItem('krueka_device',memoryId);}catch(_e){}
  }
  return memoryId;
 };
 api.rpc=function(name,body){
  return new Promise(function(resolve,reject){
   var xhr=new XMLHttpRequest();xhr.open('POST',SUPABASE_URL+'/rest/v1/rpc/'+name);xhr.timeout=18000;
   xhr.setRequestHeader('Content-Type','application/json');xhr.setRequestHeader('apikey',SUPABASE_KEY);
   xhr.onload=function(){var data;try{data=JSON.parse(xhr.responseText);}catch(_e){reject(Error('Krueka no devolvió una respuesta válida. Volvé a intentar.'));return;}
    if(xhr.status<200||xhr.status>=300){reject(Error(data.message||'No se pudo abrir el taller.'));return;}resolve(data);};
   xhr.onerror=function(){reject(Error('No se pudo conectar con Krueka. Revisá internet y volvé a intentar.'));};
   xhr.ontimeout=function(){reject(Error('La conexión tardó demasiado. Volvé a intentar; tus trabajos siguen guardados.'));};
   xhr.send(JSON.stringify(body));
  });
 };
 function setBusy(value){api.busy=value;document.getElementById('studio-code').disabled=value;var b=document.getElementById('studio-login-button');b.disabled=value||!api.ready;b.textContent=value?'Abriendo tu taller…':'Entrar y empezar →';}
 function loadModule(i){
  if(i===modules.length)return Promise.resolve();
  return new Promise(function(resolve,reject){var s=document.createElement('script');s.src='js/'+modules[i]+'?v=20261010a';s.onload=resolve;s.onerror=function(){reject(Error('No se pudo cargar una herramienta. Actualizá esta página y revisá internet.'));};document.head.appendChild(s);}).then(function(){return loadModule(i+1);});
 }
 function open(session){
  api.session=session;Club.alumno=session.student;persist(session);
  document.getElementById('studio-entry').hidden=true;
  return StudioIA.open().then(function(){
   if(!StudioIA.cloudReady){
    return StudioIA.close().then(function(){throw Error('No se pudo recuperar tu proyecto. Revisá internet y volvé a entrar con tu código.');});
   }
  });
 }
 api.login=function(code){
  if(api.busy||!api.ready)return Promise.resolve();
  code=String(code||'').trim().toUpperCase();
  if(!/^[A-Z0-9]{6}$/.test(code)){message('Escribí las 6 letras o números de tu código personal.',true);return Promise.resolve();}
  setBusy(true);message('Comprobando tu código y recuperando tu proyecto…');
  return api.rpc('club_studio_entrar',{p_codigo:code,p_device:api.browserId(),p_agent:String(navigator.userAgent||'').slice(0,240)}).then(function(data){
   if(!data||data.ok!==true)throw Error(data&&data.error||'Ese código no pertenece a un alumno activo del Club.');
   document.getElementById('studio-code').value='';
   return open(data);
  }).catch(function(e){document.getElementById('studio-entry').hidden=false;message(e.message,true);}).then(function(){setBusy(false);});
 };
 api.logout=function(){
  var old=api.session;api.session=null;persist(null);Club.alumno=null;
  document.getElementById('studio-entry').hidden=false;document.getElementById('studio-code').value='';setBusy(true);message('Cerrando tu sesión…');
  function finished(){setBusy(false);message('Listo. El próximo alumno puede entrar con su propio código.');document.getElementById('studio-code').focus();}
  if(old)return api.rpc('club_studio_salir',{p_token:old.token}).catch(function(){}).then(finished);
  finished();return Promise.resolve();
 };
 api.compatible=function(){
  if(!window.Promise||!window.fetch||!window.AbortController||!window.Set||!window.Map||!Object.entries)return false;
  try{new Function('const a={x:1};let b={...a};return (b?.x ?? 0)===1;')();return !!document.createElement('canvas').getContext('2d');}catch(_e){return false;}
 };
 function start(){
  var input=document.getElementById('studio-code');
  input.oninput=function(){input.value=input.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);};
  document.getElementById('studio-login-form').onsubmit=function(e){e.preventDefault();api.login(input.value);};
  if(!api.compatible()){message('Este navegador es demasiado antiguo para el taller. Abrí este enlace en Chrome, Edge o Firefox actualizado. La PC puede ser de 32 bits.',true);document.getElementById('studio-login-button').textContent='Navegador pendiente';return;}
  if(!Array.prototype.flat)Array.prototype.flat=function(){return [].concat.apply([],this);};
  document.getElementById('studio-browser-state').textContent='Navegador listo · Juego liviano disponible sin placa 3D.';
  loadModule(0).then(function(){
   if(!window.StudioIA||!window.StudioKits)throw Error('Una herramienta no terminó de cargar. Actualizá esta página.');
   var previous=StudioIA.close;StudioIA.close=function(){return previous.apply(this,arguments).then(function(){if(!document.getElementById('krueka-studio'))return api.logout();});};
   api.ready=true;setBusy(false);message('Ingresá tu código para empezar.');input.focus();
   var saved=null;try{saved=JSON.parse(sessionStorage.getItem(SESSION_KEY)||'null');}catch(_e){}
   if(saved&&/^st-[a-f0-9]{64}$/.test(saved.token)&&saved.student&&Date.parse(saved.expiresAt)>Date.now())return open(saved);
   persist(null);
  }).catch(function(e){document.getElementById('studio-entry').hidden=false;setBusy(false);message(e.message,true);});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
 return api;
})();
