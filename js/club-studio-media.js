/* Talleres de animación y montaje. Datos acotados; motores autónomos sin servicios externos. */
(function(){
'use strict';
if(window.StudioMedia||!window.StudioKits)return;
const icons=['🤖','🦊','🚀','🐸','⭐','🧊','🌳','⚽'];
const number=(v,min,max,fallback)=>Number.isFinite(Number(v))?Math.max(min,Math.min(max,Number(v))):fallback;
const text=(v,n)=>String(v==null?'':v).slice(0,n);
const color=(v,fallback)=>/^#[0-9a-f]{6}$/i.test(String(v))?v:fallback;
const choose=(v,values,fallback)=>values.includes(v)?v:fallback;
const id=(v,fallback)=>/^[a-zA-Z0-9_-]{1,40}$/.test(String(v))?String(v):fallback;
function clean(raw){
 const r=raw&&typeof raw==='object'?raw:{},animation=r.kind!=='video-edit';
 const cfg={kind:animation?'animation':'video-edit',title:text(r.title|| (animation?'Mi historia animada':'Mi primer video'),60),aspect:choose(r.aspect,['wide','vertical','square'],'wide'),background:color(r.background,'#142745')};
 if(animation){
  cfg.duration=number(r.duration,2,30,8);
  const seen=new Set();cfg.actors=(Array.isArray(r.actors)?r.actors:[]).slice(0,8).map((a,i)=>{
   a=a&&typeof a==='object'?a:{};let key=id(a.id,'actor-'+i);let serial=i;while(seen.has(key))key='actor-'+(++serial);seen.add(key);
   const frames=(Array.isArray(a.frames)?a.frames:[]).slice(0,12).map(f=>({t:number(f?.t,0,cfg.duration,0),x:number(f?.x,0,100,50),y:number(f?.y,0,100,60),scale:number(f?.scale,.3,3,1),angle:number(f?.angle,-360,360,0)})).sort((a,b)=>a.t-b.t).filter((f,i,all)=>!i||f.t!==all[i-1].t);
   if(!frames.length)frames.push({t:0,x:30,y:65,scale:1,angle:0});
   return {id:key,name:text(a.name||'Personaje '+(i+1),30),icon:choose(a.icon,icons,'🤖'),easing:choose(a.easing,['linear','smooth','hold'],'smooth'),frames};
  });
  cfg.caption=text(r.caption,100);
 }else{
  let remaining=90;const seen=new Set();
  cfg.clips=(Array.isArray(r.clips)?r.clips:[]).slice(0,12).map((c,i)=>{
   c=c&&typeof c==='object'?c:{};let key=id(c.id,'clip-'+i);let serial=i;while(seen.has(key))key='clip-'+(++serial);seen.add(key);
   const image=typeof c.image==='string'&&c.image.length<=18000&&/^data:image\/(?:jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(c.image)?c.image:'';
   const source=c.source&&typeof c.source==='object'?{name:text(c.source.name,100),size:number(c.source.size,0,26214400,0),modified:number(c.source.modified,0,9999999999999,0),duration:number(c.source.duration,.5,3600,10)}:null;
   const kind=c.type==='video'&&source?'video':c.type==='image'&&image?'image':'card';
   const trim=number(c.trim,0,kind==='video'?Math.max(0,source.duration-.5):3600,0),duration=Math.min(remaining,number(c.duration,.5,15,4),kind==='video'?source.duration-trim:15);remaining-=duration;
   return {id:key,type:kind,title:text(c.title||'Mi escena',80),subtitle:text(c.subtitle,120),duration:Math.max(0,duration),trim,color:color(c.color,'#1d4568'),transition:choose(c.transition,['cut','fade'],'fade'),volume:number(c.volume,0,1,1),image:kind==='image'?image:'',source:kind==='video'?source:null};
  }).filter(c=>c.duration>0);
 }
 return cfg;
}
function initial(kind){return clean(kind==='animation'?{kind,title:'La aventura del robot',duration:8,caption:'Una idea se pone en movimiento',actors:[{id:'hero',name:'Mi robot',icon:'🤖',frames:[{t:0,x:15,y:65,scale:1,angle:0},{t:4,x:50,y:35,scale:1.3,angle:-15},{t:8,x:85,y:65,scale:1,angle:0}]},{id:'star',name:'Estrella',icon:'⭐',frames:[{t:0,x:80,y:25,scale:.6,angle:0},{t:8,x:20,y:25,scale:1.2,angle:180}]}]}:{kind:'video-edit',title:'Mi primer montaje',clips:[{id:'intro',title:'MI MUNDO CREATIVO',subtitle:'Una historia hecha en Krueka',duration:3,color:'#183b66'},{id:'story',title:'Una idea. Muchas posibilidades.',subtitle:'Acá empieza mi creación',duration:4,color:'#215e59'},{id:'end',title:'CREADO POR MÍ',subtitle:'Imaginar · editar · compartir',duration:3,color:'#493262'}]});}
function pose(actor,time){
 const frames=actor.frames;let a=frames[0],b=a;
 for(let i=0;i<frames.length;i++){if(frames[i].t<=time)a=frames[i];if(frames[i].t>=time){b=frames[i];break;}b=a;}
 let p=b.t===a.t?0:Math.max(0,Math.min(1,(time-a.t)/(b.t-a.t)));
 if(actor.easing==='smooth')p=p*p*(3-2*p);if(actor.easing==='hold')p=0;
 const out={};for(const key of ['x','y','scale','angle'])out[key]=a[key]+(b[key]-a[key])*p;return out;
}
function duration(cfg){return cfg.kind==='animation'?cfg.duration:cfg.clips.reduce((sum,c)=>sum+c.duration,0);}
function locate(cfg,time){let start=0;for(let i=0;i<cfg.clips.length;i++){const c=cfg.clips[i];if(time<start+c.duration||i===cfg.clips.length-1)return {clip:c,index:i,start,local:Math.max(0,Math.min(c.duration,time-start))};start+=c.duration;}return null;}
// Esta función se copia al proyecto: no lee sesiones, cuentas ni el origen de Krueka.
function runtime(){
 'use strict';
 const cfg=window.KRUEKA_GAME,canvas=document.getElementById('media-canvas'),ctx=canvas.getContext('2d'),scrub=document.getElementById('media-time'),state=document.getElementById('media-state'),play=document.getElementById('media-play');
 const total=cfg.kind==='animation'?cfg.duration:cfg.clips.reduce((n,c)=>n+c.duration,0),assets=new Map(),urls=[],W=cfg.aspect==='vertical'?360:cfg.aspect==='square'?540:960,H=cfg.aspect==='vertical'?640:540;
 canvas.width=W;canvas.height=H;scrub.max=total;document.getElementById('media-title').textContent=cfg.title;document.title=cfg.title;
 let time=0,playing=false,last=0,exporting=false,recorder=null,stream=null,audio=null,destination=null,sound=false,recordToken='',frameCount=0;
 const say=message=>{state.textContent=message;};
 const position=(actor,t)=>{
  let a=actor.frames[0],b=a;for(const f of actor.frames){if(f.t<=t)a=f;if(f.t>=t){b=f;break;}b=a;}
  let q=b.t===a.t?0:Math.max(0,Math.min(1,(t-a.t)/(b.t-a.t)));if(actor.easing==='smooth')q=q*q*(3-2*q);if(actor.easing==='hold')q=0;
  return ['x','y','scale','angle'].map(k=>a[k]+(b[k]-a[k])*q);
 };
 const clipAt=t=>{let start=0;for(let i=0;i<(cfg.clips||[]).length;i++){const c=cfg.clips[i];if(t<start+c.duration||i===cfg.clips.length-1)return {c,i,start,local:Math.max(0,Math.min(c.duration,t-start))};start+=c.duration;}return null;};
 function figure(icon,size){
  ctx.scale(size/100,size/100);ctx.lineWidth=4;ctx.lineJoin='round';ctx.strokeStyle='#12213d';
  const rect=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);ctx.strokeRect(x,y,w,h);};
  const circle=(x,y,r,c)=>{ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.stroke();};
  const polygon=(points,c)=>{ctx.fillStyle=c;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fill();ctx.stroke();};
  ctx.fillStyle='#050d222f';ctx.beginPath();ctx.ellipse(0,49,33,7,0,0,Math.PI*2);ctx.fill();
  if(icon==='🤖'){
   rect(-26,4,52,33,'#44a9ba');rect(-35,-38,70,43,'#9ae0e4');rect(-24,-28,48,22,'#173451');rect(-18,-23,10,9,'#98f2ce');rect(8,-23,10,9,'#98f2ce');rect(-18,37,13,10,'#c2def0');rect(5,37,13,10,'#c2def0');rect(-38,10,11,24,'#80cdd2');rect(27,10,11,24,'#80cdd2');ctx.beginPath();ctx.moveTo(0,-38);ctx.lineTo(0,-49);ctx.stroke();circle(0,-51,5,'#fbce64');circle(0,18,6,'#f8cc64');
  }else if(icon==='⭐'){
   polygon(Array.from({length:10},(_,i)=>{const a=-Math.PI/2+i*Math.PI/5,r=i%2?21:45;return [Math.cos(a)*r,Math.sin(a)*r];}),'#ffd66d');circle(-10,-2,3,'#203353');circle(10,-2,3,'#203353');
  }else if(icon==='🦊'){
   polygon([[-34,-24],[-36,-48],[-10,-31],[12,-31],[36,-48],[34,-5],[20,28],[0,41],[-25,20]],'#f59a4f');polygon([[-30,-7],[0,13],[30,-7],[15,28],[0,38],[-15,28]],'#ffdfb1');circle(-14,-11,4,'#203353');circle(14,-11,4,'#203353');circle(0,14,5,'#203353');
  }else if(icon==='🚀'){
   polygon([[-13,26],[-2,53],[12,26]],'#ffbd59');polygon([[-20,0],[-35,29],[-14,22]],'#6dd4db');polygon([[20,0],[35,29],[14,22]],'#6dd4db');polygon([[-18,24],[-20,-13],[0,-48],[20,-13],[18,24]],'#e8f1fb');circle(0,-9,11,'#57b8df');
  }else if(icon==='🐸'){
   circle(0,12,35,'#8ccf73');circle(-22,-18,17,'#b6e58c');circle(22,-18,17,'#b6e58c');circle(-22,-20,6,'#183656');circle(22,-20,6,'#183656');ctx.beginPath();ctx.arc(0,8,17,.1,Math.PI-.1);ctx.stroke();
  }else if(icon==='🧊'){
   polygon([[0,-45],[37,-25],[0,-4],[-37,-25]],'#bbf0f1');polygon([[-37,-25],[0,-4],[0,43],[-37,22]],'#6cbfcf');polygon([[0,-4],[37,-25],[37,22],[0,43]],'#3993b4');
  }else if(icon==='🌳'){
   rect(-10,8,20,40,'#ba8457');polygon([[-40,22],[0,-26],[40,22]],'#53ae8a');polygon([[-32,-3],[0,-45],[32,-3]],'#8bd5a4');
  }else{
   circle(0,0,40,'#e6eef8');polygon([[-10,-16],[13,-16],[22,6],[0,21],[-22,6]],'#29425f');ctx.beginPath();ctx.moveTo(-32,-22);ctx.lineTo(-10,-16);ctx.moveTo(32,-22);ctx.lineTo(13,-16);ctx.moveTo(0,40);ctx.lineTo(0,21);ctx.stroke();
  }
 }
 function lines(value,y,size,max){ctx.font='800 '+size+'px system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';const words=String(value).split(/\s+/),rows=[];let row='';for(const word of words){const next=row?row+' '+word:word;if(ctx.measureText(next).width>max&&row){rows.push(row);row=word;}else row=next;}if(row)rows.push(row);rows.slice(0,4).forEach((line,i)=>ctx.fillText(line,W/2,y+i*size*1.22,max));}
 function draw(){
  ctx.globalAlpha=1;ctx.fillStyle=cfg.background;ctx.fillRect(0,0,W,H);
  const grad=ctx.createLinearGradient(0,0,W,H);grad.addColorStop(0,'#ffffff0d');grad.addColorStop(1,'#00000055');ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
  if(cfg.kind==='animation'){
   ctx.strokeStyle='#ffffff0b';for(let x=0;x<W;x+=W/12){ctx.beginPath();ctx.moveTo(x,H*.75);ctx.lineTo(x,H);ctx.stroke();}ctx.fillStyle='#00000020';ctx.fillRect(0,H*.78,W,H*.22);
   for(const actor of cfg.actors){const p=position(actor,time);ctx.save();ctx.translate(W*p[0]/100,H*p[1]/100);ctx.rotate(p[3]*Math.PI/180);figure(actor.icon,Math.min(W,H)*.16*p[2]);ctx.restore();}
   ctx.fillStyle='#f5f8ff';lines(cfg.caption,H*.12,Math.min(W,H)*.042,W*.88);
  }else{
   const entry=clipAt(time);if(entry){const c=entry.c,asset=assets.get(c.id);ctx.fillStyle=c.color;ctx.fillRect(0,0,W,H);
    if(asset&&asset.el&&(asset.el.tagName==='IMG'?asset.el.complete:asset.el.readyState>=2)){
     const element=asset.el,iw=element.videoWidth||element.naturalWidth,ih=element.videoHeight||element.naturalHeight;
     if(iw&&ih){const scale=Math.min(W/iw,H/ih);ctx.drawImage(element,(W-iw*scale)/2,(H-ih*scale)/2,iw*scale,ih*scale);}
    }else if(c.type==='video'){ctx.fillStyle='#d8e7fc';lines('Volvé a elegir el video original',H*.35,Math.min(W,H)*.042,W*.85);}
    if(c.type!=='card'){ctx.fillStyle='#00000065';ctx.fillRect(0,H*.68,W,H*.32);}
    ctx.fillStyle='#ffffff';lines(c.title,H*(c.type==='card'?.36:.77),Math.min(W,H)*.066,W*.88);ctx.fillStyle='#dbeafe';lines(c.subtitle,H*(c.type==='card'?.61:.90),Math.min(W,H)*.035,W*.88);
    if(c.transition==='fade'&&(playing||exporting||time>0)){const alpha=Math.max(0,Math.min(1,entry.local/.3,(c.duration-entry.local)/.3));ctx.fillStyle='#070d18';ctx.globalAlpha=1-alpha;ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;}
   }
  }
  document.getElementById('media-clock').textContent=time.toFixed(1)+' / '+total.toFixed(1)+' s';scrub.value=time;
 }
 function activeVideo(force){
  const entry=cfg.kind==='video-edit'?clipAt(time):null;
  for(const [key,a] of assets){if(a.el.tagName!=='VIDEO')continue;const active=entry&&key===entry.c.id;
   if(a.gain)a.gain.gain.value=active?sound?entry.c.volume:0:0;
   a.el.muted=!audio;
   if(active){const target=entry.c.trim+entry.local;if(force||Math.abs(a.el.currentTime-target)>.35){try{a.el.currentTime=target;}catch(_e){}}
    if(playing&&a.el.paused)a.el.play().catch(()=>{if(exporting)failExport('El navegador no pudo reproducir un clip. Probá ese archivo en la vista previa.');else say('Tocá Reproducir dentro de la vista previa para habilitar el video.');});
    if(!playing)a.el.pause();
   }else a.el.pause();
  }
 }
 function stop(){playing=false;play.textContent='▶ Reproducir';activeVideo(false);}
 function setTime(value){time=Math.max(0,Math.min(total,Number(value)||0));last=performance.now();activeVideo(true);draw();}
 function start(){if(time>=total-.02)setTime(0);playing=true;last=performance.now();play.textContent='Ⅱ Pausar';activeVideo(true);}
 function tick(now){const dt=Math.max(0,Math.min(.15,(now-last)/1000));last=now;if(playing){time=Math.min(total,time+dt);activeVideo(false);}draw();frameCount++;if(playing&&time>=total){stop();if(exporting&&recorder?.state==='recording')recorder.stop();}requestAnimationFrame(tick);}
 play.onclick=()=>{if(exporting)return;playing?stop():start();};scrub.oninput=()=>{if(!exporting){stop();setTime(scrub.value);}};
 document.getElementById('media-restart').onclick=()=>{if(!exporting){stop();setTime(0);}};
 function wireAudio(a){if(!audio||a.el.tagName!=='VIDEO'||a.gain)return;try{a.source=audio.createMediaElementSource(a.el);a.gain=audio.createGain();a.gain.gain.value=0;a.source.connect(a.gain);a.gain.connect(audio.destination);a.gain.connect(destination);a.el.muted=false;}catch(_e){say('El sonido no está disponible en este navegador. Podés editar y exportar sin audio.');}}
 document.getElementById('media-sound').hidden=cfg.kind==='animation';
 document.getElementById('media-sound').onclick=async()=>{
  if(exporting)return;try{if(!audio){const Context=window.AudioContext||window.webkitAudioContext;if(!Context)throw Error();audio=new Context();destination=audio.createMediaStreamDestination();for(const a of assets.values())wireAudio(a);}await audio.resume();sound=!sound;document.getElementById('media-sound').textContent=sound?'♫ Sonido activado':'♪ Activar sonido';activeVideo(true);}catch(_e){say('Este navegador no habilitó el sonido. El montaje sigue disponible sin audio.');}
 };
 function loadAsset(c,blob){return new Promise(resolve=>{
  const url=URL.createObjectURL(blob);urls.push(url);const el=document.createElement('video');el.preload='auto';el.playsInline=true;el.muted=true;
  const timer=setTimeout(()=>{say('Un video tardó en cargar. Volvé a seleccionarlo.');resolve();},12000);
  const a={el};assets.set(c.id,a);el.onloadeddata=()=>{clearTimeout(timer);el.currentTime=c.trim||0;wireAudio(a);draw();resolve();};el.onerror=()=>{clearTimeout(timer);say('El navegador no puede leer '+c.source.name+'. Elegí otro formato de video.');resolve();};el.src=url;el.load();
 });}
 for(const c of cfg.clips||[]){if(c.type==='image'){const el=new Image();el.onload=draw;el.src=c.image;assets.set(c.id,{el});}}
 function cleanupRecord(){if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;exporting=false;play.disabled=scrub.disabled=false;document.getElementById('media-restart').disabled=false;document.getElementById('media-sound').disabled=false;}
 function failExport(message){if(recorder?.state==='recording'){recorder.onstop=null;recorder.stop();}stop();cleanupRecord();parent.postMessage({type:'krueka-media-export-error',token:recordToken,error:message},'*');say(message);}
 function record(token){
  if(exporting)return;recordToken=token;
  if(!window.MediaRecorder||!canvas.captureStream){parent.postMessage({type:'krueka-media-export-error',token,error:'Este navegador no puede exportar video. Conservá el proyecto editable o probá otro navegador.'},'*');return;}
  const missing=(cfg.clips||[]).some(c=>c.type==='video'&&(!assets.get(c.id)||assets.get(c.id).el.readyState<2));
  if(missing){parent.postMessage({type:'krueka-media-export-error',token,error:'Antes de exportar, volvé a elegir los videos originales que faltan y esperá que carguen.'},'*');return;}
  const mime=['video/webm;codecs=vp8,opus','video/webm;codecs=vp8','video/webm','video/mp4'].find(m=>MediaRecorder.isTypeSupported(m));
  if(!mime){parent.postMessage({type:'krueka-media-export-error',token,error:'El navegador no ofrece un formato de video compatible. Conservá tu proyecto editable.'},'*');return;}
  try{
   stop();setTime(0);stream=canvas.captureStream(24);if(sound&&destination&&audio.state==='running')destination.stream.getAudioTracks().forEach(track=>stream.addTrack(track.clone()));
   const chunks=[];let bytes=0;recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:1400000});
   recorder.ondataavailable=e=>{if(e.data.size){bytes+=e.data.size;if(bytes>30000000){failExport('El video superó 30 MB. Acortá el montaje antes de exportar.');return;}chunks.push(e.data);}};
   recorder.onerror=()=>failExport('La exportación se interrumpió. Tu proyecto se conserva; probá una secuencia más corta.');
   recorder.onstop=()=>{const blob=new Blob(chunks,{type:recorder.mimeType});cleanupRecord();say('Video listo para descargar.');parent.postMessage({type:'krueka-media-export',token:recordToken,blob,mime:blob.type},'*');};
   exporting=true;play.disabled=scrub.disabled=true;document.getElementById('media-restart').disabled=true;document.getElementById('media-sound').disabled=true;recorder.start(250);start();say('Exportando… mantené esta pestaña visible hasta terminar.');
  }catch(_e){failExport('Este navegador no pudo iniciar la exportación. Conservá el proyecto editable.');}
 }
 addEventListener('message',async e=>{
  if(e.source!==parent||!e.data)return;const d=e.data;
  if(d.type==='krueka-media-assets'&&Array.isArray(d.assets)){
   for(const a of d.assets.slice(0,12)){const c=(cfg.clips||[]).find(c=>c.id===a.id&&c.type==='video');if(c&&a.blob instanceof Blob&&a.blob.size<=26214400)await loadAsset(c,a.blob);}activeVideo(true);draw();
  }
  if(d.type==='krueka-media-seek'&&!exporting){stop();setTime(d.time);}
  if(d.type==='krueka-media-export-cancel'&&exporting)failExport('Exportación cancelada. Tu proyecto se conserva.');
  if(d.type==='krueka-media-export-request'&&typeof d.token==='string'&&d.token.length<100)record(d.token);
 });
 addEventListener('pagehide',()=>{stop();if(recorder?.state==='recording'){recorder.onstop=null;recorder.stop();}cleanupRecord();urls.forEach(url=>URL.revokeObjectURL(url));if(audio)audio.close().catch(()=>{});});
 parent.postMessage({type:'krueka-media-ready'},'*');say('Listo. Reproducí, pausá o explorá la línea de tiempo.');draw();last=performance.now();requestAnimationFrame(tick);
}
function create(kind){
 const cfg=initial(kind),animation=kind==='animation';
 return {'index.html':'<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mi creación</title><link rel="stylesheet" href="style.css"></head><body><main><header><small>KRUEKA · '+(animation?'ANIMACIÓN':'MONTAJE DE VIDEO')+'</small><h1 id="media-title"></h1></header><canvas id="media-canvas" aria-label="Vista previa de la creación"></canvas><nav><button id="media-play">▶ Reproducir</button><button id="media-restart">↺ Inicio</button><button id="media-sound">♪ Activar sonido</button><output id="media-clock"></output></nav><label for="media-time">Explorá tu línea de tiempo</label><input id="media-time" type="range" min="0" step=".05" value="0"><p id="media-state" role="status"></p></main><script src="game-config.js"><\/script><script src="media.js"><\/script></body></html>',
 'style.css':'*{box-sizing:border-box}body{margin:0;background:#090f1c;color:#eaf2ff;font:14px/1.5 system-ui,sans-serif}main{max-width:1100px;margin:auto;padding:20px}header{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}small{color:#9db9db;font-size:10px;letter-spacing:.14em}h1{font-size:19px}canvas{display:block;max-height:67vh;max-width:100%;width:auto;height:auto;margin:12px auto;border:1px solid #ffffff20;border-radius:16px;box-shadow:0 20px 60px #0006}nav{display:flex;gap:8px;flex-wrap:wrap;align-items:center}button{border:1px solid #ffffff25;border-radius:9px;color:#f1f6ff;background:#1c3452;padding:10px 14px;min-height:40px;font:inherit;cursor:pointer}button:disabled{opacity:.6}output{margin-left:auto;font-variant-numeric:tabular-nums}label{display:block;margin-top:15px;color:#a6bdd8}input{width:100%;accent-color:#69c9e8;min-height:30px}p{color:#a6bdd8;font-size:12px}[hidden]{display:none!important}@media(max-width:500px){main{padding:12px}canvas{max-height:50vh}header{gap:0}h1{margin:5px 0}}',
 'game-config.js':StudioKits.configFile(cfg),'media.js':'('+runtime.toString()+')();',
 'LEEME.md':'# '+cfg.title+'\n\nTema: '+(animation?'Animación con poses y tiempos.':'Montaje audiovisual con secuencias, recortes y títulos.')+'\nCapacidad: planificar, editar, reproducir y mejorar una creación propia.\nIndicadores: organiza una secuencia; modifica tiempos; prueba el resultado; explica una mejora.\n\n1. Abrí Mi creación y personalizá el proyecto.\n2. Probá la línea de tiempo en la vista previa.\n3. Explicá una decisión en Mi bitácora.\n4. Guardá y enviá al profe.\n\n'+(animation?'Los personajes y las poses quedan dentro del proyecto.':'Las fotos reducidas y el montaje se guardan en Krueka. Los videos originales se seleccionan desde tu equipo y no se suben: al cambiar de PC, volvé a elegir los mismos originales. Conservá tus archivos junto al proyecto descargado. El video final se descarga al equipo.')+'\n'};
}
const oldCreate=StudioKits.create,oldArt=StudioKits.art;
StudioKits.catalog.push({id:'animation',title:'Mi historia animada',tag:'Personajes · poses · tiempo',description:'Animá una historia con personajes, movimientos y fotogramas clave.',challenge:'Probá movimiento suave y por saltos. Explicá qué cambia.'},{id:'video-edit',title:'Mi primer video',tag:'Recortes · títulos · montaje',description:'Ordená clips, agregá fotos y títulos y descargá tu montaje.',challenge:'Armá una historia con inicio, desarrollo y cierre en menos de un minuto.'});
StudioKits.create=function(kind){return ['animation','video-edit'].includes(kind)?create(kind):oldCreate.apply(this,arguments);};
StudioKits.art=function(kind){if(!['animation','video-edit'].includes(kind))return oldArt.apply(this,arguments);return '<svg viewBox="0 0 190 65" aria-hidden="true"><rect x="22" y="8" width="146" height="48" rx="10" fill="'+(kind==='animation'?'#295b70':'#543a70')+'"/><path d="M83 19l28 14-28 14z" fill="#eef6ff"/><circle cx="42" cy="33" r="8" fill="#73d7d4"/><path d="M133 19v28m13-28v28" stroke="#d0baff" stroke-width="4"/></svg>';};
window.StudioMedia={icons,clean,initial,pose,duration,locate,create,runtime};
})();
