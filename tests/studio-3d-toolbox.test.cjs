const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),js=f=>fs.readFileSync(path.join(root,'js',f),'utf8');
const ctx={console,JSON,Object,Array,Math,Number,String,Date,Set,Map,confirm:()=>true};
ctx.window=ctx;vm.createContext(ctx);
for(const file of ['club-studio-kits.js','club-studio-3d.js','club-studio-3d-toolbox.js'])vm.runInContext(js(file),ctx);
const K=ctx.StudioKits,engine=ctx.Studio3D,tool=ctx.Krueka3DToolbox;
assert.ok(tool && engine.__toolboxReady,'Herramientas integradas al editor original');
assert.equal(tool.MAX,48);
const kinds=['crystal','crate','pillar','tree','drone','beacon','house','car','road','wall','rock','lamp','arch'];
for(const t of kinds){
 const c=engine.normalise({kind:'explore3d',objects:[{type:t,id:'obj-1',label:'Objeto '+t,x:1,z:2,size:1.5,height:2,color:'#123456'}]});
 assert.equal(c.objects[0].type,t,'El motor debe aceptar '+t);
 assert.equal(c.objects[0].color,'#123456');
}
assert.equal(engine.normalise({objects:Array.from({length:60},(_,i)=>({type:'house',id:'h-'+i}))}).objects.length,48);
const original=K.create('explore3d');assert.equal(K.read(original).kind,'explore3d');
assert.doesNotThrow(()=>new vm.Script(original['game.js']),'El motor generado compila');
assert.match(original['game.js'],/o\.type==='house'/);
const newFiles={...original,'game-config.js':K.configFile(engine.normalise({kind:'explore3d',objects:[{type:'car',id:'car-1',x:1,z:2,size:1,height:1,color:'#123456'}]}))};
assert.equal(K.read(newFiles).objects[0].type,'car');
for(const id of ['city','forest','track']){
 const p=tool.template(id);
 assert.ok(p.objects.length>10&&p.objects.length<=48,id+' tiene objetos');
 assert.equal(new Set(p.objects.map(o=>o.id)).size,p.objects.length,'sin IDs duplicados');
 const cfg=engine.normalise({...p,title:'Prueba '+id});
 const result=tool.validate(cfg);
 assert.equal(result.route,true,id+' debe permitir llegar al portal');
 assert.equal(result.ok,true,id+' tiene recompensa accesible');
 assert.ok(result.crystals>=1,id+' tiene recompensas');
}
assert.equal(tool.template('untrusted'),null);
const exported=tool.exportObj(engine.normalise(tool.template('city')));
assert.match(exported,/^# Krueka/);
assert.match(exported,/o kit-0-house_pared/);
assert.match(exported,/\nv [-\d.]+ [-\d.]+ [-\d.]+\n/);
assert.match(exported,/\nf \d+ \d+ \d+ \d+\n/);
assert.ok(exported.length<150000,'OBJ exportable aun en PC simple');
const closed=engine.normalise({objects:[{type:'wall',id:'one',x:0,z:11,size:3,height:2,color:'#aaaaaa'}]});
assert.ok(tool.validate(closed).warnings.some(w=>w.includes('punto de salida')));
assert.equal(engine.normalise({objects:[{type:'invalid',label:'<img src=x onerror=alert(1)>',size:9999,color:'javascript:alert(1)',x:Infinity}]}).objects[0].type,'crate');
const app=fs.readFileSync(path.join(root,'app.html'),'utf8');
const access=js('club-studio-access.js');
const studio=fs.readFileSync(path.join(root,'studio.html'),'utf8');
assert.ok(app.indexOf('club-studio-3d-toolbox.js')>app.indexOf('club-studio-3d.js'));
assert.ok(access.includes("'club-studio-academy.js','club-studio-3d-toolbox.js'"));
assert.ok(studio.includes('club-studio-access.js?v=20261023b'));
async function importTests(){
 let saved=null,changed=0;
 const s={cloudReady:true,busy:false,files:original,validFiles:x=>x,checkpoint(){},changed(){changed++},refreshAll(){},lock(){}};
 const incoming={format:'krueka-scene',version:1,scene:{kind:'explore3d',objects:[{type:'car',id:'nuevo',x:2,z:1,size:1,height:1,color:'#336699'}]}};
 assert.equal(await tool.importScene(s,{size:2000,text:async()=>JSON.stringify(incoming)}),true);
 assert.equal(K.read(s.files).objects[0].type,'car');
 assert.equal(changed,1);
 await assert.rejects(()=>tool.importScene(s,{size:2000,text:async()=>JSON.stringify({...incoming,scene:{objects:Array.from({length:70},()=>({type:'car'}))}})}),/máximo/);
 await assert.rejects(()=>tool.importScene(s,{size:2000,text:async()=>JSON.stringify({...incoming,format:'otro'})}),/no es un archivo/);
 await assert.rejects(()=>tool.importScene(s,{size:80000,text:async()=>''}),/50 KB/);
 assert.equal(changed,1,'Las importaciones rechazadas no deben modificar el proyecto');
 console.log('PASS: motor 3D, tipos, plantillas jugables, validación de rutas, importación segura y accesos privados.');
}
importTests().catch(e=>{console.error(e);process.exitCode=1});
