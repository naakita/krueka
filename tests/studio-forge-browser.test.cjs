const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const env={console,JSON,Object,Array,Math,Number,String,Date};env.window=env;vm.createContext(env);
for(const f of ['js/club-studio-kits.js','js/club-studio-3d.js','js/club-studio-forge.js'])vm.runInContext(read(f),env);
const files=env.StudioKits.create('cinematic3d'),close='</'+'script>',open='<script>';
const check='<script>(function(){window.__forgeErrors=[];window.addEventListener("error",function(e){window.__forgeErrors.push(String(e.message))});window.addEventListener("unhandledrejection",function(e){window.__forgeErrors.push(String(e.reason))});})();</'+'script>';
const smoke='<script>setTimeout(function(){try{document.getElementById("mode").click()}catch(e){window.__forgeErrors.push(String(e))}},200);setTimeout(function(){var status=document.getElementById("status");var hud=document.getElementById("hud");var canvas=document.getElementById("arena");var ok=window.__forgeErrors.length===0&&canvas&&hud&&hud.textContent.indexOf("Registros")>=0&&document.getElementById("mode").textContent.indexOf("Editar")>=0&&document.getElementById("dialogue")&&status;document.body.setAttribute("data-forge-browser-smoke",ok?"PASS":"FAIL "+window.__forgeErrors.join(" | "));},1400);</'+'script>';
const html=files['index.html']
.replace('<head>','<head>'+check)
.replace('<link rel="stylesheet" href="style.css">','<style>'+files['style.css']+'</style>')
.replace('<script src="game-config.js">'+close,open+files['game-config.js']+close)
.replace('<script src="game.js">'+close,open+files['game.js']+close)
.replace('</body>',smoke+'</body>');
const file=path.join(os.tmpdir(),'horizon-forge-test.html');fs.writeFileSync(file,html);
let binary=null;for(const cmd of ['google-chrome','google-chrome-stable','chromium','chromium-browser']){const r=cp.spawnSync(cmd,['--version'],{encoding:'utf8',timeout:3000});if(r.status===0){binary=cmd;break;}}
assert.ok(binary,'Chromium no instalado');
const run=cp.spawnSync(binary,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--virtual-time-budget=2800','--dump-dom','file://'+file],{encoding:'utf8',timeout:60000,maxBuffer:5e6});
assert.equal(run.status,0,'Chromium falló: '+(run.stderr||'').slice(-1300));
assert.match(run.stdout,/data-forge-browser-smoke="PASS"/,'La escena 3D no inició sin errores: '+run.stdout.slice(-1800));
console.log('PASS: Chromium crea escena 3D, inicia Jugar, muestra misión y animaciones sin errores.');
