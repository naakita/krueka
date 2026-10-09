const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),uri=p=>'file://'+path.join(root,p);
const html='<!doctype html><html lang="es"><head><meta charset="utf-8"><style>.ks-settings{padding:10px}.kh-live{height:320px}.kh-live svg{height:300px}.kr-rp-frame{height:300px}.kr-rp-view{height:300px}model-viewer{height:300px;width:100%;display:block}</style></head><body>'+
 '<div id="ks-create"></div><div id="ks-save">Listo</div><textarea id="ks-prompt"></textarea>'+
 '<script src="'+uri('js/club-studio-kits.js')+'"></'+'script>'+
 '<script src="'+uri('js/club-studio-heroes.js')+'"></'+'script>'+
 '<script>window.errors=[];addEventListener("error",e=>errors.push(e.message));'+
 'class DemoViewer extends HTMLElement{set src(v){this._src=v;setTimeout(()=>this.dispatchEvent(new Event("load")),40)}get src(){return this._src}toDataURL(){const c=document.createElement("canvas");c.width=220;c.height=280;const x=c.getContext("2d");x.fillStyle="#a96e4e";x.fillRect(0,0,220,280);x.fillStyle="#162d3d";x.fillRect(35,28,150,190);return c.toDataURL("image/png")}}'+
 'customElements.define("model-viewer",DemoViewer);window.WebGLRenderingContext=window.WebGLRenderingContext||function(){};'+
 'window.StudioIA={files:StudioKits.create("hero-manager"),heroSelected:"hero-1",builderView:"heroes",cloudReady:true,busy:false,undo:[],checkpoint(){this.undo.push({...this.files})},changed(){},lock(){},validFiles(p){return p},renderCreator(){},refreshAll(){this.renderCreator()}};'+
 'window.StudioIA.files["game-config.js"]=StudioKits.configFile({...StudioKits.read(StudioIA.files),world:{map:[{id:"hero-start",type:"hero",name:"Anterior",x:1,y:2,rot:0,scale:1},{id:"house-1",type:"house",name:"Casa",x:5,y:5,rot:0,scale:1}]}});'+
 '</'+'script>'+
 '<script src="'+uri('js/club-studio-game-builder.js')+'"></'+'script>'+
 '<script src="'+uri('js/club-studio-render-pro.js')+'"></'+'script>'+
 '<script>setTimeout(()=>{try{StudioIA.renderCreator();const btn=document.getElementById("kr-rp-load");if(!btn)throw Error("Render Pro no aparece");btn.click();'+
 'setTimeout(()=>{try{const main=document.getElementById("kr-rp-main");if(main.disabled)throw Error("Botón protagonista bloqueado");main.click();'+
 'setTimeout(()=>{try{const cfg=StudioKits.read(StudioIA.files),hero=cfg.heroes.find(h=>h.id===cfg.active);'+
 'const pass=hero.id==="hero-1"&&hero.portrait.startsWith("data:image/webp;base64,")&&cfg.world.map[0].name===hero.name&&cfg.world.map[1].name==="Casa"&&'+
 'StudioIA.files["hero.js"].includes("Retrato importado del héroe")&&StudioIA.undo.length===1&&StudioHeroes.art(hero).includes(hero.portrait)&&errors.length===0;'+
 'document.body.dataset.heroProtagonist=pass?"PASS":"FAIL "+errors.join("|");'+
 '}catch(e){document.body.dataset.heroProtagonist="FAIL "+e.message}},850);'+
 '}catch(e){document.body.dataset.heroProtagonist="FAIL "+e.message}},60);'+
 '}catch(e){document.body.dataset.heroProtagonist="FAIL "+e.message}},100);</'+'script>'+
 '</body></html>';
const target=path.join(os.tmpdir(),'krueka-protagonist-browser.html');fs.writeFileSync(target,html);
let bin;for(const cmd of ['google-chrome','google-chrome-stable','chromium','chromium-browser'])if(cp.spawnSync(cmd,['--version'],{encoding:'utf8',timeout:3000}).status===0){bin=cmd;break;}
assert.ok(bin,'Chromium requerido');
const r=cp.spawnSync(bin,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--virtual-time-budget=3500','--dump-dom','file://'+target],{encoding:'utf8',timeout:60000,maxBuffer:6000000});
assert.equal(r.status,0,'Error Chromium '+(r.stderr||'').slice(-1000));
assert.match(r.stdout,/data-hero-protagonist="PASS"/,'Render 3D no se convirtió a protagonista: '+r.stdout.slice(-1500));
console.log('PASS: Chromium renderiza modelo simulado, captura WebP y lo aplica como héroe principal al juego.');
