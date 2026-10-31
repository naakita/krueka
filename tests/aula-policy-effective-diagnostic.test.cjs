const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const ui=read('js/aula-control.js'),ps=read('windows/DIAGNOSTICAR-REGLAS-REALES-KRUEKA.ps1');
const cmd=read('windows/COMPROBAR-REGLAS-REALES-KRUEKA.cmd'),app=read('app.html');
new vm.Script(ui);
assert.match(app,/js\/aula-control\.js\?v=20261031a/);
assert.match(ui,/Reglas guardadas en Windows/);
assert.match(ui,/no las directivas efectivas del navegador/);
assert.match(ui,/edge:\/\/policy/);
assert.match(ui,/chrome:\/\/policy/);
assert.match(ui,/Permiso guardado en Krueka/);
assert.match(ui,/La versión aplicada solo comprueba el Registro/);
for(const a of [/HKEY_LOCAL_MACHINE/,/HKEY_CURRENT_USER/,/HKEY_USERS/,
 /URLAllowlist/,/URLBlocklist/,/Get-ScheduledTask/,
 /Krueka-PolicySync/,/Krueka-Conector-PC/,/ALERTA: HAY DOS SINCRONIZADORES ACTIVOS/,
 /MISMA cuenta del alumno/,/edge:\/\/policy/,/chrome:\/\/policy/])assert.match(ps,a);
for(const dangerous of [/Set-ItemProperty/,/New-ItemProperty/,/Remove-ItemProperty/,
 /New-NetFirewallRule/,/Set-NetFirewallRule/,/Set-ScheduledTask/,/Register-ScheduledTask/,
 /schtasks\.exe/,/reg\.exe\s+(?:add|delete|import)/,/Invoke-RestMethod/])assert.doesNotMatch(ps,dangerous);
assert.match(cmd,/DIAGNOSTICAR-REGLAS-REALES-KRUEKA\.ps1/);
console.log('PASS: menú no confunde Registro con navegador y diagnóstico local es de solo lectura.');
