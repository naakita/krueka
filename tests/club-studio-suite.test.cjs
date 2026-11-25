const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,'js',name),'utf8');
const plain=value=>JSON.parse(JSON.stringify(value));

function engine(withStudio=false){
 const env={console,URL};env.window=env;
 if(withStudio)env.document={readyState:'loading',addEventListener(){},getElementById(){return null;},querySelectorAll(){return [];}};
 vm.createContext(env);
 if(withStudio){
  vm.runInContext(read('club-studio-ai.js'),env);
  const s=env.StudioIA;
  // Los efectos de pantalla y guardado se aíslan; checkpoint, restore y adopt son reales.
  s.sid=()=> 'test-a';s.scheduleSave=()=>{};s.say=()=>{};s.refreshAll=()=>{};s.lock=()=>{};
  s.cloudReady=true;s.projectId='project-a';
 }else env.StudioIA={buildPreview(){return '';}};
 vm.runInContext(read('club-studio-talleres.js'),env);
 vm.runInContext(read('club-studio-medios.js'),env);
 vm.runInContext(read('club-studio-suite.js'),env);
 return {T:env.ClubTalleres,A:env.ClubWorkshopSuite,S:env.StudioIA};
}
function work(kind='animes'){
 return {kind,title:'Una aventura',subtitle:'Creación del taller',art:'🦊',color:'#237fc3',
  panels:[{title:'Comienzo',text:'El árbol crece.'},{title:'Final',text:'El árbol florece.'}],tools:{}};
}

test('normaliza controles sin aceptar CSS o dimensiones fuera de los límites',()=>{
 const {A}=engine();
 const editorial=A.editorial({bodySize:400,titleSize:4,lineHeight:Infinity,align:'left; color:red',format:'bad',columns:2.6,gap:-4});
 assert.deepEqual(plain(editorial),{bodySize:36,titleSize:22,lineHeight:1.6,align:'left',format:'auto',columns:3,gap:4});
 const scene=A.sceneStyle({bubbleColor:'red; color:blue',textColor:'#eeffaa',actorSize:500,border:-1,seconds:900,motion:'run; color:red',side:'left'});
 assert.equal(scene.bubbleColor,'#ffffff');assert.equal(scene.textColor,'#eeffaa');assert.equal(scene.actorSize,140);
 assert.equal(scene.border,0);assert.equal(scene.seconds,30);assert.equal(scene.motion,'inherit');assert.equal(scene.side,'left');
 assert.equal(A.sceneStyle({}).seconds,null);
 assert.equal(A.sceneStyle({seconds:''}).seconds,null);
});

test('buscar y reemplazar trata metacaracteres y sustituciones como texto literal',()=>{
 const {A}=engine();
 assert.equal(A.findText('árbol ARBOL Árbol','árbol',1),12);
 assert.equal(A.findText('uno dos uno','uno',11),0);
 assert.equal(A.findText('abc','',0),-1);
 assert.equal(A.findText('A[B] a[b]','a[b]',0,true),5);
 assert.deepEqual(plain(A.replaceText('a.* a.* A.*','a.*','$&',true)),{text:'$& $& A.*',count:2});
 assert.deepEqual(plain(A.replaceText('árbol Árbol ÁRBOL','árbol','flor')),{text:'flor flor flor',count:3});
 assert.deepEqual(plain(A.replaceText('texto','','otro')),{text:'texto',count:0});
});

test('la búsqueda mantiene índices del original cuando Unicode cambia al pasar a minúsculas',()=>{
 const {A}=engine();
 assert.equal(A.findText('İ hola','hola'),2);
 assert.deepEqual(plain(A.replaceText('İ hola','hola','adiós')),{text:'İ adiós',count:1});
 assert.deepEqual(plain(A.replaceText('🎨 🌳 🎨','🎨','⭐')),{text:'⭐ 🌳 ⭐',count:2});
});

test('el texto descargable conserva títulos, párrafos y todas las partes en su orden',()=>{
 const {A}=engine();
 assert.equal(A.words('¡Hola, árbol! co-crear 2026 🎨'),4);
 const d=work('cuentos');
 assert.equal(A.plainText(d),'Una aventura\n\nCreación del taller\n\nComienzo\n\nEl árbol crece.\n\nFinal\n\nEl árbol florece.');
});

