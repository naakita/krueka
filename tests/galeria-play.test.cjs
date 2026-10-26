const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');const read=x=>fs.readFileSync(path.join(root,x),'utf8');
const gallery=read('js/galeria-krueka.js'),games=read('js/juegos-krueka.js');
const htmlGallery=read('galeria.html'),htmlGames=read('juegos.html'),app=read('app.html');
const index=read('index.html'),student=read('js/alumno.js'),classroom=read('actividades-clase.html');
const sql=read('supabase/migrations/20261026090000_krueka_gallery_public_library.sql');
new vm.Script(gallery);new vm.Script(games);new vm.Script(student);
for(const page of [index,app,classroom]){
 assert.match(page,/href="galeria\.html"/);assert.match(page,/href="juegos\.html"/);
}
assert.match(app,/js\/alumno\.js\?v=20261026a/);
assert.match(htmlGallery,/js\/galeria-krueka\.js\?v=20261026a/);
assert.match(htmlGames,/js\/juegos-krueka\.js\?v=20261026a/);
assert.match(student,/cerrado\s*\?\s*'<p class="alert ok">/);
assert.match(student,/Primero terminá y entregá tu trabajo/);
assert.match(gallery,/descarg.*PNG|savePng/i);
assert.match(gallery,/toBlob\(resolve,"image\/png"\)/);
assert.match(gallery,/Medio ambiente/);
assert.match(gallery,/betesda|Paraguay/);
assert.match(gallery,/published",true/);
assert.match(gallery,/published:false/);
assert.match(sql,/enable row level security/);
assert.match(sql,/for select to anon,authenticated using/);
assert.match(sql,/published or submitted_by/);
assert.match(sql,/role::text='admin'/);
assert.match(sql,/role::text in \('admin','docente'\)/);
assert.match(sql,/image\/webp/);
assert.doesNotMatch(sql,/service_role|for all to public using \(true\)/);
class El {
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.listeners={};this.attributes={};this.style={};this.className='';this._html='';this.classList={toggle(){},add(){},remove(){}};}
 appendChild(x){this.children.push(x);return x;}
 replaceChildren(...x){this.children=[...x];}
 set innerHTML(x){this._html=x;this.children=[];}
 get innerHTML(){return this._html;}
 setAttribute(k,v){this.attributes[k]=v;}
 addEventListener(k,f){this.listeners[k]=f;}
 querySelectorAll(sel){if(sel==='button')return this.children.filter(x=>x.tagName==='BUTTON');return [];}
 querySelector(sel){if(sel==='img')return this.children.find(x=>x.tagName==='IMG')||new El('img');return null;}
 closest(){return this;}
 click(){this.listeners.click?.({target:this,currentTarget:this});}
}
const gElems=new Map();
const gdoc={createElement:t=>new El(t),getElementById:id=>{if(!gElems.has(id))gElems.set(id,new El());return gElems.get(id);}};
const gc={document:gdoc,window:{},console,URL:{createObjectURL:()=>'',revokeObjectURL:()=>{}},setTimeout,TextEncoder,Blob};
vm.createContext(gc);vm.runInContext(gallery,gc);
const tiles=gdoc.getElementById('gallery-grid').children;
assert.ok(tiles.length>=40,'Se esperaban al menos 40 ilustraciones originales, hay '+tiles.length);
assert.ok(tiles.every(x=>x.className==='tile'));
assert.ok(gdoc.getElementById('gallery-count').textContent.includes(String(tiles.length)));
const tabElems=['chess','sudoku','memory','words','quiz'].map(game=>({dataset:{game},setAttribute(){}}));
const gameRoot=new El(),gameTabs=new El(),gameHelp=new El(),gameLearning=new El(),newGame=new El();
gameTabs.querySelectorAll=()=>tabElems;
const els=new Map([['game-root',gameRoot],['game-tabs',gameTabs],['game-help',gameHelp],['game-learning',gameLearning],['new-game',newGame]]);
const doc={createElement:t=>new El(t),getElementById:id=>els.get(id),addEventListener(){}};
const ctx={document:doc,console,Math,setTimeout,clearTimeout};
vm.createContext(ctx);vm.runInContext(games,ctx);
function open(game){gameTabs.listeners.click({target:{closest:()=>({dataset:{game}})}});}
let board=gameRoot.children.find(x=>x.className==='board chess');
assert.ok(board&&board.children.length===64,'Tablero de ajedrez de 64 casillas');
board.children[52].click();board=gameRoot.children.find(x=>x.className==='board chess');
board.children[36].click();board=gameRoot.children.find(x=>x.className==='board chess');
assert.equal(board.children[36].textContent,'♙','Debe mover peón blanco de e2 a e4');
open('sudoku');
assert.equal(gameRoot.children.find(x=>x.className==='sudoku-board').children.length,81);
open('memory');
assert.equal(gameRoot.children.find(x=>x.className==='memory-board').children.length,16);
open('words');
assert.equal(gameRoot.children.find(x=>x.className==='word-board').children.length,144);
open('quiz');assert.ok(gameRoot.children.some(x=>x.className==='quiz-options'));
console.log('PASS: '+tiles.length+' ilustraciones, navegación pública, galerías moderadas y cinco juegos funcionales.');
