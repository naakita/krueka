const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),src='file://'+path.join(root,'js/club-studio-alt-help.js');
const html='<!doctype html><html lang="es"><head><meta charset="utf-8"></head><body>'+
 '<section id="ks-ai"><form id="ks-form"><textarea id="ks-prompt">Quiero mejorar mi héroe</textarea></form></section>'+
 '<div id="ks-create"></div>'+
 '<script>window.opened=0;window.open=function(){opened++};window.confirm=function(){return false};'+
 'window.StudioKits={read:function(){return {kind:"hero-manager"}}};'+
 'window.StudioIA={title:"Mi RPG",draft:"",files:{"index.html":"x"},renderAIStatus:function(){},showTab:function(tab){this.tab=tab}};</'+'script>'+
 '<script src="'+src+'"></'+'script>'+
 '<script>setTimeout(function(){try{'+
 'StudioIA.renderAIStatus();StudioIA.renderAIStatus();'+
 'var panel=document.querySelectorAll("#ks-alternative-help"),buttons=document.querySelectorAll(".ks-alt-actions button");'+
 'var pass=panel.length===1&&buttons.length===3;'+
 'document.querySelector("#ks-alt-guide").click();'+
 'var guide=document.querySelector("#ks-alt-detail");pass=pass&&!guide.hidden&&guide.textContent.includes("Personajes");'+
 'document.querySelector("#ks-alt-open-visual").click();pass=pass&&StudioIA.tab==="create";'+
 'document.querySelector("#ks-alt-personal").click();pass=pass&&opened===0;'+
 'document.body.dataset.check=pass?"PASS":"FAIL";'+
 '}catch(e){document.body.dataset.check="FAIL "+e.message}},180);</'+'script>'+
 '</body></html>';
const p=path.join(os.tmpdir(),'krueka-chat-fallback-browser.html');fs.writeFileSync(p,html);
let bin;for(const cmd of ['google-chrome','google-chrome-stable','chromium','chromium-browser'])if(cp.spawnSync(cmd,['--version'],{encoding:'utf8',timeout:3000}).status===0){bin=cmd;break;}
assert.ok(bin,'Se necesita Chromium');
const r=cp.spawnSync(bin,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--virtual-time-budget=1300','--dump-dom','file://'+p],{encoding:'utf8',timeout:60000,maxBuffer:6000000});
assert.equal(r.status,0,'Chromium falló: '+(r.stderr||'').slice(-1500));
assert.match(r.stdout,/data-check="PASS"/,'Falló la interfaz de trabajo sin API: '+r.stdout.slice(-1100));
console.log('PASS: navegador crea ayuda, muestra guía, navega a Bases y protege el enlace externo.');
