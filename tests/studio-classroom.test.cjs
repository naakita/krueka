const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),env={console,JSON,Object,Array,Math,Number,String,Date,Set};env.window=env;vm.createContext(env);
for(const file of ['club-studio-kits.js','club-studio-3d.js','club-studio-missions.js','club-studio-classroom.js'])vm.runInContext(fs.readFileSync(path.join(root,'js',file),'utf8'),env);
const original=env.StudioKits.create('stars'),before=JSON.stringify(original);
let result=env.StudioClassroom.localChange(original,'Cambiá vidas a 5 y tiempo a 90, velocidad 180, meta 15, escenario bosque, personaje robot');
let cfg=env.StudioKits.read(result.files);
assert.equal(cfg.lives,5);assert.equal(cfg.seconds,90);assert.equal(cfg.speed,180);assert.equal(cfg.target,15);assert.equal(cfg.theme,'forest');assert.equal(cfg.avatar,'🤖');
assert.equal(result.files['game.js'],original['game.js'],'El motor se conserva');assert.equal(JSON.stringify(original),before,'No muta el proyecto original');
result=env.StudioClassroom.localChange(original,'vidas 500 tiempo 1 velocidad 10000 meta 0');cfg=env.StudioKits.read(result.files);
assert.equal(cfg.lives,9);assert.equal(cfg.seconds,15);assert.equal(cfg.speed,500);assert.equal(cfg.target,1);
assert.equal(env.StudioClassroom.localChange(original,'Agregá un dragón que hable').files,undefined);
assert.equal(env.StudioClassroom.localChange(original,'No cambies vidas 5').files,undefined);
assert.equal(env.StudioClassroom.localChange({'index.html':'<h1>Personalizado</h1>'},'vidas 5').files,undefined);
const scene=env.StudioKits.create('space3d');result=env.StudioClassroom.localChange(scene,'luces alerta roja, velocidad 3,5, vidas 4');cfg=env.StudioKits.read(result.files);
assert.equal(cfg.lighting,'alert');assert.equal(cfg.speed,3.5);assert.equal(result.files['game.js'],scene['game.js']);
assert.deepEqual(JSON.parse(JSON.stringify(cfg.objects)),JSON.parse(JSON.stringify(env.StudioKits.read(scene).objects)));
const source=fs.readFileSync(path.join(root,'js/club-studio-ai.js'),'utf8'),begin=source.indexOf('  async queuedAI(body){'),end=source.indexOf('\n  updateAI(',begin);
let waiting=0;const context=vm.createContext({Math,Promise,Error,document:{querySelector:()=>null,getElementById:()=>({})},setTimeout:fn=>{waiting++;queueMicrotask(fn)}});
const queue=vm.runInContext('({'+source.slice(begin,end).replace(/,\s*$/,'')+'})',context);
(async()=>{
 let attempts=0;const client={request:async()=>{if(++attempts<4)throw Object.assign(Error('En uso'),{code:attempts===1?'cooldown':'busy'});return {ok:true}}};
 assert.equal((await queue.queuedAI.call(client,{action:'ai'})).ok,true);assert.equal(attempts,4);assert.equal(waiting,3);
 for(const code of ['invalid_change','budget','daily_limit','timeout',undefined]){
  attempts=0;await assert.rejects(queue.queuedAI.call({request:async()=>{attempts++;throw Object.assign(Error('Falla'),{code})}},{}));assert.equal(attempts,1,'No reintenta '+code);
 }
 attempts=0;await assert.rejects(queue.queuedAI.call({request:async()=>{attempts++;throw Object.assign(Error('Ocupado'),{code:'busy'})}},{}));assert.equal(attempts,8,'Espera acotada');
 let active=0,max=0,completed=0;
 const provider=async()=>{if(active>=3)throw Object.assign(Error('Ocupado'),{code:'busy'});active++;max=Math.max(max,active);await new Promise(r=>setImmediate(r));active--;completed++;return {ok:true}};
 context.setTimeout=fn=>setImmediate(fn);
 const answers=await Promise.all(Array.from({length:10},()=>queue.queuedAI.call({request:provider},{})));
 assert.equal(answers.length,10);assert.equal(completed,10);assert.equal(max,3);
 console.log('PASS: cambios locales acotados, motor intacto, pedidos no reconocidos, reglas 3D y cola de diez alumnos con tres turnos simultáneos.');
})().catch(e=>{console.error(e);process.exitCode=1});
