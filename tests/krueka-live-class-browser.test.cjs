const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const raw=fs.readFileSync(path.join(root,'actividades-clase.html'),'utf8');
const client=fs.readFileSync(path.join(root,'js/krueka-clase-temporal.js'),'utf8');
// PDF mínimo válido para comprobar la carga del visor canvas sin descargas.
const pdfFixture=(()=>{
 const stream='0 0 0 rg 46 150 120 45 re f\n';
 const objects=[
  '<< /Type /Catalog /Pages 2 0 R >>',
  '<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 500 300] /Resources << >> /Contents 5 0 R >>',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 900 300] /Resources << >> /Contents 5 0 R >>',
  '<< /Length '+Buffer.byteLength(stream)+' >>\nstream\n'+stream+'endstream'
 ];
 let content='%PDF-1.4\n',offsets=[];
 for(let i=0;i<objects.length;i++){offsets.push(Buffer.byteLength(content));content+=(i+1)+' 0 obj\n'+objects[i]+'\nendobj\n';}
 const start=Buffer.byteLength(content);
 content+='xref\n0 '+(objects.length+1)+'\n0000000000 65535 f \n'+offsets.map(o=>String(o).padStart(10,'0')+' 00000 n \n').join('');
 content+='trailer\n<< /Size '+(objects.length+1)+' /Root 1 0 R >>\nstartxref\n'+start+'\n%%EOF\n';
 return Buffer.from(content,'latin1').toString('base64');
})();
const mock='<script>'+
'window.fetch=async function(url,opts){let body;if(typeof opts.body==="string")body=JSON.parse(opts.body);'+
'if(body&&body.action==="lookup")return {ok:true,json:async()=>({ok:true,activity:{title:"Actividad real de prueba",grade:"Octavo grado",subject:"Informática",instructions:"Escribí un documento y entregalo en la clase.",has_pdf:true,pdf_name:"guia-ejemplo.pdf"}})};'+
'if(body&&body.action==="guide")return {ok:true,blob:async()=>new Blob([Uint8Array.from(atob("'+pdfFixture+'"),c=>c.charCodeAt(0))],{type:"application/pdf"})};'+
'return {ok:false,json:async()=>({ok:false,error:"Mock sin entrega real"})};};'+
'</script>';
const fixture=raw.replace(/<script src="https:\/\/cdn\.jsdelivr[^>]*><\/script>/g,'').replace(/<script src="https:\/\/challenges\.cloudflare[^>]*><\/script>/g,'')
 .replace(/<script src="js\/krueka-clase-temporal\.js[^>]*><\/script>/,mock+'<script>'+client+'</script>');
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 if(pathname==='/actividades-clase.html'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(fixture);return;}
 const name=path.resolve(root,'.'+pathname);
 if(!name.startsWith(root+path.sep)||!fs.existsSync(name)||!fs.statSync(name).isFile()){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',({'.js':'application/javascript','.mjs':'application/javascript','.css':'text/css','.svg':'image/svg+xml'})[path.extname(name)]||'application/octet-stream');
 fs.createReadStream(name).pipe(res);
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  const {chromium}=require('playwright-core');
  browser=await chromium.launch({executablePath:process.env.STUDIO_CHROMIUM||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
  const page=await browser.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const [width,height] of [[320,730],[390,850],[1350,900]]){
   await page.setViewportSize({width,height});
   await page.goto('http://127.0.0.1:'+server.address().port+'/actividades-clase.html');
   await page.locator('#student-code').fill('ABCDEFGHJKLM');
   await page.locator('#lookup-form').locator('button[type="submit"]').click();
   await page.locator('#student-pdf-frame canvas').waitFor({timeout:12000});
   const canvas=page.locator('#student-pdf-frame canvas'),scroller=page.locator('.preview-pdf-scroll');
   const pageCount=page.locator('.preview-page-count');
   await page.getByText('Página 1 de 2',{exact:true}).waitFor();
   await page.waitForFunction(()=>{ // PDF.js realmente pintó la página, no solo insertó el canvas.
    const c=document.querySelector('#student-pdf-frame canvas');
    if(!c?.width||!c.height)return false;
    const sample=c.getContext('2d').getImageData(Math.floor(c.width*.15),Math.floor(c.height*.4),1,1).data;
    return sample[3]===255&&sample[0]<40&&sample[1]<40&&sample[2]<40;
   });
   const size=async()=>Math.round((await canvas.boundingBox()).width);
   const fit=await size();
   assert.ok(fit<=await scroller.evaluate(e=>e.clientWidth),'El PDF inicial cabe en el visor');
   await page.getByRole('button',{name:'Siguiente',exact:true}).click();
   await page.getByText('Página 2 de 2',{exact:true}).waitFor();
   await page.getByRole('button',{name:'Anterior',exact:true}).click();
   await page.getByText('Página 1 de 2',{exact:true}).waitFor();
   await page.getByRole('button',{name:'+',exact:true}).click();
   await page.waitForFunction(w=>document.querySelector('#student-pdf-frame canvas').getBoundingClientRect().width>w,fit);
   const zoomed=await size();
   if(width<600)assert.ok(await scroller.evaluate(e=>e.scrollWidth>e.clientWidth),'El zoom solo desplaza el área del PDF');
   await page.getByRole('button',{name:'−',exact:true}).click();
   await page.waitForFunction(w=>document.querySelector('#student-pdf-frame canvas').getBoundingClientRect().width<w,zoomed);
   await page.locator('#open-guide').click();
   await page.locator('.preview-surface.is-expanded').waitFor();
   if(width<600)await page.waitForFunction(w=>document.querySelector('#student-pdf-frame canvas').getBoundingClientRect().width>w,fit);
   await page.keyboard.press('Escape');
   assert.equal(await page.locator('.preview-surface.is-expanded').count(),0);
   await page.getByRole('button',{name:'Cerrar vista',exact:true}).click();
   assert.equal(await canvas.count(),0);
   await page.locator('#open-guide').click();
   await page.getByText('Página 1 de 2',{exact:true}).waitFor();
   assert.equal(await pageCount.innerText(),'Página 1 de 2');
   await page.keyboard.press('Escape');
   const checks=await page.evaluate(()=>{
    const by=id=>document.getElementById(id),visible=id=>!by(id).hidden;
    return {
     student:visible('student'),teacher:!visible('teacher'),view:visible('activity-view'),
     heading:by('activity-title').textContent==='Actividad real de prueba',
     instructions:by('activity-instructions').textContent.includes('entregalo en la clase'),
     file:!!by('student-file'),pdf:visible('student-pdf'),
     noNativeViewer:by('student-pdf-frame').tagName==='DIV',
     expandButton:by('open-guide').tagName==='BUTTON',overflow:document.documentElement.scrollWidth-innerWidth<=3
    };
   });
   if(!checks.overflow)console.error(await page.evaluate(()=>Array.from(document.querySelectorAll('body *')).filter(el=>el.getBoundingClientRect().right>innerWidth+2&&el.getBoundingClientRect().width>0).slice(0,25).map(el=>[el.tagName,el.id,el.className,Math.round(el.getBoundingClientRect().right),el.scrollWidth,el.clientWidth])));
   const bad=Object.keys(checks).filter(key=>!checks[key]);
   assert.deepEqual(bad,[],width+' · '+bad.join(', '));
   console.log('PASS Actividades clase Chromium '+width+'px · consigna y PDF privado visible.');
   assert.deepEqual(errors,[],'Sin errores del visor');
  }
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1});
