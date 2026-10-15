/* Krueka Aula Control — integrado con Supabase Auth y los roles de Krueka. */
const AulaControl = {
 cache:{devices:[],requests:[]}, actual:null,
 async api(action,fields={}){
  const {data,error}=await db.functions.invoke("aula-control",{body:{action,...fields}});
  if(error||data?.error)throw new Error(data?.error||error?.message||"Servicio no disponible");
  return data;
 },
 async vista(){
  const cont=$("view");
  cont.innerHTML='<h1>Control de computadoras</h1><p class="sub">Gestioná las PCs del aula desde Krueka, con autorizaciones individuales y códigos temporales.</p><div id="aula-cuerpo" class="card"><div class="spinner">Consultando computadoras…</div></div>';
  await AulaControl.cargar();
 },
 async cargar(){
  try{
   const data=await AulaControl.api("list");
   AulaControl.cache=data;AulaControl.render();
  }catch(e){const c=$("aula-cuerpo");if(c)c.innerHTML='<div class="alert err">'+esc(e.message)+'</div><button class="btn sec" onclick="AulaControl.cargar()">Reintentar</button>';}
 },
 render(){
  const box=$("aula-cuerpo");if(!box)return;
  const ds=AulaControl.cache.devices||[],rs=AulaControl.cache.requests||[];
  const alive=d=>d.last_seen&&(Date.now()-Date.parse(d.last_seen)<125000);
  const pending=rs.filter(r=>r.status==="pending");
  const actionBtns=d=>'<button class="btn sm '+(d.enabled?'sec':'ok')+'" onclick="AulaControl.bloquear(\''+d.id+'\','+!d.enabled+')">'+(d.enabled?'Liberar navegación':'Restablecer bloqueo')+'</button> ';
  box.innerHTML='<div class="row" style="align-items:center;justify-content:space-between;margin-bottom:15px"><div><h2 style="margin:0">Aula conectada</h2><span class="note">Cambios aplicados por el agente aproximadamente cada 30 segundos.</span></div><div class="row"><button class="btn sec sm" onclick="AulaControl.cargar()">↻ Actualizar</button><button class="btn sm" onclick="AulaControl.crear()">+ Registrar PC</button></div></div>'+
    '<div class="grid3" style="margin-bottom:18px"><div class="kpi"><b>'+ds.length+'</b><span>Computadoras registradas</span></div><div class="kpi"><b>'+ds.filter(alive).length+'</b><span>Conectadas recientemente</span></div><div class="kpi"><b>'+pending.length+'</b><span>Solicitudes pendientes</span></div></div>'+
    (ds.length?ds.map(d=>'<div class="card" style="margin:12px 0"><div class="row" style="align-items:center;justify-content:space-between"><div><b>'+esc(d.label)+'</b> <span class="tag '+(alive(d)?'green':'orange')+'">'+(alive(d)?'Conectada':'Sin conexión reciente')+'</span><div class="note">'+esc(d.id)+' · '+(d.last_seen?'Última conexión '+new Date(d.last_seen).toLocaleString("es-PY"):'Aún no instalada')+'</div></div><span class="tag '+(d.enabled?'blue':'orange')+'">'+(d.enabled?'Web restringida':'Navegación liberada')+'</span></div>'+
       '<div class="row" style="margin-top:12px"><button class="btn sm" onclick="AulaControl.codigo(\''+d.id+'\')">Generar código</button> '+actionBtns(d)+'<button class="btn sec sm" onclick="AulaControl.agregar(\''+d.id+'\')">+ Autorizar web</button><button class="btn sec sm" onclick="AulaControl.renombrar(\''+d.id+'\')">Renombrar</button></div>'+
       '<div class="note" style="margin-top:10px">Permitidas: '+(d.allowed||[]).map(a=>'<span style="display:inline-flex;gap:4px;margin:3px;padding:4px 6px;border:1px solid var(--line);border-radius:6px">'+esc(a)+(a==='krueka.com'?'':' <button aria-label="Quitar" onclick="AulaControl.quitar(\''+d.id+'\',\''+a+'\')" style="border:0;background:none;color:var(--red);cursor:pointer">×</button>')+'</span>').join('')+'</div></div>').join(''):'<div class="alert info">Todavía no hay PCs. Usá «Registrar PC» y después instalá el agente Windows.</div>')+
    '<h2 style="margin-top:20px">Solicitudes de alumnos</h2>'+
    (pending.length?pending.map(r=>{const d=ds.find(x=>x.id===r.device_id);return '<div class="stage"><div style="flex:1"><b>'+esc(r.domain)+'</b><div class="note">'+esc(d?.label||'PC')+' · '+esc(r.reason||'Uso educativo')+' · '+new Date(r.created_at).toLocaleString('es-PY')+'</div></div><button class="btn sm ok" onclick="AulaControl.decidir(\''+r.device_id+'\',\''+r.id+'\',true)">Aprobar</button><button class="btn sec sm" onclick="AulaControl.decidir(\''+r.device_id+'\',\''+r.id+'\',false)">Rechazar</button></div>';}).join(''):'<p class="sub">No hay solicitudes pendientes.</p>')+
    '<div class="alert info" style="margin-top:15px">El quiosco de Windows permanece activo aunque liberes la navegación. Para usar Word, Excel y Godot fuera de Edge, el administrador debe cambiar la configuración de quiosco de esa PC.</div>';
 },
 async ejecutar(action,payload,success){
  try{const result=await AulaControl.api(action,payload);if(success)success(result);await AulaControl.cargar();}catch(e){alert(e.message);}
 },
 async crear(){
  const label=prompt("Nombre de la computadora, por ejemplo PC 01 - Club");
  if(!label?.trim())return;
  try{
   const d=await AulaControl.api("create",{label:label.trim()});
   alert("REGISTRO DE PC — guardá estos datos antes de cerrar\n\nNombre: "+label+"\nID: "+d.id+"\nTOKEN (solo se muestra una vez): "+d.token+"\n\nServidor: "+d.hub_url+"\n\nIntroducí estos datos en el instalador Windows. No los compartas con alumnos.");
   await AulaControl.cargar();
  }catch(e){alert(e.message);}
 },
 codigo(id){
  const v=prompt("¿Cuántos minutos de Internet libre? Elegí 10, 30 o 60.","10");
  if(!v)return;
  AulaControl.ejecutar("code",{device_id:id,minutes:Number(v)},x=>alert("CÓDIGO TEMPORAL\n\n"+x.code+"\n\nVence a los 15 minutos si no se usa.\nPermite "+x.minutes+" minutos de navegación.\nUsar en http://127.0.0.1:47821/"));
 },
 bloquear(id,enabled){
  if(!confirm(enabled?"¿Restablecer bloqueo web en esta PC?":"¿Liberar temporalmente la navegación en Edge y Chrome? El modo quiosco seguirá activo."))return;
  AulaControl.ejecutar("lock",{device_id:id,enabled});
 },
 agregar(id){
  const d=prompt("Dominio autorizado (por ejemplo wikipedia.org)");
  if(d)AulaControl.ejecutar("allow",{device_id:id,domain:d,add:true});
 },
 quitar(id,domain){
  if(confirm("¿Quitar autorización de "+domain+"?"))AulaControl.ejecutar("allow",{device_id:id,domain,add:false});
 },
 renombrar(id){
  const d=prompt("Nuevo nombre de la PC");
  if(d)AulaControl.ejecutar("rename",{device_id:id,label:d});
 },
 decidir(device_id,request_id,approve){
  AulaControl.ejecutar("decision",{device_id,request_id,approve});
 }
};
