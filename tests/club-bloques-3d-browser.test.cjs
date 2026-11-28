const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),vm=require('node:vm'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const fixture=fs.readFileSync(path.join(__dirname,'studio-classroom-browser.test.cjs'),'utf8');
const setup=vm.runInNewContext(fixture.match(/const setup=(`[^]*?`);\nconst smoke=/)[1]);
(async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kr-cubos-')),file=path.join(dir,'club.html');
 fs.writeFileSync(file,fs.readFileSync(path.join(root,'club-krueka.html'),'utf8').replace('<head>','<head><base href="file://'+root+'/">'+setup));
 const browser=await chromium.launch({executablePath:process.env.STUDIO_CHROMIUM||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--no-zygote']});
 try{
  const page=await browser.newPage({viewport:{width:1100,height:850}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,r=>r.abort());
  await page.goto('file://'+file);await page.waitForFunction(()=>window.KruekaStudioAccess?.ready);
  await page.evaluate(()=>KruekaStudioAccess.login('TEST01'));
  await page.getByRole('button',{name:/Nuevo proyecto/}).click();await page.locator('#kc-new-world').click();await page.locator('#k3d-builder').waitFor();
  const id=await page.evaluate(()=>StudioIA.projectId);
  await page.locator('#k3d-new-character').click();
  const dialog=page.locator('#k3d-piece-editor'),pieceFrame=page.frameLocator('#k3d-piece-model'),canvas=pieceFrame.locator('#arena');
  const models=await dialog.locator('#k3d-piece-style optgroup[label="Estilo de bloques"] option').evaluateAll(els=>els.map(el=>el.value));
  assert.equal(models.length,8);
  const signatures=new Set();
  for(const model of models){
   await dialog.getByLabel('Forma del personaje').selectOption(model);
   // Explicit input updates queue a 3D draw in the isolated preview.
   await page.waitForTimeout(75);
   signatures.add(crypto.createHash('sha256').update(await canvas.screenshot()).digest('hex'));
  }
  assert.equal(signatures.size,models.length,'Cada plantilla muestra una geometría distinta');
  await page.setViewportSize({width:390,height:820});
  await dialog.getByLabel('Nombre',{exact:true}).fill('Mi guardián');
  await dialog.getByLabel('Forma del personaje').selectOption('guardian');
  await dialog.getByLabel('Color',{exact:true}).fill('#1fb097');
  await dialog.getByLabel('Tamaño',{exact:true}).fill('1.5');
  if(process.env.STUDIO_SCREENSHOT_DIR)await page.screenshot({path:path.join(process.env.STUDIO_SCREENSHOT_DIR,'guardian-bloques.png')});
  await dialog.getByRole('button',{name:/Elegir dónde colocar/}).click();
  await dialog.getByRole('button',{name:'Colocar en el mundo'}).click();
  await page.getByText(/Mi guardián colocado/).waitFor();
  await page.locator('#k3d-category').selectOption('personaje');
  await page.locator('#k3d-piece').selectOption({label:'Astronauta de cubos'});
  await page.locator('#k3d-hero').click();
  await page.getByText(/Astronauta de cubos aplicado/).waitFor();
  await page.locator('#k3d-save').click();await page.getByText(/Proyecto y piezas guardados/).waitFor();
  await page.evaluate(async()=>{await StudioIA.close();await KruekaStudioAccess.login('TEST01');});
  await page.locator('#ks-projects').click();await page.locator('[data-project="'+id+'"]').click();await page.locator('#k3d-builder').waitFor();
  const cfg=await page.evaluate(()=>StudioKits.read(StudioIA.files));
  assert.equal(cfg.avatarStyle,'astronauta');
  const guard=cfg.objects.find(o=>o.label==='Mi guardián');
  assert.equal(guard.avatarStyle,'guardian');assert.equal(guard.color,'#1fb097');assert.equal(guard.size,1.5);
  assert.deepEqual(errors,[]);
  console.log('PASS: ocho modelos originales, vista particular por molde, personalización, uso como protagonista, guardado y reapertura en móvil.');
 }finally{await browser.close();fs.rmSync(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1});
