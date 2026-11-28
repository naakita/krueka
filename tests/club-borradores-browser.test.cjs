const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),vm=require('node:vm');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const fixture=fs.readFileSync(path.join(__dirname,'studio-classroom-browser.test.cjs'),'utf8');
const setup=vm.runInNewContext(fixture.match(/const setup=(`[^]*?`);\nconst smoke=/)[1])
 .replace("Storage.prototype.getItem=Storage.prototype.setItem=Storage.prototype.removeItem=function(){throw Error('Almacenamiento bloqueado')};","")
 .replace("type:'web',updated_at:p.updated_at","type:'web',status:p.status,updated_at:p.updated_at")
 .replace(" if(body.action==='list')",`
 if(url.includes('/club_studio_borrar_borrador')){
  const p=own.find(x=>x.id===body.p_project&&x.files);
  if(!p)return {status:200,data:{ok:false,code:'missing',error:'No está en tus borradores.'}};
  if(p.status!=='draft')return {status:200,data:{ok:false,code:'protected',error:'Está protegido.'}};
  if(p.updated_at!==body.p_updated_at)return {status:200,data:{ok:false,code:'changed',error:'El proyecto cambió.'}};
  b.projects=b.projects.filter(x=>x!==p);return {status:200,data:{ok:true}};
 }
 if(body.action==='list')`);
(async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kr-borradores-')),file=path.join(dir,'club.html');
 fs.writeFileSync(file,fs.readFileSync(path.join(root,'club-krueka.html'),'utf8').replace('<head>','<head><base href="file://'+root+'/">'+setup));
 const browser=await chromium.launch({executablePath:process.env.STUDIO_CHROMIUM||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--no-zygote']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:820}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,r=>r.abort());
  await page.goto('file://'+file);await page.waitForFunction(()=>window.KruekaStudioAccess?.ready);
  await page.evaluate(async()=>{
   await KruekaStudioAccess.login('TEST01');
   const p=__backend.projects[0];p.title='Aventura';StudioIA.title='Aventura';
   __backend.projects.push({...p,id:'other-draft',updated_at:'2026-11-25T18:00:00Z'},{...p,id:'approved',status:'published'},{...p,id:'review',status:'review'},{...p,id:'private-elsewhere',owner:'fixture-two'});
  });
  const active=await page.evaluate(()=>StudioIA.projectId);
  const btn=id=>page.locator('[data-delete-project="'+id+'"]');
  const exists=id=>page.evaluate(id=>__backend.projects.some(p=>p.id===id),id);
  await page.locator('#ks-projects').click();
  assert.match(await btn(active).getAttribute('aria-label'),/Aventura.*Abierto/);
  assert.match(await btn('other-draft').getAttribute('aria-label'),/Aventura.*25/);
  for(const id of ['approved','review','private-elsewhere'])assert.equal(await btn(id).count(),0);
  await btn('other-draft').click();
  await page.getByRole('button',{name:'Cancelar',exact:true}).click();await btn('other-draft').waitFor();
  assert.ok(await exists('other-draft'));
  await btn('other-draft').click();
  await page.evaluate(()=>__backend.projects.find(x=>x.id==='other-draft').updated_at='2026-11-26T08:00:00Z');
  await page.getByRole('button',{name:'Borrar definitivamente'}).click();
  await page.getByText('El proyecto cambió.',{exact:true}).waitFor();assert.ok(await exists('other-draft'));
  await btn('other-draft').click();await page.getByRole('button',{name:'Borrar definitivamente'}).click();
  await page.getByText('Borraste «Aventura».',{exact:true}).waitFor();assert.ok(!(await exists('other-draft')));
  assert.equal(await page.evaluate(()=>StudioIA.projectId),active,'Borrar otro no cierra el proyecto actual');
  // A dirty current project must not be saved or resurrected once its deletion succeeds.
  await page.evaluate(()=>{StudioIA.files['test.txt']='Cambios no guardados';StudioIA.changed();});
  await btn(active).click();await page.getByRole('button',{name:'Borrar definitivamente'}).click();
  await page.getByText('Borraste «Aventura».',{exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>StudioIA.projectId),'new');
  assert.ok(!(await exists(active)));
  for(const id of ['approved','review','private-elsewhere'])assert.ok(await exists(id));
  assert.match(await page.locator('#ks-save').textContent(),/Sin proyecto abierto/);
  await page.locator('#ks-dialog-close').click();
  await page.evaluate(async()=>{await StudioIA.close();await KruekaStudioAccess.login('TEST02');});
  assert.ok(!(await exists(active)));
  await page.locator('#ks-projects').click();
  assert.equal(await page.locator('[data-project="approved"]').count(),0);
  assert.deepEqual(errors,[]);
  console.log('PASS: confirmación y cancelación, nombres duplicados, protección de estados, conflicto, borrado de otro y del activo, aislamiento y móvil.');
 } finally{await browser.close();fs.rmSync(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1});
