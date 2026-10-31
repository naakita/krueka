const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const ui=read('js/aula-control.js');
const edge=read('supabase/functions/aula-control/index.ts');
const ps=read('windows/Krueka-PolicySync.ps1');
const sql=read('supabase/migrations/20261024160000_aula_browser_policy_sync.sql');
const app=read('app.html'),install=read('windows/INSTALAR-SINCRONIZACION-WEB-ADMIN.cmd');
new vm.Script(ui);
assert.match(app,/js\/aula-control\.js\?v=20261026a/);
for(const name of ['policy_pull','policy_report','policy_token','allow_all','lock_all']){
 assert.ok(edge.includes('"'+name+'"'),'Missing backend action '+name);
}
assert.match(edge,/await digest\(token\)/);
assert.match(edge,/policy_token_hash/);
assert.match(edge,/eq\("policy_version",d\.policy_version\)/);
assert.match(edge,/policy_applied_version/);
assert.match(edge,/policy_last_seen/);
assert.match(edge,/policy_apply_error/);
assert.match(edge,/if\(version===d\.policy_version\)/,"Solo confirmar la versión vigente");
assert.match(edge,/update\.policy_applied_version=0/,"No conservar un éxito antiguo tras error local");
assert.match(edge,/update\.policy_applied_at=null/,"Borrar hora de confirmación ante error");
assert.match(edge,/stale:true/,"Ignorar respuestas retrasadas de una tarea anterior");
assert.ok(edge.includes('const {policy_token_hash,...safe}=d'),'hash is stripped from public list');
assert.match(edge,/has_policy_token:!!policy_token_hash/,'only the provisioning boolean is returned');
assert.match(sql,/before update of allowed,enabled/);
assert.match(sql,/new\.policy_version := old\.policy_version \+ 1/);
assert.match(sql,/policy_token_hash text/);
assert.match(sql,/revoke all on function public\.aula_browser_policy_version_bump/);
for(const expr of [
 /URLAllowlist/,/URLBlocklist/,/schtasks\.exe/,/\/SC MINUTE \/MO 1/,
 /\/RU SYSTEM \/RL HIGHEST/,/ProtectedData/,/LocalMachine/,/Read-Host/,
 /SecurityIdentifier|S-1-5-18/,/C:\\?ProgramData|env:ProgramData/,
 /Invoke-RestMethod/,/policy_report/,/policy_pull/,
 /GetPolicyValues/,/WritePolicyValues/,/BackupPolicies/,/RunOnce/]){
 assert.match(ps,expr);
}
assert.match(install,/-Mode Install/);
assert.doesNotMatch(ps,/Rotate_Token|Remove-LocalUser|Remove-AssignedAccess|Set-AssignedAccess|Restart-Service|New-NetFirewallRule|Get-ItemProperty.*token_hash/);
assert.match(ui,/Instalar sincronizador web/);
assert.match(ui,/Permisos pendientes/);
assert.match(ui,/Sincronizador desconectado/);
assert.match(ui,/Autorizar página a todas las PCs/);
assert.match(ui,/Quitar página de todas/);
assert.match(ui,/Restringir Internet en todas/);
const box={innerHTML:''},ctx={
 $:id=>id==='aula-cuerpo'?box:null,esc:s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;'),
 Date,console,db:{}
};
vm.createContext(ctx);vm.runInContext(ui,ctx);
vm.runInContext('AulaControl.cache={devices:[{id:"11111111-1111-1111-1111-111111111111",label:"PC TEST",enabled:true,kiosk_enabled:true,desktop_mode:"office",desktop_mode_observed:"office",agent_version:"0.5",last_seen:new Date().toISOString(),allowed:["krueka.com"],policy_version:3,policy_applied_version:2,policy_last_seen:new Date().toISOString()}],requests:[]};AulaControl.render();',ctx);
assert.match(box.innerHTML,/Permisos pendientes/);
assert.match(box.innerHTML,/Versión 2\/3/);
vm.runInContext('AulaControl.cache.devices[0].policy_applied_version=3;AulaControl.render();',ctx);
assert.match(box.innerHTML,/Permisos aplicados en Windows/);
vm.runInContext('AulaControl.cache.devices[0].policy_last_seen=null;AulaControl.render();',ctx);
assert.match(box.innerHTML,/Sincronizador no instalado/);
console.log('PASS: versionado de permisos web, control aula, token propio y task Windows.');