test('la composición y las escenas sobreviven normalización, exportación y nueva lectura',()=>{
 const {T}=engine(),d=work('historietas');
 d.tools={character:'🐱',editorial:{bodySize:22,titleSize:55,columns:3,gap:20,format:'oficio'},
  perScene:[{speaker:'Narrador',stage:'El patio',editor:{actorSize:100,bubbleColor:'#fff100',side:'left'}},{}]};
 const before=JSON.stringify(d),files=T.enhance(d,{'nota.txt':'Conservar este archivo'}),saved=JSON.parse(files['obra.json']),again=T.normalize(saved);
 assert.equal(JSON.stringify(d),before,'Construir archivos no debe mutar los datos recibidos');
 assert.equal(files['nota.txt'],'Conservar este archivo');
 assert.equal(again.tools.editorial.bodySize,22);assert.equal(again.tools.editorial.columns,3);
 assert.equal(again.tools.perScene[0].speaker,'Narrador');assert.equal(again.tools.perScene[0].stage,'El patio');
 assert.equal(again.tools.perScene[0].editor.actorSize,100);assert.equal(again.tools.perScene[0].editor.bubbleColor,'#fff100');
 assert.match(files['index.html'],/data-suite-scene="0"/);assert.match(files['style.css'],/repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(files['style.css'],/flex-direction:row-reverse/);assert.match(files['style.css'],/size:210mm 333\.3mm/);
});

test('las escenas sin duración propia heredan el tiempo general incluso después de guardar',()=>{
 const {T}=engine(),d=work();d.tools={sceneSeconds:11,perScene:[{editor:{seconds:7}},{}]};
 const files=T.enhance(d,{});
 assert.deepEqual([...files['index.html'].matchAll(/data-duration="([^"]+)"/g)].map(m=>Number(m[1])),[7,11]);
 assert.match(files['script.js'],/pages\[page\]\.dataset\.duration/);
 const saved=JSON.parse(files['obra.json']);saved.tools.sceneSeconds=4;
 const changed=T.enhance(saved,{});
 assert.deepEqual([...changed['index.html'].matchAll(/data-duration="([^"]+)"/g)].map(m=>Number(m[1])),[7,4]);
});

test('la impresión conserva portada, firma, ilustraciones y texto sin ejecutar HTML escrito',()=>{
 const {A}=engine(),d=work('libros');
 d.title='Mi <libro>';d.panels=[{title:'Manuscrito',text:'**Comienzo**\n\n[[imagen:imgabcdef]]\n\n<script>danger()</script> & final.'}];
 d.tools={author:'Firma artística',action:'Frase de la portada',images:{cover:'data:image/webp;base64,AAAA'},bookImages:{imgabcdef:'data:image/webp;base64,BBBB'},editorial:{format:'horizontal',bodySize:22}};
 const html=A.printMarkup(d);
 assert.match(html,/Mi &lt;libro&gt;/);assert.match(html,/Firma artística/);assert.match(html,/Frase de la portada/);
 assert.match(html,/src="data:image\/webp;base64,AAAA"/);assert.match(html,/src="data:image\/webp;base64,BBBB"/);
 assert.match(html,/<strong>Comienzo<\/strong>/);assert.match(html,/&lt;script&gt;danger\(\)&lt;\/script&gt; &amp; final/);
 assert.doesNotMatch(html,/<script>danger\(\)<\/script>/);assert.doesNotMatch(html,/\[\[imagen:imgabcdef\]\]/);
 assert.match(html,/297mm 210mm/);assert.match(html,/font:22px/);
});

test('deshacer y rehacer recuperan archivos completos y descartan una rama modificada',()=>{
 const {S,A}=engine(true);
 S.files={'index.html':'A','style.css':'color:red'};S.checkpoint();
 S.files={'index.html':'B','style.css':'color:blue'};S.changed();S.checkpoint();
 S.files={'index.html':'C','style.css':'color:green'};S.changed();S.checkpoint();
 S.restore();assert.deepEqual(plain(S.files),{'index.html':'B','style.css':'color:blue'});
 A.redo();assert.deepEqual(plain(S.files),{'index.html':'C','style.css':'color:green'});
 S.restore();S.checkpoint();S.files={'index.html':'D','style.css':'color:yellow'};S.changed();
 A.redo();assert.deepEqual(plain(S.files),{'index.html':'D','style.css':'color:yellow'});
 S.restore();assert.equal(S.files['index.html'],'B');
});

test('el historial se limita por pasos y memoria y el rehacer no cruza alumnos ni proyectos',()=>{
 const {S,A}=engine(true);
 S.files={'index.html':'inicio'};
 for(let i=0;i<40;i++){S.checkpoint();S.files={'index.html':String(i)};S.changed();}
 assert.equal(S.undo.length,30);
 S.restore();assert.equal(S.files['index.html'],'38');
 S.adopt({id:'project-b',files:{'index.html':'otro proyecto'}});A.redo();
 assert.equal(S.files['index.html'],'otro proyecto');assert.equal(S.undo.length,0);
 S.checkpoint();S.files={'index.html':'edición'};S.changed();S.restore();
 S.sid=()=> 'test-b';S.adopt({id:'project-b',files:{'index.html':'otro alumno'}});A.redo();
 assert.equal(S.files['index.html'],'otro alumno');assert.equal(S.undo.length,0);
 for(let i=0;i<40;i++){S.checkpoint();S.files={'index.html':'a'.repeat(100000),'style.css':String(i)+'b'.repeat(99990)};S.changed();}
 const size=S.undo.reduce((sum,entry)=>sum+Object.values(entry).reduce((n,value)=>n+value.length,0),0);
 assert.ok(size<=5000000);assert.ok(S.undo.length>0);
});

test('deshacer y rehacer respetan bloqueo mientras se guarda o falta cargar el proyecto',()=>{
 const {S,A}=engine(true);
 S.files={'index.html':'antes'};S.checkpoint();S.files={'index.html':'después'};S.changed();
 S.busy=true;S.restore();assert.equal(S.files['index.html'],'después');
 S.busy=false;S.restore();assert.equal(S.files['index.html'],'antes');
 S.cloudReady=false;A.redo();assert.equal(S.files['index.html'],'antes');
 S.cloudReady=true;A.redo();assert.equal(S.files['index.html'],'después');
});
