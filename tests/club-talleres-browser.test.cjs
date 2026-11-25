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
const selectors=['pabellon-juego','pabellon-cine','arcade-web','blogs','historietas','cuentos','libros','dramas','animes','flyers','dibujos','animation','video-edit','pagina-web','aplicacion-web'];
(async()=>{
 document.body.dataset.clubTest='Esperando el taller';
 await until(()=>window.KruekaStudioAccess?.ready);
 const backendFetch=window.fetch;
 const photo=new Blob([Uint8Array.from(atob('UklGRh4AAABXRUJQVlA4TBEAAAAvD8ABAAdQsl6Up/+BiOh/AAA='),c=>c.charCodeAt(0))],{type:'image/webp'});
 let photoLoads=0;
 window.fetch=(url,...args)=>{
  if(String(url).includes('/functions/v1/krueka-studio-ai')&&args[0]?.body){
   const body=JSON.parse(args[0].body);
   if(body.action==='ai'&&body.studioContext){
    window.lastProjectRequest=body;
    const files={};
    if(body.mode==='build'&&body.files['obra.json']){
     const work=JSON.parse(body.files['obra.json']);work.panels[0].text='Revisión del alumno';files['obra.json']=JSON.stringify(work);
    }
    if(body.mode==='build'&&body.files['escenas.json']){
     const media=JSON.parse(body.files['escenas.json']);(media.actors||media.clips)[0][media.actors?'name':'title']='Estrella nueva';files['escenas.json']=JSON.stringify(media);
    }
    return Promise.resolve(new Response(JSON.stringify({ok:true,summary:'Evaluación de prueba',test:'Abrí la vista previa',files,ai:{ready:true,provider:'Cloudflare',configured:true}})));
   }
   if(body.action==='image')return Promise.resolve(new Response(JSON.stringify({ok:true,image:'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvD8ABAAdQsl6Up/+BiOh/AAA=',ai:{ready:true,provider:'Cloudflare',configured:true}})));
  }
  if(String(url).endsWith('/assets/club/laguna-atardecer.webp')){photoLoads++;return Promise.resolve(new Response(photo));}
  return backendFetch(url,...args);
 };
 await KruekaStudioAccess.login('TEST01');
 verify(StudioIA.cloudReady,'ingreso');
 const home=document.getElementById('ks-creative-home');
 home.querySelector('[data-kc-filter="Escribir"]').click();
 verify(home.querySelectorAll('.kc-path:not([hidden])').length===4,'filtro de escritura');
 home.querySelector('[data-kc-filter="Todos"]').click();
 const projects=[];
 for(const id of selectors){
  document.body.dataset.clubTest='Probando '+id;
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
   if(id!=='dibujos'){
    work.querySelector('[data-section="assets"]').click();
    const art=work.querySelector('.ct-cover-art');
    verify(art&&art.hidden===false,'ArteLab para portada '+id);
    art.querySelector('summary').click();
    art.querySelector('[data-tab="objetos"]').click();
    const input=art.querySelector('[aria-label="Texto para colocar en el dibujo"]');
    input.value='Portada del taller';input.nextElementSibling.click();
    verify(art.open&&StudioIA.files['index.html'].includes('>Portada del taller</text>'),'ilustración en portada '+id);
    work.querySelector('[data-section="content"]').click();
   }
   if(id==='historietas'){
    const scene=work.querySelector('.ck-scene:not([hidden])');
    [...scene.querySelectorAll('button')].find(b=>b.textContent==='Duplicar').click();
    verify(work.querySelector('#ck-part').selectedIndex===1&&work.querySelectorAll('.ck-scene').length===4,'duplicar viñeta');
    document.getElementById('ks-undo').click();
   }
   input.value='Auditoría '+id;
   input.dispatchEvent(new Event('input',{bubbles:true}));
   if(id==='libros'){
    StudioIA.updateAI({ready:true,provider:'Cloudflare',configured:true});
    StudioIA.showTab('club-work');
    const imageTools=[...work.querySelectorAll('details')].find(x=>x.querySelector('summary')?.textContent==='Crear una ilustración con IA');
    verify(imageTools,'ilustrador integrado');
    const field=imageTools.querySelector('textarea');field.value='Un lapacho en flor';
    const [generate,use]=imageTools.querySelectorAll('button');const originalCover=JSON.parse(StudioIA.files['obra.json']).tools?.images?.cover;
    await generate.onclick();
    verify(!use.hidden&&imageTools.querySelector('img').src.startsWith('data:image/webp'),'previsualizar ilustración');
    verify(JSON.parse(StudioIA.files['obra.json']).tools?.images?.cover===originalCover,'aceptar la ilustración antes de cambiar la obra');
    use.click();verify(JSON.parse(StudioIA.files['obra.json']).tools.images.cover.startsWith('data:image/webp'),'aplicar portada');
    const manuscript=work.querySelector('[name="panel-text-0"]');
    verify(manuscript&&work.querySelectorAll('.ck-scene').length===1&&document.getElementById('ck-add-part').hidden,'manuscrito continuo');
    manuscript.value='Primer párrafo. '.repeat(120)+'\\n\\nSegundo párrafo. '.repeat(100);
    manuscript.dispatchEvent(new Event('input',{bubbles:true}));
    verify(StudioIA.files['index.html'].includes('Segundo párrafo.')&&StudioIA.files['index.html'].includes('ck-manuscript-leaf'),'libro completo paginado');
   }
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
   if(['blogs','cuentos','libros','dramas'].includes(id)){
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
   if(id==='pabellon-juego'){
    const panel=document.querySelector('#ks-create .kg-prompt-panel');
    verify(panel,'ficha de prompts en el juego');
    panel.querySelector('button').click();
    const prompt=panel.querySelector('[readonly]').value;
    verify(prompt.includes('function move(dt)')&&prompt.includes('velocidad al caminar'),'pedido de programación con el código real');
    const choose=(name,value)=>{const input=panel.querySelector('[name='+name+']');input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));};
    choose('model','carrera');choose('lesson','vuelta');choose('route','Pista del aula: tres puertas y meta en el puente.');
    verify(panel.querySelector('[readonly]').value.includes('posición anterior y nueva')&&panel.querySelector('[readonly]').value.includes('meta en el puente'),'pedido con trazado y cruce de puertas');
    choose('model','misterio');verify(!panel.querySelector('[readonly]').value.includes('meta en el puente'),'trazado sólo en la carrera');
    choose('model','carrera');
    const log=panel.querySelector('[name=done]');log.value='Verifiqué el giro con ambas flechas.';log.dispatchEvent(new Event('input',{bubbles:true}));
    const stage=panel.querySelector('[name=stage]');stage.value='retomar';stage.dispatchEvent(new Event('input',{bubbles:true}));
    verify(panel.querySelector('[readonly]').value.includes(log.value),'retomar con prueba confirmada');
   }
   const editor=document.querySelector('#ks-create form');
   verify(editor&&StudioIA.tab==='create','editor 3D '+id);
   editor.elements.title.value='Pabellón de prueba';editor.elements.light.value='noche';
   if(id==='pabellon-cine')editor.elements.plano0.value='planetario';
   editor.querySelector('button').click();
   verify(StudioKits.read(StudioIA.files).light==='noche','guardar luz 3D');
   const preview=document.createElement('iframe');preview.style.cssText='position:fixed;top:0;left:0;border:0;width:1574px;height:718px';document.body.append(preview);
   const ready=new Promise(done=>preview.onload=done);
   preview.srcdoc=StudioIA.buildPreview.call({files:StudioIA.files,dirname:StudioIA.dirname,resolve:StudioIA.resolve},'index.html');
   await ready;
   const doc=preview.contentDocument;
   verify(doc.querySelector('#titulo').textContent==='Pabellón de prueba'&&doc.querySelector('#luz').value==='noche','lectura independiente del proyecto');
   const vista=doc.querySelector('#vista');
   verify(vista.clientWidth===1574&&vista.width>=vista.clientWidth,'resolución de pantalla en el pabellón '+vista.clientWidth+' / '+vista.width);
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
  if(id==='libros'){
   const field=document.querySelector('[name="panel-text-0"]');field.setSelectionRange(0,6);field.dispatchEvent(new Event('select',{bubbles:true}));
   const picked=ClubProjectChat.inspect(StudioIA);verify(picked.selection&&JSON.parse(picked.files['obra.json']).panels[0].text===field.value.slice(0,6),'leer sólo el fragmento elegido');
   const part=JSON.parse(picked.files['obra.json']);part.panels[0].text='Inicio';
   const next=picked.apply({'obra.json':JSON.stringify(part)});
   verify(JSON.parse(next['obra.json']).panels[0].text==='Inicio'+field.value.slice(6),'editar sólo el fragmento elegido');
   ClubProjectChat.resetSelection();
  }
  StudioIA.showTab('ai');StudioIA.updateAI({ready:true,configured:true,provider:'Cloudflare'});StudioIA.renderAIStatus();
  const review=document.querySelector('#ks-project-context button');verify(review,'chat del proyecto '+id);
  window.lastProjectRequest=null;await review.onclick();
  verify(window.lastProjectRequest?.projectId===StudioIA.projectId&&lastProjectRequest.mode==='plan','revisión con el proyecto abierto '+id);
  verify(!JSON.stringify(lastProjectRequest.files).includes('base64,'),'sin adjuntos privados '+id);
  if(id==='libros'||id==='animation'||id==='video-edit'){
   const previous=JSON.stringify(StudioIA.files);StudioIA.setMode('build');document.getElementById('ks-prompt').value='Cambiá esta parte';await StudioIA.send();
   if(id==='libros')verify(StudioIA.files['index.html'].includes('Revisión del alumno')&&JSON.parse(StudioIA.files['obra.json']).tools.images.cover,'obra y portada conservadas');
   else verify(JSON.stringify(StudioKits.read(StudioIA.files)).includes('Estrella nueva'),'edición de la escena '+id);
   StudioIA.restore();verify(JSON.stringify(StudioIA.files)===previous,'deshacer '+id);
  }
  verify(await StudioIA.save(),'guardar '+id);
  projects.push(StudioIA.projectId);
  StudioIA.showTab('home');
 }
 for(let i=0;i<projects.length;i++){
  await StudioIA.switchProject(projects[i]);
  verify(StudioIA.projectId===projects[i]&&StudioIA.files['index.html'],'reabrir '+selectors[i]);
  if(selectors[i]==='libros')verify(JSON.parse(StudioIA.files['obra.json']).tools.images.cover.startsWith('data:image/webp'),'recuperar portada generada');
  if(selectors[i]==='pabellon-juego'){
   const note=JSON.parse(StudioIA.files['ficha-programacion-3d.json']);verify(note.stage==='retomar'&&note.done.includes('ambas flechas')&&note.lesson==='vuelta'&&note.route.includes('meta en el puente'),'recuperar ficha en su proyecto');
  }else verify(!StudioIA.files['ficha-programacion-3d.json'],'fichas aisladas por proyecto');
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
 console.log('PASS: ingreso simulado, talleres con libro continuo, juego y cine 3D, edición, vista previa, guardado y recuperación.');
}finally{fs.rmSync(directory,{recursive:true,force:true});}
