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
 libros:{label:'Libro',layouts:['Clásico','Marfil','Ilustrado'],tip:'Manuscrito continuo, ilustraciones entre párrafos y páginas para hojear.'},
 dramas:{label:'Drama',layouts:['Escenario','Guion','Actos'],tip:'Actores, diálogos, acotaciones y escenas.'},
 animes:{label:'Anime original',layouts:['Storyboard','Episodios','Paneles'],tip:'Personajes, escenas, expresiones y movimiento básico.'},
 flyers:{label:'Flyer',layouts:['Cartel','Promoción','Evento'],tip:'Título, mensaje, colores, icono y llamado a la acción.'},
 dibujos:{label:'Dibujo',layouts:['Lienzo','Galería','Póster'],tip:'Pintá, coloreá láminas, combiná figuras y construí escenas con objetos 3D.'}
};
const defaultBackdrops=['#ecf3fe','#f0e8ff','#fff1d6','#e7fff4','#191d37'];
function safe(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function hex(s,fallback='#237fc3'){return /^#[0-9a-f]{6}$/i.test(s||'')?s:fallback;}
function clip(v,n){return String(v??'').slice(0,n);}
const drawBrushes=['pen','marker','watercolor','neon','dotted','chalk','airbrush','pixel'];
const paintLayers=['base','details'];
const radialOptions=[1,2,4,6,8];
const paintingGradients={cielo:['#e9faff','#7fbaf1'],atardecer:['#ffe9b0','#e879a8'],oceano:['#baf7eb','#357fc4'],bosque:['#edfad4','#7eba92'],noche:['#273457','#8a69be']};
const unit=(value,fallback=1)=>Math.max(.1,Math.min(1,value!=null&&Number.isFinite(Number(value))?Number(value):fallback));
const drawShapes=['line','rectangle','circle','triangle','star','heart'];
const drawObjects=['emoji','text','image','cube','sphere','cylinder','pyramid','cone'];
const drawingImageCache=new Map();
const rpath=(x,y,w,h)=>'M'+x+' '+y+'h'+w+'v'+h+'h'+(-w)+'Z';
const cpath=(x,y,r)=>'M'+(x+r)+' '+y+'a'+r+' '+r+' 0 1 0 '+(-2*r)+' 0a'+r+' '+r+' 0 1 0 '+(2*r)+' 0Z';
const epath=(x,y,rx,ry)=>'M'+(x+rx)+' '+y+'a'+rx+' '+ry+' 0 1 0 '+(-2*rx)+' 0a'+rx+' '+ry+' 0 1 0 '+(2*rx)+' 0Z';
const ppath=points=>'M'+points.map(p=>p.join(' ')).join('L')+'Z';
const region=(id,d,fill='#fffdf8')=>({id,d,fill});
const coloringPages={
 blanco:{label:'Lienzo libre',icon:'🖌️',parts:[]},
 casa:{label:'Mi casa',icon:'🏡',parts:[region('suelo',rpath(0,270,600,50),'#e6f4df'),region('pared',rpath(155,125,292,160)),region('techo',ppath([[125,137],[302,32],[480,137]])),region('puerta',rpath(273,192,68,93)),region('ventana1',rpath(194,161,52,50)),region('ventana2',rpath(368,161,52,50)),region('sol',cpath(520,59,32)),region('arbol',rpath(52,177,27,100)),region('copa',cpath(65,166,56))]},
 flor:{label:'Jardín de flores',icon:'🌻',parts:[region('suelo',rpath(0,271,600,49),'#e2f4d9'),region('tallo',rpath(292,144,17,142)),region('hoja1',epath(250,225,58,21)),region('hoja2',epath(357,247,58,21)),...Array.from({length:8},(_,i)=>{const a=i*Math.PI/4;return region('petalo'+i,epath(Math.round(300+66*Math.cos(a)),Math.round(130+66*Math.sin(a)),33,33))}),region('centro',cpath(300,130,38))]},
 robot:{label:'Robot divertido',icon:'🤖',parts:[region('cuerpo',rpath(211,140,180,129)),region('cabeza',rpath(219,46,164,110)),region('ojo1',cpath(265,97,18)),region('ojo2',cpath(337,97,18)),region('boca',rpath(265,128,70,11)),region('antena',rpath(295,18,12,32)),region('punta',cpath(301,17,14)),region('brazo1',rpath(161,158,54,65)),region('brazo2',rpath(391,158,54,65)),region('pierna1',rpath(240,269,40,43)),region('pierna2',rpath(323,269,40,43)),region('boton',cpath(302,207,19))]},
 auto:{label:'Auto de carrera',icon:'🚗',parts:[region('camino',rpath(0,271,600,49),'#d6e1eb'),region('carroceria',ppath([[85,172],[157,163],[208,106],[400,106],[448,164],[510,180],[510,245],[84,245]])),region('techo',ppath([[210,110],[398,110],[434,163],[163,163]])),region('vidrio1',ppath([[222,119],[297,119],[297,157],[181,157]])),region('vidrio2',ppath([[308,119],[388,119],[417,157],[308,157]])),region('rueda1',cpath(181,246,43)),region('rueda2',cpath(412,246,43)),region('faro',rpath(476,190,33,19))]},
 cohete:{label:'Viaje espacial',icon:'🚀',parts:[region('cuerpo',ppath([[290,66],[350,139],[350,250],[250,250],[250,139]])),region('punta',ppath([[250,139],[300,28],[350,139]])),region('aleta1',ppath([[250,190],[195,266],[250,245]])),region('aleta2',ppath([[350,190],[405,266],[350,245]])),region('ventana',cpath(300,166,31)),region('fuego',ppath([[267,252],[299,314],[333,252]])),region('estrella1',cpath(102,79,24)),region('estrella2',cpath(485,113,18)),region('planeta',cpath(490,247,47))]},
 mariposa:{label:'Mariposa',icon:'🦋',parts:[region('ala1',epath(234,119,75,90)),region('ala2',epath(366,119,75,90)),region('ala3',epath(239,224,69,59)),region('ala4',epath(361,224,69,59)),region('cuerpo',epath(300,174,17,98)),region('mancha1',cpath(224,120,24)),region('mancha2',cpath(376,120,24)),region('mancha3',cpath(245,233,19)),region('mancha4',cpath(355,233,19))]},
 castillo:{label:'Castillo mágico',icon:'🏰',parts:[region('muro',rpath(185,146,235,141)),region('torre1',rpath(120,98,87,191)),region('torre2',rpath(394,98,87,191)),region('torre3',rpath(265,79,72,210)),region('techo1',ppath([[105,101],[163,30],[220,101]])),region('techo2',ppath([[382,101],[437,30],[496,101]])),region('techo3',ppath([[255,80],[302,17],[347,80]])),region('puerta',epath(301,272,43,69)),region('bandera',ppath([[302,16],[302,3],[364,15],[302,27]]))]},
 oceano:{label:'Fondo del mar',icon:'🐠',parts:[region('arena',rpath(0,274,600,46),'#e9dfa6'),region('pez',epath(273,155,112,59)),region('cola',ppath([[358,155],[467,93],[467,219]])),region('aleta',ppath([[252,119],[302,53],[316,118]])),region('ojo',cpath(219,144,12)),region('burbuja1',cpath(100,72,26)),region('burbuja2',cpath(150,113,15)),region('burbuja3',cpath(502,55,33)),region('coral1',ppath([[62,274],[54,196],[77,211],[86,256],[102,181],[122,190],[113,273]])),region('coral2',ppath([[490,274],[470,220],[487,203],[511,245],[531,196],[550,211],[537,274]]))]},
 dinosaurio:{label:'Dinosaurio',icon:'🦕',parts:[region('cuerpo',epath(303,187,114,71)),region('cuello',ppath([[348,171],[403,88],[440,96],[413,196]])),region('cabeza',epath(446,81,63,43)),region('cola',ppath([[209,183],[75,125],[193,236]])),region('pata1',rpath(264,236,35,63)),region('pata2',rpath(356,234,35,65)),region('lomo',ppath([[236,151],[254,120],[282,142],[312,108],[345,142],[372,128],[390,158]])),region('ojo',cpath(469,70,9)),region('pasto',rpath(0,294,600,26),'#e1f2d2')]}
};
const stickerGroups={
 'Animales':['🐱','🐶','🦊','🐻','🦁','🐼','🦋','🐢','🦕','🐬'],
 'Naturaleza':['🌳','🌲','🌷','🌼','🌞','🌈','☁️','⭐','🌙','🍄'],
 'Objetos':['🚗','🚕','🚲','🚀','🛸','🏠','🏰','⚽','🎈','🎁','🍎','📚']
};
function normalize(raw){
 const d=raw&&typeof raw==='object'?raw:{};
 const kind=modes[d.kind]?d.kind:'cuentos',opts=modes[kind];
 const t=d.tools&&typeof d.tools==='object'?d.tools:{};
 const strokes=Array.isArray(t.strokes)?t.strokes.slice(-55).map(s=>({
  type:['pen',...drawShapes].includes(s.type)?s.type:'pen',
  color:hex(s.color,'#193959'),
  width:Math.max(1,Math.min(28,Number(s.width)||4)),
  style:drawBrushes.includes(s.style)?s.style:'pen',
  opacity:unit(s.opacity),
  smooth:Math.max(0,Math.min(100,Math.round(Number(s.smooth)||0))),
  layer:paintLayers.includes(s.layer)?s.layer:'base',
  mirror:s.mirror===true,
  radialSymmetry:radialOptions.includes(s.radialSymmetry)?s.radialSymmetry:1,
  fill:s.fill===true,
  points:Array.isArray(s.points)?s.points.slice(0,100).map(p=>[Math.max(0,Math.min(600,Math.round(Number(p?.[0])||0))),Math.max(0,Math.min(320,Math.round(Number(p?.[1])||0)))]):[]
 })).filter(s=>s.points.length>0):[];
 const template=coloringPages[t.coloringPage]?t.coloringPage:'blanco';
 const validRegions=new Set(coloringPages[template].parts.map(p=>p.id));
 const templateColors=Object.fromEntries(Object.entries(t.templateColors&&typeof t.templateColors==='object'?t.templateColors:{}).filter(([id,value])=>validRegions.has(id)&&/^#[0-9a-f]{6}$/i.test(value)).slice(0,35));
 const stamps=Array.isArray(t.stamps)?t.stamps.slice(-30).map((o,i)=>({
  id:/^obj[a-z0-9]{4,20}$/.test(o?.id)?o.id:'objdefault'+i,
  kind:drawObjects.includes(o?.kind)?o.kind:'emoji',
  text:clip(o?.text||'⭐',28),
  imageId:/^img[a-z0-9]{6,20}$/.test(o?.imageId)?o.imageId:'',
  color:hex(o?.color,'#52a6ef'),
  x:Math.max(0,Math.min(600,Math.round(Number(o?.x)||0))),
  y:Math.max(0,Math.min(320,Math.round(Number(o?.y)||0))),
  scale:Math.max(.35,Math.min(2.4,Math.round((Number(o?.scale)||1)*100)/100)),
  angle:Math.max(-180,Math.min(180,Math.round(Number(o?.angle)||0)))
 })):[];
 const drawingImages=Object.fromEntries(Object.entries(t.drawingImages&&typeof t.drawingImages==='object'?t.drawingImages:{}).filter(([id,value])=>
  /^img[a-z0-9]{6,20}$/.test(id)&&typeof value==='string'&&value.length<=12000&&/^data:image\/webp;base64,[A-Za-z0-9+/=]+$/.test(value)).slice(0,6));
 return {...d,tools:{
  ...t,
  layout:opts.layouts.includes(t.layout)?t.layout:opts.layouts[0],
  backdrop:hex(t.backdrop,kind==='dibujos'?'#fffdf7':defaultBackdrops[0]),
  ink:hex(t.ink,'#193959'),
  brush:Math.max(1,Math.min(28,Number(t.brush)||4)),
  tool:['pen',...drawShapes,'erase','fill','move','picker'].includes(t.tool)?t.tool:'pen',
  brushStyle:drawBrushes.includes(t.brushStyle)?t.brushStyle:'pen',
  opacity:unit(t.opacity),
  smooth:Math.max(0,Math.min(100,Math.round(Number(t.smooth)||0))),
  mirror:t.mirror===true,
  radialSymmetry:radialOptions.includes(t.radialSymmetry)?t.radialSymmetry:1,
  activeLayer:paintLayers.includes(t.activeLayer)?t.activeLayer:'base',
  layerVisibility:{base:t.layerVisibility?.base!==false,details:t.layerVisibility?.details!==false},
  layerLocked:{base:t.layerLocked?.base===true,details:t.layerLocked?.details===true},
  backgroundGradient:Object.prototype.hasOwnProperty.call(paintingGradients,t.backgroundGradient)?t.backgroundGradient:'none',
  guide:['none','grid','perspective'].includes(t.guide)?t.guide:'none',
  shapeFill:t.shapeFill===true,
  coloringPage:template,
  templateColors,
  stamps,
  drawingImages,
  character:clip(t.character||'🦊',8),
  partner:clip(t.partner||'🐱',8),
  author:clip(t.author||'Un creador del Club',36),
  action:clip(t.action||(kind==='libros'?'Una historia para descubrir':'¡Una idea cobra vida!'),90),
  callToAction:clip(t.callToAction||'¡Descubrí más!',65),
  font:['Moderna','Cómic','Clásica'].includes(t.font)?t.font:kind==='libros'?'Clásica':'Moderna',
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
  strokes,
  bookImages:Object.fromEntries(Object.entries(t.bookImages&&typeof t.bookImages==='object'?t.bookImages:{}).filter(([id,data])=>
   /^img[a-z0-9]{6,20}$/.test(id)&&typeof data==='string'&&data.length<=12000&&/^data:image\/webp;base64,[A-Za-z0-9+/=]+$/.test(data)).slice(0,8))
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
function manuscriptPages(text,images){
 const parts=String(text||'').split(/(\[\[imagen:img[a-z0-9]{6,20}\]\])/g),pages=[];
 let buffer='';
 const flush=()=>{if(buffer.trim()){pages.push(textHtml(buffer));buffer='';}};
 for(const part of parts){
  const match=part.match(/^\[\[imagen:(img[a-z0-9]{6,20})\]\]$/);
  if(match&&images[match[1]]){
   flush();pages.push('<figure class="ck-inline-figure"><img alt="Ilustración del libro" src="'+safe(images[match[1]])+'"><figcaption>Ilustración de la historia</figcaption></figure>');
   continue;
  }
  for(const chunk of paperPages(part)){
   if(buffer.length+chunk.length>900)flush();
   buffer+=chunk;
   if(chunk.length>=900)flush();
  }
 }
 flush();
 if(!pages.length)pages.push('<p class="ck-book-empty">Las primeras páginas de tu libro aparecerán aquí cuando empieces a escribir.</p>');
 return pages.map((content,i)=>'<article class="ck-panel ck-book ck-manuscript-leaf"><small>PÁGINA '+(i+1)+'</small>'+content+'</article>').join('');
}
function strokePath(s){
 const p=s.points,a=p[0],b=p[p.length-1]||a,x=Math.min(a[0],b[0]),y=Math.min(a[1],b[1]),w=Math.abs(a[0]-b[0]),h=Math.abs(a[1]-b[1]);
 if(s.type==='rectangle')return rpath(x,y,w,h);
 if(s.type==='circle')return epath(x+w/2,y+h/2,Math.max(.1,w/2),Math.max(.1,h/2));
 if(s.type==='triangle')return ppath([[x+w/2,y],[x+w,y+h],[x,y+h]]);
 if(s.type==='star')return ppath(Array.from({length:10},(_,i)=>{const angle=-Math.PI/2+i*Math.PI/5,r=i%2?.22:.5;return [Math.round((x+w/2+Math.cos(angle)*w*r)*10)/10,Math.round((y+h/2+Math.sin(angle)*h*r)*10)/10]}));
 if(s.type==='heart')return 'M'+(x+w/2)+' '+(y+h)+'C'+(x-w*.1)+' '+(y+h*.53)+' '+x+' '+(y-h*.08)+' '+(x+w*.25)+' '+(y+h*.13)+'C'+(x+w*.5)+' '+(y-h*.08)+' '+(x+w*.78)+' '+(y-h*.08)+' '+(x+w*.82)+' '+(y+h*.13)+'C'+(x+w*1.15)+' '+(y+h*.46)+' '+(x+w*.85)+' '+(y+h*.72)+' '+(x+w/2)+' '+(y+h)+'Z';
 if(s.type==='pen'&&s.smooth>0&&p.length>2){
  let path='M'+a[0]+' '+a[1];
  for(let i=1;i<p.length-1;i++)path+='Q'+p[i][0]+' '+p[i][1]+' '+((p[i][0]+p[i+1][0])/2)+' '+((p[i][1]+p[i+1][1])/2);
  return path+'L'+b[0]+' '+b[1];
 }
 return 'M'+a[0]+' '+a[1]+(p.length===1?'l.01 .01':p.slice(1).map(pt=>'L'+pt[0]+' '+pt[1]).join(''));
}
function strokeLook(s){
 const style=s.style||'pen';
 return {width:Math.min(44,s.width*(style==='watercolor'?2.1:style==='marker'?1.5:style==='airbrush'?2.4:1)),opacity:(style==='watercolor'?.3:style==='marker'?.68:style==='chalk'?.77:style==='airbrush'?.22:.98)*unit(s.opacity),dash:style==='dotted'?'1 '+Math.max(5,s.width*2.2):style==='chalk'?'5 3':'',glow:style==='neon',soft:style==='airbrush',pixel:style==='pixel'};
}
function strokeSvg(s){
 const look=strokeLook(s),shape=s.type!=='pen'&&s.type!=='line';
 const path='<path d="'+strokePath(s)+'" fill="'+(shape&&s.fill?hex(s.color):'none')+'" stroke="'+hex(s.color)+'" stroke-width="'+look.width+'" stroke-opacity="'+look.opacity+'" fill-opacity="'+(shape&&s.fill?.65*unit(s.opacity):0)+'" stroke-linecap="'+(look.pixel?'square':'round')+'" stroke-linejoin="round"'+(look.dash?' stroke-dasharray="'+look.dash+'"':'')+(look.glow?' style="filter:drop-shadow(0 0 4px '+hex(s.color)+')"':look.soft?' style="filter:blur(2px)"':'')+(look.pixel?' shape-rendering="crispEdges"':'')+'/>';
 const copy=path+(s.mirror?'<g transform="translate(600 0) scale(-1 1)">'+path+'</g>':'');
 const count=radialOptions.includes(s.radialSymmetry)?s.radialSymmetry:1;
 return Array.from({length:count},(_,i)=>i?'<g transform="rotate('+(i*360/count)+' 300 160)">'+copy+'</g>':copy).join('');
}
function visibleStrokes(strokes,extras){
 const shown=extras?.layerVisibility||{};
 return strokes.filter(s=>shown[s.layer==='details'?'details':'base']!==false).sort((a,b)=>Number(a.layer==='details')-Number(b.layer==='details'));
}
function shade(color,amount){
 const base=hex(color),rgb=[1,3,5].map(i=>parseInt(base.slice(i,i+2),16));
 return '#'+rgb.map(x=>Math.max(0,Math.min(255,Math.round(amount>0?x+(255-x)*amount:x*(1+amount)))).toString(16).padStart(2,'0')).join('');
}
function stampParts(kind,color){
 const light=shade(color,.38),deep=shade(color,-.32),mid=shade(color,-.12);
 const part=(d,fill)=>({d,fill});
 if(kind==='cube')return [part(ppath([[-35,-23],[0,-43],[36,-22],[0,-1]]),light),part(ppath([[-35,-23],[0,-1],[0,41],[-35,19]]),deep),part(ppath([[0,-1],[36,-22],[36,19],[0,41]]),color)];
 if(kind==='pyramid')return [part(ppath([[0,-51],[-46,36],[0,27]]),deep),part(ppath([[0,-51],[0,27],[46,36]]),color),part(ppath([[-46,36],[0,27],[46,36]]),mid)];
 if(kind==='sphere')return [part(cpath(0,0,43),deep),part(cpath(-8,-8,35),color),part(epath(-18,-19,14,9),light)];
 if(kind==='cylinder')return [part(rpath(-39,-28,78,63),color),part(epath(0,34,39,15),deep),part(epath(0,-28,39,16),light),part(rpath(-38,-28,10,60),shade(color,.19))];
 if(kind==='cone')return [part(ppath([[0,-50],[-42,34],[42,34]]),color),part(ppath([[0,-50],[-42,34],[0,34]]),deep),part(epath(0,34,42,13),light)];
 return [];
}
function stampSvg(stamp,images){
 const transform='translate('+stamp.x+' '+stamp.y+') rotate('+stamp.angle+') scale('+stamp.scale+')';
 if(stamp.kind==='image'&&images?.[stamp.imageId])return '<image transform="'+transform+'" x="-45" y="-45" width="90" height="90" preserveAspectRatio="xMidYMid meet" href="'+safe(images[stamp.imageId])+'"/>';
 if(stamp.kind==='emoji'||stamp.kind==='text')return '<text transform="'+transform+'" text-anchor="middle" dominant-baseline="middle" font-family="system-ui,sans-serif" font-size="'+(stamp.kind==='emoji'?61:27)+'" font-weight="'+(stamp.kind==='text'?'700':'400')+'" fill="'+stamp.color+'">'+safe(stamp.text)+'</text>';
 return '<g transform="'+transform+'" stroke="#253348" stroke-width="2" stroke-linejoin="round">'+stampParts(stamp.kind,stamp.color).map(p=>'<path d="'+p.d+'" fill="'+p.fill+'"/>').join('')+'</g>';
}
function templateSvg(t){
 if(!t||!coloringPages[t.coloringPage])return '';
 return coloringPages[t.coloringPage].parts.map(p=>'<path d="'+p.d+'" fill="'+hex(t.templateColors[p.id],p.fill)+'" stroke="#344357" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>').join('');
}
function sketchMarkup(strokes,color,extras){
 const shapes=templateSvg(extras),objects=extras?.stamps?.map(stamp=>stampSvg(stamp,extras.drawingImages)).join('')||'';
 const colors=paintingGradients[extras?.backgroundGradient],gradient=Array.isArray(colors)?'<defs><linearGradient id="ck-art-gradient" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="600" y2="320"><stop offset="0%" stop-color="'+colors[0]+'"/><stop offset="100%" stop-color="'+colors[1]+'"/></linearGradient></defs>':'';
 return '<svg class="ck-art" viewBox="0 0 600 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Dibujo original del estudiante">'+gradient+'<rect width="600" height="320" fill="'+(gradient?'url(#ck-art-gradient)':hex(color,'#fffdf7'))+'"/>'+shapes+visibleStrokes(strokes,extras).map(strokeSvg).join('')+objects+'</svg>';
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
.ck-dibujos main{max-width:1300px;padding:clamp(8px,1.6vw,20px)}
.ck-dibujos header{padding:5px 8px 8px}
.ck-dibujos header h1{font-size:clamp(20px,3vw,34px);margin:3px 0}
.ck-dibujos .ck-drawing{max-width:none;margin:8px auto 14px;padding:clamp(5px,1vw,12px);border-radius:12px;background:#fff;box-shadow:0 5px 22px #102a4533}
.ck-dibujos .ck-art{width:100%;height:auto;max-height:none;aspect-ratio:600/320;border:0;border-radius:7px}
.ck-dibujos .ck-drawing figcaption{margin:5px 0 0}
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
.ck-libros.ck-reader main{max-width:1400px;padding:clamp(6px,1vw,12px) clamp(8px,1.6vw,22px) 10px}
.ck-libros.ck-reader .ck-pagination{min-height:35px;gap:10px;margin:0 0 6px;padding:0 1px}
.ck-libros.ck-reader .ck-pagination #ck-page{font-size:12px;font-weight:700;color:#f0dfbf}
.ck-libros.ck-reader .ck-pagination button{padding:5px 10px;font-size:12px}
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
.ck-libros.ck-reader .ck-leaf .ck-cover{gap:clamp(8px,2vh,16px)}
.ck-libros.ck-reader .ck-cover-subtitle{margin:0;font:italic clamp(14px,1.8vw,17px)/1.35 Georgia,serif;color:#71583c;text-align:center}
.ck-libros.ck-reader .ck-cover-byline{margin:0;font:13px/1.4 Georgia,serif;color:#71583c;text-align:center}
.ck-libros .ck-manuscript-leaf p{font:17px/1.8 Georgia,serif;text-indent:1.3em;text-align:justify;margin:.45em 0 1em;hyphens:auto;overflow-wrap:anywhere}
.ck-libros .ck-manuscript-leaf .ck-book-empty{text-align:center;text-indent:0;font-style:italic;color:#806d55}
.ck-libros .ck-inline-figure{margin:20px 0;min-height:56%;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:12px;text-align:center}
.ck-libros .ck-inline-figure img{display:block;max-width:100%;max-height:min(43vh,370px);height:auto;object-fit:contain;border-radius:5px;box-shadow:0 4px 17px #50341a33}
.ck-libros .ck-inline-figure figcaption{font:italic 13px Georgia,serif;color:#745b40}
.ck-libros.ck-layout-1 .ck-spread{--paper:#fff8e7}
.ck-libros.ck-layout-2 .ck-manuscript-leaf{border-top:5px double #b79567}
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
   sheet.style.setProperty('--ck-page-height',Math.floor(window.innerHeight-top-12)+'px');
  };
  fit();
  window.addEventListener('resize',fit);
  if(window.ResizeObserver){
   const resize=new ResizeObserver(fit);
   const header=document.querySelector('header');
   if(header)resize.observe(header);
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
 const artworks=sketchMarkup(strokes,t.backdrop,kind==='dibujos'?t:null);
 const book=['cuentos','libros','dramas','blogs'].includes(kind);
 const paged=book||kind==='animes';
 const pages=kind==='libros'?manuscriptPages(d.panels?.[0]?.text,t.bookImages):(d.panels||[]).map((p,i)=>{
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
 const author=kind==='blogs'||kind==='libros'?'<p class="ck-author">'+(kind==='libros'?'Escrito por ':'Publicado por ')+safe(t.author)+'</p>':'';
 const bookDetails=kind==='libros'?'<p class="ck-cover-subtitle">'+safe(d.subtitle)+'</p><p class="ck-cover-byline">Escrito por '+safe(t.author)+'</p>':'';
 const cover=(kind==='dibujos'?'':'<div class="ck-cover">'+bookDetails+'<div class="ck-cover-symbol">'+safe(d.art)+'</div><strong>'+safe(t.action)+'</strong></div>')+artwork;
 const reader=book?bookMarkup(safe(d.title),cover+partner,pages):cover+pagination+'<section class="ck-pages '+(paged?'ck-viewer-pages ':'')+cls+'">'+pages+'</section>';
 const header=kind==='libros'?'':'<header><small>CLUB KRUEKA · '+safe(modes[kind].label.toUpperCase())+'</small><h1>'+safe(d.title)+'</h1><p>'+safe(d.subtitle)+'</p>'+author+partner+'</header>';
 const html='<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+safe(d.title)+'</title><link rel="stylesheet" href="style.css"></head><body class="ck-public ck-'+kind+(book?' ck-reader':'')+' '+layoutClass+' '+bubbleClass+' '+effectClass+'"><main>'+header+reader+cta+'<footer>Una creación original del Club Krueka</footer></main><script src="script.js"></script></body></html>';
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
function paintSketch(canvas,strokes,draft,background,extras){
 const ctx=canvas.getContext('2d');if(!ctx)return;
 const colors=paintingGradients[extras?.backgroundGradient];
 ctx.clearRect(0,0,600,320);
 if(Array.isArray(colors)){
  const grad=ctx.createLinearGradient(0,0,600,320);grad.addColorStop(0,colors[0]);grad.addColorStop(1,colors[1]);ctx.fillStyle=grad;
 }else ctx.fillStyle=background;
 ctx.fillRect(0,0,600,320);
 if(extras&&coloringPages[extras.coloringPage]){
  for(const part of coloringPages[extras.coloringPage].parts){
   ctx.save();ctx.fillStyle=hex(extras.templateColors[part.id],part.fill);ctx.strokeStyle='#344357';ctx.lineWidth=3.6;ctx.lineJoin='round';
   const path=new Path2D(part.d);ctx.fill(path);ctx.stroke(path);ctx.restore();
  }
 }
 for(const s of visibleStrokes([...strokes,...(draft?[draft]:[])],extras)){
  if(!s?.points?.length)continue;
  const look=strokeLook(s),path=new Path2D(strokePath(s));
  const count=radialOptions.includes(s.radialSymmetry)?s.radialSymmetry:1;
  for(let i=0;i<count;i++){
   ctx.save();if(i){ctx.translate(300,160);ctx.rotate(i*2*Math.PI/count);ctx.translate(-300,-160);}
   for(const mirrored of (s.mirror?[false,true]:[false])){
    ctx.save();if(mirrored){ctx.translate(600,0);ctx.scale(-1,1);}
    ctx.strokeStyle=s.color;ctx.fillStyle=s.color;ctx.lineWidth=look.width;ctx.lineCap=look.pixel?'square':'round';ctx.lineJoin='round';ctx.globalAlpha=look.opacity;
    if(look.dash)ctx.setLineDash(look.dash.split(' ').map(Number));
    if(look.glow||look.soft){ctx.shadowColor=s.color;ctx.shadowBlur=look.soft?15:10;}
    if(s.type!=='pen'&&s.type!=='line'&&s.fill){ctx.globalAlpha=.65*unit(s.opacity);ctx.fill(path);ctx.globalAlpha=look.opacity;}
    ctx.stroke(path);ctx.restore();
   }
   ctx.restore();
  }
 }
 if(extras?.stamps)for(const o of extras.stamps){
  ctx.save();ctx.translate(o.x,o.y);ctx.rotate(o.angle*Math.PI/180);ctx.scale(o.scale,o.scale);
  if(o.kind==='image'&&extras.drawingImages[o.imageId]){
   const src=extras.drawingImages[o.imageId];let img=drawingImageCache.get(src);
   if(!img){img=new Image();drawingImageCache.set(src,img);img.onload=()=>paintSketch(canvas,strokes,draft,background,extras);img.onerror=()=>drawingImageCache.delete(src);img.src=src;}
   if(img.complete&&img.naturalWidth)ctx.drawImage(img,-45,-45,90,90);
  }else if(o.kind==='emoji'||o.kind==='text'){
   ctx.fillStyle=o.color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=(o.kind==='emoji'?'61px':'700 27px')+' system-ui,sans-serif';ctx.fillText(o.text,0,0,200);
  }else for(const part of stampParts(o.kind,o.color)){
   const path=new Path2D(part.d);ctx.fillStyle=part.fill;ctx.strokeStyle='#253348';ctx.lineWidth=2;ctx.lineJoin='round';ctx.fill(path);ctx.stroke(path);
  }
  ctx.restore();
 }
}
function renderDrawingLab(parent,s,t,current,onChange){
 const box=document.createElement('section');box.className='ct-drawing-box ct-art-lab';
 box.innerHTML='<div class="ct-lab-head"><div><strong>🎨 Mi estudio de arte</strong><small>Creá sobre un lienzo, coloreá láminas y combiná objetos.</small></div><button type="button" class="ct-lab-expand">⛶ Ampliar lienzo</button></div><div class="ct-lab-tabs" role="group" aria-label="Secciones del estudio"></div><div class="ct-lab-panel" data-draw-panel="pintar"></div><div class="ct-lab-panel" data-draw-panel="figuras" hidden></div><div class="ct-lab-panel" data-draw-panel="colorear" hidden></div><div class="ct-lab-panel" data-draw-panel="objetos" hidden></div><div class="ct-lab-panel" data-draw-panel="3d" hidden></div><div class="ct-lab-panel" data-draw-panel="capas" hidden></div><div class="ct-lab-palette" aria-label="Paleta de colores"></div><div class="ct-lab-actions"></div><canvas class="ct-canvas" width="600" height="320" aria-label="Lienzo: dibujá, coloreá o mové objetos" style="touch-action:none"></canvas><div class="ct-lab-selection" hidden></div><small class="ct-lab-hint" role="status"></small><small class="ct-lab-count" role="status"></small>';
 const canvas=box.querySelector('canvas'),tabs=box.querySelector('.ct-lab-tabs'),panels=[...box.querySelectorAll('[data-draw-panel]')];
 const hint=box.querySelector('.ct-lab-hint'),count=box.querySelector('.ct-lab-count'),selection=box.querySelector('.ct-lab-selection');
 let tool=t.tool,ink=t.ink,width=t.brush,style=t.brushStyle,opacity=t.opacity,smooth=t.smooth,mirror=t.mirror,radialSymmetry=t.radialSymmetry,activeLayer=t.activeLayer,guide=t.guide,shapeFill=t.shapeFill,draft=null,drag=null,selected=null,previewStamps=null;
 const undoStack=[],redoStack=[];
 const snapshot=d=>JSON.stringify({strokes:d.tools.strokes,stamps:d.tools.stamps,coloringPage:d.tools.coloringPage,templateColors:d.tools.templateColors,drawingImages:d.tools.drawingImages,layerVisibility:d.tools.layerVisibility,layerLocked:d.tools.layerLocked,backgroundGradient:d.tools.backgroundGradient});
 const useSnapshot=json=>{const saved=JSON.parse(json),latest=current();return onChange({...latest,tools:{...latest.tools,...saved}});};
 function save(patch,history=true){
  if(!s.cloudReady||s.busy){hint.textContent='Esperá a que termine de cargar el proyecto.';return false;}
  const before=current(),ok=onChange({...before,tools:{...before.tools,...patch}});
  if(ok&&history){undoStack.push(snapshot(before));if(undoStack.length>20)undoStack.shift();redoStack.length=0;}
  if(!ok)hint.textContent='No se pudo guardar el cambio. Probá quitar algunos elementos.';
  return ok;
 }
 function repaint(){
  const data=current().tools,extra=previewStamps?{...data,stamps:previewStamps}:data;
  paintSketch(canvas,data.strokes,draft,data.backdrop,extra);
  if(guide!=='none'){
   const ctx=canvas.getContext('2d');ctx.save();ctx.strokeStyle='#315478';ctx.lineWidth=1;ctx.globalAlpha=.27;ctx.beginPath();
   for(let x=60;x<600;x+=60){ctx.moveTo(x,0);ctx.lineTo(x,320);}
   for(let y=40;y<320;y+=40){ctx.moveTo(0,y);ctx.lineTo(600,y);}
   if(guide==='perspective')for(const x of [0,150,300,450,600]){ctx.moveTo(x,320);ctx.lineTo(300,85);}
   ctx.stroke();ctx.restore();
  }
  count.textContent=data.strokes.length+'/55 trazos · '+data.stamps.length+'/30 objetos · '+Object.keys(data.drawingImages).length+'/6 imágenes · '+coloringPages[data.coloringPage].label;
  box.querySelectorAll('[data-color]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.color===ink)));
  box.querySelectorAll('[data-layer]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.layer===activeLayer)));
  box.querySelectorAll('[data-visible-layer]').forEach(b=>{const shown=data.layerVisibility[b.dataset.visibleLayer]!==false;b.textContent=shown?'👁️ Visible':'🚫 Oculta';b.setAttribute('aria-pressed',String(shown));});
  box.querySelectorAll('[data-lock-layer]').forEach(b=>{const locked=data.layerLocked[b.dataset.lockLayer]===true;b.textContent=locked?'🔒 Bloqueada':'🔓 Editable';b.setAttribute('aria-pressed',String(locked));});
  const object=data.stamps.find(x=>x.id===selected);
  selection.hidden=!object;
  if(object){
   selection.querySelector('[data-object-name]').textContent=object.kind==='text'?'Texto: '+object.text:object.kind==='emoji'?'Objeto: '+object.text:object.kind==='image'?'Imagen propia':'Objeto 3D: '+object.kind;
   selection.querySelector('[data-object-size]').value=object.scale;
   selection.querySelector('[data-object-angle]').value=object.angle;
  }
 }
 function chooseTool(next){
  tool=next;save({tool},false);
  box.querySelectorAll('[data-draw-tool]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.drawTool===tool)));
  hint.textContent=tool==='fill'?'Tocá una parte del dibujo para darle el color elegido.':tool==='move'?'Tocá un objeto y arrastralo; abajo podés cambiar tamaño y giro.':tool==='erase'?'Tocá un trazo u objeto para borrarlo.':tool==='picker'?'Tocá un color del dibujo para usarlo con tu pincel.':'Dibujá directamente sobre el lienzo con el mouse o el dedo.';
 }
 function chooseTab(name){
  panels.forEach(p=>{p.hidden=p.dataset.drawPanel!==name});
  tabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tab===name)));
 }
 for(const [id,label] of [['pintar','🖌️ Pintar'],['figuras','◇ Figuras'],['colorear','🖍️ Colorear'],['objetos','🧸 Objetos'],['3d','🧊 3D'],['capas','🗂️ Capas']]){
  const b=document.createElement('button');b.type='button';b.dataset.tab=id;b.textContent=label;b.onclick=()=>{chooseTab(id);if(id==='colorear')chooseTool('fill');if(id==='objetos'||id==='3d')chooseTool('move');if(id==='pintar')chooseTool('pen');if(id==='figuras')chooseTool('rectangle');};tabs.append(b);
 }
 function toolButton(label,value,host){
  const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.drawTool=value;b.setAttribute('aria-pressed',String(tool===value));b.onclick=()=>chooseTool(value);host.append(b);return b;
 }
 const brushes=box.querySelector('[data-draw-panel="pintar"]');
 const brushBar=document.createElement('div');brushBar.className='ct-lab-choices';
 for(const [value,label] of [['pen','✏️ Lápiz'],['marker','🖊️ Marcador'],['watercolor','💧 Acuarela'],['neon','✨ Neón'],['dotted','• Punteado'],['chalk','🪨 Tiza'],['airbrush','☁️ Aerógrafo'],['pixel','◼ Píxel']]){
  const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.brush=value;
  b.onclick=()=>{style=value;save({brushStyle:style},false);chooseTool('pen');box.querySelectorAll('[data-brush]').forEach(v=>v.setAttribute('aria-pressed',String(v.dataset.brush===value)));};brushBar.append(b);
 }
 brushes.append(brushBar);
 const thickness=document.createElement('label');thickness.className='ct-lab-slider';thickness.textContent='Grosor del pincel';
 const slider=document.createElement('input');slider.type='range';slider.min='1';slider.max='28';slider.value=width;slider.setAttribute('aria-label','Grosor');slider.onchange=()=>{width=Number(slider.value);save({brush:width},false)};thickness.append(slider);brushes.append(thickness);
 const opacityLabel=document.createElement('label');opacityLabel.className='ct-lab-slider';opacityLabel.textContent='Opacidad del pincel';
 const opacityInput=document.createElement('input');opacityInput.type='range';opacityInput.min='10';opacityInput.max='100';opacityInput.step='5';opacityInput.value=Math.round(opacity*100);opacityInput.setAttribute('aria-label','Opacidad del pincel');
 opacityInput.onchange=()=>{opacity=Number(opacityInput.value)/100;save({opacity},false);};opacityLabel.append(opacityInput);brushes.append(opacityLabel);
 const smoothLabel=document.createElement('label');smoothLabel.className='ct-lab-slider';smoothLabel.textContent='Estabilizador del trazo';
 const smoothInput=document.createElement('input');smoothInput.type='range';smoothInput.min='0';smoothInput.max='100';smoothInput.step='20';smoothInput.value=smooth;smoothInput.setAttribute('aria-label','Estabilizador del trazo');
 smoothInput.onchange=()=>{smooth=Number(smoothInput.value);save({smooth},false);};smoothLabel.append(smoothInput);brushes.append(smoothLabel);
 const gradientLabel=document.createElement('label');gradientLabel.className='ct-lab-slider';gradientLabel.textContent='Fondo degradado (sin tapar tus dibujos)';
 const gradientSelect=document.createElement('select');gradientSelect.setAttribute('aria-label','Fondo degradado');
 for(const [id,label] of [['none','Color liso'],['cielo','☁️ Cielo'],['atardecer','🌅 Atardecer'],['oceano','🌊 Océano'],['bosque','🌿 Bosque'],['noche','🌙 Noche']])gradientSelect.add(new Option(label,id));
 gradientSelect.value=t.backgroundGradient;gradientSelect.onchange=()=>{if(save({backgroundGradient:gradientSelect.value}))repaint();};gradientLabel.append(gradientSelect);brushes.append(gradientLabel);
 const shapes=box.querySelector('[data-draw-panel="figuras"]'),shapeBar=document.createElement('div');shapeBar.className='ct-lab-choices';
 for(const [id,label] of [['line','╱ Línea'],['rectangle','▭ Rectángulo'],['circle','◯ Óvalo'],['triangle','△ Triángulo'],['star','☆ Estrella'],['heart','♡ Corazón']])toolButton(label,id,shapeBar);
 shapes.append(shapeBar);
 const fillLabel=document.createElement('label');fillLabel.className='ct-lab-checkbox';fillLabel.textContent='Rellenar las figuras';const fillCheck=document.createElement('input');fillCheck.type='checkbox';fillCheck.checked=shapeFill;fillCheck.onchange=()=>{shapeFill=fillCheck.checked;save({shapeFill},false)};fillLabel.prepend(fillCheck);shapes.append(fillLabel);
 const coloring=box.querySelector('[data-draw-panel="colorear"]');
 const intro=document.createElement('p');intro.textContent='Elegí un dibujo. Después seleccioná un color y tocá cada zona para pintarla.';coloring.append(intro);
 const templates=document.createElement('div');templates.className='ct-lab-templates';
 for(const [id,item] of Object.entries(coloringPages)){
  const b=document.createElement('button');b.type='button';b.dataset.template=id;b.innerHTML='<span aria-hidden="true">'+item.icon+'</span><small>'+item.label+'</small>';
  b.onclick=()=>{
   const data=current().tools;
   if(data.coloringPage===id)return;
   if(Object.keys(data.templateColors).length&&!confirm('¿Cambiar la lámina para colorear? Tus trazos y objetos quedan guardados, pero se reinician los colores de la lámina anterior.'))return;
   if(save({coloringPage:id,templateColors:{}})){templates.querySelectorAll('[data-template]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.template===id)));repaint();}
   chooseTool('fill');
  };
  b.setAttribute('aria-pressed',String(t.coloringPage===id));templates.append(b);
 }
 coloring.append(templates);
 toolButton('🪣 Pintar zonas','fill',coloring);
 const objects=box.querySelector('[data-draw-panel="objetos"]'),things=box.querySelector('[data-draw-panel="3d"]');
 function addObject(kind,text,options={}){
  const data=current().tools;
  if(data.stamps.length>=30){hint.textContent='Llegaste a 30 objetos. Quitá uno para agregar otro.';return;}
  const id='obj'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
  const object={id,kind,text,imageId:options.imageId||'',color:ink,x:Math.min(560,295+(data.stamps.length%5)*15),y:Math.min(280,140+(data.stamps.length%4)*14),scale:1,angle:0};
  if(save({stamps:[...data.stamps,object],...(options.drawingImages?{drawingImages:options.drawingImages}:{})})){selected=id;chooseTool('move');repaint();hint.textContent='Objeto agregado. Arrastralo para ubicarlo donde quieras.';}
 }
 for(const [label,emojis] of Object.entries(stickerGroups)){
  const group=document.createElement('div');group.className='ct-lab-object-group';
  const caption=document.createElement('strong');caption.textContent=label;group.append(caption);
  const wrap=document.createElement('div');wrap.className='ct-lab-stickers';
  for(const emoji of emojis){const b=document.createElement('button');b.type='button';b.textContent=emoji;b.title='Agregar '+emoji;b.setAttribute('aria-label','Agregar '+emoji);b.onclick=()=>addObject('emoji',emoji);wrap.append(b)}
  group.append(wrap);objects.append(group);
 }
 const textRow=document.createElement('div');textRow.className='ct-lab-text';const textInput=document.createElement('input');textInput.placeholder='Escribí un nombre, frase o símbolo…';textInput.maxLength=28;textInput.setAttribute('aria-label','Texto para colocar en el dibujo');
 const addText=document.createElement('button');addText.type='button';addText.textContent='＋ Agregar texto';addText.onclick=()=>{if(textInput.value.trim())addObject('text',textInput.value.trim());textInput.value='';};textRow.append(textInput,addText);objects.append(textRow);
 const imageRow=document.createElement('div');imageRow.className='ct-lab-text';
 const pick=document.createElement('button');pick.type='button';pick.textContent='🖼️ Agregar mi imagen';
 const upload=document.createElement('input');upload.type='file';upload.accept='image/png,image/jpeg,image/webp';upload.hidden=true;
 pick.onclick=()=>upload.click();
 upload.onchange=async()=>{
  const file=upload.files?.[0];if(!file)return;
  const project=s.projectId;pick.disabled=true;hint.textContent='Preparando tu imagen…';
  try{
   if(!window.ClubMedios?.compact)throw Error('El editor de imágenes todavía no está disponible.');
   const image=await ClubMedios.compact(file);
   if(s.projectId!==project||!s.cloudReady||s.busy||!box.isConnected)throw Error('La obra cambió mientras se preparaba la imagen.');
   const data=current().tools;
   if(Object.keys(data.drawingImages).length>=6)throw Error('Ya tenés seis imágenes propias en el dibujo.');
   const id='img'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
   addObject('image','Imagen propia',{imageId:id,drawingImages:{...data.drawingImages,[id]:image}});
  }catch(e){hint.textContent='⚠ '+e.message;}
  finally{pick.disabled=false;upload.value='';}
 };
 imageRow.append(pick,upload);objects.append(imageRow);
 const threeHint=document.createElement('p');threeHint.textContent='Objetos con volumen y sombras, para armar escenas con apariencia 3D. Son figuras editables dentro del dibujo.';things.append(threeHint);
 const models=document.createElement('div');models.className='ct-lab-models';
 for(const [id,label] of [['cube','🧊 Cubo'],['sphere','⚪ Esfera'],['cylinder','🥫 Cilindro'],['pyramid','🔺 Pirámide'],['cone','🍦 Cono']]){
  const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=()=>addObject(id,'');models.append(b);
 }
 things.append(models);
 const layerPanel=box.querySelector('[data-draw-panel="capas"]');
 const layerHint=document.createElement('p');layerHint.textContent='Separá los trazos en Dibujo y Detalles. Podés ocultar una capa sin borrar su contenido. La lámina y los objetos se conservan.';layerPanel.append(layerHint);
 const layerRows=document.createElement('div');layerRows.className='ct-layer-rows';
 for(const [id,label] of [['details','✨ Detalles (arriba)'],['base','🎨 Dibujo (abajo)']]){
  const row=document.createElement('div');row.className='ct-layer-row';
  const select=document.createElement('button');select.type='button';select.dataset.layer=id;select.textContent=label;
  select.onclick=()=>{activeLayer=id;const data=current().tools;save({activeLayer:id,layerVisibility:{...data.layerVisibility,[id]:true}},false);repaint();};
  const toggle=document.createElement('button');toggle.type='button';toggle.dataset.visibleLayer=id;toggle.setAttribute('aria-label','Mostrar u ocultar '+label);
  toggle.onclick=()=>{const data=current().tools;save({layerVisibility:{...data.layerVisibility,[id]:data.layerVisibility[id]===false}},true);repaint();};
  const lock=document.createElement('button');lock.type='button';lock.dataset.lockLayer=id;lock.setAttribute('aria-label','Bloquear o desbloquear '+label);
  lock.onclick=()=>{const data=current().tools;save({layerLocked:{...data.layerLocked,[id]:!data.layerLocked[id]}},true);repaint();};
  row.append(select,toggle,lock);layerRows.append(row);
 }
 layerPanel.append(layerRows);
 const mirrorLabel=document.createElement('label');mirrorLabel.className='ct-lab-checkbox';mirrorLabel.textContent='🪞 Pintura simétrica (espejo horizontal)';
 const mirrorCheck=document.createElement('input');mirrorCheck.type='checkbox';mirrorCheck.checked=mirror;
 mirrorCheck.onchange=()=>{mirror=mirrorCheck.checked;save({mirror},false);};mirrorLabel.prepend(mirrorCheck);layerPanel.append(mirrorLabel);
 const radialLabel=document.createElement('label');radialLabel.className='ct-lab-slider';radialLabel.textContent='Mandalas · pinceles repetidos alrededor del centro';
 const radialSelect=document.createElement('select');radialSelect.setAttribute('aria-label','Simetría radial para mandalas');
 for(const [id,label] of [[1,'Sin mandala'],[2,'2 brazos'],[4,'4 brazos'],[6,'6 brazos'],[8,'8 brazos']])radialSelect.add(new Option(label,id));
 radialSelect.value=String(radialSymmetry);radialSelect.onchange=()=>{radialSymmetry=Number(radialSelect.value);save({radialSymmetry},false);};radialLabel.append(radialSelect);layerPanel.append(radialLabel);
 const guideLabel=document.createElement('label');guideLabel.className='ct-lab-slider';guideLabel.textContent='Guías para dibujar (no aparecen en la obra publicada)';
 const guideSelect=document.createElement('select');guideSelect.setAttribute('aria-label','Guías del lienzo');
 for(const [id,label] of [['none','Sin guías'],['grid','Cuadrícula'],['perspective','Perspectiva']])guideSelect.add(new Option(label,id));
 guideSelect.value=guide;guideSelect.onchange=()=>{guide=guideSelect.value;save({guide},false);repaint();};guideLabel.append(guideSelect);layerPanel.append(guideLabel);
 const palette=box.querySelector('.ct-lab-palette');
 for(const color of ['#142f4f','#ffffff','#e94356','#f58035','#ffe166','#62b55a','#18b8a0','#38a8ef','#5055c8','#a35cd6','#f8a9d7','#7e503c','#b7becb','#f5dbb2','#3a7846','#141414','#efaa3f','#75d2fc','#beef80','#ee82ad']){
  const b=document.createElement('button');b.type='button';b.dataset.color=color;b.style.background=color;b.title='Color '+color;b.setAttribute('aria-label','Elegir color '+color);b.onclick=()=>{ink=color;save({ink},false);repaint();};palette.append(b);
 }
 const custom=document.createElement('input');custom.type='color';custom.value=ink;custom.title='Elegir otro color';custom.setAttribute('aria-label','Elegir otro color');custom.onchange=()=>{ink=custom.value;save({ink},false);repaint();};palette.append(custom);
 const actions=box.querySelector('.ct-lab-actions');
 toolButton('↗ Mover objetos','move',actions);toolButton('🎯 Cuentagotas','picker',actions);toolButton('🧽 Borrar','erase',actions);
 const undo=document.createElement('button');undo.type='button';undo.textContent='↶ Deshacer';undo.onclick=()=>{if(!undoStack.length)return;const now=snapshot(current()),before=undoStack.pop();if(useSnapshot(before)){redoStack.push(now);selected=null;repaint();}else undoStack.push(before);};actions.append(undo);
 const redo=document.createElement('button');redo.type='button';redo.textContent='↷ Rehacer';redo.onclick=()=>{if(!redoStack.length)return;const now=snapshot(current()),after=redoStack.pop();if(useSnapshot(after)){undoStack.push(now);repaint();}else redoStack.push(after);};actions.append(redo);
 const clear=document.createElement('button');clear.type='button';clear.textContent='🧹 Limpiar todo';clear.onclick=()=>{if(!confirm('¿Borrar todos los trazos, objetos y colores de este dibujo?'))return;if(save({strokes:[],stamps:[],templateColors:{},drawingImages:{},coloringPage:'blanco'})){selected=null;templates.querySelectorAll('[data-template]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.template==='blanco')));repaint();}};actions.append(clear);
 const selectedDiv=box.querySelector('.ct-lab-selection');
 selectedDiv.innerHTML='<strong data-object-name></strong><label>Tamaño <input data-object-size type="range" min="0.35" max="2.4" step="0.05" aria-label="Tamaño del objeto"></label><label>Giro <input data-object-angle type="range" min="-180" max="180" step="15" aria-label="Giro del objeto"></label><button type="button" data-object-front>Traer adelante</button><button type="button" data-object-delete>Quitar objeto</button>';
 const editSelected=field=>{const data=current().tools,stamps=data.stamps.map(o=>o.id===selected?{...o,[field]:Number(selectedDiv.querySelector('[data-object-'+(field==='scale'?'size':'angle')+']').value)}:o);if(save({stamps}))repaint();};
 selectedDiv.querySelector('[data-object-size]').onchange=()=>editSelected('scale');selectedDiv.querySelector('[data-object-angle]').onchange=()=>editSelected('angle');
 selectedDiv.querySelector('[data-object-front]').onclick=()=>{const data=current().tools,object=data.stamps.find(o=>o.id===selected);if(object&&save({stamps:[...data.stamps.filter(o=>o.id!==selected),object]}))repaint();};
 selectedDiv.querySelector('[data-object-delete]').onclick=()=>{const data=current().tools,stamps=data.stamps.filter(o=>o.id!==selected),used=new Set(stamps.map(o=>o.imageId));const drawingImages=Object.fromEntries(Object.entries(data.drawingImages).filter(([id])=>used.has(id)));if(save({stamps,drawingImages})){selected=null;repaint();}};
 const expand=box.querySelector('.ct-lab-expand');expand.onclick=()=>{const open=box.classList.toggle('ct-canvas-expanded');expand.textContent=open?'✕ Volver al taller':'⛶ Ampliar lienzo';};
 const rectCoord=e=>{const rect=canvas.getBoundingClientRect();return [Math.max(0,Math.min(600,Math.round((e.clientX-rect.left)*600/rect.width))),Math.max(0,Math.min(320,Math.round((e.clientY-rect.top)*320/rect.height)))];};
 const objectAt=(data,x,y)=>[...data.stamps].reverse().find(o=>Math.hypot(o.x-x,o.y-y)<(o.kind==='text'?75:48)*o.scale);
 const hitStroke=(ctx,stroke,x,y)=>{
  const path=new Path2D(strokePath(stroke)),count=radialOptions.includes(stroke.radialSymmetry)?stroke.radialSymmetry:1;
  ctx.lineWidth=Math.max(17,strokeLook(stroke).width+16);
  for(let i=0;i<count;i++){
   const angle=-i*2*Math.PI/count,dx=x-300,dy=y-160;
   const testX=300+dx*Math.cos(angle)-dy*Math.sin(angle),testY=160+dx*Math.sin(angle)+dy*Math.cos(angle);
   if(ctx.isPointInStroke(path,testX,testY)||(stroke.mirror&&ctx.isPointInStroke(path,600-testX,testY)))return true;
  }
  return false;
 };
 canvas.onpointerdown=e=>{
  if(!s.cloudReady||s.busy)return;e.preventDefault();const [x,y]=rectCoord(e),data=current().tools;
  if(tool==='picker'){
   try{
    const rgb=canvas.getContext('2d').getImageData(x,y,1,1).data;
    ink='#'+[rgb[0],rgb[1],rgb[2]].map(v=>v.toString(16).padStart(2,'0')).join('');custom.value=ink;
    if(save({ink},false)){chooseTool('pen');repaint();hint.textContent='✓ Color seleccionado. Ya podés pintar con él.';}
   }catch(_e){hint.textContent='No se pudo tomar ese color. Elegí uno de la paleta.';}
   return;
  }
  if(tool==='fill'){
   const ctx=canvas.getContext('2d'),part=[...coloringPages[data.coloringPage].parts].reverse().find(p=>ctx.isPointInPath(new Path2D(p.d),x,y));
   if(part&&save({templateColors:{...data.templateColors,[part.id]:ink}}))repaint();
   else if(!part)hint.textContent='Tocá dentro de una figura de la lámina para colorearla.';
   return;
  }
  if(tool==='move'){
   const o=objectAt(data,x,y);selected=o?.id||null;repaint();
   if(o){canvas.setPointerCapture(e.pointerId);drag={id:o.id,dx:x-o.x,dy:y-o.y};}
   return;
  }
  if(tool==='erase'){
   const o=objectAt(data,x,y);
   if(o){const stamps=data.stamps.filter(p=>p.id!==o.id),used=new Set(stamps.map(p=>p.imageId));const drawingImages=Object.fromEntries(Object.entries(data.drawingImages).filter(([id])=>used.has(id)));if(save({stamps,drawingImages})){selected=null;repaint();}return;}
   const ctx=canvas.getContext('2d'),index=data.strokes.findLastIndex(stroke=>{const layer=stroke.layer==='details'?'details':'base';return data.layerVisibility[layer]!==false&&!data.layerLocked[layer]&&hitStroke(ctx,stroke,x,y)});
   if(index>=0&&save({strokes:data.strokes.filter((_,i)=>i!==index)}))repaint();return;
  }
  if(data.layerVisibility[activeLayer]===false){hint.textContent='Mostrá la capa seleccionada antes de dibujar.';return;}
  if(data.layerLocked[activeLayer]){hint.textContent='La capa está bloqueada. Desbloqueala en Capas para seguir pintando.';return;}
  canvas.setPointerCapture(e.pointerId);draft={type:tool==='pen'?'pen':tool,color:ink,width,opacity,smooth,mirror,radialSymmetry,layer:activeLayer,style:tool==='pen'?style:'pen',fill:shapeFill,points:[[x,y]]};repaint();
 };
 canvas.onpointermove=e=>{
  if(drag){const [x,y]=rectCoord(e),o=current().tools.stamps.find(v=>v.id===drag.id);if(!o)return;previewStamps=current().tools.stamps.map(item=>item.id===drag.id?{...item,x:Math.round(Math.max(0,Math.min(600,x-drag.dx))),y:Math.round(Math.max(0,Math.min(320,y-drag.dy)))}:item);repaint();return;}
  if(!draft)return;const point=rectCoord(e),points=draft.points;
  if(draft.type==='pen'){
   const last=points[points.length-1];if(Math.hypot(point[0]-last[0],point[1]-last[1])<3+smooth/16)return;
   if(points.length>=100)draft.points=points.filter((_,i)=>i%2===0||i===points.length-1);
   draft.points.push(point);
  }else draft.points=[points[0],point];repaint();
 };
 const finish=()=>{
  if(drag){const data=current().tools,changed=previewStamps;drag=null;previewStamps=null;if(changed&&save({stamps:changed}))repaint();else repaint();return;}
  if(draft){const data=current().tools,stroke=draft;draft=null;if(save({strokes:[...data.strokes,stroke].slice(-55)}))repaint();else repaint();}
 };
 canvas.onpointerup=finish;canvas.onpointercancel=()=>{draft=null;drag=null;previewStamps=null;repaint()};
 parent.append(box);chooseTab(['fill'].includes(tool)?'colorear':drawShapes.includes(tool)?'figuras':tool==='move'?'objetos':'pintar');
 box.querySelectorAll('[data-brush]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.brush===style)));
 chooseTool(tool);repaint();
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
 if(kind==='blogs'||kind==='libros')card.append(field('Firma artística (no nombre real)',t.author,v=>change('author',v),{maxlength:36}));
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
 if(kind!=='dibujos')card.append(field('Frase destacada',t.action,v=>change('action',v),{maxlength:90}));
 parent.append(card);
 const guide=document.createElement('div');guide.className='ct-guide';guide.textContent=kind==='libros'?'Escribí libremente en un solo espacio. Podés agregar hasta ocho ilustraciones donde quieras y hojear tu libro a la derecha.':kind==='dramas'?'Cada parte es un acto. Escribí los diálogos y una acotación escénica.':kind==='animes'?'Cada parte es una escena: personaje, fondo, diálogo y movimiento.':kind==='historietas'?'Cada parte es una viñeta: elegí el personaje y escribí su diálogo.':kind==='dibujos'?'Creá desde cero o elegí una lámina para colorear. Combiná pinceles, formas, objetos, textos y figuras con volumen. Todo se guarda en tu obra.':kind==='flyers'?'Combiná título, colores, imagen y mensaje.':kind==='blogs'?'Usá títulos claros y destacá ideas en negrita.': 'Contá tu historia por capítulos y decorá la portada.';
 parent.append(guide);
 if(kind==='dibujos'){
  renderDrawingLab(parent,s,t,current,onChange);
  const background=card.querySelector('input[type="color"]');
  background?.addEventListener('input',()=>{const canvas=work.querySelector('.ct-art-lab canvas'),data=current().tools;if(canvas)paintSketch(canvas,data.strokes,null,data.backdrop,data);});
  return;
 }
 if(['blogs','cuentos','libros','historietas','dramas','animes','flyers'].includes(kind)){
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
