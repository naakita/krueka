/* Krueka Studio IA · navegador, sin instalación.
   Copiloto de construcción para Juniors: prompt -> cambios -> vista previa -> guardar en nube. */
(function(){
'use strict';
if(window.StudioIA&&window.StudioIA.__loaded)return;
const StudioIA={__loaded:true,
  files:{},history:[],current:'index.html',preview:'index.html',mode:'build',busy:false,dirty:false,saveTimer:null,cloudReady:false,saveQueue:Promise.resolve(),
  sid(){return Club.alumno&&(Club.alumno.student_id||Club.alumno.id)},
  did(){return typeof deviceId==='function'?deviceId():'browser'},
  initial(){
    return {
'index.html':`<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mi portal de juegos</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
<header class="top"><strong>🎮 MI ARCADE</strong><span>Club de Informática</span></header>
<main>
<section class="hero">
  <p class="kicker">MI PORTAL DE VIDEOJUEGOS</p>
  <h1>Construí, probá y mejorá tus propios juegos</h1>
  <p>Esta es tu plataforma. Cada clase vas a agregar algo nuevo con ayuda de la IA.</p>
</section>
<section>
  <h2>Mis juegos</h2>
  <div class="games">
    <article class="game ready"><div class="art">🤖</div><h3>Mi primer juego</h3><p>Tu primera misión empieza acá.</p><a href="games/juego-01/index.html">JUGAR →</a></article>
    <article class="game locked"><div class="art">🏎️</div><h3>Próximamente</h3><p>Lo vas a crear en otra misión.</p><span>BLOQUEADO</span></article>
    <article class="game locked"><div class="art">🌎</div><h3>Zona 3D</h3><p>La desbloquearemos más adelante.</p><span>BLOQUEADO</span></article>
  </div>
</section>
</main>
<script src="script.js"><\/script>
</body>
</html>`,
'style.css':`:root{font-family:system-ui,sans-serif;color:#eef2ff;background:#070b16}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 75% 10%,#1d3d69 0,#0c1426 35%,#070b16 70%);min-height:100vh}.top{display:flex;justify-content:space-between;gap:16px;padding:18px 6vw;border-bottom:1px solid #ffffff20}.top span{color:#9aa9c7}main{width:min(1050px,90%);margin:auto;padding:46px 0}.hero{max-width:730px;padding:22px 0 44px}.kicker{font-size:12px;letter-spacing:.18em;color:#7dd3fc;font-weight:800}.hero h1{font-size:clamp(34px,6vw,66px);line-height:1;margin:10px 0}.hero p:not(.kicker){color:#aab6ce;font-size:18px}.games{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px}.game{border:1px solid #ffffff18;background:#ffffff09;border-radius:20px;padding:18px;min-height:270px}.game .art{height:125px;display:grid;place-items:center;font-size:68px;border-radius:14px;background:#ffffff0b}.game h3{font-size:20px}.game p{color:#9aa9c7}.game a,.game span{display:inline-block;margin-top:8px;font-weight:800;color:#7dd3fc;text-decoration:none}.locked{opacity:.58}`,
'script.js':`console.log("Mi Arcade está listo para crecer.");`,
'games/juego-01/index.html':`<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mi primer juego</title><link rel="stylesheet" href="game.css"></head>
<body>
<a class="back" href="../../index.html">← Volver a juegos</a>
<div class="stage">
  <h1>🤖 Mi primer juego</h1>
  <p>Hoy vas a pedirle a la IA que transforme esta pantalla en tu primera misión jugable.</p>
  <div class="arena" id="arena"><div class="player" id="player">🤖</div></div>
  <p class="help">Usá las flechas. Después pedile a la IA objetos, puntos y una meta.</p>
</div>
<script src="game.js"><\/script>
</body></html>`,
'games/juego-01/game.css':`*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif;background:#0b1020;color:#eef2ff}.back{display:inline-block;margin:18px;color:#93c5fd;text-decoration:none}.stage{width:min(880px,92%);margin:auto;text-align:center}.arena{height:430px;position:relative;overflow:hidden;border:2px solid #30476d;border-radius:18px;background:linear-gradient(#172554,#0f172a)}.player{position:absolute;left:40px;top:180px;font-size:48px;line-height:1}.help{color:#aab6ce}`,
'games/juego-01/game.js':`const p=document.getElementById("player");let x=40,y=180;addEventListener("keydown",e=>{const d={ArrowLeft:[-18,0],ArrowRight:[18,0],ArrowUp:[0,-18],ArrowDown:[0,18]}[e.key];if(!d)return;e.preventDefault();x=Math.max(0,Math.min(820,x+d[0]));y=Math.max(0,Math.min(375,y+d[1]));p.style.left=x+"px";p.style.top=y+"px";});`
    };
  },
  install(){
    if(typeof Club==='undefined')return;
    const old=Club.mapa;
    if(old&&!old._studio){
      const wrapped=function(){
        const r=old.apply(this,arguments);
        setTimeout(()=>StudioIA.addEntry(),80);
        return r;
      }; wrapped._studio=true; Club.mapa=wrapped;
    }
    setTimeout(()=>this.addEntry(),500);
    this.entryTimer=setInterval(()=>this.addEntry(),1500);
  },
  addEntry(){
    if(!Club.alumno||Club.alumno.nivel!=='mayores'||document.getElementById('krueka-studio'))return;
    const box=document.getElementById('club-box');
    const dashboard=box&&box.querySelector('.club-dashboard');
    if(!box||!dashboard)return;

    if(!document.getElementById('studio-ia-entry')){
      const anchor=box.querySelector('.club-dashboard-hero')||box.firstElementChild;
      const card=document.createElement('section');card.id='studio-ia-entry';
      card.style.cssText='margin:16px 0;padding:22px;border:2px solid rgba(39,131,222,.48);border-radius:18px;background:linear-gradient(135deg,rgba(39,131,222,.18),rgba(155,112,210,.13));display:flex;align-items:center;gap:16px;flex-wrap:wrap;box-shadow:0 10px 30px rgba(28,75,120,.12)';
      card.innerHTML='<div style="font-size:46px">✨</div><div style="flex:1;min-width:230px"><span class="club-kicker">NUEVO · CREÁ JUEGOS CON IA</span><h2 style="margin:3px 0">Krueka Studio IA</h2><p style="margin:0;color:var(--tx2)">Pedí un cambio, mirá el resultado y seguí construyendo. Funciona desde el navegador y guarda tu proyecto en Krueka.</p></div><button class="club-primary" type="button" style="min-height:44px;padding:10px 16px">Abrir Studio IA →</button>';
      card.querySelector('button').onclick=()=>this.open();
      if(anchor&&anchor.parentNode)anchor.insertAdjacentElement('afterend',card);else box.prepend(card);
    }

    if(!document.getElementById('studio-ia-float')){
      const float=document.createElement('button');float.id='studio-ia-float';float.type='button';
      float.textContent='✨ Studio IA';
      float.style.cssText='position:fixed;right:22px;bottom:22px;z-index:120;border:0;border-radius:999px;background:#2783de;color:white;font-weight:800;padding:13px 18px;box-shadow:0 10px 30px rgba(0,0,0,.28);cursor:pointer';
      float.onclick=()=>this.open();
      document.getElementById('club-ov')?.appendChild(float);
    }
  },
  async request(body){
    const res=await fetch(SUPABASE_URL+'/functions/v1/krueka-studio-ai',{
      method:'POST',
      headers:{'Content-Type':'application/json','apikey':SUPABASE_KEY},
      body:JSON.stringify(Object.assign({studentId:this.sid(),deviceId:this.did()},body))
    });
    let data={};try{data=await res.json()}catch(_e){}
    if(!res.ok||data.ok===false)throw new Error(data.error||('Error '+res.status));
    return data;
  },
  async open(){
    if(!this.sid())return alert('Entrá al Club con tu código para usar el Studio.');
    if(Club.alumno.nivel!=='mayores')return;
    if(document.getElementById('krueka-studio'))return;
    await this.saveQueue;
    clearTimeout(this.saveTimer);this.cloudReady=false;this.dirty=false;this.busy=false;
    this.files=this.initial();this.history=[];this.current='index.html';this.preview='index.html';
    const old=document.getElementById('krueka-studio');if(old)old.remove();
    const panel=document.createElement('div');panel.id='krueka-studio';
    panel.style.cssText='position:fixed;inset:0;z-index:180;background:#080b12;color:#eef3ff;overflow:hidden;font-family:Inter,system-ui,sans-serif';
    panel.innerHTML=`
      <style>
      #krueka-studio *{box-sizing:border-box}#krueka-studio button,#krueka-studio input,#krueka-studio textarea,#krueka-studio select{font:inherit}
      .ks-top{height:58px;display:flex;align-items:center;gap:10px;padding:8px 14px;border-bottom:1px solid #ffffff17;background:#0d111b}.ks-brand{font-weight:850}.ks-badge{font-size:11px;padding:4px 8px;border:1px solid #5aa6ff55;border-radius:999px;color:#9ed0ff}.ks-spacer{flex:1}.ks-btn{border:1px solid #ffffff1e;background:#151b29;color:#eef3ff;border-radius:9px;min-height:38px;padding:7px 12px;cursor:pointer;font-weight:700}.ks-btn.primary{background:#2783de;border-color:#2783de}.ks-btn:disabled{opacity:.45;cursor:not-allowed}
      .ks-main{height:calc(100% - 58px);display:grid;grid-template-columns:minmax(300px,38%) 1fr}.ks-left{min-width:0;border-right:1px solid #ffffff17;display:grid;grid-template-rows:auto 1fr auto}.ks-modes{display:flex;gap:6px;padding:10px 12px;border-bottom:1px solid #ffffff12}.ks-mode[aria-pressed=true]{background:#23456c;border-color:#5aa6ff}.ks-chat{overflow:auto;padding:14px}.ks-msg{max-width:94%;padding:10px 12px;border-radius:12px;margin:0 0 10px;white-space:pre-wrap;line-height:1.45}.ks-msg.user{margin-left:auto;background:#1f4f7c}.ks-msg.ai{background:#171e2d;border:1px solid #ffffff13}.ks-msg.sys{background:#12261e;border:1px solid #46a17155;color:#bfe8d0}.ks-compose{padding:12px;border-top:1px solid #ffffff17}.ks-compose textarea{width:100%;min-height:84px;max-height:150px;resize:vertical;background:#0f1521;color:#fff;border:1px solid #ffffff22;border-radius:10px;padding:10px}.ks-actions{display:flex;align-items:center;gap:8px;margin-top:8px}.ks-tip{font-size:11px;color:#91a0b8;flex:1}
      .ks-right{min-width:0;display:grid;grid-template-rows:48px 1fr}.ks-previewbar{display:flex;align-items:center;gap:8px;padding:7px 10px;border-bottom:1px solid #ffffff17;background:#0d111b}.ks-previewbar select{max-width:300px;background:#151b29;color:#fff;border:1px solid #ffffff22;border-radius:8px;padding:7px}.ks-preview{min-height:0;display:grid;grid-template-columns:1fr}.ks-preview iframe{width:100%;height:100%;border:0;background:#fff}.ks-code{display:none;height:100%;grid-template-columns:190px 1fr;background:#0a0f19}.ks-code.on{display:grid}.ks-preview iframe.off{display:none}.ks-files{border-right:1px solid #ffffff17;overflow:auto;padding:8px}.ks-file{display:block;width:100%;text-align:left;border:0;background:transparent;color:#b8c5dc;padding:7px 8px;border-radius:7px;cursor:pointer;font-size:12px;overflow:hidden;text-overflow:ellipsis}.ks-file.active{background:#1f3c5c;color:#fff}.ks-editor{width:100%;height:100%;resize:none;border:0;outline:0;padding:14px;background:#070b12;color:#dbeafe;font:12px/1.55 Consolas,monospace;tab-size:2}
      .ks-save{font-size:11px;color:#99a8bf}.ks-model{font-size:10px;color:#7dd3fc}.ks-onboard{padding:12px;border:1px dashed #45658a;border-radius:12px;background:#0d1725;margin-bottom:12px}.ks-onboard b{display:block;margin-bottom:5px}.ks-chip{display:inline-block;margin:4px 3px 0 0;padding:5px 7px;border-radius:8px;background:#ffffff0d;color:#bcd0ea;font-size:11px}
      @media(max-width:780px){.ks-main{grid-template-columns:1fr;grid-template-rows:48% 52%}.ks-left{border-right:0;border-bottom:1px solid #ffffff17}.ks-top .ks-hide-small{display:none}.ks-code.on{grid-template-columns:130px 1fr}}
      </style>
      <header class="ks-top"><div class="ks-brand">✨ Krueka Studio IA</div><span class="ks-badge">JUNIORS</span><span id="ks-model" class="ks-model"></span><span class="ks-spacer"></span><span id="ks-save" class="ks-save">Cargando…</span><button id="ks-save-btn" class="ks-btn">Guardar</button><button id="ks-code-btn" class="ks-btn ks-hide-small">Ver archivos</button><button id="ks-close" class="ks-btn">Salir</button></header>
      <main class="ks-main">
        <section class="ks-left">
          <div class="ks-modes"><button class="ks-btn ks-mode" data-mode="plan" aria-pressed="false">🧠 Planear</button><button class="ks-btn ks-mode" data-mode="build" aria-pressed="true">🛠️ Construir</button><span class="ks-tip">Una instrucción = un cambio</span></div>
          <div id="ks-chat" class="ks-chat" role="log" aria-live="polite"></div>
          <form id="ks-form" class="ks-compose"><textarea id="ks-prompt" maxlength="1200" placeholder="Ejemplo: Agregá 5 baterías al juego. Cada una suma 1 punto. No cambies nada más." required></textarea><div class="ks-actions"><span class="ks-tip">No escribas datos personales.</span><button id="ks-send" class="ks-btn primary" type="submit">Enviar →</button></div></form>
        </section>
        <section class="ks-right">
          <div class="ks-previewbar"><strong>🎮 Vista previa</strong><select id="ks-preview-file"></select><button id="ks-refresh" class="ks-btn">↻ Actualizar</button><span class="ks-spacer"></span><span class="ks-tip ks-hide-small">Probá el juego después de cada cambio</span></div>
          <div class="ks-preview"><iframe id="ks-frame" sandbox="allow-scripts" title="Vista previa del proyecto"></iframe><div id="ks-code" class="ks-code"><aside id="ks-files" class="ks-files"></aside><textarea id="ks-editor" class="ks-editor" spellcheck="false"></textarea></div></div>
        </section>
      </main>`;
    document.body.appendChild(panel);
    panel.querySelector('#ks-close').onclick=()=>this.close();
    panel.querySelector('#ks-save-btn').onclick=()=>this.save();
    panel.querySelector('#ks-refresh').onclick=()=>this.renderPreview();
    panel.querySelector('#ks-code-btn').onclick=()=>this.toggleCode();
    panel.querySelectorAll('.ks-mode').forEach(b=>b.onclick=()=>this.setMode(b.dataset.mode));
    panel.querySelector('#ks-form').onsubmit=e=>{e.preventDefault();this.send()};
    panel.querySelector('#ks-preview-file').onchange=e=>{this.preview=e.target.value;this.renderPreview()};
    panel.querySelector('#ks-editor').addEventListener('input',e=>{this.files[this.current]=e.target.value;this.dirty=true;this.scheduleSave();this.renderPreview()});
    window.addEventListener('message',this.messageHandler=this.onMessage.bind(this));
    this.lock(true);
    this.renderChat();
    try{
      const d=await this.request({action:'load'});
      if(!panel.isConnected)return;
      this.cloudReady=true;
      if(d.project&&d.project.files&&Object.keys(d.project.files).length){
        this.files=d.project.files;this.history=Array.isArray(d.project.history)?d.project.history:[];
        this.say('sys','Proyecto recuperado de Krueka. Podés continuar desde cualquier computadora.');
      }else this.say('sys','Proyecto inicial listo. Empezá describiendo qué querés cambiar.');
    }catch(e){this.say('sys','No se pudo recuperar el proyecto: '+e.message+'. Salí y volvé a abrir el Studio para reintentar.');}
    if(!panel.isConnected)return;
    this.refreshAll();this.lock(false);
    panel.querySelector('#ks-save').textContent=this.cloudReady?'Proyecto listo':'⚠ No se recuperó la nube';
  },
  async close(){if(this.busy)return;clearTimeout(this.saveTimer);if(this.dirty&&this.cloudReady)await this.save();window.removeEventListener('message',this.messageHandler);document.getElementById('krueka-studio')?.remove();},
  setMode(m){this.mode=m==='plan'?'plan':'build';document.querySelectorAll('#krueka-studio .ks-mode').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===this.mode)));},
  say(role,text){this.history.push({role,text:String(text||'')});this.history=this.history.slice(-30);this.renderChat();},
  renderChat(){
    const el=document.getElementById('ks-chat');if(!el)return;
    if(!this.history.length)el.innerHTML='<div class="ks-onboard"><b>Tu flujo de trabajo</b>1. Pedí una sola cosa.<br>2. Mirá qué cambió.<br>3. Probalo en la vista previa.<br>4. Si funciona, pedí lo siguiente.<br><span class="ks-chip">“Creá mi personaje”</span><span class="ks-chip">“Ahora agregá movimiento”</span><span class="ks-chip">“Ahora 5 monedas”</span></div>';
    else el.innerHTML=this.history.map(m=>'<div class="ks-msg '+(m.role==='user'?'user':m.role==='sys'?'sys':'ai')+'">'+esc(m.text)+'</div>').join('');
    el.scrollTop=el.scrollHeight;
  },
  async send(){
    if(this.busy)return;
    const q=document.getElementById('ks-prompt'),text=q.value.trim();if(!text)return;
    q.value='';this.say('user',text);this.busy=true;this.lock(true);
    const temp={role:'ai',text:'Construyendo…'};this.history.push(temp);this.renderChat();
    try{
      const d=await this.request({action:'ai',mode:this.mode,prompt:text,files:this.files,history:this.history.slice(0,-1)});
      this.history.pop();
      if(d.files&&this.mode==='build')for(const [name,content] of Object.entries(d.files))this.files[name]=String(content);
      this.say('ai',(d.summary||'Listo.')+'\n\n🎮 PROBÁ: '+(d.test||'Revisá la vista previa.'));
      const model=document.getElementById('ks-model');if(model)model.textContent=d.model||'';
      this.dirty=true;this.refreshAll();await this.save();
    }catch(e){
      this.history.pop();this.say('ai','No pude completar ese cambio. '+(e.message||e)+'\n\nProbá otra vez con una instrucción más corta. Si vuelve a fallar, avisá al profe.');
    }finally{this.busy=false;this.lock(false);if(this.dirty)this.scheduleSave()}
  },
  lock(v){const b=document.getElementById('ks-send');if(b){b.disabled=v||!this.cloudReady;b.textContent=v?'Trabajando…':'Enviar →'}document.querySelectorAll('#ks-close,#ks-save-btn,#ks-editor,#ks-prompt,.ks-mode').forEach(el=>el.disabled=v||(!this.cloudReady&&el.id!=='ks-close'));},
  refreshAll(){this.renderFileList();this.renderPreviewOptions();this.renderEditor();this.renderPreview();},
  renderFileList(){
    const el=document.getElementById('ks-files');if(!el)return;
    el.innerHTML=Object.keys(this.files).sort().map(n=>'<button class="ks-file '+(n===this.current?'active':'')+'" data-file="'+esc(n)+'">'+esc(n)+'</button>').join('');
    el.querySelectorAll('button').forEach(b=>b.onclick=()=>{this.current=b.dataset.file;this.renderFileList();this.renderEditor()});
  },
  renderEditor(){const e=document.getElementById('ks-editor');if(e)e.value=this.files[this.current]||''},
  renderPreviewOptions(){
    const s=document.getElementById('ks-preview-file');if(!s)return;
    const html=Object.keys(this.files).filter(n=>/\.html$/i.test(n)).sort();
    if(!html.includes(this.preview))this.preview=html[0]||'index.html';
    s.innerHTML=html.map(n=>'<option value="'+esc(n)+'" '+(n===this.preview?'selected':'')+'>'+esc(n)+'</option>').join('');
  },
  toggleCode(){
    const code=document.getElementById('ks-code'),frame=document.getElementById('ks-frame'),btn=document.getElementById('ks-code-btn');
    const on=!code.classList.contains('on');code.classList.toggle('on',on);frame.classList.toggle('off',on);btn.textContent=on?'Ver juego':'Ver archivos';if(on)this.renderEditor();else this.renderPreview();
  },
  dirname(p){const a=p.split('/');a.pop();return a.length?a.join('/')+'/':''},
  resolve(base,rel){
    if(!rel||/^(?:[a-z]+:|#|\/\/)/i.test(rel))return rel;
    const parts=(base+rel).split('/'),out=[];for(const p of parts){if(!p||p==='.')continue;if(p==='..')out.pop();else out.push(p)}return out.join('/');
  },
  buildPreview(path){
    let html=this.files[path]||'<h1>Archivo no encontrado</h1>',base=this.dirname(path),self=this;
    html=html.replace(/<link\b([^>]*?)href=["']([^"']+)["']([^>]*)>/gi,(m,a,href,b)=>{
      const p=self.resolve(base,href);return self.files[p]!=null?'<style data-file="'+p+'">'+self.files[p]+'</style>':m;
    });
    html=html.replace(/<script\b([^>]*?)src=["']([^"']+)["']([^>]*)><\/script>/gi,(m,a,src,b)=>{
      const p=self.resolve(base,src);return self.files[p]!=null?'<script data-file="'+p+'">'+String(self.files[p]).replace(/<\/script/gi,'<\\/script')+'<\/script>':m;
    });
    html=html.replace(/<(img|source)\b([^>]*?)src=["']([^"']+)["']([^>]*)>/gi,(m,tag,a,src,b)=>{
      const p=self.resolve(base,src),v=self.files[p];if(v!=null&&/\.svg$/i.test(p)){const data='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(v);return '<'+tag+a+'src="'+data+'"'+b+'>'}return m;
    });
    const bridge='<script>(function(){document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a[href]");if(!a)return;var h=a.getAttribute("href");if(!h||h[0]==="#"||/^(https?:|mailto:|javascript:)/i.test(h))return;e.preventDefault();parent.postMessage({type:"krueka-studio-nav",href:h},"*")});})();<\/script>';
    return html.replace(/<\/body>/i,bridge+'</body>');
  },
  renderPreview(){const f=document.getElementById('ks-frame');if(f&&!f.classList.contains('off'))f.srcdoc=this.buildPreview(this.preview)},
  onMessage(e){
    if(e.source!==document.getElementById('ks-frame')?.contentWindow||!e.data||e.data.type!=='krueka-studio-nav')return;
    const next=this.resolve(this.dirname(this.preview),String(e.data.href||'').split('#')[0]);if(this.files[next]!=null&&/\.html$/i.test(next)){this.preview=next;this.renderPreviewOptions();this.renderPreview()}
  },
  scheduleSave(){clearTimeout(this.saveTimer);this.saveTimer=setTimeout(()=>this.save(),1600)},
  async save(){
    if(!this.sid()||!this.cloudReady)return;
    clearTimeout(this.saveTimer);const el=document.getElementById('ks-save');if(el)el.textContent='Guardando…';
    const body={action:'save',studentId:this.sid(),deviceId:this.did(),files:{...this.files},history:this.history.map(m=>({...m}))};
    const snapshot=JSON.stringify(body.files);
    this.saveQueue=this.saveQueue.then(async()=>{
      try{await this.request(body);if(JSON.stringify(this.files)===snapshot)this.dirty=false;if(el&&el.isConnected)el.textContent=this.dirty?'Cambios pendientes':'✓ Guardado en Krueka';return true}
      catch(e){this.dirty=true;if(el&&el.isConnected)el.textContent='⚠ Sin guardar: '+e.message;return false}
    });
    return this.saveQueue;
  }
};
window.StudioIA=StudioIA;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>StudioIA.install());else StudioIA.install();
})();
