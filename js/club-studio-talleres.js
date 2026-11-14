/* Club Krueka: herramientas específicas para cada taller creativo.
   Publicaciones HTML autocontenidas, ilustraciones vectoriales sin servicios externos.
   Se integra con StudioIA y conserva la aprobación docente existente. */
(function(){
'use strict';
if(window.ClubTalleres)return;
const modes={
 blogs:{label:'Blog',layouts:['Revista','Tarjetas','Minimalista'],tip:'Título, portada, párrafos y artículos.'},
 historietas:{label:'Historieta',layouts:['Viñetas','Tiras','Páginas'],tip:'Personajes, globos de diálogo y escenarios.'},
 cuentos:{label:'Cuento',layouts:['Libro','Páginas','Ilustrado'],tip:'Narración, personajes, páginas y portada.'},
 dramas:{label:'Drama',layouts:['Escenario','Guion','Actos'],tip:'Actores, diálogos, acotaciones y escenas.'},
 animes:{label:'Anime original',layouts:['Storyboard','Episodios','Paneles'],tip:'Personajes, escenas, expresiones y movimiento básico.'},
 flyers:{label:'Flyer',layouts:['Cartel','Promoción','Evento'],tip:'Título, mensaje, colores, icono y llamado a la acción.'},
 dibujos:{label:'Dibujo',layouts:['Lienzo','Galería','Póster'],tip:'Pincel, figuras, colores y borrador.'}
};
const defaultBackdrops=['#ecf3fe','#f0e8ff','#fff1d6','#e7fff4','#191d37'];
function safe(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function hex(s,fallback='#237fc3'){return /^#[0-9a-f]{6}$/i.test(s||'')?s:fallback;}
function clip(v,n){return String(v??'').slice(0,n);}
function normalize(raw){
 const d=raw&&typeof raw==='object'?raw:{};
 const kind=modes[d.kind]?d.kind:'cuentos',opts=modes[kind];
 const t=d.tools&&typeof d.tools==='object'?d.tools:{};
 const strokes=Array.isArray(t.strokes)?t.strokes.slice(-70).map(s=>({
  type:['pen','line','rectangle','circle'].includes(s.type)?s.type:'pen',
  color:hex(s.color,'#193959'),
  width:Math.max(1,Math.min(18,Number(s.width)||4)),
  points:Array.isArray(s.points)?s.points.slice(0,150).map(p=>[Math.max(0,Math.min(600,Math.round(Number(p?.[0])||0))),Math.max(0,Math.min(320,Math.round(Number(p?.[1])||0)))]):[]
 })).filter(s=>s.points.length>0):[];
 return {...d,tools:{
  layout:opts.layouts.includes(t.layout)?t.layout:opts.layouts[0],
  backdrop:hex(t.backdrop,defaultBackdrops[0]),
  ink:hex(t.ink,'#193959'),
  brush:Math.max(1,Math.min(18,Number(t.brush)||4)),
  tool:['pen','line','rectangle','circle'].includes(t.tool)?t.tool:'pen',
  character:clip(t.character||'🦊',8),
  partner:clip(t.partner||'🐱',8),
  author:clip(t.author||'Un creador del Club',36),
  action:clip(t.action||'¡Una idea cobra vida!',90),
  callToAction:clip(t.callToAction||'¡Descubrí más!',65),
  font:['Moderna','Cómic','Clásica'].includes(t.font)?t.font:'Moderna',
  effect:['Flotar','Deslizar','Zoom suave'].includes(t.effect)?t.effect:'Flotar',
  bubble:['Redondo','Rectangular','Narración'].includes(t.bubble)?t.bubble:'Redondo',
  perScene:(Array.isArray(t.perScene)?t.perScene:[]).slice(0,3).concat([{}, {}, {}]).slice(0,3).map((p,i)=>({
    character:clip(p?.character|| (i%2?'🐱':'🦊'),8),
    speaker:clip(p?.speaker|| (i%2?'Amigo':'Protagonista'),36),
    stage:clip(p?.stage||'En un lugar especial',105),
    backdrop:hex(p?.backdrop,defaultBackdrops[(i+1)%5]),
  })),
  strokes
 }};
}
function textHtml(text){
 let s=safe(clip(text,1200)).replace(/\*\*([^*\n]+)\*\*/g,'<b>$1</b>').replace(/\*([^*\n]+)\*/g,'<em>$1</em>');
 return s.split(/\n/).map(line=>line.trim()?'<p>'+line+'</p>':'').join('');
}
function sketchMarkup(strokes,color){
 const paths=strokes.map(s=>{
  const pts=s.points,nums=pts.map(p=>p.join(' ')),style='stroke="'+hex(s.color)+'" stroke-width="'+s.width+'"';
  if(s.type==='rectangle'&&pts.length>=2){
   const a=pts[0],b=pts[pts.length-1];
   return '<rect x="'+Math.min(a[0],b[0])+'" y="'+Math.min(a[1],b[1])+'" width="'+Math.abs(a[0]-b[0])+'" height="'+Math.abs(a[1]-b[1])+'" fill="none" '+style+'/>';
  }
  if(s.type==='circle'&&pts.length>=2){
   const a=pts[0],b=pts[pts.length-1],rx=Math.abs(a[0]-b[0])/2,ry=Math.abs(a[1]-b[1])/2;
   return '<ellipse cx="'+((a[0]+b[0])/2)+'" cy="'+((a[1]+b[1])/2)+'" rx="'+rx+'" ry="'+ry+'" fill="none" '+style+'/>';
  }
  return '<polyline points="'+nums.join(' ')+'" fill="none" '+style+' stroke-linecap="round" stroke-linejoin="round"/>';
 }).join('');
 return '<svg class="ck-art" viewBox="0 0 600 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Dibujo original del estudiante"><rect width="600" height="320" fill="'+color+'"/>'+paths+'</svg>';
}
function enhance(data, files){
 const d=normalize(data),kind=d.kind,t=d.tools,strokes=t.strokes;
 if(!modes[kind])return files;
 const artworks=sketchMarkup(strokes,t.backdrop);
 const pages=(d.panels||[]).slice(0,3).map((p,i)=>{
  const scene=t.perScene[i],caption=safe(p.title),txt=textHtml(p.text);
  if(kind==='historietas')return '<article class="ck-panel ck-comic"><div class="ck-panel-art" style="background:'+scene.backdrop+'"><span class="ck-face">'+safe(scene.character)+'</span><span class="ck-speech">'+txt+'</span></div><h2>'+caption+'</h2><small>VIÑETA '+(i+1)+'</small></article>';
  if(kind==='dramas')return '<article class="ck-panel ck-stage"><small>ACTO '+(i+1)+' · '+safe(scene.stage)+'</small><div class="ck-stage-top"><span>'+safe(scene.character)+'</span><strong>'+safe(scene.speaker)+'</strong></div><h2>'+caption+'</h2><div class="ck-dialogue">'+txt+'</div></article>';
  if(kind==='animes')return '<article class="ck-panel ck-anime"><small>ESCENA '+(i+1)+' · '+safe(scene.stage)+'</small><div class="ck-anime-scene" style="background:'+scene.backdrop+'"><span class="ck-anim-char">'+safe(scene.character)+'</span><div class="ck-anime-bubble">'+txt+'</div></div><h2>'+caption+'</h2></article>';
  if(kind==='flyers')return '<article class="ck-panel ck-flyer-item"><h2>'+caption+'</h2>'+txt+'</article>';
  if(kind==='dibujos')return '<article class="ck-panel"><h2>'+caption+'</h2>'+txt+'</article>';
  if(kind==='blogs')return '<article class="ck-panel ck-article"><small>ARTÍCULO '+(i+1)+'</small><h2>'+caption+'</h2>'+txt+'</article>';
  return '<article class="ck-panel ck-book"><small>CAPÍTULO '+(i+1)+'</small><h2>'+caption+'</h2>'+txt+'</article>';
 }).join('');
 const cls=(kind==='historietas'?'ck-grid-comic':kind==='dramas'?'ck-grid-stage':kind==='animes'?'ck-grid-anime':kind==='flyers'?'ck-grid-flyer':'ck-grid');
 const accent=/^#[0-9a-f]{6}$/i.test(d.color)?d.color:'#237fc3';
 const showDraw=kind==='dibujos'||strokes.length>0;
 const artwork=showDraw?'<figure class="ck-drawing">'+artworks+'<figcaption>Ilustración original</figcaption></figure>':'';
 const cta=kind==='flyers'?'<div class="ck-cta">'+safe(t.callToAction)+'</div>':'';
 const partner=kind==='dramas'||kind==='historietas'||kind==='animes'?'<span class="ck-partner">'+safe(t.character)+' '+safe(t.partner)+'</span>':'';
 const motion=kind==='animes'?'<button type="button" id="ck-anim-toggle" class="ck-anim-control">⏸ Pausar animación</button>':'';
 const font=t.font==='Clásica'?'Georgia,serif':t.font==='Cómic'?'Trebuchet MS,cursive':'system-ui,Arial,sans-serif';
 const html='<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+safe(d.title)+'</title><link rel="stylesheet" href="style.css"></head><body class="ck-public ck-'+kind+'"><main><header><small>CLUB KRUEKA · '+safe(modes[kind].label.toUpperCase())+'</small><h1>'+safe(d.title)+'</h1><p>'+safe(d.subtitle)+'</p>'+partner+'</header><div class="ck-cover"><div class="ck-cover-symbol">'+safe(d.art)+'</div><strong>'+safe(t.action)+'</strong></div>'+artwork+'<section class="ck-pages '+cls+'">'+pages+'</section>'+cta+motion+'<footer>Una creación original del Club Krueka</footer></main><script src="script.js"></script></body></html>';
 const css=':root{--accent:'+accent+';--back:'+t.backdrop+'}*{box-sizing:border-box}body{margin:0;color:#152c49;background:#f1f6fd;font:16px/1.5 '+font+'}main{max-width:1080px;margin:auto;padding:22px}header{text-align:center;padding:25px 10px}header small{color:var(--accent);font:800 12px system-ui;letter-spacing:2px}h1{font-size:clamp(28px,4vw,48px);line-height:1.15;margin:10px 0 7px}header p{color:#4a6177;margin:0}.ck-cover{padding:24px;background:linear-gradient(125deg,var(--accent),#192648);border-radius:24px;display:flex;align-items:center;justify-content:center;gap:24px;color:white}.ck-cover-symbol{font-size:70px}.ck-cover strong{font-size:clamp(16px,3vw,27px);max-width:460px}.ck-pages{margin:23px 0;display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px}.ck-panel{padding:22px;background:white;border:1px solid #c9d9eb;border-radius:16px;overflow-wrap:anywhere;min-height:190px}.ck-panel small{font:800 11px system-ui;color:var(--accent);letter-spacing:1px}.ck-panel h2{font-size:21px;margin:10px 0}.ck-panel p{margin:7px 0;color:#304c69}.ck-art{width:100%;height:auto;max-height:450px;display:block;border-radius:13px;border:1px solid #aebdd0}.ck-drawing{margin:23px auto;max-width:840px}.ck-drawing figcaption{text-align:center;font-size:12px;color:#687f99}.ck-partner{display:block;font-size:24px;margin-top:10px}.ck-cta{margin:22px auto;padding:20px;background:var(--accent);border-radius:13px;text-align:center;color:white;font-size:25px;font-weight:900}.ck-public footer{text-align:center;font:12px system-ui;color:#6e839a;padding:25px 0}.ck-grid-comic{grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:9px}.ck-comic{border:3px solid #162b46;border-radius:5px;padding:9px}.ck-panel-art{height:185px;display:flex;align-items:center;justify-content:space-around;gap:10px;padding:12px}.ck-face{font-size:60px}.ck-speech{display:block;max-width:68%;background:#fff;border:2px solid #142942;border-radius:25px;padding:11px;font-size:14px}.ck-speech p{margin:0}.ck-comic h2{font-size:18px}.ck-stage{background:#1a2944;color:#fff;text-align:center}.ck-stage small{color:#aadeff}.ck-stage-top{display:flex;justify-content:center;align-items:center;gap:15px;border-bottom:3px solid var(--accent);padding:15px 0}.ck-stage-top span{font-size:48px}.ck-stage h2,.ck-stage .ck-dialogue p{color:#fff}.ck-dialogue{font-style:italic}.ck-anime{background:#111e35;color:white}.ck-anime h2{color:white}.ck-anime-scene{position:relative;min-height:180px;border-radius:12px;overflow:hidden;display:flex;align-items:center;padding:10px}.ck-anim-char{font-size:77px;animation:float 2s ease-in-out infinite alternate}.ck-anime-bubble{max-width:65%;margin-left:auto;background:#fff;border:2px solid #1c385d;color:#1a3351;border-radius:23px;padding:12px;font-size:13px}.ck-anime-bubble p{margin:0}.ck-grid-flyer{grid-template-columns:1fr}.ck-flyers main{max-width:690px}.ck-flyers .ck-cover{flex-direction:column;text-align:center}.ck-flyer-item{text-align:center;min-height:auto;padding:10px 20px}.ck-flyer-item h2{font-size:23px;color:var(--accent)}.ck-dibujos .ck-cover{padding:10px}.ck-dibujos .ck-cover-symbol{font-size:45px}.ck-blogs .ck-cover{justify-content:flex-start}.ck-cuentos .ck-book{font-family:Georgia,serif}.ck-public.paused .ck-anim-char{animation-play-state:paused}@keyframes float{to{transform:translateX(25px) translateY(-18px) rotate(8deg)}}@media(max-width:600px){main{padding:11px}.ck-pages{grid-template-columns:1fr}.ck-cover-symbol{font-size:48px}.ck-cover{padding:16px}.ck-anime-scene{min-height:140px}}';
 const script=kind==='animes'?'const b=document.getElementById("ck-anim-toggle");if(b)b.onclick=()=>{const p=document.body.classList.toggle("paused");b.textContent=p?"▶ Reproducir animación":"⏸ Pausar animación"};':'/* Mi obra creada con Club Krueka. */';
 return {...files,'index.html':html,'style.css':css,'script.js':script,'obra.json':JSON.stringify(d,null,2)};
}
function field(label,value,handler,options){
 const el=document.createElement('label');el.className='ct-field';
 const span=document.createElement('span');span.textContent=label;el.appendChild(span);
 let input;
 if(options?.values){
  input=document.createElement('select');
  options.values.forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;input.appendChild(o)});
  input.value=value;
 }else{
  input=document.createElement('input');input.type=options?.type||'text';input.value=value;
  if(options?.maxlength)input.maxLength=options.maxlength;
 }
 input.addEventListener(options?.type==='color'?'input':'change',()=>handler(input.value));
 el.appendChild(input);return el;
}
function paintSketch(canvas,strokes,draft,background){
 const ctx=canvas.getContext('2d');if(!ctx)return;
 ctx.clearRect(0,0,600,320);ctx.fillStyle=background;ctx.fillRect(0,0,600,320);
 for(const s of [...strokes,...(draft?[draft]:[])]){
  if(!s?.points?.length)continue;
  ctx.strokeStyle=s.color;ctx.lineWidth=s.width;ctx.lineCap='round';ctx.lineJoin='round';
  const p=s.points,first=p[0],last=p[p.length-1];
  if(s.type==='rectangle'){ctx.strokeRect(first[0],first[1],last[0]-first[0],last[1]-first[1]);}
  else if(s.type==='circle'){const rx=Math.abs(last[0]-first[0])/2,ry=Math.abs(last[1]-first[1])/2;ctx.beginPath();ctx.ellipse((first[0]+last[0])/2,(first[1]+last[1])/2,Math.max(.1,rx),Math.max(.1,ry),0,0,Math.PI*2);ctx.stroke();}
  else{ctx.beginPath();ctx.moveTo(first[0],first[1]);for(const v of p.slice(1))ctx.lineTo(v[0],v[1]);if(p.length===1)ctx.lineTo(first[0]+.01,first[1]+.01);ctx.stroke();}
 }
}
function render(work,s,data,onChange){
 const d=normalize(data),t=d.tools,kind=d.kind,spec=modes[kind];if(!spec)return;
 const parent=work.querySelector('#ck-specific-tools');if(!parent)return;
 parent.replaceChildren();
 const title=document.createElement('div');title.className='ct-tools-title';
 const strong=document.createElement('strong');strong.textContent='🧰 Herramientas de '+spec.label;
 const desc=document.createElement('p');desc.textContent=spec.tip;title.append(strong,desc);parent.append(title);
 const card=document.createElement('div');card.className='ct-controls';
 const current=()=>normalize((function(){try{return JSON.parse(s.files['obra.json'])}catch(_e){return d}})());
 const change=(key,val)=>{const latest=current();onChange({...latest,tools:{...latest.tools,[key]:val}});};
 card.append(field('Estilo de la obra',t.layout,v=>change('layout',v),{values:spec.layouts}));
 card.append(field('Fondo',t.backdrop,v=>change('backdrop',v),{type:'color'}));
 card.append(field('Tipografía',t.font,v=>change('font',v),{values:['Moderna','Cómic','Clásica']}));
 if(kind==='flyers')card.append(field('Llamado a la acción',t.callToAction,v=>change('callToAction',v),{maxlength:65}));
 if(kind==='blogs')card.append(field('Firma artística (no nombre real)',t.author,v=>change('author',v),{maxlength:36}));
 if(['dramas','animes','historietas','cuentos'].includes(kind)){
  card.append(field('Protagonista',t.character,v=>change('character',v),{maxlength:8}));
  card.append(field('Personaje secundario',t.partner,v=>change('partner',v),{maxlength:8}));
 }
 if(kind==='animes')card.append(field('Efecto de movimiento',t.effect,v=>change('effect',v),{values:['Flotar','Deslizar','Zoom suave']}));
 if(kind==='historietas')card.append(field('Globo de texto',t.bubble,v=>change('bubble',v),{values:['Redondo','Rectangular','Narración']}));
 card.append(field('Frase destacada',t.action,v=>change('action',v),{maxlength:90}));
 parent.append(card);
 const guide=document.createElement('div');guide.className='ct-guide';guide.textContent=kind==='dramas'?'Cada parte es un acto. Escribí los diálogos y una acotación escénica.':kind==='animes'?'Cada parte es una escena: personaje, fondo, diálogo y movimiento.':kind==='historietas'?'Cada parte es una viñeta: elegí el personaje y escribí su diálogo.':kind==='dibujos'?'Dibujá en el lienzo y tu ilustración aparecerá en la vista previa.':kind==='flyers'?'Combiná título, colores, imagen y mensaje.':kind==='blogs'?'Usá títulos claros y destacá ideas en negrita.': 'Contá tu historia por capítulos y decorá la portada.';
 parent.append(guide);
 if(['blogs','cuentos','historietas','dramas','animes','flyers'].includes(kind)){
  const bar=document.createElement('div');bar.className='ct-format';
  for(const [label,start,end] of [['Negrita','**','**'],['Cursiva','*','*']]){
   const b=document.createElement('button');b.type='button';b.textContent=label;
   b.onclick=()=>{
    const area=work.querySelector('#ck-scenes textarea:focus')||work.querySelector('#ck-scenes textarea');
    if(!area)return;const a=area.selectionStart,z=area.selectionEnd,word=area.value.slice(a,z)||'texto';
    area.setRangeText(start+word+end,a,z,'end');area.dispatchEvent(new Event('input',{bubbles:true}));area.focus();
   };bar.append(b);
  }
  parent.append(bar);
 }
 if(['dramas','animes','historietas'].includes(kind)){
  work.querySelectorAll('.ck-scene').forEach((section,i)=>{
   const p=t.perScene[i],details=document.createElement('div');details.className='ct-scene-tools';
   const set=(key,val)=>{
    const latest=current(),scenes=latest.tools.perScene.map(x=>({...x}));
    scenes[i][key]=val;onChange({...latest,tools:{...latest.tools,perScene:scenes}});
   };
   details.append(field('Personaje',p.character,v=>set('character',v),{maxlength:8}));
   details.append(field('Quién habla',p.speaker,v=>set('speaker',v),{maxlength:36}));
   details.append(field('Escenario / acotación',p.stage,v=>set('stage',v),{maxlength:105}));
   details.append(field('Fondo de escena',p.backdrop,v=>set('backdrop',v),{type:'color'}));
   section.append(details);
  });
 }
 // A canvas is available in every art-friendly workshop, but drawing is the main tool for Dibujos.
 if(['dibujos','historietas','animes','cuentos','flyers','blogs','dramas'].includes(kind)){
  const box=document.createElement('div');box.className='ct-drawing-box';
  const head=document.createElement('strong');head.textContent=kind==='dibujos'?'🎨 Lienzo de dibujo':'🎨 Ilustración de portada / escena';
  const bar=document.createElement('div');bar.className='ct-paintbar';
  let tool=t.tool,ink=t.ink,width=t.brush,draft=null;
  const strokeControls=[['Pincel','pen'],['Línea','line'],['Rectángulo','rectangle'],['Círculo','circle']];
  for(const [label,value] of strokeControls){
   const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.paint=value;
   b.setAttribute('aria-pressed',String(tool===value));b.onclick=()=>{
    tool=value;bar.querySelectorAll('[data-paint]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.paint===tool)));
    change('tool',tool);
   };bar.append(b);
  }
  const c=document.createElement('input');c.type='color';c.value=ink;c.title='Color del pincel';c.setAttribute('aria-label','Color del pincel');c.onchange=()=>{ink=c.value;change('ink',ink)};bar.append(c);
  const size=document.createElement('input');size.type='range';size.min='1';size.max='18';size.value=String(width);size.title='Grosor';size.setAttribute('aria-label','Grosor del pincel');size.onchange=()=>{width=Number(size.value);change('brush',width)};bar.append(size);
  const undo=document.createElement('button');undo.type='button';undo.textContent='↶ Deshacer trazo';undo.onclick=()=>{const data=current();if(!data.tools.strokes.length)return;change('strokes',data.tools.strokes.slice(0,-1));paintSketch(canvas,current().tools.strokes,null,current().tools.backdrop)};bar.append(undo);
  const clear=document.createElement('button');clear.type='button';clear.textContent='Limpiar';clear.onclick=()=>{if(!confirm('¿Limpiar la ilustración de esta obra?'))return;change('strokes',[]);paintSketch(canvas,[],null,current().tools.backdrop)};bar.append(clear);
  const canvas=document.createElement('canvas');canvas.width=600;canvas.height=320;canvas.className='ct-canvas';canvas.setAttribute('aria-label','Lienzo para dibujar la ilustración');canvas.style.touchAction='none';
  function coord(e){const rect=canvas.getBoundingClientRect();return [Math.max(0,Math.min(600,Math.round((e.clientX-rect.left)*600/rect.width))),Math.max(0,Math.min(320,Math.round((e.clientY-rect.top)*320/rect.height)))];}
  canvas.addEventListener('pointerdown',e=>{if(!s.cloudReady||s.busy)return;e.preventDefault();canvas.setPointerCapture(e.pointerId);draft={type:tool,color:ink,width,points:[coord(e)]};paintSketch(canvas,current().tools.strokes,draft,current().tools.backdrop);});
  canvas.addEventListener('pointermove',e=>{if(!draft)return;const pos=coord(e),points=draft.points;
   if(draft.type==='pen'){const last=points[points.length-1];if(Math.hypot(pos[0]-last[0],pos[1]-last[1])>=3&&points.length<150)points.push(pos);}
   else draft.points=[points[0],pos];
   paintSketch(canvas,current().tools.strokes,draft,current().tools.backdrop);
  });
  const finish=()=>{if(!draft)return;const next=current();const updated=[...next.tools.strokes,draft].slice(-70);draft=null;change('strokes',updated);paintSketch(canvas,updated,null,current().tools.backdrop);};
  canvas.addEventListener('pointerup',finish);canvas.addEventListener('pointercancel',finish);
  box.append(head,bar,canvas);const hint=document.createElement('small');hint.textContent='Dibujá con el mouse o con el dedo. Los trazos se guardan junto a la obra.';box.append(hint);parent.append(box);
  paintSketch(canvas,t.strokes,null,t.backdrop);
 }
}
window.ClubTalleres={modes,normalize,enhance,render,sketchMarkup};
})();