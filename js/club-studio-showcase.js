/* NEON RIFT: ejemplo jugable, sin CDNs, ni servicios, ni datos del alumno. */
(function(){'use strict';if(!window.StudioKits||window.StudioShowcase)return;
const html="<!doctype html>\n<html lang=\"es\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n<title>NEON RIFT | Guardianes del núcleo</title><link rel=\"stylesheet\" href=\"style.css\"></head><body>\n<div class=\"game-wrap\">\n<header class=\"top\"><div class=\"brand\"><span class=\"logo\">◈</span><div><small>KRUEKA STUDIO · DEMO COMPLETA</small><h1 id=\"name\">NEON RIFT</h1></div></div><div class=\"tools\"><button id=\"sound\" aria-label=\"Activar sonido\">🔇 Sonido</button><button id=\"pause\">Pausar</button></div></header>\n<section class=\"hud\" aria-label=\"Estadísticas del juego\"><div><small>ESCUDOS</small><strong id=\"life\">♥ ♥ ♥ ♥</strong></div><div><small>PUNTOS</small><strong id=\"score\">000000</strong></div><div><small>OLEADA</small><strong id=\"wave\">1 / 3</strong></div><div><small>HABILIDAD</small><strong id=\"dash\">DASH LISTO</strong></div></section>\n<main><div class=\"arena-box\"><canvas id=\"arena\" width=\"960\" height=\"540\" tabindex=\"0\" aria-label=\"Campo de combate futurista\"></canvas><div id=\"banner\" aria-live=\"polite\"></div>\n<div id=\"sheet\" class=\"sheet\"><div class=\"sheet-inner\"><p class=\"eyebrow\">OPERACIÓN NÚCLEO · AÑO 2099</p><h2 id=\"sheet-title\">NEON RIFT</h2><p id=\"sheet-text\">El juego está listo.</p><div id=\"choices\" class=\"choices\"></div><button class=\"go\" id=\"mode\">Jugar ahora</button></div></div></div></main>\n<div class=\"touch\" aria-label=\"Controles táctiles\"><div class=\"pad\"><button data-control=\"up\" class=\"up\" aria-label=\"Arriba\">▲</button><button data-control=\"left\" class=\"left\" aria-label=\"Izquierda\">◀</button><button data-control=\"down\" class=\"down\" aria-label=\"Abajo\">▼</button><button data-control=\"right\" class=\"right\" aria-label=\"Derecha\">▶</button></div><div class=\"buttons\"><button data-control=\"dash\" class=\"dash\">DASH ⚡</button><button data-control=\"fire\" class=\"fire\">DISPARAR ◎</button></div></div>\n<footer><span>WASD / FLECHAS · MOVER</span><span>ESPACIO / CLIC · DISPARAR</span><span>SHIFT · DASH</span><span>P · PAUSA</span></footer>\n</div><script src=\"game-config.js\"></script><script src=\"game.js\"></script>\n</body></html>";
const css=":root{color-scheme:dark;font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#060a17;color:#eefaff}*{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(ellipse at 65% 0%,#172651 0%,#070c1e 55%,#030511 100%)}button{font:inherit;color:inherit;cursor:pointer;touch-action:none}.game-wrap{max-width:1130px;margin:0 auto;padding:14px 18px}.top{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:6px 0 15px}.brand{display:flex;align-items:center;gap:14px}.logo{font-size:42px;color:#73f0ff;text-shadow:0 0 25px #18d9ff}.brand small,.eyebrow{color:#69cce5;font-size:10px;letter-spacing:.22em;font-weight:800}.brand h1{margin:0;font-size:clamp(21px,4vw,33px);letter-spacing:.16em;text-shadow:0 0 32px #1c95d977}.tools{display:flex;gap:9px}.tools button{border:1px solid #3c5c7f;background:#14223d;padding:9px 15px;border-radius:11px}.tools button:hover{border-color:#7ddfff}.hud{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin-bottom:12px}.hud>div{border:1px solid #32547b8c;background:linear-gradient(120deg,#0f1b34,#0b1326);border-radius:13px;padding:9px 14px;min-width:0}.hud small{display:block;color:#7ba8c5;font-size:10px;letter-spacing:.15em}.hud strong{display:block;margin-top:4px;font-size:clamp(13px,2.5vw,20px);color:#dffbff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.hud>div:first-child strong{color:#ff85bd}.hud>div:nth-child(2) strong{color:#65ecff}.arena-box{position:relative;overflow:hidden;border:1px solid #4b90c0;border-radius:19px;background:#05091d;box-shadow:0 0 0 1px #3eeaff20,0 25px 70px #0009,0 0 100px #0575a72c}.arena-box canvas{width:100%;height:auto;display:block;aspect-ratio:16/9;outline:none;touch-action:none}#banner{position:absolute;top:23%;left:0;right:0;text-align:center;pointer-events:none;color:#adf8ff;font-size:clamp(16px,3vw,30px);letter-spacing:.15em;font-weight:900;opacity:0;text-shadow:0 0 22px #31e4ff}#banner.show{animation:banner 1.8s ease both}@keyframes banner{10%,70%{opacity:1;transform:translateY(0)}0%{opacity:0;transform:translateY(15px)}100%{opacity:0;transform:translateY(-14px)}}.sheet{position:absolute;inset:0;background:#05091dc9;display:grid;place-items:center;padding:16px;backdrop-filter:blur(7px)}.sheet[hidden]{display:none!important}.sheet-inner{text-align:center;width:min(540px,95%);padding:clamp(12px,3vw,35px);border:1px solid #47b7df7f;border-radius:22px;background:radial-gradient(ellipse at 50% 0%,#173862,#090d25 80%);box-shadow:0 0 65px #1e83bb4a}.sheet h2{font-size:clamp(26px,5vw,52px);line-height:1.07;margin:10px 0;letter-spacing:.07em;color:#f2faff;text-shadow:0 0 25px #35cdeb88}.sheet p:not(.eyebrow){font-size:clamp(12px,1.8vw,16px);line-height:1.5;color:#bad2e6}.go,.choice{border:1px solid #76efff;border-radius:12px;background:linear-gradient(110deg,#07a9d0,#3367d3);color:white;font-weight:900;letter-spacing:.04em;padding:13px 24px;margin:8px auto 0;box-shadow:0 6px 25px #008dbe66}.go:hover,.choice:hover{filter:brightness(1.23)}.choices{display:grid;gap:7px}.choice{display:block;width:100%;margin:0;font-size:clamp(11px,1.8vw,14px);padding:10px;background:#142c49;border-color:#3477a8}.touch{display:flex;justify-content:space-between;gap:20px;align-items:center;margin:12px auto;max-width:960px}.pad{display:grid;grid-template:repeat(3,41px)/repeat(3,47px);gap:2px;justify-items:stretch}.pad button,.buttons button{border:1px solid #4175a2;background:linear-gradient(#172b49,#0c1830);border-radius:11px;color:#cdeeff;font-weight:900;box-shadow:0 3px 12px #0008}.pad .up{grid-area:1/2}.pad .left{grid-area:2/1}.pad .down{grid-area:3/2}.pad .right{grid-area:2/3}.pad button.pressed,.buttons button.pressed{background:#0d9ccc;color:white}.buttons{display:flex;gap:12px;align-items:center}.buttons button{padding:14px 18px;min-height:58px}.buttons .fire{background:linear-gradient(140deg,#ac227e,#5e2c87);border-color:#f07dca}.buttons .dash{border-color:#5addeb}footer{display:flex;flex-wrap:wrap;gap:15px;justify-content:center;color:#7ca2bc;font-size:10px;font-weight:800;letter-spacing:.08em;padding:8px 0 18px}@media(max-width:670px){.game-wrap{padding:10px 6px}.top{gap:5px}.logo{font-size:26px}.brand{gap:6px}.brand small{font-size:8px}.tools button{font-size:11px;padding:7px}.hud{gap:4px;margin-bottom:6px}.hud>div{padding:7px 5px;border-radius:8px}.hud small{font-size:8px}.hud strong{font-size:12px}.arena-box{border-radius:9px}.touch{gap:7px;margin:8px 3px}.pad{grid-template:repeat(3,35px)/repeat(3,39px)}.buttons{gap:6px}.buttons button{padding:9px;min-height:52px;font-size:11px}footer{font-size:9px;gap:6px}.sheet-inner{padding:12px}.sheet p:not(.eyebrow){margin:6px 0}.sheet h2{margin:5px 0}.eyebrow{font-size:8px}}@media(max-width:380px){.hud strong{font-size:10px}.brand h1{font-size:19px}.tools{gap:3px}.buttons button{font-size:10px;padding:6px}}";
const cfg={"kind":"neon-rift","title":"NEON RIFT","speed":320,"lives":4,"waves":3,"damage":12,"colors":{"cyan":"#62eeff","pink":"#ff4bc1","gold":"#ffe082"}};
const readme="# NEON RIFT · Guardianes del núcleo\n\nEste es un EJEMPLO TERMINADO, original y editable, creado como demostración de Krueka Studio IA. No requiere descargar recursos ni instalar programas.\n\n## Cómo jugar\n- WASD o flechas: mover la nave.\n- ESPACIO, tecla J o clic presionado: disparar (con apuntado automático si no se usa el ratón).\n- SHIFT: desplazamiento veloz (DASH), con tiempo de recarga.\n- P: pausar. En celulares, utilizar los controles de pantalla.\n- Completar tres oleadas, elegir mejoras entre oleadas y vencer al guardián.\n- Los sonidos son opcionales y se activan desde el botón del juego.\n\n## Cómo aprender del ejemplo\n1. Primero, jugá una partida sin modificar nada.\n2. En game-config.js, cambiá speed, lives, waves (1 a 3) o damage.\n3. Volvé a Probar y compará la dificultad.\n4. En style.css personalizá el aspecto de la interfaz.\n5. Pedile a la IA un cambio PEQUEÑO y CONCRETO. Por ejemplo: «En game-config.js ajustá la velocidad a 350 conservando el resto del juego».\n6. Registrá qué modificaste y enviá tu versión al profe.\n\n## Estructura\n- index.html: controles y pantallas.\n- style.css: interfaz, panel y botones táctiles.\n- game-config.js: reglas fáciles de cambiar.\n- game.js: motor del juego, enemigos, colisiones, partículas y sonidos.\n\nCada alumno obtiene una COPIA al seleccionar esta base. El ejemplo original nunca se modifica y crear el juego no usa saldo de la API. Las mejoras pedidas a IA sí utilizan el cupo correspondiente.\n";
const runtime=function gameRuntime(){
'use strict';
const cfg=Object.assign({kind:'neon-rift',title:'NEON RIFT',speed:320,lives:4,waves:3,damage:12,colors:{cyan:'#62eeff',pink:'#ff4bc1',gold:'#ffe082'}},window.KRUEKA_GAME||{});
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),rand=(a,b)=>a+Math.random()*(b-a);
const canvas=document.getElementById('arena'),c=canvas.getContext('2d',{alpha:false});
const sheet=document.getElementById('sheet'),sheetTitle=document.getElementById('sheet-title'),sheetText=document.getElementById('sheet-text'),choices=document.getElementById('choices'),mode=document.getElementById('mode'),sound=document.getElementById('sound'),pause=document.getElementById('pause');
const lifeEl=document.getElementById('life'),scoreEl=document.getElementById('score'),waveEl=document.getElementById('wave'),dashEl=document.getElementById('dash');
document.getElementById('name').textContent=String(cfg.title).slice(0,55);
document.title=String(cfg.title).slice(0,55);
if(!c){sheetText.textContent='No fue posible iniciar el motor gráfico. Probá con otro navegador.';return;}
const W=960,H=540,accent=cfg.colors&&/^#[0-9a-f]{6}$/i.test(cfg.colors.cyan)?cfg.colors.cyan:'#62eeff',pink=cfg.colors&&/^#[0-9a-f]{6}$/i.test(cfg.colors.pink)?cfg.colors.pink:'#ff4bc1',gold=cfg.colors&&/^#[0-9a-f]{6}$/i.test(cfg.colors.gold)?cfg.colors.gold:'#ffe082';
const stars=Array.from({length:98},()=>({x:rand(0,W),y:rand(0,H),z:rand(.3,1.4)}));
const key=Object.create(null),touch=Object.create(null);
let phase='menu',wave=1,score=0,kills=0,mult=1,last=0,elapsed=0,spawnClock=0,remaining=0,bossDone=false,shake=0,flash=0,music=false,audio=null,upgradeCount=0;
let player,foes=[],bullets=[],particles=[],pickups=[],rings=[];
let pointer={x:W/2+80,y:H/2,active:false,down:false,seen:false};
let damage=clamp(Number(cfg.damage)||12,4,60),speed=clamp(Number(cfg.speed)||320,150,510),maxLife=clamp(Math.round(Number(cfg.lives)||4),1,9),multiShot=1,fireRate=.16;
let shotClock=0,hitClock=0,frame=0;
function reset(){
 wave=1;score=0;kills=0;mult=1;elapsed=0;spawnClock=0;upgradeCount=0;
 damage=clamp(Number(cfg.damage)||12,4,60);speed=clamp(Number(cfg.speed)||320,150,510);
 maxLife=clamp(Math.round(Number(cfg.lives)||4),1,9);multiShot=1;fireRate=.16;
 player={x:W/2,y:H/2,r:14,hp:maxLife,dash:0,dashCD:0,inv:1,angle:-Math.PI/2,dx:0,dy:0};
 foes=[];bullets=[];particles=[];pickups=[];rings=[];waveStart(1);
}
function waveStart(n){
 wave=n;bossDone=false;remaining=8+n*4;spawnClock=1.1;shotClock=0;phase='playing';sheet.hidden=true;pause.textContent='Pausar';setHud();
 burst(W/2,H/2,accent,35,180);speak('OLEADA '+wave+(wave>=Math.min(3,Number(cfg.waves)||3)?' · JEFE FINAL':''),1.9);
}
function speak(t,d=1.2){const el=document.getElementById('banner');el.textContent=t;el.classList.remove('show');void el.offsetWidth;el.classList.add('show');clearTimeout(speak.timer);speak.timer=setTimeout(()=>el.classList.remove('show'),d*1000);}
function show(title,description,button,fn){
 phase=button==='Continuar'?'paused':phase;sheet.hidden=false;choices.replaceChildren();sheetTitle.textContent=title;sheetText.textContent=description;
 mode.hidden=false;mode.textContent=button;mode.onclick=fn;setHud();
}
function setHud(){
 lifeEl.textContent='♥ '.repeat(Math.max(0,player?player.hp:maxLife)).trim()||'SIN VIDAS';
 scoreEl.textContent=String(score).padStart(6,'0');waveEl.textContent=wave+' / '+Math.min(3,clamp(Number(cfg.waves)||3,1,3));
 dashEl.textContent=player&&player.dashCD>0?'RECARGA '+Math.ceil(player.dashCD*10)/10+'s':'DASH LISTO';
}
function tone(freq,len=.1,type='sine',vol=.03){
 if(!music)return;
 try{
   const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
   if(!audio)audio=new AC();if(audio.state==='suspended')audio.resume();
   const o=audio.createOscillator(),g=audio.createGain(),now=audio.currentTime;
   o.type=type;o.frequency.setValueAtTime(freq,now);o.frequency.exponentialRampToValueAtTime(Math.max(50,freq*.65),now+len);
   g.gain.setValueAtTime(vol,now);g.gain.exponentialRampToValueAtTime(.001,now+len);
   o.connect(g);g.connect(audio.destination);o.start(now);o.stop(now+len+.012);
 }catch(_e){music=false;sound.textContent='Sonido apagado';}
}
function burst(x,y,color,count=12,force=135){
 for(let i=0;i<count;i++){if(particles.length>=180)particles.shift();const a=rand(0,Math.PI*2),v=rand(force*.25,force);
 particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,t:rand(.23,.68),max:.7,color,size:rand(1.6,4.8)});}
 rings.push({x,y,r:8,t:.4,color});if(rings.length>24)rings.shift();
}
function enemy(type,x,y){
 const boss=type==='boss',hp=boss?205:type==='tank'?45:type==='sniper'?26:20;
 foes.push({type,x,y,r:boss?49:type==='tank'?23:type==='sniper'?17:15,hp,max:hp,speed:boss?65:type==='tank'?55:type==='sniper'?78:110,shoot:rand(1,2),time:rand(0,9),angle:0});
}
function spawn(){
 const edge=Math.floor(rand(0,4)),x=edge<2?(edge===0?-45:W+45):rand(25,W-25),y=edge>=2?(edge===2?-45:H+45):rand(25,H-25);
 let type='scout';const n=Math.random();if(wave>=2&&n>.69)type='sniper';if(wave>=2&&n>.84)type='tank';
 enemy(type,x,y);
}
function playerShot(){
 if(shotClock>0||phase!=='playing')return;
 shotClock=fireRate;
 let aim=player.angle;
 if(!pointer.active){let closest=null,best=1e9;for(const e of foes){const d=Math.hypot(e.x-player.x,e.y-player.y);if(d<best){best=d;closest=e;}}
 if(closest)aim=Math.atan2(closest.y-player.y,closest.x-player.x);}
 player.angle=aim;
 for(let i=0;i<multiShot;i++){
  const a=aim+(i-(multiShot-1)/2)*.17;bullets.push({x:player.x+Math.cos(a)*23,y:player.y+Math.sin(a)*23,vx:Math.cos(a)*720,vy:Math.sin(a)*720,r:4,team:'hero',damage,life:1.2});
 }
 if(bullets.length>105)bullets.splice(0,bullets.length-105);
 burst(player.x-Math.cos(aim)*12,player.y-Math.sin(aim)*12,accent,3,55);tone(590,.07,'triangle',.018);
}
function fireEnemy(e,count=1){
 const a=Math.atan2(player.y-e.y,player.x-e.x);
 for(let j=0;j<count;j++){const rad=a+(j-(count-1)/2)*.22;
 bullets.push({x:e.x+Math.cos(rad)*e.r,y:e.y+Math.sin(rad)*e.r,vx:Math.cos(rad)*235,vy:Math.sin(rad)*235,r:e.type==='boss'?7:5,team:'enemy',damage:1,life:3});}
 tone(130,.12,'sawtooth',.015);
}
function dash(){
 if(phase!=='playing'||player.dashCD>0)return;
 const x=Number(!!(key.ArrowRight||key.d||touch.right))-Number(!!(key.ArrowLeft||key.a||touch.left));
 const y=Number(!!(key.ArrowDown||key.s||touch.down))-Number(!!(key.ArrowUp||key.w||touch.up));
 const len=Math.hypot(x,y);const a=len?Math.atan2(y,x):player.angle;
 player.dx=Math.cos(a)*720;player.dy=Math.sin(a)*720;player.dash=.16;player.dashCD=2.8;player.inv=.24;
 burst(player.x,player.y,accent,20,250);tone(210,.23,'sawtooth',.04);setHud();
}
function playerHit(){
 if(player.inv>0||phase!=='playing')return;
 player.hp--;player.inv=1.3;hitClock=.28;flash=.27;shake=14;mult=1;
 burst(player.x,player.y,pink,23,250);tone(115,.35,'sawtooth',.075);setHud();
 if(player.hp<=0)end(false);
}
function kill(e){
 const n=foes.indexOf(e);if(n<0)return;foes.splice(n,1);kills++;score+=Math.round((e.type==='boss'?1800:e.type==='tank'?220:100)*mult);
 mult=Math.min(5,mult+.12);shake=Math.max(shake,e.type==='boss'?20:4);burst(e.x,e.y,e.type==='boss'?gold:pink,e.type==='boss'?65:17,e.type==='boss'?310:155);
 if(e.type==='boss')bossDone=true;
 if(Math.random()<.13&&e.type!=='boss')pickups.push({x:e.x,y:e.y,t:9,r:11});
 tone(e.type==='boss'?185:360,.12,'triangle',.045);setHud();
}
function end(win){
 phase=win?'win':'lost';tone(win?760:85,.45,win?'sine':'sawtooth',.06);
 show(win?'¡NÚCLEO SALVADO!':'MISIÓN FALLIDA',win?'Derrotaste al guardián del Rift con '+score+' puntos y '+kills+' enemigos vencidos. ¡Excelente trabajo!':'Lograste '+score+' puntos. Probá otra estrategia, esquivá y usá DASH para sobrevivir.','Volver a jugar',()=>{reset();});
}
const upgrades=[
 {title:'⚡ Cañón de plasma',desc:'+45% de daño',apply:()=>{damage=Math.round(damage*1.45);}},
 {title:'💨 Propulsores',desc:'+20% de velocidad',apply:()=>{speed=Math.min(530,Math.round(speed*1.2));}},
 {title:'💚 Reparación',desc:'+2 vidas y una vida máxima',apply:()=>{maxLife=Math.min(9,maxLife+1);player.hp=Math.min(maxLife,player.hp+2);}},
 {title:'🔱 Triple disparo',desc:'Más proyectiles por ataque',apply:()=>{multiShot=Math.min(5,multiShot+2);}},
 {title:'🌠 Supercadencia',desc:'Disparos un 25% más rápidos',apply:()=>{fireRate=Math.max(.075,fireRate*.75);}}
];
function upgrade(){
 phase='upgrade';sheet.hidden=false;mode.hidden=true;sheetTitle.textContent='MEJORA TU NAVE';sheetText.textContent='Ola superada. Elegí una tecnología para el siguiente combate.';
 choices.replaceChildren();const start=(wave+upgradeCount)%upgrades.length;
 for(let i=0;i<3;i++){const u=upgrades[(start+i*2)%upgrades.length],b=document.createElement('button');
 b.className='choice';b.textContent=u.title+' — '+u.desc;
 b.addEventListener('click',()=>{u.apply();upgradeCount++;tone(770,.18,'triangle',.06);waveStart(wave+1);});choices.appendChild(b);}
}
function update(dt){
 elapsed+=dt;frame++;flash=Math.max(0,flash-dt);shake=Math.max(0,shake-dt*42);hitClock=Math.max(0,hitClock-dt);
 player.inv=Math.max(0,player.inv-dt);player.dashCD=Math.max(0,player.dashCD-dt);shotClock=Math.max(0,shotClock-dt);
 const dx=Number(!!(key.ArrowRight||key.d||touch.right))-Number(!!(key.ArrowLeft||key.a||touch.left));
 const dy=Number(!!(key.ArrowDown||key.s||touch.down))-Number(!!(key.ArrowUp||key.w||touch.up));
 const mag=Math.hypot(dx,dy)||1;
 if(player.dash>0){player.x+=player.dx*dt;player.y+=player.dy*dt;player.dash-=dt;burst(player.x,player.y,accent,2,38);}
 else{player.x+=dx/mag*speed*dt;player.y+=dy/mag*speed*dt;}
 player.x=clamp(player.x,28,W-28);player.y=clamp(player.y,25,H-25);
 if(pointer.active)player.angle=Math.atan2(pointer.y-player.y,pointer.x-player.x);
 else if(dx||dy)player.angle=Math.atan2(dy,dx);
 if(key[' ']||key.j||touch.fire||pointer.down)playerShot();
 spawnClock-=dt;
 if(remaining>0&&spawnClock<=0&&foes.length<30){remaining--;spawn();spawnClock=.68-wave*.09+rand(-.12,.14);}
 if(remaining===0&&wave>=Math.min(3,clamp(Number(cfg.waves)||3,1,3))&&!bossDone&&!foes.some(e=>e.type==='boss')){enemy('boss',W/2,-65);bossDone=true;speak('¡EL GUARDIÁN DESPIERTA!',1.8);}
 for(const e of foes){
  e.time+=dt;e.shoot-=dt;const ax=player.x-e.x,ay=player.y-e.y,dist=Math.hypot(ax,ay)||1;
  const move=e.type==='sniper'&&dist<235?-0.65:e.type==='boss'&&dist<190?.15:1;
  e.x+=ax/dist*e.speed*move*dt+(e.type==='sniper'?Math.sin(e.time*3)*35*dt:0);
  e.y+=ay/dist*e.speed*move*dt;e.angle=Math.atan2(ay,ax);
  if(e.shoot<0&&(e.type==='sniper'||e.type==='boss')){e.shoot=e.type==='boss'?1.15:2;fireEnemy(e,e.type==='boss'?5:1);}
  if(dist<e.r+player.r+2)playerHit();
 }
 for(let i=bullets.length-1;i>=0;i--){
  const b=bullets[i];b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;
  if(b.life<=0||b.x< -40||b.x>W+40||b.y< -40||b.y>H+40){bullets.splice(i,1);continue;}
  if(b.team==='enemy'){if(Math.hypot(b.x-player.x,b.y-player.y)<b.r+player.r){bullets.splice(i,1);playerHit();}continue;}
  let struck=false;
  for(const e of foes){if(Math.hypot(b.x-e.x,b.y-e.y)<b.r+e.r){e.hp-=b.damage;burst(b.x,b.y,accent,3,48);if(e.hp<=0)kill(e);struck=true;break;}}
  if(struck)bullets.splice(i,1);
 }
 for(let i=pickups.length-1;i>=0;i--){const p=pickups[i];p.t-=dt;
 if(Math.hypot(p.x-player.x,p.y-player.y)<p.r+player.r+6){player.hp=Math.min(maxLife,player.hp+1);burst(p.x,p.y,'#79ffa8',16,175);tone(860,.19,'sine',.05);pickups.splice(i,1);setHud();}
 else if(p.t<=0)pickups.splice(i,1);}
 for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.t-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.max(0,1-dt*2);p.vy*=Math.max(0,1-dt*2);if(p.t<=0)particles.splice(i,1);}
 for(let i=rings.length-1;i>=0;i--){rings[i].t-=dt;rings[i].r+=180*dt;if(rings[i].t<=0)rings.splice(i,1);}
 if(phase==='playing'&&remaining===0&&foes.length===0){if(wave>=Math.min(3,clamp(Number(cfg.waves)||3,1,3)))end(true);else upgrade();}
 if(frame%7===0)setHud();
}
function poly(x,y,r,sides,rot,color,fill=false){
 c.beginPath();for(let i=0;i<sides;i++){const a=rot+i*Math.PI*2/sides,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;i?c.lineTo(px,py):c.moveTo(px,py);}
 c.closePath();c.strokeStyle=color;c.lineWidth=2.2;if(fill){c.fillStyle=fill;c.fill();}c.stroke();
}
function render(t){
 c.fillStyle='#060b1d';c.fillRect(0,0,W,H);
 const gradient=c.createRadialGradient(W*.53,H*.34,15,W*.52,H*.4,690);
 gradient.addColorStop(0,'#172454');gradient.addColorStop(.51,'#0a1230');gradient.addColorStop(1,'#030713');c.fillStyle=gradient;c.fillRect(0,0,W,H);
 c.save();c.translate(rand(-shake,shake),rand(-shake,shake));
 for(const star of stars){const x=(star.x+elapsed*star.z*8)%W,y=(star.y+elapsed*star.z*3)%H;
 c.globalAlpha=star.z*.55;c.fillStyle='#b4efff';c.fillRect(x,y,star.z*1.9,star.z*1.9);}
 c.globalAlpha=1;
 const xshift=(elapsed*12)%48,yshift=(elapsed*9)%48;c.strokeStyle='#29478255';c.lineWidth=1;
 for(let x=-48+xshift;x<W+48;x+=48){c.beginPath();c.moveTo(x,0);c.lineTo(x,H);c.stroke();}
 for(let y=-48+yshift;y<H+48;y+=48){c.beginPath();c.moveTo(0,y);c.lineTo(W,y);c.stroke();}
 c.strokeStyle='#32b4f333';c.lineWidth=5;c.strokeRect(3,3,W-6,H-6);
 if(player&&phase!=='menu'){
   for(const p of pickups){c.save();c.translate(p.x,p.y);c.rotate(elapsed*2);poly(0,0,11,4,Math.PI/4,'#7effac','#1d6146');c.restore();}
   for(const b of bullets){c.shadowBlur=13;c.shadowColor=b.team==='hero'?accent:pink;c.fillStyle=b.team==='hero'?accent:pink;c.beginPath();c.arc(b.x,b.y,b.r,0,7);c.fill();}
   c.shadowBlur=0;
   for(const e of foes){
     const color=e.type==='boss'?gold:e.type==='tank'?'#c095ff':pink;
     c.save();c.translate(e.x,e.y);c.rotate(e.angle+Math.PI/2);c.shadowColor=color;c.shadowBlur=e.type==='boss'?18:8;
     poly(0,0,e.r,e.type==='boss'?8:e.type==='tank'?6:3,elapsed*.25,color,e.type==='boss'?'#57301d':'#39143b');
     poly(0,0,e.r*.56,4,elapsed*.65,accent);c.shadowBlur=0;c.restore();
     if(e.hp<e.max||e.type==='boss'){const ww=e.r*2.2;c.fillStyle='#15223f';c.fillRect(e.x-ww/2,e.y-e.r-12,ww,4);c.fillStyle=color;c.fillRect(e.x-ww/2,e.y-e.r-12,ww*Math.max(0,e.hp/e.max),4);}
   }
   c.save();c.translate(player.x,player.y);c.rotate(player.angle+Math.PI/2);
   c.globalAlpha=player.inv>0&&Math.sin(elapsed*24)>0?.47:1;
   c.shadowColor=accent;c.shadowBlur=25;
   c.beginPath();c.moveTo(0,-24);c.lineTo(17,18);c.lineTo(0,9);c.lineTo(-17,18);c.closePath();c.fillStyle='#137bba';c.fill();c.strokeStyle='#d8ffff';c.lineWidth=2;c.stroke();
   c.fillStyle=pink;c.beginPath();c.moveTo(-5,17);c.lineTo(0,24+Math.sin(elapsed*18)*7);c.lineTo(5,17);c.fill();
   c.shadowBlur=0;c.restore();
 }
 for(const p of particles){c.globalAlpha=clamp(p.t/p.max,0,1);c.fillStyle=p.color;c.fillRect(p.x,p.y,p.size,p.size);}
 c.globalAlpha=1;
 for(const r of rings){c.globalAlpha=clamp(r.t/.4,0,.7);c.strokeStyle=r.color;c.lineWidth=3;c.beginPath();c.arc(r.x,r.y,r.r,0,7);c.stroke();}
 c.globalAlpha=1;
 if(flash>0){c.fillStyle='rgba(255,70,150,'+(flash*.35)+')';c.fillRect(0,0,W,H);}
 if(phase==='playing'){c.fillStyle='#bce9ff';c.font='bold 13px system-ui';c.fillText('MULTI  x'+mult.toFixed(1),20,H-20);}
 c.restore();
}
function loop(t){
 const dt=Math.min(.034,(t-last)/1000||0);last=t;if(phase==='playing')update(dt);else elapsed+=dt*.24;
 render(t);requestAnimationFrame(loop);
}
function bindTouch(){
 for(const el of document.querySelectorAll('[data-control]')){
  const name=el.dataset.control;el.addEventListener('pointerdown',e=>{e.preventDefault();touch[name]=true;el.classList.add('pressed');try{el.setPointerCapture(e.pointerId)}catch(_e){}if(name==='dash')dash();});
  const release=e=>{e.preventDefault();touch[name]=false;el.classList.remove('pressed');};
  el.addEventListener('pointerup',release);el.addEventListener('pointercancel',release);el.addEventListener('lostpointercapture',()=>{touch[name]=false;el.classList.remove('pressed');});
 }
}
function pointerAim(e){
 const r=canvas.getBoundingClientRect();pointer.x=clamp((e.clientX-r.left)/r.width*W,0,W);pointer.y=clamp((e.clientY-r.top)/r.height*H,0,H);
 pointer.active=true;pointer.seen=true;
}
canvas.addEventListener('pointermove',e=>{if(e.pointerType!=='touch'||e.buttons)pointerAim(e);});
canvas.addEventListener('pointerdown',e=>{pointerAim(e);pointer.down=true;try{canvas.setPointerCapture(e.pointerId)}catch(_e){}});
const release=()=>{pointer.down=false;};
canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);
canvas.addEventListener('pointerleave',e=>{if(!e.buttons)pointer.active=false;});
window.addEventListener('keydown',e=>{
 const k=e.key.length===1?e.key.toLowerCase():e.key;
 if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Shift'].includes(k))e.preventDefault();
 key[k]=true;
 if(k==='Shift')dash();
 if(k==='p'||k==='Escape')togglePause();
 if(k==='Enter'&&!sheet.hidden&&mode.hidden===false)mode.click();
});
window.addEventListener('keyup',e=>{key[e.key.length===1?e.key.toLowerCase():e.key]=false;});
window.addEventListener('blur',()=>{for(const k in key)delete key[k];for(const k in touch)delete touch[k];pointer.down=false;if(phase==='playing')togglePause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&phase==='playing')togglePause();});
function togglePause(){
 if(phase==='playing'){phase='paused';show('MISIÓN EN PAUSA','Tus puntos y mejoras se conservan.','Continuar',()=>{phase='playing';sheet.hidden=true;pause.textContent='Pausar';});pause.textContent='Continuar';}
 else if(phase==='paused'){phase='playing';sheet.hidden=true;pause.textContent='Pausar';}
}
sound.addEventListener('click',()=>{music=!music;sound.textContent=music?'🔊 Sonido':'🔇 Sonido';tone(600,.18,'sine',.05);});
pause.addEventListener('click',togglePause);
bindTouch();show('NEON RIFT','Sos el último guardián del núcleo. Sobreviví a tres oleadas, elegí mejoras y derrotá al jefe final. ¡La nave está lista!','Jugar ahora',reset);
setHud();requestAnimationFrame(loop);
};
function create(){return {'index.html':html,'style.css':css,'game-config.js':StudioKits.configFile(cfg),'game.js':'('+runtime.toString()+')();','LEEME.md':readme};}
StudioKits.catalog.unshift({id:'neon-rift',icon:'⚡',title:'NEON RIFT · Ejemplo completo',tag:'DEMO PREMIUM · juego terminado',description:'Nave neón, oleadas, mejoras, jefe final y controles para celular.',challenge:'Jugá, cambiá daño y velocidad en game-config.js, probá tu versión y explicá qué aprendiste.'});
const oldCreate=StudioKits.create.bind(StudioKits),oldArt=StudioKits.art.bind(StudioKits);
StudioKits.create=function(id){return id==='neon-rift'?create():oldCreate(id)};
StudioKits.art=function(id){return id==='neon-rift'?'<svg viewBox="0 0 190 65" role="img" aria-label="Nave del juego NEON RIFT" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="188" height="63" rx="9" fill="#101936"/><path d="M0 55L190 11M0 18L190 64" stroke="#1c7099" stroke-width="2"/><path d="M95 8l23 47-23-13-23 13z" fill="#3edcf0" stroke="#e4fcff" stroke-width="2"/><circle cx="44" cy="28" r="12" fill="none" stroke="#ff4bc1" stroke-width="4"/><path d="M143 16l5 8-5 8-5-8z" fill="#ffe082"/></svg>':oldArt(id)};
window.StudioShowcase={create,gameRuntime:runtime};
})();