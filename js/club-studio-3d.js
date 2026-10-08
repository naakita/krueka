/* Studio 3D: geometría propia, editor de escena y juego; sin servicios ni librerías externas. */
(function(){
'use strict';
if(window.Studio3D||!window.StudioKits)return;
function normalise(raw){
  const c=raw&&typeof raw==='object'?raw:{},num=(v,a,b,d)=>Number.isFinite(Number(v))?Math.max(a,Math.min(b,Number(v))):d;
  const color=(v,d)=>/^#[0-9a-f]{6}$/i.test(String(v))?String(v):d,ids=new Set();
  const objects=(Array.isArray(c.objects)?c.objects:[]).slice(0,32).map((o,i)=>{
    o=o&&typeof o==='object'?o:{};let id=/^[a-z0-9-]{1,32}$/.test(String(o.id))?String(o.id):'object-'+i;let salt=0;while(ids.has(id))id='object-'+i+'-'+(++salt);ids.add(id);
    return {id,type:['crystal','crate','pillar','tree','drone','beacon'].includes(o.type)?o.type:'crate',label:String(o.label||'Objeto '+(i+1)).slice(0,32),x:num(o.x,-10,10,0),z:num(o.z,-12,12,0),size:num(o.size,.4,4,1),height:num(o.height,.5,5,1.5),color:color(o.color,'#67e8f9')};
  });
  return {...c,kind:'explore3d',title:String(c.title||'Exploradores 3D').slice(0,60),theme:['station','forest','island'].includes(c.theme)?c.theme:'station',lighting:['cryo','alert','sunset'].includes(c.lighting)?c.lighting:'cryo',avatarColor:color(c.avatarColor,'#a5b4fc'),speed:num(c.speed,2,9,5),lives:Math.round(num(c.lives,1,9,3)),seconds:Math.round(num(c.seconds,30,300,120)),camera:c.camera==='orbit'?'orbit':'follow',quality:c.quality==='high'?'high':'low',objects};
}
function runtime(){
  'use strict';
  const cfg=normalise(window.KRUEKA_GAME),hud=document.getElementById('hud'),status=document.getElementById('status'),mode=document.getElementById('mode'),renderer=document.getElementById('renderer');
  document.getElementById('game-title').textContent=cfg.title;document.title=cfg.title;
  let canvas=document.getElementById('arena'),gl=null,ctx=null,program,buffer,projectionLocation,positionLocation,colorLocation;
  let player,collected,lives,time,invincible,elapsed,ended=false,paused=true,editing=true,last=0,lastDraw=0,yaw=.48,picked=null,drag=null,viewProjection;
  const keys={},clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255),sub=(a,b)=>a.map((v,i)=>v-b[i]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],unit=a=>{const d=Math.hypot(...a)||1;return a.map(v=>v/d)};
  const light={cryo:{direction:[.5,1,.7],tint:[.5,.84,1],accent:'#67e8f9',bg:'#081329'},alert:{direction:[-.5,1,.3],tint:[1,.36,.3],accent:'#fb7185',bg:'#241025'},sunset:{direction:[-.8,.7,.5],tint:[1,.8,.5],accent:'#fbbf24',bg:'#212039'}}[cfg.lighting];
  const palette={station:{floor:'#192c46',edge:'#344a66',accent:'#4fbce7'},forest:{floor:'#244b3e',edge:'#18362f',accent:'#86efac'},island:{floor:'#354364',edge:'#63739b',accent:'#c4b5fd'}}[cfg.theme];
  document.body.style.setProperty('--accent',light.accent);document.body.style.background=light.bg;
  function cpu(){
    if(gl){const old=canvas;canvas=old.cloneNode(false);old.replaceWith(canvas);}gl=null;
    ctx=canvas.getContext('2d');renderer.textContent='Modo compatible · sin WebGL';
    if(!ctx){status.textContent='Este navegador no puede dibujar el escenario. Probá otra base del Studio.';return false;}return true;
  }
  try{
    gl=canvas.getContext('webgl',{alpha:false,antialias:cfg.quality==='high',powerPreference:'low-power'});
    if(gl){
      const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error('Shader no disponible');return s;};
      program=gl.createProgram();const vs=shader(gl.VERTEX_SHADER,'attribute vec3 aPosition; attribute vec3 aColor; uniform mat4 uVP; varying vec3 vColor; varying float vDepth; void main(){gl_Position=uVP*vec4(aPosition,1.0);vColor=aColor;vDepth=gl_Position.w;}'),fs=shader(gl.FRAGMENT_SHADER,'precision mediump float; varying vec3 vColor; varying float vDepth; uniform vec3 uFog; void main(){float fog=clamp((vDepth-28.0)/60.0,0.0,0.75);gl_FragColor=vec4(mix(vColor,uFog,fog),1.0);}');
      gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Programa 3D no disponible');gl.deleteShader(vs);gl.deleteShader(fs);gl.useProgram(program);
      buffer=gl.createBuffer();positionLocation=gl.getAttribLocation(program,'aPosition');colorLocation=gl.getAttribLocation(program,'aColor');projectionLocation=gl.getUniformLocation(program,'uVP');gl.uniform3fv(gl.getUniformLocation(program,'uFog'),rgb(light.bg));gl.enable(gl.DEPTH_TEST);renderer.textContent='3D · WebGL';
      canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();if(cpu())bindCanvas();});
    }else if(!cpu())return;
  }catch(_e){if(!cpu())return;}
  function matrixMultiply(a,b){const out=new Float32Array(16);for(let col=0;col<4;col++)for(let row=0;row<4;row++)for(let k=0;k<4;k++)out[col*4+row]+=a[k*4+row]*b[col*4+k];return out;}
  function camera(){
    const follow=!editing&&cfg.camera==='follow',target=follow?[player.x,0,player.z-1]:[0,0,0],distance=follow?19:30,eye=[target[0]+Math.sin(yaw)*distance,follow?13:23,target[2]+Math.cos(yaw)*distance];
    const z=unit(sub(eye,target)),x=unit(cross([0,1,0],z)),y=cross(z,x),dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0);
    const view=new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);
    const f=1/Math.tan(Math.PI/8),aspect=canvas.width/canvas.height,near=.1,far=100;
    const perspective=new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0]);viewProjection=matrixMultiply(perspective,view);
  }
  let triangles=[],drawLayer=0;const lightDirection=unit(light.direction);
  function triangle(a,b,c,color,glow){
    const n=unit(cross(sub(b,a),sub(c,a))),diffuse=Math.max(0,n.reduce((v,e,i)=>v+e*lightDirection[i],0));
    const base=rgb(color),lit=base.map((v,i)=>clamp(glow?v:v*(.4+diffuse*.7)*(.6+light.tint[i]*.4),0,1));triangles.push({p:[a,b,c],color:lit,layer:drawLayer});
  }
  function mesh(vertices,faces,color,glow){for(const face of faces)for(let i=1;i<face.length-1;i++)triangle(vertices[face[0]],vertices[face[i]],vertices[face[i+1]],color,glow);}
  function box(x,y,z,w,h,d,color,rotation=0,glow=false){
    const co=Math.cos(rotation),si=Math.sin(rotation),v=[[-1,0,-1],[1,0,-1],[1,0,1],[-1,0,1],[-1,1,-1],[1,1,-1],[1,1,1],[-1,1,1]].map(p=>[x+p[0]*w/2*co+p[2]*d/2*si,y+p[1]*h,z-p[0]*w/2*si+p[2]*d/2*co]);
    mesh(v,[[0,1,2,3],[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]],color,glow);
  }
  function pyramid(x,y,z,size,height,color){mesh([[x-size,y,z-size],[x+size,y,z-size],[x+size,y,z+size],[x-size,y,z+size],[x,y+height,z]],[[0,4,1],[1,4,2],[2,4,3],[3,4,0]],color);}
  function crystal(x,y,z,s,color){const a=elapsed*.8,co=Math.cos(a),si=Math.sin(a),v=[[0,-s,0],[s,0,0],[0,0,s],[-s,0,0],[0,0,-s],[0,s,0]].map(p=>[x+p[0]*co+p[2]*si,y+p[1],z-p[0]*si+p[2]*co]);mesh(v,[[0,2,1],[0,3,2],[0,4,3],[0,1,4],[5,1,2],[5,2,3],[5,3,4],[5,4,1]],color);}
  function objectPosition(o){return {x:o.x+(o.type==='drone'?Math.sin(elapsed*1.1+o.z)*1.5:0),z:o.z};}
  function geometry(){
    triangles=[];drawLayer=0;box(0,-.65,0,24,.6,28,palette.edge);drawLayer=1;
    for(let x=-10;x<=10;x+=4)for(let z=-12;z<=12;z+=4)box(x,-.06,z,3.94,.06,3.94,((x+z)/4)%2?palette.floor:palette.edge);
    drawLayer=2;
    for(let z=-12;z<=12;z+=4){
      if(cfg.theme==='station'){for(const x of [-11,11]){box(x,0,z,.5,3,.6,palette.edge);box(x,.3,z,.55,2.3,.2,light.accent,0,true);}box(0,-.02,z,.04,.02,3.8,light.accent,0,true);}
      else if(cfg.theme==='forest')for(const x of [-11,11]){box(x,0,z,.4,1,.4,'#715843');pyramid(x,.8,z,1.3,2.8,'#296b54');}
      else for(const x of [-11,11])crystal(x,.4,z,.4,'#c4b5fd');
    }
    for(const o of cfg.objects){if(o.type==='crystal'&&collected.has(o.id))continue;const p=objectPosition(o),s=o.size;
      if(o.type==='crystal'){box(p.x,0,p.z,s,.15,s,palette.edge);crystal(p.x,1+Math.sin(elapsed*2+o.x)*.12,p.z,s*.45,o.color);}
      else if(o.type==='tree'){box(p.x,0,p.z,s*.3,o.height*.45,s*.3,'#8b6650');pyramid(p.x,o.height*.25,p.z,s*.8,o.height*.85,o.color);pyramid(p.x,o.height*.6,p.z,s*.55,o.height*.7,o.color);}
      else if(o.type==='drone'){box(p.x,.8,p.z,s,.4,s*.65,o.color);box(p.x,.94,p.z+s*.33,s*.6,.12,.03,'#fb7185',0,true);box(p.x,.86,p.z,s*1.9,.07,.2,palette.edge,elapsed*4);}
      else if(o.type==='beacon'){box(p.x,0,p.z,s*.5,o.height,s*.5,palette.edge);crystal(p.x,o.height+.3,p.z,s*.45,o.color);}
      else{box(p.x,0,p.z,s,o.height,s,o.color);box(p.x,o.height-.15,p.z,s*1.02,.12,s*1.02,palette.edge);}
      if(picked===o.id){box(p.x,-.01,p.z,s+1,.08,.06,'#fde68a',0,true);box(p.x,-.01,p.z,.06,.08,s+1,'#fde68a',0,true);}
    }
    const crystals=cfg.objects.filter(o=>o.type==='crystal'),open=collected.size===crystals.length,gate=open?'#86efac':'#8b9ab1';
    box(-1.3,0,-12,.4,3,.4,palette.edge);box(1.3,0,-12,.4,3,.4,palette.edge);box(0,2.6,-12,3,.4,.4,gate,0,true);box(0,.02,-11.7,2.6,.05,1.3,gate);
    const x=player.x,y=player.y,z=player.z,walk=Math.sin(elapsed*9)*(keys.ArrowLeft||keys.ArrowRight||keys.ArrowUp||keys.ArrowDown||keys.w||keys.a||keys.s||keys.d?1:0);
    box(x,y+.5,z,.65,.7,.45,cfg.avatarColor,player.angle);box(x,y+1.22,z,.64,.48,.55,cfg.avatarColor,player.angle);box(x,y+1.32,z+.3,.45,.2,.05,'#67e8f9',player.angle,true);
    box(x-.2,y+Math.max(0,walk*.1),z,.22,.5,.28,palette.edge);box(x+.2,y+Math.max(0,-walk*.1),z,.22,.5,.28,palette.edge);box(x-.45,y+.55+walk*.08,z,.18,.55,.22,cfg.avatarColor);box(x+.45,y+.55-walk*.08,z,.18,.55,.22,cfg.avatarColor);
    box(x,y+1.7,z,.08,.25,.08,palette.edge);crystal(x,y+1.97,z,.1,light.accent);
  }
  function project(v){const m=viewProjection,x=v[0],y=v[1],z=v[2],w=m[3]*x+m[7]*y+m[11]*z+m[15];if(w<=.1)return null;return {x:(1+(m[0]*x+m[4]*y+m[8]*z+m[12])/w)*canvas.width/2,y:(1-(m[1]*x+m[5]*y+m[9]*z+m[13])/w)*canvas.height/2,depth:w};}
  function draw(){
    const r=canvas.getBoundingClientRect(),limit=cfg.quality==='high'?960:720,w=Math.max(1,Math.round(Math.min(limit,r.width||720))),h=Math.max(1,Math.round(w*(r.height||450)/(r.width||720)));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}camera();geometry();
    if(gl){
      const data=new Float32Array(triangles.length*18);let i=0;for(const t of triangles)for(const p of t.p){data.set(p,i);data.set(t.color,i+3);i+=6;}
      gl.viewport(0,0,w,h);const bg=rgb(light.bg);gl.clearColor(...bg,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);gl.uniformMatrix4fv(projectionLocation,false,viewProjection);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);gl.enableVertexAttribArray(positionLocation);gl.vertexAttribPointer(positionLocation,3,gl.FLOAT,false,24,0);gl.enableVertexAttribArray(colorLocation);gl.vertexAttribPointer(colorLocation,3,gl.FLOAT,false,24,12);gl.drawArrays(gl.TRIANGLES,0,triangles.length*3);
    }else{
      ctx.fillStyle=light.bg;ctx.fillRect(0,0,w,h);const faces=triangles.map(t=>({p:t.p.map(project),color:t.color,layer:t.layer})).filter(t=>t.p.every(Boolean));faces.sort((a,b)=>a.layer-b.layer||b.p.reduce((n,p)=>n+p.depth,0)-a.p.reduce((n,p)=>n+p.depth,0));
      for(const t of faces){ctx.fillStyle='rgb('+t.color.map(v=>Math.round(v*255)).join(',')+')';ctx.beginPath();t.p.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fill();}
    }
    hud.textContent='Cristales '+collected.size+' / '+cfg.objects.filter(o=>o.type==='crystal').length+' · Vidas '+lives+' · '+Math.max(0,Math.ceil(time))+' s';
  }
  function reset(){player={x:0,y:0,z:11,vy:0,angle:0};collected=new Set();lives=cfg.lives;time=cfg.seconds;elapsed=0;invincible=0;ended=false;paused=true;editing=true;last=0;Object.keys(keys).forEach(k=>keys[k]=false);mode.textContent='▶ Jugar';status.textContent='Vista de edición: arrastrá para girar; tocá un objeto para editarlo en Krueka.';}
  function blocked(x,z){return cfg.objects.some(o=>['crate','pillar','tree'].includes(o.type)&&player.y<o.height-.1&&Math.abs(x-o.x)<(o.type==='tree'?o.size*.25:o.size*.5)+.3&&Math.abs(z-o.z)<(o.type==='tree'?o.size*.25:o.size*.5)+.3);}
  function update(dt){
    elapsed+=dt;if(paused||ended)return;time-=dt;invincible=Math.max(0,invincible-dt);if(time<=0){ended=true;status.textContent='Se terminó el tiempo. Ajustá el recorrido o intentá otra vez.';return;}
    let dx=Number(!!(keys.ArrowRight||keys.d))-Number(!!(keys.ArrowLeft||keys.a)),dz=Number(!!(keys.ArrowDown||keys.s))-Number(!!(keys.ArrowUp||keys.w)),length=Math.hypot(dx,dz)||1;dx=dx/length*cfg.speed*dt;dz=dz/length*cfg.speed*dt;
    if(!blocked(player.x+dx,player.z))player.x=clamp(player.x+dx,-10.5,10.5);if(!blocked(player.x,player.z+dz))player.z=clamp(player.z+dz,-12.5,12.5);if(dx||dz)player.angle=Math.atan2(dx,dz);
    if((keys[' ']||keys.jump)&&player.y===0)player.vy=7;player.vy-=18*dt;player.y=Math.max(0,player.y+player.vy*dt);if(player.y===0)player.vy=0;
    for(const o of cfg.objects){const p=objectPosition(o),near=Math.hypot(player.x-p.x,player.z-p.z);
      if(o.type==='crystal'&&near<o.size*.6+.4&&!collected.has(o.id)){collected.add(o.id);status.textContent=collected.size===cfg.objects.filter(x=>x.type==='crystal').length?'¡Abriste el portal! Llegá al arco del fondo.':'Cristal encontrado. Buscá el siguiente.';}
      if(o.type==='drone'&&near<o.size*.6+.35&&player.y<1.3&&invincible===0){lives--;invincible=1.8;if(lives<=0){ended=true;status.textContent='Fin del intento. Podés mover obstáculos y probar una ruta distinta.';}}
    }
    if(collected.size===cfg.objects.filter(o=>o.type==='crystal').length&&Math.abs(player.x)<1.4&&player.z<-11){ended=true;status.textContent='¡Misión cumplida! Construiste, probaste y exploraste tu mundo 3D.';}
  }
  function bindCanvas(){
    canvas.onpointerdown=e=>{drag={x:e.clientX,y:e.clientY,lastX:e.clientX,moved:false};canvas.setPointerCapture(e.pointerId);canvas.focus();};
    canvas.onpointermove=e=>{if(!drag)return;const delta=e.clientX-drag.lastX;drag.moved=drag.moved||Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>7;yaw-=delta*.007;drag.lastX=e.clientX;};
    canvas.onpointerup=e=>{if(drag&&!drag.moved&&editing){const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*canvas.width/r.width,y=(e.clientY-r.top)*canvas.height/r.height;let best=null,distance=45;for(const o of cfg.objects){const p=project([o.x,o.type==='crystal'?1:o.height/2,o.z]);if(p){const d=Math.hypot(p.x-x,p.y-y);if(d<distance){best=o.id;distance=d;}}}if(best){picked=best;parent.postMessage({type:'krueka-scene-select',id:best},'*');}}drag=null;};
    canvas.onpointercancel=()=>drag=null;
  }
  addEventListener('message',e=>{if(e.source!==parent||e.data?.type!=='krueka-scene-highlight')return;picked=cfg.objects.some(o=>o.id===e.data.id)?e.data.id:null;});
  addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key))e.preventDefault();keys[e.key.length===1?e.key.toLowerCase():e.key]=true;});
  addEventListener('keyup',e=>keys[e.key.length===1?e.key.toLowerCase():e.key]=false);addEventListener('blur',()=>Object.keys(keys).forEach(k=>keys[k]=false));
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&!editing&&!ended){paused=true;document.getElementById('pause').textContent='Continuar';}});
  document.querySelectorAll('[data-key]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys[b.dataset.key]=true;};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>keys[b.dataset.key]=false;});
  mode.onclick=()=>{editing=!editing;paused=editing;mode.textContent=editing?'▶ Jugar':'✎ Editar escena';document.getElementById('pause').textContent='Pausar';status.textContent=editing?'Vista de edición: arrastrá para girar; tocá un objeto para seleccionarlo.':'Flechas o WASD para explorar; Espacio para saltar. Juntá los cristales y llegá al portal.';};
  document.getElementById('pause').onclick=()=>{if(editing||ended)return;paused=!paused;document.getElementById('pause').textContent=paused?'Continuar':'Pausar';};document.getElementById('restart').onclick=reset;
  document.getElementById('rotate-left').onclick=()=>yaw+=.25;document.getElementById('rotate-right').onclick=()=>yaw-=.25;
  reset();bindCanvas();function frame(now){const dt=last?Math.min((now-last)/1000,.06):0;last=now;update(dt);if(now-lastDraw>=1000/30){draw();lastDraw=now;}requestAnimationFrame(frame);}requestAnimationFrame(frame);
}
const themes={station:'Estación neón',forest:'Bosque de cristales',island:'Isla flotante'},lights={cryo:'Azul frío',alert:'Alerta roja',sunset:'Atardecer'},types={crystal:'Cristal',crate:'Bloque',pillar:'Columna',tree:'Árbol',drone:'Dron',beacon:'Baliza'};
function create(){
  const objects=[[-7,8],[7,7],[-5,2],[6,1],[-7,-5],[7,-8],[0,-7]].map(([x,z],i)=>({id:'crystal-'+i,type:'crystal',label:'Cristal '+(i+1),x,z,size:1,height:1.5,color:'#67e8f9'}));
  objects.push(...[[-4,6],[4,3],[-3,-2],[5,-5]].map(([x,z],i)=>({id:'block-'+i,type:'crate',label:'Bloque '+(i+1),x,z,size:2,height:1.2,color:'#526889'})),...[[0,4],[-4,-6]].map(([x,z],i)=>({id:'drone-'+i,type:'drone',label:'Dron '+(i+1),x,z,size:1,height:1,color:'#fb7185'})),{id:'beacon-0',type:'beacon',label:'Baliza',x:8,z:-3,size:1,height:2.5,color:'#a5b4fc'});
  const cfg=normalise({title:'Exploradores 3D',objects});
  return {'index.html':'<!doctype html>\n<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Exploradores 3D</title><link rel="stylesheet" href="style.css"></head><body><main><header><div><small>KRUEKA · MI MUNDO 3D</small><h1 id="game-title"></h1></div><button id="mode">▶ Jugar</button></header><div class="toolbar"><span id="hud" role="status"></span><span id="renderer"></span><button id="pause">Pausar</button><button id="restart">Reiniciar</button></div><div class="stage"><canvas id="arena" tabindex="0" aria-label="Mundo 3D: arrastrá para girar la vista"></canvas><div class="camera"><button id="rotate-left" aria-label="Girar cámara a la izquierda">↶</button><button id="rotate-right" aria-label="Girar cámara a la derecha">↷</button></div><div class="badge">CREÁ TU PROPIO RECORRIDO</div></div><div id="controls"><button data-key="ArrowLeft" aria-label="Izquierda">←</button><button data-key="ArrowUp" aria-label="Avanzar">↑</button><button data-key="ArrowDown" aria-label="Retroceder">↓</button><button data-key="ArrowRight" aria-label="Derecha">→</button><button data-key="jump">Saltar</button></div><p id="status" role="status"></p></main><script src="game-config.js"><\/script><script src="game.js"><\/script></body></html>',
    'style.css':'*{box-sizing:border-box}body{margin:0;background:#081329;color:#eef6ff;font-family:system-ui,sans-serif;--accent:#67e8f9}main{max-width:1100px;margin:auto;padding:14px}header{display:flex;justify-content:space-between;align-items:center;gap:12px}h1{font-size:clamp(22px,3vw,32px);margin:5px 0}small{font-size:10px;letter-spacing:.18em;color:var(--accent)}button{border:1px solid #ffffff30;background:#172338;color:#e9f5ff;border-radius:10px;font:inherit;font-size:12px;padding:10px 13px;cursor:pointer;touch-action:none}#mode{background:var(--accent);color:#102238;font-weight:800;white-space:nowrap}.toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:11px;margin:10px 0}#hud{font-weight:750;flex:1;min-width:170px}#renderer{color:#9ab0cd;font-size:10px}.stage{position:relative;border:1px solid #5a7caa66;border-radius:16px;overflow:hidden;box-shadow:0 16px 60px #0004}canvas{display:block;width:100%;height:clamp(300px,56vh,600px);touch-action:none;outline:0}.camera{position:absolute;right:12px;bottom:12px;display:flex;gap:6px}.badge{position:absolute;left:14px;top:14px;pointer-events:none;color:#abc7e1;font-size:9px;letter-spacing:.12em}#controls{display:flex;justify-content:center;gap:6px;margin:12px 0}#controls button{min-width:42px;min-height:42px}#status{font-size:12px;text-align:center;line-height:1.5;color:#a8bdd7;min-height:36px}@media(max-width:480px){main{padding:9px}#renderer{display:none}canvas{height:340px}#controls button{padding:9px 11px}.toolbar button{padding:8px}}',
    'game-config.js':StudioKits.configFile(cfg),'game.js':'/* Motor 3D propio: geometría, cámara, iluminación, colisiones y modo compatible. */\nconst normalise = '+normalise.toString()+';\n('+runtime.toString()+')();',
    'LEEME.md':'# Exploradores 3D\n\nTema: Escenarios 3D y reglas de un videojuego.\nCapacidad: Construir y probar un recorrido, modificando objetos y ambientación.\nIndicadores: ubico objetos; comparo dos luces; pruebo colisiones y controles; explico una mejora.\n\n1. Elegí Bases y reglas: cambiá luces, escenario y personaje.\n2. Seleccioná un objeto en la escena o en la lista; cambiá X y Z, tamaño y altura.\n3. Probá con Jugar: juntá cristales y llegá al arco del fondo.\n4. Si es difícil, mové un obstáculo o aumentá el tiempo.\n5. Escribí acá qué cambiaste y qué mejoró. Enviá al profe.\n\nLos controles visuales no consultan IA. El Chat puede guardar ideas pendientes de conexión.\n'};
}
function renderEditor(studio,el,raw){
  const cfg=normalise(raw),selected=cfg.objects.find(o=>o.id===studio.selectedSceneObject)||cfg.objects[0];studio.selectedSceneObject=selected?.id||null;
  const options=(entries,value)=>Object.entries(entries).map(([id,label])=>'<option value="'+id+'" '+(id===value?'selected':'')+'>'+esc(label)+'</option>').join('');
  el.innerHTML='<div class="ks-section-label">CONSTRUÍ · ILUMINÁ · JUGÁ</div><h2>Tu mundo 3D</h2><p>Mové objetos, elegí las luces y probá tu recorrido. Estos controles funcionan sin IA.</p><div class="ks-light-grid">'+Object.entries(lights).map(([id,label])=>'<button class="ks-btn ks-light '+id+'" data-light="'+id+'" aria-pressed="'+(id===cfg.lighting)+'"><span></span>'+label+'</button>').join('')+'</div><section class="ks-settings"><h3>Ambientación y reglas</h3><label>Nombre en el juego<input data-scene="title" maxlength="60" value="'+esc(cfg.title)+'"></label><div class="ks-fields"><label>Mundo<select data-scene="theme">'+options(themes,cfg.theme)+'</select></label><label>Color del explorador<input data-scene="avatarColor" type="color" value="'+cfg.avatarColor+'"></label><label>Velocidad<input data-scene="speed" type="number" min="2" max="9" step=".5" value="'+cfg.speed+'"></label><label>Vidas<input data-scene="lives" type="number" min="1" max="9" value="'+cfg.lives+'"></label><label>Tiempo (segundos)<input data-scene="seconds" type="number" min="30" max="300" value="'+cfg.seconds+'"></label><label>Cámara<select data-scene="camera">'+options({follow:'Seguir al personaje',orbit:'Vista general'},cfg.camera)+'</select></label><label>Calidad<select data-scene="quality">'+options({low:'Liviana',high:'Más nitidez'},cfg.quality)+'</select></label></div><button id="ks-scene-apply" class="ks-btn primary">Aplicar y probar</button></section><section class="ks-settings" id="ks-scene-objects"><h3>Objetos del mundo · '+cfg.objects.length+' / 32</h3><p>Tocá un objeto en la vista de edición o elegilo aquí. X mueve a los lados; Z, adelante y atrás.</p><div class="ks-scene-list">'+cfg.objects.map(o=>'<button class="ks-btn" data-object="'+o.id+'" aria-pressed="'+(o.id===selected?.id)+'">'+esc(o.label)+'<small>'+esc(types[o.type])+'</small></button>').join('')+'</div>'+ (selected?'<label>Nombre del objeto<input data-object-field="label" maxlength="32" value="'+esc(selected.label)+'"></label><div class="ks-fields"><label>Tipo<select data-object-field="type">'+options(types,selected.type)+'</select></label>'+[['x','Posición X',-10,10],['z','Posición Z',-12,12],['size','Tamaño',.4,4],['height','Altura',.5,5]].map(([id,label,min,max])=>'<label>'+label+'<input data-object-field="'+id+'" type="number" min="'+min+'" max="'+max+'" step=".5" value="'+selected[id]+'"></label>').join('')+'<label>Color<input data-object-field="color" type="color" value="'+selected.color+'"></label></div><div class="ks-scene-actions"><button id="ks-object-apply" class="ks-btn primary">Guardar objeto</button><button id="ks-object-copy" class="ks-btn">Duplicar</button><button id="ks-object-remove" class="ks-btn">Quitar</button></div>':'<p>Agregá objetos para construir tu recorrido.</p>')+'<div class="ks-scene-add"><select id="ks-object-type" aria-label="Tipo de objeto nuevo">'+options(types,'crystal')+'</select><button id="ks-object-add" class="ks-btn">＋ Agregar objeto</button></div></section><button id="ks-scene-bases" class="ks-btn">Cambiar base de juego</button><p class="ks-tip">Tus cambios se guardan en game-config.js y se pueden deshacer. Aplicar reinicia la vista del juego.</p>';
  const apply=next=>{if(studio.busy||!studio.cloudReady)return;studio.checkpoint();studio.files['game-config.js']=StudioKits.configFile(normalise(next));studio.changed();studio.refreshAll();studio.lock(false);};
  el.querySelectorAll('[data-light]').forEach(b=>b.onclick=()=>apply({...cfg,lighting:b.dataset.light}));
  el.querySelector('#ks-scene-apply').onclick=()=>{const next={...cfg};el.querySelectorAll('[data-scene]').forEach(x=>next[x.dataset.scene]=x.type==='number'?Number(x.value):x.value);apply(next);};
  el.querySelectorAll('[data-object]').forEach(b=>b.onclick=()=>{studio.selectedSceneObject=b.dataset.object;renderEditor(studio,el,cfg);document.getElementById('ks-frame')?.contentWindow?.postMessage({type:'krueka-scene-highlight',id:b.dataset.object},'*');});
  if(selected){
    el.querySelector('#ks-object-apply').onclick=()=>{const changed={...selected};el.querySelectorAll('[data-object-field]').forEach(x=>changed[x.dataset.objectField]=x.type==='number'?Number(x.value):x.value);apply({...cfg,objects:cfg.objects.map(o=>o.id===selected.id?changed:o)});};
    el.querySelector('#ks-object-remove').onclick=()=>apply({...cfg,objects:cfg.objects.filter(o=>o.id!==selected.id)});
    el.querySelector('#ks-object-copy').onclick=()=>add({...selected,x:Math.min(10,selected.x+1.5),label:selected.label+' copia'});
  }
  function add(source){if(cfg.objects.length>=32)return;const object={id:'o-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6),type:'crystal',label:'Objeto nuevo',x:0,z:0,size:1,height:1.5,color:'#67e8f9',...source};object.id='o-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6);studio.selectedSceneObject=object.id;apply({...cfg,objects:[...cfg.objects,object]});}
  el.querySelector('#ks-object-add').onclick=()=>add({type:el.querySelector('#ks-object-type').value,label:types[el.querySelector('#ks-object-type').value]+' nuevo'});
  for(const id of ['ks-object-add','ks-object-copy']){const b=el.querySelector('#'+id);if(b){b.dataset.limitReached=String(cfg.objects.length>=32);b.disabled=studio.busy||!studio.cloudReady||cfg.objects.length>=32;}}
  el.querySelector('#ks-scene-bases').onclick=()=>studio.showKits();
}
window.Studio3D={normalise,create,renderEditor};
StudioKits.catalog.unshift({id:'explore3d',icon:'🧊',title:'Exploradores 3D',tag:'Mundos, luces y objetos',description:'Construí una escena 3D, explorá y abrí el portal.',challenge:'Compará dos luces, mové un obstáculo y explicá cómo cambia el recorrido.'});
const originalCreate=StudioKits.create.bind(StudioKits),originalArt=StudioKits.art.bind(StudioKits);
StudioKits.create=id=>id==='explore3d'?create():originalCreate(id);
StudioKits.art=id=>id==='explore3d'?'<svg viewBox="0 0 190 65" role="img" aria-label="Mundo 3D" xmlns="http://www.w3.org/2000/svg"><path d="M15 46L95 9l80 37-80 18z" fill="#243f5f"/><path d="M50 28l15-9 15 9v21l-15 9-15-9z" fill="#a5b4fc"/><path d="M65 19v39m-15-30l15 9 15-9" stroke="#e0e7ff" fill="none"/><path d="M119 17l9-14 9 14-9 17z" fill="#67e8f9"/><path d="M115 45h31" stroke="#67e8f9" stroke-width="3"/><path d="M32 46l61 15 62-15" stroke="#4bbde2" fill="none"/></svg>':originalArt(id);
})();
