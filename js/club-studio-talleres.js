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
 const strokes=Array.isArray(t.strokes)?t.strokes.slice(-45).map(s=>({
  type:['pen','line','rectangle','circle'].includes(s.type)?s.type:'pen',
  color:hex(s.color,'#193959'),
  width:Math.max(1,Math.min(18,Number(s.width)||4)),
  points:Array.isArray(s.points)?s.points.slice(0,100).map(p=>[Math.max(0,Math.min(600,Math.round(Number(p?.[0])||0))),Math.max(0,Math.min(320,Math.round(Number(p?.[1])||0)))]):[]
 })).filter(s=>s.points.length>0):[];
 return {...d,tools:{
  ...t,
  layout:opts.layouts.includes(t.layout)?t.layout:opts.layouts[0],
  backdrop:hex(t.backdrop,defaultBackdrops[0]),
  ink:hex(t.ink,'#193959'),
  brush:Math.max(1,Math.min(18,Number(t.brush)||4)),
  tool:['pen','line','rectangle','circle','erase'].includes(t.tool)?t.tool:'pen',
  character:clip(t.character||'🦊',8),
  partner:clip(t.partner||'🐱',8),
  author:clip(t.author||'Un creador del Club',36),
  action:clip(t.action||'¡Una idea cobra vida!',90),
  callToAction:clip(t.callToAction||'¡Descubrí más!',65),
  font:['Moderna','Cómic','Clásica'].includes(t.font)?t.font:'Moderna',
  sceneSeconds:Math.max(2,Math.min(12,Math.round(Number(t.sceneSeconds)||5))),
  effect:['Flotar','Deslizar','Zoom suave'].includes(t.effect)?t.effect:'Flotar',
  bubble:['Redondo','Rectangular','Narración'].includes(t.bubble)?t.bubble:'Redondo',
  perScene:Array.from({length:Math.max(3,d.panels?.length||0)},(_,i)=>t.perScene?.[i]).map((p,i)=>({
    ...p,
    character:clip(p?.character|| (i%2?'🐱':'🦊'),8),
    speaker:clip(p?.speaker|| (i%2?'Amigo':'Protagonista'),36),
    stage:clip(p?.stage||'En un lugar especial',105),
    backdrop:hex(p?.backdrop,defaultBackdrops[(i+1)%5]),
  })),
  strokes
 }};
}
function textHtml(text){
 let s=safe(text).replace(/\*\*([^*\n]+)\*\*/g,'<b>$1</b>').replace(/\*([^*\n]+)\*/g,'<em>$1</em>');
 return s.split(/\n/).map(line=>line.trim()?'<p>'+line+'</p>':'').join('');
}
function paperPages(text){
 const pages=[];
 let remaining=String(text??'');
 while(remaining.length>950){
  const candidate=remaining.slice(0,950);
  let end=candidate.lastIndexOf('\n');
  if(end<500)end=candidate.search(/\s+\S*$/);
  if(end<500)end=950;
  if(/[\uD800-\uDBFF]/.test(remaining[end-1]||''))end--;
  pages.push(remaining.slice(0,end));
  remaining=remaining.slice(end).trimStart();
 }
 pages.push(remaining);
 return pages;
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
  if(pts.length===1)return '<circle cx="'+pts[0][0]+'" cy="'+pts[0][1]+'" r="'+s.width/2+'" fill="'+hex(s.color)+'"/>';
  return '<polyline points="'+nums.join(' ')+'" fill="none" '+style+' stroke-linecap="round" stroke-linejoin="round"/>';
 }).join('');
 return '<svg class="ck-art" viewBox="0 0 600 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Dibujo original del estudiante"><rect width="600" height="320" fill="'+color+'"/>'+paths+'</svg>';
}
const readingStyle=`
.ck-pagination{position:sticky;top:0;z-index:3;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:8px;padding:9px 6px;margin:12px auto;background:#fffcf1f5;color:#492d1b;border-radius:10px;box-shadow:0 2px 8px #35221122;font:14px/1.3 system-ui}
.ck-pagination button{padding:7px 11px;font:inherit;border:1px solid #9f7952;border-radius:8px;background:#fff4d6;color:inherit;cursor:pointer}
.ck-pagination button:disabled{opacity:.5;cursor:default}
.ck-pagination button:focus-visible{outline:2px solid #715437;outline-offset:2px}
.ck-pages.ck-viewer-pages{scroll-margin-top:114px;display:block;max-width:760px;margin:18px auto}
.ck-panel[hidden]{display:none}
.ck-cuentos{background:radial-gradient(ellipse at top,#d5b283,#806043 90%);color:#342014}
.ck-cuentos main{max-width:850px}
.ck-cuentos header{padding-bottom:12px}
.ck-cuentos header p,.ck-cuentos header small{color:#3e2818}
.ck-cuentos .ck-cover{border-radius:7px 14px 14px 7px;border:4px double #d1ab74;background:linear-gradient(90deg,#0009,transparent 8%,#0003),var(--accent);box-shadow:0 7px 20px #25170888}
.ck-cuentos .ck-viewer-pages{touch-action:pan-y pinch-zoom;position:relative;padding:0 7px 8px 0;border-left:8px solid #523321;border-radius:5px 15px 15px 4px;background:repeating-linear-gradient(0deg,#a78053 0 1px,#ecd2a0 1px 3px);box-shadow:0 2px 0 4px #684129,0 16px 24px #36231770;perspective:1400px}
.ck-cuentos .ck-book{min-height:333px;padding:clamp(17px,5vw,50px);border:0;border-radius:2px 12px 12px 2px;transform-origin:left center;background:linear-gradient(90deg,#b98b4b68,transparent 6%,transparent 94%,#aa753b38),repeating-linear-gradient(0deg,#fff2ce40 0 1px,transparent 1px 3px),radial-gradient(ellipse at center,#fff6dd,#ebd1a0);box-shadow:inset 0 0 22px #92633745;line-height:1.7}
.ck-cuentos .ck-book p,.ck-cuentos .ck-book small,.ck-cuentos footer{color:#4a2f20}
.ck-cuentos .ck-book h2{font-size:clamp(22px,4.5vw,38px);line-height:1.25;margin:.4em 0 .7em}
.ck-cuentos.ck-layout-1 .ck-book{background:linear-gradient(90deg,#ba9b6159,transparent 8%),#fffae8}
.ck-cuentos.ck-layout-2 .ck-book{border:7px double #b88756}
.ck-cuentos.ck-layout-2 .cm-panel-img{margin-inline:auto;max-height:420px}
.ck-cuentos .ck-book.ck-turn-forward{animation:ck-page-forward .4s ease-out}
.ck-cuentos .ck-book.ck-turn-back{animation:ck-page-back .4s ease-out}
@keyframes ck-page-forward{from{transform:rotateY(-14deg);filter:brightness(.87)}to{transform:rotateY(0)}}
@keyframes ck-page-back{from{transform:rotateY(10deg);filter:brightness(.9)}to{transform:rotateY(0)}}
.ck-dramas .ck-stage{background:radial-gradient(ellipse at 50% 15%,var(--scene),#171226 62%);border-width:0 8px 9px;border-style:solid;border-color:#532e44;border-radius:10px;box-shadow:0 13px 24px #20142748}
.ck-dramas .ck-stage-top{padding:17px;background:#181327d9;border-radius:7px;border-bottom-color:#e0ba80;color:#ffebc9}
.ck-dramas .ck-stage small,.ck-dramas .ck-stage h2,.ck-dramas .ck-dialogue p{color:#fff6e4}
.ck-dramas .ck-dialogue{margin:12px auto 0;padding:12px;background:#181327e8;border-radius:7px}
.ck-dramas.ck-layout-1 .ck-stage{background:#fff9e9;color:#3a302a;border-color:#cdaf85;font-family:Georgia,serif;text-align:left}
.ck-dramas.ck-layout-1 .ck-stage-top{justify-content:flex-start;background:transparent;color:#3a302a}
.ck-dramas.ck-layout-1 .ck-dialogue{background:transparent}
.ck-dramas.ck-layout-1 .ck-stage small,.ck-dramas.ck-layout-1 .ck-stage h2,.ck-dramas.ck-layout-1 .ck-dialogue p{color:#3a302a}
.ck-dramas.ck-layout-2 .ck-stage{background:#27213a}
.ck-animes .ck-viewer-pages .ck-anime{box-shadow:0 10px 27px #101d4459}
.ck-animes .ck-anime-scene{aspect-ratio:16/9;min-height:165px;padding:clamp(8px,3vw,22px);background:radial-gradient(ellipse at 15% 30%,#fff9,transparent 45%),var(--scene)}
.ck-animes.ck-layout-1 .ck-anime-scene{aspect-ratio:21/9}
.ck-animes.ck-layout-2 .ck-anime{border:4px solid #374963}
.ck-animes .ck-anime-bubble{overflow:auto;max-height:96%}
.ck-historietas.ck-layout-1 .ck-pages{grid-template-columns:repeat(auto-fit,minmax(min(320px,100%),1fr))}
.ck-historietas.ck-layout-2 .ck-pages{grid-template-columns:1fr;max-width:680px;margin-inline:auto}
.ck-historietas .ck-panel-art{min-height:185px;height:auto}
.ck-flyers.ck-layout-1 .ck-cover{border-radius:0;border-block:6px double #ffebaf}
.ck-flyers.ck-layout-2 .ck-cover{min-height:245px;text-align:center}
.ck-blogs.ck-layout-0 .ck-article:first-child{grid-column:1/-1;border-top:5px solid var(--accent)}
.ck-blogs.ck-layout-2 .ck-article{border:0;border-bottom:1px solid #94a6bc;border-radius:0;box-shadow:none}
.ck-dibujos.ck-layout-1 .ck-drawing{padding:clamp(8px,4vw,30px);background:#fff;border:1px solid #aeb8c7;box-shadow:0 6px 18px #0c20334a}
.ck-dibujos.ck-layout-2 .ck-drawing{padding:8px;border:8px double var(--accent);background:#f4f6fb}
@media(prefers-reduced-motion:reduce){.ck-cuentos .ck-book,.ck-animes .ck-anim-char,.cm-model{animation:none!important}}
`;
const bookStyle=`
.ck-public.ck-reader{background:radial-gradient(ellipse at top,#31434a,#14242c 85%);color:#f8ebce;min-height:100vh}
.ck-reader main{max-width:1140px;padding:clamp(10px,2vw,24px);margin:auto}
.ck-reader header{padding:0 0 8px;text-align:left}
.ck-reader header h1{font:normal clamp(22px,3.5vw,38px)/1.15 Georgia,serif;margin:3px 0}
.ck-reader header small,.ck-reader header p,.ck-reader footer{color:#e2d8bc}
.ck-reader header .ck-partner{display:none}
.ck-reader .ck-pagination{position:static;justify-content:space-between;margin:0 0 10px;padding:0;background:none;color:#f5e6c9;box-shadow:none}
.ck-reader .ck-pagination button{background:transparent;color:inherit;border-color:#b1a792}
.ck-reader .ck-pages.ck-spread{--paper:#faedcd;position:relative;display:grid;grid-template-columns:minmax(0,1fr);gap:0;isolation:isolate;max-width:none;margin:0 auto;overflow:visible;padding:0;border:4px solid var(--accent);border-bottom-width:7px;border-radius:6px;background:var(--paper);box-shadow:0 2px #ac9775,0 4px #e5d1a5,0 6px #847359,0 12px 28px #0005;touch-action:pan-y pinch-zoom}
.ck-reader .ck-spread>.ck-leaf,.ck-reader .ck-spread::after{grid-row:1;grid-column:1;min-width:0;box-sizing:border-box;height:clamp(190px,var(--ck-page-height,calc(100dvh - 195px)),700px);overflow-y:auto;overflow-wrap:anywhere;overscroll-behavior-y:contain;padding:clamp(18px,3.3vw,48px) clamp(21px,3.5vw,50px) 60px;border:none;border-radius:2px;text-align:left;background:linear-gradient(90deg,#a7824840,transparent 10%,transparent 91%,#af864829),radial-gradient(ellipse at 50% 40%,#fff7e2,var(--paper) 72%,#e4c996);color:#392d20;box-shadow:none;font:17px/1.55 Georgia,serif;scrollbar-width:thin;scrollbar-color:#aa9168 transparent}
.ck-reader .ck-spread>.ck-leaf[hidden]{display:none}
.ck-reader .ck-leaf h2{margin:.65em 0;font:normal clamp(23px,3vw,35px)/1.12 Georgia,serif;color:#422a1d}
.ck-reader .ck-leaf p,.ck-reader .ck-leaf small,.ck-reader .ck-leaf .ck-dialogue p{color:#3f3126}
.ck-reader .ck-leaf small{display:block;color:#70583c;font:700 11px/1.4 system-ui;letter-spacing:.11em}
.ck-reader .ck-leaf .ck-dialogue,.ck-reader .ck-leaf .ck-stage-top{background:transparent;color:#503b29;text-align:left;padding:0;justify-content:flex-start}
.ck-reader .ck-leaf .ck-stage-top{margin:12px 0;border-bottom:1px solid #b69f76}
.ck-reader .ck-leaf .ck-stage-top span{font-size:27px}
.ck-reader .ck-leaf .ck-cover{display:grid;align-content:center;justify-items:center;min-height:55%;margin-top:15px;border:none;background:none;box-shadow:none;color:#513923;text-align:center;padding:0}
.ck-reader .ck-leaf .ck-cover strong{font:italic 19px/1.45 Georgia,serif}
.ck-reader .ck-leaf .ck-cover img,.ck-reader .ck-leaf .ck-drawing{max-width:100%;height:auto}
.ck-reader .ck-front h2{text-align:center;font-variant:small-caps}
.ck-reader .ck-front .ck-partner{text-align:center}
.ck-reader .ck-corner{position:absolute;z-index:2;bottom:0;width:54px;height:54px;display:flex;align-items:flex-end;justify-content:flex-end;padding:0 6px 4px;border:0;border-radius:0;background:linear-gradient(135deg,transparent 48%,#ad926d 50%,#fff4d5 58%,#c9ab7d 77%,#765b3b 100%);color:#44301a;font:700 20px Georgia,serif;cursor:pointer}
.ck-reader .ck-corner:focus-visible{outline:3px solid #226393;outline-offset:-3px}
.ck-reader .ck-corner:hover:enabled{filter:brightness(1.08)}
.ck-reader .ck-corner:disabled{visibility:hidden}
.ck-reader .ck-corner-prev{left:0;justify-content:flex-start;background:linear-gradient(225deg,transparent 48%,#ad926d 50%,#fff4d5 58%,#c9ab7d 77%,#765b3b 100%)}
.ck-reader .ck-corner-next{right:0}
.ck-reader .ck-leaf.ck-turn-forward{transform-origin:left;animation:ck-page-forward .38s ease-out}
.ck-reader .ck-leaf.ck-turn-back{transform-origin:right;animation:ck-page-back .38s ease-out}
@media(min-width:740px){
 .ck-reader .ck-pages.ck-spread{grid-template-columns:repeat(2,minmax(0,1fr))}
 .ck-reader .ck-spread>.ck-verso{grid-column:1;background:linear-gradient(90deg,transparent 86%,#674b2c42),radial-gradient(ellipse at 55% 40%,#fff7e2,var(--paper) 77%,#dbc399)}
 .ck-reader .ck-spread>.ck-recto,.ck-reader .ck-spread::after{grid-column:2;background:linear-gradient(90deg,#75533254,transparent 11%,transparent 96%,#87613726),var(--paper)}
 .ck-reader .ck-spread::after{content:"";z-index:-1}
}
@media(min-width:740px) and (prefers-reduced-motion:no-preference){
 .ck-reader .ck-spread.ck-flip-next::before,.ck-reader .ck-spread.ck-flip-prev::before{content:"";position:absolute;z-index:1;inset:0 0 0 50%;pointer-events:none;transform-origin:left;background:linear-gradient(90deg,#bfa67b,#f3e2ba 14%,#fff5db 80%,#d2b78e);animation:ck-unfold-next .48s ease-in-out both}
 .ck-reader .ck-spread.ck-flip-prev::before{inset:0 50% 0 0;transform-origin:right;animation-name:ck-unfold-prev}
 @keyframes ck-unfold-next{0%{transform:perspective(1600px) rotateY(0)}88%{opacity:1}100%{transform:perspective(1600px) rotateY(-177deg);opacity:0}}
 @keyframes ck-unfold-prev{0%{transform:perspective(1600px) rotateY(0)}88%{opacity:1}100%{transform:perspective(1600px) rotateY(177deg);opacity:0}}
}
@media(prefers-reduced-motion:reduce){.ck-reader .ck-leaf{animation:none!important}}
`;
function bookMarkup(heading,cover,pages){
 const status='<nav class="ck-pagination" aria-label="Opciones de lectura"><span id="ck-page" role="status"></span><button type="button" id="ck-paper-sound" aria-pressed="true">Silenciar hojas</button></nav>';
 const corner=(id,label,symbol)=>'<button type="button" class="ck-corner ck-corner-'+id+'" id="ck-'+id+'" aria-label="'+label+'" title="'+label+'">'+symbol+'</button>';
 return status+'<section aria-label="Libro abierto" class="ck-pages ck-viewer-pages ck-spread"><div class="ck-front ck-leaf" aria-label="Portada"><small>PORTADA</small><h2>'+heading+'</h2>'+cover+'</div>'+pages+corner('prev','Página anterior','‹')+corner('next','Página siguiente','›')+'</section>';
}
function readWork(){
 const sheet=document.querySelector('.ck-viewer-pages');
 const book=sheet.classList.contains('ck-spread');
 const pages=[...sheet.querySelectorAll(':scope > article, :scope > .ck-front')];
 const wide=window.matchMedia('(min-width:740px)');
 const step=()=>book&&wide.matches?2:1;
 const prev=document.getElementById('ck-prev');
 const next=document.getElementById('ck-next');
 const status=document.getElementById('ck-page');
 const sound=document.getElementById('ck-paper-sound');
 const motion=document.getElementById('ck-anim-toggle');
 const play=document.getElementById('ck-scene-play');
 const delay=(Number(play?.dataset.seconds)||5)*1000;
 const Audio=window.AudioContext||window.webkitAudioContext;
 let page=0,audio=null,timer=null,playing=false;
 let touch=null;
 if(book)pages.forEach((leaf,i)=>{leaf.classList.add('ck-leaf',i%2?'ck-recto':'ck-verso');leaf.tabIndex=0;});

 function paper(){
  if(!sound||sound.getAttribute('aria-pressed')!=='true'||!Audio||(navigator.userActivation&&!navigator.userActivation.hasBeenActive))return;
  try{
   audio=audio||new Audio();
   const length=.25,buffer=audio.createBuffer(1,Math.ceil(audio.sampleRate*length),audio.sampleRate);
   const samples=buffer.getChannelData(0);
   for(let i=0;i<samples.length;i++)samples[i]=(Math.random()*2-1)*Math.sin(Math.PI*i/samples.length)**2;
   const source=audio.createBufferSource(),filter=audio.createBiquadFilter(),volume=audio.createGain();
   source.buffer=buffer;
   filter.type='bandpass';filter.frequency.setValueAtTime(1800,audio.currentTime);
   filter.frequency.exponentialRampToValueAtTime(690,audio.currentTime+length);
   filter.Q.value=.7;volume.gain.value=.32;
   source.connect(filter).connect(volume).connect(audio.destination);
   audio.resume().then(()=>source.start()).catch(()=>{});
  }catch(_error){}
 }

 function showPage(direction=0){
  pages.forEach((part,i)=>{
   part.hidden=i<page||i>=page+step();
   if(!part.hidden&&direction)part.scrollTop=0;
   part.classList.remove('ck-turn-forward','ck-turn-back');
  });
  if(direction&&sound)(pages[direction>0?Math.min(page+step()-1,pages.length-1):page]).classList.add(direction>0?'ck-turn-forward':'ck-turn-back');
  prev.disabled=page===0;next.disabled=page+step()>=pages.length;
  if(!book){status.textContent=(page+1)+' / '+pages.length;return;}
  const last=Math.min(page+step()-1,pages.length-1);
  if(page===0)status.textContent=last?'Portada · Página 1 de '+(pages.length-1):'Portada';
  else status.textContent=(page===last?'Página '+page:'Páginas '+page+'–'+last)+' de '+(pages.length-1);
 }

 function turn(direction){
  const target=page+direction*step();
  if(target<0||target>=pages.length)return;
  const former=document.activeElement;
  page=target;showPage(direction);paper();
  if(book){
   sheet.classList.remove('ck-flip-next','ck-flip-prev');
   void sheet.offsetWidth;
   sheet.classList.add(direction>0?'ck-flip-next':'ck-flip-prev');
  }
  if(former===prev&&prev.disabled)next.focus({preventScroll:true});
  if(former===next&&next.disabled)prev.focus({preventScroll:true});
  const reader=document.querySelector('.ck-pagination');
  if(!book&&reader.getBoundingClientRect().top<=1)sheet.scrollIntoView({block:'start'});
 }

 function queue(){
  window.clearTimeout(timer);
  if(!playing)return;
  if(next.disabled){setPlaying(false);return;}
  timer=window.setTimeout(()=>{turn(1);queue()},delay);
 }

 function setPlaying(active){
  playing=active;
  play.setAttribute('aria-pressed',String(active));
  play.textContent=active?'Pausar escenas':'Reproducir escenas';
  queue();
 }

 prev.onclick=()=>{turn(-1);queue()};
 next.onclick=()=>{turn(1);queue()};
 document.addEventListener('keydown',event=>{
  if(event.defaultPrevented||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey)return;
  const direction={ArrowLeft:-1,ArrowRight:1}[event.key];
  if(direction){event.preventDefault();turn(direction);queue();}
 });

 if(book){
  const fit=()=>{
   const top=sheet.getBoundingClientRect().top+window.scrollY;
   sheet.style.setProperty('--ck-page-height',Math.floor(window.innerHeight-top-18)+'px');
  };
  fit();
  window.addEventListener('resize',fit);
  if(window.ResizeObserver){
   const resize=new ResizeObserver(fit);
   resize.observe(document.querySelector('header'));
   resize.observe(document.querySelector('.ck-pagination'));
  }
  wide.addEventListener('change',()=>{page-=page%step();showPage();});
 }
 if(sound){
  sheet.addEventListener('touchstart',event=>{
   const first=event.touches[0];
   touch=event.touches.length===1?[first.clientX,first.clientY]:null;
  },{passive:true});
  sheet.addEventListener('touchend',event=>{
   if(!touch)return;
   const [x,y]=touch;
   touch=null;
   const end=event.changedTouches[0];
   const dx=end.clientX-x,dy=end.clientY-y;
   if(Math.abs(dx)>60&&Math.abs(dx)>1.5*Math.abs(dy))turn(dx<0?1:-1);
  },{passive:true});
  sheet.addEventListener('touchcancel',()=>{touch=null;});
  sound.hidden=!Audio;
  sound.onclick=()=>{
   const enabled=sound.getAttribute('aria-pressed')!=='true';
   sound.setAttribute('aria-pressed',String(enabled));
   sound.textContent=enabled?'Silenciar hojas':'Activar sonido';
   if(enabled)paper();
  };
 }
 if(play)play.onclick=()=>{
  if(!playing&&next.disabled){page=0;showPage();}
  setPlaying(!playing);
 };
 if(motion)motion.onclick=()=>{
  const paused=document.body.classList.toggle('paused');
  motion.textContent=paused?'Activar movimiento':'Pausar movimiento';
 };
 showPage();
}

