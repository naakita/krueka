const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),assert=require('node:assert/strict'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const env={Math,Date,JSON,Object,Array,String,Number,console};env.window=env;vm.createContext(env);
for(const f of ['js/club-studio-kits.js','js/club-studio-heroes.js'])vm.runInContext(read(f),env);
const files=env.StudioKits.create('hero-manager'),close='</'+'script>',open='<script>';
const check='<script>window.__heroErrors=[];addEventListener("error",e=>window.__heroErrors.push(String(e.message)));addEventListener("unhandledrejection",e=>window.__heroErrors.push(String(e.reason)));</'+'script>';
const smoke='<script>setTimeout(function(){try{var list=document.querySelectorAll("#roster [data-id]");var first=document.getElementById("name").textContent;list[1].click();var second=document.getElementById("name").textContent;var result=window.__heroErrors.length===0&&list.length===3&&first!==second&&document.getElementById("portrait").querySelector("svg")&&document.querySelectorAll("#skills li").length===4;document.body.setAttribute("data-hero-browser-smoke",result?"PASS":"FAIL "+window.__heroErrors.join(" | "));}catch(e){document.body.setAttribute("data-hero-browser-smoke","FAIL "+e.message)}},350);</'+'script>';
const html=files['index.html'].replace('<head>','<head>'+check)
 .replace('<link rel="stylesheet" href="style.css">','<style>'+files['style.css']+'</style>')
 .replace('<script src="game-config.js">'+close,open+files['game-config.js']+close)
 .replace('<script src="hero.js">'+close,open+files['hero.js']+close)
 .replace('</body>',smoke+'</body>');
const target=path.join(os.tmpdir(),'studio-heroes-smoke.html');fs.writeFileSync(target,html);
let binary;for(const bin of ['google-chrome','google-chrome-stable','chromium','chromium-browser'])if(cp.spawnSync(bin,['--version'],{timeout:3000,encoding:'utf8'}).status===0){binary=bin;break}
assert.ok(binary,'Requiere Chrome o Chromium');
const run=cp.spawnSync(binary,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--virtual-time-budget=1800','--dump-dom','file://'+target],{encoding:'utf8',timeout:60000,maxBuffer:5000000});
assert.equal(run.status,0,'Error de Chromium: '+(run.stderr||'').slice(-1000));
assert.match(run.stdout,/data-hero-browser-smoke="PASS"/,'La colección no inicia o no cambia de personaje: '+run.stdout.slice(-2000));
console.log('PASS: Chromium muestra tres héroes, cambia el seleccionado y renderiza SVG y habilidades.');
