const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const env={console,JSON,Object,Array,Math,Number,String,Date,Set};env.window=env;vm.createContext(env);
for(const f of ['js/club-studio-kits.js','js/club-studio-3d.js','js/club-studio-forge.js','js/club-studio-odyssey.js'])vm.runInContext(read(f),env);
const files=env.StudioKits.create('odyssey3d'),close='</'+'script>',open='<script>';
const check='<script>window.__odysseyTestErrors=[];window.addEventListener("error",e=>window.__odysseyTestErrors.push(String(e.message)));window.addEventListener("unhandledrejection",e=>window.__odysseyTestErrors.push(String(e.reason)));</'+'script>';
const smoke='<script>'+
'setTimeout(function(){try{document.getElementById("mode").click()}catch(e){window.__odysseyTestErrors.push(String(e))}},150);'+
'setTimeout(function(){try{document.getElementById("odyssey-drive").click();document.getElementById("gesture").click();document.getElementById("odyssey-sfx").click();document.getElementById("odyssey-sfx").click()}catch(e){window.__odysseyTestErrors.push(String(e))}},350);'+
'setTimeout(function(){const hud=document.getElementById("odyssey-objectives"),can=document.getElementById("odyssey-map"),game=document.getElementById("arena");'+
'const ok=window.__odysseyTestErrors.length===0&&game&&hud&&hud.textContent.includes("REGISTROS")&&can&&can.getContext("2d")&&document.getElementById("mode").textContent.includes("Editar")&&document.getElementById("odyssey-bar")&&document.getElementById("odyssey-message").textContent;'+
'document.body.setAttribute("data-odyssey-test",ok?"PASS":"FAIL "+window.__odysseyTestErrors.join(" | "));},1800);'+
'</'+'script>';
const html=files['index.html']
.replace('<head>','<head>'+check)
.replace('<link rel="stylesheet" href="style.css">','<style>'+files['style.css']+'</style>')
.replace('<script src="game-config.js">'+close,open+files['game-config.js']+close)
.replace('<script src="game.js">'+close,open+files['game.js']+close)
.replace('</body>',smoke+'</body>');
const filename=path.join(os.tmpdir(),'krueka-odyssey-3d-test.html');fs.writeFileSync(filename,html);
let binary=null;for(const cmd of ['google-chrome','google-chrome-stable','chromium','chromium-browser']){const r=cp.spawnSync(cmd,['--version'],{encoding:'utf8',timeout:3000});if(r.status===0){binary=cmd;break;}}
assert.ok(binary,'Chromium no instalado');
const out=cp.spawnSync(binary,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--virtual-time-budget=3100','--dump-dom','file://'+filename],{encoding:'utf8',timeout:60000,maxBuffer:7e6});
assert.equal(out.status,0,'Chromium falló: '+(out.stderr||'').slice(-1300));
assert.match(out.stdout,/data-odyssey-test="PASS"/,'Odyssey no inició: '+out.stdout.slice(-2300));
console.log('PASS: Chromium ejecuta motor 3D, entra a Jugar, minimapa, controles E/F y botones de audio sin errores.');
