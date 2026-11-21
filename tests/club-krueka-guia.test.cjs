const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const context={window:{}};
vm.runInNewContext(read('js/club-krueka-guia-data.js'),context,{filename:'club-krueka-guia-data.js'});
const library=context.window.KruekaGuiasCursos;

test('Hay 48 lecciones, dos rutas y seis niveles completos por ruta',()=>{
 assert.equal(library.tracks.length,2);
 assert.deepEqual(Array.from(library.tracks,t=>t.id),['scratch','roblox']);
 const ids=new Set();
 for(const track of library.tracks){
  assert.equal(track.levels.length,6,track.id);
  for(const level of track.levels){
   assert.equal(level.lessons.length,4,level.id);
   for(const lesson of level.lessons){
    assert.ok(!ids.has(lesson.id),'ID duplicado '+lesson.id);ids.add(lesson.id);
    assert.ok(lesson.goal.length>15,lesson.id+' objetivo corto');
    assert.ok(lesson.title.length>7,lesson.id+' título corto');
    assert.ok(lesson.steps.length>=4,lesson.id+' pasos insuficientes');
    for(const step of lesson.steps)assert.ok(step.length>20,lesson.id+' paso impreciso');
    for(const field of ['code','check','challenge','tip'])assert.ok(lesson[field].length>25,lesson.id+' '+field+' ausente');
    assert.ok(library.references[lesson.reference],'Referencia inválida '+lesson.id);
   }
  }
 }
 assert.equal(ids.size,48);
});

test('Los recursos enlazados son documentación oficial y el editor Scratch',()=>{
 assert.ok(library.tracks[0].actionUrl.startsWith('https://scratch.mit.edu/'));
 assert.ok(library.tracks[1].actionUrl.startsWith('https://create.roblox.com/'));
 for(const url of Object.values(library.references))assert.match(url,/^https:\/\/(scratch\.mit\.edu|create\.roblox\.com)\//);
});

test('La biblioteca es independiente de cuentas, cookies de alumno y Supabase',()=>{
 const html=read('club-krueka-guia.html');
 assert.match(html,/club-krueka-guia-data\.js\?v=/);
 assert.match(html,/club-krueka-guia\.js\?v=/);
 assert.match(html,/club-krueka-guia\.css\?v=/);
 assert.doesNotMatch(html,/supabase|studio-code|service_role/i);
 const js=read('js/club-krueka-guia.js');
 assert.match(js,/sessionStorage/);
 assert.doesNotMatch(js,/localStorage|fetch\(|XMLHttpRequest|supabase|innerHTML\s*=/i);
 assert.match(js,/textContent/);
 assert.match(js,/rel='noopener noreferrer'/);
 assert.match(js,/Roblox Studio requiere instalarse/);
});

test('La entrada y Mis talleres enlazan las guías sin cambiar el acceso',()=>{
 for(const name of ['club-krueka.html','studio.html']){
  const html=read(name);
  assert.match(html,/href="club-krueka-guia\.html"/);
  assert.match(html,/studio-login-form/);
  assert.match(html,/club-studio-access\.js\?v=20261121[a-z0-9]+/);
 }
 assert.match(read('js/club-studio-creative.js'),/Guías Scratch y Roblox/);
 assert.match(read('js/club-studio-access.js'),/name==='club-studio-creative\.js'\?'20261121guia1'/);
 assert.match(read('app.html'),/club-studio-creative\.js\?v=20261121guia1/);
});
