/* Bases abiertas del Studio: sin librerías externas, editables y descargables. */
(function(){
'use strict';
if(window.StudioKits)return;
const catalog=[
  {id:'stars',icon:'🚀',title:'Misión estelar',tag:'Movimiento y colisiones',description:'Explorá el espacio, juntá estrellas y esquivá meteoritos.',challenge:'Cambiá la meta y la velocidad. ¿Qué combinación hace el juego desafiante y posible?'},
  {id:'race',icon:'🏎️',title:'Circuito neón',tag:'Reflejos y dificultad',description:'Conducí entre obstáculos y llegá a la meta.',challenge:'Compará una carrera lenta y otra rápida. Explicá cómo cambia la dificultad.'},
  {id:'platform',icon:'🦊',title:'Salto al bosque',tag:'Gravedad y plataformas',description:'Saltá entre plataformas y recogé los cristales.',challenge:'Buscá la variable de gravedad y explicá por qué el personaje vuelve al suelo.'},
  {id:'quiz',icon:'🧠',title:'Desafío de preguntas',tag:'Condiciones y respuestas',description:'Creá un juego de preguntas para otra clase.',challenge:'Editá preguntas y opciones en game-config.js. Comprobá que cada respuesta correcta esté bien marcada.'},
  {id:'web',icon:'🌐',title:'Mi sitio creativo',tag:'HTML, CSS y JavaScript',description:'Diseñá una página para presentar tus creaciones.',challenge:'Cambiá el título, los colores y las tarjetas. Comprobá la navegación y el botón de tema.'}
];
function gameRuntime(){
  'use strict';
  const cfg=window.KRUEKA_GAME;
  const title=document.getElementById('game-title'),status=document.getElementById('status'),hud=document.getElementById('hud');
  title.textContent=cfg.title;document.title=cfg.title;
  const themes={space:['#081126','#152952','#7dd3fc'],forest:['#071f24','#123e40','#86efac'],sunset:['#24122d','#61364e','#fbbf24']};
  const palette=themes[cfg.theme]||themes.space;
  document.body.style.background=palette[0];
  if(cfg.kind==='quiz'){
    document.getElementById('arena').hidden=true;document.getElementById('controls').hidden=true;
    const box=document.getElementById('questions');let index=0,score=0;
    function render(){
      box.replaceChildren();hud.textContent='Puntos: '+score+' / '+cfg.questions.length;
      if(index>=cfg.questions.length){status.textContent='¡Desafío terminado! Creá nuevas preguntas en el archivo game-config.js.';return;}
      const question=cfg.questions[index],h=document.createElement('h2');h.textContent=question.text;box.appendChild(h);
      question.options.forEach((option,i)=>{
        const b=document.createElement('button');b.className='answer';b.textContent=option;
        b.onclick=()=>{score+=i===question.correct?1:0;status.textContent=i===question.correct?'¡Correcto!':'Revisá la respuesta: '+question.options[question.correct];index++;render()};box.appendChild(b);
      });
    }
    document.getElementById('restart').onclick=()=>{index=0;score=0;status.textContent='Elegí una respuesta.';render()};
    document.getElementById('pause').hidden=true;status.textContent='Elegí una respuesta.';render();return;
  }
  const canvas=document.getElementById('arena'),ctx=canvas.getContext('2d'),W=960,H=540;
  const keys={},platforms=[{x:0,y:500,w:960,h:40},{x:140,y:405,w:190,h:20},{x:405,y:320,w:160,h:20},{x:660,y:235,w:160,h:20}];
  let player,coins,rocks,particles,score,lives,time,spawn,ended,paused,last,invincible,distance;
  const random=(a,b)=>a+Math.random()*(b-a),overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  function coin(){
    if(cfg.kind==='platform'){const p=platforms[Math.floor(Math.random()*platforms.length)];return {x:random(p.x+20,p.x+p.w-40),y:p.y-40,w:24,h:24};}
    return {x:random(35,W-55),y:random(55,H-75),w:24,h:24};
  }
  function reset(){
    player={x:cfg.kind==='race'?W/2-18:50,y:cfg.kind==='platform'?450:cfg.kind==='race'?H-90:H/2,w:36,h:36,vy:0,grounded:false};
    coins=Array.from({length:5},coin);rocks=cfg.kind==='stars'?Array.from({length:4},()=>({x:random(220,W-60),y:random(70,H-70),w:38,h:38,vx:random(-65,65),vy:random(-65,65)})):[];
    particles=[];score=0;lives=cfg.lives;time=cfg.seconds;spawn=0;ended=false;paused=false;last=0;invincible=0;distance=0;
    Object.keys(keys).forEach(k=>keys[k]=false);document.getElementById('pause').textContent='Pausar';status.textContent=cfg.kind==='platform'?'Flechas o A/D para moverte. Espacio o ↑ para saltar.':'Flechas o W A S D. También podés tocar los botones.';
  }
  function finish(win){ended=true;status.textContent=win?'¡Misión cumplida! Probá cambiar las reglas y jugá otra vez.':'Fin del intento. Cambiá tu estrategia o ajustá la dificultad.';}
  function hit(){if(invincible>0)return;lives--;invincible=1.5;if(cfg.kind==='platform'){player.x=50;player.y=450;player.vy=0;}if(lives<=0)finish(false);}
  function update(dt){
    time-=dt;invincible=Math.max(0,invincible-dt);if(time<=0){finish(false);return;}
    const left=keys.ArrowLeft||keys.a,right=keys.ArrowRight||keys.d,up=keys.ArrowUp||keys.w||keys[' '],down=keys.ArrowDown||keys.s;
    const speed=cfg.speed;player.x+=(Number(!!right)-Number(!!left))*speed*dt;
    if(cfg.kind==='platform'){
      if(up&&player.grounded){player.vy=-460;player.grounded=false;}
      const oldBottom=player.y+player.h;player.vy+=1100*dt;player.y+=player.vy*dt;player.grounded=false;
      for(const p of platforms)if(player.vy>=0&&oldBottom<=p.y+3&&overlap(player,p)){player.y=p.y-player.h;player.vy=0;player.grounded=true;}
      if(player.y>H+50)hit();
    }else if(cfg.kind==='stars')player.y+=(Number(!!down)-Number(!!up))*speed*dt;
    player.x=Math.max(cfg.kind==='race'?220:0,Math.min(cfg.kind==='race'?W-256:W-player.w,player.x));
    if(cfg.kind!=='platform')player.y=Math.max(40,Math.min(H-player.h,player.y));
    if(cfg.kind==='race'){
      distance+=dt*speed/35;score=Math.floor(distance);spawn-=dt;
      if(spawn<=0){rocks.push({x:random(230,W-270),y:-70,w:48,h:62});spawn=Math.max(.42,1.4-speed/800);}
      for(const r of rocks){r.y+=speed*dt;if(overlap(player,r)){hit();r.y=H+100;}}
      rocks=rocks.filter(r=>r.y<H+90);
    }else{
      for(let i=0;i<coins.length;i++)if(overlap(player,coins[i])){
        score++;for(let j=0;j<12;j++)particles.push({x:coins[i].x+12,y:coins[i].y+12,vx:random(-140,140),vy:random(-140,140),life:.6});coins[i]=coin();
      }
      for(const r of rocks){r.x+=r.vx*dt;r.y+=r.vy*dt;if(r.x<0||r.x>W-r.w)r.vx*=-1;if(r.y<40||r.y>H-r.h)r.vy*=-1;if(overlap(player,r))hit();}
    }
    for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;}particles=particles.filter(p=>p.life>0);
    if(!ended&&score>=cfg.target)finish(true);
  }
  function polygon(points,color){ctx.fillStyle=color;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fill();}
  function star(x,y){const points=[];for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,r=i%2?6:14;points.push([x+Math.cos(a)*r,y+Math.sin(a)*r]);}polygon(points,'#fde68a');}
  function sprite(){
    const x=player.x,y=player.y;ctx.save();ctx.translate(x,y);ctx.shadowColor=palette[2];ctx.shadowBlur=12;
    if(cfg.avatar==='🚀'){
      polygon([[18,-5],[34,31],[18,24],[2,31]],'#e0f2fe');polygon([[12,28],[18,42+Math.sin(distance+time*20)*5],[24,28]],'#fbbf24');ctx.fillStyle='#38bdf8';ctx.beginPath();ctx.arc(18,15,6,0,Math.PI*2);ctx.fill();
    }else if(cfg.avatar==='🏎️'){
      ctx.fillStyle='#030712';ctx.fillRect(0,4,8,10);ctx.fillRect(28,4,8,10);ctx.fillRect(0,26,8,10);ctx.fillRect(28,26,8,10);ctx.fillStyle=palette[2];ctx.fillRect(7,0,22,38);ctx.fillStyle='#15243e';ctx.fillRect(10,9,16,11);ctx.fillStyle='#e0f2fe';ctx.fillRect(9,0,5,4);ctx.fillRect(22,0,5,4);
    }else if(cfg.avatar==='🦊'||cfg.avatar==='🐸'){
      const fox=cfg.avatar==='🦊';ctx.fillStyle=fox?'#fb923c':'#86efac';ctx.beginPath();ctx.arc(18,20,17,0,Math.PI*2);ctx.fill();if(fox){polygon([[2,12],[1,-3],[13,7]],'#fb923c');polygon([[23,7],[35,-3],[34,12]],'#fb923c');polygon([[6,22],[18,34],[30,22]],'#fff7ed');}ctx.fillStyle='#102334';ctx.fillRect(9,15,4,5);ctx.fillRect(23,15,4,5);ctx.fillRect(16,25,5,3);
    }else{
      ctx.fillStyle=cfg.avatar==='🤖'?'#a5b4fc':'#e0f2fe';ctx.fillRect(5,3,26,23);ctx.fillRect(8,28,8,9);ctx.fillRect(21,28,8,9);ctx.fillStyle='#0c4a6e';ctx.fillRect(8,8,20,10);ctx.fillStyle='#67e8f9';ctx.fillRect(11,11,5,4);ctx.fillRect(21,11,5,4);
    }
    ctx.restore();
  }
  function draw(){
    const g=ctx.createLinearGradient(0,0,W,H);g.addColorStop(0,palette[0]);g.addColorStop(1,palette[1]);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    ctx.fillStyle=palette[2];ctx.globalAlpha=.22;
    for(let i=0;i<70;i++){const x=(i*137)%W,y=(i*83)%H;ctx.beginPath();ctx.arc(x,y,i%3+1,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
    if(cfg.kind==='race'){
      ctx.fillStyle='#111827';ctx.fillRect(210,0,540,H);ctx.fillStyle=palette[2];ctx.fillRect(208,0,4,H);ctx.fillRect(750,0,4,H);
      ctx.fillStyle='#ffffff50';for(let y=-60;y<H;y+=90){ctx.fillRect(385,y+(distance*12)%90,5,45);ctx.fillRect(565,y+(distance*12)%90,5,45);}
    }
    if(cfg.kind==='platform'){
      ctx.globalAlpha=.3;for(let i=0;i<12;i++){const x=i*90;polygon([[x,510],[x+35,220+i%3*40],[x+70,510]],'#2d6b58');}ctx.globalAlpha=1;
      for(const p of platforms){ctx.fillStyle='#163b35';ctx.fillRect(p.x,p.y,p.w,p.h);ctx.fillStyle=palette[2];ctx.fillRect(p.x,p.y,p.w,5);}
    }
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='28px sans-serif';
    if(cfg.kind!=='race')for(const c of coins){ctx.shadowColor='#fde68a';ctx.shadowBlur=16;if(cfg.kind==='platform'){polygon([[c.x+12,c.y],[c.x+25,c.y+11],[c.x+12,c.y+27],[c.x-1,c.y+11]],'#67e8f9');polygon([[c.x+12,c.y],[c.x+12,c.y+27],[c.x-1,c.y+11]],'#0891b2');}else star(c.x+12,c.y+12);}ctx.shadowBlur=0;
    for(const r of rocks){if(cfg.kind==='race'){ctx.fillStyle='#fb923c';ctx.fillRect(r.x,r.y,r.w,r.h);ctx.fillStyle='#101827';for(let j=0;j<3;j++)ctx.fillRect(r.x+5,r.y+8+j*18,r.w-10,8);}else{ctx.fillStyle='#8191ad';ctx.beginPath();ctx.arc(r.x+r.w/2,r.y+r.h/2,18,0,Math.PI*2);ctx.fill();ctx.fillStyle='#45566f';ctx.beginPath();ctx.arc(r.x+12,r.y+14,5,0,Math.PI*2);ctx.fill();}}
    for(const p of particles){ctx.fillStyle=palette[2];ctx.globalAlpha=p.life/.6;ctx.fillRect(p.x,p.y,4,4);}ctx.globalAlpha=1;
    if(invincible<=0||Math.floor(invincible*10)%2)sprite();
    hud.textContent='Puntos: '+score+' / '+cfg.target+'   ·   Vidas: '+lives+'   ·   Tiempo: '+Math.max(0,Math.ceil(time))+' s';
    if(ended||paused){ctx.fillStyle='#00000090';ctx.fillRect(0,0,W,H);ctx.fillStyle='#fff';ctx.font='bold 40px sans-serif';ctx.fillText(paused?'PAUSA':score>=cfg.target?'¡LO LOGRASTE!':'VOLVÉ A INTENTAR',W/2,H/2);}
  }
  function frame(now){const dt=last?Math.min((now-last)/1000,.035):0;last=now;if(!paused&&!ended)update(dt);draw();requestAnimationFrame(frame);}
  addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key))e.preventDefault();keys[e.key.toLowerCase().length===1?e.key.toLowerCase():e.key]=true;});
  addEventListener('keyup',e=>keys[e.key.toLowerCase().length===1?e.key.toLowerCase():e.key]=false);
  addEventListener('blur',()=>Object.keys(keys).forEach(k=>keys[k]=false));
  document.querySelectorAll('[data-key]').forEach(b=>{
    b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys[b.dataset.key]=true;};
    b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>keys[b.dataset.key]=false;
  });
  document.getElementById('restart').onclick=reset;
  document.getElementById('pause').onclick=()=>{if(ended)return;paused=!paused;document.getElementById('pause').textContent=paused?'Continuar':'Pausar';};
  reset();requestAnimationFrame(frame);
}
const css=`*{box-sizing:border-box}body{margin:0;color:#edf6ff;font-family:system-ui,sans-serif;background:#081126}main{width:min(1040px,96%);margin:18px auto}header{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}h1{font-size:clamp(23px,4vw,38px);margin:6px 0}small{color:#8eb4ca;letter-spacing:.14em}button{border:1px solid #ffffff30;background:#ffffff10;color:#fff;border-radius:12px;padding:10px 16px;font:inherit;cursor:pointer;touch-action:none}button:hover{background:#ffffff25}#hud{padding:14px 0;font-weight:700;color:#b9e1ff}canvas{display:block;width:100%;border:1px solid #ffffff25;border-radius:18px;box-shadow:0 18px 70px #0005}#controls{display:flex;gap:8px;justify-content:center;margin:14px 0}#controls button{min-width:54px;min-height:46px}#status{min-height:44px;color:#b6c8db;text-align:center;line-height:1.5}#questions{max-width:700px;margin:40px auto}.answer{display:block;width:100%;text-align:left;margin:12px 0;padding:18px}footer{font-size:12px;text-align:center;color:#8eb4ca;margin:20px} [hidden]{display:none!important}`;
const html=`<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mi juego</title><link rel="stylesheet" href="style.css"></head><body>
<main><header><div><small>MI CREACIÓN · CLUB DE INFORMÁTICA</small><h1 id="game-title"></h1></div><div><button id="pause">Pausar</button> <button id="restart">Reiniciar</button></div></header>
<div id="hud" role="status"></div><canvas id="arena" width="960" height="540" tabindex="0" aria-label="Escenario del juego"></canvas><div id="questions"></div>
<div id="controls"><button data-key="ArrowLeft" aria-label="Izquierda">←</button><button data-key="ArrowUp" aria-label="Arriba o saltar">↑ / salto</button><button data-key="ArrowDown" aria-label="Abajo">↓</button><button data-key="ArrowRight" aria-label="Derecha">→</button></div>
<p id="status" role="status"></p><footer>Construí · Probá · Mejorá</footer></main><script src="game-config.js"><\/script><script src="game.js"><\/script></body></html>`;
window.StudioKits={catalog,
  art(id){const shapes={stars:'<path d="M95 13l16 36-16-9-16 9z" fill="#e0f2fe"/><circle cx="95" cy="31" r="5" fill="#38bdf8"/><path d="M35 17l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z" fill="#fde68a"/><circle cx="152" cy="45" r="12" fill="#7389ae"/>',race:'<path d="M64 0L40 65h110L126 0z" fill="#111827"/><path d="M95 0v65" stroke="#7dd3fc" stroke-dasharray="8 7"/><rect x="75" y="14" width="32" height="42" rx="7" fill="#a5b4fc"/><rect x="80" y="22" width="22" height="14" rx="3" fill="#15243e"/>',platform:'<path d="M0 65L30 13 60 65 90 22 125 65 160 8 190 65" fill="#204e49"/><path d="M20 51h50m20-18h40m20-17h35" stroke="#86efac" stroke-width="6"/><path d="M94 16l9-10 9 10-9 12z" fill="#67e8f9"/>',quiz:'<rect x="38" y="12" width="115" height="45" rx="10" fill="#254368"/><path d="M57 27h75m-75 13h49" stroke="#7dd3fc" stroke-width="5"/><circle cx="139" cy="47" r="12" fill="#86efac"/><path d="M133 47l4 4 8-8" stroke="#164e63" fill="none" stroke-width="3"/>',web:'<rect x="29" y="9" width="132" height="51" rx="7" fill="#dbeafe"/><path d="M29 22h132" stroke="#8bb3d4"/><circle cx="39" cy="16" r="2" fill="#2783de"/><rect x="38" y="29" width="50" height="23" rx="3" fill="#2783de"/><path d="M99 33h48m-48 10h38" stroke="#426d91" stroke-width="4"/>'};return '<svg viewBox="0 0 190 65" role="img" aria-label="'+id+'" xmlns="http://www.w3.org/2000/svg">'+(shapes[id]||shapes.stars)+'</svg>';},
  create(id){
    const kit=catalog.find(k=>k.id===id);if(!kit)throw new Error('Elegí una base de juego.');
    if(id==='web')return {
      'index.html':'<!doctype html>\n<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mi universo creativo</title><link rel="stylesheet" href="style.css"></head><body><header><b>✦ MI UNIVERSO</b><nav><a href="#creaciones">Creaciones</a><a href="#proceso">Mi proceso</a><button id="theme">Cambiar tema</button></nav></header><main><section class="hero"><p class="label">DISEÑO · CÓDIGO · IMAGINACIÓN</p><h1>Las ideas se convierten en creaciones.</h1><p>Este es mi espacio para mostrar lo que aprendo, construyo y mejoro.</p><a class="button" href="#creaciones">Explorar mis proyectos →</a><div class="orb" aria-hidden="true">✦</div></section><section id="creaciones"><p class="label">MI PORTAFOLIO</p><h2>Cada proyecto cuenta una historia.</h2><div class="cards"><article><span>🎮</span><h3>Mi videojuego</h3><p>Un desafío con reglas propias, movimiento y una meta.</p></article><article><span>🧊</span><h3>Mi personaje</h3><p>Un diseño pensado desde sus formas y sus colores.</p></article><article><span>💡</span><h3>Mi próxima idea</h3><p>Un problema que quiero resolver con tecnología.</p></article></div></section><section id="proceso"><p class="label">MI PROCESO</p><h2>Imaginar. Construir. Probar. Mejorar.</h2><p>Acá voy a explicar una decisión que tomé y qué aprendí al probarla.</p></section></main><footer>Creado en el Club de Informática · Krueka</footer><script src="script.js"><\/script></body></html>',
      'style.css':'*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;font-family:system-ui,sans-serif;background:#0b1020;color:#eef5ff}header,main,footer{width:min(1050px,90%);margin:auto}header{display:flex;justify-content:space-between;gap:20px;align-items:center;padding:25px 0;border-bottom:1px solid #ffffff25}nav{display:flex;align-items:center;gap:18px;flex-wrap:wrap}a{color:inherit;text-decoration:none}button,.button{background:#7dd3fc;color:#082f49;border:0;border-radius:10px;padding:12px 18px;font:inherit;font-weight:700;cursor:pointer}.hero{position:relative;overflow:hidden;padding:80px 0;min-height:460px}.hero h1{font-size:clamp(36px,7vw,74px);line-height:1.02;max-width:700px;letter-spacing:-.05em}.hero p{max-width:540px;line-height:1.6}.label{color:#7dd3fc;font-weight:700;font-size:11px;letter-spacing:.16em}.button{display:inline-block;margin-top:20px}.orb{position:absolute;right:0;top:70px;font-size:210px;color:#7dd3fc55;z-index:-1;text-shadow:0 0 80px #38bdf8}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px}.cards article{padding:28px;border:1px solid #ffffff25;border-radius:18px;background:#ffffff08}.cards span{font-size:38px}section{padding:30px 0}p{color:#a8bdd4;line-height:1.6}footer{padding:30px 0;border-top:1px solid #ffffff25;font-size:12px;color:#a8bdd4}.light{background:#eef6fb;color:#12283b}.light p{color:#526b81}.light .label{color:#096d9e}.light article{background:white;border-color:#cbdde8}@media(max-width:650px){header{align-items:flex-start;flex-direction:column}.hero{padding:40px 0;min-height:360px}.orb{font-size:140px}}',
      'script.js':'// El botón cambia una clase de CSS: compará ambos temas.\ndocument.getElementById("theme").addEventListener("click",function(){document.body.classList.toggle("light");});',
      'LEEME.md':'# Mi sitio creativo\n\n1. Abrí index.html y cambiá el título y los textos.\n2. Abrí style.css y personalizá los colores.\n3. Probá la navegación y el botón de tema.\n4. Explicá acá tu decisión y enviá el sitio al profe.\nNo incluyas datos personales.\n'
    };
    const cfg={kind:id,title:kit.title,theme:id==='platform'?'forest':'space',avatar:id==='race'?'🏎️':id==='platform'?'🦊':'🚀',speed:250,target:id==='race'?100:10,lives:3,seconds:90};
    if(id==='quiz')cfg.questions=[{text:'¿Qué archivo define la apariencia de una página?',options:['HTML','CSS','JavaScript'],correct:1},{text:'¿Qué usamos para repetir instrucciones?',options:['Un bucle','Un título','Una imagen'],correct:0},{text:'¿Qué conviene hacer después de cambiar una regla?',options:['Borrar el juego','Probar el resultado','Cambiar todo otra vez'],correct:1}];
    return {'index.html':html,'style.css':css,'game-config.js':this.configFile(cfg),'game.js':'/* Motor editable: movimiento, colisiones, puntuación y controles. */\n('+gameRuntime.toString()+')();','LEEME.md':'# '+kit.title+'\n\n'+kit.challenge+'\n\n1. Personalizá el juego.\n2. Probalo con teclado y botones.\n3. Abrí game-config.js y compará los valores.\n4. Explicá una decisión y enviá el proyecto al profe.\n'};
  },
  configFile(cfg){return '/* Cambiá estas reglas y probá qué ocurre. */\nwindow.KRUEKA_GAME = '+JSON.stringify(cfg,null,2)+';\n';},
  read(files){const raw=files['game-config.js'];if(!raw)return null;try{return JSON.parse(raw.slice(raw.indexOf('{'),raw.lastIndexOf('}')+1))}catch(_e){return null;}}
};
})();
