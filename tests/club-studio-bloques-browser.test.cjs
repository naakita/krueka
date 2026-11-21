/* Smoke real del taller: sesión del alumno -> bloques -> prueba -> guardado -> recuperación -> aislamiento. */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),cp=require('node:child_process'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const prior=fs.readFileSync(path.join(__dirname,'studio-classroom-browser.test.cjs'),'utf8');
const setup=vm.runInNewContext(prior.match(/const setup=(`[^]*?`);\nconst smoke=/)[1]);
const smoke=`<script>
const checks=[];function check(ok,name){if(!ok)checks.push(name);}
async function until(fn){const deadline=Date.now()+22000;while(!fn()){if(Date.now()>deadline)throw Error('Espera agotada: '+checks.join(' | '));await new Promise(r=>setTimeout(r,30));}}
(async()=>{
 await until(()=>window.KruekaStudioAccess?.ready);await KruekaStudioAccess.login('TEST01');
 check(StudioIA.tab==='home','talleres iniciales');
 check(document.querySelector('[data-creative-start="visual-blocks"]')!=null,'nueva ruta de bloques');
 document.querySelector('[data-creative-start="visual-blocks"]').click();
 await until(()=>StudioBloques.isBlocks(StudioIA)&&!StudioIA.busy&&StudioIA.tab==='bloques');
 check(!document.getElementById('kb-shell').hidden,'editor visual visible');
 check(!!document.querySelector('#kb-preview #ks-frame'),'juego visible en la misma página');
 check(document.getElementById('ks-frame').getAttribute('sandbox').includes('allow-scripts'),'iframe aislado');
 document.querySelector('[data-lane="flechas"]').click();
 document.querySelector('[data-group="Movimiento"]').click();
 [...document.querySelectorAll('#kb-items button')].find(b=>b.textContent==='Mover pasos').click();
 check(JSON.parse(StudioIA.files['bloques.json']).events.flechas.length===2,'se agrega un bloque');
 const inputs=document.querySelectorAll('#kb-steps input[type="number"]');const input=inputs[inputs.length-1];input.value='72';input.dispatchEvent(new Event('change',{bubbles:true}));
 check(JSON.parse(StudioIA.files['bloques.json']).events.flechas[1].value===72,'se modifica un bloque');
 document.getElementById('kb-goal').value='2';document.getElementById('kb-goal').dispatchEvent(new Event('change',{bubbles:true}));
 document.getElementById('kb-title').value='Mi aventura en el Club';document.getElementById('kb-title').dispatchEvent(new Event('change',{bubbles:true}));
 check(StudioIA.files['index.html'].includes('Mi aventura en el Club'),'título visible en el juego');
 check(JSON.parse(StudioIA.files['bloques.json']).goal===2,'meta guardable');
 await StudioIA.save();
 const saved=StudioIA.projectId;
 check(__backend.projects.some(p=>p.id===saved&&p.files['bloques.json']),'proyecto persistido por RPC');
 await StudioIA.close();await KruekaStudioAccess.login('TEST01');
 check(StudioIA.projectId===saved,'recuperación desde la nube');
 document.getElementById('kc-resume').click();
 check(StudioIA.tab==='bloques'&&!document.getElementById('kb-shell').hidden,'reanudación en editor visual');
 check(JSON.parse(StudioIA.files['bloques.json']).events.flechas[1].value===72,'bloques conservados');
 await StudioIA.close();await KruekaStudioAccess.login('TEST02');
 check(!StudioBloques.isBlocks(StudioIA),'otro alumno sin acceso al proyecto');
 await StudioIA.close();
 document.body.dataset.bloquesSmoke=checks.length===0?'PASS':'FAIL '+checks.join(' | ');
})().catch(e=>{document.body.dataset.bloquesSmoke='FAIL '+e.stack});
</script>`;
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'krueka-bloques-')),file=path.join(directory,'index.html');
let html=fs.readFileSync(path.join(root,'studio.html'),'utf8').replace('<head>','<head><base href="file://'+root+'/">'+setup).replace('</body>',smoke+'</body>');
(async()=>{
 try{
  fs.writeFileSync(file,html);
  let binary=process.env.STUDIO_CHROMIUM;
  if(process.env.STUDIO_USE_PLAYWRIGHT==='1'){
   const browser=await require('playwright').chromium.launch({headless:true,executablePath:binary,args:['--no-sandbox','--no-zygote','--disable-dev-shm-usage']});
   try{
    const page=await browser.newPage({viewport:{width:1280,height:900}});await page.goto('file://'+file);
    await page.waitForFunction(()=>document.body.dataset.bloquesSmoke,null,{timeout:40000});
    assert.equal(await page.evaluate(()=>document.body.dataset.bloquesSmoke),'PASS');
    if(process.env.STUDIO_SCREENSHOT_DIR)await page.screenshot({path:path.join(process.env.STUDIO_SCREENSHOT_DIR,'club-bloques-1280.png')});
   }finally{await browser.close();}
  }else{
   if(!binary)for(const name of ['google-chrome','google-chrome-stable','chromium','chromium-browser'])if(cp.spawnSync(name,['--version'],{encoding:'utf8',timeout:3000}).status===0){binary=name;break;}
   assert.ok(binary,'Chromium no instalado');
   const run=cp.spawnSync(binary,['--headless=new','--no-sandbox','--no-zygote','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--window-size=1280,900','--virtual-time-budget=40000','--dump-dom','file://'+file],{encoding:'utf8',timeout:60000,maxBuffer:8e6});
   assert.equal(run.status,0,(run.stderr||'').slice(-1200));
   assert.match(run.stdout,/data-bloques-smoke="PASS"/,run.stdout.slice(-4000));
  }
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
 console.log('PASS navegador: creación con bloques, acciones, vista previa, guardado, recuperación y aislamiento por alumno.');
})().catch(e=>{console.error(e);process.exitCode=1});
