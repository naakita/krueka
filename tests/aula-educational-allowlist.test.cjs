const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const edge=read('supabase/functions/aula-control/index.ts');
const ui=read('js/aula-control.js');
const app=read('app.html');
const blindar=read('windows/Blindar-Sesiones-Krueka.ps1');
const instalar=read('windows/Configurar-Krueka-Alumnos.ps1');
const local=read('windows/Autorizar-EdClub-CodeOrg-Krueka.ps1');
const sql=read('supabase/migrations/20261024081000_aula_educational_edclub_codeorg.sql');
assert.match(app,/js\/aula-control\.js\?v=20261024c/);
new vm.Script(ui);
for(const hostname of [
 'betesda-educacion.edclub.com','studio.code.org','static.typingclub.com',
 'fonts.googleapis.com','fonts.gstatic.com','videos.code.org','contentful-videos.code.org',
 'codeaiprojects.org','codeprojects.org']){
 assert.ok(edge.includes('"'+hostname+'"'),'Falta en nuevo equipo: '+hostname);
 assert.ok(sql.includes('"'+hostname+'"'),'Falta en migración: '+hostname);
}
assert.match(edge,/allowed:allowed\(EDUCATIONAL_DEFAULTS\)/,'nuevas PCs con permisos predeterminados');
assert.match(ui,/Plataformas educativas:/);
assert.match(ui,/pendientes de sincronización \(PC desconectada\)/);
assert.match(local,/https:\/\/edclub.com/);
assert.match(local,/https:\/\/code.org/);
assert.match(local,/https:\/\/www.google.com\/recaptcha\//);
assert.match(local,/\[ValidateSet\("Comprobar","Aplicar"\)\]/);
assert.match(local,/reg\.exe export/);
assert.doesNotMatch(local,/URLBlocklist|Remove-AssignedAccess|Set-AssignedAccess|Remove-LocalUser|Rotate_Token/);
assert.match(instalar,/https:\/\/edclub.com/);
assert.match(instalar,/https:\/\/code.org/);
assert.match(blindar,/https:\/\/edclub.com/);
assert.match(blindar,/https:\/\/code.org/);
assert.match(sql,/coalesce\(d\.allowed/);
assert.match(sql,/lower\(d\.label\) like '%bei%'/);
assert.doesNotMatch(sql,/enabled\s*=/);
const target={innerHTML:''},context={$:x=>x==='aula-cuerpo'?target:null,esc:String,Date,console,db:{}};
vm.createContext(context);vm.runInContext(ui,context);
vm.runInContext('AulaControl.cache={devices:[{id:"d1",label:"PC TEST",enabled:true,kiosk_enabled:true,desktop_mode:"office",desktop_mode_observed:"office",agent_version:"0.5",last_seen:new Date().toISOString(),allowed:["betesda-educacion.edclub.com","studio.code.org"]}],requests:[]};AulaControl.render()',context);
assert.match(target.innerHTML,/EdClub y Code.org autorizadas en Krueka/);
assert.match(target.innerHTML,/comprobar actividades completas/);
assert.doesNotMatch(target.innerHTML,/Navegación liberada/);
console.log('PASS: permisos BEI, páginas y subdominios, migración, bloqueo web conservado.');
