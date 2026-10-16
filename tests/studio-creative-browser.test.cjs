const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),cp=require('node:child_process'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),prior=fs.readFileSync(path.join(__dirname,'studio-classroom-browser.test.cjs'),'utf8');
const setup=vm.runInNewContext(prior.match(/const setup=(`[^]*?`);\nconst smoke=/)[1]);
const smoke=`<script>
const checks=[];function check(ok,name){if(!ok)checks.push(name)}
async function until(fn){const deadline=Date.now()+20000;while(!fn()){if(Date.now()>deadline)throw Error('Espera agotada');await new Promise(r=>setTimeout(r,25));}}
window.__creativePhase='loading';
(async()=>{
 await until(()=>window.KruekaStudioAccess?.ready);await KruekaStudioAccess.login('TEST01');
 check(StudioIA.tab==='home','inicio por talleres');check(document.querySelectorAll('[data-creative-start]').length===4,'cuatro rutas creativas');
 const initial=StudioIA.projectId;document.querySelector('[data-creative-start="animation"]').click();await until(()=>StudioKits.read(StudioIA.files)?.kind==='animation'&&!StudioIA.busy);
 check(StudioIA.projectId!==initial&&StudioIA.tab==='create','animación nueva sin reemplazar juego');
 document.getElementById('km-actor-name').value='Explorador';document.getElementById('ks-media-actor-apply').click();
 check(StudioKits.read(StudioIA.files).actors[0].name==='Explorador','personaje editable');
 document.querySelector('[data-media-field="x"]').value='35';document.getElementById('ks-media-key-apply').click();
 check(StudioKits.read(StudioIA.files).actors[0].frames[0].x===35,'pose guardada');
 document.getElementById('kc-reflection').value='Cambié la posición y probé el movimiento.';document.getElementById('kc-save-reflection').click();await StudioIA.saveQueue;
 const animation=StudioIA.projectId;await StudioIA.save();StudioIA.showTab('ai');document.getElementById('ks-prompt').value='¿Cómo agrego una pose?';await StudioIA.send();
 check(__backend.aiCalls===0&&StudioIA.history.at(-1).text.includes('Guía de herramientas'),'guía sin enviar datos al proveedor');
 await StudioIA.close();await KruekaStudioAccess.login('TEST01');check(StudioIA.projectId===animation&&StudioKits.read(StudioIA.files).actors[0].name==='Explorador','animación recuperada en otra sesión');
 check(StudioIA.files['mi-proceso.txt'].includes('posición'),'bitácora recuperada');
 await StudioIA.createKit('video-edit');const firstClip=StudioKits.read(StudioIA.files).clips[0].id;
 document.getElementById('km-clip-title').value='<Mi video>';document.querySelector('[data-media-field="duration"]').value='1';document.getElementById('ks-media-clip-apply').click();
 check(StudioKits.read(StudioIA.files).clips[0].title==='<Mi video>'&&!document.querySelector('mi'),'títulos como texto');
 document.getElementById('ks-media-clip-down').click();check(StudioKits.read(StudioIA.files).clips[1].id===firstClip,'orden del montaje');
 document.getElementById('ks-media-clip-copy').click();check(StudioKits.read(StudioIA.files).clips.length===4,'duplicar escena');
 const original=StudioIA.files['game-config.js'];StudioIA.restore();check(StudioIA.files['game-config.js']!==original&&StudioKits.read(StudioIA.files).clips.length===3,'deshacer montaje');
 document.getElementById('kc-reflection').value='Ordené las escenas para contar mejor mi historia.';document.getElementById('kc-save-reflection').click();await StudioIA.saveQueue;
 await StudioIA.save();check(__backend.projects.some(p=>p.id===StudioIA.projectId&&p.files['mi-proceso.txt'].includes('escenas')),'montaje y explicación privados guardados');
 window.__creativeProject=StudioIA.projectId;window.__creativePhase='video';await until(()=>window.__creativeFinish);
 await StudioIA.close();await KruekaStudioAccess.login('TEST02');check(!StudioIA.files['mi-proceso.txt']&&!StudioIA.history.some(m=>m.text.includes('una pose')),'otro alumno aislado');
 await StudioIA.createKit('explore3d');check(StudioKits.read(StudioIA.files).kind==='explore3d'&&!!document.getElementById('ks-scene-apply'),'editor 3D conservado');
 await StudioIA.close();document.body.dataset.creativeSmoke=checks.length+__errors.length===0?'PASS':'FAIL '+checks.concat(__errors).join(' | ');
})().catch(e=>{document.body.dataset.creativeSmoke='FAIL '+e.stack});
</script>`;
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'krueka-creative-')),file=path.join(directory,'index.html');
let html=fs.readFileSync(path.join(root,'studio.html'),'utf8').replace('<head>','<head><base href="file://'+root+'/">'+setup).replace('</body>',smoke+'</body>');
(async()=>{
 try{
  fs.writeFileSync(file,html);let binary=process.env.STUDIO_CHROMIUM;
  if(process.env.STUDIO_USE_PLAYWRIGHT==='1'){
   const args=['--no-sandbox','--no-zygote','--disable-dev-shm-usage','--in-process-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'];
   const browser=await require('playwright').chromium.launch({headless:true,executablePath:binary,args});
   try{
    const page=await browser.newPage({viewport:{width:1280,height:900}});await page.goto('file://'+file);
    await page.waitForFunction(()=>window.__creativePhase==='video'||document.body.dataset.creativeSmoke,null,{timeout:30000});
    assert.equal(await page.evaluate(()=>document.body.dataset.creativeSmoke),undefined,'Recorrido inicial');
    for(const width of [1280,390]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.getElementById('krueka-studio').scrollWidth>innerWidth),false,'Ancho '+width);
     assert.equal(await page.locator('#ks-create').isVisible(),true);
     if(process.env.STUDIO_SCREENSHOT_DIR)await page.screenshot({path:path.join(process.env.STUDIO_SCREENSHOT_DIR,'creative-video-'+width+'.png')});
    }
    await page.setViewportSize({width:1280,height:900});
    // Foto real -> reducción local -> datos portables en el proyecto.
    const photo=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=320;c.height=180;const x=c.getContext('2d');x.fillStyle='#58b4ba';x.fillRect(0,0,320,180);return c.toDataURL('image/png').split(',')[1];});
    await page.locator('#km-photo').setInputFiles({name:'escenario.png',mimeType:'image/png',buffer:Buffer.from(photo,'base64')});
    await page.waitForFunction(()=>!StudioIA.busy&&StudioKits.read(StudioIA.files).clips.some(c=>c.type==='image'));
    const cfg=await page.evaluate(()=>StudioKits.read(StudioIA.files));assert.ok(cfg.clips.find(c=>c.type==='image').image.length<=18000);
    // Un original real prueba decodificación, recortes y exportación en el iframe aislado.
    const videoPath=process.env.STUDIO_TEST_VIDEO;
    if(videoPath){
     await page.locator('#km-video').setInputFiles(videoPath);await page.waitForFunction(()=>!StudioIA.busy&&StudioKits.read(StudioIA.files).clips.some(c=>c.type==='video'));
     await page.evaluate(()=>{let c=StudioKits.read(StudioIA.files);c.clips=c.clips.filter(x=>x.type==='video');c.clips[0].duration=1;c.clips[0].trim=.5;c.clips[0].transition='cut';StudioMediaEditor.commit(StudioIA,c);});
     await page.waitForTimeout(1200);
     const frame=page.frames().find(f=>f.parentFrame());assert.ok(frame);
     await frame.getByRole('button',{name:'♪ Activar sonido',exact:true}).click();await frame.getByRole('button',{name:'▶ Reproducir',exact:true}).click();await page.waitForTimeout(300);
     await page.evaluate(()=>{window.__downloads=[];StudioIA.downloadBlob=(blob,name,type)=>{__downloads.push({name,size:blob.size,type});window.__exportBlob=blob;};});
     await page.locator('#ks-media-export').click();await page.waitForFunction(()=>window.__downloads?.length||(!StudioIA.busy&&document.getElementById('ks-media-notice').textContent.includes('no pudo')),null,{timeout:20000});
     const result=await page.evaluate(()=>({downloads:__downloads,notice:document.getElementById('ks-media-notice').textContent,errors:StudioIA.errors}));
     assert.equal(result.downloads.length,1,JSON.stringify(result));assert.ok(result.downloads[0].size>300);assert.match(result.downloads[0].type,/^video\/(webm|mp4)/);
     assert.ok(!result.errors.length,JSON.stringify(result));
     if(process.env.STUDIO_EXPORT_DIR){const bytes=await page.evaluate(async()=>Array.from(new Uint8Array(await __exportBlob.arrayBuffer())));fs.writeFileSync(path.join(process.env.STUDIO_EXPORT_DIR,'creative-test-export.webm'),Buffer.from(bytes));}
     const exported=Buffer.from(await page.evaluate(async()=>Array.from(new Uint8Array(await __exportBlob.arrayBuffer()))));
     await page.locator('#km-video').setInputFiles({name:'mi-video-editado.webm',mimeType:'video/webm',buffer:exported});
     await page.waitForFunction(()=>!StudioIA.busy&&StudioKits.read(StudioIA.files).clips.length===2,null,{timeout:14000});
     assert.equal(await page.evaluate(()=>StudioKits.read(StudioIA.files).clips[1].type),'video','El video exportado puede volver a editarse');
    }
    await page.evaluate(()=>StudioIA.showTab('home'));
    if(process.env.STUDIO_SCREENSHOT_DIR)await page.screenshot({path:path.join(process.env.STUDIO_SCREENSHOT_DIR,'creative-home-1280.png')});
    await page.addScriptTag({path:path.join(root,'js/club-crea-revision.js')});
    await page.evaluate(()=>Club.probarStudioRevision({id:'teacher-fixture',title:'Creación para revisar',content:{studio:{files:StudioIA.files,history:StudioIA.history}}}));
    await page.getByRole('button',{name:'Ver bitácora',exact:true}).click();
    assert.match(await page.locator('#sr-files pre').innerText(),/escenas/,'El docente puede leer la explicación del proyecto');
    await page.locator('#sr-close').click();
    if(videoPath){
     await page.evaluate(async()=>{await StudioIA.createKit('animation');const cfg=StudioKits.read(StudioIA.files);cfg.duration=2;StudioMediaEditor.commit(StudioIA,cfg);window.__downloads=[];});
     await page.frameLocator('#ks-frame').locator('#media-canvas').waitFor({state:'visible'});
     if(process.env.STUDIO_SCREENSHOT_DIR)await page.screenshot({path:path.join(process.env.STUDIO_SCREENSHOT_DIR,'creative-animation-1280.png')});
     await page.locator('#ks-media-export').click();await page.waitForFunction(()=>window.__downloads.length===1,null,{timeout:12000});
     assert.ok((await page.evaluate(()=>__downloads[0].size))>300,'Animación exportada');
     assert.equal(await page.evaluate(()=>StudioIA.errors.length),0,'Animación sin errores de ejecución');
     // Cancelar conserva la edición y descarta la descarga parcial.
     await page.locator('#ks-media-export').click();await page.locator('#ks-media-cancel').click();
     assert.equal(await page.evaluate(()=>StudioIA.busy),false);assert.equal(await page.evaluate(()=>__downloads.length),1);
    }
    await page.evaluate(()=>window.__creativeFinish=true);await page.waitForFunction(()=>document.body.dataset.creativeSmoke,null,{timeout:30000});
    assert.equal(await page.evaluate(()=>document.body.dataset.creativeSmoke),'PASS');
   }finally{await browser.close();}
  }else{
   if(!binary)for(const name of ['google-chrome','google-chrome-stable','chromium','chromium-browser'])if(cp.spawnSync(name,['--version'],{encoding:'utf8',timeout:3000}).status===0){binary=name;break;}
   assert.ok(binary,'Chromium no instalado');html=html.replace('window.__creativePhase=\'video\';','window.__creativeFinish=true;window.__creativePhase=\'video\';');fs.writeFileSync(file,html);
   const run=cp.spawnSync(binary,['--headless=new','--no-sandbox','--no-zygote','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--window-size=1280,900','--virtual-time-budget=40000','--dump-dom','file://'+file],{encoding:'utf8',timeout:60000,maxBuffer:7e6});
   assert.equal(run.status,0,(run.stderr||'').slice(-1000));assert.match(run.stdout,/data-creative-smoke="PASS"/,run.stdout.slice(-3500));
  }
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
 console.log('PASS navegador: talleres, animación, poses, montaje, recortes, bitácora, privacidad, recuperación, 3D y exportación cuando hay original de prueba.');
})().catch(e=>{console.error(e);process.exitCode=1});
