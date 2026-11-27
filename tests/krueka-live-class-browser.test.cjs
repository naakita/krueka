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
// Datos sintéticos pequeños: doce formatos, incluidos adjuntos que deben quedar inertes.
const sample=(name,mimeType,content,preview=false,storedMime=mimeType)=>({name,mimeType,buffer:Buffer.isBuffer(content)?content:Buffer.from(content),preview,storedMime});
const files=[
 sample('guia-ejemplo.pdf','application/pdf',Buffer.from(pdfFixture,'base64'),true),
 sample('lectura.txt','text/plain','Texto de lectura: <img src=x onerror="window.__unsafeMaterialExecuted=true">\nNo interpretar etiquetas.',true),
 // Extensión reconocida con bytes binarios: el MIME validado también debe bloquear su visor.
 sample('tabla.csv','text/csv',Buffer.from([97,44,98,10,0,255,128]),false,'application/octet-stream'),
 sample('instrucciones.rtf','application/rtf','{\\rtf1\\ansi Material de prueba de Krueka}',true),
 sample('respuesta-perdida.png','image/png',Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWuQAAAAASUVORK5CYII=','base64'),true),
 sample('imagen.gif','image/gif',Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7','base64'),true),
 sample('pagina.html','text/html','<!doctype html><script>window.__unsafeMaterialExecuted=true</script><h1>Adjunto HTML</h1>',false,'application/octet-stream'),
 sample('reintentar.svg','image/svg+xml','<svg xmlns="http://www.w3.org/2000/svg" onload="window.__unsafeMaterialExecuted=true"><rect width="10" height="10"/></svg>',false,'application/octet-stream'),
 sample('datos.bin','application/octet-stream',Buffer.from([0,255,1,128,13,10,26,0,42])),
 sample('sonido.wav','audio/wav',Buffer.from([82,73,70,70,36,0,0,0,87,65,86,69,102,109,116,32,0,255,128]),false,'application/octet-stream'),
 sample('proyecto.sb3','application/x.scratch.sb3',Buffer.from([80,75,3,4,0,255,123,125,0,42]),false,'application/octet-stream'),
 sample('SIN_EXTENSION','application/octet-stream',Buffer.from([0,255,128,65,66,67,10]))
];
const discarded=sample('quitar-antes-de-subir.tmp','application/octet-stream','Este archivo se quita antes de enviar.');
const serializedFiles=[...files,discarded].map(file=>({name:file.name,mimeType:file.mimeType,storedMime:file.storedMime,preview:file.preview,base64:file.buffer.toString('base64')}));

// Solo la comunicación se simula. Formularios, File/FormData, cola, visores y descargas
// pertenecen al cliente real. sessionStorage contiene exclusivamente estos datos QA.
function setup(samples,pdfBase64){
 const storageKey='krueka-class-browser-fixture-v3';
 const code='NPQRSTUVWX23',activityId='11111111-1111-4111-8111-111111111111';
 const initial=()=>({activity:null,materials:[],uploadAttempts:[],downloadIds:[],creates:0});
 if(new URLSearchParams(location.search).get('qa_reset')==='1')sessionStorage.removeItem(storageKey);
 let state;try{state=JSON.parse(sessionStorage.getItem(storageKey)||'null')||initial();}catch{state=initial();}
 const save=()=>sessionStorage.setItem(storageKey,JSON.stringify(state));
 const bytes=base64=>Uint8Array.from(atob(base64),c=>c.charCodeAt(0));
 const base64=buffer=>{let result='';for(const b of new Uint8Array(buffer))result+=String.fromCharCode(b);return btoa(result);};
 const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
 const metadata=m=>({id:m.id,file_name:m.file_name,mime_type:m.mime_type,size_bytes:m.size_bytes,uploaded_at:m.uploaded_at});
 const localFetch=window.fetch.bind(window);
 window.__unsafeMaterialExecuted=false;
 window.fetch=async(url,options={})=>{
  if(!String(url).includes('/functions/v1/krueka-actividades-clase'))return localFetch(url,options);
  const body=typeof options.body==='string'?JSON.parse(options.body):{};
  if(body.action==='lookup'){
   if(body.code==='ABCDEFGHJKLM')return json({ok:true,activity:{title:'Actividad real de prueba',grade:'Octavo grado',subject:'Informática',instructions:'Escribí un documento y entregalo en la clase.',has_pdf:true,pdf_name:'guia-ejemplo.pdf'}});
   if(body.code===code&&state.activity)return json({ok:true,activity:{...state.activity,has_pdf:false,materials:state.materials.map(metadata)}});
   return json({ok:false,error:'Código no válido en esta prueba.'},403);
  }
  if(body.action==='guide')return new Response(bytes(pdfBase64),{headers:{'Content-Type':'application/pdf'}});
  if(body.action==='material'){
   const material=body.code===code?state.materials.find(m=>m.id===body.material_id):null;
   if(!material)return json({ok:false,error:'Material no encontrado.'},404);
   state.downloadIds.push(material.id);save();
   return new Response(bytes(material.base64),{headers:{'Content-Type':material.mime_type,'Content-Disposition':'attachment','X-Content-Type-Options':'nosniff'}});
  }
  if(options.headers?.authorization!=='Bearer fixture-teacher-token')return json({ok:false,error:'Sesión de prueba requerida.'},403);
  if(body.action==='list-classes')return json({ok:true,classes:state.activity?[state.activity]:[],total:state.activity?1:0,page:0,page_size:12});
  if(body.action==='create-class'){
   state.creates++;state.activity={id:activityId,title:body.title,grade:body.grade,subject:body.subject,instructions:body.instructions,accepting:true,created_at:'2026-11-27T10:00:00Z'};save();
   return json({ok:true,activity:state.activity,code});
  }
  if(body.action==='list-materials')return json({ok:true,materials:state.materials.map(metadata)});
  if(body.action==='delete-material'){state.materials=state.materials.filter(m=>m.id!==body.material_id);save();return json({ok:true});}
  return json({ok:false,error:'Acción no prevista en esta prueba.'},400);
 };
 window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:{access_token:'fixture-teacher-token'}},error:null}),signOut:async()=>({error:null})}})};
 window.XMLHttpRequest=class FixtureXHR{
  constructor(){this.upload={};this.headers={};this.aborted=false;this.status=0;this.responseText='';}
  open(method,url){this.method=method;this.url=url;}
  setRequestHeader(name,value){this.headers[name.toLowerCase()]=value;}
  abort(){this.aborted=true;this.onabort?.();}
  send(form){
   (async()=>{
    if(!(form instanceof FormData)||form.get('action')!=='upload-material'||form.get('activity_id')!==activityId||this.headers.authorization!=='Bearer fixture-teacher-token')throw Error('Contrato multipart de prueba incorrecto.');
    const file=form.get('material'),id=form.get('upload_id');
    if(!(file instanceof File)||!/^[-0-9a-f]{36}$/i.test(id))throw Error('Faltó File o upload_id estable.');
    const content=base64(await file.arrayBuffer());
    const attempt={id,name:file.name,base64:content};state.uploadAttempts.push(attempt);save();
    this.upload.onprogress?.({lengthComputable:true,loaded:Math.ceil(file.size/2),total:file.size});
    await new Promise(resolve=>setTimeout(resolve,65));if(this.aborted)return;
    const attempts=state.uploadAttempts.filter(a=>a.name===file.name).length;
    if(file.name==='reintentar.svg'&&attempts===1){this.status=503;this.responseText=JSON.stringify({ok:false,error:'Fallo temporal de prueba; reintentá el archivo.'});this.onload?.();return;}
    let material=state.materials.find(m=>m.id===id);
    if(!material){
     if(state.materials.length>=20){this.status=400;this.responseText=JSON.stringify({ok:false,error:'Cada actividad admite hasta 20 materiales.'});this.onload?.();return;}
     const sample=samples.find(s=>s.name===file.name);
     material={id,file_name:file.name,mime_type:sample?.storedMime||'application/octet-stream',size_bytes:file.size,uploaded_at:'2026-11-27T10:00:00Z',base64:content};state.materials.push(material);save();
    }
    this.upload.onprogress?.({lengthComputable:true,loaded:file.size,total:file.size});
    if(file.name==='respuesta-perdida.png'&&attempts===1){this.onerror?.();return;}
    this.status=200;this.responseText=JSON.stringify({ok:true,material:metadata(material)});this.onload?.();
   })().catch(error=>{this.status=500;this.responseText=JSON.stringify({ok:false,error:error.message});this.onload?.();});
  }
 };
 const pick=(indexes,inputId='new-pdf')=>{
  const input=document.getElementById(inputId),transfer=new DataTransfer();
  for(const index of indexes){const sample=samples[index];transfer.items.add(new File([bytes(sample.base64)],sample.name,{type:sample.mimeType,lastModified:1730000000000+index}));}
  input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));
 };
 window.__classFixture={get state(){return state;},code,pick,reset(){state=initial();save();}};
 if(new URLSearchParams(location.search).get('qa_tools')==='1'){
  const panel=document.createElement('section');panel.className='card';panel.id='qa-fixture-tools';panel.style.marginBottom='18px';
  const title=document.createElement('strong');title.textContent='Prueba local con archivos sintéticos';panel.append(title);
  const description=document.createElement('p');description.textContent='Estos botones existen solo en el fixture QA. No hay credenciales ni cargas a producción.';panel.append(description);
  const button=(text,action)=>{const b=document.createElement('button');b.type='button';b.className='btn secondary';b.textContent=text;b.addEventListener('click',action);panel.append(b);};
  if(new URLSearchParams(location.search).get('docente')==='1'){
   button('Cargar tanda A · 6 formatos',()=>pick([0,1,2,3,4,5]));
   button('Cargar tanda B · 6 formatos y uno para quitar',()=>pick([6,7,8,9,10,11,12]));
   button('Ver como alumno de prueba',()=>{const url=new URL(location.href);url.searchParams.delete('docente');url.searchParams.delete('qa_reset');location.href=url.href;});
  }else button('Usar el código de prueba',()=>{const input=document.getElementById('student-code');input.value=code;input.dispatchEvent(new Event('input',{bubbles:true}));});
  document.querySelector('main').prepend(panel);
 }
}
const embeddedJSON=value=>JSON.stringify(value).replace(/</g,'\\u003c');
const mock='<script>('+setup.toString()+')('+embeddedJSON(serializedFiles)+','+embeddedJSON(pdfFixture)+');</script>';
const fixture=raw.replace('<head>','<head><base href="/">').replace(/<script src="https:\/\/cdn\.jsdelivr[^>]*><\/script>/g,'').replace(/<script src="https:\/\/challenges\.cloudflare[^>]*><\/script>/g,'')
 .replace(/<script src="js\/krueka-clase-temporal\.js[^>]*><\/script>/,mock+'<script>'+client+'</script>');
function createFixtureServer(){return http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 if(pathname==='/actividades-clase.html'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(fixture);return;}
 const name=path.resolve(root,'.'+pathname);
 if(!name.startsWith(root+path.sep)||!fs.existsSync(name)||!fs.statSync(name).isFile()){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',({'.js':'application/javascript','.mjs':'application/javascript','.css':'text/css','.svg':'image/svg+xml'})[path.extname(name)]||'application/octet-stream');
 fs.createReadStream(name).pipe(res);
});}
async function runBrowser(){
 const server=createFixtureServer();
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
  await page.setViewportSize({width:1350,height:900});
  const address='http://127.0.0.1:'+server.address().port+'/actividades-clase.html';
  await page.goto(address+'?docente=1&qa_reset=1');
  await page.locator('#teacher-board').waitFor({state:'visible'});
  await page.locator('#new-grade').fill('Octavo grado');
  await page.locator('#new-subject').fill('Informática');
  await page.locator('#new-title').fill('Materiales de doce formatos');
  await page.locator('#new-instructions').fill('Revisá los materiales y prepará tu trabajo para entregar en esta clase.');
  const uploadFiles=list=>list.map(({name,mimeType,buffer})=>({name,mimeType,buffer}));
  const input=page.locator('#new-pdf'),rows=page.locator('#new-material-queue .material-queue-row');
  assert.ok(!await input.getAttribute('accept'),'El selector docente no filtra formatos');
  await input.setInputFiles(uploadFiles(files.slice(0,6)));
  assert.equal(await rows.count(),6,'La primera tanda queda en la cola');
  await input.setInputFiles(uploadFiles([...files.slice(6),discarded]));
  assert.equal(await rows.count(),13,'La segunda tanda se suma sin perder la primera');
  await page.getByRole('button',{name:'Quitar '+discarded.name+' de la lista',exact:true}).click();
  assert.equal(await rows.count(),12,'Quitar elimina solamente el archivo seleccionado');
  assert.deepEqual(await rows.locator('strong').allTextContents(),files.map(f=>f.name));
  for(const width of [320,390,1350]){
   await page.setViewportSize({width,height:900});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth<=3),'La cola de doce archivos cabe a '+width+'px');
  }
  await page.locator('#create-button').click();
  await page.locator('#new-material-queue progress').first().waitFor({state:'visible'});
  await page.waitForFunction(()=>!document.getElementById('create-button').disabled&&document.getElementById('create-button').textContent==='Reintentar archivos pendientes');
  assert.equal(await page.locator('#new-material-queue .material-queue-row[data-state="error"]').count(),2,'Fallo temporal y respuesta perdida permanecen visibles');
  assert.equal(await page.locator('#new-material-queue .material-queue-row[data-state="uploaded"]').count(),10);
  assert.equal(await page.locator('#new-title').inputValue(),'Materiales de doce formatos');
  assert.ok(await page.locator('#new-title').isDisabled(),'No se crea otra actividad al reintentar');
  const code=await page.locator('#new-code').innerText();
  let saved=await page.evaluate(()=>window.__classFixture.state);
  assert.equal(saved.creates,1);assert.equal(saved.materials.length,11,'La respuesta perdida ya había guardado su material');
  assert.equal(saved.uploadAttempts.length,12);assert.ok(saved.uploadAttempts.every(a=>a.name!==discarded.name));
  await page.locator('#create-button').click();
  await page.waitForFunction(()=>!document.getElementById('create-button').disabled&&document.getElementById('create-button').textContent.includes('Crear actividad')&&document.querySelectorAll('#new-material-queue .material-queue-row').length===0);
  saved=await page.evaluate(()=>window.__classFixture.state);
  assert.equal(saved.creates,1,'El reintento conserva actividad y código');
  assert.equal(saved.materials.length,12);assert.equal(new Set(saved.materials.map(m=>m.id)).size,12);
  assert.equal(await page.locator('#new-code').innerText(),code);
  const retried=saved.uploadAttempts.filter(a=>a.name==='reintentar.svg');
  assert.equal(retried.length,2);assert.equal(retried[0].id,retried[1].id,'upload_id no cambia al reintentar');
  assert.equal(retried[0].base64,retried[1].base64,'El reintento conserva los bytes originales');
  assert.equal(saved.uploadAttempts.filter(a=>a.name==='respuesta-perdida.png').length,1,'La reconciliación recupera la respuesta perdida sin duplicar la carga');
  assert.equal(saved.materials.filter(m=>m.file_name==='respuesta-perdida.png').length,1);
  assert.ok(!await page.locator('#new-title').isDisabled());
  console.log('PASS Actividades clase Chromium · 12 formatos en dos tandas, quitar, progreso, reintento estable y respuesta perdida.');

  await page.goto(address);
  await page.locator('#student-code').fill(code);
  await page.locator('#lookup-button').click();
  await page.waitForFunction(()=>document.querySelectorAll('#student-materials-list > .item').length===12);
  const materialRows=page.locator('#student-materials-list > .item');
  let completedDownloads=0;
  for(const file of files){
   const item=materialRows.filter({has:page.getByText(file.name,{exact:true})});
   assert.equal(await item.count(),1,file.name+' se muestra una sola vez');
   assert.equal(await item.getByRole('button',{name:'Ver vista previa',exact:true}).count(),file.preview?1:0,file.name+' usa MIME validado para decidir la vista previa');
   // Blink descarta en silencio la descarga 11 de una ráfaga inferior a 1 s.
   // Respetar ese límite conserva las doce descargas reales y sus comprobaciones.
   // chromium/src/third_party/blink/renderer/core/frame/local_frame.cc: ShouldThrottleDownload.
   if(completedDownloads&&completedDownloads%10===0)await new Promise(resolve=>setTimeout(resolve,1100));
   console.log('Descargando material Chromium: '+file.name);
   const waiting=page.waitForEvent('download');
   await item.getByRole('button',{name:'↓ Descargar archivo',exact:true}).click();
   const download=await waiting,stream=await download.createReadStream(),chunks=[];
   assert.ok(stream,'La descarga tiene contenido');for await(const chunk of stream)chunks.push(chunk);
   assert.equal(download.suggestedFilename(),file.name);assert.deepEqual(Buffer.concat(chunks),file.buffer,'Bytes exactos al descargar '+file.name);
   completedDownloads++;
   console.log('PASS descarga Chromium '+file.name+' · '+file.buffer.length+' bytes exactos.');
  }
  assert.equal(completedDownloads,files.length,'Se completan y comprueban las doce descargas');
  const textRow=materialRows.filter({has:page.getByText('lectura.txt',{exact:true})});
  await textRow.getByRole('button',{name:'Ver vista previa',exact:true}).click();
  await textRow.locator('.preview-plain').waitFor();
  assert.equal(await textRow.locator('.preview-plain').innerText(),files.find(f=>f.name==='lectura.txt').buffer.toString());
  assert.equal(await textRow.locator('.preview-plain img').count(),0,'El texto con etiquetas se presenta como texto');
  assert.equal(await page.locator('#student-materials iframe, #student-materials object, #student-materials embed').count(),0);
  assert.equal(await page.evaluate(()=>window.__unsafeMaterialExecuted),false,'HTML, SVG y contenido desconocido no se ejecutan');
  assert.deepEqual(errors,[],'Sin errores de interfaz en la creación y las descargas');
  console.log('PASS Actividades clase Chromium · alumno descarga los 12 originales; HTML/SVG/binarios quedan sin visor ni ejecución.');
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
}
module.exports={html:fixture,setup,files,discarded,pdfFixture,createFixtureServer,runBrowser};
if(require.main===module)runBrowser().catch(e=>{console.error(e);process.exitCode=1});
