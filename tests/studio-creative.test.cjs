const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),context={console,Set,Map};context.window=context;
vm.createContext(context);for(const file of ['club-studio-kits.js','club-studio-media.js'])vm.runInContext(fs.readFileSync(path.join(root,'js',file),'utf8'),context);
const M=context.StudioMedia,K=context.StudioKits;
for(const kind of ['animation','video-edit']){
 const files=K.create(kind),copy=JSON.parse(JSON.stringify(files));assert.equal(K.read(copy).kind,kind);
 let total=0;for(const [name,value] of Object.entries(copy)){assert.ok(value.length<120000,name);total+=value.length;if(name.endsWith('.js'))new vm.Script(value);}
 assert.ok(total<220000);assert.ok(copy['LEEME.md'].includes('Indicadores:'));
}
const actor={easing:'linear',frames:[{t:0,x:10,y:20,scale:1,angle:0},{t:10,x:90,y:80,scale:2,angle:180}]};
assert.equal(M.pose(actor,5).x,50);assert.equal(M.pose(actor,5).angle,90);assert.equal(M.pose(actor,99).x,90);
assert.equal(M.pose({...actor,easing:'hold'},5).x,10);assert.equal(M.pose({...actor,easing:'smooth'},5).x,50);
const hostile=M.clean({kind:'animation',duration:Infinity,background:'" onmouseover="oops',actors:[{id:'actor-1',icon:'<img src=x onerror=oops>',frames:[{t:900,x:-20,y:999,scale:80,angle:-999}]},{id:'actor-1',frames:[]},{id:'actor-2',frames:[]} ]});
assert.equal(hostile.duration,8);assert.equal(hostile.background,'#142745');assert.equal(hostile.actors[0].icon,'🤖');assert.equal(hostile.actors[0].frames[0].x,0);assert.equal(hostile.actors[0].frames[0].y,100);assert.equal(new Set(hostile.actors.map(a=>a.id)).size,3);
const cfg=M.clean({kind:'video-edit',clips:Array.from({length:40},(_,i)=>({id:'clip-1',duration:15,title:'Escena '+i}))});
assert.ok(cfg.clips.length<=12);assert.equal(M.duration(cfg),90);assert.equal(new Set(cfg.clips.map(c=>c.id)).size,cfg.clips.length);
assert.equal(M.locate(cfg,15).index,1);assert.equal(M.locate(cfg,90).index,cfg.clips.length-1);
const trimmed=M.clean({kind:'video-edit',clips:[{type:'video',duration:12,trim:2,source:{duration:3,size:1234,name:'original.webm'}},{type:'image',image:'data:image/svg+xml;base64,PHN2Zz4='}]});
assert.equal(trimmed.clips[0].duration,1);assert.equal(trimmed.clips[0].trim,2);assert.equal(trimmed.clips[1].type,'card');assert.equal(trimmed.clips[1].image,'');
const valid=M.clean({kind:'video-edit',clips:[{type:'image',image:'data:image/jpeg;base64,YWJj',duration:3}]});assert.equal(valid.clips[0].type,'image');
const studio={renderCreator(){},renderLesson(){},adopt(){},close(){}};context.StudioIA=studio;
context.addEventListener=()=>{};context.document={getElementById(){return null}};
vm.runInContext(fs.readFileSync(path.join(root,'js/club-studio-media-editor.js'),'utf8'),context);
// El estado de un proyecto no debe incluir blobs o URLs transitorias: se guarda solo la configuración.
assert.ok(!JSON.stringify(K.create('video-edit')).includes('blob:'));
console.log('PASS: proyectos autónomos, poses e interpolación, tiempos y recortes, IDs únicos, imágenes admitidas y límites de guardado.');