function enhance(data, files){
 const d=normalize(data),kind=d.kind,t=d.tools,strokes=t.strokes;
 if(!modes[kind])return files;
 const artworks=sketchMarkup(strokes,t.backdrop);
 const book=['cuentos','dramas','blogs'].includes(kind);
 const paged=book||kind==='animes';
 const pages=(d.panels||[]).map((p,i)=>{
  const scene=t.perScene[i],caption=safe(p.title),txt=textHtml(p.text);
  if(kind==='historietas')return '<article class="ck-panel ck-comic"><div class="ck-panel-art" style="background:'+scene.backdrop+'"><span class="ck-face">'+safe(scene.character)+'</span><div class="ck-speech">'+txt+'</div></div><h2>'+caption+'</h2><small>VIÑETA '+(i+1)+'</small></article>';

  if(kind==='animes')return '<article class="ck-panel ck-anime"><small>ESCENA '+(i+1)+' · '+safe(scene.stage)+'</small><div class="ck-anime-scene" style="--scene:'+scene.backdrop+'"><span class="ck-anim-char">'+safe(scene.character)+'</span><div class="ck-anime-bubble"><strong>'+safe(scene.speaker)+'</strong>'+txt+'</div></div><h2>'+caption+'</h2></article>';
  if(kind==='flyers')return '<article class="ck-panel ck-flyer-item"><h2>'+caption+'</h2>'+txt+'</article>';
  if(kind==='dibujos')return '<article class="ck-panel"><h2>'+caption+'</h2>'+txt+'</article>';
  const label={dramas:'ACTO',blogs:'ARTÍCULO',cuentos:'CAPÍTULO'}[kind];
  const type={dramas:'ck-stage',blogs:'ck-article',cuentos:'ck-book'}[kind];
  return paperPages(p.text).map((part,leaf)=>{
   const details=kind==='dramas'?' · '+safe(scene.stage):'';
   const cast=kind==='dramas'?'<div class="ck-stage-top"><span>'+safe(scene.character)+'</span><strong>'+safe(scene.speaker)+'</strong></div>':'';
   const content=kind==='dramas'?'<div class="ck-dialogue">'+textHtml(part)+'</div>':textHtml(part);
   return '<article class="ck-panel '+type+'"'+(leaf?' data-continuacion':'')+'><small>'+label+' '+(i+1)+details+(leaf?' · CONTINÚA':'')+'</small>'+cast+'<h2>'+caption+'</h2>'+content+'</article>';
  }).join('');
 }).join('');
 const layoutClass='ck-layout-'+Math.max(0,modes[kind].layouts.indexOf(t.layout));
 const bubbleClass='ck-bubble-'+Math.max(0,['Redondo','Rectangular','Narración'].indexOf(t.bubble));
 const effectClass='ck-effect-'+Math.max(0,['Flotar','Deslizar','Zoom suave'].indexOf(t.effect));
 const cls=(kind==='historietas'?'ck-grid-comic':kind==='dramas'?'ck-grid-stage':kind==='animes'?'ck-grid-anime':kind==='flyers'?'ck-grid-flyer':'ck-grid');
 const accent=/^#[0-9a-f]{6}$/i.test(d.color)?d.color:'#237fc3';
 const showDraw=kind==='dibujos'||strokes.length>0;
 const artwork=showDraw?'<figure class="ck-drawing">'+artworks+'<figcaption>Ilustración original</figcaption></figure>':'';
 const cta=kind==='flyers'?'<div class="ck-cta">'+safe(t.callToAction)+'</div>':'';
 const partner=kind==='dramas'||kind==='historietas'||kind==='animes'?'<span class="ck-partner">'+safe(t.character)+' '+safe(t.partner)+'</span>':'';

 const player=kind==='animes'?'<button type="button" id="ck-scene-play" data-seconds="'+t.sceneSeconds+'" aria-pressed="false">Reproducir escenas</button><button type="button" id="ck-anim-toggle">Pausar movimiento</button>':'';
 const pagination=paged?'<nav class="ck-pagination" aria-label="Navegación de la obra"><button type="button" id="ck-prev">Anterior</button><span id="ck-page" role="status"></span><button type="button" id="ck-next">Siguiente</button>'+player+'</nav>':'';
 const font=t.font==='Clásica'?'Georgia,serif':t.font==='Cómic'?'Trebuchet MS,cursive':'system-ui,Arial,sans-serif';
 const author=kind==='blogs'?'<p class="ck-author">Publicado por '+safe(t.author)+'</p>':'';
 const cover='<div class="ck-cover"><div class="ck-cover-symbol">'+safe(d.art)+'</div><strong>'+safe(t.action)+'</strong></div>'+artwork;
 const reader=book?bookMarkup(safe(d.title),cover+partner,pages):cover+pagination+'<section class="ck-pages '+(paged?'ck-viewer-pages ':'')+cls+'">'+pages+'</section>';
 const html='<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+safe(d.title)+'</title><link rel="stylesheet" href="style.css"></head><body class="ck-public ck-'+kind+(book?' ck-reader':'')+' '+layoutClass+' '+bubbleClass+' '+effectClass+'"><main><header><small>CLUB KRUEKA · '+safe(modes[kind].label.toUpperCase())+'</small><h1>'+safe(d.title)+'</h1><p>'+safe(d.subtitle)+'</p>'+author+partner+'</header>'+reader+cta+'<footer>Una creación original del Club Krueka</footer></main><script src="script.js"></script></body></html>';
 const css=':root{--accent:'+accent+';--back:'+t.backdrop+'}*{box-sizing:border-box}body{margin:0;color:#152c49;background:var(--back);font:16px/1.5 '+font+'}main{max-width:1080px;margin:auto;padding:22px}header{text-align:center;padding:25px 10px}header small{color:var(--accent);font:800 12px system-ui;letter-spacing:2px}h1{font-size:clamp(28px,4vw,48px);line-height:1.15;margin:10px 0 7px}header p{color:#4a6177;margin:0}.ck-cover{padding:24px;background:linear-gradient(125deg,var(--accent),#192648);border-radius:24px;display:flex;align-items:center;justify-content:center;gap:24px;color:white}.ck-cover-symbol{font-size:70px}.ck-cover strong{font-size:clamp(16px,3vw,27px);max-width:460px}.ck-pages{margin:23px 0;display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px}.ck-panel{padding:22px;background:white;border:1px solid #c9d9eb;border-radius:16px;overflow-wrap:anywhere;min-height:190px}.ck-panel small{font:800 11px system-ui;color:var(--accent);letter-spacing:1px}.ck-panel h2{font-size:21px;margin:10px 0}.ck-panel p{margin:7px 0;color:#304c69}.ck-art{width:100%;height:auto;max-height:450px;display:block;border-radius:13px;border:1px solid #aebdd0}.ck-drawing{margin:23px auto;max-width:840px}.ck-drawing figcaption{text-align:center;font-size:12px;color:#687f99}.ck-partner{display:block;font-size:24px;margin-top:10px}.ck-cta{margin:22px auto;padding:20px;background:var(--accent);border-radius:13px;text-align:center;color:white;font-size:25px;font-weight:900}.ck-public footer{text-align:center;font:12px system-ui;color:#6e839a;padding:25px 0}.ck-grid-comic{grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:9px}.ck-comic{border:3px solid #162b46;border-radius:5px;padding:9px}.ck-panel-art{height:185px;display:flex;align-items:center;justify-content:space-around;gap:10px;padding:12px}.ck-face{font-size:60px}.ck-speech{display:block;max-width:68%;background:#fff;border:2px solid #142942;border-radius:25px;padding:11px;font-size:14px}.ck-speech p{margin:0}.ck-comic h2{font-size:18px}.ck-stage{background:#1a2944;color:#fff;text-align:center}.ck-stage small{color:#aadeff}.ck-stage-top{display:flex;justify-content:center;align-items:center;gap:15px;border-bottom:3px solid var(--accent);padding:15px 0}.ck-stage-top span{font-size:48px}.ck-stage h2,.ck-stage .ck-dialogue p{color:#fff}.ck-dialogue{font-style:italic}.ck-anime{background:#111e35;color:white}.ck-anime h2{color:white}.ck-anime-scene{position:relative;min-height:180px;border-radius:12px;overflow:hidden;display:flex;align-items:center;padding:10px}.ck-anim-char{font-size:77px;animation:float 2s ease-in-out infinite alternate}.ck-anime-bubble{max-width:65%;margin-left:auto;background:#fff;border:2px solid #1c385d;color:#1a3351;border-radius:23px;padding:12px;font-size:13px}.ck-anime-bubble p{margin:0}.ck-grid-flyer{grid-template-columns:1fr}.ck-flyers main{max-width:690px}.ck-flyers .ck-cover{flex-direction:column;text-align:center}.ck-flyer-item{text-align:center;min-height:auto;padding:10px 20px}.ck-flyer-item h2{font-size:23px;color:var(--accent)}.ck-dibujos .ck-cover{padding:10px}.ck-dibujos .ck-cover-symbol{font-size:45px}.ck-blogs .ck-cover{justify-content:flex-start}.ck-cuentos .ck-book{font-family:Georgia,serif}.ck-layout-1 .ck-pages{grid-template-columns:repeat(auto-fit,minmax(300px,1fr))}.ck-layout-2 .ck-pages{grid-template-columns:1fr}.ck-bubble-1 .ck-speech{border-radius:7px}.ck-bubble-2 .ck-speech{border-style:dashed;background:#fffbe5}.ck-effect-1 .ck-anim-char{animation-name:slide}.ck-effect-2 .ck-anim-char{animation-name:zoom}.ck-author{font-size:12px;color:#476b86;font-style:italic}.ck-public.paused .ck-anim-char{animation-play-state:paused}@keyframes slide{to{transform:translateX(65px)}}@keyframes zoom{to{transform:scale(1.15)}}@keyframes float{to{transform:translateX(25px) translateY(-18px) rotate(8deg)}}@media(max-width:600px){main{padding:11px}.ck-pages{grid-template-columns:1fr}.ck-cover-symbol{font-size:48px}.ck-cover{padding:16px}.ck-anime-scene{min-height:140px}}';
 const script=paged?'('+readWork.toString()+')();':'/* Mi obra creada con Club Krueka. */';
 return {...files,'index.html':html,'style.css':css+readingStyle+(book?bookStyle:''),'script.js':script,'obra.json':JSON.stringify(d)};
}
// Recognize the two previously shipped navigation scripts before replacing
// them in a read-only preview. Authored HTML, media and stored files are kept.
function readingFiles(files){
 const html=files?.['index.html'];
 if(typeof html!=='string'||!files['obra.json']||!/<body class="ck-public ck-(?:cuentos|dramas|blogs) ck-layout-/.test(html))return files;
 const script=files['script.js'];
 if(typeof script!=='string')return files;
 if(script!=='/* Mi obra creada con Club Krueka. */'){
  const shipped={488:2490888082,4137:1168281508};
  if(!shipped[script.length])return files;
  let checksum=0;
  for(let i=0;i<script.length;i++)checksum=(Math.imul(checksum,31)+script.charCodeAt(i))>>>0;
  if(checksum!==shipped[script.length])return files;
 }
 const oldNav=/<nav class="ck-pagination"[^>]*>[\s\S]*?<\/nav>/;
 const shell=/(<\/header>)(<div class="ck-cover">[\s\S]*?)<section class="ck-pages [^"]*">([\s\S]*?)<\/section>/;
 const clean=html.replace(oldNav,'');
 if(!shell.test(clean))return files;
 const title=clean.match(/<h1>([\s\S]*?)<\/h1>/)?.[1]||'';
 const doc=clean.replace('<body class="ck-public ','<body class="ck-public ck-reader ').replace(shell,(_all,header,cover,pages)=>header+bookMarkup(title,cover,pages));
 return {...files,'index.html':doc,'style.css':(files['style.css']||'')+readingStyle+bookStyle,'script.js':'('+readWork.toString()+')();'};
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
  if(options?.type==='number'){input.min=options.min;input.max=options.max;}
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
 if(kind==='animes'){
  card.append(field('Efecto de movimiento',t.effect,v=>change('effect',v),{values:['Flotar','Deslizar','Zoom suave']}));
  card.append(field('Segundos por escena',t.sceneSeconds,v=>{
   const seconds=Math.max(2,Math.min(12,Math.round(Number(v)||5)));
   change('sceneSeconds',seconds);
   card.querySelector('input[type="number"]').value=seconds;
  },{type:'number',min:2,max:12}));
 }
 if(kind==='historietas')card.append(field('Globo de texto',t.bubble,v=>change('bubble',v),{values:['Redondo','Rectangular','Narración']}));
 card.append(field('Frase destacada',t.action,v=>change('action',v),{maxlength:90}));
 parent.append(card);
 const guide=document.createElement('div');guide.className='ct-guide';guide.textContent=kind==='dramas'?'Cada parte es un acto. Escribí los diálogos y una acotación escénica.':kind==='animes'?'Cada parte es una escena: personaje, fondo, diálogo y movimiento.':kind==='historietas'?'Cada parte es una viñeta: elegí el personaje y escribí su diálogo.':kind==='dibujos'?'Dibujá en el lienzo y tu ilustración aparecerá en la vista previa.':kind==='flyers'?'Combiná título, colores, imagen y mensaje.':kind==='blogs'?'Usá títulos claros y destacá ideas en negrita.': 'Contá tu historia por capítulos y decorá la portada.';
 parent.append(guide);
 if(['blogs','cuentos','historietas','dramas','animes','flyers'].includes(kind)){
  const bar=document.createElement('div');bar.className='ct-format';
  for(const [label,start,end] of [['Negrita','**','**'],['Cursiva','*','*']]){
   const b=document.createElement('button');b.type='button';b.textContent=label;
   b.onpointerdown=event=>event.preventDefault();
   b.onclick=()=>{
    const area=work.querySelector('#ck-scenes textarea:focus')||work.querySelector('#ck-scenes .ck-scene:not([hidden]) textarea');
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
  const strokeControls=[['Pincel','pen'],['Línea','line'],['Rectángulo','rectangle'],['Círculo','circle'],['Goma','erase']];
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
  canvas.addEventListener('pointerdown',e=>{if(!s.cloudReady||s.busy)return;e.preventDefault();
   const pos=coord(e);
   if(tool==='erase'){
    const latest=current(),strokes=latest.tools.strokes;
    let best=-1,min=Infinity;
    strokes.forEach((s,i)=>s.points.forEach(p=>{const dist=Math.hypot(p[0]-pos[0],p[1]-pos[1]);if(dist<min){min=dist;best=i;}}));
    if(best>=0&&min<42){const next=strokes.filter((_,i)=>i!==best);change('strokes',next);paintSketch(canvas,next,null,latest.tools.backdrop);}
    return;
   }
   canvas.setPointerCapture(e.pointerId);draft={type:tool,color:ink,width,points:[pos]};paintSketch(canvas,current().tools.strokes,draft,current().tools.backdrop);
  });
  canvas.addEventListener('pointermove',e=>{if(!draft)return;const pos=coord(e),points=draft.points;
   if(draft.type==='pen'){
    const last=points[points.length-1];
    if(Math.hypot(pos[0]-last[0],pos[1]-last[1])>=3){
     if(points.length>=100)draft.points=points.filter((_,i)=>i%2===0||i===points.length-1);
     draft.points.push(pos);
    }
   }
   else draft.points=[points[0],pos];
   paintSketch(canvas,current().tools.strokes,draft,current().tools.backdrop);
  });
  const finish=()=>{if(!draft)return;const next=current();const updated=[...next.tools.strokes,draft].slice(-45);draft=null;change('strokes',updated);paintSketch(canvas,updated,null,current().tools.backdrop);};
  canvas.addEventListener('pointerup',finish);canvas.addEventListener('pointercancel',finish);
  box.append(head,bar,canvas);const hint=document.createElement('small');hint.textContent='Dibujá con el mouse o con el dedo. Los trazos se guardan junto a la obra.';box.append(hint);parent.append(box);
  paintSketch(canvas,t.strokes,null,t.backdrop);
 }
}
window.ClubTalleres={modes,normalize,enhance,render,sketchMarkup,readingFiles};
})();