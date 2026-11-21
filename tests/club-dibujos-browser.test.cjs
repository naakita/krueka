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
