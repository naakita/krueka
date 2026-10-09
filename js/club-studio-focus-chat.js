/* Krueka Studio · Chat individual por proyecto, sin compartir sesiones de ChatGPT.
   Presenta el chat EXISTENTE del estudiante en modo concentrado.
   No altera ni reemplaza el proveedor de IA, las cuotas ni la autenticación. */
(function(){
 'use strict';
 if(window.StudioFocusChat)return;
 let mounted=null,opened=false;
 const short=s=>String(s??'').trim().slice(0,80);
 function statusText(studio){
  if(studio.aiReady===true)return 'IA del taller disponible · sujeto a cupos';
  const reason=studio.aiStatus?.reason;
  if(reason==='budget')return 'IA pausada por presupuesto · seguí con la guía sin IA';
  if(reason==='daily_limit')return 'Cupo diario agotado · guardá tu idea para después';
  return 'IA no disponible · el proyecto sigue guardado en Krueka';
 }
 function isFocus(){return !!mounted?.classList.contains('ks-chat-focus');}
 function sync(studio){
  if(!mounted?.isConnected)return;
  const project=mounted.querySelector('#ks-focus-project');
  if(project)project.textContent=short(studio.title)||'Mi videojuego';
  const status=mounted.querySelector('#ks-focus-state');
  if(status)status.textContent=statusText(studio);
  mounted.classList.toggle('ks-focus-quota',!studio.aiReady);
  const hasTurns=Array.isArray(studio.history)&&studio.history.some(m=>m&&['user','ai'].includes(m.role));
  const intro=mounted.querySelector('#ks-focus-empty');
  if(intro)intro.hidden=hasTurns;
  const open=mounted.querySelector('#ks-focus-open');
  if(open)open.setAttribute('aria-pressed',String(isFocus()));
 }
 function enter(studio){
  if(!mounted?.isConnected)return;
  studio.showTab('ai');
  mounted.classList.add('ks-chat-focus');
  mounted.classList.remove('ks-focus-game');
  const button=mounted.querySelector('#ks-focus-game');
  if(button){button.textContent='◧ Ver mi juego';button.setAttribute('aria-pressed','false');}
  sync(studio);
  mounted.querySelector('#ks-prompt')?.focus();
 }
 function exit(studio){
  if(!mounted?.isConnected)return;
  mounted.classList.remove('ks-chat-focus','ks-focus-game');
  sync(studio);
  if(studio)studio.showTab('ai');
 }
 function toggleGame(){
  if(!isFocus())return;
  const on=mounted.classList.toggle('ks-focus-game');
  const btn=mounted.querySelector('#ks-focus-game');
  if(btn){btn.textContent=on?'▣ Ocultar juego':'◧ Ver mi juego';btn.setAttribute('aria-pressed',String(on));}
 }
 function mount(studio){
  const panel=document.getElementById('krueka-studio');
  if(!panel)return false;
  if(mounted!==panel){mounted=panel;opened=false;}
  if(panel.querySelector('#ks-focus-open')){sync(studio);return true;}
  const top=panel.querySelector('.ks-top'),section=panel.querySelector('#ks-ai');
  if(!top||!section)return false;
  const opener=document.createElement('button');
  opener.type='button';opener.id='ks-focus-open';opener.className='ks-btn ks-focus-launch';
  opener.textContent='◉ Chat individual';opener.setAttribute('aria-label','Abrir chat individual del proyecto');
  const save=top.querySelector('#ks-save');
  top.insertBefore(opener,save||top.lastElementChild);
  opener.onclick=()=>isFocus()?exit(studio):enter(studio);
  const header=document.createElement('div');header.id='ks-focus-toolbar';header.className='ks-focus-toolbar';
  header.innerHTML='<div class="ks-focus-meta"><span class="ks-focus-brand">✦ KRUEKA CHAT</span>'+
   '<strong id="ks-focus-project"></strong><small id="ks-focus-state" role="status"></small></div>'+
   '<div class="ks-focus-tools"><button class="ks-btn" id="ks-focus-game" type="button" aria-pressed="false">◧ Ver mi juego</button>'+
   '<button class="ks-btn" id="ks-focus-back" type="button">← Volver al Studio</button></div>';
  section.insertBefore(header,section.firstChild);
  header.querySelector('#ks-focus-game').onclick=toggleGame;
  header.querySelector('#ks-focus-back').onclick=()=>exit(studio);
  const intro=document.createElement('div');intro.id='ks-focus-empty';intro.className='ks-focus-empty';
  intro.innerHTML='<div class="ks-focus-spark">✦</div><h2>¿Qué vamos a crear hoy?</h2>'+
   '<p>Este es el chat de <b>tu proyecto</b>. Escribí una idea para mejorarlo o usá el editor visual.</p>'+
   '<div class="ks-focus-quick"><button class="ks-btn" id="ks-focus-edit" type="button">🎨 Editar mi juego</button>'+
   '<button class="ks-btn" id="ks-focus-plan" type="button">💡 Planear una mejora</button></div>';
  const chat=section.querySelector('#ks-chat');
  section.insertBefore(intro,chat);
  intro.querySelector('#ks-focus-edit').onclick=()=>{exit(studio);studio.showTab('create');};
  intro.querySelector('#ks-focus-plan').onclick=()=>{studio.setMode('plan');section.querySelector('#ks-prompt')?.focus();};
  sync(studio);
  return true;
 }
 function install(){
  const studio=window.StudioIA;
  if(!studio||typeof studio.renderAIStatus!=='function'||!window.StudioKits)return false;
  if(studio.__focusChatInstalled)return true;
  const previousAI=studio.renderAIStatus;
  studio.renderAIStatus=function(){
   const result=previousAI.apply(this,arguments);
   if(mount(this)){
    if(this.cloudReady&&!opened){opened=true;enter(this);}
    else sync(this);
   }
   return result;
  };
  const previousChat=studio.renderChat;
  studio.renderChat=function(){const value=previousChat.apply(this,arguments);sync(this);return value;};
  const previousTab=studio.showTab;
  studio.showTab=function(tab){
   if(tab!=='ai'&&isFocus()){mounted.classList.remove('ks-chat-focus','ks-focus-game');sync(this);}
   return previousTab.apply(this,arguments);
  };
  studio.__focusChatInstalled=true;
  return true;
 }
 window.StudioFocusChat={install,mount,enter,exit,toggleGame,sync,statusText};
 if(!install()){
  let attempts=0;const t=setInterval(()=>{if(install()||++attempts>=40)clearInterval(t);},100);
 }
})();
