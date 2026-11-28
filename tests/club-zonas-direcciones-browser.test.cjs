const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),vm=require('node:vm');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const fixture=fs.readFileSync(path.join(__dirname,'studio-classroom-browser.test.cjs'),'utf8');
const setup=vm.runInNewContext(fixture.match(/const setup=(`[^]*?`);\nconst smoke=/)[1]);
(async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kr-zonas-')),file=path.join(dir,'club.html');
 fs.writeFileSync(file,fs.readFileSync(path.join(root,'club-krueka.html'),'utf8').replace('<head>','<head><base href="file://'+root+'/">'+setup));
 const browser=await chromium.launch({executablePath:process.env.STUDIO_CHROMIUM||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--no-zygote']});
 try{
  const page=await browser.newPage({viewport:{width:1200,height:850}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,r=>r.abort());
  await page.goto('file://'+file);await page.waitForFunction(()=>window.KruekaStudioAccess?.ready);await page.evaluate(()=>KruekaStudioAccess.login('TEST01'));
  await page.getByRole('button',{name:/Nuevo proyecto/}).click();await page.locator('#kc-new-world').click();
  const start=await page.evaluate(()=>({id:StudioIA.projectId,objects:StudioKits.read(StudioIA.files).objects,old:Studio3D.create(true)['game.js']}));
  // First branch upgrades an actual earlier stock engine, without altering preexisting objects.
  await page.evaluate(old=>{StudioIA.files['game.js']=old;StudioIA.refreshAll();},start.old);
  const frame=page.frameLocator('#ks-frame'),hud=frame.locator('#hud'),arena=frame.locator('#arena');
  const direction=page.locator('#k3d-zone-direction'),zone=page.locator('#k3d-zone-select');
  for(const [i,dir] of ['up','right','down','left'].entries()){
   await zone.selectOption('0');await direction.selectOption(dir);
   await page.locator('#k3d-zone-template').selectOption('empty');await page.locator('#k3d-zone-add').click();
   await hud.getByText(new RegExp('Zona '+(i+2)+' / '+(i+2))).waitFor();
   assert.equal(await zone.inputValue(),String(i+1));
   await page.locator('#k3d-zone-name').fill('Zona '+dir);await page.locator('#k3d-zone-rename').click();
   await hud.getByText('Zona '+dir,{exact:false}).waitFor();
   if(i===0){await zone.selectOption('0');await page.waitForFunction(()=>document.querySelector('#k3d-zone-direction option[value="up"]')?.disabled);}
  }
  assert.ok(await page.locator('#k3d-zone-add').isDisabled());assert.equal(await page.locator('#k3d-zone-map button').count(),5);
  await page.getByRole('button',{name:'Editar zona 3: Zona right'}).click();assert.equal(await zone.inputValue(),'2');
  await page.locator('#k3d-new-character').click();
  const edit=page.locator('#k3d-piece-editor');
  await edit.getByLabel('Nombre',{exact:true}).fill('Guardia de la derecha');
  await edit.getByRole('button',{name:/Elegir dónde colocar/}).click();await edit.getByRole('button',{name:'Colocar en el mundo'}).click();
  await page.getByText(/Guardia de la derecha colocado/).waitFor();
  const current=await page.evaluate(()=>StudioKits.read(StudioIA.files));
  assert.deepEqual(current.objects.filter(o=>!o.zone),start.objects);
  assert.equal(current.objects.find(o=>o.label==='Guardia de la derecha').zone,2);
  assert.deepEqual(current.zones.map(z=>[z.col,z.row]),[[0,-1],[1,0],[0,1],[-1,0]]);
  await page.locator('#k3d-save').click();await page.getByText(/Proyecto y piezas guardados en Krueka/).waitFor();
  await page.evaluate(async()=>{await StudioIA.close();await KruekaStudioAccess.login('TEST01');});
  await page.locator('#ks-projects').click();await page.locator('[data-project="'+start.id+'"]').click();
  assert.equal(await page.locator('#k3d-zone-map button').count(),5);
  assert.deepEqual(await page.evaluate(()=>StudioKits.read(StudioIA.files)),current);
  await page.setViewportSize({width:390,height:820});
  assert.ok(await page.locator('#k3d-zone-map').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
  await page.setViewportSize({width:1200,height:850});
  // Travel in both senses on every bridge. Raise speed using the same rules
  // code path, and remove obstacles only from a temporary preview, not cloud.
  await page.evaluate(()=>{const c=StudioKits.read(StudioIA.files);StudioIA.files['game-config.js']=StudioKits.configFile({...c,objects:[],speed:9});StudioIA.playCurrent();});
  await frame.getByRole('button',{name:/Editar escena/}).waitFor();
  await arena.focus();
  async function move(key,expected){await page.keyboard.down(key);try{await hud.getByText(expected).waitFor({timeout:12000});}finally{await page.keyboard.up(key);}}
  await move('ArrowUp',/Zona 2 \/ 5 · Zona up/);
  await move('ArrowDown',/Zona 1 \/ 5/);
  await page.keyboard.down('ArrowDown');await page.waitForTimeout(1480);await page.keyboard.up('ArrowDown');
  await move('ArrowRight',/Zona 3 \/ 5 · Zona right/);
  await move('ArrowLeft',/Zona 1 \/ 5/);
  await move('ArrowLeft',/Zona 5 \/ 5 · Zona left/);
  await move('ArrowRight',/Zona 1 \/ 5/);
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(1350);await page.keyboard.up('ArrowRight');
  await move('ArrowDown',/Zona 4 \/ 5 · Zona down/);
  await move('ArrowUp',/Zona 1 \/ 5/);
  assert.deepEqual(errors,[]);
  console.log('PASS: four directions and reverse crossings, upgrading a stock world, piece placement, five zones and save/reopen.');
 }finally{await browser.close();fs.rmSync(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1});
