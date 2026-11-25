const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const context={console,Set,Map};context.window=context;vm.createContext(context);
for(const file of ['club-studio-kits.js','club-studio-media.js'])vm.runInContext(fs.readFileSync(path.join(root,'js',file),'utf8'),context);
const M=context.StudioMedia,K=context.StudioKits;
const plain=value=>JSON.parse(JSON.stringify(value));
function videoConfig(overrides={}){return M.clean({kind:'video-edit',clips:[{id:'original',type:'video',title:'Clip de prueba',trim:2,duration:4,speed:2,volume:.4,source:{name:'prueba.webm',size:1024,modified:0,duration:20},...overrides}]});}

test('proyectos previos conservan su duración y reciben valores compatibles',()=>{
 const cfg=M.clean({kind:'video-edit',clips:[{id:'legacy',type:'video',trim:2,duration:3,source:{name:'original.webm',size:2000,duration:8}}]});
 assert.equal(cfg.clips[0].duration,3);assert.equal(cfg.clips[0].speed,1);assert.equal(cfg.clips[0].muted,false);assert.equal(cfg.clips[0].fit,'contain');
 const animation=M.clean({kind:'animation',duration:8,actors:[{id:'actor',frames:[{t:0,x:20,y:40,scale:1,angle:0}]}]});
 assert.equal(animation.actors[0].hidden,false);assert.equal(animation.actors[0].opacity,1);assert.equal(animation.actors[0].locked,false);
});

test('copiar poses crea valores independientes y respeta tiempos, bloqueos y cupos',()=>{
 const initial=M.initial('animation'),before=JSON.stringify(initial),copy={x:22,y:33,scale:1.4,angle:45};
 const next=M.insertPose(initial,'hero',2,copy);
 assert.equal(next.actors[0].frames.length,4);assert.deepEqual(plain(next.actors[0].frames.find(f=>f.t===2)),{t:2,...copy});
 copy.x=99;assert.equal(next.actors[0].frames.find(f=>f.t===2).x,22);assert.equal(JSON.stringify(initial),before);
 assert.throws(()=>M.insertPose(next,'hero',2),/Ya existe/);
 const replaced=M.insertPose(next,'hero',2,{x:70},true);assert.equal(replaced.actors[0].frames.length,4);assert.equal(replaced.actors[0].frames.find(f=>f.t===2).x,70);
 next.actors[0].locked=true;assert.throws(()=>M.insertPose(next,'hero',3),/Desbloqueá/);
 const full=M.clean({kind:'animation',duration:20,actors:[{id:'a',frames:Array.from({length:12},(_,t)=>({t,x:20,y:40,scale:1,angle:0}))}]});
 assert.throws(()=>M.insertPose(full,'a',15),/12 poses/);
});

test('dividir conserva el tramo original, velocidad y duración total sin fundido en la unión',()=>{
 const cfg=videoConfig(),before=JSON.stringify(cfg),split=M.splitClip(cfg,1.5,'segunda');
 assert.equal(split.clips.length,2);assert.equal(M.duration(split),M.duration(cfg));
 assert.equal(split.clips[0].duration,1.5);assert.equal(split.clips[0].trim,2);assert.equal(split.clips[1].trim,5);assert.equal(split.clips[1].duration,2.5);
 assert.equal(split.clips[1].trim+split.clips[1].duration*split.clips[1].speed,10);
 assert.equal(split.clips[0].fadeOut,false);assert.equal(split.clips[1].fadeIn,false);assert.equal(split.clips[0].fadeIn,true);assert.equal(split.clips[1].fadeOut,true);
 assert.deepEqual(plain(split.clips[0].source),plain(split.clips[1].source));assert.equal(JSON.stringify(cfg),before);
 assert.throws(()=>M.splitClip(cfg,.3,'segunda'),/medio segundo/);assert.throws(()=>M.splitClip(cfg,3.8,'segunda'),/medio segundo/);assert.throws(()=>M.splitClip(cfg,2,'original'),/segunda parte/);
 const full=M.clean({kind:'video-edit',clips:Array.from({length:12},(_,i)=>({id:'c'+i,duration:1}))});assert.throws(()=>M.splitClip(full,.5,'nueva'),/12 escenas/);
});

