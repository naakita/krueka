/* Krueka 2026 — Demostraciones educativas sin datos personales.
 * La portada muestra un juego de lógica real, una rúbrica interactiva y enlaces auténticos.
 * No simula una cuenta, calificaciones guardadas ni conversaciones IA.
 */
(function(){
'use strict';
var app=document.getElementById('kp-app');
if(!app)return;
var modes=[
 {key:'studio',label:'Taller creativo'},
 {key:'teacher',label:'Aula docente'},
 {key:'uploads',label:'Entregas'}
];
var buttons=Array.prototype.slice.call(app.querySelectorAll('[data-kp-mode]'));
var panes=modes.map(function(mode){return document.getElementById('kp-mode-'+mode.key);});
function setMode(name,focus){
 var mode=modes.find(function(m){return m.key===name;});if(!mode)return;
 buttons.forEach(function(button){
  var active=button.dataset.kpMode===name;
  button.classList.toggle('is-active',active);
  button.setAttribute('aria-pressed',String(active));
  if(active&&focus)button.focus();
 });
 panes.forEach(function(pane){
  var active=pane.id==='kp-mode-'+name;
  pane.hidden=!active;
  pane.classList.toggle('is-visible',active);
 });
 document.getElementById('kp-current-mode').textContent=mode.label;
}
buttons.forEach(function(button,index){
 button.addEventListener('click',function(){setMode(button.dataset.kpMode,false);});
 button.addEventListener('keydown',function(event){
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
  event.preventDefault();
  var next=event.key==='Home'?0:event.key==='End'?buttons.length-1:
   (index+(event.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;
  setMode(buttons[next].dataset.kpMode,true);
 });
});
setMode('studio',false);

// Mini actividad real: secuencia de instrucciones, colisiones y meta.
var WIDTH=8,HEIGHT=7;
var START={x:0,y:3},GOAL={x:7,y:3};
var walls=new Set(['2,1','2,2','2,3','2,4','4,2','4,3','4,4','6,1','6,2','6,5']);
var player={x:START.x,y:START.y},steps=0,won=false;
var board=document.getElementById('kp-lab-board');
var status=document.getElementById('kp-lab-status');
var count=document.getElementById('kp-step-count');
if(board){
 board.tabIndex=0;
 board.replaceChildren();
 for(var y=0;y<HEIGHT;y++)for(var x=0;x<WIDTH;x++){
  var cell=document.createElement('div');
  cell.className='kp-lab-cell';
  cell.setAttribute('aria-hidden','true');
  cell.dataset.x=String(x);cell.dataset.y=String(y);
  board.appendChild(cell);
 }
 var cells=Array.prototype.slice.call(board.children);
 function repaint(){
  cells.forEach(function(cell){
   var x=Number(cell.dataset.x),y=Number(cell.dataset.y);
   var key=x+','+y;
   cell.classList.toggle('is-wall',walls.has(key));
   cell.classList.toggle('is-goal',x===GOAL.x&&y===GOAL.y);
   cell.classList.toggle('is-player',x===player.x&&y===player.y);
  });
  count.textContent=steps+(steps===1?' paso':' pasos');
 }
 function move(direction){
  if(won){status.textContent='¡Misión completada! Reiniciá para volver a jugar.';return;}
  var shift={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[direction];
  if(!shift)return;
  var nx=player.x+shift[0],ny=player.y+shift[1];
  if(nx<0||ny<0||nx>=WIDTH||ny>=HEIGHT||walls.has(nx+','+ny)){
   status.textContent='Hay un obstáculo. Buscá otra instrucción.';return;
  }
  player={x:nx,y:ny};steps++;
  if(nx===GOAL.x&&ny===GOAL.y){won=true;status.textContent='¡Excelente! Encontraste la meta en '+steps+' pasos.';}
  else status.textContent='Movimiento correcto. Seguí explorando.';
  repaint();
 }
 app.querySelectorAll('[data-kp-move]').forEach(function(button){
  button.addEventListener('click',function(){move(button.dataset.kpMove);});
 });
 board.addEventListener('keydown',function(event){
  var dir={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'}[event.key];
  if(dir){event.preventDefault();move(dir);}
 });
 // La entrada mediante teclado funciona también cuando un botón direccional tiene foco.
 app.addEventListener('keydown',function(event){
  if(!event.target.closest('[data-kp-move]'))return;
  var dir={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'}[event.key];
  if(dir){event.preventDefault();move(dir);}
 });
 document.getElementById('kp-reset-maze').addEventListener('click',function(){
  player={x:START.x,y:START.y};steps=0;won=false;
  status.textContent='Reto reiniciado. Encontrá un camino hasta la meta.';
  repaint();board.focus();
 });
 repaint();
}

// Vista docente: rúbrica de práctica interactiva, sin persistencia de alumnos.
var checks=Array.prototype.slice.call(app.querySelectorAll('[data-kp-indicator]'));
var progress=document.getElementById('kp-progress-track');
var fill=document.getElementById('kp-progress-fill');
var progressCount=document.getElementById('kp-progress-count');
function updateIndicators(){
 var selected=checks.filter(function(c){return c.checked;}).length,total=checks.length;
 progressCount.textContent=selected+' de '+total+' indicadores';
 progress.setAttribute('aria-valuenow',String(selected));
 fill.style.width=(selected/Math.max(total,1)*100)+'%';
}
checks.forEach(function(check){check.addEventListener('change',updateIndicators);});
updateIndicators();
})();
