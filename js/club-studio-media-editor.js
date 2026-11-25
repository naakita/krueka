/* Editores visuales del Studio. Los archivos de video se mantienen únicamente en memoria. */
(function(){
'use strict';
if(window.StudioMediaEditor||!window.StudioMedia)return;
const M=StudioMedia;
let owner='',project='',files=new Map(),selected='',frameIndex=0,playhead=0,exportJob=null,onion=false,copiedPose=null,playing=false;
const uid=prefix=>prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
const option=(map,value)=>Object.entries(map).map(([key,label])=>'<option value="'+esc(key)+'" '+(String(value)===key?'selected':'')+'>'+esc(label)+'</option>').join('');
const field=(name,label,value,min,max,step)=>'<label>'+label+'<input data-media-field="'+name+'" type="number" min="'+min+'" max="'+max+'" step="'+(step||1)+'" value="'+esc(value)+'"></label>';
function supports(kind){return ['animation','video-edit'].includes(kind);}
function reset(studio){if(owner!==studio.sid()||project!==studio.projectId){files.clear();selected='';frameIndex=0;playhead=0;onion=false;copiedPose=null;playing=false;owner=studio.sid();project=studio.projectId;}}
function notice(studio,message){const el=document.getElementById('ks-media-notice');if(el)el.textContent=message;else studio.say('sys',message);}
function current(studio){return M.clean(StudioKits.read(studio.files));}
function commit(studio,cfg){
 if(studio.busy||!studio.cloudReady)return false;
 try{const normal=M.clean(cfg),next=studio.validFiles({...M.upgradeEngine(studio.files),'game-config.js':StudioKits.configFile(normal)});studio.checkpoint();studio.files=next;studio.title=normal.title;playing=false;playhead=Math.max(0,Math.min(M.duration(normal),playhead));studio.changed();studio.refreshAll();return true;}
 catch(e){notice(studio,e.message);return false;}
}
function send(studio,type,data){document.getElementById('ks-frame')?.contentWindow?.postMessage({type,...data},'*');}
function redraw(studio,el,cfg){if(el===document.getElementById('ks-create')&&typeof studio.renderCreator==='function')studio.renderCreator();else render(studio,el,cfg);}
function editView(studio){send(studio,'krueka-media-editor',{enabled:studio.tab==='create',onion,selected});}
function timeLabel(value){return (Math.round(value*100)/100).toFixed(2)+' s';}
function transport(cfg){const total=M.duration(cfg);return '<section class="ks-settings km-transport" aria-label="Controles de reproducción"><div class="km-transport-top"><h3>Cursor de tiempo</h3><output id="km-editor-clock">'+timeLabel(playhead)+' / '+timeLabel(total)+'</output></div><div class="km-actions"><button type="button" class="ks-btn" id="km-editor-start" title="Volver al inicio">Inicio</button><button type="button" class="ks-btn" id="km-editor-back" title="Retroceder un fotograma">−1 fotograma</button><button type="button" class="ks-btn primary" id="km-editor-play">'+(playing?'Pausar':'Reproducir')+'</button><button type="button" class="ks-btn" id="km-editor-next" title="Avanzar un fotograma">+1 fotograma</button></div><label for="km-editor-scrub">Recorré la secuencia</label><input id="km-editor-scrub" type="range" min="0" max="'+total+'" step=".01" value="'+playhead+'"><label class="km-exact-time">Ir al segundo<input id="km-editor-time" type="number" min="0" max="'+total+'" step=".01" value="'+Math.round(playhead*100)/100+'"></label>'+(cfg.kind==='animation'?'<label class="km-check"><input id="km-onion" type="checkbox" '+(onion?'checked':'')+'> Ver poses vecinas al pausar</label><p class="ks-tip">Arrastrá un personaje en la vista previa para ubicar su pose en el segundo del cursor. Las referencias transparentes no salen en el video.</p>':'')+'</section>';}
function syncTransport(cfg,studio){
 const total=M.duration(cfg),clock=document.getElementById('km-editor-clock'),slider=document.getElementById('km-editor-scrub'),exact=document.getElementById('km-editor-time'),button=document.getElementById('km-editor-play');
 if(clock)clock.textContent=timeLabel(playhead)+' / '+timeLabel(total);if(slider)slider.value=playhead;if(exact&&document.activeElement!==exact)exact.value=Math.round(playhead*100)/100;if(button)button.textContent=playing?'Pausar':'Reproducir';
 document.querySelectorAll('.km-track-playhead').forEach(marker=>marker.style.left=(total?playhead/total*100:0)+'%');
 const split=document.getElementById('ks-media-clip-split');if(split&&cfg.kind==='video-edit'){const at=M.locate(cfg,playhead),disabled=cfg.clips.length>=12||!at||at.local<.5||at.clip.duration-at.local<.5;split.disabled=disabled||studio?.busy===true;split.dataset.limitReached=String(disabled);}
}
function seek(studio,cfg,time){playhead=Math.max(0,Math.min(M.duration(cfg),Number(time)||0));playing=false;syncTransport(cfg,studio);send(studio,'krueka-media-seek',{time:playhead});editView(studio);}
function bindTransport(studio,el,cfg){
 el.querySelector('#km-editor-scrub').oninput=e=>seek(studio,cfg,e.target.value);
 el.querySelector('#km-editor-time').onchange=e=>seek(studio,cfg,e.target.value);
 el.querySelector('#km-editor-start').onclick=()=>seek(studio,cfg,0);
 el.querySelector('#km-editor-back').onclick=()=>seek(studio,cfg,playhead-1/24);
 el.querySelector('#km-editor-next').onclick=()=>seek(studio,cfg,playhead+1/24);
 el.querySelector('#km-editor-play').onclick=()=>{if(studio.busy)return;send(studio,'krueka-media-playback',{action:playing?'pause':'play'});};
 const ghost=el.querySelector('#km-onion');if(ghost)ghost.onchange=()=>{onion=ghost.checked;editView(studio);};
 syncTransport(cfg,studio);editView(studio);
}
function animationTimeline(cfg){return '<section class="ks-settings km-animation-timeline"><h3>Capas y poses</h3><p>Los personajes del final de la lista se dibujan por delante. Tocá una pose para editarla.</p><div class="km-ruler"><span>0 s</span><span>'+timeLabel(cfg.duration/2)+'</span><span>'+timeLabel(cfg.duration)+'</span></div>'+cfg.actors.map(a=>'<div class="km-track-row '+(a.hidden?'km-layer-hidden':'')+'"><button class="ks-btn" data-media-track-actor="'+a.id+'" aria-pressed="'+(a.id===selected)+'">'+a.icon+' '+esc(a.name)+(a.locked?' · bloqueado':'')+'</button><div class="km-track" data-media-track="'+a.id+'" aria-label="Poses de '+esc(a.name)+'"><span class="km-track-playhead" style="left:'+playhead/cfg.duration*100+'%"></span>'+a.frames.map((f,i)=>'<button class="km-key" title="'+esc(a.name)+' · '+timeLabel(f.t)+'" aria-label="Editar pose de '+esc(a.name)+' en '+timeLabel(f.t)+'" data-media-track-key="'+i+'" data-media-track-owner="'+a.id+'" style="left:'+f.t/cfg.duration*100+'%" '+(a.id===selected&&i===frameIndex?'aria-current="true"':'')+'></button>').join('')+'</div></div>').join('')+'</section>';}
function titleFields(cfg){return '<details class="ks-settings km-properties"><summary>Título y formato</summary><label>Título<input data-media-meta="title" maxlength="60" value="'+esc(cfg.title)+'"></label><div class="ks-fields"><label>Formato<select data-media-meta="aspect">'+option({wide:'Horizontal · 16:9',vertical:'Vertical · 9:16',square:'Cuadrado · 1:1'},cfg.aspect)+'</select></label><label>Color del fondo<input type="color" data-media-meta="background" value="'+cfg.background+'"></label></div>'+(cfg.kind==='animation'?'<label>Frase de tu historia<input data-media-meta="caption" maxlength="100" value="'+esc(cfg.caption)+'"></label>'+field('duration','Duración (segundos)',cfg.duration,2,30,.5):'')+'<button id="ks-media-meta-apply" class="ks-btn">Aplicar título y formato</button></details>';}
function animation(studio,el,cfg){
 const actor=cfg.actors.find(a=>a.id===selected)||cfg.actors[0];if(actor)selected=actor.id;
 frameIndex=actor?Math.min(frameIndex,actor.frames.length-1):0;const frame=actor?.frames[frameIndex];
 el.innerHTML='<h2>Animación</h2><p>Mové tus personajes, creá poses y ajustá el ritmo de la historia.</p>'+transport(cfg)+animationTimeline(cfg)+titleFields(cfg)+
 '<section class="ks-settings"><h3>Personajes · '+cfg.actors.length+' / 8</h3><div class="km-roster">'+cfg.actors.map(a=>'<button class="ks-btn" data-media-actor="'+a.id+'" aria-pressed="'+(a.id===selected)+'">'+a.icon+' '+esc(a.name)+'</button>').join('')+'</div><button id="ks-media-actor-add" class="ks-btn">Agregar personaje</button>'+ (actor?'<label>Nombre del personaje<input id="km-actor-name" maxlength="30" value="'+esc(actor.name)+'"></label><div class="ks-fields"><label>Diseño<select id="km-actor-icon">'+option(Object.fromEntries(M.icons.map(icon=>[icon,icon])),actor.icon)+'</select></label><label>Movimiento<select id="km-actor-easing">'+option({smooth:'Suave',linear:'Velocidad constante',hold:'Por saltos · stop motion'},actor.easing)+'</select></label>'+field('opacity','Opacidad',actor.opacity,.1,1,.1)+'</div><div class="km-layer-options"><label class="km-check"><input id="km-actor-visible" type="checkbox" '+(!actor.hidden?'checked':'')+'> Visible</label><label class="km-check"><input id="km-actor-locked" type="checkbox" '+(actor.locked?'checked':'')+'> Bloquear posición</label><label class="km-check"><input id="km-actor-flip" type="checkbox" '+(actor.flipX?'checked':'')+'> Reflejar</label></div><div class="km-actions"><button id="ks-media-actor-apply" class="ks-btn primary">Guardar personaje</button><button id="ks-media-actor-copy" class="ks-btn">Duplicar personaje</button><button id="ks-media-actor-back" class="ks-btn">Enviar detrás</button><button id="ks-media-actor-front" class="ks-btn">Traer delante</button><button id="ks-media-actor-remove" class="ks-btn">Quitar personaje</button></div>':'')+'</section>'+ (actor?'<section class="ks-settings"><h3>Poses de '+esc(actor.name)+'</h3><p>Elegí una pose o mové el cursor para agregar una en otro segundo. X mueve a los lados; Y, de arriba hacia abajo.</p><div class="km-keyframes">'+actor.frames.map((f,i)=>'<button class="ks-btn" data-media-key="'+i+'" aria-pressed="'+(i===frameIndex)+'">'+timeLabel(f.t)+'</button>').join('')+'</div><fieldset class="km-pose-fields" '+(actor.locked?'disabled':'')+'><div class="ks-fields">'+field('t','Segundo de esta pose',frame.t,0,cfg.duration,.01)+field('x','Posición X (%)',frame.x,0,100,.1)+field('y','Posición Y (%)',frame.y,0,100,.1)+field('scale','Tamaño',frame.scale,.3,3,.1)+field('angle','Giro (grados)',frame.angle,-360,360,1)+'</div><div class="km-actions"><button id="ks-media-key-apply" class="ks-btn primary">Guardar pose</button><button id="ks-media-key-add" class="ks-btn">Nueva pose en el cursor</button><button id="ks-media-key-paste" class="ks-btn">Pegar pose en el cursor</button><button id="ks-media-key-remove" class="ks-btn">Quitar pose</button></div></fieldset><button id="ks-media-key-copy" class="ks-btn">Copiar pose seleccionada</button>'+(actor.locked?'<p class="ks-tip">Desmarcá Bloquear posición y guardá el personaje para editar sus poses.</p>':'')+'</section>':'')+exportPanel('animation');
 bindMeta(studio,el,cfg);bindTransport(studio,el,cfg);
 const chooseActor=id=>{selected=id;frameIndex=0;redraw(studio,el,cfg);};
 el.querySelectorAll('[data-media-actor]').forEach(b=>b.onclick=()=>chooseActor(b.dataset.mediaActor));
 el.querySelectorAll('[data-media-track-actor]').forEach(b=>b.onclick=()=>chooseActor(b.dataset.mediaTrackActor));
 el.querySelectorAll('[data-media-track]').forEach(track=>track.onclick=e=>{if(e.target.closest('[data-media-track-key]'))return;const bounds=track.getBoundingClientRect();selected=track.dataset.mediaTrack;seek(studio,cfg,(e.clientX-bounds.left)/bounds.width*cfg.duration);redraw(studio,el,cfg);});
 el.querySelectorAll('[data-media-track-key]').forEach(b=>b.onclick=()=>{selected=b.dataset.mediaTrackOwner;frameIndex=Number(b.dataset.mediaTrackKey);const chosen=cfg.actors.find(a=>a.id===selected);seek(studio,cfg,chosen.frames[frameIndex].t);redraw(studio,el,cfg);});
 el.querySelector('#ks-media-actor-add').disabled=cfg.actors.length>=8;
 el.querySelector('#ks-media-actor-add').onclick=()=>{const key=uid('actor');selected=key;frameIndex=0;commit(studio,{...cfg,actors:[...cfg.actors,{id:key,name:'Nuevo personaje',icon:'🦊',easing:'smooth',frames:[{t:0,x:20,y:60,scale:1,angle:0},{t:cfg.duration,x:80,y:60,scale:1,angle:0}]}]});};
 if(actor){
  el.querySelector('#ks-media-actor-apply').onclick=()=>commit(studio,{...cfg,actors:cfg.actors.map(a=>a.id===actor.id?{...a,name:el.querySelector('#km-actor-name').value,icon:el.querySelector('#km-actor-icon').value,easing:el.querySelector('#km-actor-easing').value,hidden:!el.querySelector('#km-actor-visible').checked,locked:el.querySelector('#km-actor-locked').checked,flipX:el.querySelector('#km-actor-flip').checked,opacity:Number(el.querySelector('[data-media-field="opacity"]').value)}:a)});
  el.querySelector('#ks-media-actor-copy').disabled=cfg.actors.length>=8;
  el.querySelector('#ks-media-actor-copy').onclick=()=>{selected=uid('actor');frameIndex=0;const copy={...actor,id:selected,name:(actor.name+' copia').slice(0,30),locked:false,frames:actor.frames.map(f=>({...f,x:Math.min(100,f.x+5)}))};commit(studio,{...cfg,actors:[...cfg.actors,copy]});};
  const layer=cfg.actors.indexOf(actor),moveLayer=delta=>{const actors=[...cfg.actors],to=layer+delta;if(to<0||to>=actors.length)return;[actors[layer],actors[to]]=[actors[to],actors[layer]];commit(studio,{...cfg,actors});};
  el.querySelector('#ks-media-actor-back').disabled=layer===0;el.querySelector('#ks-media-actor-back').onclick=()=>moveLayer(-1);
  el.querySelector('#ks-media-actor-front').disabled=layer===cfg.actors.length-1;el.querySelector('#ks-media-actor-front').onclick=()=>moveLayer(1);
  el.querySelector('#ks-media-actor-remove').onclick=()=>{if(confirm('¿Quitar este personaje de la animación? Podés usar Deshacer.'))commit(studio,{...cfg,actors:cfg.actors.filter(a=>a.id!==actor.id)});};
  el.querySelectorAll('[data-media-key]').forEach(b=>b.onclick=()=>{frameIndex=Number(b.dataset.mediaKey);seek(studio,cfg,actor.frames[frameIndex].t);redraw(studio,el,cfg);});
  el.querySelector('#ks-media-key-apply').onclick=()=>{
   const f={};for(const key of ['t','x','y','scale','angle'])f[key]=Number(el.querySelector('[data-media-field="'+key+'"]').value);
   if(actor.locked||!Object.values(f).every(Number.isFinite)||f.t<0||f.t>cfg.duration){notice(studio,'Revisá los valores de la pose y usá un segundo dentro de la animación.');return;}
   if(actor.frames.some((p,i)=>i!==frameIndex&&Math.abs(p.t-f.t)<.001)){notice(studio,'Ya existe una pose en ese segundo. Elegí otro tiempo.');return;}
   const frames=actor.frames.map((p,i)=>i===frameIndex?f:p).sort((a,b)=>a.t-b.t);frameIndex=frames.indexOf(f);playhead=f.t;
   commit(studio,{...cfg,actors:cfg.actors.map(a=>a.id===actor.id?{...a,frames}:a)});
  };
  const addPose=source=>{try{const next=M.insertPose(cfg,actor.id,playhead,source);frameIndex=next.actors.find(a=>a.id===actor.id).frames.findIndex(f=>Math.abs(f.t-playhead)<.001);commit(studio,next);}catch(e){notice(studio,e.message);}};
  el.querySelector('#ks-media-key-add').disabled=actor.frames.length>=12;el.querySelector('#ks-media-key-add').onclick=()=>addPose();
  el.querySelector('#ks-media-key-copy').onclick=()=>{copiedPose={x:frame.x,y:frame.y,scale:frame.scale,angle:frame.angle};const paste=el.querySelector('#ks-media-key-paste');paste.disabled=actor.frames.length>=12;paste.dataset.limitReached=String(paste.disabled);notice(studio,'Pose copiada. Mové el cursor a otro segundo, elegí un personaje y pegala.');};
  el.querySelector('#ks-media-key-paste').disabled=!copiedPose||actor.frames.length>=12;el.querySelector('#ks-media-key-paste').onclick=()=>{if(copiedPose)addPose(copiedPose);};
  el.querySelector('#ks-media-key-remove').disabled=actor.frames.length<2;
  el.querySelector('#ks-media-key-remove').onclick=()=>{if(actor.frames.length>1){frameIndex=Math.max(0,frameIndex-1);commit(studio,{...cfg,actors:cfg.actors.map(a=>a.id===actor.id?{...a,frames:a.frames.filter(f=>f!==frame)}:a)});}};
 }
 bindExports(studio,el);
}
function exportPanel(kind){return '<section class="ks-settings km-export"><h3>Tu creación sale de Krueka</h3><p>Descargá un video de tu '+(kind==='animation'?'animación':'montaje')+'. La exportación tarda lo mismo que la secuencia: mantené esta pestaña visible.</p><button class="ks-btn primary" id="ks-media-export">↓ Exportar video</button> <button class="ks-btn" id="ks-media-cancel" hidden>Cancelar exportación</button><p id="ks-media-notice" role="status">El proyecto editable también se conserva desde Guardar y Descargar.</p>'+(kind==='video-edit'?'<p class="ks-tip">Para incluir el sonido original, activá Sonido dentro de la vista previa antes de exportar. El formato final depende del navegador.</p>':'')+'</section>';}
function bindMeta(studio,el,cfg){el.querySelector('#ks-media-meta-apply').onclick=()=>{const next={...cfg};el.querySelectorAll('[data-media-meta]').forEach(x=>next[x.dataset.mediaMeta]=x.value);if(cfg.kind==='animation'){next.duration=Math.max(2,Math.min(30,Number(el.querySelector('[data-media-field="duration"]').value)||cfg.duration));const ratio=next.duration/cfg.duration;next.actors=cfg.actors.map(a=>({...a,frames:a.frames.map(f=>({...f,t:Math.round(f.t*ratio*1000000)/1000000}))}));playhead*=ratio;}commit(studio,next);};}
function video(studio,el,cfg){
 const clip=cfg.clips.find(c=>c.id===selected)||cfg.clips[0];if(clip)selected=clip.id;
 const total=M.duration(cfg);let offset=0;
 const strip=cfg.clips.map((c,i)=>{const start=offset;offset+=c.duration;return '<button class="km-clip-segment" data-media-clip="'+c.id+'" aria-pressed="'+(c.id===selected)+'" title="'+esc(c.title)+' · '+timeLabel(start)+' a '+timeLabel(offset)+'" style="flex-grow:'+c.duration+';--km-clip-color:'+c.color+'"><span>'+String(i+1).padStart(2,'0')+'</span><b>'+esc(c.title)+'</b><small>'+timeLabel(c.duration)+'</small></button>';}).join('');
 el.innerHTML='<h2>Edición de video</h2><p>Recortá, dividí y ordená tus escenas con precisión.</p>'+transport(cfg)+titleFields(cfg)+
 '<section class="ks-settings"><h3>Tu línea de tiempo · '+timeLabel(total)+'</h3><div class="km-clip-strip">'+strip+'</div><p>El cursor indica dónde se corta. Cada parte debe conservar al menos medio segundo.</p><button id="ks-media-clip-split" class="ks-btn primary">Dividir escena en el cursor</button><ol class="km-timeline">'+cfg.clips.map((c,i)=>'<li><button class="ks-btn" data-media-clip="'+c.id+'" aria-pressed="'+(c.id===selected)+'"><span>'+String(i+1).padStart(2,'0')+'</span><b>'+esc(c.title)+'</b><small>'+timeLabel(c.duration)+' · '+({card:'Título',image:'Foto',video:'Video'})[c.type]+(c.type==='video'?' · '+c.speed+'×'+(c.muted?' · sin sonido':''):'')+'</small></button></li>').join('')+'</ol><div class="km-actions"><button id="ks-media-card-add" class="ks-btn">Agregar texto</button><button id="ks-media-photo-add" class="ks-btn">Agregar foto</button><button id="ks-media-video-add" class="ks-btn">Agregar video / elegir originales</button></div><input id="km-photo" type="file" accept="image/jpeg,image/png,image/webp" hidden><input id="km-video" type="file" accept="video/mp4,video/webm,video/ogg" multiple hidden><p class="ks-tip">Hasta 12 escenas y 90 segundos por montaje. Las fotos reducidas y los títulos se guardan en Krueka. Los videos originales quedan en tu PC: al cambiar de equipo, volvé a elegirlos.</p></section>'+
 (clip?'<section class="ks-settings"><h3>Escena '+(cfg.clips.indexOf(clip)+1)+' · '+timeLabel(clip.duration)+'</h3><label>Título de la escena<input id="km-clip-title" maxlength="80" value="'+esc(clip.title)+'"></label><label>Subtítulo<input id="km-clip-subtitle" maxlength="120" value="'+esc(clip.subtitle)+'"></label><div class="ks-fields">'+(clip.type==='video'?field('trim','Inicio del original (s)',clip.trim,0,clip.source.duration,.01)+field('sourceEnd','Final del original (s)',Math.round((clip.trim+clip.duration*clip.speed)*1000000)/1000000,0,clip.source.duration,.01)+field('speed','Velocidad (1 = normal)',clip.speed,.25,4,.25)+field('volume','Volumen (0 a 1)',clip.volume,0,1,.05):field('duration','Duración (segundos)',clip.duration,.5,15,.01))+'<label>Color<input id="km-clip-color" type="color" value="'+clip.color+'"></label><label>Transición<select id="km-clip-transition">'+option({cut:'Corte directo',fade:'Fundido a negro','fade-white':'Fundido a blanco'},clip.transition)+'</select></label>'+field('fadeDuration','Tiempo de fundido (s)',clip.fadeDuration,.05,2,.05)+(clip.type!=='card'?'<label>Encuadre<select id="km-clip-fit">'+option({contain:'Imagen completa',cover:'Llenar el cuadro · recorta los bordes'},clip.fit)+'</select></label>':'')+'</div><div class="km-layer-options"><label class="km-check"><input id="km-clip-fade-in" type="checkbox" '+(clip.fadeIn?'checked':'')+'> Fundido al entrar</label><label class="km-check"><input id="km-clip-fade-out" type="checkbox" '+(clip.fadeOut?'checked':'')+'> Fundido al salir</label>'+(clip.type==='video'?'<label class="km-check"><input id="km-clip-muted" type="checkbox" '+(clip.muted?'checked':'')+'> Silenciar este clip</label>':'')+'</div>'+(clip.type==='video'?'<output id="km-trim-result" class="km-trim-result">Recorte: '+timeLabel(clip.duration)+' · original de '+timeLabel(clip.source.duration)+'</output><p class="ks-notice">'+(files.has(clip.id)?'✓ Original disponible en este equipo: ':'Elegí nuevamente este original: ')+esc(clip.source.name)+'</p>':'')+'<div class="km-actions"><button id="ks-media-clip-apply" class="ks-btn primary">Aplicar edición</button><button id="ks-media-clip-up" class="ks-btn">Mover antes</button><button id="ks-media-clip-down" class="ks-btn">Mover después</button><button id="ks-media-clip-copy" class="ks-btn">Duplicar</button><button id="ks-media-clip-remove" class="ks-btn">Quitar</button></div></section>':'')+exportPanel('video-edit');
 bindMeta(studio,el,cfg);bindTransport(studio,el,cfg);
 el.querySelectorAll('[data-media-clip]').forEach(b=>b.onclick=()=>{selected=b.dataset.mediaClip;const c=cfg.clips.find(c=>c.id===selected);seek(studio,cfg,cfg.clips.slice(0,cfg.clips.indexOf(c)).reduce((n,x)=>n+x.duration,0)+Math.min(.5,c.duration/2));redraw(studio,el,cfg);});
 el.querySelector('#ks-media-clip-split').onclick=()=>{
  try{const entry=M.locate(cfg,playhead),key=uid('clip'),next=M.splitClip(cfg,playhead,key);if(files.has(entry.clip.id))files.set(key,files.get(entry.clip.id));selected=key;if(commit(studio,next))notice(studio,'Escena dividida en '+timeLabel(playhead)+'. Ambas partes conservan el mismo original.');else files.delete(key);}catch(e){notice(studio,e.message);}
 };
 const canAdd=cfg.clips.length<12&&total<89.5;
 for(const id of ['ks-media-card-add','ks-media-photo-add'])el.querySelector('#'+id).disabled=!canAdd;
 el.querySelector('#ks-media-card-add').onclick=()=>{selected=uid('clip');commit(studio,{...cfg,clips:[...cfg.clips,{id:selected,title:'Mi nueva escena',duration:Math.min(4,90-total),type:'card'}]});};
 el.querySelector('#ks-media-photo-add').onclick=()=>el.querySelector('#km-photo').click();
 el.querySelector('#ks-media-video-add').onclick=()=>el.querySelector('#km-video').click();
 el.querySelector('#km-photo').onchange=e=>importPhoto(studio,e.target.files[0]);
 el.querySelector('#km-video').onchange=e=>importVideos(studio,Array.from(e.target.files||[]));
 if(clip){
  const read=key=>Number(el.querySelector('[data-media-field="'+key+'"]').value);
  if(clip.type==='video')for(const key of ['trim','sourceEnd','speed'])el.querySelector('[data-media-field="'+key+'"]').oninput=()=>{const length=(read('sourceEnd')-read('trim'))/read('speed');el.querySelector('#km-trim-result').textContent=Number.isFinite(length)&&length>0?'Recorte: '+timeLabel(length)+' · original de '+timeLabel(clip.source.duration):'Revisá el inicio, el final y la velocidad.';};
  el.querySelector('#ks-media-clip-apply').onclick=()=>{
   try{
    let next=cfg;if(clip.type==='video')next=M.clipRange(cfg,clip.id,read('trim'),read('sourceEnd'),read('speed'));
    const original=next.clips.find(c=>c.id===clip.id),c={...original,title:el.querySelector('#km-clip-title').value,subtitle:el.querySelector('#km-clip-subtitle').value,color:el.querySelector('#km-clip-color').value,transition:el.querySelector('#km-clip-transition').value,fadeDuration:read('fadeDuration'),fadeIn:el.querySelector('#km-clip-fade-in').checked,fadeOut:el.querySelector('#km-clip-fade-out').checked};
    if(clip.type==='video'){c.volume=read('volume');c.muted=el.querySelector('#km-clip-muted').checked;}else c.duration=read('duration');
    if(clip.type!=='card')c.fit=el.querySelector('#km-clip-fit').value;
    if(!Number.isFinite(c.duration)||c.duration<.5||c.duration>15)throw Error('Cada escena debe durar entre 0,5 y 15 segundos.');
    if(next.clips.reduce((n,x)=>n+(x.id===c.id?c.duration:x.duration),0)>90+.001)throw Error('El montaje admite hasta 90 segundos. Acortá una escena.');
    commit(studio,{...next,clips:next.clips.map(x=>x.id===c.id?c:x)});
   }catch(e){notice(studio,e.message);}
  };
  const at=cfg.clips.indexOf(clip);
  const move=dir=>{if(at+dir<0||at+dir>=cfg.clips.length)return;const next=[...cfg.clips];[next[at],next[at+dir]]=[next[at+dir],next[at]];commit(studio,{...cfg,clips:next});};
  el.querySelector('#ks-media-clip-up').disabled=at===0;el.querySelector('#ks-media-clip-up').onclick=()=>move(-1);
  el.querySelector('#ks-media-clip-down').disabled=at===cfg.clips.length-1;el.querySelector('#ks-media-clip-down').onclick=()=>move(1);
  el.querySelector('#ks-media-clip-copy').disabled=!canAdd||total+clip.duration>90;
  el.querySelector('#ks-media-clip-copy').onclick=()=>{const key=uid('clip');if(files.has(clip.id))files.set(key,files.get(clip.id));selected=key;commit(studio,{...cfg,clips:[...cfg.clips.slice(0,at+1),{...clip,id:key},...cfg.clips.slice(at+1)]});};
  el.querySelector('#ks-media-clip-remove').disabled=cfg.clips.length===1;
  el.querySelector('#ks-media-clip-remove').onclick=()=>{if(cfg.clips.length>1&&confirm('¿Quitar esta escena del montaje? Podés usar Deshacer.'))commit(studio,{...cfg,clips:cfg.clips.filter(x=>x.id!==clip.id)});};
 }
 bindExports(studio,el);
}
async function importPhoto(studio,file){
 if(!file||studio.busy||!studio.cloudReady)return;
 if(!/^image\/(jpeg|png|webp)$/.test(file.type)||file.size>10000000){notice(studio,'Elegí una foto JPG, PNG o WebP de hasta 10 MB.');return;}
 studio.busy=true;studio.lock(true);let url;
 try{
  const cfg=current(studio);if(cfg.clips.length>=12||M.duration(cfg)>=89.5)throw Error('No queda espacio para otra escena.');
  const image=new Image();url=URL.createObjectURL(file);
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('La foto tardó demasiado. Elegí otra imagen.')),10000);image.onload=()=>{clearTimeout(timer);resolve();};image.onerror=()=>{clearTimeout(timer);reject(Error('No se pudo abrir esa foto.'));};image.src=url;});
  const canvas=document.createElement('canvas');let data='';
  for(const width of [640,480,320,240]){const ratio=Math.min(1,width/image.naturalWidth,480/image.naturalHeight);canvas.width=Math.max(1,Math.round(image.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(image.naturalHeight*ratio));const context=canvas.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);data=canvas.toDataURL('image/jpeg',.62);if(data.length<=16000)break;}
  if(data.length>18000)throw Error('Esta foto tiene demasiado detalle. Elegí una imagen más sencilla.');
  selected=uid('photo');studio.busy=false;
  const ok=commit(studio,{...cfg,clips:[...cfg.clips,{id:selected,type:'image',image:data,title:'Mi foto',duration:Math.min(4,90-M.duration(cfg))}]});
  if(ok)notice(studio,'Foto incorporada. Esta versión reducida queda guardada con tu proyecto.');
 }catch(e){notice(studio,e.message);}finally{if(url)URL.revokeObjectURL(url);studio.busy=false;studio.lock(false);}
}
async function importVideos(studio,list){
 if(!list.length||studio.busy||!studio.cloudReady)return;studio.busy=true;studio.lock(true);
 let cfg=current(studio),added=false,attached=0,failure='';
 try{
  for(const file of list.slice(0,12)){
   if(!/^video\/(mp4|webm|ogg)$/.test(file.type)||file.size>26214400)throw Error('Elegí videos MP4, WebM u Ogg de hasta 25 MB cada uno.');
   const existing=cfg.clips.filter(c=>c.type==='video'&&c.source.name===file.name&&c.source.size===file.size);
   if(existing.length){existing.forEach(c=>files.set(c.id,file));attached+=existing.length;continue;}
   if(cfg.clips.length>=12||M.duration(cfg)>=89.5)throw Error('El montaje admite hasta 12 escenas y 90 segundos.');
   const video=document.createElement('video'),url=URL.createObjectURL(file);video.preload='metadata';
   let length;try{length=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('El video tardó demasiado. Probá un archivo más pequeño.')),10000);const ready=()=>{if(Number.isFinite(video.duration)&&video.duration>=.5){clearTimeout(timer);resolve(video.duration);return true;}return false;};video.onloadedmetadata=()=>{if(!ready()){video.ontimeupdate=video.onseeked=()=>{ready();};try{video.currentTime=1e10;}catch(_e){clearTimeout(timer);reject(Error('Ese video no informa una duración válida.'));}}};video.onerror=()=>{clearTimeout(timer);reject(Error('El navegador no puede leer este video. Probá otro formato.'));};video.src=url;});}finally{video.onloadedmetadata=video.ontimeupdate=video.onseeked=video.onerror=null;video.removeAttribute('src');video.load();URL.revokeObjectURL(url);}
   const key=uid('video');files.set(key,file);selected=key;cfg=M.clean({...cfg,clips:[...cfg.clips,{id:key,type:'video',title:file.name.replace(/\.[^.]+$/,''),duration:Math.min(8,length,90-M.duration(cfg)),source:{name:file.name,size:file.size,modified:file.lastModified,duration:length}}]});added=true;
  }
 }catch(e){failure=e.message;notice(studio,failure);}
 finally{
  studio.busy=false;if(added)commit(studio,cfg);else{redraw(studio,document.getElementById('ks-create'),cfg);sendAssets(studio);}
  studio.lock(false);notice(studio,(added?'Video incorporado. Conservá los originales: el montaje se guarda en Krueka; los archivos de video quedan en tu equipo.':attached?'Originales seleccionados. Ya podés probar y exportar el montaje.':'')+(failure?' '+failure:''));
 }
}
function sendAssets(studio){if(owner!==studio.sid()||project!==studio.projectId)return;const cfg=StudioKits.read(studio.files);if(cfg?.kind!=='video-edit')return;const assets=cfg.clips.filter(c=>files.has(c.id)).map(c=>({id:c.id,blob:files.get(c.id)}));if(assets.length)send(studio,'krueka-media-assets',{assets});}
function finishExport(studio,message){if(!exportJob)return;clearTimeout(exportJob.timer);exportJob=null;studio.busy=false;studio.lock(false);const cancel=document.getElementById('ks-media-cancel');if(cancel)cancel.hidden=true;notice(studio,message);}
function bindExports(studio,el){
 const button=el.querySelector('#ks-media-export');button.onclick=()=>{
  if(studio.busy||!studio.cloudReady)return;
  const cfg=current(studio);if(cfg.kind==='video-edit'&&cfg.clips.some(c=>c.type==='video'&&!files.has(c.id))){notice(studio,'Primero elegí los videos originales que faltan en este equipo.');return;}
  const frame=document.getElementById('ks-frame');if(!frame||frame.classList.contains('off')){notice(studio,'Abrí la vista previa antes de exportar.');return;}
  const token=uid('export');studio.busy=true;studio.lock(true);
  exportJob={token,frame:frame.contentWindow,project:studio.projectId,timer:setTimeout(()=>{send(studio,'krueka-media-export-cancel',{});finishExport(studio,'La exportación tardó demasiado. Mantené la pestaña visible y probá una secuencia más corta.');},(M.duration(cfg)+25)*1000)};
  const cancel=el.querySelector('#ks-media-cancel');cancel.hidden=false;cancel.disabled=false;
  notice(studio,'Exportando tu creación… mantené la pestaña visible.');send(studio,'krueka-media-export-request',{token});
 };
 el.querySelector('#ks-media-cancel').onclick=()=>{send(studio,'krueka-media-export-cancel',{});finishExport(studio,'Exportación cancelada. Podés seguir editando.');};
}
function render(studio,el,raw){if(!el)return;reset(studio);const cfg=M.clean(raw);playhead=Math.max(0,Math.min(M.duration(cfg),playhead));cfg.kind==='animation'?animation(studio,el,cfg):video(studio,el,cfg);el.querySelectorAll('button:disabled').forEach(b=>b.dataset.limitReached='true');}
function lesson(el,kind){
 const anim=kind==='animation';el.innerHTML='<div class="ks-section-label">MISIÓN CREATIVA · 60 MINUTOS</div><h2>'+ (anim?'Una historia que se mueve.':'Tu primer montaje audiovisual.')+'</h2><p><b>Tema:</b> '+(anim?'Animación, fotogramas clave y ritmo.':'Secuencias, recortes, títulos y transiciones.')+'</p><p><b>Capacidad:</b> organizar una historia, editar su tiempo y mejorarla a partir de pruebas.</p><ol><li><b>10 min · Imaginá.</b> Elegí qué querés contar. Poné nombre a tu creación.</li><li><b>15 min · Construí.</b> '+(anim?'Elegí dos personajes y prepará tres poses en distintos segundos.':'Ordená tres escenas. Agregá una foto o un video corto y cambiá sus títulos.')+'</li><li><b>15 min · Editá.</b> '+(anim?'Cambiá posiciones, giro y tamaño. Compará movimiento suave y por saltos.':'Ajustá duración y recortes. Compará corte directo y fundido.')+'</li><li><b>10 min · Probá.</b> Reproducí de principio a fin. Corregí una parte que no se entienda.</li><li><b>10 min · Entregá.</b> Contá tu mejora en Mi bitácora. Guardá, exportá y enviá el proyecto al profe desde Krueka.</li></ol><h3>Indicadores de logro</h3><ul><li>Organizo una secuencia con inicio y cierre.</li><li>Modifico tiempos y explico su efecto.</li><li>Pruebo y mejoro mi creación.</li><li>Guardo y entrego mi proyecto.</li></ul>';
}
function install(){
 const studio=window.StudioIA;if(!studio||studio.__mediaEditor)return;
 const creator=studio.renderCreator,learn=studio.renderLesson,adopt=studio.adopt,close=studio.close,preview=studio.buildPreview,tab=studio.showTab;
 if(typeof preview==='function')studio.buildPreview=function(){const upgraded=M.upgradeEngine(this.files);if(upgraded===this.files)return preview.apply(this,arguments);const view=Object.create(this);view.files=upgraded;return preview.apply(view,arguments);};
 if(typeof tab==='function')studio.showTab=function(){const result=tab.apply(this,arguments);if(supports(StudioKits.read(this.files)?.kind))editView(this);return result;};
 studio.renderCreator=function(){const cfg=StudioKits.read(this.files);if(supports(cfg?.kind))return render(this,document.getElementById('ks-create'),cfg);return creator.apply(this,arguments);};
 studio.renderLesson=function(){const cfg=StudioKits.read(this.files);if(supports(cfg?.kind))return lesson(document.getElementById('ks-learn'),cfg.kind);return learn.apply(this,arguments);};
 studio.adopt=function(){const result=adopt.apply(this,arguments);reset(this);return result;};
 studio.close=async function(){await close.apply(this,arguments);if(!document.getElementById('krueka-studio')){files.clear();owner=project='';if(exportJob)finishExport(this,'');}};
 window.addEventListener('message',e=>{
  if(e.source!==document.getElementById('ks-frame')?.contentWindow||!e.data||!supports(StudioKits.read(studio.files)?.kind))return;
  if(e.data.type==='krueka-media-ready'){sendAssets(studio);if(playhead)send(studio,'krueka-media-seek',{time:playhead});editView(studio);return;}
  if(e.data.type==='krueka-media-state'){const cfg=current(studio),value=Number(e.data.time);if(Number.isFinite(value)&&value>=0&&value<=M.duration(cfg)+.001){playhead=value;playing=e.data.playing===true;syncTransport(cfg,studio);}return;}
  if(e.data.type==='krueka-media-select'&&!studio.busy){const cfg=current(studio),actor=cfg.actors?.find(a=>a.id===e.data.id);if(actor){selected=actor.id;frameIndex=Math.max(0,actor.frames.findIndex(f=>f.t>=playhead));studio.renderCreator();}return;}
  if(e.data.type==='krueka-media-move'&&!studio.busy){
   const cfg=current(studio),actor=cfg.actors?.find(a=>a.id===e.data.id),value=Number(e.data.time),x=Number(e.data.x),y=Number(e.data.y);
   if(!actor||actor.locked||![value,x,y].every(Number.isFinite)||value<0||value>cfg.duration||x<0||x>100||y<0||y>100)return;
   try{selected=actor.id;playhead=value;const existing=actor.frames.find(f=>Math.abs(f.t-value)<.001),next=M.insertPose(cfg,actor.id,existing?existing.t:value,{x,y},!!existing);frameIndex=next.actors.find(a=>a.id===actor.id).frames.findIndex(f=>Math.abs(f.t-value)<.001);commit(studio,next);}catch(error){notice(studio,error.message);send(studio,'krueka-media-seek',{time:playhead});}return;
  }
  if(!exportJob||e.data.token!==exportJob.token||e.source!==exportJob.frame||studio.projectId!==exportJob.project)return;
  if(e.data.type==='krueka-media-export-error'){finishExport(studio,String(e.data.error||'No se pudo exportar.').slice(0,300));return;}
  if(e.data.type==='krueka-media-export'){
   const blob=e.data.blob;if(!(blob instanceof Blob)||blob.size<100||blob.size>30000000||!/^video\/(webm|mp4)(;|$)/.test(blob.type)){finishExport(studio,'El navegador no devolvió un video válido. Tu proyecto se conserva.');return;}
   const ext=blob.type.startsWith('video/mp4')?'mp4':'webm',name=(studio.title||'mi-creacion').replace(/[^a-zA-Z0-9_-]/g,'-');
   studio.downloadBlob(blob,name+'.'+ext,blob.type);finishExport(studio,'✓ Video descargado. Tu proyecto editable sigue guardado en Krueka.');
  }
 });
 studio.__mediaEditor=true;
}
window.StudioMediaEditor={install,render,lesson,commit,importPhoto,importVideos,sendAssets};install();
})();