test('entrada y salida exactas cambian la duración según velocidad sin pasarse del original',()=>{
 const cfg=videoConfig(),trimmed=M.clipRange(cfg,'original',3.25,8.75,.5);
 assert.equal(trimmed.clips[0].trim,3.25);assert.equal(trimmed.clips[0].duration,11);assert.equal(trimmed.clips[0].speed,.5);
 assert.throws(()=>M.clipRange(cfg,'original',4,3,1),/Revisá/);assert.throws(()=>M.clipRange(cfg,'original',0,25,1),/Revisá/);assert.throws(()=>M.clipRange(cfg,'original',0,20,.25),/0,5 y 15/);
 const long=M.clean({kind:'video-edit',clips:[...Array.from({length:5},(_,i)=>({id:'title'+i,duration:15})),...cfg.clips]});assert.throws(()=>M.clipRange(long,'original',0,20,1),/0,5 y 15/);
 const nearLimit=M.clean({...long,clips:[...long.clips,{id:'close',duration:8}]});assert.throws(()=>M.clipRange(nearLimit,'original',0,8,1),/90 segundos/);
});

test('capas, recortes y transiciones sobreviven al guardado y a una segunda normalización',()=>{
 const animation=M.initial('animation');Object.assign(animation.actors[0],{hidden:true,locked:true,opacity:.4,flipX:true});animation.actors.reverse();
 const animationFiles={...K.create('animation'),'game-config.js':K.configFile(M.clean(animation))};assert.deepEqual(plain(M.clean(K.read(plain(animationFiles)))),plain(M.clean(animation)));
 const video=videoConfig({speed:.75,muted:true,transition:'fade-white',fadeDuration:1.2,fit:'cover',fadeIn:false}),files={...K.create('video-edit'),'game-config.js':K.configFile(video)};
 assert.deepEqual(plain(M.clean(K.read(plain(files)))),plain(video));assert.ok(!JSON.stringify(files).includes('blob:'));
 assert.ok(Object.values(files).every(value=>value.length<120000));assert.ok(Object.values(files).reduce((n,value)=>n+value.length,0)<220000);
});

test('validación descarta propiedades hostiles y conserva motores personalizados',()=>{
 const cfg=videoConfig({speed:999,muted:'true',fit:'url(javascript:bad)',transition:'<img>',fadeDuration:999});
 assert.equal(cfg.clips[0].speed,4);assert.equal(cfg.clips[0].muted,false);assert.equal(cfg.clips[0].fit,'contain');assert.equal(cfg.clips[0].transition,'fade');assert.ok(cfg.clips[0].fadeDuration<=cfg.clips[0].duration/2);
 const custom={'media.js':'/* Mi motor personalizado */','game-config.js':'x'};assert.equal(M.upgradeEngine(custom),custom);
 const latest=K.create('animation');assert.equal(M.upgradeEngine(latest),latest);
});

