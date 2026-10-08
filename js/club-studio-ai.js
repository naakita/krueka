/* Krueka Studio IA · navegador, sin instalación.
   Copiloto de construcción para Juniors: prompt -> cambios -> vista previa -> guardar en nube. */
(function(){
'use strict';
if(window.StudioIA&&window.StudioIA.__loaded)return;
const StudioIA={__loaded:true,
  files:{},history:[],current:'index.html',preview:'index.html',mode:'build',busy:false,dirty:false,saveTimer:null,cloudReady:false,saveQueue:Promise.resolve(),projectId:'legacy',title:'Mi portal de juegos',aiReady:false,tab:'create',undo:[],errors:[],
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
      card.innerHTML='<div style="font-size:46px">✨</div><div style="flex:1;min-width:230px"><span class="club-kicker">TU TALLER DE CREACIÓN</span><h2 style="margin:3px 0">Krueka Studio IA</h2><p style="margin:0;color:var(--tx2)">Elegí un juego, cambiá sus reglas, abrí el código y probalo. Tus proyectos quedan guardados en Krueka.</p></div><button class="club-primary" type="button" style="min-height:44px;padding:10px 16px">Abrir Studio IA →</button>';
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
    if(!res.ok||data.ok===false){const e=new Error(data.error||('Error '+res.status));e.setupRequired=data.setupRequired===true;throw e;}
    return data;
  },
  async open(){
    if(!this.sid())return alert('Entrá al Club con tu código para usar el Studio.');
    if(Club.alumno.nivel!=='mayores')return;
    if(document.getElementById('krueka-studio'))return;
    await this.saveQueue;
    clearTimeout(this.saveTimer);this.cloudReady=false;this.dirty=false;this.busy=false;
    this.files=this.initial();this.history=[];this.current='index.html';this.preview='index.html';this.projectId='legacy';this.title='Mi portal de juegos';this.undo=[];this.errors=[];this.aiReady=false;
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
      <header class="ks-top"><div class="ks-brand">✦ Krueka Studio</div><span class="ks-badge">CREÁ · PROBÁ · APRENDÉ</span><span class="ks-spacer"></span><span id="ks-save" class="ks-save" role="status">Cargando…</span><button id="ks-save-btn" class="ks-btn">Guardar</button><button id="ks-close" class="ks-btn">Salir</button></header>
      <nav class="ks-projectbar" aria-label="Herramientas del proyecto"><button id="ks-projects" class="ks-btn">Mis proyectos</button><button id="ks-new" class="ks-btn primary">＋ Crear</button><input id="ks-title" aria-label="Nombre del proyecto" maxlength="80" value="Mi portal de juegos"><button id="ks-undo" class="ks-btn">↶ Deshacer</button><button id="ks-export" class="ks-btn">Descargar</button><button id="ks-import" class="ks-btn">Importar</button><button id="ks-submit" class="ks-btn">Enviar al profe</button><input id="ks-import-file" type="file" accept=".json,application/json,.html,text/html" hidden></nav>
      <main class="ks-main">
        <section class="ks-left">
          <nav class="ks-tabs" aria-label="Herramientas de creación"><button class="ks-btn" data-tab="create" aria-pressed="true">🎨 Crear</button><button class="ks-btn" data-tab="ai" aria-pressed="false">✨ IA</button><button class="ks-btn" data-tab="learn" aria-pressed="false">📖 Mi clase</button></nav>
          <div class="ks-work"><section id="ks-create" class="ks-tool"></section><section id="ks-learn" class="ks-tool" hidden></section><section id="ks-ai" hidden><div id="ks-ai-status" class="ks-notice" role="status"></div><div class="ks-modes"><button class="ks-btn ks-mode" data-mode="plan" aria-pressed="false">Planear</button><button class="ks-btn ks-mode" data-mode="build" aria-pressed="true">Construir</button><button id="ks-repair" class="ks-btn">Reparar</button><span id="ks-model" class="ks-model"></span></div><div id="ks-chat" class="ks-chat" role="log" aria-live="polite"></div><form id="ks-form" class="ks-compose"><label for="ks-prompt">¿Qué querés cambiar?</label><textarea id="ks-prompt" maxlength="1200" placeholder="Agregá enemigos que se muevan. Conservá los controles y las reglas actuales." required></textarea><div class="ks-actions"><span class="ks-tip">Pedí un cambio y probá el resultado.</span><button id="ks-send" class="ks-btn primary" type="submit">Enviar →</button></div></form></section></div>
        </section>
        <section class="ks-right">
          <div class="ks-previewbar"><select id="ks-preview-file" aria-label="Página para probar"></select><button id="ks-refresh" class="ks-btn">↻ Probar</button><button id="ks-code-btn" class="ks-btn">Código</button><button id="ks-device" class="ks-btn">📱 Celular</button><button id="ks-play-space" class="ks-btn">Ampliar juego</button><button id="ks-fullscreen" class="ks-btn" title="Pantalla completa" aria-label="Pantalla completa">⛶</button></div>
          <div class="ks-preview"><iframe id="ks-frame" sandbox="allow-scripts" title="Vista previa del proyecto"></iframe><div id="ks-code" class="ks-code"><aside><div class="ks-file-actions"><button id="ks-add-file" class="ks-btn" title="Crear archivo">＋</button><button id="ks-delete-file" class="ks-btn" title="Eliminar archivo">−</button></div><div id="ks-files" class="ks-files"></div></aside><textarea id="ks-editor" class="ks-editor" aria-label="Código del archivo seleccionado" spellcheck="false"></textarea></div></div>
          <details class="ks-console"><summary id="ks-console-title">Consola · sin errores</summary><pre id="ks-errors">Probá tu juego. Los errores aparecerán acá.</pre></details>
        </section>
      </main>`;
    document.body.appendChild(panel);
    panel.querySelector('#ks-close').onclick=()=>this.close();
    panel.querySelector('#ks-save-btn').onclick=()=>this.save();
    panel.querySelector('#ks-refresh').onclick=()=>this.renderPreview();
    panel.querySelector('#ks-code-btn').onclick=()=>this.toggleCode();
    panel.querySelector('#ks-projects').onclick=()=>this.showProjects();
    panel.querySelector('#ks-new').onclick=()=>this.showKits();
    panel.querySelector('#ks-title').onchange=e=>{this.title=e.target.value.trim()||'Mi proyecto';e.target.value=this.title;this.changed()};
    panel.querySelector('#ks-undo').onclick=()=>this.restore();
    panel.querySelector('#ks-export').onclick=()=>this.download();
    panel.querySelector('#ks-import').onclick=()=>panel.querySelector('#ks-import-file').click();
    panel.querySelector('#ks-import-file').onchange=e=>{this.importProject(e.target.files[0]);e.target.value=''};
    panel.querySelector('#ks-submit').onclick=()=>this.submit();
    panel.querySelector('#ks-add-file').onclick=()=>this.addFile();
    panel.querySelector('#ks-delete-file').onclick=()=>this.deleteFile();
    panel.querySelector('#ks-device').onclick=e=>{const mobile=panel.classList.toggle('ks-mobile');e.target.textContent=mobile?'💻 Computadora':'📱 Celular'};
    panel.querySelector('#ks-play-space').onclick=e=>{const playing=panel.classList.toggle('ks-play-only');e.target.textContent=playing?'Volver al taller':'Ampliar juego';if(document.getElementById('ks-code').classList.contains('on'))this.toggleCode();};
    panel.querySelector('#ks-fullscreen').onclick=()=>{const f=panel.querySelector('#ks-frame');if(f.requestFullscreen)f.requestFullscreen().catch(()=>this.say('sys','Este navegador no admite pantalla completa.'))};
    panel.querySelector('#ks-repair').onclick=()=>{this.setMode('build');panel.querySelector('#ks-prompt').value=this.errors.length?'Corregí este error conservando el resto del proyecto: '+this.errors[this.errors.length-1].slice(0,800):'Revisá el juego y corregí problemas de movimiento, controles o puntuación. Explicá qué cambiaste.'};
    panel.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>this.showTab(b.dataset.tab));
    panel.querySelector('#ks-editor').addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();const t=e.target;const start=t.selectionStart;t.setRangeText('  ',start,t.selectionEnd,'end');t.dispatchEvent(new Event('input'))}});
    panel.querySelectorAll('.ks-mode').forEach(b=>b.onclick=()=>this.setMode(b.dataset.mode));
    panel.querySelector('#ks-form').onsubmit=e=>{e.preventDefault();this.send()};
    panel.querySelector('#ks-preview-file').onchange=e=>{this.preview=e.target.value;this.renderPreview()};
    panel.querySelector('#ks-editor').addEventListener('focus',()=>{if(this.cloudReady&&!this.busy)this.checkpoint()});
    panel.querySelector('#ks-editor').addEventListener('blur',()=>this.renderCreator());
    panel.querySelector('#ks-editor').addEventListener('input',e=>{this.files[this.current]=e.target.value;this.changed();clearTimeout(this.previewTimer);this.previewTimer=setTimeout(()=>{this.renderPreviewOptions();this.renderPreview()},650)});
    window.addEventListener('message',this.messageHandler=this.onMessage.bind(this));
    this.lock(true);
    this.renderChat();
    try{
      let last='legacy';try{last=localStorage.getItem('krueka-studio-last:'+this.sid())||'legacy'}catch(_e){}
      const d=await this.request({action:'load',projectId:last});
      if(!panel.isConnected)return;
      this.cloudReady=true;this.aiReady=d.ai?.ready===true;
      if(d.project&&d.project.files&&Object.keys(d.project.files).length){
        this.adopt(d.project);
        this.say('sys','Proyecto recuperado de Krueka. Podés continuar desde cualquier computadora.');
      }else this.say('sys','Proyecto inicial listo. Empezá describiendo qué querés cambiar.');
    }catch(e){this.say('sys','No se pudo recuperar el proyecto: '+e.message+'. Salí y volvé a abrir el Studio para reintentar.');}
    if(!panel.isConnected)return;
    this.refreshAll();this.showTab('create');this.lock(false);
    panel.querySelector('#ks-save').textContent=this.cloudReady?'Proyecto listo':'⚠ No se recuperó la nube';
  },
  async close(){if(this.busy)return;this.busy=true;this.lock(true);clearTimeout(this.saveTimer);clearTimeout(this.previewTimer);if(this.dirty&&this.cloudReady){const ok=await this.save();if(!ok&&!confirm('No se pudo guardar. Descargá una copia antes de salir. ¿Salir de todos modos?')){this.busy=false;this.lock(false);return;}}window.removeEventListener('message',this.messageHandler);document.getElementById('krueka-studio')?.remove();this.busy=false;},
  setMode(m){this.mode=m==='plan'?'plan':'build';document.querySelectorAll('#krueka-studio .ks-mode').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===this.mode)));},
  say(role,text){this.history.push({role,text:String(text||'')});this.history=this.history.slice(-30);this.renderChat();},
  renderChat(){
    const el=document.getElementById('ks-chat');if(!el)return;
    if(!this.history.length)el.innerHTML='<div class="ks-onboard"><b>Tu flujo de trabajo</b>1. Pedí una sola cosa.<br>2. Mirá qué cambió.<br>3. Probalo en la vista previa.<br>4. Si funciona, pedí lo siguiente.<br><span class="ks-chip">“Creá mi personaje”</span><span class="ks-chip">“Ahora agregá movimiento”</span><span class="ks-chip">“Ahora 5 monedas”</span></div>';
    else el.innerHTML=this.history.map(m=>'<div class="ks-msg '+(m.role==='user'?'user':m.role==='sys'?'sys':'ai')+'">'+esc(m.text)+'</div>').join('');
    el.scrollTop=el.scrollHeight;
  },
  async send(){
    if(this.busy||!this.cloudReady||!this.aiReady)return;
    const q=document.getElementById('ks-prompt'),text=q.value.trim();if(!text)return;
    q.value='';this.say('user',text);this.busy=true;this.lock(true);
    const temp={role:'ai',text:'Construyendo…'};this.history.push(temp);this.renderChat();
    try{
      const d=await this.request({action:'ai',mode:this.mode,prompt:text,files:this.files,history:this.history.slice(0,-1)});
      this.history.pop();
      if(d.files&&this.mode==='build'&&Object.keys(d.files).length){this.checkpoint();this.files=Object.assign({},this.files,this.validFiles(d.files));}
      this.say('ai',(d.summary||'Listo.')+'\n\n🎮 PROBÁ: '+(d.test||'Revisá la vista previa.'));
      const model=document.getElementById('ks-model');if(model)model.textContent=d.model||'';
      this.dirty=true;this.refreshAll();await this.save();
    }catch(e){
      if(e.setupRequired)this.aiReady=false;this.history.pop();this.say('ai','No pude completar ese cambio. '+(e.message||e)+(e.setupRequired?'\n\nAvisá al profe para conectar la IA. Tu proyecto sigue disponible en Ver archivos.':'\n\nProbá otra vez con una instrucción más corta. Si vuelve a fallar, avisá al profe.'));
    }finally{this.busy=false;this.lock(false);if(this.dirty)this.scheduleSave()}
  },
  lock(v){
    document.querySelectorAll('#krueka-studio button,#ks-editor,#ks-prompt,#ks-title,.ks-settings input,.ks-settings select').forEach(el=>el.disabled=v||(!this.cloudReady&&!['ks-close','ks-export'].includes(el.id)));
    const b=document.getElementById('ks-send');if(b){b.disabled=v||!this.cloudReady||!this.aiReady;b.textContent=v?'Trabajando…':'Enviar →';}
    const u=document.getElementById('ks-undo');if(u)u.disabled=v||!this.cloudReady||!this.undo.length;
  },
  refreshAll(){if(!this.files[this.current])this.current=Object.keys(this.files)[0]||'index.html';this.renderFileList();this.renderPreviewOptions();this.renderEditor();this.renderPreview();this.renderCreator();this.renderLesson();this.renderAIStatus();const t=document.getElementById('ks-title');if(t)t.value=this.title;},
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
      const p=self.resolve(base,href);return self.files[p]!=null?'<style data-file="'+esc(p)+'">'+String(self.files[p]).replace(/<\/style/gi,'<\\/style')+'</style>':m;
    });
    html=html.replace(/<script\b([^>]*?)src=["']([^"']+)["']([^>]*)><\/script>/gi,(m,a,src,b)=>{
      const p=self.resolve(base,src);return self.files[p]!=null?'<script data-file="'+esc(p)+'">'+String(self.files[p]).replace(/<\/script/gi,'<\\/script')+'<\/script>':m;
    });
    html=html.replace(/<(img|source)\b([^>]*?)src=["']([^"']+)["']([^>]*)>/gi,(m,tag,a,src,b)=>{
      const p=self.resolve(base,src),v=self.files[p];if(v!=null&&/\.svg$/i.test(p)){const data='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(v);return '<'+tag+a+'src="'+data+'"'+b+'>'}return m;
    });
    const bridge='<script>(function(){addEventListener("error",function(e){parent.postMessage({type:"krueka-studio-error",text:e.message+" (línea "+e.lineno+")"},"*")});addEventListener("unhandledrejection",function(e){parent.postMessage({type:"krueka-studio-error",text:String(e.reason)},"*")});document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a[href]");if(!a)return;var h=a.getAttribute("href");if(!h||h[0]==="#")return;e.preventDefault();parent.postMessage({type:"krueka-studio-nav",href:h},"*")});})();<\/script>';
    const policy='<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data: blob:; media-src data: blob:; connect-src \'none\'; font-src data:; base-uri \'none\'; form-action \'none\'">';
    if(/<head\b[^>]*>/i.test(html))return html.replace(/<head\b[^>]*>/i,m=>m+policy+bridge);
    return policy+bridge+html;
  },
  renderPreview(){const f=document.getElementById('ks-frame');if(f&&!f.classList.contains('off')){this.errors=[];this.renderErrors();f.srcdoc=this.buildPreview(this.preview)}},
  renderErrors(){const p=document.getElementById('ks-errors'),t=document.getElementById('ks-console-title');if(p)p.textContent=this.errors.join('\n')||'Probá tu juego. Los errores aparecerán acá.';if(t)t.textContent='Consola · '+(this.errors.length?this.errors.length+' error(es)':'sin errores');},
  onMessage(e){
    if(e.source!==document.getElementById('ks-frame')?.contentWindow||!e.data)return;
    if(e.data.type==='krueka-studio-error'){this.errors.push(String(e.data.text).slice(0,1000));this.errors=this.errors.slice(-10);this.renderErrors();return;}
    if(e.data.type!=='krueka-studio-nav')return;
    const next=this.resolve(this.dirname(this.preview),String(e.data.href||'').split('#')[0]);if(this.files[next]!=null&&/\.html$/i.test(next)){this.preview=next;this.renderPreviewOptions();this.renderPreview()}
  },
  adopt(p){this.files=this.validFiles(p.files);this.history=Array.isArray(p.history)?p.history:[];this.title=String(p.title||'Mi portal de juegos').slice(0,80);this.projectId=p.id||'legacy';try{localStorage.setItem('krueka-studio-last:'+this.sid(),this.projectId)}catch(_e){}if(p.reviewNote)this.history.push({role:'sys',text:'Observación del profe: '+String(p.reviewNote)});this.undo=[];this.current='index.html';this.preview='index.html';},
  validFiles(raw){
    if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('El archivo no contiene un proyecto válido.');
    const out={};let total=0;
    for(const [name,value] of Object.entries(raw)){
      if(!/^[a-zA-Z0-9_./-]+\.(html|css|js|json|svg|txt|md)$/i.test(name)||name.includes('..')||name.startsWith('/')||typeof value!=='string')throw new Error('Nombre o contenido de archivo no admitido: '+name);
      if(value.length>120000)throw new Error('Un archivo supera el límite permitido.');out[name]=value;total+=value.length;
    }
    if(Object.keys(out).length>45||total>220000)throw new Error('El proyecto es demasiado grande.');return out;
  },
  changed(){this.dirty=true;this.scheduleSave();const el=document.getElementById('ks-save');if(el)el.textContent='Cambios pendientes';},
  checkpoint(){this.undo.push({...this.files});this.undo=this.undo.slice(-5);const b=document.getElementById('ks-undo');if(b)b.disabled=false;},
  restore(){if(this.busy||!this.undo.length)return;this.files=this.undo.pop();this.changed();this.refreshAll();this.lock(false);},
  showTab(tab){this.tab=tab;document.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tab===tab)));for(const id of ['create','ai','learn']){const el=document.getElementById('ks-'+id);if(el)el.hidden=id!==tab;}},
  renderAIStatus(){const el=document.getElementById('ks-ai-status');if(el)el.textContent=this.aiReady?'IA conectada. Pedí cambios concretos y probalos.':'La IA necesita conexión del profe. Mientras tanto, podés crear juegos, personalizarlos y editar su código.';},
  renderCreator(){
    const el=document.getElementById('ks-create');if(!el)return;const cfg=StudioKits.read(this.files);
    el.innerHTML='<div class="ks-section-label">DE UNA IDEA A UN JUEGO</div><h2>Tu próximo juego empieza acá.</h2><p>Elegí una base jugable. Cambiá una regla, probá y explicá qué ocurrió.</p><div class="ks-kit-grid">'+StudioKits.catalog.map(k=>'<button class="ks-kit" data-kit="'+k.id+'"><span>'+StudioKits.art(k.id)+'</span><b>'+esc(k.title)+'</b><small>'+esc(k.tag)+'</small></button>').join('')+'</div>'+
      (cfg?'<section class="ks-settings"><h3>Personalizá este juego</h3><label>Nombre en el juego<input data-setting="title" maxlength="60" value="'+esc(cfg.title)+'"></label><div class="ks-fields"><label>Escenario<select data-setting="theme">'+Object.entries({space:'Espacio',forest:'Bosque',sunset:'Atardecer'}).map(([id,t])=>'<option value="'+id+'" '+(cfg.theme===id?'selected':'')+'>'+t+'</option>').join('')+'</select></label><label>Personaje<select data-setting="avatar">'+['🚀','🤖','🦊','🏎️','🐸','🧑‍🚀'].map(t=>'<option '+(cfg.avatar===t?'selected':'')+'>'+t+'</option>').join('')+'</select></label><label>Velocidad<input data-setting="speed" type="number" min="80" max="500" value="'+esc(cfg.speed)+'"></label><label>Meta de puntos<input data-setting="target" type="number" min="1" max="200" value="'+esc(cfg.target)+'"></label><label>Vidas<input data-setting="lives" type="number" min="1" max="9" value="'+esc(cfg.lives)+'"></label><label>Tiempo (segundos)<input data-setting="seconds" type="number" min="15" max="300" value="'+esc(cfg.seconds)+'"></label></div><button id="ks-apply" class="ks-btn primary">Aplicar y probar →</button><p class="ks-tip">Estos controles cambian game-config.js. Abrí Código para ver cómo.</p></section>':'<div class="ks-notice">Este proyecto tiene código propio. Editalo con el botón Código o creá otro juego con una de las bases.</div>')+'<button id="ks-view-config" class="ks-btn">Explorar el código</button>';
    el.querySelectorAll('[data-kit]').forEach(b=>b.onclick=()=>this.createKit(b.dataset.kit));
    if(cfg?.kind==='quiz')for(const key of ['avatar','speed','target','lives','seconds'])el.querySelector('[data-setting="'+key+'"]').closest('label').hidden=true;
    const apply=el.querySelector('#ks-apply');if(apply)apply.onclick=()=>{
      const updated={...cfg};el.querySelectorAll('[data-setting]').forEach(x=>{const key=x.dataset.setting;updated[key]=x.type==='number'?Math.max(Number(x.min),Math.min(Number(x.max),Number(x.value)||Number(x.min))):x.value;});
      this.checkpoint();this.files['game-config.js']=StudioKits.configFile(updated);this.changed();this.refreshAll();
    };
    if(cfg?.kind==='quiz'){const tip=document.createElement('p');tip.className='ks-notice';tip.textContent='Para crear tus propias preguntas, abrí Código → game-config.js. Cada pregunta tiene texto, opciones y el número de la respuesta correcta (empieza en 0).';el.querySelector('.ks-settings').appendChild(tip);}
    el.querySelector('#ks-view-config').onclick=()=>{this.current=this.files['game-config.js']?'game-config.js':Object.keys(this.files).find(x=>/\.js$/.test(x))||'index.html';if(!document.getElementById('ks-code').classList.contains('on'))this.toggleCode();this.renderFileList();this.renderEditor();};
  },
  renderLesson(){
    const el=document.getElementById('ks-learn');if(!el)return;const cfg=StudioKits.read(this.files),kit=StudioKits.catalog.find(k=>k.id===cfg?.kind);
    const web=!!this.files['script.js']&&!this.files['game.js']&&!Object.keys(this.files).some(n=>n.startsWith('games/'));
    el.innerHTML='<div class="ks-section-label">MISIÓN DE CREACIÓN · 60 MINUTOS</div><h2>Construí algo que puedas explicar.</h2><p><b>Tema:</b> Diseño y programación de un proyecto web.</p><p><b>Capacidad:</b> Modificar un programa, probar su funcionamiento y explicar las decisiones tomadas.</p><h3>Tu recorrido</h3><ol><li><b>10 min · Imaginá.</b> Elegí una base y poné nombre a tu proyecto.</li><li><b>15 min · Construí.</b> Cambiá dos reglas desde Crear. Abrí Código y encontrá esos valores.</li><li><b>15 min · Probá.</b> Jugá con teclado y controles táctiles. Revisá puntos, vidas y final del juego.</li><li><b>10 min · Mejorá.</b> Ajustá una regla a partir de la prueba.</li><li><b>10 min · Explicá.</b> Escribí tu decisión en LEEME.md y enviá el proyecto al profe.</li></ol><h3>Indicadores de logro</h3>'+['Personalizo un proyecto y conservo una versión propia.','Identifico dónde se configura una regla.','Pruebo la navegación o los controles y las reglas del juego.','Explico qué cambié y cómo mejoró mi proyecto.'].map(x=>'<label class="ks-check"><input type="checkbox">'+x+'</label>').join('')+(kit?'<div class="ks-notice"><b>Desafío extra</b><p>'+esc(kit.challenge)+'</p></div>':'')+'<p class="ks-tip">Marcá los indicadores al comprobarlos durante esta sesión.</p>';
    if(web)el.querySelector('ol').innerHTML='<li><b>10 min · Imaginá.</b> Elegí un tema y un nombre para tu sitio.</li><li><b>15 min · Construí.</b> Abrí Código → index.html. Cambiá el título, las tarjetas y los textos.</li><li><b>15 min · Probá.</b> Revisá los enlaces y el botón de tema. Probá el ancho de celular.</li><li><b>10 min · Mejorá.</b> Cambiá los colores en style.css y comprobá que los textos se lean bien.</li><li><b>10 min · Explicá.</b> Contá una decisión en LEEME.md y enviá el sitio al profe.</li>';
  },
  dialog(title,html){document.getElementById('ks-dialog')?.remove();const el=document.createElement('div');el.id='ks-dialog';el.className='ks-dialog';el.innerHTML='<section role="dialog" aria-modal="true" aria-label="'+esc(title)+'"><header><h2>'+esc(title)+'</h2><button class="ks-btn" id="ks-dialog-close">Cerrar</button></header>'+html+'</section>';document.getElementById('krueka-studio').appendChild(el);el.querySelector('#ks-dialog-close').onclick=()=>el.remove();el.querySelector('#ks-dialog-close').focus();return el;},
  showKits(){const d=this.dialog('¿Qué vas a crear?','<p>Cada base crea un proyecto nuevo. Podés seguir mejorando los anteriores desde Mis proyectos.</p><div class="ks-kit-grid">'+StudioKits.catalog.map(k=>'<button class="ks-kit" data-kit="'+k.id+'"><span>'+StudioKits.art(k.id)+'</span><b>'+esc(k.title)+'</b><small>'+esc(k.description)+'</small></button>').join('')+'</div>');d.querySelectorAll('[data-kit]').forEach(b=>b.onclick=()=>this.createKit(b.dataset.kit));},
  async startProject(files,title){
    if(this.busy||!this.cloudReady)return;this.busy=true;this.lock(true);if(this.dirty&&!(await this.save())){this.busy=false;this.lock(false);return;}
    const previous={files:this.files,history:this.history,title:this.title,projectId:this.projectId};
    try{const d=await this.request({action:'save',projectId:'new',title,files,history:[]});this.adopt({id:d.id,title,files,history:[]});this.dirty=false;document.getElementById('ks-dialog')?.remove();this.refreshAll();this.showTab('create');if(document.getElementById('ks-code').classList.contains('on'))this.toggleCode();document.getElementById('ks-save').textContent='✓ Nuevo proyecto guardado';}
    catch(e){Object.assign(this,previous);this.say('sys','No se pudo crear el proyecto: '+e.message);this.showTab('ai');}
    finally{this.busy=false;this.lock(false);}
  },
  createKit(id){const kit=StudioKits.catalog.find(k=>k.id===id);if(kit)return this.startProject(StudioKits.create(id),kit.title);},
  async showProjects(){
    if(this.busy)return;const dialog=this.dialog('Mis proyectos','<p id="ks-project-list">Cargando proyectos…</p>');
    try{const d=await this.request({action:'list'});if(!dialog.isConnected)return;const el=dialog.querySelector('#ks-project-list');el.innerHTML=(d.projects||[]).map(p=>'<button class="ks-project-card" data-project="'+esc(p.id)+'"><b>'+esc(p.title)+'</b><small>'+esc(({review:'En revisión',published:'Aprobado',draft:'Borrador'})[p.status]||'Proyecto')+'</small></button>').join('')||'Todavía no guardaste proyectos. Elegí Crear para comenzar.';el.querySelectorAll('[data-project]').forEach(b=>b.onclick=()=>this.switchProject(b.dataset.project));}
    catch(e){dialog.querySelector('#ks-project-list').textContent=e.message;}
  },
  async switchProject(id){
    if(this.busy)return;this.busy=true;this.lock(true);if(this.dirty&&!(await this.save())){this.busy=false;this.lock(false);return;}
    try{const d=await this.request({action:'load',projectId:id});if(!d.project)throw new Error('Proyecto no encontrado.');this.adopt(d.project);this.dirty=false;document.getElementById('ks-dialog')?.remove();this.refreshAll();document.getElementById('ks-save').textContent='✓ Proyecto recuperado';}
    catch(e){this.say('sys',e.message);this.showTab('ai');}finally{this.busy=false;this.lock(false);}
  },
  async submit(){
    if(this.busy||!this.cloudReady)return;this.busy=true;this.lock(true);if(!(await this.save())){this.busy=false;this.lock(false);return;}
    try{const d=await this.request({action:'submit',projectId:this.projectId,title:this.title,files:this.files,history:this.history});if(d.id)this.projectId=d.id;if(!d.submitted)throw new Error(d.error||'No se pudo enviar a revisión.');this.say('sys','Proyecto enviado al profe. Podés seguir construyendo; una nueva edición vuelve a quedar como borrador.');this.showTab('ai');}
    catch(e){this.say('sys','No se pudo enviar: '+e.message);this.showTab('ai');}finally{this.busy=false;this.lock(false);}
  },
  download(){const name=(this.title||'mi-juego').replace(/[^a-zA-Z0-9_-]/g,'-');const d=this.dialog('Descargar tu creación','<p>El proyecto JSON conserva todos los archivos para volver a importarlo. El HTML permite jugar esta página fuera de Krueka.</p><button id="ks-download-project" class="ks-btn primary">Proyecto editable (.json)</button> <button id="ks-download-game" class="ks-btn">Juego de esta página (.html)</button>');d.querySelector('#ks-download-project').onclick=()=>this.downloadBlob(JSON.stringify({format:'krueka-studio',version:2,title:this.title,files:this.files},null,2),name+'.json','application/json');d.querySelector('#ks-download-game').onclick=()=>this.downloadBlob(this.buildPreview(this.preview),name+'.html','text/html');},
  downloadBlob(content,name,type){const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},
  async importProject(file){if(!file||this.busy)return;try{if(file.size>350000)throw new Error('Elegí un proyecto de menos de 350 KB.');const text=await file.text();const p=/\.html$/i.test(file.name)?{title:file.name.replace(/\.html$/i,''),files:{'index.html':text}}:JSON.parse(text);const files=this.validFiles(p.files);if(!Object.keys(files).some(n=>/\.html$/i.test(n)))throw new Error('El proyecto necesita una página HTML.');await this.startProject(files,String(p.title||'Proyecto importado').slice(0,80));}catch(e){this.say('sys','No se pudo importar: '+e.message);this.showTab('ai');}},
  addFile(){const name=prompt('Nombre del archivo, por ejemplo: games/nuevo.html');if(!name)return;try{this.validFiles({[name]:''});if(name in this.files)throw new Error('Ese archivo ya existe.');if(Object.keys(this.files).length>=45)throw new Error('Alcanzaste el límite de archivos.');this.checkpoint();this.files[name]=/\.html$/i.test(name)?'<!doctype html>\n<html lang="es"><head><meta charset="utf-8"><title>Mi página</title></head><body><h1>Mi nueva creación</h1></body></html>':'';this.current=name;this.changed();this.refreshAll();}catch(e){alert(e.message);}},
  deleteFile(){if(this.current==='index.html')return alert('Conservá index.html como entrada de tu proyecto.');if(!confirm('¿Eliminar '+this.current+'? Podés recuperarlo con Deshacer.'))return;this.checkpoint();delete this.files[this.current];this.current='index.html';this.changed();this.refreshAll();},
  scheduleSave(){clearTimeout(this.saveTimer);this.saveTimer=setTimeout(()=>this.save(),1600)},
  async save(){
    if(!this.sid()||!this.cloudReady)return;
    clearTimeout(this.saveTimer);const el=document.getElementById('ks-save');if(el)el.textContent='Guardando…';
    const body={action:'save',studentId:this.sid(),deviceId:this.did(),projectId:this.projectId,title:this.title,files:{...this.files},history:this.history.map(m=>({...m}))};
    const snapshot=JSON.stringify({files:body.files,title:body.title});
    this.saveQueue=this.saveQueue.then(async()=>{
      try{const result=await this.request(body);if(result.id){this.projectId=result.id;try{localStorage.setItem('krueka-studio-last:'+this.sid(),this.projectId)}catch(_e){}}if(JSON.stringify({files:this.files,title:this.title})===snapshot)this.dirty=false;if(el&&el.isConnected)el.textContent=this.dirty?'Cambios pendientes':'✓ Guardado en Krueka';return true}
      catch(e){this.dirty=true;if(el&&el.isConnected)el.textContent='⚠ Sin guardar: '+e.message;return false}
    });
    return this.saveQueue;
  }
};
window.StudioIA=StudioIA;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>StudioIA.install());else StudioIA.install();
})();
