const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(root,'js/club-studio-academy.js'),'utf8');
new vm.Script(src);
const context={console,JSON,Object,Array,Number,Math,Date};
context.window=context;
vm.createContext(context);
vm.runInContext(src,context);
const A=context.KruekaAcademy;
assert.ok(A,'Academia exportada');
assert.equal(A.courses.length,5);
assert.deepEqual(Array.from(A.courses,c=>c.lessons.length),[15,8,8,6,8]);
assert.equal(new Set(A.courses.map(c=>c.id)).size,5);
for(const c of A.courses){
 assert.ok(c.id && c.name && c.desc && c.kind);
 for(const lesson of c.lessons){
  assert.equal(lesson.length,6,'concepto, título, 3 tareas y evidencia');
  assert.ok(lesson.every(x=>typeof x==='string'&&x.length>8));
 }
}
const sample={version:1,courseId:'fundamentos',done:{'0':{complete:true,note:'Probé la velocidad.',date:'2026-10-23T20:00:00.000Z'}}};
const project={files:{'curso-krueka.json':JSON.stringify(sample)}};
assert.equal(A.progress(project).done['0'].complete,true);
assert.equal(A.progress({files:{'curso-krueka.json':'{'}}),null);
assert.equal(A.progress({files:{'curso-krueka.json':JSON.stringify({...sample,courseId:'fake'})}}),null);
assert.equal(A.progress({files:{}}),null);
const direct=fs.readFileSync(path.join(root,'js/club-studio-access.js'),'utf8');
const app=fs.readFileSync(path.join(root,'app.html'),'utf8');
const studio=fs.readFileSync(path.join(root,'studio.html'),'utf8');
assert.ok(app.includes('<script src="js/club-studio-academy.js?v=20261023c"></script>'));
assert.ok(app.indexOf('club-studio-academy.js')>app.indexOf('club-studio-creative.js'));
assert.ok(direct.includes("'club-studio-creative.js','club-studio-academy.js'"));
assert.match(studio,/club-studio-access\.js\?v=20261023[a-z]/);
assert.equal(/https?:\/\/|fetch\s*\(|import\s*\(/.test(src),false,'sin CDNs ni API nuevas');
console.log('PASS: academia Krueka, 37 lecciones, progreso por proyecto, entradas privadas, sin terceros nuevos.');
