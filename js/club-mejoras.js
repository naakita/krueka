/* Club B.E.I. · integracion privada 20260806f */
(function(){'use strict';
var src=(document.currentScript&&document.currentScript.src)||'',base=src.slice(0,src.lastIndexOf('/')+1);
var css=document.createElement('link');css.rel='stylesheet';css.href=(window.KRUEKA_BASE||'')+'club/club-mejoras.css?v=20260806f';document.head.appendChild(css);
Club.sid=function(){return Club.alumno&&(Club.alumno.student_id||Club.alumno.id)};
Club.fmtArchivo=function(n){return n<1024?n+' B':n<1048576?(n/1024).toFixed(1)+' KB':(n/1048576).toFixed(1)+' MB'};
function avatar(v){v=String(v||'').trim();var m=v.match(/^\\U([0-9a-f]{8})$/i)||v.match(/^U\+([0-9a-f]{4,8})$/i);if(m){try{return String.fromCodePoint(parseInt(m[1],16))}catch(e){return '🧑‍💻'}}return v||'🧑‍💻'}
var mapa=Club.mapa;Club.mapa=function(){if(this.alumno)this.alumno.avatar=avatar(this.alumno.avatar);var r=mapa.apply(this,arguments);this.iniciarPausa();return r};
var entrada=Club.vEntrar;Club.vEntrar=function(){var r=entrada.apply(this,arguments),b=document.querySelector('#club-ov .club-back-link');if(b){b.textContent='← Volver a la plataforma B.E.I.';b.onclick=function(){Club.cerrar()}}return r};
Club.abrir=function(){Club.vEntrar()};
['club-entregas.js','club-retos.js','club-pausas.js'].forEach(function(f){document.write('<script src="'+base+f+'?v=20260806f"><\/script>')});
function integrar(){
 var login=document.getElementById('screen-login');if(login&&!document.getElementById('bei-club-entry')){var c=document.createElement('div');c.id='bei-club-entry';c.className='bei-club-entry';c.innerHTML='<h3>🧩 Club privado B.E.I.</h3><p>Ingreso exclusivo para estudiantes de Betesda Educación Integral con código personal.</p><button class="btn" onclick="Club.vEntrar()">Entrar al Club B.E.I.</button>';login.appendChild(c)}
 if(Club.pintaPanel&&!Club.pintaPanel._ev){var o=Club.pintaPanel;Club.pintaPanel=function(){var r=o.apply(this,arguments);setTimeout(function(){var v=document.getElementById('view');if(v&&!v.querySelector('[data-evidencias-club]')){var b=document.createElement('button');b.className='btn';b.dataset.evidenciasClub='1';b.textContent='Revisar evidencias';b.onclick=function(){Club.vEntregasClub()};v.prepend(b)}},0);return r};Club.pintaPanel._ev=true}
 if(new URLSearchParams(location.search).get('club')==='bei')setTimeout(function(){Club.vEntrar()},100)
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',integrar);else setTimeout(integrar,0);
})();
