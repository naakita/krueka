const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..');
const setup=`<script>
window.__errors=[];addEventListener('error',e=>__errors.push(String(e.message)));addEventListener('unhandledrejection',e=>__errors.push(String(e.reason)));
const getContext=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl'?null:getContext.call(this,type,...args)};
Storage.prototype.getItem=Storage.prototype.setItem=Storage.prototype.removeItem=function(){throw Error('Almacenamiento bloqueado')};
window.__backend={projects:[],sessions:{},seq:0,tokenSeq:0,aiCalls:0,failLoad:false};
function reply(url,body){const b=__backend;
 if(url.includes('/club_studio_entrar')){if(!['TEST01','TEST02'].includes(body.p_codigo))return {status:200,data:{ok:false,error:'Código incorrecto'}};
  const id=body.p_codigo==='TEST01'?'fixture-one':'fixture-two';Object.keys(b.sessions).forEach(t=>{if(b.sessions[t]===id)delete b.sessions[t]});
  const token='st-'+String(++b.tokenSeq).padStart(64,'0');b.sessions[token]=id;
  return {status:200,data:{ok:true,token,expiresAt:new Date(Date.now()+3600000).toISOString(),student:{student_id:id,nombre:'Alumno de prueba',nivel:id==='fixture-one'?'peques':'mayores'}}};}
 if(url.includes('/club_studio_salir')){delete b.sessions[body.p_token];return {status:200,data:{ok:true}};}
 const id=body.p_student||body.studentId,token=body.p_device||body.deviceId;
 if(!b.sessions[token]||b.sessions[token]!==id)return {status:401,data:{ok:false,error:'Sesión vencida'}};
 const own=b.projects.filter(p=>p.owner===id),ai={ready:false,reason:'budget',dailyLimit:12,usedToday:0};
 if(url.includes('/club_studio_proyectos'))return {status:200,data:own.filter(p=>p.files).map(p=>p.id)};
 if(body.action==='list')return {status:200,data:{ok:true,ai,projects:own.map(p=>({id:p.id,title:p.title,type:'web',updated_at:p.updated_at}))}};
 if(body.action==='load'){if(b.failLoad)return {status:503,data:{ok:false,error:'Fallo de red de prueba'}};return {status:200,data:{ok:true,ai,project:own.find(p=>p.id===body.projectId)||null}};}
 if(body.action==='save'){const project=body.projectId==='new'?'project-'+(++b.seq):body.projectId;
  const data=JSON.parse(JSON.stringify({...body,id:project,owner:id,updated_at:new Date(Date.now()+b.seq*1000).toISOString()}));b.projects=b.projects.filter(p=>p.id!==project);b.projects.push(data);return {status:200,data:{ok:true,id:project}};}
 if(body.action==='ai'){b.aiCalls++;return {status:503,data:{ok:false,error:'Presupuesto agotado',code:'budget',ai}};}
 return {status:200,data:{ok:true,ai}};
}
window.fetch=async(url,options)=>{const r=reply(String(url),JSON.parse(options.body));return {ok:r.status<300,status:r.status,json:async()=>r.data}};
window.XMLHttpRequest=function(){this.open=(method,url)=>{this.url=url};this.setRequestHeader=()=>{};this.send=data=>setTimeout(()=>{const r=reply(this.url,JSON.parse(data));this.status=r.status;this.responseText=JSON.stringify(r.data);this.onload()},10)};
</script>`;
const smoke=`<script>
async function until(fn){const deadline=Date.now()+15000;while(!fn()){if(Date.now()>deadline)throw Error('Espera agotada');await new Promise(r=>setTimeout(r,20));}}
const checks=[];function check(ok,name){if(!ok)checks.push(name)}
(async()=>{await until(()=>window.KruekaStudioAccess&&KruekaStudioAccess.ready);const access=KruekaStudioAccess;
 await access.login('BAD');check(!document.getElementById('krueka-studio'),'código incompleto');
 await access.login('TEST01');check(StudioIA.cloudReady&&Club.alumno.nivel==='peques','Peques entra');
 check(StudioIA.projectId!=='legacy'&&StudioIA.projectId!=='new'&&__backend.projects.length===1,'primer juego guardado');
 check(!document.getElementById('krueka-studio').classList.contains('ks-chat-focus'),'chat y juego juntos');
 await until(()=>document.getElementById('ks-frame').contentWindow&&document.getElementById('ks-frame').getBoundingClientRect().width>0);
 const prompt=document.getElementById('ks-prompt');prompt.value='vidas 5 y tiempo 90';const motor=StudioIA.files['game.js'];await StudioIA.send();
 check(StudioKits.read(StudioIA.files).lives===5&&StudioIA.files['game.js']===motor,'ayuda local aplica reglas');
 check(__backend.aiCalls===0&&document.getElementById('ks-ai-status').textContent.includes('sin consumir IA'),'sin llamadas al proveedor');
 prompt.value='Agregá un dragón';await StudioIA.send();check(prompt.value==='Agregá un dragón'&&StudioIA.files['game.js']===motor,'pedido no reconocido se conserva');
 document.getElementById('ks-class-today').click();check(/Capacidad:/.test(document.getElementById('ks-dialog').textContent)&&/Indicadores:/.test(document.getElementById('ks-dialog').textContent),'clase guiada');document.getElementById('ks-dialog-close').click();
 const first=StudioIA.projectId,token=access.session.token;await StudioIA.close();check(!access.session&&!Club.alumno&&!document.getElementById('krueka-studio')&&!__backend.sessions[token],'salida revoca sesión');
 access.browserId=()=> 'fixture-other-computer';__backend.projects.push({id:'ordinary-web',owner:'fixture-one',title:'Otro trabajo web',updated_at:'2999-01-01'});
 await access.login('TEST01');check(StudioIA.projectId===first&&StudioKits.read(StudioIA.files).lives===5,'otra computadora recupera Studio y omite otros trabajos');
 await StudioIA.close();await access.login('TEST02');check(Club.alumno.nivel==='mayores'&&StudioIA.projectId!==first&&StudioKits.read(StudioIA.files).lives===3,'otro alumno tiene proyecto privado');
 check(!StudioIA.history.some(m=>m.text==='Agregá un dragón'),'sin conversación del compañero');
 check(document.getElementById('ks-prompt').getBoundingClientRect().bottom<=innerHeight&&document.getElementById('ks-send').getBoundingClientRect().bottom<=innerHeight,'cuadro de chat accesible');
 check(document.getElementById('krueka-studio').scrollWidth<=innerWidth,'sin desbordamiento horizontal');
 window.__classroomReady=true;await until(()=>window.__finishClassroom);
 await StudioIA.close();__backend.failLoad=true;await access.login('TEST01');
 check(!document.getElementById('krueka-studio')&&!document.getElementById('studio-entry').hidden&&!access.session,'fallo de carga permite reingresar');
 check(/No se pudo recuperar/.test(document.getElementById('studio-login-message').textContent),'error legible');
 document.body.dataset.classroomSmoke=checks.length+__errors.length===0?'PASS':'FAIL '+checks.concat(__errors).join(' | ');
})().catch(e=>{document.body.dataset.classroomSmoke='FAIL '+e.message});
</script>`;
let html=fs.readFileSync(path.join(root,'studio.html'),'utf8').replace('<head>','<head><base href="file://'+root+'/">'+setup).replace('</body>',smoke+'</body>');
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'krueka-classroom-')),file=path.join(directory,'index.html');
(async()=>{try{
 fs.writeFileSync(file,html);let binary=process.env.STUDIO_CHROMIUM;
 if(process.env.STUDIO_USE_PLAYWRIGHT==='1'){
  const args=process.env.STUDIO_CHROMIUM_ARGS?JSON.parse(process.env.STUDIO_CHROMIUM_ARGS):['--no-zygote','--disable-dev-shm-usage','--in-process-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'];
  const browser=await require('playwright').chromium.launch({headless:true,executablePath:binary,args});
  try{const page=await browser.newPage({viewport:{width:1024,height:768}});await page.goto('file://'+file);await page.waitForFunction(()=>window.__classroomReady,null,{timeout:20000});
   for(const width of [1024,390]){await page.setViewportSize({width,height:844});assert.ok(await page.locator('#ks-prompt').isVisible());assert.ok(await page.locator('#ks-frame').isVisible());
    if(process.env.STUDIO_SCREENSHOT_DIR)await page.screenshot({path:path.join(process.env.STUDIO_SCREENSHOT_DIR,'classroom-fixture-'+width+'.png')});
    const layout=await page.evaluate(()=>({overflow:document.getElementById('krueka-studio').scrollWidth>innerWidth,chat:document.getElementById('ks-chat').clientHeight,prompt:document.getElementById('ks-prompt').getBoundingClientRect().bottom,send:document.getElementById('ks-send').getBoundingClientRect().bottom,height:innerHeight}));
    assert.equal(layout.overflow,false,'Ancho '+width+' '+JSON.stringify(layout));assert.ok(layout.chat>=30,'Chat visible '+JSON.stringify(layout));assert.ok(layout.send<=layout.height,'Enviar visible '+JSON.stringify(layout));
   }
   await page.evaluate(()=>window.__finishClassroom=true);await page.waitForFunction(()=>document.body.dataset.classroomSmoke,null,{timeout:20000});assert.equal(await page.evaluate(()=>document.body.dataset.classroomSmoke),'PASS');
  }finally{await browser.close();}
 }else{
  if(!binary)for(const cmd of ['google-chrome','google-chrome-stable','chromium','chromium-browser']){const r=cp.spawnSync(cmd,['--version'],{encoding:'utf8',timeout:3000});if(r.status===0){binary=cmd;break;}}
  assert.ok(binary,'Chromium no instalado');html=html.replace('window.__classroomReady=true;','window.__finishClassroom=true;window.__classroomReady=true;');fs.writeFileSync(file,html);
  const run=cp.spawnSync(binary,['--headless=new','--no-sandbox','--no-zygote','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--window-size=1024,844','--virtual-time-budget=25000','--dump-dom','file://'+file],{encoding:'utf8',timeout:60000,maxBuffer:5e6});
  assert.equal(run.status,0,'Chromium falló: '+(run.stderr||'').slice(-1000));assert.match(run.stdout,/data-classroom-smoke="PASS"/,'Taller: '+run.stdout.slice(-2500));
 }
}finally{fs.rmSync(directory,{recursive:true,force:true});}
console.log('PASS navegador: código, Peques/Juniors, nube, ayuda local sin proveedor, aislamiento, segundo equipo, salida, carga fallida, almacenamiento bloqueado y Canvas sin WebGL.');
})().catch(e=>{console.error(e);process.exitCode=1});
