const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),load=f=>fs.readFileSync(path.join(root,f),'utf8');
const scripts=[load('js/club-studio-kits.js'),load('js/club-studio-showcase.js')];
const env={window:{},console,JSON,Math,Number,String,Array,Object,Date};vm.createContext(env);
for(const code of scripts)vm.runInContext(code,env);
const kits=env.window.StudioKits;
assert.equal(kits.catalog[0].id,'neon-rift');assert.ok(kits.catalog.some(k=>k.id==='stars'));
const files=kits.create('neon-rift');
assert.deepEqual(Object.keys(files).sort(),['LEEME.md','game-config.js','game.js','index.html','style.css'].sort());
assert.ok(files['index.html'].includes('sandbox')===false);
assert.ok(files['index.html'].includes('id="mode"')&&files['index.html'].includes('id="arena"'));
assert.ok(files['style.css'].length>1000);assert.ok(files['game.js'].length>10000);
assert.ok(!/https?:\/\//.test(Object.values(files).join('')),'El juego no requiere conexión');
assert.ok(Object.values(files).every(x=>x.length<120000),'Archivos bajo límite');
assert.ok(Object.values(files).reduce((a,v)=>a+v.length,0)<65000,'Límite de IA para código');
new vm.Script(files['game-config.js']);new vm.Script(files['game.js']);
const cfg=env.window.StudioKits.read(files);assert.equal(cfg.kind,'neon-rift');assert.equal(cfg.waves,3);
function element(id){return {id,hidden:false,textContent:'',style:{},dataset:{},classList:{add(){},remove(){}},listeners:{},addEventListener(ev,fn){this.listeners[ev]=fn;},replaceChildren(){this.children=[];},appendChild(v){(this.children||(this.children=[])).push(v);},click(){this.onclick?.();},get offsetWidth(){return 100;},getBoundingClientRect(){return {left:0,top:0,width:960,height:540};}}}
const els={};for(const id of ['arena','sheet','sheet-title','sheet-text','choices','mode','sound','pause','life','score','wave','dash','name','banner'])els[id]=element(id);
const gradient={addColorStop(){}};const cx=new Proxy({createRadialGradient:()=>gradient,createLinearGradient:()=>gradient}, {get(t,k){if(k in t)return t[k];return ()=>{}},set(t,k,v){t[k]=v;return true;}});
els.arena.getContext=()=>cx;els.arena.setPointerCapture=()=>{};
const touchBtns=['up','left','right','down','dash','fire'].map(name=>{const e=element(name);e.dataset.control=name;e.setPointerCapture=()=>{};return e});
const raf=[];
const context={window:{addEventListener(){},AudioContext:null},document:{getElementById:id=>els[id],querySelectorAll:sel=>sel==='[data-control]'?touchBtns:[],createElement:tag=>element(tag),addEventListener(){},hidden:false,title:''},
requestAnimationFrame:fn=>{raf.push(fn)},setTimeout:()=>1,clearTimeout(){},Math,Number,String,Array,Object,JSON,Date,console};
vm.createContext(context);vm.runInContext(files['game-config.js'],context);vm.runInContext(files['game.js'],context);
assert.ok(els.mode.textContent.includes('Jugar ahora'));els.mode.click();assert.equal(els.sheet.hidden,true);
for(let i=1;i<=150;i++){const f=raf.shift();assert.ok(f,'animation callback');f(i*16);}
assert.ok(els.wave.textContent.startsWith('1 /'));assert.ok(!Number.isNaN(Number(els.score.textContent)));
els.pause.click();assert.equal(els.mode.textContent,'Continuar');els.mode.click();assert.equal(els.sheet.hidden,true);
assert.ok(kits.create('stars')['game.js'],'Bases anteriores intactas');
assert.ok(load('app.html').includes('club-studio-showcase.js'));
assert.ok(load('ejemplos/neon-rift.html').includes('sandbox="allow-scripts"'));
console.log('PASS: catálogo, configuración, compilación, juego inicia, 150 fotogramas, pausa, reanudación, integridad y demo pública.');
