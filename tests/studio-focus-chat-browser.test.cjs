const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),code=fs.readFileSync(path.join(root,'club/club-studio.css'),'utf8'),uri='file://'+path.join(root,'js/club-studio-focus-chat.js');
const html='<!doctype html><html lang="es"><head><meta charset="utf-8"><style>'+
 '#krueka-studio{position:fixed;inset:0}.ks-main{display:grid;grid-template-columns:32% 1fr;height:75vh}.ks-work{height:100%}.ks-right{display:grid}.ks-top{height:58px}.ks-projectbar{height:60px}.ks-ai{height:100%}'+code+'</style></head><body>'+
 '<div id="krueka-studio"><header class="ks-top"><div class="ks-brand">Krueka Studio</div><span class="ks-spacer"></span><span id="ks-save">Listo</span><button id="ks-save-btn">Guardar</button><button id="ks-close">Salir</button></header>'+
 '<nav class="ks-projectbar"><button id="ks-new">Crear</button></nav><div class="ks-main"><section class="ks-left"><nav class="ks-tabs"><button data-tab="ai">Chat</button><button data-tab="create">Bases</button></nav><div class="ks-work">'+
 '<section id="ks-ai"><div id="ks-ai-status">Conexión lista</div><div id="ks-usage">0 / 12</div><div class="ks-modes"><button id="ks-mode-plan">Planear</button><span id="ks-model">IA del taller</span></div>'+
 '<div id="ks-chat"></div><form id="ks-form" class="ks-compose"><label for="ks-prompt">Tu idea</label><textarea id="ks-prompt" placeholder="Preguntá a Krueka"></textarea><div class="ks-actions"><span class="ks-tip">Un paso a la vez</span><button id="ks-send">Enviar</button></div></form></section>'+
 '<section id="ks-create" hidden></section></div></section><section class="ks-right"><nav class="ks-previewbar">Tu juego</nav><div class="ks-preview"><iframe id="ks-frame"></iframe></div></section></div></div>'+
 '<script>window.errors=[];window.addEventListener("error",e=>errors.push(e.message));'+
 'window.StudioKits={read:()=>({kind:"hero-manager"})};window.StudioIA={cloudReady:true,aiReady:true,aiStatus:{},title:"Mi videojuego original",history:[{role:"sys",text:"Proyecto listo"}],renderAIStatus(){},renderChat(){},showTab(tab){this.tab=tab},setMode(m){this.mode=m}};</'+'script>'+
 '<script src="'+uri+'"></'+'script>'+
 '<script>setTimeout(()=>{try{const S=StudioIA,P=document.getElementById("krueka-studio");S.renderAIStatus();const first=P.classList.contains("ks-chat-focus");const title=document.getElementById("ks-focus-project").textContent;const rightHidden=getComputedStyle(document.querySelector(".ks-right")).display==="none";'+
 'document.getElementById("ks-focus-game").click();const previewOpen=P.classList.contains("ks-focus-game")&&getComputedStyle(document.querySelector(".ks-right")).display!=="none";'+
 'document.getElementById("ks-focus-back").click();const returned=!P.classList.contains("ks-chat-focus")&&S.tab==="ai";'+
 'document.getElementById("ks-focus-open").click();const reentered=P.classList.contains("ks-chat-focus");'+
 'S.title="Proyecto nuevo";S.history=[{role:"user",text:"Mi aventura"}];S.renderChat();S.renderAIStatus();const updated=document.getElementById("ks-focus-project").textContent==="Proyecto nuevo";const hidden=document.getElementById("ks-focus-empty").hidden;'+
 'S.showTab("create");const editable=!P.classList.contains("ks-chat-focus")&&S.tab==="create";'+
 'document.body.setAttribute("data-chat-smoke",first&&title==="Mi videojuego original"&&rightHidden&&previewOpen&&returned&&reentered&&updated&&hidden&&editable&&errors.length===0?"PASS":"FAIL"+errors.join("|"));'+
 '}catch(e){document.body.setAttribute("data-chat-smoke","FAIL "+e.message)}},120);</'+'script></body></html>';
const temp=path.join(os.tmpdir(),'krueka-focus-chat-test.html');fs.writeFileSync(temp,html);
let bin;for(const name of ['google-chrome','google-chrome-stable','chromium','chromium-browser'])if(cp.spawnSync(name,['--version'],{timeout:3000,encoding:'utf8'}).status===0){bin=name;break}
assert.ok(bin,'Se necesita Chromium');
const r=cp.spawnSync(bin,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--virtual-time-budget=1200','--dump-dom','file://'+temp],{encoding:'utf8',timeout:60000,maxBuffer:6e6});
assert.equal(r.status,0,'Chromium no abrió: '+(r.stderr||'').slice(-800));
assert.match(r.stdout,/data-chat-smoke="PASS"/,'Interfaz individual o navegación defectuosa: '+r.stdout.slice(-1400));
console.log('PASS: chat limpio, vista del juego, cambio de proyecto y vuelta al editor en Chromium.');
