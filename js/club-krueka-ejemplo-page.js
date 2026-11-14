/* Visor público aislado de modelos originales. */
(function(){
'use strict';
const id=new URLSearchParams(location.search).get('ejemplo')||'neon';
const model=window.KruekaEjemplos?.get(id);
const status=document.getElementById('status');
if(!model){status.textContent='Este modelo no existe. Volvé a la galería para elegir otro.';return;}
const files=window.KruekaEjemplos.make(model);
const esc=s=>String(s||'').replace(/<\/script/gi,'<\\/script');
let doc=String(files['index.html']||'');
doc=doc.replace(/<link\b[^>]*href=["']style\.css["'][^>]*>/gi,'<style>'+esc(files['style.css'])+'</style>');
doc=doc.replace(/<script\b[^>]*src=["']script\.js["'][^>]*><\/script>/gi,'<script>'+esc(files['script.js'])+'</script>');
const policy='<meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; img-src data: blob:; style-src &#39;unsafe-inline&#39;; script-src &#39;unsafe-inline&#39;; connect-src &#39;none&#39;; font-src data:; media-src data: blob:; form-action &#39;none&#39;; base-uri &#39;none&#39;">';
doc=doc.replace(/<head\b[^>]*>/i,m=>m+policy);
document.getElementById('model-title').textContent=model.title;
document.getElementById('model-category').textContent='💡 MODELO ORIGINAL · '+model.tag;
document.title=model.title+' · Modelos del Club';
const frame=document.getElementById('preview');frame.srcdoc=doc;frame.hidden=false;status.hidden=true;
document.getElementById('start-model').href='club-krueka.html?plantilla='+encodeURIComponent(model.id);
document.getElementById('fullscreen').onclick=()=>{const stage=document.getElementById('preview-stage');if(stage.requestFullscreen)stage.requestFullscreen().catch(()=>{});};
const btn=document.getElementById('show-code');
let current='index.html';
function source(){document.getElementById('source').textContent=files[current];document.querySelectorAll('[data-file]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.file===current)));}
btn.onclick=()=>{const open=document.body.classList.toggle('code-open');btn.textContent=open?'✕ Ocultar código':'⌘ Ver código';if(open)source();};
document.querySelectorAll('[data-file]').forEach(b=>b.onclick=()=>{current=b.dataset.file;source()});
document.getElementById('copy').onclick=()=>navigator.clipboard?.writeText(files[current]).then(()=>{document.getElementById('copy').textContent='✓ Copiado';}).catch(()=>{});
})();