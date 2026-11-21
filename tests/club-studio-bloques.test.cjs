const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/club-studio-bloques.js'), 'utf8');

function load(){
 const kit = {catalog:[],create(id){return {'original.txt':id}},art(id){return `<svg>${id}</svg>`}};
 const studio = {showTab(){},createKit(){},switchProject(){},refreshAll(){},lock(){},submit(){}};
 const creative = {paths:[]},club={categories:[{id:'juegos',kits:['stars']}]};
 const context = {window:{StudioIA:studio,StudioKits:kit,StudioCreative:creative,ClubKrueka:club},StudioKits:kit,StudioCreative:creative,console,setTimeout,clearTimeout};
 vm.runInNewContext(source,context,{filename:'club-studio-bloques.js'});
 return {api:context.window.StudioBloques,kit,creative,club};
}

test('El taller aparece en el catálogo y genera archivos editables',()=>{
 const {api,kit,creative,club}=load();
 assert.equal(kit.catalog[0].id,'visual-blocks');
 assert.equal(creative.paths[0].first,'visual-blocks');
 assert.equal(club.categories[0].kits[0],'visual-blocks');
 assert.match(kit.art('visual-blocks'),/Programación visual/);
 const files=kit.create('visual-blocks');
 assert.ok(files['index.html'].includes('data-key="ArrowLeft"'));
 assert.ok(files['style.css'].includes('canvas'));
 assert.ok(files['script.js'].includes('const PROGRAMA='));
 assert.equal(JSON.parse(files['bloques.json']).events.flechas[0].type,'mover');
 assert.equal(files['LEEME.md'].includes('No incluyas datos personales.'),true);
 assert.equal(api.isBlocks({files}),true);
 assert.match(files['index.html'],/Mi juego de estrellas/);
});

test('Se normalizan los bloques, las entradas y los límites',()=>{
 const {api}=load();
 const program={goal:900,avatar:'🚫',events:{
  inicio:[{id:'x',type:'decir',value:'<script>alert(1)</script>'},{type:'mover',value:9000},{type:'invento',value:3}],
  estrella:Array.from({length:100},(_,i)=>({type:'sumar',value:i}))
 }};
 const normalized=api.clean(program);
 assert.equal(normalized.goal,30);
 assert.equal(normalized.avatar,'🐱');
 assert.equal(normalized.events.inicio.length,2);
 assert.equal(normalized.events.inicio[1].value,180);
 assert.equal(normalized.events.estrella.length,35);
 const js=api.gameSource(program);
 assert.equal(js.includes('<script>'),false);
 assert.equal(js.includes('</script>'),false);
 assert.ok(js.includes('\\u003cscript\\u003e'));
 assert.ok(!js.includes('eval('));
});

test('Motor: flecha, colisión, puntos, función, condición y animación funcionan',()=>{
 const {api}=load();
 const program=api.starter();
 program.goal=2;
 program.events.estrella.push({id:'f',type:'llamar'});
 program.events.funcion=[{id:'cond',type:'si_puntos',value:1},{id:'add',type:'sumar',value:1},{id:'ani',type:'animar',value:5}];
 const js=api.gameSource(program),listeners={};
 const context2d={fillRect(){},beginPath(){},arc(){},fill(){},fillText(){},save(){},translate(){},rotate(){},restore(){},};
 const controls=['ArrowLeft','ArrowUp','ArrowDown','ArrowRight'].map(key=>({dataset:{key},addEventListener(type,fn){listeners['click:'+key]=fn}}));
 const elements={
  juego:{getContext(){return context2d}},puntos:{textContent:''},meta:{textContent:''},mensaje:{textContent:''},
  reiniciar:{addEventListener(type,fn){listeners['restart']=fn}}
 };
 const doc={getElementById(id){return elements[id]},addEventListener(type,fn){listeners[type]=fn},querySelectorAll(){return controls}};
 const runtime={document:doc,Math:Object.assign(Object.create(Math),{random(){return .5}}),requestAnimationFrame(){},setInterval(){},console};
 vm.runInNewContext(js,runtime,{filename:'juego-generado.js'});
 assert.equal(elements.puntos.textContent,'0 puntos');
 listeners.keydown({key:'ArrowRight',preventDefault(){}});
 assert.equal(elements.puntos.textContent,'2 puntos');
 assert.match(elements.mensaje.textContent,/Misión cumplida/);
 listeners.restart();
 assert.equal(elements.puntos.textContent,'0 puntos');
});

test('Entradas del Club y panel docente cargan el mismo módulo y estilos',()=>{
 for(const file of ['club-krueka.html','studio.html','app.html']){
  const html=fs.readFileSync(path.join(root,file),'utf8');
  assert.match(html,/club-studio-bloques\.css\?v=/);
 }
 const loader=fs.readFileSync(path.join(root,'js/club-studio-access.js'),'utf8');
 const app=fs.readFileSync(path.join(root,'app.html'),'utf8');
 assert.ok(loader.includes("'club-studio-bloques.js'"));
 assert.match(app,/club-studio-bloques\.js\?v=/);
 assert.ok(loader.indexOf("'club-studio-bloques.js'")>loader.indexOf("'club-studio-club.js'"));
});