function runEngine(cfg){
 const events={},messages=[],videos=[],gains=[],calls=[],nodes={};let nextFrame=null,now=0;
 const draw=new Proxy({globalAlpha:1,createLinearGradient(){return {addColorStop(){}};},measureText(value){return {width:String(value).length*10};}}, {get(obj,key){if(key in obj)return obj[key];return (...args)=>{calls.push([key,...args]);};}});
 const node=id=>nodes[id]||(nodes[id]={id,textContent:'',value:0,style:{},disabled:false,hidden:false});
 const canvas=node('media-canvas');Object.assign(canvas,{getContext:()=>draw,getBoundingClientRect:()=>({left:0,top:0,width:960,height:540}),setPointerCapture(){},hasPointerCapture(){return false;}});
 const parent={postMessage(message){messages.push(message);}};
 class AudioContext {constructor(){this.state='running';this.destination={};}createMediaElementSource(){return {connect(){}};}createGain(){const gain={gain:{value:0},connect(){}};gains.push(gain);return gain;}createMediaStreamDestination(){return {stream:{getAudioTracks(){return [];}}};}resume(){return Promise.resolve();}close(){return Promise.resolve();}}
 const sandbox={console,Map,Set,Blob,setTimeout,clearTimeout,AudioContext,parent,KRUEKA_GAME:cfg,performance:{now:()=>now},requestAnimationFrame(fn){nextFrame=fn;},addEventListener(name,fn){events[name]=fn;},URL:{createObjectURL:()=> 'blob:local-test',revokeObjectURL(){}},document:{getElementById:node,createElement(kind){assert.equal(kind,'video');const el={tagName:'VIDEO',readyState:2,videoWidth:320,videoHeight:180,currentTime:0,paused:true,muted:true,playbackRate:1,load(){this.onloadeddata?.();},play(){this.paused=false;return Promise.resolve();},pause(){this.paused=true;}};videos.push(el);return el;}}};sandbox.window=sandbox;
 vm.runInNewContext('('+M.runtime.toString()+')();',sandbox);
 return {nodes,calls,messages,videos,gains,cfg,async send(data,source=parent){await events.message({source,data});},tick(ms){now+=ms;nextFrame(now);}};
}

test('motor sincroniza reproducir, pausar, cursor y fin de la secuencia; ignora mensajes ajenos',async()=>{
 const engine=runEngine(M.initial('animation'));
 await engine.send({type:'krueka-media-seek',time:3});assert.equal(engine.messages.at(-1).time,3);
 await engine.send({type:'krueka-media-playback',action:'play'});engine.tick(100);assert.equal(engine.messages.findLast(x=>x.type==='krueka-media-state').playing,true);
 await engine.send({type:'krueka-media-playback',action:'pause'});const paused=engine.messages.at(-1).time;engine.tick(100);assert.equal(engine.nodes['media-time'].value,paused);
 await engine.send({type:'krueka-media-seek',time:7.99});await engine.send({type:'krueka-media-playback',action:'play'});engine.tick(100);assert.equal(engine.messages.at(-1).time,8);assert.equal(engine.messages.at(-1).playing,false);
 await engine.send({type:'krueka-media-seek',time:4},{});assert.equal(engine.nodes['media-time'].value,8);
});

test('poses vecinas y selección solo aparecen en edición pausada',async()=>{
 const cfg=M.clean({kind:'animation',duration:8,actors:[{id:'a',icon:'⭐',frames:[{t:0,x:20,y:50,scale:1,angle:0},{t:8,x:80,y:50,scale:1,angle:0}]}]});
 const engine=runEngine(cfg);await engine.send({type:'krueka-media-seek',time:4});engine.calls.length=0;
 await engine.send({type:'krueka-media-editor',enabled:true,onion:true,selected:'a'});assert.equal(engine.calls.filter(c=>c[0]==='translate').length,4,'dos referencias, personaje y selección');
 engine.calls.length=0;await engine.send({type:'krueka-media-editor',enabled:false,onion:true,selected:'a'});assert.equal(engine.calls.filter(c=>c[0]==='translate').length,1,'vista final limpia');
});

test('video aplica velocidad al tiempo del original y respeta silencio y volumen',async()=>{
 const engine=runEngine(videoConfig({muted:true}));await engine.send({type:'krueka-media-assets',assets:[{id:'original',blob:new Blob(['video'])}]});
 await engine.send({type:'krueka-media-seek',time:1.25});assert.equal(engine.videos[0].currentTime,4.5);assert.equal(engine.videos[0].playbackRate,2);
 await engine.nodes['media-sound'].onclick();assert.equal(engine.videos[0].muted,true);assert.equal(engine.gains[0].gain.value,0);
 engine.cfg.clips[0].muted=false;await engine.send({type:'krueka-media-seek',time:1.25});assert.equal(engine.videos[0].muted,false);assert.equal(engine.gains[0].gain.value,.4);
 await engine.send({type:'krueka-media-playback',action:'play'});assert.equal(engine.videos[0].paused,false);await engine.send({type:'krueka-media-playback',action:'pause'});assert.equal(engine.videos[0].paused,true);
});
