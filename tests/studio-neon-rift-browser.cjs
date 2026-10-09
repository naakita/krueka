const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),cp=require('node:child_process');
const root=path.join(__dirname,'..');
const win={};const env={window:win,console,JSON,Math,Number,String,Array,Object,Date};
Object.assign(env,win);env.window=env;vm.createContext(env);
for(const file of ['js/club-studio-kits.js','js/club-studio-showcase.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),env);
const p=env.StudioKits.create('neon-rift'),close='</'+'script>',open='<script>';
const html=p['index.html']
.replace('<link rel="stylesheet" href="style.css">','<style>'+p['style.css']+'</style>')
.replace('<script src="game-config.js">'+close,open+p['game-config.js']+close)
.replace('<script src="game.js">'+close,open+p['game.js']+close)
.replace('</head>','<script>window.__errors=[];window.addEventListener("error",function(e){window.__errors.push(String(e.message))});</'+'script></head>')
.replace('</body>','<script>document.getElementById("mode").click();setTimeout(function(){var canvas=document.getElementById("arena");var ok=canvas&&document.getElementById("sheet").hidden&&document.getElementById("wave").textContent.indexOf("1 /")===0&&window.__errors.length===0;document.body.setAttribute("data-browser-smoke",ok?"PASS":"FAIL "+window.__errors.join(", "));},700);</'+'script></body>');
const file=path.join(os.tmpdir(),'krueka-neon-rift-browser-smoke.html');fs.writeFileSync(file,html);
let bin=null;for(const name of ['google-chrome','google-chrome-stable','chromium','chromium-browser']){const run=cp.spawnSync(name,['--version'],{encoding:'utf8',timeout:4000});if(run.status===0){bin=name;break;}}
assert.ok(bin,'Chrome o Chromium se requiere para comprobar el juego en un navegador real.');
const run=cp.spawnSync(bin,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--virtual-time-budget=2200','--dump-dom','file://'+file],{encoding:'utf8',timeout:60000,maxBuffer:3*1024*1024});
assert.equal(run.status,0,'El navegador terminó incorrectamente: '+(run.stderr||'').slice(-1000));
assert.match(run.stdout,/data-browser-smoke="PASS"/,'El juego no inició en Chromium: '+run.stdout.slice(-2000));
console.log('PASS: Chromium inicia el videojuego, pinta el canvas y comienza una partida sin errores JS.');
