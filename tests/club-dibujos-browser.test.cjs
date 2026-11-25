/* Taller Dibujos: láminas pintables, pinceles, objetos, figuras 3D y recuperación. */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),cp=require('node:child_process'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const prior=fs.readFileSync(path.join(__dirname,'studio-classroom-browser.test.cjs'),'utf8');
const setup=vm.runInNewContext(prior.match(/const setup=(`[^]*?`);\nconst smoke=/)[1]);
const smoke=`<script>
const problems=[];function check(ok,name){if(!ok)problems.push(name)}
async function until(fn){const deadline=Date.now()+30000;while(!fn()){if(Date.now()>deadline)throw Error('Tiempo agotado');await new Promise(r=>setTimeout(r,30));}}
(async()=>{
 await until(()=>window.KruekaStudioAccess?.ready);
 await KruekaStudioAccess.login('TEST01');
 const tile=document.querySelector('[data-creative-start="dibujos"]');check(!!tile,'tarjeta Dibujos');tile.click();
 await until(()=>StudioIA.tab==='club-work'&&!StudioIA.busy);
 const work=document.getElementById('ks-club-work'),box=work.querySelector('.ct-art-lab'),canvas=box?.querySelector('canvas');
 check(!!box&&!!canvas,'lienzo de dibujo visible');
 canvas.setPointerCapture=()=>{};
 const get=()=>JSON.parse(StudioIA.files['obra.json']).tools;
 const clickTab=id=>box.querySelector('[data-tab="'+id+'"]').click();
 const point=(type,x,y)=>{const r=canvas.getBoundingClientRect();canvas.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:1,clientX:r.left+x*r.width/600,clientY:r.top+y*r.height/320}));};
 clickTab('colorear');
 check(box.querySelectorAll('[data-template]').length>=9,'láminas para colorear');
 box.querySelector('[data-template="casa"]').click();
 check(get().coloringPage==='casa','lámina casa seleccionada');
 box.querySelector('[data-color="#e94356"]').click();
 point('pointerdown',160,242);
 check(get().templateColors.pared==='#e94356','zona de la casa coloreada');
 clickTab('figuras');box.querySelector('[data-draw-tool="star"]').click();
 const fill=box.querySelector('.ct-lab-checkbox input');fill.checked=true;fill.dispatchEvent(new Event('change',{bubbles:true}));
 point('pointerdown',60,45);point('pointermove',140,130);point('pointerup',140,130);
 check(get().strokes.at(-1)?.type==='star'&&get().strokes.at(-1)?.fill,'estrella rellena guardada');
 clickTab('pintar');box.querySelector('[data-brush="marker"]').click();
 point('pointerdown',40,210);point('pointermove',65,220);point('pointermove',120,235);point('pointerup',120,235);
 check(get().strokes.at(-1)?.style==='marker','marcador disponible');
 clickTab('objetos');
 const cat=[...box.querySelectorAll('.ct-lab-stickers button')].find(b=>b.textContent==='🐱');cat.click();
 const feline=get().stamps.find(o=>o.text==='🐱');check(!!feline,'gato agregado');
 point('pointerdown',feline.x,feline.y);point('pointermove',feline.x+60,feline.y+35);point('pointerup',feline.x+60,feline.y+35);
 check(get().stamps.find(o=>o.id===feline.id).x===feline.x+60,'objeto movido en el lienzo');
 const size=box.querySelector('[data-object-size]');size.value='1.6';size.dispatchEvent(new Event('change',{bubbles:true}));
 check(get().stamps.find(o=>o.id===feline.id).scale===1.6,'objeto redimensionado');
 clickTab('3d');
 const cube=[...box.querySelectorAll('.ct-lab-models button')].find(b=>b.textContent.includes('Cubo'));cube.click();
 check(get().stamps.some(o=>o.kind==='cube'),'cubo con volumen agregado');
 check(StudioIA.files['index.html'].includes('class="ck-art"')&&StudioIA.files['index.html'].includes('fill="#e94356"'),'vista previa incorpora ilustración y pintura');
 const beforeUndo=get().stamps.length;box.querySelector('.ct-lab-actions button:nth-last-child(3)').click();
 check(get().stamps.length===beforeUndo-1,'deshacer objeto');
 box.querySelector('.ct-lab-actions button:nth-last-child(2)').click();
 check(get().stamps.length===beforeUndo,'rehacer objeto');
 clickTab('figuras');box.querySelector('[data-draw-tool="rectangle"]').click();
 const noFill=box.querySelector('[data-draw-panel="figuras"] .ct-lab-checkbox input');noFill.checked=false;noFill.dispatchEvent(new Event('change',{bubbles:true}));
 point('pointerdown',170,30);point('pointermove',230,100);point('pointerup',230,100);
 clickTab('colorear');box.querySelector('[data-color="#38a8ef"]').click();
 point('pointerdown',200,55);
 check(get().strokes.at(-1).fillColor==='#38a8ef'&&get().strokes.at(-1).color==='#e94356','relleno separado del contorno');
 check(StudioIA.files['index.html'].includes('fill="#38a8ef" stroke="#e94356"'),'relleno publicado sin cambiar el contorno');
 box.querySelector('[data-undo-art]').click();
 check(!get().strokes.at(-1).fill,'deshacer el relleno');
 box.querySelector('[data-redo-art]').click();
 check(get().strokes.at(-1).fillColor==='#38a8ef','rehacer el relleno');
 clickTab('objetos');
 const textField=box.querySelector('[aria-label="Texto para colocar en el dibujo"]');
 textField.value='Primera etiqueta';textField.nextElementSibling.click();
 const textObject=get().stamps.find(o=>o.kind==='text');
 const picker=box.querySelector('[data-object-picker]');picker.value=textObject.id;picker.dispatchEvent(new Event('change',{bubbles:true}));
 const titleField=box.querySelector('[data-object-text]');titleField.value='Mi etiqueta';titleField.dispatchEvent(new Event('change',{bubbles:true}));
 const recolor=box.querySelector('[data-object-color]');recolor.value='#112233';recolor.dispatchEvent(new Event('change',{bubbles:true}));
 box.querySelector('[data-object-back]').click();
 check(get().stamps[0].id===textObject.id&&get().stamps[0].text==='Mi etiqueta'&&get().stamps[0].color==='#112233','editar, recolorear y enviar atrás');
 box.querySelector('[data-object-front]').click();
 check(get().stamps.at(-1).id===textObject.id,'traer adelante');
 canvas.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',shiftKey:true}));
 check(get().stamps.at(-1).x===textObject.x+10,'mover con el teclado');
 box.querySelector('[data-object-copy]').click();
 check(get().stamps.at(-1).id!==textObject.id&&get().stamps.at(-1).text==='Mi etiqueta','duplicar sin perder el original');
 box.querySelector('[data-object-delete]').click();
 check(get().stamps.filter(o=>o.kind==='text').length===1,'quitar sólo la copia');
 clickTab('pintar');box.querySelector('[data-brush="airbrush"]').click();
 const opacity=box.querySelector('[aria-label="Opacidad del pincel"]');opacity.value='60';opacity.dispatchEvent(new Event('change',{bubbles:true}));
 const smooth=box.querySelector('[aria-label="Estabilizador del trazo"]');smooth.value='60';smooth.dispatchEvent(new Event('change',{bubbles:true}));
 clickTab('capas');box.querySelector('[data-layer="details"]').click();
 const mirror=box.querySelector('[data-draw-panel="capas"] .ct-lab-checkbox input');mirror.checked=true;mirror.dispatchEvent(new Event('change',{bubbles:true}));
 const guide=box.querySelector('[aria-label="Guías del lienzo"]');guide.value='grid';guide.dispatchEvent(new Event('change',{bubbles:true}));
 check(get().activeLayer==='details'&&get().mirror&&get().guide==='grid','capas, espejo y cuadrícula');
 clickTab('pintar');box.querySelector('[data-color="#a35cd6"]').click();
 point('pointerdown',430,275);point('pointermove',455,285);point('pointermove',480,300);point('pointerup',480,300);
 check(get().strokes.at(-1)?.layer==='details'&&get().strokes.at(-1)?.mirror&&get().strokes.at(-1)?.opacity===.6&&get().strokes.at(-1)?.smooth===60,'aerógrafo en capa con transparencia y simetría');
 check(StudioIA.files['index.html'].includes('translate(600 0) scale(-1 1)'),'espejo en la vista previa');
 clickTab('capas');box.querySelector('[data-visible-layer="details"]').click();
 check(get().layerVisibility.details===false&&!StudioIA.files['index.html'].includes('stroke="#a35cd6"'),'ocultar capa sin borrar trazos');
 box.querySelector('[data-visible-layer="details"]').click();
 check(get().layerVisibility.details===true&&StudioIA.files['index.html'].includes('stroke="#a35cd6"'),'mostrar capa devuelve trazos');
 clickTab('pintar');box.querySelector('[data-draw-tool="picker"]').click();point('pointerdown',175,215);
 check(get().ink==='#e94356','cuentagotas toma un color pintado');
 const gradient=box.querySelector('[aria-label="Fondo degradado"]');gradient.value='oceano';gradient.dispatchEvent(new Event('change',{bubbles:true}));
 check(get().backgroundGradient==='oceano'&&StudioIA.files['index.html'].includes('linearGradient id="ck-art-gradient"'),'fondo degradado en el editor y la vista previa');
 clickTab('capas');const radial=box.querySelector('[aria-label="Simetría radial para mandalas"]');radial.value='4';radial.dispatchEvent(new Event('change',{bubbles:true}));
 clickTab('pintar');box.querySelector('[data-color="#18b8a0"]').click();
 point('pointerdown',395,70);point('pointermove',420,100);point('pointermove',440,110);point('pointerup',440,110);
 check(get().strokes.at(-1)?.radialSymmetry===4&&StudioIA.files['index.html'].includes('rotate(90 300 160)'),'mandala de cuatro brazos visible en la obra');
 clickTab('capas');box.querySelector('[data-lock-layer="details"]').click();
 const strokesBeforeLock=get().strokes.length;
 clickTab('pintar');point('pointerdown',440,100);point('pointermove',480,120);point('pointerup',480,120);
 check(get().layerLocked.details===true&&get().strokes.length===strokesBeforeLock,'capa bloqueada impide pintar accidentalmente');
 clickTab('capas');box.querySelector('[data-lock-layer="details"]').click();
 check(get().layerLocked.details===false,'capa desbloqueada sin pérdida de trazos');
 const photoCanvas=document.createElement('canvas');photoCanvas.width=64;photoCanvas.height=64;photoCanvas.getContext('2d').fillRect(0,0,64,64);
 const photoBlob=await new Promise(ok=>photoCanvas.toBlob(ok,'image/png'));
 const imageInput=box.querySelector('.ct-lab-text input[type="file"]'),transfer=new DataTransfer();
 transfer.items.add(new File([photoBlob],'ilustracion.png',{type:'image/png'}));imageInput.files=transfer.files;
 imageInput.dispatchEvent(new Event('change',{bubbles:true}));
 await until(()=>Object.keys(get().drawingImages).length===1);
 check(get().stamps.some(o=>o.kind==='image')&&StudioIA.files['index.html'].includes('href="data:image/webp;base64,'),'imagen propia insertada sin descarga');
 const expand=box.querySelector('.ct-lab-expand');expand.click();check(box.classList.contains('ct-canvas-expanded'),'lienzo ampliado');expand.click();check(!box.classList.contains('ct-canvas-expanded'),'volver al taller');
 await StudioIA.save();const project=StudioIA.projectId,expected=get();
 await StudioIA.close();await KruekaStudioAccess.login('TEST01');
 const restored=JSON.parse(StudioIA.files['obra.json']).tools;
 check(StudioIA.projectId===project&&restored.coloringPage==='casa'&&restored.templateColors.pared==='#e94356','lámina coloreada recuperada');
 check(restored.stamps.length===expected.stamps.length&&restored.strokes.length===expected.strokes.length&&Object.keys(restored.drawingImages).length===1,'objetos, imágenes y pinceladas recuperados');
 check(restored.layerVisibility.details&&restored.activeLayer==='details'&&restored.opacity===.6&&restored.guide==='grid','nuevas herramientas recuperadas al ingresar');
 check(restored.backgroundGradient==='oceano'&&restored.radialSymmetry===4&&!restored.layerLocked.details&&restored.strokes.at(-1)?.radialSymmetry===4,'degradado, mandala y capas recuperados de la nube');
 await StudioIA.close();
 document.body.dataset.dibujosSmoke=problems.length?'FAIL '+problems.join(' | '):'PASS';
})().catch(e=>{document.body.dataset.dibujosSmoke='FAIL '+e.stack});
</script>`;
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'krueka-dibujos-')),file=path.join(directory,'index.html');
const html=fs.readFileSync(path.join(root,'club-krueka.html'),'utf8').replace('<head>','<head><base href="file://'+root+'/">'+setup).replace('</body>',smoke+'</body>');
(async()=>{
 try{
  fs.writeFileSync(file,html);
  let binary=process.env.STUDIO_CHROMIUM;
  if(process.env.STUDIO_USE_PLAYWRIGHT==='1'){
   const browser=await require('playwright').chromium.launch({headless:true,executablePath:binary,args:['--no-sandbox','--no-zygote','--disable-dev-shm-usage']});
   try{
    const page=await browser.newPage({viewport:{width:1280,height:900}});await page.goto('file://'+file);
    await page.waitForFunction(()=>document.body.dataset.dibujosSmoke,null,{timeout:70000});
    assert.equal(await page.evaluate(()=>document.body.dataset.dibujosSmoke),'PASS');
    if(process.env.STUDIO_SCREENSHOT_DIR)await page.screenshot({path:path.join(process.env.STUDIO_SCREENSHOT_DIR,'club-dibujos.png')});
   }finally{await browser.close();}
  }else{
   if(!binary)for(const cmd of ['google-chrome','google-chrome-stable','chromium','chromium-browser'])if(cp.spawnSync(cmd,['--version'],{encoding:'utf8',timeout:3000}).status===0){binary=cmd;break;}
   assert.ok(binary,'Chromium no instalado');
   const run=cp.spawnSync(binary,['--headless=new','--no-sandbox','--no-zygote','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--window-size=1280,900','--virtual-time-budget=56000','--dump-dom','file://'+file],{encoding:'utf8',timeout:74000,maxBuffer:8e6});
   assert.equal(run.status,0,(run.stderr||'').slice(-1200));assert.match(run.stdout,/data-dibujos-smoke="PASS"/,run.stdout.slice(-6000));
  }
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
 console.log('PASS navegador: láminas, coloreado, pinceles, figuras, objetos móviles, 3D, deshacer y nube.');
})().catch(e=>{console.error(e);process.exitCode=1});
