/* Club Krueka: visor a pantalla completa, sólo obras públicas aprobadas. */
(function(){
'use strict';
const ENDPOINT='https://janebfpnknapvntfqolf.supabase.co/rest/v1/rpc/club_krueka_public_obra';
const KEY='sb_publishable_mSuSFqWycvm9dQQzjpeaRA_kAyZOJl0';
const id=new URLSearchParams(location.search).get('obra');
const status=document.getElementById('ck-ob-status');
const heading=document.getElementById('ck-ob-title');
const stage=document.getElementById('ck-ob-frame');
const share=document.getElementById('ck-ob-share');
function buildPreview(files){
 const html=String(files['index.html']||''),css=String(files['style.css']||'');
 const safeCss=css.replace(/<\/style/gi,'<\\/style');
 let doc=html.replace(/<link\b[^>]*href=["'](?:\.\/)?style\.css["'][^>]*>/gi,
   '<style>'+safeCss+'</style>');
 // Only named project files returned by the approved-only RPC can run.
 // Their order in index.html is preserved for game-config.js before game.js.
 doc=doc.replace(/<script\b[^>]*src=["'](?:\.\/)?([a-z0-9_-]+\.js)["'][^>]*><\/script>/gi,
   (tag,name)=>Object.prototype.hasOwnProperty.call(files,name)
     ?'<script>'+String(files[name]||'').replace(/<\/script/gi,'<\\/script')+'</script>'
     :tag);
 let csp='<meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; script-src &#39;unsafe-inline&#39;; style-src &#39;unsafe-inline&#39;; img-src data: blob:; font-src data:; media-src data: blob:; connect-src &#39;none&#39;; form-action &#39;none&#39;; base-uri &#39;none&#39;">';
 if(/<meta\s+name=["']krueka-python-runtime["']\s+content=["']pyodide["']/i.test(html)){
  csp=csp.replace('script-src &#39;unsafe-inline&#39;;','script-src &#39;unsafe-inline&#39; &#39;wasm-unsafe-eval&#39; https://cdn.jsdelivr.net;')
         .replace('connect-src &#39;none&#39;;','connect-src https://cdn.jsdelivr.net; worker-src blob:;');
 }
 if(/<iframe[^>]+src=["']https:\/\/(?:www\.youtube-nocookie\.com|player\.vimeo\.com)/i.test(html)){
    csp=csp.replace('base-uri &#39;none&#39;;','frame-src https://www.youtube-nocookie.com https://player.vimeo.com; base-uri &#39;none&#39;;');
  }
 if(/<head\b[^>]*>/i.test(doc))return doc.replace(/<head\b[^>]*>/i,match=>match+csp);
 return csp+doc;
}
function report(s){status.textContent=s;}
if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id||'')){
 report('El enlace de esta obra no es válido. Volvé a la galería.');
 return;
}
fetch(ENDPOINT,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({p_project:id})})
.then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.message||'No se pudo abrir la obra');return d;})
.then(p=>{
 if(!p||!p.files||!p.files['index.html']){report('Esta creación todavía no está publicada o dejó de estar disponible.');return;}
 heading.textContent=String(p.title||'Creación de Club Krueka').slice(0,80);
 document.title=heading.textContent+' · Club Krueka';
 stage.srcdoc=buildPreview(p.files);
 document.getElementById('ck-ob-stage').hidden=false;
 status.hidden=true;share.disabled=false;
}).catch(()=>report('No pudimos cargar esta obra aprobada. Revisá la conexión e intentá nuevamente.'));
share.onclick=async()=>{
 try{await navigator.clipboard.writeText(location.href);share.textContent='✓ Enlace copiado';}
 catch(_e){window.prompt('Copiá el enlace:',location.href);}
};
document.getElementById('ck-ob-full').onclick=()=>{
 const region=document.getElementById('ck-ob-stage');
 if(region.requestFullscreen)region.requestFullscreen().catch(()=>{});
};
})();