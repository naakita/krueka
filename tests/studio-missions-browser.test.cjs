const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),env={console,JSON,Object,Array,Math,Number,String,Date,Set};env.window=env;vm.createContext(env);
for(const file of ['js/club-studio-kits.js','js/club-studio-missions.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),env);
const files=env.StudioKits.create('space3d'),config=env.StudioKits.read(files);
files['game-config.js']=env.StudioKits.configFile({...config,speed:7,droneSpeed:0,objects:[
  {id:'energy',type:'cell',x:0,z:13,size:1,color:'#67e8f9'},
  {id:'panel',type:'terminal',x:1,z:13,size:1,height:1.5,color:'#67e8f9'},
  {id:'drone',type:'drone',x:0,z:10,size:1,color:'#fb6475'}
]});
// Simular reloj y teclado, sin alterar el estado interno del motor. Forzar la ruta sin GPU.
const setup=`<script>
window.__errors=[];window.addEventListener('error',e=>window.__errors.push(String(e.message)));window.addEventListener('unhandledrejection',e=>window.__errors.push(String(e.reason)));
const getContext=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl'?null:getContext.call(this,type,...args)};
let clock=0;window.requestAnimationFrame=fn=>setTimeout(()=>fn(clock+=50),16);
window.__key=(key,down)=>window.dispatchEvent(new KeyboardEvent(down?'keydown':'keyup',{key}));
</script>`;
const smoke=`<script>
const checks=[];const check=(ok,message)=>{if(!ok)checks.push(message)};
setTimeout(()=>document.getElementById('mode').click(),100);
setTimeout(()=>{__key('e',true);__key('e',false);__key('f',true)},300);
setTimeout(()=>{__key('f',false);check(document.getElementById('hud').textContent.includes('Energía 1/1'),'energía');check(document.getElementById('hud').textContent.includes('Paneles 1/1'),'panel');check(document.getElementById('drone-count').textContent.includes('0 drones'),'pulsos');document.getElementById('pause').click();check(document.getElementById('pause').textContent==='Continuar','pausa');document.getElementById('pause').click();__key('ArrowUp',true)},1200);
const deadline=Date.now()+35000;setTimeout(function finishCheck(){if(document.getElementById('overlay').hidden&&Date.now()<deadline){setTimeout(finishCheck,250);return;}__key('ArrowUp',false);check(!document.getElementById('overlay').hidden&&document.querySelector('#overlay h2').textContent==='MISIÓN CUMPLIDA','victoria: '+document.getElementById('hud').textContent+' / '+document.getElementById('minimap').textContent+' / '+document.getElementById('pause').textContent);document.getElementById('retry').click();check(document.getElementById('overlay').hidden,'reintento');document.getElementById('restart').click();check(document.getElementById('mode').textContent==='▶ Jugar','reinicio');check(document.getElementById('renderer').textContent==='Modo compatible','sin WebGL');check(document.getElementById('arena').width>0,'canvas');document.body.dataset.missionBrowserSmoke=checks.length+window.__errors.length===0?'PASS':'FAIL '+checks.concat(window.__errors).join(' | ')},6500);
</script>`;
const close='</script>',html=files['index.html'].replace('<head>','<head>'+setup)
.replace('<link rel="stylesheet" href="style.css">','<style>'+files['style.css']+'</style>')
.replace('<script src="game-config.js">'+close,'<script>'+files['game-config.js']+close)
.replace('<script src="game.js">'+close,'<script>'+files['game.js']+close)
.replace('</body>',smoke+'</body>');
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'krueka-mission-')),file=path.join(directory,'index.html');
(async()=>{try{
  fs.writeFileSync(file,html);let binary=process.env.STUDIO_CHROMIUM;
  if(process.env.STUDIO_USE_PLAYWRIGHT==='1'){
    const browser=await require('playwright').chromium.launch({headless:true,executablePath:binary,args:['--no-zygote','--disable-dev-shm-usage','--in-process-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
    try{const page=await browser.newPage();await page.setContent(html);await page.waitForFunction(()=>document.body.dataset.missionBrowserSmoke,{timeout:40000});assert.equal(await page.evaluate(()=>document.body.dataset.missionBrowserSmoke),'PASS');}finally{await browser.close();}
  }else{
  if(!binary)for(const cmd of ['google-chrome','google-chrome-stable','chromium','chromium-browser']){const r=cp.spawnSync(cmd,['--version'],{encoding:'utf8',timeout:3000});if(r.status===0){binary=cmd;break;}}
  assert.ok(binary,'Chromium no instalado');
  const run=cp.spawnSync(binary,['--headless=new','--no-sandbox','--no-zygote','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--virtual-time-budget=37000','--dump-dom','file://'+file],{encoding:'utf8',timeout:60000,maxBuffer:5e6});
  assert.equal(run.status,0,'Chromium falló: '+(run.stderr||'').slice(-1300));
  assert.match(run.stdout,/data-mission-browser-smoke="PASS"/,'La misión no se completó: '+run.stdout.slice(-2200));
  }
}finally{fs.rmSync(directory,{recursive:true,force:true});}
console.log('PASS: Chromium sin WebGL, energía, panel, drones, movimiento, pausa, victoria, reintento y reinicio sin errores.');
})().catch(error=>{console.error(error);process.exitCode=1;});
