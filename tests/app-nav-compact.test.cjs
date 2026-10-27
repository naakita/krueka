const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=n=>fs.readFileSync(path.join(root,n),'utf8');
const core=read('js/core.js'),app=read('app.html'),css=read('css/app-nav-compact.css');
new vm.Script(core);
assert.match(app,/css\/app-nav-compact\.css\?v=20261027a/);
assert.match(app,/js\/core\.js\?v=20261027a/);
assert.match(app,/<nav class="nav" id="nav"/);
assert.match(app,/class="app-resources"/);
assert.match(app,/Galería Krueka/);
assert.match(app,/Krueka Play/);
assert.match(css,/#screen-app \.topbar \.in\{[^}]*flex-wrap:nowrap/);
assert.match(css,/\.nav-main\{[^}]*overflow-x:auto/);
assert.match(css,/@media\(max-width:760px\)/);
assert.match(css,/\.nav-more-panel/);
class El {
 constructor(){this.html='';this.attrs={};this.classList={add(){},remove(){},toggle(){}};this.open=false;}
 set innerHTML(s){this.html=s;}
 get innerHTML(){return this.html;}
 setAttribute(k,v){this.attrs[k]=v;}
 getAttribute(k){return this.attrs[k];}
}
const els=new Map(),listeners={};
function get(id){if(!els.has(id))els.set(id,new El());return els.get(id);}
const doc={
 getElementById:get,
 querySelectorAll(q){
  if(q==="img.marca")return [];
  if(q==="#nav button"){
   return [...get('nav').html.matchAll(/<button\b[^>]*data-k="([^"]+)"[^>]*>/g)]
    .map(m=>({dataset:{k:m[1]},setAttribute(){}}));
  }
  return [];
 },
 querySelector(){return null;},
 addEventListener(t,fn){listeners[t]=fn;},
 createElement(){return new El();}
};
const env={document:doc,window:{},supabase:{createClient(){return {auth:{},from(){return {};}}}},setTimeout,clearTimeout,console,location:{reload(){}},alert(){}};
vm.createContext(env);
vm.runInContext(core,env);
vm.runInContext('const navOriginal=UI.menus.bind(UI);UI.menus=function(){return navOriginal().concat([["asistencia-grado","Asistencia por grado"],["planeamientos","Planeamientos"],["panel","Panel completo"],["auditoria","Auditoría"],["capacidades","Capacidades"],["planilla","Planilla R.S.A."],["club","Club de informática"],["audclub","Auditoría club"],["club-alumnos","Alumnos club"],["club-finanzas","Finanzas club"],["decisions","Decisiones (piloto)"]]);};',env);
vm.runInContext('UI.ir=function(k){St.tab=k;};',env); // La navegación se prueba sin cargar vistas y sin hacer consultas a Supabase.
function check(role,main){
 vm.runInContext('St.perfil={role:"'+role+'"};UI.construirNav();',env);
 const html=get('nav').innerHTML;
 assert.match(html,/<div class="nav-main" role="tablist"/);
 assert.match(html,/<details class="nav-more"/);
 assert.match(html,/class="nav-more-panel"/);
 assert.match(html,/Docencia y actividades/);
 assert.match(html,/Club de Informática/);
 const actual=[...html.matchAll(/<button\b[^>]*data-k="([^"]+)"/g)].map(m=>m[1]);
 const wanted=vm.runInContext('UI.menus().map(x=>x[0])',env);
 assert.equal(actual.length,wanted.length,'All menu entries must remain accessible');
 assert.deepEqual([...actual].sort(),[...wanted].sort(),'Menu keys must be preserved');
 const major=html.split('</div>')[0];
 for(const key of main)assert.match(major,new RegExp('data-k="'+key+'"'));
 for(const key of ['club','audclub','decisions'])assert.doesNotMatch(major,new RegExp('data-k="'+key+'"'));
 assert.ok((major.match(/data-k=/g)||[]).length<=5,'At most five primary entries');
}
check('admin',['control','asistencia-grado','clase','entregas','aula']);
check('docente',['clase','planificacion','alumnos','entregas','aula']);
check('director',['control','asistencia-grado','planes','aula']);
assert.equal(Object.keys(listeners).filter(x=>x==='click').length,1,'Single global outside-click handler');
console.log('PASS: menú compacto por roles, cinco accesos principales y todos los módulos en Más opciones.');
