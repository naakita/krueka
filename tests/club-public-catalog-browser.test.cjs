const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(__dirname,'..');
const content={'.js':'application/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
 const name=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
 if(!name.startsWith(root+path.sep)||!fs.existsSync(name)||!fs.statSync(name).isFile()){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',content[path.extname(name)]||'application/octet-stream');
 fs.createReadStream(name).pipe(res);
});
function assertLayout(){return document.documentElement.scrollWidth<=innerWidth;}
const response=[
 {id:'libro-prueba',title:'Un día de papel',category:'libros'},
 {id:'juego-prueba',title:'Isla de las ideas',category:'juegos'}
];
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  const base='http://127.0.0.1:'+server.address().port;
  for(const viewport of [{width:1440,height:950},{width:390,height:844},{width:320,height:730}]){
   browser=await chromium.launch({executablePath:process.env.STUDIO_CHROMIUM||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
   const context=await browser.newContext({viewport});
   const screenshots=process.env.KRUEKA_CATALOG_SCREENSHOTS;
   let galleryError=false,loginCode='';
   await context.route('**/rest/v1/rpc/club_krueka_public_galeria',route=>route.fulfill({status:galleryError?503:200,json:galleryError?{}:response}));
   await context.route('**/rest/v1/rpc/club_studio_entrar',route=>{
    loginCode=route.request().postDataJSON().p_codigo;
    return route.fulfill({status:200,json:{ok:false,error:'Código de prueba no válido.'}});
   });
   const errors=[];
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'/club-krueka.html');
   assert.equal(await page.locator('.kr-workshop').count(),4);
   assert.ok(await page.locator('.kr-hero-art img').evaluate(img=>img.complete&&img.naturalWidth===620),'Cargó la ilustración local');
   assert.ok(await page.evaluate(assertLayout),'La portada no desborda');
   await page.getByText('¿Dónde consigo mi código?').click();
   assert.ok(await page.getByText(/Pedile tu código personal/).isVisible(),'Ayuda de acceso');
   await page.getByText('¿Dónde consigo mi código?').click();
   const login=page.locator('#studio-code');await login.fill('test01');assert.equal(await login.inputValue(),'TEST01');
   await page.locator('#studio-login-button').click();
   await page.getByText('Código de prueba no válido.').waitFor();assert.equal(loginCode,'TEST01');
   if(screenshots){await login.fill('');await page.locator('#studio-login-message').evaluate(el=>el.textContent='');await page.screenshot({path:path.join(screenshots,'club-'+viewport.width+'.png'),fullPage:true});}
   await page.getByRole('link',{name:'Galería',exact:true}).click();
   await page.getByRole('heading',{name:'Un día de papel'}).waitFor();
   assert.ok(await page.evaluate(assertLayout),'La galería no desborda');
   assert.equal(await page.locator('#gallery-cards .kr-card').count(),2);
   assert.equal(await page.locator('#example-cards .kr-card').count(),10);
   assert.equal(await page.locator('#gallery-cards .kr-card-cover span').first().textContent(),'Obra aprobada');
   assert.equal(await page.locator('#example-cards .kr-card-cover span').first().textContent(),'Modelo del Club');
   assert.ok(await page.locator('#gallery-cards svg use').first().evaluate(use=>use.getBBox().width>0),'Cargó el pictograma de la obra');
   assert.equal(await page.getByRole('link',{name:/Leer: Un día de papel/}).getAttribute('href'),'club-krueka-obra.html?obra=libro-prueba');
   assert.equal(await page.getByRole('link',{name:/Leer: Un día de papel/}).getAttribute('target'),'_blank');
   if(screenshots)await page.screenshot({path:path.join(screenshots,'galeria-'+viewport.width+'.png'),fullPage:true});
   if(viewport.width<=700){
    assert.ok(!(await page.getByRole('button',{name:'Libros',exact:true}).isVisible()));
    await page.locator('#category-picker summary').click();
   }
   await page.getByRole('button',{name:'Libros',exact:true}).click();
   assert.equal(await page.locator('#gallery-cards .kr-card').count(),1);
   assert.equal(await page.locator('#example-cards .kr-card').count(),0);
   await page.getByRole('button',{name:'Todas',exact:true}).click();
   await page.getByRole('button',{name:'Obras de alumnos',exact:true}).click();
   assert.ok(!(await page.locator('#ejemplos').isVisible()));
   await page.getByRole('searchbox').fill('dia DE PAPEL');
   assert.equal(await page.locator('#gallery-cards .kr-card').count(),1);
   await page.getByRole('searchbox').fill('no existe');
   assert.ok(await page.getByText('No hay obras de alumnos con este filtro.').isVisible());
   await page.getByRole('searchbox').fill('');
   await page.getByRole('button',{name:'Modelos del Club',exact:true}).click();
   assert.ok(!(await page.locator('#alumnos').isVisible()));
   assert.equal(await page.getByRole('link',{name:/Explorar: ArteLab/}).getAttribute('href'),'club-krueka-ejemplo.html?ejemplo=dibujo');
   await page.getByRole('button',{name:'Todas las creaciones',exact:true}).click();
   galleryError=true;await page.getByRole('button',{name:'Actualizar obras'}).click();
   await page.getByText('No pudimos cargar las obras.').waitFor();
   assert.equal(await page.locator('#example-cards .kr-card').count(),10,'Los modelos funcionan incluso cuando no responde la galería de alumnos');
   galleryError=false;await page.getByRole('button',{name:'Actualizar obras'}).click();
   await page.getByRole('heading',{name:'Un día de papel'}).waitFor();
   assert.deepEqual(errors,[]);
   console.log('PASS Club + galería '+viewport.width+'px · acceso, pictogramas, filtros, búsqueda, reintento');
   await browser.close();browser=null;
  }
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1});
