/* Editor de libros: escritura continua, imagen insertada, hojas, nube y separación de alumnos. */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),cp=require('node:child_process'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const prior=fs.readFileSync(path.join(__dirname,'studio-classroom-browser.test.cjs'),'utf8');
const setup=vm.runInNewContext(prior.match(/const setup=(`[^]*?`);\nconst smoke=/)[1]);
const smoke=`<script>
const problems=[];function check(ok,name){if(!ok)problems.push(name)}
async function until(fn){const deadline=Date.now()+26000;while(!fn()){if(Date.now()>deadline)throw Error('Tiempo agotado');await new Promise(r=>setTimeout(r,35));}}
(async()=>{
 await until(()=>window.KruekaStudioAccess?.ready);
 await KruekaStudioAccess.login('TEST01');
 const tile=document.querySelector('[data-creative-start="libros"]');
 check(!!tile,'Libros en Mis talleres');tile.click();
 await until(()=>StudioIA.tab==='club-work'&&!StudioIA.busy);
 const panel=document.getElementById('ks-club-work'),area=panel.querySelector('[name="panel-text-0"]');
 check(!!area&&panel.querySelectorAll('.ck-scene').length===1,'un solo manuscrito');
 check(document.getElementById('ck-part-label').hidden&&document.getElementById('ck-add-part').hidden,'sin capítulos obligatorios');
 check(panel.querySelector('#ck-book-insert')!=null,'insertar imágenes accesible');
 area.value='Comienzo de mi libro. '.repeat(130)+'\\n\\nEl misterio continúa. '.repeat(90);
 area.dispatchEvent(new Event('input',{bubbles:true}));
 check(StudioIA.files['index.html'].includes('El misterio continúa'),'texto continuo en vista previa');
 check((StudioIA.files['index.html'].match(/class="ck-panel ck-book ck-manuscript-leaf"/g)||[]).length>=3,'texto repartido en hojas');
 const c=document.createElement('canvas');c.width=64;c.height=64;c.getContext('2d').fillRect(0,0,64,64);
 const blob=await new Promise(ok=>c.toBlob(ok,'image/png'));
 const input=panel.querySelector('#ck-book-file'),transfer=new DataTransfer();
 transfer.items.add(new File([blob],'mi-ilustracion.png',{type:'image/png'}));
 area.focus();area.setSelectionRange(24,24);input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));
 await until(()=>Object.keys(JSON.parse(StudioIA.files['obra.json']).tools.bookImages||{}).length===1);
 const data=JSON.parse(StudioIA.files['obra.json']),key=Object.keys(data.tools.bookImages)[0];
 check(area.value.includes('[[imagen:'+key+']]'),'marca de imagen en el manuscrito');
 check(StudioIA.files['index.html'].includes('class="ck-inline-figure"'),'ilustración real entre hojas');
 check(StudioIA.files['index.html'].includes(data.tools.bookImages[key]),'imagen comprimida guardable');
 document.getElementById('ck-test').click();
 const reader=document.createElement('iframe');reader.style.cssText='position:fixed;inset:0 auto auto 0;width:980px;height:690px;border:0';document.body.append(reader);
 const loaded=new Promise(done=>reader.onload=done);reader.srcdoc=StudioIA.buildPreview.call(StudioIA,'index.html');await loaded;
 const doc=reader.contentDocument,pages=[...doc.querySelectorAll('.ck-spread > .ck-leaf')];
 check(pages.length>=5&&pages.some(p=>p.querySelector('.ck-inline-figure img')),'libro real con imagen y varias páginas');
 const spread=doc.querySelector('.ck-spread'),bounds=spread.getBoundingClientRect();
 check(!doc.querySelector('main > header'),'sin cabecera repetida encima del libro');
 check(bounds.top<70&&bounds.height>540,'vista previa ampliada verticalmente para las páginas');
 check(!!doc.querySelector('.ck-cover-byline'),'firma artística integrada a la portada');
 const next=doc.querySelector('#ck-next'),prev=doc.querySelector('#ck-prev');
 check(!!next&&!next.disabled&&prev.disabled,'portada abierta');next.click();
 check(!prev.disabled&&doc.querySelector('#ck-page').textContent.includes('Página'),'páginas navegables');
 prev.click();check(prev.disabled,'regreso a portada');
 reader.remove();
 await StudioIA.save();const id=StudioIA.projectId;
 await StudioIA.close();await KruekaStudioAccess.login('TEST01');
 check(StudioIA.projectId===id&&JSON.parse(StudioIA.files['obra.json']).tools.bookImages[key]===data.tools.bookImages[key],'recuperación de imagen en otro ingreso');
 await StudioIA.close();await KruekaStudioAccess.login('TEST02');
 check(StudioIA.projectId!==id&&StudioIA.files['tipo-club.txt']!=='libros','otro alumno sin acceso al libro');
 await StudioIA.close();
 document.body.dataset.librosSmoke=problems.length?'FAIL '+problems.join(' | '):'PASS';
})().catch(e=>{document.body.dataset.librosSmoke='FAIL '+e.stack});
</script>`;
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'krueka-libros-')),file=path.join(directory,'index.html');
const html=fs.readFileSync(path.join(root,'club-krueka.html'),'utf8').replace('<head>','<head><base href="file://'+root+'/">'+setup).replace('</body>',smoke+'</body>');
(async()=>{
 try{
  fs.writeFileSync(file,html);
  let binary=process.env.STUDIO_CHROMIUM;
  if(process.env.STUDIO_USE_PLAYWRIGHT==='1'){
   const browser=await require('playwright').chromium.launch({headless:true,executablePath:binary,args:['--no-sandbox','--no-zygote','--disable-dev-shm-usage']});
   try{
    const page=await browser.newPage({viewport:{width:1280,height:900}});await page.goto('file://'+file);
    await page.waitForFunction(()=>document.body.dataset.librosSmoke,null,{timeout:65000});
    assert.equal(await page.evaluate(()=>document.body.dataset.librosSmoke),'PASS');
    if(process.env.STUDIO_SCREENSHOT_DIR)await page.screenshot({path:path.join(process.env.STUDIO_SCREENSHOT_DIR,'club-libros-desktop.png')});
   }finally{await browser.close();}
  }else{
   if(!binary)for(const name of ['google-chrome','google-chrome-stable','chromium','chromium-browser'])if(cp.spawnSync(name,['--version'],{encoding:'utf8',timeout:3000}).status===0){binary=name;break;}
   assert.ok(binary,'Chromium no instalado');
   const run=cp.spawnSync(binary,['--headless=new','--no-sandbox','--no-zygote','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--window-size=1280,900','--virtual-time-budget=50000','--dump-dom','file://'+file],{encoding:'utf8',timeout:70000,maxBuffer:8e6});
   assert.equal(run.status,0,(run.stderr||'').slice(-1200));assert.match(run.stdout,/data-libros-smoke="PASS"/,run.stdout.slice(-5000));
  }
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
 console.log('PASS navegador: libro continuo, ilustración, hojas, guardado, recuperación y separación de alumnos.');
})().catch(e=>{console.error(e);process.exitCode=1});
