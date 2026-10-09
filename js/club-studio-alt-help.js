/* Krueka · guía sin API y traspaso voluntario a ChatGPT propio (13+).
   Jamás comparte la sesión del profesor, usa iframe ni conecta cuentas ajenas. */
(function(){
 'use strict';
 if(window.StudioAltHelp)return;
 const CHAT_URL='https://chatgpt.com/';
 const basic=[
 'Elegí Bases y reglas y cambiá una sola cosa de tu juego.',
 'Presioná Guardar para conservar lo que hiciste.',
 'Pulsá Probar para comprobar que funciona.',
 'Si no te gusta, utilizá Deshacer y probá otra idea.'
 ];
 const paths={
  'hero-manager':[
   'Entrá en Bases y reglas y presioná «⚔ Personajes · Render Pro».',
   'Elegí un molde de héroe, cambiá su nombre, armadura, colores y habilidades.',
   'Presioná «Guardar este héroe y ver resultado» y luego Guardar arriba.',
   'Volvé al mundo y probá un objeto nuevo del escenario.'
  ],
  'cinematic3d':[
   'Abrí Bases y reglas y elegí la etapa de personajes.',
   'Modificá vestimenta, colores y nombre del protagonista.',
   'Guardá el cambio y comprobalo en Probar.',
   'Continuá con la etapa de escenario y movimientos.'
  ],
  'neon-rift':[
   'Abrí Bases y reglas y observá las reglas de la misión.',
   'Cambiá una regla permitida; después probá el juego.',
   'Anotá qué cambió y guardá el proyecto.',
   'Pedí ayuda al profe si aparece un error.'
  ]
 };
 const escapeHTML=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 function kind(studio){try{return window.StudioKits?.read?.(studio.files)?.kind||'';}catch(_e){return '';}}
 function guideFor(type){return paths[type]||basic;}
 function promptFor(studio,typed){
  const request=String(typed||'').trim().slice(0,1200);
  const type=kind(studio);
  const name=String(studio.title||'Mi juego').replace(/[\r\n]/g,' ').slice(0,75);
  const task=request||'Ayudame a planear la siguiente mejora de mi videojuego.';
  return 'Estoy creando un videojuego en Krueka Studio. Proyecto: '+name+
    '. Tipo: '+(type||'personalizado')+'.\nQuiero trabajar en este objetivo: '+task+
    '\nExplicame en español, paso a paso, cómo puedo hacerlo con las herramientas visuales de Krueka. '+
    'No inventes botones; si necesitás saber qué opciones aparecen, preguntame. '+
    'No pidas datos personales. Si hay que cambiar código, indicá qué archivo corresponde y un cambio pequeño, conservando los demás. '+
    'Yo voy a comprobarlo manualmente dentro de Krueka.';
 }
 function mount(studio){
  const form=document.getElementById('ks-form');
  if(!form||document.getElementById('ks-alternative-help'))return;
  const box=document.createElement('section');
  box.id='ks-alternative-help';box.className='ks-alt-help';box.setAttribute('aria-label','Opciones gratuitas cuando la IA no está disponible');
  box.innerHTML='<div class="ks-alt-head"><b>Otras formas de avanzar</b><span>Sin gastar API</span></div>'+
  '<p>Tu proyecto y su chat siguen guardados en Krueka. Los límites del proveedor no impiden usar moldes, herramientas ni el editor.</p>'+
  '<div class="ks-alt-actions"><button type="button" class="ks-btn" id="ks-alt-guide">📘 Guía sin IA</button>'+
  '<button type="button" class="ks-btn" id="ks-alt-copy">📋 Copiar mi pedido</button>'+
  '<button type="button" class="ks-btn" id="ks-alt-personal">↗ ChatGPT personal (13+)</button></div>'+
  '<p class="ks-alt-note">ChatGPT externo requiere una <b>cuenta individual</b> y, para menores de 18 años, autorización del tutor. No está permitido para menores de 13 años. No utiliza la cuenta del profesor ni aplica código automáticamente.</p>'+
  '<div id="ks-alt-detail" class="ks-alt-detail" hidden></div><p id="ks-alt-feedback" role="status" class="ks-alt-feedback"></p>';
  form.insertAdjacentElement('afterend',box);
  const $=s=>box.querySelector(s);
  $('#ks-alt-guide').onclick=()=>{
   const detail=$('#ks-alt-detail'),list=guideFor(kind(studio));
   if(!detail.hidden){detail.hidden=true;return;}
   detail.innerHTML='<h3>Seguí creando sin usar créditos</h3><ol>'+list.map(x=>'<li>'+escapeHTML(x)+'</li>').join('')+'</ol>'+
     '<button type="button" class="ks-btn" id="ks-alt-open-visual">Ir a Bases y reglas</button>';
   detail.hidden=false;
   detail.querySelector('#ks-alt-open-visual').onclick=()=>studio.showTab('create');
  };
  $('#ks-alt-copy').onclick=async()=>{
   const prompt=promptFor(studio,document.getElementById('ks-prompt')?.value||studio.draft);
   try{
    if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(prompt);
    else{
     const temp=document.createElement('textarea');temp.value=prompt;temp.style.position='fixed';temp.style.opacity='0';document.body.appendChild(temp);temp.select();
     if(!document.execCommand('copy'))throw Error('No se pudo copiar.');
     temp.remove();
    }
    $('#ks-alt-feedback').textContent='Pedido copiado. Podés pegarlo en un chat personal autorizado o conservarlo para cuando vuelva la IA de Krueka.';
   }catch(_e){$('#ks-alt-feedback').textContent='No se pudo copiar automáticamente. Seleccioná el texto del cuadro y copialo con Ctrl + C.';}
  };
  $('#ks-alt-personal').onclick=()=>{
   const allowed=window.confirm('ChatGPT es para personas de 13 años o más. Si tenés entre 13 y 17 años, necesitás autorización de tu padre, madre o tutor. ¿Cumplís estos requisitos y vas a usar TU PROPIA cuenta, no la del profesor?');
   if(!allowed){$('#ks-alt-feedback').textContent='Podés continuar con la Guía sin IA y las herramientas visuales de Krueka.';return;}
   window.open(CHAT_URL,'_blank','noopener,noreferrer');
   $('#ks-alt-feedback').textContent='Se abrió ChatGPT en otra pestaña. Usá tu propia cuenta y pegá el pedido copiado. Krueka no recibe esa conversación ni importa automáticamente sus respuestas.';
  };
 }
 function install(){
  if(!window.StudioIA||!window.StudioKits)return false;
  const studio=window.StudioIA;
  if(studio.__altHelpInstalled)return true;
  const prev=studio.renderAIStatus;
  if(typeof prev!=='function')return false;
  studio.renderAIStatus=function(){
   const result=prev.apply(this,arguments);
   mount(this);
   return result;
  };
  studio.__altHelpInstalled=true;
  return true;
 }
 window.StudioAltHelp={install,promptFor,guideFor,CHAT_URL};
 if(!install()){
  let count=0;const interval=setInterval(()=>{if(install()||++count>30)clearInterval(interval);},100);
 }
})();
