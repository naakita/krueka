const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),vm=require('node:vm'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),fixture=fs.readFileSync(path.join(__dirname,'studio-classroom-browser.test.cjs'),'utf8');
const setup=vm.runInNewContext(fixture.match(/const setup=(`[^]*?`);\nconst smoke=/)[1]);
(async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kr-mapa-grande-')),file=path.join(dir,'club.html');
 fs.writeFileSync(file,fs.readFileSync(path.join(root,'club-krueka.html'),'utf8').replace('<head>','<head><base href="file://'+root+'/">'+setup));
 const browser=await chromium.launch({executablePath:process.env.STUDIO_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox','--no-zygote']});
 try{
  const page=await browser.newPage({viewport:{width:1200,height:850}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());await page.route(/^https?:/,r=>r.abort());
  await page.goto('file://'+file);await page.waitForFunction(()=>window.KruekaStudioAccess?.ready);await page.evaluate(()=>KruekaStudioAccess.login('TEST01'));
  await page.getByRole('button',{name:/Nuevo proyecto/}).click();await page.locator('#kc-new-world').click();
  const pid=await page.evaluate(()=>StudioIA.projectId),zone=page.locator('#k3d-zone-select'),frame=page.frameLocator('#ks-frame'),hud=frame.locator('#hud');
  for(let i=2;i<=8;i++){
   await page.locator('#k3d-zone-add').click();
   await hud.getByText(new RegExp('Zona '+i+' / '+i)).waitFor();
  }
  const zones=Array.from({length:100},(_,i)=>({name:'Puesto '+(i+2),theme:i%2?'station':'forest',col:0,row:-i-1}));
  const objects=Array.from({length:700},(_,i)=>({id:'pieza-'+i,zone:Math.floor(i/7),type:'tree',label:'Árbol '+i,x:7,z:Math.floor(i%7)*3-9,size:1,height:2,color:'#37b851'}));
  const scene={kind:'explore3d',title:'Gran mapa',speed:9,seconds:300,zones,objects};
  await page.locator('#k3d-toolbox summary').click();
  await page.locator('#k3d-file').setInputFiles({name:'mapa-de-prueba.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({format:'krueka-scene',version:1,scene}))});
  await page.getByRole('heading',{name:/Ampliá tu mundo · 101 zonas/}).waitFor();
  const search=page.locator('#k3d-zone-search');
  await search.fill('Puesto 101');await search.press('Enter');
  assert.equal(await zone.inputValue(),'100');await hud.getByText(/Zona 101 \/ 101 · Puesto 101/).waitFor();
  const canvas=frame.locator('#arena');assert.ok((await canvas.screenshot()).length>4000);
  assert.ok(await page.locator('#k3d-zone-map button').count()<=5);
  await page.locator('#k3d-zone-direction').selectOption('right');await page.locator('#k3d-zone-add').click();
  await hud.getByText(/Zona 102 \/ 102/).waitFor();
  await page.locator('#k3d-new-character').click();
  const dialog=page.locator('#k3d-piece-editor');
  await dialog.getByLabel('Nombre',{exact:true}).fill('Guía del puesto 102');await dialog.getByRole('button',{name:/Elegir dónde colocar/}).click();await dialog.getByRole('button',{name:'Colocar en el mundo'}).click();
  await page.getByText(/Guía del puesto 102 colocado/).waitFor();
  await page.locator('#k3d-manual summary').click();await page.locator('[data-light="cryo"]').click();
  const expected=await page.evaluate(()=>StudioKits.read(StudioIA.files));
  assert.equal(expected.zones[100].col,1);assert.equal(expected.zones[100].row,-100);assert.equal(expected.objects.length,701);
  assert.ok(await page.evaluate(()=>StudioIA.files['game-config.js'].length<120000));
  await page.locator('#k3d-save').click();await page.getByText(/Proyecto y piezas guardados en Krueka/).waitFor();
  // Snapshot the mock service, then clear client state through normal exit/login.
  await page.evaluate(async()=>{await StudioIA.close();await KruekaStudioAccess.login('TEST01');});
  await page.locator('#ks-projects').click();await page.locator('[data-project="'+pid+'"]').click();
  await page.getByRole('heading',{name:/Ampliá tu mundo · 102 zonas/}).waitFor();
  assert.deepEqual(await page.evaluate(()=>StudioKits.read(StudioIA.files)),expected);
  await page.setViewportSize({width:360,height:780});await search.fill('102');await search.press('Enter');
  await hud.getByText(/Zona 102 \/ 102/).waitFor();
  assert.ok(await page.locator('#k3d-zone-map').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
  // Use the saved 102-zone runtime and move from the origin; no altered geometry.
  await page.setViewportSize({width:1200,height:850});await page.locator('#k3d-play').click();
  await frame.getByRole('button',{name:/Editar escena/}).waitFor();
  await canvas.focus();await page.keyboard.down('ArrowUp');
  try{await hud.getByText(/Zona 6 \/ 102/).waitFor({timeout:30000});}finally{await page.keyboard.up('ArrowUp');}
  assert.deepEqual(errors,[]);
  console.log('PASS: expands past five via UI; 102 connected zones, 701 pieces, mobile search, compact save/reopen and live traversal.');
 }finally{await browser.close();fs.rmSync(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1});
