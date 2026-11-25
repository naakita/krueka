/* Regresión del taller Dibujos: pinceles, láminas y objetos vectoriales sin descargas. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const ctx={window:{},console};vm.createContext(ctx);vm.runInContext(read('js/club-studio-talleres.js'),ctx);
const {normalize,enhance}=ctx.window.ClubTalleres;

test('las láminas se colorean por partes y conservan la pintura al guardar',()=>{
 const raw={kind:'dibujos',title:'Mi casa de colores',tools:{coloringPage:'casa',templateColors:{pared:'#f2a3bd',techo:'#4a88c1'},strokes:[]}};
 const files=enhance(raw,{}),html=files['index.html'],data=JSON.parse(files['obra.json']);
 assert.match(html,/class="ck-art"/);
 assert.match(html,/fill="#f2a3bd" stroke="#344357"/);
 assert.match(html,/fill="#4a88c1" stroke="#344357"/);
 assert.match(html,/class="ck-drawing"/);
 assert.doesNotMatch(html,/class="ck-cover"/,'la ilustración tiene prioridad sobre los adornos');
 assert.equal(data.tools.coloringPage,'casa');
 assert.equal(data.tools.templateColors.pared,'#f2a3bd');
 assert.match(files['style.css'],/\.ck-dibujos main\{max-width:1300px/);
});

test('pinceles, formas con relleno y objetos 3D se representan sin perder la edición',()=>{
 const raw={kind:'dibujos',title:'Mundo imaginario',tools:{
  brushStyle:'neon',strokes:[
   {type:'pen',style:'dotted',color:'#ff9900',width:7,points:[[5,5],[100,80]]},
   {type:'star',color:'#5577aa',width:2,fill:true,points:[[120,20],[240,130]]},
   {type:'heart',color:'#aabbcc',width:3,fill:true,points:[[300,20],[400,130]]}
  ],stamps:[
   {id:'objabcd',kind:'cube',x:180,y:200,scale:1.3,color:'#3366ff',angle:30},
   {id:'objefgh',kind:'sphere',x:300,y:200,scale:.8,color:'#fe9900',angle:0},
   {id:'objijkl',kind:'emoji',text:'🐱',x:470,y:200,scale:1,color:'#ffffff'},
   {id:'objmnop',kind:'text',text:'¡Mi obra!',x:470,y:60,scale:1,color:'#123456'}
  ]}};
 const files=enhance(raw,{}),html=files['index.html'],saved=JSON.parse(files['obra.json']);
 assert.match(html,/stroke-dasharray="1 15\.400000000000002"|stroke-dasharray="1 15\.4"/);
 assert.match(html,/fill="#5577aa"/);
 assert.match(html,/rotate\(30\) scale\(1\.3\)/);
 assert.match(html,/>🐱<\/text>/);
 assert.match(html,/>¡Mi obra!<\/text>/);
 assert.equal(saved.tools.stamps.length,4);
 assert.equal(saved.tools.strokes.length,3);
 assert.ok(files['index.html'].length<120000,'el HTML sigue bajo el límite del Studio');
});

test('los datos maliciosos no introducen SVG ejecutable ni tamaños fuera de control',()=>{
 const raw={kind:'dibujos',tools:{coloringPage:'hack',templateColors:{pared:'url(javascript:alert(1))'},stamps:[
  {id:'objabcd',kind:'text',text:'<script>alert(1)</script>',x:999999,y:-999999,scale:900,color:'red',angle:500},
  {id:'objefgh',kind:'<img>',text:'🐻',x:180,y:100,scale:1,color:'#123456'}
 ],strokes:[{type:'<script>',color:'evil',width:999,points:[[-99,99999]]}]}};
 const normalized=normalize(raw),data=normalized.tools,html=enhance(raw,{})['index.html'];
 assert.equal(data.coloringPage,'blanco');
 assert.equal(Object.keys(data.templateColors).length,0);
 assert.equal(data.stamps[0].x,600);assert.equal(data.stamps[0].y,0);
 assert.equal(data.stamps[0].scale,2.4);assert.equal(data.stamps[0].angle,180);
 assert.equal(data.stamps[1].kind,'emoji');
 assert.equal(data.strokes[0].type,'pen');
 assert.equal(data.strokes[0].color,'#193959');
 assert.match(html,/&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
 assert.doesNotMatch(html,/<script>alert\(1\)<\/script>/);
 assert.doesNotMatch(html,/javascript:alert|url\(javascript/);
});

test('las imágenes propias se integran como objetos seguros y editables',()=>{
 const src='data:image/webp;base64,UklGRgAAAAA=';
 const raw={kind:'dibujos',tools:{drawingImages:{imgabcdef12:src,imgevildoce:'https://ejemplo.test/imagen.svg'},stamps:[
  {id:'objabcdef',kind:'image',imageId:'imgabcdef12',x:230,y:120,scale:1.2,angle:15}
 ]}};
 const files=enhance(raw,{}),html=files['index.html'],tools=JSON.parse(files['obra.json']).tools;
 assert.equal(Object.keys(tools.drawingImages).length,1);
 assert.equal(tools.stamps[0].imageId,'imgabcdef12');
 assert.match(html,/href="data:image\/webp;base64,UklGRgAAAAA="/);
 assert.match(html,/rotate\(15\) scale\(1\.2\)/);
 assert.doesNotMatch(html,/https:\/\/ejemplo\.test/);
});

test('las capas, el espejo, la transparencia y los pinceles nuevos se conservan en la obra publicada',()=>{
 const base={kind:'dibujos',title:'Un mundo de colores',tools:{
  brushStyle:'chalk',activeLayer:'details',mirror:true,smooth:60,opacity:.45,guide:'perspective',
  layerVisibility:{base:true,details:true},
  strokes:[
   {type:'pen',style:'chalk',layer:'base',color:'#124578',width:8,opacity:.5,points:[[20,25],[45,40],[90,35]]},
   {type:'pen',style:'airbrush',layer:'details',mirror:true,color:'#ff5500',width:12,opacity:.4,smooth:80,points:[[50,70],[70,80],[90,120]]},
   {type:'pen',style:'pixel',layer:'details',color:'#3344bb',width:8,points:[[150,20],[170,25]]}
  ]
 }};
 const saved=normalize(base).tools,html=enhance(base,{})['index.html'];
 assert.equal(saved.activeLayer,'details');assert.equal(saved.guide,'perspective');
 assert.equal(saved.opacity,.45);assert.equal(saved.smooth,60);assert.equal(saved.mirror,true);
 assert.equal(saved.strokes[1].layer,'details');assert.equal(saved.strokes[1].smooth,80);
 assert.match(html,/translate\(600 0\) scale\(-1 1\)/,'el trazo simétrico aparece en ambos lados');
 assert.match(html,/stroke-dasharray="5 3"/,'la tiza está disponible');
 assert.match(html,/filter:blur\(2px\)/,'el aerógrafo aparece en la publicación');
 assert.match(html,/shape-rendering="crispEdges"/,'el pincel de píxeles se conserva');
 assert.match(html,/Q70 80/,'el estabilizador suaviza el trazo');
 assert.doesNotMatch(html,/Sin guías|Perspectiva/,'las guías no se imprimen');
 const hidden=enhance({...base,tools:{...base.tools,layerVisibility:{base:true,details:false}}},{})['index.html'];
 assert.match(hidden,/stroke="#124578"/);
 assert.doesNotMatch(hidden,/stroke="#ff5500"|stroke="#3344bb"/,'la capa oculta no se publica');
 const restored=enhance({...base,tools:{...base.tools,layerVisibility:{base:true,details:true}}},{})['index.html'];
 assert.match(restored,/stroke="#ff5500"/,'los trazos reaparecen al mostrar la capa');
});

test('datos incorrectos de capas y transparencia se limitan sin afectar dibujos antiguos',()=>{
 const old=normalize({kind:'dibujos',tools:{strokes:[{type:'pen',points:[[1,2],[3,4]]}]}}).tools;
 assert.equal(old.strokes[0].opacity,1);assert.equal(old.strokes[0].layer,'base');
 assert.equal(old.layerVisibility.base,true);assert.equal(old.layerVisibility.details,true);
 const invalid=normalize({kind:'dibujos',tools:{opacity:-1,guide:'javascript',activeLayer:'invisible',strokes:[{type:'pen',style:'unsafe',opacity:99,layer:'unknown',points:[[4,5]]}]}}).tools;
 assert.equal(invalid.opacity,.1);assert.equal(invalid.guide,'none');assert.equal(invalid.activeLayer,'base');
 assert.equal(invalid.strokes[0].opacity,1);assert.equal(invalid.strokes[0].layer,'base');
});

test('Krita: los mandalas y fondos degradados se ven también en la obra publicada',()=>{
 const raw={kind:'dibujos',title:'Mi mandala',tools:{backgroundGradient:'atardecer',radialSymmetry:6,
  strokes:[{type:'pen',color:'#167da2',radialSymmetry:4,layer:'details',width:5,points:[[390,170],[420,185],[440,200]]}]}};
 const html=enhance(raw,{})['index.html'],data=normalize(raw).tools;
 assert.equal(data.radialSymmetry,6);
 assert.equal(data.strokes[0].radialSymmetry,4);
 assert.equal(data.backgroundGradient,'atardecer');
 assert.match(html,/linearGradient id="ck-art-gradient"/);
 assert.match(html,/stop-color="#ffe9b0"/);
 assert.match(html,/stop-color="#e879a8"/);
 assert.match(html,/rotate\(90 300 160\)/);
 assert.match(html,/rotate\(180 300 160\)/);
 assert.match(html,/rotate\(270 300 160\)/);
 assert.equal((html.match(/stroke="#167da2"/g)||[]).length,4,'cada trazo del mandala se repite cuatro veces');
 const old=enhance({kind:'dibujos',tools:{strokes:[{type:'pen',color:'#112233',width:3,points:[[1,1],[5,6]]}]}},{})['index.html'];
 assert.doesNotMatch(old,/linearGradient id="ck-art-gradient"|rotate\(90 300 160\)/,'un dibujo antiguo se muestra como antes');
});

test('Krita: los bloqueos de capas y los ajustes inválidos se normalizan con seguridad',()=>{
 const t=normalize({kind:'dibujos',tools:{backgroundGradient:'__proto__',radialSymmetry:50,layerLocked:{base:'true',details:true},strokes:[
  {type:'pen',radialSymmetry:99,color:'#445566',points:[[1,2]]}
 ]}}).tools;
 assert.equal(t.backgroundGradient,'none');assert.equal(t.radialSymmetry,1);
 assert.equal(t.layerLocked.base,false);assert.equal(t.layerLocked.details,true);
 assert.equal(t.strokes[0].radialSymmetry,1);
 const old=normalize({kind:'dibujos',tools:{strokes:[{type:'pen',points:[[1,2]]}]}}).tools;
 assert.equal(old.radialSymmetry,1);assert.equal(old.strokes[0].radialSymmetry,1);
 assert.equal(old.layerLocked.base,false);assert.equal(old.backgroundGradient,'none');
});

test('el acceso carga el diseño actualizado tanto por código como por entrada directa',()=>{
 for(const page of ['club-krueka.html','studio.html','app.html'])assert.match(read(page),/club-studio-talleres\.css\?v=20261125/);
 for(const page of ['club-krueka.html','studio.html'])assert.match(read(page),/club-studio-access\.js\?v=20261125/);
 assert.match(read('js/club-studio-access.js'),/club-studio-talleres\.js'.*return 'js\/'.*20261125/);
 assert.match(read('club/club-studio-talleres.css'),/ct-canvas-expanded/);
});


test('los rellenos conservan el contorno y la portada de otros talleres muestra ArteLab',()=>{
 const raw={kind:'libros',title:'Libro de prueba',panels:[{title:'Inicio',text:'Este es mi libro.'}],tools:{
  coloringPage:'casa',templateColors:{pared:'#7469aa'},
  strokes:[{type:'rectangle',color:'#227799',fill:true,fillColor:'#aa5533',points:[[5,5],[100,80]]}],
  stamps:[{id:'objabcdef',kind:'text',text:'Mi título',x:125,y:125,color:'#4444aa'}]
 }};
 const files=enhance(raw,{});
 assert.match(files['index.html'],/fill="#aa5533" stroke="#227799"/);
 assert.match(files['index.html'],/fill="#7469aa" stroke="#344357"/);
 assert.match(files['index.html'],/>Mi título<\/text>/);
 assert.equal(JSON.parse(files['obra.json']).tools.strokes[0].fillColor,'#aa5533');
 raw.tools.strokes[0].fillColor='url(javascript:alert(1))';
 assert.match(enhance(raw,{})['index.html'],/fill="#227799" stroke="#227799"/);
});

test('la cubeta reconoce regiones cerradas por varios trazos y no cruza una división',()=>{
 const width=12,height=10,pixels=new Uint8ClampedArray(width*height*4).fill(255);
 const black=(x,y)=>{const i=(y*width+x)*4;pixels[i]=pixels[i+1]=pixels[i+2]=0;};
 for(let x=2;x<=9;x++){black(x,2);black(x,7);}
 for(let y=2;y<=7;y++){black(2,y);black(9,y);black(5,y);}
 const rects=ctx.window.ClubTalleres.floodRegion(pixels,width,height,3,4,24);
 assert.deepEqual(JSON.parse(JSON.stringify(rects)),[[3,3,2,4]],'solo selecciona el interior a la izquierda de la línea');
 const right=ctx.window.ClubTalleres.floodRegion(pixels,width,height,7,4,24);
 assert.deepEqual(JSON.parse(JSON.stringify(right)),[[6,3,3,4]],'la otra mitad sigue siendo una región separada');
 assert.equal(ctx.window.ClubTalleres.floodRegion(pixels,width,height,0,0,24).reduce((total,r)=>total+r[2]*r[3],0),72,'el exterior no invade los interiores');
});

test('la tolerancia une colores cercanos pero conserva barreras e islas',()=>{
 const pixels=new Uint8ClampedArray([200,200,200,255,202,202,202,255,0,0,0,255,200,200,200,255]);
 const area=rects=>rects.reduce((total,r)=>total+r[2]*r[3],0);
 assert.equal(area(ctx.window.ClubTalleres.floodRegion(pixels,4,1,0,0,1)),1);
 assert.equal(area(ctx.window.ClubTalleres.floodRegion(pixels,4,1,0,0,3)),2);
 assert.equal(area(ctx.window.ClubTalleres.floodRegion(pixels,4,1,3,0,100)),1,'no salta por encima de una barrera oscura');
 assert.deepEqual(Array.from(ctx.window.ClubTalleres.floodRegion([],4,1,0,0)),[],'rechaza una imagen incompleta');
});

test('un relleno libre se conserva al guardar y reabrir y se exporta como geometría estática',()=>{
 const tools={strokes:[{type:'pen',color:'#132436',points:[[20,20],[80,20],[80,60],[20,60],[20,20]]},{type:'region',color:'#f58035',opacity:1,layer:'base',rects:[[23,23,54,34]],points:[]}]};
 const files=enhance({kind:'dibujos',tools},{}),restored=enhance(JSON.parse(files['obra.json']),{});
 assert.equal(restored['index.html'],files['index.html']);
 assert.match(files['index.html'],/d="M23 23h54v34h-54Z" fill="#f58035"/);
 assert.match(files['index.html'],/stroke="#132436"/,'el contorno se conserva');
 assert.equal(JSON.parse(restored['obra.json']).tools.strokes[1].type,'region');
});

test('las figuras permiten colores por componente, deformación, reflejo y puntos editables persistentes',()=>{
 const raw={kind:'dibujos',tools:{stamps:[
  {id:'objrobot',kind:'vector',template:'robot',x:150,y:100,color:'#67c2dd',scale:1.4,scaleX:1.8,scaleY:.7,angle:25,flipX:true,contour:'#a12244',border:3,partStyles:{cabeza:{color:'#ffe166',x:10,y:-20,scaleX:1.3,scaleY:.8}}},
  {id:'objforma',kind:'polygon',x:400,y:150,color:'#a222aa',border:0,vertices:[[-45,-30],[35,-50],[50,40],[-25,15]]}
 ]}};
 const files=enhance(raw,{}),saved=JSON.parse(files['obra.json']),again=enhance(saved,{});
 assert.equal(again['index.html'],files['index.html'],'guardar y reabrir no aplana los objetos');
 assert.match(files['index.html'],/scale\(-1\.8 0\.7\)/);
 assert.match(files['index.html'],/translate\(10 -20\) scale\(1\.3 0\.8\)/);
 assert.match(files['index.html'],/fill="#ffe166"/);
 assert.match(files['index.html'],/stroke="#a12244"/);
 assert.match(files['index.html'],/stroke="none" stroke-width="0"/,'sin borde también al convertir el SVG en PNG');
 assert.match(files['index.html'],/M-45 -30L35 -50L50 40L-25 15Z/);
 assert.equal(saved.tools.stamps[0].partStyles.cabeza.color,'#ffe166');
 assert.equal(saved.tools.stamps[1].vertices[1][1],-50);
 raw.tools.stamps[0].hidden=true;
 assert.doesNotMatch(enhance(raw,{})['index.html'],/fill="#ffe166"/,'ocultar no borra el objeto del proyecto');
 assert.equal(normalize(raw).tools.stamps.length,2);
});

test('las figuras nuevas conservan su paleta por componentes independientemente del pincel',()=>{
 const raw={kind:'dibujos',tools:{ink:'#193959',stamps:[{id:'objpalette',kind:'vector',template:'robot',x:300,y:160,color:'#193959'}]}};
 const files=enhance(raw,{}),saved=JSON.parse(files['obra.json']);
 assert.equal(saved.tools.stamps[0].palette,true);
 assert.match(files['index.html'],/fill="#78cee0"/,'el cuerpo conserva su color');
 assert.match(files['index.html'],/fill="#ffe084"/,'la cabeza tiene un color distinto');
 assert.match(files['index.html'],/fill="#ef7f80"/,'los detalles mantienen su paleta');
 assert.doesNotMatch(files['index.html'],/fill="#193959"/,'insertar no pinta toda la figura con la tinta activa');
 assert.equal(enhance(saved,{})['index.html'],files['index.html']);
 saved.tools.stamps[0].palette=false;saved.tools.stamps[0].color='#dd7733';
 assert.match(enhance(saved,{})['index.html'],/fill="#dd7733"/,'la elección posterior de color base sí se aplica');
});

test('las medidas vectoriales corresponden a los límites visibles, sin los márgenes de la lámina',()=>{
 const api=ctx.window.ClubTalleres;
 const robot=normalize({kind:'dibujos',tools:{stamps:[{id:'objbounds',kind:'vector',template:'robot',border:0,x:300,y:160}]}}).tools.stamps[0];
 // El robot va de X=161 a 445 y de Y=3 a 312; no ocupa la lámina de 600 × 320.
 const natural=api.objectGeometry(robot);
 assert.ok(Math.abs(natural.width/natural.height-284/309)<1e-10);
 assert.equal(natural.height,140);
 const svg=api.sketchMarkup([],'#fffdf7',{stamps:[robot]});
 assert.ok(svg.includes('scale('+(140/309)+') translate(-303 -157.5)'),'la figura queda centrada en su contorno visible');
 robot.border=2;
 const bordered=api.objectGeometry(robot);
 assert.ok(Math.abs(bordered.width-natural.width-2)<1e-10);
 assert.ok(Math.abs(bordered.height-natural.height-2)<1e-10,'las medidas incluyen el contorno');
 robot.scaleX=220/bordered.width;robot.scaleY=160/bordered.height;
 const saved=JSON.parse(enhance({kind:'dibujos',tools:{stamps:[robot]}},{})['obra.json']).tools.stamps[0];
 const size=api.objectGeometry(saved);
 assert.ok(Math.abs(size.width*saved.scale*saved.scaleX-220)<1e-8);
 assert.ok(Math.abs(size.height*saved.scale*saved.scaleY-160)<1e-8);
 saved.partStyles.cabeza={scaleX:3,scaleY:1,x:10,y:0};
 assert.ok(api.objectGeometry(saved).width>size.width,'los cambios de forma actualizan los límites reales del objeto');
});

test('una obra amplia no pierde trazos ni objetos al normalizarla',()=>{
 const raw={kind:'dibujos',tools:{strokes:Array.from({length:110},(_,i)=>({type:'pen',color:'#123456',points:[[i,20],[i+3,30]]})),stamps:Array.from({length:45},(_,i)=>({id:'objmuestra'+i,kind:'cube',x:i*10,y:100,color:'#346688'}))}};
 const saved=JSON.parse(enhance(raw,{})['obra.json']);
 assert.equal(saved.tools.strokes.length,110);assert.equal(saved.tools.stamps.length,45);
 assert.equal(saved.tools.strokes[0].points[0][0],0,'conserva también los primeros trazos');
 assert.equal(saved.tools.stamps[0].id,'objmuestra0','conserva también los primeros objetos');
});
