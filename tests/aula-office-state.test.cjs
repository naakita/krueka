const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'..');
const code=fs.readFileSync(path.join(base,'js/aula-control.js'),'utf8');
const app=fs.readFileSync(path.join(base,'app.html'),'utf8');
new vm.Script(code);
assert.match(app,/js\/aula-control\.js\?v=20261024b/);
assert.match(code,/desktop_mode_observed/);
assert.match(code,/kiosk_error/);
assert.match(code,/Office NO habilitado en Windows/);
assert.match(code,/Reintentar Office/);

const view={innerHTML:''};
const ctx={
 db:{functions:{}},document:{getElementById:id=>id==='aula-cuerpo'?view:null},
 $:id=>id==='aula-cuerpo'?view:null,
 esc:str=>String(str??'').replace(/&/g,'&amp;').replace(/</g,'&lt;'),
 Date,console
};
vm.createContext(ctx);
vm.runInContext(code,ctx);
vm.runInContext('AulaControl.cache={devices:[{id:"device-id",label:"Equipo de prueba",enabled:true,kiosk_enabled:true,allowed:["krueka.com"],desktop_mode:"office",desktop_mode_observed:"edge",kiosk_error:"Windows no pudo cambiar el quiosco: exit status 1",agent_version:"0.5",last_seen:new Date().toISOString()}],requests:[]};AulaControl.render();',ctx);
assert.match(view.innerHTML,/Office NO habilitado en Windows/);
assert.match(view.innerHTML,/exit status 1/);
assert.match(view.innerHTML,/Reintentar Office/);
assert.match(view.innerHTML,/modoOfimatica\('device-id','office'\)/);
assert.doesNotMatch(view.innerHTML,/modoOfimatica\('device-id','edge'\)/);
vm.runInContext('AulaControl.cache.devices[0].desktop_mode_observed="office";AulaControl.cache.devices[0].kiosk_error="";AulaControl.render();',ctx);
assert.doesNotMatch(view.innerHTML,/<b>⚠ Office NO habilitado en Windows<\/b>/);
assert.match(view.innerHTML,/modoOfimatica\('device-id','edge'\)/);
console.log('PASS: modo enviado distinto del aplicado alerta y no revierte el permiso Office.');
