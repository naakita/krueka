const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),cp=require('node:child_process'),url=require('node:url');
const root=path.resolve(__dirname,'..');
const lib=url.pathToFileURL(path.join(root,'js/club-studio-kits.js')).href;
const heroes=url.pathToFileURL(path.join(root,'js/club-studio-heroes.js')).href;
const page='<!doctype html><html lang="es"><head><meta charset="utf-8"></head><body><div id="editor"></div><textarea id="ks-prompt"></textarea>'+
 '<script src="'+lib+'"></'+'script><script src="'+heroes+'"></'+'script><script>'+
 'window.errors=[];addEventListener("error",e=>errors.push(e.message));'+
 'const studio={busy:false,cloudReady:true,undo:[],files:StudioKits.create("hero-manager"),checkpoint(){this.undo.push({...this.files})},changed(){},lock(){},showTab(){},refreshAll(){StudioHeroes.renderEditor(this,document.getElementById("editor"),StudioKits.read(this.files))}};'+
 'studio.refreshAll();'+
 'setTimeout(function(){try{'+
 'const before=StudioKits.read(studio.files).heroes.length;'+
 'document.querySelector(\'[data-mold="guardian"]\').click();'+
 'const after=StudioKits.read(studio.files).heroes.length;'+
 'const input=document.querySelector(\'[data-piece="name"]\');input.value="Centinela del Portal";input.dispatchEvent(new Event("input",{bubbles:true}));'+
 'document.querySelector(\'[data-piece="head"]\').value="helmet";'+
 'document.querySelector(\'[data-piece="head"]\').dispatchEvent(new Event("change",{bubbles:true}));'+
 'document.getElementById("kh-apply").click();'+
 'const result=StudioKits.read(studio.files);'+
 'const hero=result.heroes.find(h=>h.id===result.active);'+
 'const pass=errors.length===0&&before===3&&after===4&&hero.name==="Centinela del Portal"&&hero.head==="helmet"&&studio.undo.length===2&&document.querySelector(".kh-live svg");'+
 'document.body.setAttribute("data-editor-smoke",pass?"PASS":"FAIL "+errors.join("|"));'+
 '}catch(e){document.body.setAttribute("data-editor-smoke","FAIL "+e.message)}},250);'+
 '</'+'script></body></html>';
const temp=path.join(os.tmpdir(),'krueka-heroes-editor-browser.html');fs.writeFileSync(temp,page);
let bin;for(const name of ['google-chrome','google-chrome-stable','chromium','chromium-browser'])if(cp.spawnSync(name,['--version'],{encoding:'utf8',timeout:4000}).status===0){bin=name;break}
assert.ok(bin,'Se requiere Chrome/Chromium');
const run=cp.spawnSync(bin,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--virtual-time-budget=1500','--dump-dom','file://'+temp],{encoding:'utf8',timeout:60000,maxBuffer:6e6});
assert.equal(run.status,0,'Chromium falló: '+(run.stderr||'').slice(-900));
assert.match(run.stdout,/data-editor-smoke="PASS"/,'El editor de moldes falló: '+run.stdout.slice(-1250));
console.log('PASS: editor en Chromium crea molde, cambia casco y nombre, guarda configuración y permite Deshacer.');
