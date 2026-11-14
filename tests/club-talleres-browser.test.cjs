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
const selectors=['arcade-web','blogs','historietas','cuentos','dramas','animes','flyers','dibujos','animation','video-edit','pagina-web','aplicacion-web'];
(async()=>{
 await until(()=>window.KruekaStudioAccess?.ready);
 await KruekaStudioAccess.login('TEST01');
 verify(StudioIA.cloudReady,'ingreso');
 const projects=[];
 for(const id of selectors){
  const tile=document.querySelector('[data-creative-start="'+id+'"]');
  verify(tile,'acceso '+id);
  const old=StudioIA.projectId;
  tile.click();
  await until(()=>StudioIA.projectId!==old&&!StudioIA.busy);
  const creative=ClubKrueka.isCreative(StudioIA);
  if(creative){
   const input=document.querySelector('#ck-form [name=title]');
   verify(input&&document.getElementById('ks-club-work').hidden===false,'editor de '+id);
   input.value='Auditoría '+id;
   input.dispatchEvent(new Event('input',{bubbles:true}));
   if(id==='cuentos'||id==='dramas'){
    document.getElementById('ck-add-part').click();
    const body=document.querySelector('[name=panel-text-3]');
    verify(body&&body.maxLength===-1,'parte adicional libre');
    body.value='Texto de prueba. '.repeat(1000)+' FIN DE LA OBRA';
    body.dispatchEvent(new Event('input',{bubbles:true}));
    verify(StudioIA.files['index.html'].includes('FIN DE LA OBRA'),'vista previa completa');
    verify(!document.getElementById('ks-frame').classList.contains('off'),'vista previa visible');
   }
  }
  if(creative){
   document.querySelector('#ck-test').click();
   const frame=document.querySelector('#ks-frame');
   verify(!frame.classList.contains('off')&&frame.srcdoc.includes('Auditoría '+id),'Ver mi obra '+id);
   verify(document.querySelector('.ks-preview-label').textContent==='Tu obra','etiqueta de '+id);
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
 console.log('PASS: ingreso simulado, 12 talleres, edición, bloques, vista previa, guardado y recuperación.');
}finally{fs.rmSync(directory,{recursive:true,force:true});}
