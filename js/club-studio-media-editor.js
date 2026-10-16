/* Editores visuales del Studio. Los archivos de video se mantienen únicamente en memoria. */
(function(){
'use strict';
if(window.StudioMediaEditor||!window.StudioMedia)return;
const M=StudioMedia;
let owner='',project='',files=new Map(),selected='',frameIndex=0,playhead=0,exportJob=null;
const uid=prefix=>prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
const option=(map,value)=>Object.entries(map).map(([key,label])=>'<option value="'+esc(key)+'" '+(String(value)===key?'selected':'')+'>'+esc(label)+'</option>').join('');
const field=(name,label,value,min,max,step)=>'<label>'+label+'<input data-media-field="'+name+'" type="number" min="'+min+'" max="'+max+'" step="'+(step||1)+'" value="'+esc(value)+'"></label>';
function supports(kind){return ['animation','video-edit'].includes(kind);}
function reset(studio){if(owner!==studio.sid()||project!==studio.projectId){files.clear();selected='';frameIndex=0;playhead=0;owner=studio.sid();project=studio.projectId;}}
function notice(studio,message){const el=document.getElementById('ks-media-notice');if(el)el.textContent=message;else studio.say('sys',message);}
function current(studio){return M.clean(StudioKits.read(studio.files));}
function commit(studio,cfg){
 if(studio.busy||!studio.cloudReady)return false;
 try{const normal=M.clean(cfg),next=studio.validFiles({...studio.files,'game-config.js':StudioKits.configFile(normal)});studio.checkpoint();studio.files=next;studio.title=normal.title;studio.changed();studio.refreshAll();return true;}
 catch(e){notice(studio,e.message);return false;}
}
function send(studio,type,data){document.getElementById('ks-frame')?.contentWindow?.postMessage({type,...data},'*');}
function titleFields(cfg){return '<section class="ks-settings"><h3>Tu creación</h3><label>Título<input data-media-meta="title" maxlength="60" value="'+esc(cfg.title)+'"></label><div class="ks-fields"><label>Formato<select data-media-meta="aspect">'+option({wide:'Horizontal · 16:9',vertical:'Vertical · 9:16',square:'Cuadrado · 1:1'},cfg.aspect)+'</select></label><label>Color del fondo<input type="color" data-media-meta="background" value="'+cfg.background+'"></label></div>'+(cfg.kind==='animation'?'<label>Frase de tu historia<input data-media-meta="caption" maxlength="100" value="'+esc(cfg.caption)+'"></label>'+field('duration','Duración (segundos)',cfg.duration,2,30,.5):'')+'<button id="ks-media-meta-apply" class="ks-btn">Aplicar título y formato</button></section>';}
function animation(studio,el,cfg){
 const actor=cfg.actors.find(a=>a.id===selected)||cfg.actors[0];if(actor)selected=actor.id;
 frameIndex=actor?Math.min(frameIndex,actor.frames.length-1):0;const frame=actor?.frames[frameIndex];
 el.innerHTML='<div class="ks-section-label">ANIMATION LAB · MOVÉ TUS IDEAS</div><h2>Tu historia, cuadro a cuadro.</h2><p>Elegí un personaje. Definí dónde empieza y dónde termina: el movimiento entre las poses se calcula solo.</p>'+titleFields(cfg)+
 '<section class="ks-settings"><h3>Personajes · '+cfg.actors.length+' / 8</h3><div class="km-roster">'+cfg.actors.map(a=>'<button class="ks-btn" data-media-actor="'+a.id+'" aria-pressed="'+(a.id===selected)+'">'+a.icon+' '+esc(a.name)+'</button>').join('')+'</div><button id="ks-media-actor-add" class="ks-btn">＋ Agregar personaje</button>'+ (actor?'<label>Nombre del personaje<input id="km-actor-name" maxlength="30" value="'+esc(actor.name)+'"></label><div class="ks-fields"><label>Diseño<select id="km-actor-icon">'+option(Object.fromEntries(M.icons.map(icon=>[icon,icon])),actor.icon)+'</select></label><label>Movimiento<select id="km-actor-easing">'+option({smooth:'Suave',linear:'Velocidad constante',hold:'Por saltos · stop motion'},actor.easing)+'</select></label></div><button id="ks-media-actor-apply" class="ks-btn">Guardar personaje</button> <button id="ks-media-actor-remove" class="ks-btn">Quitar personaje</button>':'')+'</section>'+ (actor?'<section class="ks-settings"><h3>Poses de '+esc(actor.name)+'</h3><p>Una pose indica la posición en un segundo de tu historia. X mueve a los lados; Y, de arriba hacia abajo.</p><div class="km-keyframes">'+actor.frames.map((f,i)=>'<button class="ks-btn" data-media-key="'+i+'" aria-pressed="'+(i===frameIndex)+'">'+f.t+' s</button>').join('')+'</div><div class="ks-fields">'+field('t','Segundo de esta pose',frame.t,0,cfg.duration,.1)+field('x','Posición X (%)',frame.x,0,100)+field('y','Posición Y (%)',frame.y,0,100)+field('scale','Tamaño',frame.scale,.3,3,.1)+field('angle','Giro (grados)',frame.angle,-360,360,5)+'</div><div class="km-actions"><button id="ks-media-key-apply" class="ks-btn primary">Guardar pose</button><button id="ks-media-key-add" class="ks-btn">＋ Nueva pose</button><button id="ks-media-key-remove" class="ks-btn">Quitar pose</button></div></section>':'')+exportPanel('animation');
 bindMeta(studio,el,cfg);
 el.querySelectorAll('[data-media-actor]').forEach(b=>b.onclick=()=>{selected=b.dataset.mediaActor;frameIndex=0;render(studio,el,cfg);});
 el.querySelector('#ks-media-actor-add').disabled=cfg.actors.length>=8;
 el.querySelector('#ks-media-actor-add').onclick=()=>{const key=uid('actor');selected=key;frameIndex=0;commit(studio,{...cfg,actors:[...cfg.actors,{id:key,name:'Nuevo personaje',icon:'🦊',easing:'smooth',frames:[{t:0,x:20,y:60,scale:1,angle:0},{t:cfg.duration,x:80,y:60,scale:1,angle:0}]}]});};
 if(actor){
  el.querySelector('#ks-media-actor-apply').onclick=()=>commit(studio,{...cfg,actors:cfg.actors.map(a=>a.id===actor.id?{...a,name:el.querySelector('#km-actor-name').value,icon:el.querySelector('#km-actor-icon').value,easing:el.querySelector('#km-actor-easing').value}:a)});
  el.querySelector('#ks-media-actor-remove').onclick=()=>{if(confirm('¿Quitar este personaje de la animación? Podés usar Deshacer.'))commit(studio,{...cfg,actors:cfg.actors.filter(a=>a.id!==actor.id)});};
  el.querySelectorAll('[data-media-key]').forEach(b=>b.onclick=()=>{frameIndex=Number(b.dataset.mediaKey);playhead=actor.frames[frameIndex].t;render(studio,el,cfg);send(studio,'krueka-media-seek',{time:playhead});});
  el.querySelector('#ks-media-key-apply').onclick=()=>{
   const f={};for(const key of ['t','x','y','scale','angle'])f[key]=Number(el.querySelector('[data-media-field="'+key+'"]').value);
   if(actor.frames.some((p,i)=>i!==frameIndex&&Math.abs(p.t-f.t)<.001)){notice(studio,'Ya existe una pose en ese segundo. Elegí otro tiempo.');return;}
   const frames=actor.frames.map((p,i)=>i===frameIndex?f:p).sort((a,b)=>a.t-b.t);frameIndex=frames.indexOf(f);playhead=f.t;
   commit(studio,{...cfg,actors:cfg.actors.map(a=>a.id===actor.id?{...a,frames}:a)});
  };
  el.querySelector('#ks-media-key-add').disabled=actor.frames.length>=12;
  el.querySelector('#ks-media-key-add').onclick=()=>{
   const times=actor.frames.map(f=>f.t);let t=0;while(times.some(value=>Math.abs(value-t)<.05)&&t<cfg.duration)t=Math.round((t+.5)*10)/10;
   if(t>cfg.duration||times.includes(t)){notice(studio,'No queda espacio para otra pose. Cambiá los tiempos o ampliá la duración.');return;}
   const frames=[...actor.frames,{t,...M.pose(actor,t)}].sort((a,b)=>a.t-b.t);frameIndex=frames.findIndex(f=>f.t===t);playhead=t;
   commit(studio,{...cfg,actors:cfg.actors.map(a=>a.id===actor.id?{...a,frames}:a)});
  };
  el.querySelector('#ks-media-key-remove').disabled=actor.frames.length<2;
  el.querySelector('#ks-media-key-remove').onclick=()=>{if(actor.frames.length>1){frameIndex=Math.max(0,frameIndex-1);commit(studio,{...cfg,actors:cfg.actors.map(a=>a.id===actor.id?{...a,frames:a.frames.filter(f=>f!==frame)}:a)});}};
 }
 bindExports(studio,el);
}
function exportPanel(kind){return '<section class="ks-settings km-export"><h3>Tu creación sale de Krueka</h3><p>Descargá un video de tu '+(kind==='animation'?'animación':'montaje')+'. La exportación tarda lo mismo que la secuencia: mantené esta pestaña visible.</p><button class="ks-btn primary" id="ks-media-export">↓ Exportar video</button> <button class="ks-btn" id="ks-media-cancel" hidden>Cancelar exportación</button><p id="ks-media-notice" role="status">El proyecto editable también se conserva desde Guardar y Descargar.</p>'+(kind==='video-edit'?'<p class="ks-tip">Para incluir el sonido original, activá Sonido dentro de la vista previa antes de exportar. El formato final depende del navegador.</p>':'')+'</section>';}
function bindMeta(studio,el,cfg){el.querySelector('#ks-media-meta-apply').onclick=()=>{const next={...cfg};el.querySelectorAll('[data-media-meta]').forEach(x=>next[x.dataset.mediaMeta]=x.value);if(cfg.kind==='animation')next.duration=Number(el.querySelector('[data-media-field="duration"]').value);commit(studio,next);};}
function video(studio,el,cfg){
 const clip=cfg.clips.find(c=>c.id===selected)||cfg.clips[0];if(clip)selected=clip.id;
 el.innerHTML='<div class="ks-section-label">VIDEO LAB · DALE FORMA A TU HISTORIA</div><h2>Cortá. Ordená. Contá.</h2><p>Comenzá con tres escenas. Cambiá los títulos, sumá fotos o videos y probá el montaje.</p>'+titleFields(cfg)+
 '<section class="ks-settings"><h3>Tu línea de tiempo · '+M.duration(cfg).toFixed(1)+' s</h3><p>Elegí una escena para editarla. Usá las flechas para cambiar el orden.</p><ol class="km-timeline">'+cfg.clips.map((c,i)=>'<li><button class="ks-btn" data-media-clip="'+c.id+'" aria-pressed="'+(c.id===selected)+'"><span>'+String(i+1).padStart(2,'0')+'</span><b>'+esc(c.title)+'</b><small>'+c.duration+' s · '+({card:'Título',image:'Foto',video:'Video'})[c.type]+'</small></button></li>').join('')+'</ol><div class="km-actions"><button id="ks-media-card-add" class="ks-btn">＋ Escena de texto</button><button id="ks-media-photo-add" class="ks-btn">＋ Foto</button><button id="ks-media-video-add" class="ks-btn">＋ Video / elegir originales</button></div><input id="km-photo" type="file" accept="image/jpeg,image/png,image/webp" hidden><input id="km-video" type="file" accept="video/mp4,video/webm,video/ogg" multiple hidden><p class="ks-tip">Hasta 12 escenas y 90 segundos por montaje. Las fotos reducidas y los títulos se guardan en Krueka. Los videos originales quedan en tu PC: al cambiar de equipo, volvé a elegirlos.</p></section>'+
 (clip?'<section class="ks-settings"><h3>Escena '+(cfg.clips.indexOf(clip)+1)+'</h3><label>Título de la escena<input id="km-clip-title" maxlength="80" value="'+esc(clip.title)+'"></label><label>Subtítulo<input id="km-clip-subtitle" maxlength="120" value="'+esc(clip.subtitle)+'"></label><div class="ks-fields">'+field('duration','Duración (segundos)',clip.duration,.5,15,.5)+(clip.type==='video'?field('trim','Comenzar en el segundo',clip.trim,0,Math.max(0,clip.source.duration-.5),.1)+field('volume','Volumen (0 a 1)',clip.volume,0,1,.1):'')+'<label>Color<input id="km-clip-color" type="color" value="'+clip.color+'"></label><label>Transición<select id="km-clip-transition">'+option({cut:'Corte directo',fade:'Fundido a negro'},clip.transition)+'</select></label></div>'+(clip.type==='video'?'<p class="ks-notice">'+(files.has(clip.id)?'✓ Original disponible en este equipo: ':'Elegí nuevamente este original: ')+esc(clip.source.name)+'</p>':'')+'<div class="km-actions"><button id="ks-media-clip-apply" class="ks-btn primary">Aplicar edición</button><button id="ks-media-clip-up" class="ks-btn">← Antes</button><button id="ks-media-clip-down" class="ks-btn">Después →</button><button id="ks-media-clip-copy" class="ks-btn">Duplicar</button><button id="ks-media-clip-remove" class="ks-btn">Quitar</button></div></section>':'')+exportPanel('video-edit');
 bindMeta(studio,el,cfg);
 el.querySelectorAll('[data-media-clip]').forEach(b=>b.onclick=()=>{selected=b.dataset.mediaClip;const c=cfg.clips.find(c=>c.id===selected);playhead=cfg.clips.slice(0,cfg.clips.indexOf(c)).reduce((n,x)=>n+x.duration,0)+Math.min(.5,c.duration/2);render(studio,el,cfg);send(studio,'krueka-media-seek',{time:playhead});});
 const canAdd=cfg.clips.length<12&&M.duration(cfg)<89.5;
 for(const id of ['ks-media-card-add','ks-media-photo-add'])el.querySelector('#'+id).disabled=!canAdd;
 el.querySelector('#ks-media-card-add').onclick=()=>{selected=uid('clip');commit(studio,{...cfg,clips:[...cfg.clips,{id:selected,title:'Mi nueva escena',duration:Math.min(4,90-M.duration(cfg)),type:'card'}]});};
 el.querySelector('#ks-media-photo-add').onclick=()=>el.querySelector('#km-photo').click();
 el.querySelector('#ks-media-video-add').onclick=()=>el.querySelector('#km-video').click();
 el.querySelector('#km-photo').onchange=e=>importPhoto(studio,e.target.files[0]);
 el.querySelector('#km-video').onchange=e=>importVideos(studio,Array.from(e.target.files||[]));
 if(clip){
  el.querySelector('#ks-media-clip-apply').onclick=()=>{
   const c={...clip,title:el.querySelector('#km-clip-title').value,subtitle:el.querySelector('#km-clip-subtitle').value,color:el.querySelector('#km-clip-color').value,transition:el.querySelector('#km-clip-transition').value};
   for(const key of ['duration','trim','volume']){const x=el.querySelector('[data-media-field="'+key+'"]');if(x)c[key]=Number(x.value);}
   if(c.type==='video'){c.trim=Math.max(0,Math.min(c.trim,c.source.duration-.5));c.duration=Math.min(c.duration,c.source.duration-c.trim);}
   const wanted=cfg.clips.reduce((n,x)=>n+(x.id===c.id?c.duration:x.duration),0);if(wanted>90){notice(studio,'El montaje admite hasta 90 segundos. Acortá una escena.');return;}
   commit(studio,{...cfg,clips:cfg.clips.map(x=>x.id===c.id?c:x)});
  };
  const at=cfg.clips.indexOf(clip);
  const move=dir=>{if(at+dir<0||at+dir>=cfg.clips.length)return;const next=[...cfg.clips];[next[at],next[at+dir]]=[next[at+dir],next[at]];commit(studio,{...cfg,clips:next});};
  el.querySelector('#ks-media-clip-up').disabled=at===0;el.querySelector('#ks-media-clip-up').onclick=()=>move(-1);
  el.querySelector('#ks-media-clip-down').disabled=at===cfg.clips.length-1;el.querySelector('#ks-media-clip-down').onclick=()=>move(1);
  el.querySelector('#ks-media-clip-copy').disabled=!canAdd||M.duration(cfg)+clip.duration>90;
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
  studio.busy=false;if(added)commit(studio,cfg);else{render(studio,document.getElementById('ks-create'),cfg);sendAssets(studio);}
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
function render(studio,el,raw){if(!el)return;reset(studio);const cfg=M.clean(raw);cfg.kind==='animation'?animation(studio,el,cfg):video(studio,el,cfg);el.querySelectorAll('button:disabled').forEach(b=>b.dataset.limitReached='true');}
function lesson(el,kind){
 const anim=kind==='animation';el.innerHTML='<div class="ks-section-label">MISIÓN CREATIVA · 60 MINUTOS</div><h2>'+ (anim?'Una historia que se mueve.':'Tu primer montaje audiovisual.')+'</h2><p><b>Tema:</b> '+(anim?'Animación, fotogramas clave y ritmo.':'Secuencias, recortes, títulos y transiciones.')+'</p><p><b>Capacidad:</b> organizar una historia, editar su tiempo y mejorarla a partir de pruebas.</p><ol><li><b>10 min · Imaginá.</b> Elegí qué querés contar. Poné nombre a tu creación.</li><li><b>15 min · Construí.</b> '+(anim?'Elegí dos personajes y prepará tres poses en distintos segundos.':'Ordená tres escenas. Agregá una foto o un video corto y cambiá sus títulos.')+'</li><li><b>15 min · Editá.</b> '+(anim?'Cambiá posiciones, giro y tamaño. Compará movimiento suave y por saltos.':'Ajustá duración y recortes. Compará corte directo y fundido.')+'</li><li><b>10 min · Probá.</b> Reproducí de principio a fin. Corregí una parte que no se entienda.</li><li><b>10 min · Entregá.</b> Contá tu mejora en Mi bitácora. Guardá, exportá y enviá el proyecto al profe desde Krueka.</li></ol><h3>Indicadores de logro</h3><ul><li>Organizo una secuencia con inicio y cierre.</li><li>Modifico tiempos y explico su efecto.</li><li>Pruebo y mejoro mi creación.</li><li>Guardo y entrego mi proyecto.</li></ul>';
}
function install(){
 const studio=window.StudioIA;if(!studio||studio.__mediaEditor)return;
 const creator=studio.renderCreator,learn=studio.renderLesson,adopt=studio.adopt,close=studio.close;
 studio.renderCreator=function(){const cfg=StudioKits.read(this.files);if(supports(cfg?.kind))return render(this,document.getElementById('ks-create'),cfg);return creator.apply(this,arguments);};
 studio.renderLesson=function(){const cfg=StudioKits.read(this.files);if(supports(cfg?.kind))return lesson(document.getElementById('ks-learn'),cfg.kind);return learn.apply(this,arguments);};
 studio.adopt=function(){const result=adopt.apply(this,arguments);reset(this);return result;};
 studio.close=async function(){await close.apply(this,arguments);if(!document.getElementById('krueka-studio')){files.clear();owner=project='';if(exportJob)finishExport(this,'');}};
 window.addEventListener('message',e=>{
  if(e.source!==document.getElementById('ks-frame')?.contentWindow||!e.data||!supports(StudioKits.read(studio.files)?.kind))return;
  if(e.data.type==='krueka-media-ready'){sendAssets(studio);if(playhead)send(studio,'krueka-media-seek',{time:playhead});return;}
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
