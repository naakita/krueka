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

test('el acceso carga el diseño actualizado tanto por código como por entrada directa',()=>{
 for(const page of ['club-krueka.html','studio.html','app.html'])assert.match(read(page),/club-studio-talleres\.css\?v=20261121publicar1/);
 for(const page of ['club-krueka.html','studio.html'])assert.match(read(page),/club-studio-access\.js\?v=20261121publicar1/);
 assert.match(read('js/club-studio-access.js'),/club-studio-talleres\.js'\)return 'js\/'.*20261121dibujos1/);
 assert.match(read('club/club-studio-talleres.css'),/ct-canvas-expanded/);
});
