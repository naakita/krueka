const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const from=file=>'file://'+path.join(root,file);
const page='<!doctype html><html lang="es"><head><meta charset="utf-8"></head><body>'+
 '<div id="ks-create"></div><input id="ks-prompt">'+
 '<script src="'+from('js/club-studio-kits.js')+'"></'+'script>'+
 '<script src="'+from('js/club-studio-heroes.js')+'"></'+'script>'+
 '<script>window.errors=[];window.addEventListener("error",e=>errors.push(e.message));window.StudioIA={files:StudioKits.create("hero-manager"),heroSelected:"hero-1",builderView:"world",cloudReady:true,busy:false,undo:[],checkpoint(){this.undo.push({...this.files})},changed(){},lock(){},showTab(){},validFiles(x){return x},refreshAll(){this.renderCreator()},renderCreator(){}};</'+'script>'+
 '<script src="'+from('js/club-studio-game-builder.js')+'"></'+'script>'+
 '<script src="'+from('js/club-studio-render-pro.js')+'"></'+'script>'+
 '<script>setTimeout(()=>{try{StudioIA.renderCreator();var top=document.getElementById("kg-heroes-top");var worldInitially=!!top&&!!document.getElementById("kg-canvas");top.click();var panel=document.querySelector(".kr-render-pro");var svg=document.querySelector(".kr-rp-fallback svg");var topInside=document.getElementById("kh-open-render");var backInside=document.getElementById("kh-back-world");var collection=document.querySelector(".kh-collection");'+
 'var model=document.getElementById("kr-rp-model");model.value="cleric";'+
 'document.getElementById("kh-apply").click();var cfg=StudioKits.read(StudioIA.files);'+
 'var passed=worldInitially&&!!panel&&!!svg&&!!topInside&&!!backInside&&!!collection&&panel.compareDocumentPosition(collection)&Node.DOCUMENT_POSITION_FOLLOWING&&StudioIA.builderView==="heroes"&&cfg.heroes[0].renderModel==="cleric"&&StudioIA.undo.length===1&&cfg.heroes[0].portrait==="";'+
 'document.getElementById("kr-rp-back").click();passed=passed&&document.getElementById("kg-canvas")!=null&&StudioIA.builderView==="world";'+
 'document.body.setAttribute("data-render-pro-smoke",passed&&errors.length===0?"PASS":"FAIL "+errors.join("|"));'+
 '}catch(e){document.body.setAttribute("data-render-pro-smoke","FAIL "+e.message);}},150);</'+'script>'+
 '</body></html>';
const file=path.join(os.tmpdir(),'krueka-render-pro-browser.html');fs.writeFileSync(file,page);
let bin;for(const cmd of ['google-chrome','google-chrome-stable','chromium','chromium-browser'])if(cp.spawnSync(cmd,['--version'],{encoding:'utf8',timeout:3000}).status===0){bin=cmd;break}
assert.ok(bin,'Chromium requerido');
const run=cp.spawnSync(bin,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--virtual-time-budget=1500','--dump-dom','file://'+file],{encoding:'utf8',timeout:60000,maxBuffer:6000000});
assert.equal(run.status,0,'Chromium falló: '+(run.stderr||'').slice(-950));
assert.match(run.stdout,/data-render-pro-smoke="PASS"/,'Render Pro no abrió, no guardó o no regresó al mapa: '+run.stdout.slice(-1400));
console.log('PASS: Chromium muestra Render Pro, conserva modelo seleccionado y regresa al mundo.');
