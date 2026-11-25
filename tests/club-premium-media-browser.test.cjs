/* Fixture de UI para abrir con CUA. No inicia navegadores ni consulta servicios reales. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const prior=fs.readFileSync(path.join(__dirname,'studio-classroom-browser.test.cjs'),'utf8');
const setup=vm.runInNewContext(prior.match(/const setup=(`[^]*?`);\nconst smoke=/)[1]);
const smoke=`<script>
window.__premiumMediaPhase='loading';window.__premiumMediaReady=0;window.__premiumMediaState=null;window.__premiumMediaExports=[];window.__premiumMediaAudits=[];window.__premiumMediaSkipped=[];window.__premiumMediaChecks=[];
let mediaInitialReady='';
const mediaFailures=[];
function mediaCheck(ok,name){__premiumMediaChecks.push({name,ok:!!ok});if(!ok)mediaFailures.push(name);}
const mediaDelay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function mediaUntil(fn,label,timeout=22000){const deadline=Date.now()+timeout;while(!fn()){if(Date.now()>deadline)throw Error('Espera agotada: '+label);await mediaDelay(25);}}
function mediaElement(selector){const el=document.querySelector(selector);if(!el)throw Error('No se encuentra '+selector);return el;}
function mediaClick(selector){const el=mediaElement(selector);if(el.disabled||el.closest('fieldset[disabled]'))throw Error('Control deshabilitado: '+selector);el.click();}
function mediaInput(selector,value,event='change'){const el=mediaElement(selector);if(el.type==='checkbox')el.checked=!!value;else el.value=String(value);el.dispatchEvent(new Event(event,{bubbles:true}));}
function mediaCfg(){return StudioKits.read(StudioIA.files);}
async function mediaFresh(action,label){const previous=__premiumMediaReady;await action();await mediaUntil(()=>!StudioIA.busy&&__premiumMediaReady>previous,label);await mediaDelay(100);}
async function mediaSeek(time){mediaInput('#km-editor-time',time);await mediaUntil(()=>__premiumMediaState&&!__premiumMediaState.playing&&Math.abs(__premiumMediaState.time-time)<.015,'cursor en '+time);}
addEventListener('message',e=>{
 if(e.source!==document.getElementById('ks-frame')?.contentWindow||!e.data)return;
 if(e.data.type==='krueka-media-ready')__premiumMediaReady++;
 if(e.data.type==='krueka-premium-initial-ready')mediaInitialReady=e.data.projectId;
 if(e.data.type==='krueka-media-state')__premiumMediaState=e.data;
 if(e.data.type==='krueka-premium-media-audit'){__premiumMediaAudits.push(e.data);window.__premiumMediaFirstFramePNG=e.data.png;}
 if(e.data.type==='krueka-premium-media-snapshot')window.__premiumMediaPNG=e.data.png;
});
// Auditoría exclusiva del proyecto de ensayo. Las guías se identifican por su trazo
// discontinuo y las poses vecinas por la opacidad 0,18 del motor; no toca producción.
function auditMediaCanvas(){
 const canvas=document.getElementById('media-canvas'),ctx=canvas.getContext('2d');
 let recording=false,guideDraws=0,ghostDraws=0,frameGuides=0,frameGhosts=0,firstFrameGuides=0,firstFrameGhosts=0,png='';
 const translate=ctx.translate,strokeRect=ctx.strokeRect,fillRect=ctx.fillRect;
 ctx.fillRect=function(x,y,w,h){if(x===0&&y===0&&w===canvas.width&&h===canvas.height&&this.globalAlpha===1)frameGuides=frameGhosts=0;return fillRect.apply(this,arguments);};
 ctx.translate=function(){if(Math.abs(this.globalAlpha-.18)<.001){frameGhosts++;if(recording)ghostDraws++;}return translate.apply(this,arguments);};
 ctx.strokeRect=function(){if(this.getLineDash().length){frameGuides++;if(recording)guideDraws++;}return strokeRect.apply(this,arguments);};
 if(window.MediaRecorder){
  const start=MediaRecorder.prototype.start,stop=MediaRecorder.prototype.stop;
  MediaRecorder.prototype.start=function(){guideDraws=ghostDraws=0;firstFrameGuides=frameGuides;firstFrameGhosts=frameGhosts;png=canvas.toDataURL('image/png');recording=true;return start.apply(this,arguments);};
  MediaRecorder.prototype.stop=function(){const result=stop.apply(this,arguments);if(recording){recording=false;parent.postMessage({type:'krueka-premium-media-audit',guideDraws,ghostDraws,firstFrameGuides,firstFrameGhosts,png},'*');}return result;};
 }
 addEventListener('message',e=>{if(e.source===parent&&e.data?.type==='krueka-premium-media-snapshot')parent.postMessage({type:'krueka-premium-media-snapshot',png:canvas.toDataURL('image/png')},'*');});
}
async function makeLocalVideo(){
 if(!window.MediaRecorder||!HTMLCanvasElement.prototype.captureStream)return null;
 const mime=['video/webm;codecs=vp8','video/webm','video/mp4'].find(type=>MediaRecorder.isTypeSupported(type));if(!mime)return null;
 const canvas=document.createElement('canvas');canvas.width=320;canvas.height=180;const ctx=canvas.getContext('2d');let frame=0,done=false;
 const draw=()=>{ctx.fillStyle='#23587c';ctx.fillRect(0,0,320,180);ctx.fillStyle='#f4d56b';ctx.fillRect((frame++*3)%280,60,40,40);if(!done)requestAnimationFrame(draw);};draw();
 const stream=canvas.captureStream(15),recorder=new MediaRecorder(stream,{mimeType:mime}),chunks=[];
 recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
 const ended=new Promise((resolve,reject)=>{recorder.onstop=resolve;recorder.onerror=()=>reject(Error('No se pudo generar el original de ensayo.'));});
 recorder.start(100);await mediaDelay(2400);recorder.stop();await ended;done=true;stream.getTracks().forEach(track=>track.stop());
 return new File(chunks,'original-local-ensayo.'+(mime.startsWith('video/mp4')?'mp4':'webm'),{type:mime.split(';')[0],lastModified:0});
}
async function attachLocalVideo(file){const transfer=new DataTransfer();transfer.items.add(file);const input=mediaElement('#km-video');input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));await mediaUntil(()=>!StudioIA.busy&&mediaCfg().clips.some(c=>c.type==='video'),'importar original local');await mediaDelay(150);}
function mediaResult(){
 const errors=[...mediaFailures,...(window.__errors||[])],frame=document.getElementById('ks-frame'),diagnostic=errors.length&&window.StudioIA?{kind:StudioKits.read(StudioIA.files)?.kind,preview:StudioIA.preview,tab:StudioIA.tab,files:Object.keys(StudioIA.files),indexHasMedia:StudioIA.files['index.html']?.includes('media-canvas'),sourceHasMedia:frame?.srcdoc?.includes('media-canvas'),frameClass:frame?.className,codeClass:document.getElementById('ks-code')?.className,ready:__premiumMediaReady,previewErrors:StudioIA.errors,trace:window.__premiumMediaPreviewTrace,systemMessages:StudioIA.history?.filter(m=>m.role==='sys').slice(-3).map(m=>m.text)}:null;window.__premiumMediaResult={passed:__premiumMediaChecks.filter(c=>c.ok).length,checks:__premiumMediaChecks,errors,diagnostic,skipped:__premiumMediaSkipped,exports:__premiumMediaExports.map(x=>({name:x.name,size:x.size,type:x.type})),audits:__premiumMediaAudits.map(x=>({guideDraws:x.guideDraws,ghostDraws:x.ghostDraws,firstFrameGuides:x.firstFrameGuides,firstFrameGhosts:x.firstFrameGhosts}))};
 const result=errors.length?'FAIL '+errors.join(' | '):'PASS';document.body.dataset.premiumMediaSmoke=result;window.__premiumMediaPhase='done';
 const banner=document.createElement('aside');banner.id='premium-media-result';banner.setAttribute('role','status');banner.style.cssText='position:fixed;z-index:2147483647;right:10px;bottom:10px;max-width:580px;max-height:30vh;overflow:auto;padding:12px 16px;border-radius:10px;background:'+(errors.length?'#792d2d':'#145a46')+';color:white;font:14px/1.5 system-ui;box-shadow:0 4px 24px #0005';banner.textContent=result+' · Multimedia: '+__premiumMediaResult.passed+' comprobaciones · Exportación: '+(__premiumMediaResult.exports.map(x=>x.type+' · '+x.size+' bytes').join(', ')||'ninguna')+' · Omitidas: '+(__premiumMediaSkipped.join(', ')||'ninguna')+(diagnostic?' · Diagnóstico: '+JSON.stringify(diagnostic):'');document.body.appendChild(banner);
}
(async()=>{
 await mediaUntil(()=>window.KruekaStudioAccess?.ready,'carga del acceso');
 // El modo de diagnóstico permite comprobar herramientas mientras se aísla la
 // navegación inicial. Sin parámetro se conserva la regresión de creación inmediata.
 const waitInitial=new URLSearchParams(location.search).has('wait-initial-preview'),initialBuild=StudioIA.buildPreview;
 if(waitInitial)StudioIA.buildPreview=function(){const result=initialBuild.apply(this,arguments),signal='<scr'+'ipt>parent.postMessage({type:"krueka-premium-initial-ready",projectId:'+JSON.stringify(this.projectId)+'},"*");<'+'/scr'+'ipt>';return result.replace('</body>',signal+'</body>');};
 await KruekaStudioAccess.login('TEST01');
 if(waitInitial){await mediaUntil(()=>mediaInitialReady===StudioIA.projectId,'primera vista previa');StudioIA.buildPreview=initialBuild;}
 window.__premiumMediaPreviewTrace=[];const tracedFrame=document.getElementById('ks-frame'),renderPreview=StudioIA.renderPreview;tracedFrame.addEventListener('load',()=>__premiumMediaPreviewTrace.push({event:'load',kind:mediaCfg()?.kind,hasMedia:tracedFrame.srcdoc.includes('media-canvas'),connected:tracedFrame.isConnected}));StudioIA.renderPreview=function(){const f=document.getElementById('ks-frame'),record={kind:StudioKits.read(this.files)?.kind,path:this.preview,before:f?.className,sameFrame:f===tracedFrame,count:document.querySelectorAll('#ks-frame').length,parent:f?.parentNode?.className};const result=renderPreview.apply(this,arguments);record.hasMedia=f?.srcdoc?.includes('media-canvas');__premiumMediaPreviewTrace.push(record);return result;};
 await mediaFresh(()=>StudioIA.createKit('animation'),'abrir animación');StudioIA.showTab('create');
 await mediaUntil(()=>document.getElementById('km-editor-time'),'editor de animación');window.__premiumMediaPhase='animation';
 mediaCheck(!!document.querySelector('.km-animation-timeline .km-track-row'),'línea de tiempo por capas visible');
 await mediaSeek(2);mediaCheck(Math.abs(Number(mediaElement('#km-editor-time').value)-2)<.01,'cursor numérico sincronizado');
 mediaClick('#km-editor-play');await mediaUntil(()=>__premiumMediaState?.playing&&__premiumMediaState.time>2.15,'reproducción avanza');
 mediaClick('#km-editor-play');await mediaUntil(()=>__premiumMediaState&&!__premiumMediaState.playing,'pausa');const stopped=__premiumMediaState.time;await mediaDelay(180);mediaCheck(Math.abs(__premiumMediaState.time-stopped)<.002,'pausa conserva el tiempo');
 mediaClick('#km-editor-next');await mediaUntil(()=>__premiumMediaState.time>stopped+.03,'avance de un fotograma');mediaCheck(Math.abs(__premiumMediaState.time-stopped-1/24)<.005,'avance preciso de un fotograma');
 mediaClick('#km-editor-back');await mediaUntil(()=>Math.abs(__premiumMediaState.time-stopped)<.005,'retroceso de un fotograma');
 await mediaSeek(2);const originalPose={...mediaCfg().actors[0].frames[0]},oldFrameCount=mediaCfg().actors[0].frames.length;
 mediaClick('#ks-media-key-copy');await mediaFresh(()=>mediaClick('#ks-media-key-paste'),'pegar pose en cursor');
 let cfg=mediaCfg(),pasted=cfg.actors[0].frames.find(f=>Math.abs(f.t-2)<.001);
 mediaCheck(cfg.actors[0].frames.length===oldFrameCount+1&&pasted&&pasted.x===originalPose.x&&pasted.y===originalPose.y,'copiar y pegar pose conserva sus valores');
 const oldActors=cfg.actors.length;await mediaFresh(()=>mediaClick('#ks-media-actor-copy'),'duplicar personaje');cfg=mediaCfg();const duplicateId=cfg.actors.at(-1).id;
 mediaCheck(cfg.actors.length===oldActors+1&&new Set(cfg.actors.map(a=>a.id)).size===cfg.actors.length,'duplicación crea personaje independiente');
 await mediaFresh(()=>mediaClick('#ks-media-actor-back'),'cambiar capa');mediaCheck(mediaCfg().actors[oldActors-1].id===duplicateId,'enviar detrás cambia el orden de capas');
 mediaInput('#km-actor-visible',false);mediaInput('#km-actor-locked',true);mediaInput('#km-actor-flip',true);mediaInput('[data-media-field="opacity"]',.4);
 await mediaFresh(()=>mediaClick('#ks-media-actor-apply'),'guardar propiedades de capa');const edited=mediaCfg().actors.find(a=>a.id===duplicateId);
 mediaCheck(edited.hidden&&edited.locked&&edited.flipX&&edited.opacity===.4,'visibilidad, bloqueo, reflejo y opacidad persistidos');
 mediaCheck(mediaElement('.km-pose-fields').disabled,'bloqueo inhabilita edición de poses');
 mediaInput('#km-actor-visible',true);mediaInput('#km-actor-locked',false);await mediaFresh(()=>mediaClick('#ks-media-actor-apply'),'desbloquear capa');
 const durationBefore=mediaCfg().duration,frameTimes=mediaCfg().actors[0].frames.map(f=>f.t);mediaInput('[data-media-field="duration"]',4);
 await mediaFresh(()=>mediaClick('#ks-media-meta-apply'),'duración de animación');mediaCheck(mediaCfg().actors[0].frames.every((f,i)=>Math.abs(f.t-frameTimes[i]*4/durationBefore)<.001),'cambiar duración conserva el ritmo de las poses');
 await StudioIA.save();await StudioIA.saveQueue;const animationId=StudioIA.projectId,animationSaved=JSON.stringify(mediaCfg());
 await mediaFresh(()=>StudioIA.createKit('video-edit'),'abrir montaje');StudioIA.showTab('create');window.__premiumMediaPhase='video';
 const initialDuration=StudioMedia.duration(mediaCfg()),initialClips=mediaCfg().clips.length;await mediaSeek(1.5);
 mediaCheck(!mediaElement('#ks-media-clip-split').disabled,'dividir habilitado dentro de la escena');await mediaFresh(()=>mediaClick('#ks-media-clip-split'),'dividir escena');cfg=mediaCfg();
 mediaCheck(cfg.clips.length===initialClips+1&&cfg.clips[0].duration===1.5&&cfg.clips[1].duration===1.5,'dividir usa la posición exacta del cursor');
 mediaCheck(StudioMedia.duration(cfg)===initialDuration&&!cfg.clips[0].fadeOut&&!cfg.clips[1].fadeIn,'dividir conserva duración y continuidad');
 mediaInput('[data-media-field="duration"]',2.25);mediaInput('#km-clip-title','<Montaje & corte>');mediaInput('#km-clip-transition','fade-white');mediaInput('[data-media-field="fadeDuration"]',.2);
 await mediaFresh(()=>mediaClick('#ks-media-clip-apply'),'duración exacta y transición');cfg=mediaCfg();
 mediaCheck(cfg.clips[1].duration===2.25&&Math.abs(StudioMedia.duration(cfg)-initialDuration-.75)<.001,'duración exacta en centésimas');
 mediaCheck(cfg.clips[1].transition==='fade-white'&&cfg.clips[1].fadeDuration===.2&&!document.querySelector('montaje'),'fundido a blanco y texto escapado');
 window.__premiumMediaPhase='local-video';const localVideo=await makeLocalVideo();window.__premiumMediaLocalVideo=localVideo;
 if(localVideo){
  await attachLocalVideo(localVideo);const sourceClip=mediaCfg().clips.find(c=>c.type==='video');const end=Math.min(1.75,Math.floor((sourceClip.source.duration-.1)*100)/100);
  mediaInput('[data-media-field="trim"]',.25,'input');mediaInput('[data-media-field="sourceEnd"]',end,'input');mediaInput('[data-media-field="speed"]',.5,'input');mediaInput('[data-media-field="volume"]',.35);mediaInput('#km-clip-muted',true);mediaInput('#km-clip-fit','cover');
  await mediaFresh(()=>mediaClick('#ks-media-clip-apply'),'recorte de original');const final=mediaCfg().clips.find(c=>c.id===sourceClip.id);
  mediaCheck(Math.abs(final.duration-(end-.25)/.5)<.001&&final.trim===.25&&final.speed===.5,'recorte exacto calcula duración según velocidad');
  mediaCheck(final.muted&&final.volume===.35&&final.fit==='cover','silencio, volumen y encuadre guardados');
  const preceding=mediaCfg().clips.slice(0,mediaCfg().clips.indexOf(final)).reduce((sum,c)=>sum+c.duration,0),cut=1;await mediaSeek(preceding+cut);await mediaFresh(()=>mediaClick('#ks-media-clip-split'),'dividir original recortado');
  const parts=mediaCfg().clips.filter(c=>c.type==='video');mediaCheck(parts.length===2&&Math.abs(parts[1].trim-(.25+cut*.5))<.001,'dividir video considera velocidad y recorte inicial');
  mediaCheck(parts[1].source.name===localVideo.name&&parts[0].source.name===parts[1].source.name,'dos recortes conservan un solo original local');
 }else __premiumMediaSkipped.push('original local: navegador sin MediaRecorder/captureStream');
 await StudioIA.save();await StudioIA.saveQueue;const videoId=StudioIA.projectId,videoSaved=JSON.stringify(mediaCfg());
 await StudioIA.close();await KruekaStudioAccess.login('TEST01');await mediaUntil(()=>!StudioIA.busy,'reingreso');if(StudioIA.projectId!==videoId)await StudioIA.switchProject(videoId);StudioIA.showTab('create');
 mediaCheck(JSON.stringify(mediaCfg())===videoSaved,'montaje y recortes recuperados en nueva sesión');
 if(localVideo){const restored=mediaCfg().clips.find(c=>c.type==='video');mediaClick('[data-media-clip="'+restored.id+'"]');mediaCheck(document.querySelector('#ks-create')?.textContent.includes('Elegí nuevamente este original'),'original local no se sube ni reaparece desde la nube');}
 await mediaFresh(()=>StudioIA.switchProject(animationId),'recuperar animación');StudioIA.showTab('create');mediaCheck(JSON.stringify(mediaCfg())===animationSaved,'poses y capas recuperadas en nueva sesión');
 window.__premiumMediaPhase='export';
 mediaInput('[data-media-field="duration"]',2);await mediaFresh(()=>mediaClick('#ks-media-meta-apply'),'preparar exportación corta');
 await mediaFresh(()=>{StudioIA.files=StudioIA.validFiles({...StudioIA.files,'media.js':StudioIA.files['media.js']+'\\n('+auditMediaCanvas.toString()+')();'});StudioIA.refreshAll();},'instrumentación de canvas');
 StudioIA.showTab('create');await mediaSeek(.75);mediaInput('#km-onion',true);await mediaDelay(150);
 document.getElementById('ks-frame').contentWindow.postMessage({type:'krueka-premium-media-snapshot'},'*');await mediaUntil(()=>window.__premiumMediaPNG,'captura PNG');
 mediaCheck(/^data:image\\/png;base64,/.test(__premiumMediaPNG)&&__premiumMediaPNG.length>300,'captura PNG del editor disponible');
 if(window.MediaRecorder&&HTMLCanvasElement.prototype.captureStream&&['video/webm;codecs=vp8,opus','video/webm;codecs=vp8','video/webm','video/mp4'].some(m=>MediaRecorder.isTypeSupported(m))){
  const oldDownload=StudioIA.downloadBlob;StudioIA.downloadBlob=(blob,name,type)=>{window.__premiumMediaExportBlob=blob;__premiumMediaExports.push({name,type,size:blob.size,blob});};
  mediaClick('#ks-media-export');await mediaUntil(()=>!StudioIA.busy,'exportación corta',18000);StudioIA.downloadBlob=oldDownload;
  mediaCheck(__premiumMediaExports.length===1&&__premiumMediaExports[0].size>300,'MediaRecorder genera un video real mayor a 300 bytes');
  mediaCheck(__premiumMediaExports.length===1&&/^video\\/(webm|mp4)/.test(__premiumMediaExports[0].type),'formato de exportación admitido');
  await mediaUntil(()=>__premiumMediaAudits.length>0||__premiumMediaExports.length===0,'auditoría de exportación');
  mediaCheck(__premiumMediaAudits.length===1&&__premiumMediaAudits[0].guideDraws===0&&__premiumMediaAudits[0].ghostDraws===0&&__premiumMediaAudits[0].firstFrameGuides===0&&__premiumMediaAudits[0].firstFrameGhosts===0,'video exportado sin guías ni poses vecinas desde el primer fotograma');
 }else __premiumMediaSkipped.push('exportación: navegador sin codificador compatible');
 mediaCheck(__backend.aiCalls===0,'recorrido sin solicitudes de IA ni API real');mediaCheck(StudioIA.errors.length===0,'vista previa sin errores');mediaResult();
})().catch(error=>{mediaFailures.push(error.stack||error.message);mediaResult();});
</script>`;
function html(base='/'){return fs.readFileSync(path.join(root,'studio.html'),'utf8').replace('<head>','<head><base href="'+base.replace(/"/g,'&quot;')+'">'+setup).replace('</body>',smoke+'</body>');}
module.exports={setup,smoke,html};

// CI usa el reloj real: MediaRecorder no se valida acelerando el tiempo virtual.
// Requerir este archivo para CUA solamente exporta el HTML, sin iniciar procesos.
async function runBrowser(){
 const os=require('node:os'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'krueka-premium-media-')),file=path.join(directory,'index.html');let browser;
 try{
  fs.writeFileSync(file,html(pathToFileURL(root+path.sep).href));
  const names=process.env.STUDIO_CHROMIUM?[process.env.STUDIO_CHROMIUM]:['google-chrome','google-chrome-stable','chromium','chromium-browser'],locations=(process.env.PATH||'').split(path.delimiter);
  const binary=names.flatMap(name=>name.includes(path.sep)?[path.resolve(name)]:locations.map(location=>path.join(location,name))).find(candidate=>{try{fs.accessSync(candidate,fs.constants.X_OK);return true;}catch(_e){return false;}});
  assert.ok(binary,'Chromium no instalado');
  const engine=require(process.env.STUDIO_USE_PLAYWRIGHT==='1'?'playwright':'playwright-core');
  const args=process.env.STUDIO_CHROMIUM_ARGS?JSON.parse(process.env.STUDIO_CHROMIUM_ARGS):['--no-sandbox','--no-zygote','--disable-dev-shm-usage','--disable-background-networking'];
  browser=await engine.chromium.launch({headless:true,executablePath:binary,args});
  const page=await browser.newPage({viewport:{width:1363,height:936}});
  await page.goto(pathToFileURL(file).href);
  await page.waitForFunction(()=>document.body.dataset.premiumMediaSmoke,null,{timeout:120000});
  const state=await page.evaluate(()=>({marker:document.body.dataset.premiumMediaSmoke,result:window.__premiumMediaResult}));
  assert.equal(state.marker,'PASS',JSON.stringify(state.result));
  assert.ok(state.result.passed>=20,'El recorrido multimedia no cubrió sus controles básicos');
  if(process.env.STUDIO_SCREENSHOT_DIR){fs.mkdirSync(process.env.STUDIO_SCREENSHOT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.STUDIO_SCREENSHOT_DIR,'premium-media-1363.png')});}
  if(process.env.STUDIO_EXPORT_DIR){
   const target=process.env.STUDIO_EXPORT_DIR;fs.mkdirSync(target,{recursive:true});
   for(const [key,name] of [['__premiumMediaPNG','premium-media-editor.png'],['__premiumMediaFirstFramePNG','premium-media-first-frame.png']]){
    const png=await page.evaluate(key=>window[key],key);if(png)fs.writeFileSync(path.join(target,name),Buffer.from(png.split(',')[1],'base64'));
   }
   if(state.result.exports.length){const bytes=await page.evaluate(async()=>Array.from(new Uint8Array(await __premiumMediaExportBlob.arrayBuffer()))),extension=state.result.exports[0].type.startsWith('video/mp4')?'mp4':'webm';fs.writeFileSync(path.join(target,'premium-media-export.'+extension),Buffer.from(bytes));}
   fs.writeFileSync(path.join(target,'premium-media-result.json'),JSON.stringify(state.result,null,2)+'\n');
  }
  console.log('PASS navegador multimedia: '+state.result.passed+' comprobaciones; exportación: '+(state.result.exports.map(x=>x.type+' '+x.size+' bytes').join(', ')||'ninguna')+'; omitidas: '+(state.result.skipped.join(', ')||'ninguna')+'.');
 }finally{if(browser)await browser.close();fs.rmSync(directory,{recursive:true,force:true});}
}
if(require.main===module)runBrowser().catch(error=>{console.error(error);process.exitCode=1;});
