const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),vm=require('node:vm');
const {chromium}=require('playwright-core');
const root=path.resolve(__dirname,'..');
const lesson=fs.readFileSync(path.join(__dirname,'studio-classroom-browser.test.cjs'),'utf8');
const setup=vm.runInNewContext(lesson.match(/const setup=(`[^]*?`);\nconst smoke=/)[1])
 .replace(/^<script>|<\/script>$/g,'').replace(/Storage\.prototype\.getItem=[^\n]+/,'');
const server=http.createServer((req,res)=>{
 const name=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
 if(!name.startsWith(root+path.sep)||!fs.existsSync(name)||!fs.statSync(name).isFile()){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.webp':'image/webp'})[path.extname(name)]||'application/octet-stream');
 fs.createReadStream(name).pipe(res);
});
async function checkModel(page,id,base){
 const errors=[];const onError=e=>errors.push(e.message);page.on('pageerror',onError);
 await page.goto(base+'/club-krueka-ejemplo.html?ejemplo='+id);
 const frame=page.frameLocator('#preview'),controls=id==='dibujo'?page:frame;
 const click=selector=>controls.locator(selector).click();
 const content=selector=>controls.locator(selector).innerText();
 if(id==='neon'){
  await click('#restart');await controls.locator('#arena').press('ArrowRight');
  assert.match(await content('#state'),/cristales/);assert.equal(await content('#lives'),'3');
 }else if(id==='blog'){
  await click('#theme');assert.match(await controls.locator('body').getAttribute('class'),/light/);
  await click('[data-read="1"]');assert.match(await content('#reading'),/prototipo|historia corta/);await click('#close');
 }else if(id==='comic'){
  await click('#next');assert.match(await content('#chapter'),/2 \/ 4/);await click('#prev');assert.match(await content('#chapter'),/1 \/ 4/);
 }else if(id==='cuento'){
  await click('#choices button:nth-child(2)');assert.match(await content('#node-title'),/río/);await click('#choices button:nth-child(1)');assert.equal(await content('#progress'),'FINAL');await click('#restart');
 }else if(id==='drama'){
  await click('#lights');await click('#next');await click('[data-person="1"]');assert.match(await content('#line'),/pista/);
 }else if(id==='anime'){
  await click('#pause');await click('#advance');assert.match(await content('#episode'),/02/);assert.match(await controls.locator('#anime-scene').getAttribute('class'),/paused/);
 }else if(id==='flyer'){
  await click('#program');assert.match(await content('#schedule'),/11:00/);await controls.locator('#poster-text').fill('Feria de ciencia');assert.equal(await content('#poster-title'),'Feria de ciencia');
 }else if(id==='animacion'){
  await click('#toggle');await controls.locator('#speed').fill('8');assert.equal(await controls.locator('#dance').evaluate(e=>e.style.getPropertyValue('--tempo')),'1.04s');
 }else if(id==='video'){
  await click('#play');await click('[data-index="1"]');await controls.locator('#shot-text').fill('Mi descubrimiento');await click('#earlier');assert.equal(await content('#filmCount'),'01 / 04');assert.equal(await content('#subtitle'),'Mi descubrimiento');
 }else if(id==='dibujo'){
  await click('[data-tab="colorear"]');await click('[data-template="casa"]');
  await click('[data-color="#e94356"]');
  const canvas=controls.locator('.ct-art-lab canvas');await canvas.scrollIntoViewIfNeeded();const r=await canvas.boundingBox();
  await page.mouse.click(r.x+r.width*160/600,r.y+r.height*242/320);
  await click('[data-tab="3d"]');await controls.getByRole('button',{name:/Cubo/}).click();
  await click('[data-tab="capas"]');await click('[data-layer="details"]');
  await page.getByLabel('Simetría radial para mandalas').selectOption('4');
  await page.getByRole('button',{name:/Ver código/}).click();assert.match(await page.locator('#source').innerText(),/#e94356/);await page.locator('#show-code').click();
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Descargar PNG'}).click();
  const download=await pending;assert.equal(download.suggestedFilename(),'mi-arte-krueka.png');const image=fs.readFileSync(await download.path());assert.equal(image.readUInt32BE(16),1800);assert.equal(image.readUInt32BE(20),960);
 }
 await page.locator('#start-model').click();await page.waitForURL(/club-krueka\.html\?plantilla=/);
 await page.locator('#studio-code').fill('TEST01');await page.locator('#studio-login-button').click();
 await page.locator('#krueka-use-model').click();
 const expectedTab=id==='neon'?'programacion':['animacion','video'].includes(id)?'create':'club-work';
 await page.waitForFunction(tab=>window.StudioIA?.tab===tab&&!StudioIA.busy&&StudioIA.projectId!=='legacy',expectedTab);
 const summary=await page.evaluate(()=>({files:StudioIA.files,id:StudioIA.projectId,kind:StudioKits.read(StudioIA.files)?.kind,config:StudioKits.read(StudioIA.files),work:JSON.parse(StudioIA.files['obra.json']||'null')}));
 if(id==='dibujo'){
  assert.equal(summary.work.tools.templateColors.pared,'#e94356');assert.equal(summary.work.tools.stamps[0].kind,'cube');assert.equal(summary.work.tools.radialSymmetry,4);
 }
 if(id==='video')assert.equal(summary.config.clips[0].title,'Mi descubrimiento');
 if(id==='animacion')assert.equal(summary.config.duration,2.08);
 if(id==='flyer')assert.equal(summary.work.title,'Feria de ciencia');
 assert.ok(await page.evaluate(()=>StudioIA.save()));
 await page.evaluate(()=>StudioIA.switchProject(StudioIA.projectId));
 assert.equal(await page.evaluate(()=>StudioIA.files['index.html']),summary.files['index.html']);
 assert.deepEqual(errors,[],id);page.off('pageerror',onError);console.log('PASS '+id+' · modelo y copia privada');
}
(async()=>{
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.STUDIO_CHROMIUM||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
  const base='http://127.0.0.1:'+server.address().port;
  for(const id of ['dibujo','video','animacion','flyer','blog','comic','cuento','drama','anime','neon']){
   const context=await browser.newContext({viewport:{width:1000,height:800}});
   await context.addInitScript('if(location.pathname.endsWith("/club-krueka.html")){'+setup+'}');
   try{await checkModel(await context.newPage(),id,base);}finally{await context.close();}
  }
 }finally{if(browser)await browser.close();await new Promise(ok=>server.close(ok));}
})().catch(e=>{console.error(e);process.exitCode=1});
