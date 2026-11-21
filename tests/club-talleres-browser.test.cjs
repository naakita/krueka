const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const vm=require('node:vm');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const fixture=fs.readFileSync(path.join(__dirname,'studio-classroom-browser.test.cjs'),'utf8');
const setup=vm.runInNewContext(fixture.match(/const setup=(`[^]*?`);\nconst smoke=/)[1]);
const exercise=`<script>
async function until(check){
 const deadline=Date.now()+25000;
 while(!check()){if(Date.now()>deadline)throw Error('Tiempo agotado');await new Promise(r=>setTimeout(r,20));}
}
function verify(ok,label){if(!ok)throw Error(label);}
async function tryBook(doc,width){
 const frame=document.createElement('iframe');
 frame.style.cssText='position:fixed;top:0;left:0;border:0;height:670px;width:'+width+'px';
 document.body.append(frame);
 const loaded=new Promise(resolve=>frame.onload=resolve);
 frame.srcdoc=doc;
 await loaded;
 try{
  const reader=frame.contentDocument;
  const sheet=reader.querySelector('.ck-spread'),prev=reader.querySelector('#ck-prev'),next=reader.querySelector('#ck-next');
  const leaves=[...sheet.querySelectorAll('.ck-leaf')],visible=()=>leaves.filter(leaf=>!leaf.hidden);
  const step=width>=740?2:1;
  verify(prev.disabled&&!next.disabled&&visible().length===step,'apertura del libro '+width);
  const folio=sheet.getBoundingClientRect(),corner=next.getBoundingClientRect();
  verify(corner.bottom<=frame.contentWindow.innerHeight,'esquina visible al abrir '+width);
  verify(Math.abs(folio.right-corner.right)<10&&Math.abs(folio.bottom-corner.bottom)<10&&corner.width>=44,'esquina inferior derecha');
  const sound=reader.querySelector('#ck-paper-sound');
  sound.click();verify(sound.getAttribute('aria-pressed')==='false','silenciar libro');
  next.click();
  verify(visible()[0]===leaves[step]&&!prev.disabled,'avanzar hoja '+width);
  const left=prev.getBoundingClientRect();
  verify(Math.abs(folio.left-left.left)<10&&Math.abs(folio.bottom-left.bottom)<10,'esquina inferior izquierda');
  prev.click();verify(visible()[0]===leaves[0],'volver a portada');
  const seen=new Set(visible());
  for(let i=0;i<leaves.length&&!next.disabled;i++){next.click();visible().forEach(leaf=>seen.add(leaf));}
  verify(next.disabled&&seen.size===leaves.length,'leer todas las hojas en orden');
 }finally{frame.remove();}
}
const selectors=['pabellon-juego','pabellon-cine','arcade-web','blogs','historietas','cuentos','dramas','animes','flyers','dibujos','animation','video-edit','pagina-web','aplicacion-web'];
(async()=>{
 await until(()=>window.KruekaStudioAccess?.ready);
 const backendFetch=window.fetch;
 const sample=document.createElement('canvas');sample.width=16;sample.height=8;
 const photo=await new Promise(done=>sample.toBlob(done,'image/webp'));
 let photoLoads=0;
 window.fetch=(url,...args)=>{
  if(String(url).endsWith('/assets/club/laguna-atardecer.webp')){photoLoads++;return Promise.resolve(new Response(photo));}
  return backendFetch(url,...args);
 };
 await KruekaStudioAccess.login('TEST01');
 verify(StudioIA.cloudReady,'ingreso');
 const home=document.getElementById('ks-creative-home');
 home.querySelector('[data-kc-filter="Escribir"]').click();
 verify(home.querySelectorAll('.kc-path:not([hidden])').length===3,'filtro de escritura');
 home.querySelector('[data-kc-filter="Todos"]').click();
 const projects=[];
 for(const id of selectors){
  let tile=document.querySelector('[data-creative-start="'+id+'"]');
  if(!tile&&['animation','arcade-web'].includes(id)){
   home.querySelector('[data-creative-path="'+(id==='animation'?'animaciones':'juegos')+'"]').click();
   tile=document.querySelector('[data-creative-kit="'+id+'"]');
  }
  verify(tile,'acceso '+id);
  const old=StudioIA.projectId;
  tile.click();
  await until(()=>StudioIA.projectId!==old&&!StudioIA.busy);
  const creative=ClubKrueka.isCreative(StudioIA);
  if(creative){
   const input=document.querySelector('#ck-form [name=title]');
   verify(input&&document.getElementById('ks-club-work').hidden===false,'editor de '+id);
   const work=document.getElementById('ks-club-work');
   verify(!work.querySelector('[data-pane="content"]').hidden,'herramienta principal '+id);
   if(id==='dibujos')verify(!!work.querySelector('#ck-draw-first canvas'),'lienzo a mano');
   for(const section of ['design','assets','content']){
    work.querySelector('[data-section="'+section+'"]').click();
    verify(!work.querySelector('[data-pane="'+section+'"]').hidden,'abrir '+section);
   }
   if(id==='historietas'){
    const scene=work.querySelector('.ck-scene:not([hidden])');
    [...scene.querySelectorAll('button')].find(b=>b.textContent==='Duplicar').click();
    verify(work.querySelector('#ck-part').selectedIndex===1&&work.querySelectorAll('.ck-scene').length===4,'duplicar viñeta');
    document.getElementById('ks-undo').click();
   }
   input.value='Auditoría '+id;
   input.dispatchEvent(new Event('input',{bubbles:true}));
   if(id==='cuentos'||id==='dramas'){
    document.getElementById('ck-add-part').click();
    const body=document.querySelector('[name=panel-text-3]');
    verify(body&&body.maxLength===-1,'parte adicional libre');
    body.value='Texto de prueba. '.repeat(1000)+' FIN DE LA OBRA';
    body.dispatchEvent(new Event('input',{bubbles:true}));
    verify(StudioIA.files['index.html'].includes('FIN DE LA OBRA'),'vista previa completa');
    const last=document.querySelector('#ck-scenes fieldset:last-child');
    last.querySelector('.ck-editor-actions button').click();
    verify(JSON.parse(StudioIA.files['obra.json']).panels[2].text.endsWith('FIN DE LA OBRA'),'reordenar '+id);
    document.querySelector('#ks-undo').click();
    verify(JSON.parse(StudioIA.files['obra.json']).panels[3].text.endsWith('FIN DE LA OBRA'),'deshacer orden '+id);
    verify(!document.getElementById('ks-frame').classList.contains('off'),'vista previa visible');
   }
  }
  if(creative){
   document.querySelector('#ck-test').click();
   const frame=document.querySelector('#ks-frame');
   verify(!frame.classList.contains('off')&&frame.srcdoc.includes('Auditoría '+id),'Ver mi obra '+id);
   verify(document.querySelector('.ks-preview-label').textContent==='Tu obra','etiqueta de '+id);
   if(['blogs','cuentos','dramas'].includes(id)){
    await tryBook(frame.srcdoc,980);
    await tryBook(frame.srcdoc,375);
   }
   if(id==='cuentos'){
    verify(frame.srcdoc.includes('ck-paper-sound')&&frame.srcdoc.includes('ck-turn-forward'),'sonido y giro');
    verify(frame.srcdoc.includes('data-continuacion'),'capítulo largo distribuido en hojas');
   }
   if(id==='animes')verify(frame.srcdoc.includes('ck-scene-play'),'reproductor de escenas');
  }
  if(id==='pagina-web'||id==='aplicacion-web'){
   verify(StudioIA.tab==='programacion','editor web');
   const panel=document.getElementById('kp-blocks');
   verify(panel&&!panel.hidden,'bloques HTML');
   const [head,menu]=panel.querySelectorAll('button');
   head.click();
   const transfer=new DataTransfer();
   menu.dispatchEvent(new DragEvent('dragstart',{dataTransfer:transfer,bubbles:true}));
   panel.querySelector('#kp-block-drop').dispatchEvent(new DragEvent('drop',{dataTransfer:transfer,bubbles:true,cancelable:true}));
   verify(StudioIA.files['index.html'].includes('Nuevo encabezado')&&StudioIA.files['index.html'].includes('Ir a la sección'),'clic y arrastre');
   [...panel.querySelectorAll('button')].find(button=>button.textContent==='Contador').click();
   verify(StudioIA.files['index.html'].includes('<output>0</output>'),'bloque interactivo '+id);
  }
  if(id.startsWith('pabellon-')){
   const editor=document.querySelector('#ks-create form');
   verify(editor&&StudioIA.tab==='create','editor 3D '+id);
   editor.elements.title.value='Pabellón de prueba';editor.elements.light.value='noche';
   if(id==='pabellon-cine')editor.elements.plano0.value='planetario';
   editor.querySelector('button').click();
   verify(StudioKits.read(StudioIA.files).light==='noche','guardar luz 3D');
   const preview=document.createElement('iframe');preview.style.cssText='width:1574px;height:718px';document.body.append(preview);
   const ready=new Promise(done=>preview.onload=done);
   preview.srcdoc=StudioIA.buildPreview.call({files:StudioIA.files,dirname:StudioIA.dirname,resolve:StudioIA.resolve},'index.html');
   await ready;
   const doc=preview.contentDocument;
   verify(doc.querySelector('#titulo').textContent==='Pabellón de prueba'&&doc.querySelector('#luz').value==='noche','lectura independiente del proyecto');
   verify(doc.querySelector('#vista').width>=1574,'resolución de pantalla en el pabellón');
   await until(()=>photoLoads===1&&!ClubTalleres.readingFiles(StudioIA.files)['paisaje.js'].includes('KRUEKA_LAGUNA_HD'));
   verify(!StudioIA.files['paisaje.js'].includes('KRUEKA_LAGUNA_HD'),'proyecto editable sin cambios por la vista HD');
   doc.querySelector('#accion').click();
   if(id==='pabellon-cine'){
    verify(doc.querySelector('#accion').textContent==='Pausar'&&doc.querySelector('#estado').textContent==='Detalle del planetario','reproducir primer plano editado');
    const seek=doc.querySelector('#tiempo');seek.value='8';seek.dispatchEvent(new Event('input'));
    verify(doc.querySelector('#estado').textContent==='Vuelo del ave'&&doc.querySelector('#reloj').textContent.includes('8.0'),'buscar segundo plano');
   }else{
    verify(!doc.querySelector('#mover').hidden&&doc.querySelector('#estado').textContent==='0 de 3 semillas','entrar al juego');
    doc.querySelector('#accion').click();verify(doc.querySelector('#mover').hidden,'salir del recorrido');
   }
   preview.remove();
  }
  if(id==='arcade-web')verify(StudioIA.tab==='programacion'&&StudioIA.files['index.html'].includes('<canvas'),'juego listo para probar');
  if(id==='animation'||id==='video-edit')verify(StudioKits.read(StudioIA.files)?.kind===id,'base de medios '+id);
  verify(await StudioIA.save(),'guardar '+id);
  projects.push(StudioIA.projectId);
  StudioIA.showTab('home');
 }
 for(let i=0;i<projects.length;i++){
  await StudioIA.switchProject(projects[i]);
  verify(StudioIA.projectId===projects[i]&&StudioIA.files['index.html'],'reabrir '+selectors[i]);
  if(selectors[i].startsWith('pabellon-'))verify(StudioKits.read(StudioIA.files).light==='noche','reabrir escena editada');
  if(['cuentos','dramas'].includes(selectors[i]))verify(JSON.parse(StudioIA.files['obra.json']).panels[3].text.endsWith('FIN DE LA OBRA'),'texto recuperado');
 }
 verify(__errors.length===0,__errors.join(' | '));
 document.body.dataset.clubTest='PASS';
})().catch(e=>{document.body.dataset.clubTest='FAIL '+e.message;});
</script>`;
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'club-talleres-'));
try{
 const file=path.join(directory,'index.html');
 const html=fs.readFileSync(path.join(root,'club-krueka.html'),'utf8')
  .replace('<head>','<head><base href="file://'+root+'/">'+setup)
  .replace('</body>',exercise+'</body>');
 fs.writeFileSync(file,html);
 const candidates=['google-chrome','google-chrome-stable','chromium','chromium-browser'];
 const binary=process.env.STUDIO_CHROMIUM||candidates.find(name=>spawnSync(name,['--version'],{timeout:3000}).status===0);
 assert.ok(binary,'Chromium no está instalado');
 const run=spawnSync(binary,['--headless=new','--no-sandbox','--no-zygote','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--window-size=1280,900','--virtual-time-budget=65000','--dump-dom','file://'+file],{encoding:'utf8',timeout:90000,maxBuffer:10e6});
 assert.equal(run.status,0,(run.stderr||'').slice(-1000));
 const outcome=run.stdout.match(/data-club-test="([^"]+)"/)?.[1];
 assert.equal(outcome,'PASS',outcome||'El recorrido no terminó');
 console.log('PASS: ingreso simulado, 12 talleres, juego y cine 3D, edición, bloques, vista previa, guardado y recuperación.');
}finally{fs.rmSync(directory,{recursive:true,force:true});}
