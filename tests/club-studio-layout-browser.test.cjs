/* Taller real en Chromium: herramientas superiores, vista previa amplia y continuidad de proyectos. */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),cp=require('node:child_process'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const prior=fs.readFileSync(path.join(__dirname,'studio-classroom-browser.test.cjs'),'utf8');
// Este recorrido comprueba preferencias persistentes. El test de Classroom conserva
// su propia simulación de Storage bloqueado para cubrir esa alternativa por separado.
const setup=vm.runInNewContext(prior.match(/const setup=(`[^]*?`);\nconst smoke=/)[1]).replace("Storage.prototype.getItem=Storage.prototype.setItem=Storage.prototype.removeItem=function(){throw Error('Almacenamiento bloqueado')};",'');
const smoke=`<script>
try{localStorage.removeItem('krueka.workspace.layout.v1')}catch(_e){}
const checks=[];function check(ok,name){if(!ok)checks.push(name)}
async function until(fn){const deadline=Date.now()+22000;while(!fn()){if(Date.now()>deadline)throw Error('Espera agotada');await new Promise(r=>setTimeout(r,35))}}
(async()=>{
 await until(()=>window.KruekaStudioAccess?.ready);
 await KruekaStudioAccess.login('TEST01');
 const panel=document.getElementById('krueka-studio');
 check(panel.classList.contains('kc-layout-compact'),'interfaz compacta activada');
 check(panel.querySelector('.ks-top > .ks-tabs')!=null,'herramientas de talleres arriba');
 check(panel.querySelector('.ks-top > #ks-projects')!=null,'proyectos arriba');
 check(panel.querySelector('.ks-top > .kc-workspace-actions')!=null,'menú de archivos arriba');
 check(panel.querySelector('.ks-projectbar #ks-import-file')!=null,'importación original intacta');
 StudioIA.showTab('ai');
 await until(()=>document.getElementById('ks-frame').getBoundingClientRect().height>100);
 const rect=document.getElementById('ks-frame').getBoundingClientRect();
 check(rect.width>=innerWidth*.46,'vista previa ancha');
 check(rect.height>=innerHeight*.7,'vista previa alta');
 check(rect.top<145,'vista previa empieza arriba incluso con cabecera de dos filas');
 check(getComputedStyle(panel.querySelector('.ks-projectbar')).display==='none','segunda barra oculta');
 const menu=panel.querySelector('.kc-workspace-actions');menu.open=true;
 check(getComputedStyle(panel.querySelector('#ks-submit')).display!=='none','entrega disponible en herramientas');
 check(panel.querySelector('#ks-import').onclick!=null,'importación operativa');menu.open=false;
 const main=panel.querySelector('.ks-main'),left=panel.querySelector('.ks-left'),right=panel.querySelector('.ks-right');
 const iframe=document.getElementById('ks-frame'),tools=panel.querySelector('[data-workspace="main"]');
 const area=tools.querySelector('input[type=range]');
 area.value='65';area.dispatchEvent(new Event('input',{bubbles:true}));
 check(left.getBoundingClientRect().width>right.getBoundingClientRect().width,'ampliar edición con control porcentual');
 [...tools.querySelectorAll('button')].find(b=>b.textContent==='Editor a la derecha').click();
 check(left.getBoundingClientRect().left>right.getBoundingClientRect().left,'intercambiar lados');
 tools.querySelector('[data-kc-focus="editor"]').click();
 check(getComputedStyle(right).display==='none'&&left.getBoundingClientRect().width>innerWidth*.95,'ampliar editor');
 check(left.getBoundingClientRect().width<=innerWidth+1,'editor ampliado no desborda la pantalla');
 tools.querySelector('.kc-layout-restore').click();
 check(getComputedStyle(right).display!=='none','restaurar ambos paneles');
 tools.querySelector('[data-kc-focus="preview"]').click();
 check(getComputedStyle(left).display==='none'&&right.getBoundingClientRect().width>innerWidth*.95,'ampliar vista previa');
 tools.querySelector('.kc-layout-restore').click();
 check(document.getElementById('ks-frame')===iframe,'conservar el mismo iframe al reorganizar');
 const separator=main.querySelector(':scope > [role="separator"]');
 separator.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true}));
 check(Number(separator.getAttribute('aria-valuenow'))===67,'teclado respeta editor a la derecha');
 check(JSON.parse(localStorage.getItem('krueka.workspace.layout.v1')).main.ratio===67,'recordar distribución sin datos del proyecto');
 StudioIA.title='Mi juego con vista amplia';await StudioIA.save();const id=StudioIA.projectId;
 check(__backend.projects.some(p=>p.id===id),'guardado conservado');
 await StudioIA.close();await KruekaStudioAccess.login('TEST01');
 check(StudioIA.projectId===id,'trabajo recuperado');
 check(document.getElementById('krueka-studio').querySelectorAll('.ks-top>.ks-tabs').length===1,'barra sin duplicaciones');
 StudioIA.showTab('ai');
 check(document.querySelector('.ks-main').dataset.kcReversed==='true','recuperar orden de paneles');
 check(document.querySelector('.ks-main > [role="separator"]').getAttribute('aria-valuenow')==='67','recuperar ancho de paneles');
 await StudioIA.createKit('pagina-web');
 const codeShell=document.getElementById('kp-program-shell'),codeTools=codeShell.querySelector('[data-workspace="program"]');
 check(!!codeTools&&!codeShell.hidden,'distribución en Programación web');
 codeTools.querySelector('[data-kc-focus="editor"]').click();
 check(getComputedStyle(codeShell.querySelector('.kp-program-preview')).display==='none','ampliar código');
 codeTools.querySelector('.kc-layout-restore').click();
 await StudioIA.createKit('visual-blocks');
 const blocks=document.getElementById('kb-shell'),blockTools=blocks.querySelector('[data-workspace="blocks"]');
 check(!!blockTools&&!blocks.hidden,'distribución en Bloques');
 check(!!blocks.querySelector('.kc-block-editor .kb-palette')&&!!blocks.querySelector('.kc-block-editor .kb-workspace'),'paleta y programa conservados');
 blockTools.querySelector('[data-kc-focus="preview"]').click();
 check(getComputedStyle(blocks.querySelector('.kc-block-editor')).display==='none','ampliar juego por bloques');
 blockTools.querySelector('.kc-layout-restore').click();
 await StudioIA.close();await KruekaStudioAccess.login('TEST02');
 check(StudioIA.projectId!==id,'proyectos privados por alumno');
 await StudioIA.close();
 document.body.dataset.layoutSmoke=checks.length===0?'PASS':'FAIL '+checks.join(' | ');
})().catch(e=>{document.body.dataset.layoutSmoke='FAIL '+e.stack});
</script>`;
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'krueka-layout-')),file=path.join(directory,'index.html');
let html=fs.readFileSync(path.join(root,'studio.html'),'utf8').replace('<head>','<head><base href="file://'+root+'/">'+setup).replace('</body>',smoke+'</body>');
(async()=>{
 try{
  fs.writeFileSync(file,html);
  let binary=process.env.STUDIO_CHROMIUM;
  if(process.env.STUDIO_USE_PLAYWRIGHT==='1'){
   const browser=await require('playwright').chromium.launch({headless:true,executablePath:binary,args:['--no-sandbox','--no-zygote','--disable-dev-shm-usage']});
   try{
    const page=await browser.newPage({viewport:{width:1280,height:900}});await page.goto('file://'+file);
    await page.waitForFunction(()=>document.body.dataset.layoutSmoke,null,{timeout:45000});
    assert.equal(await page.evaluate(()=>document.body.dataset.layoutSmoke),'PASS');
    if(process.env.STUDIO_SCREENSHOT_DIR){await page.screenshot({path:path.join(process.env.STUDIO_SCREENSHOT_DIR,'club-layout-desktop.png')});}
   }finally{await browser.close();}
  }else{
   if(!binary)for(const name of ['google-chrome','google-chrome-stable','chromium','chromium-browser'])if(cp.spawnSync(name,['--version'],{encoding:'utf8',timeout:3000}).status===0){binary=name;break;}
   assert.ok(binary,'Chromium no instalado');
   const run=cp.spawnSync(binary,['--headless=new','--no-sandbox','--no-zygote','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--window-size=1280,900','--virtual-time-budget=40000','--dump-dom','file://'+file],{encoding:'utf8',timeout:60000,maxBuffer:8e6});
   assert.equal(run.status,0,(run.stderr||'').slice(-1500));assert.match(run.stdout,/data-layout-smoke="PASS"/,run.stdout.slice(-4500));
  }
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
 console.log('PASS navegador: barra superior, altura de vista previa, archivos, guardado y alumnos separados.');
})().catch(e=>{console.error(e);process.exitCode=1});
