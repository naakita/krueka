/* Krueka Aula Control — integrado con Supabase Auth y los roles de Krueka. */
const AulaControl = {
 dominiosBase:["krueka.com","www.krueka.com","janebfpnknapvntfqolf.supabase.co","cdn.jsdelivr.net","challenges.cloudflare.com"],
 cache:{devices:[],requests:[]}, actual:null,
 async api(action,fields={}){
  const {data,error}=await db.functions.invoke("aula-control",{body:{action,...fields}});
  if(error){
   let mensaje="";
   try {
    if(error.context && typeof error.context.json==="function"){
     const detalle=await error.context.json();
     mensaje=String(detalle?.error||detalle?.message||"");
    }
   }catch(_){}
   if(!mensaje && error.context?.status===401) mensaje="La sesión venció. Salí de Krueka y volvé a entrar.";
   if(!mensaje && error.context?.status===403) mensaje="Acceso denegado. Verificá tu institución y los permisos de tu cuenta.";
   throw new Error(mensaje||error.message||"No se pudo conectar con el servidor.");
  }
  if(data?.error)throw new Error(data.error);
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
  const officePendiente=d=>d.desktop_mode==="office" && d.desktop_mode_observed!=="office";
  // La orden enviada no garantiza que Windows haya aplicado el cambio.
  const modoButton=d=>{
   const pendiente=officePendiente(d);
   const next=pendiente?"office":d.desktop_mode==="office"?"edge":"office";
   const label=pendiente?"↻ Reintentar Office":d.desktop_mode==="office"?"Volver a solo Krueka":"Habilitar Word, Excel y PowerPoint";
   return '<button class="btn sm '+(pendiente?'dan':d.desktop_mode==='office'?'sec':'ok')+
    '" onclick="AulaControl.modoOfimatica(\''+d.id+'\',\''+next+'\')">'+label+'</button>';
  };
  const estadoOffice=d=>{
   if(!officePendiente(d))return "";
   const fallido=!!d.kiosk_error&&d.desktop_mode_observed==="edge";
   return '<div class="alert '+(fallido?'err':'info')+'" style="margin-top:10px" role="status">'+
    '<b>'+(fallido?'⚠ Office NO habilitado en Windows':'Office solicitado: falta confirmación de Windows')+'</b>'+
    '<div style="margin-top:5px">'+(fallido
     ? 'El equipo sigue en modo Solo Krueka. Error del agente: '+esc(d.kiosk_error)
     : 'La autorización está guardada en Krueka, pero la PC todavía no confirmó Ofimática.')+'</div>'+
    '<div style="margin-top:5px">Si falla después de cerrar sesión y volver a entrar en Windows, revisá en esa PC los permisos del agente y la configuración de quiosco con una cuenta administradora. No es necesario liberar Internet.</div></div>';
  };
  const actionBtns=d=>'<button class="btn sm '+(d.enabled?'sec':'ok')+'" onclick="AulaControl.bloquear(\''+d.id+'\','+!d.enabled+')">'+(d.enabled?'Liberar navegación':'Restablecer bloqueo')+'</button> ';
  box.innerHTML='<div class="row" style="align-items:center;justify-content:space-between;margin-bottom:15px"><div><h2 style="margin:0">Aula conectada</h2><span class="note">Cambios aplicados por el agente aproximadamente cada 30 segundos.</span></div><div class="row"><button class="btn sec sm" onclick="AulaControl.cargar()">↻ Actualizar</button><button class="btn sm" onclick="AulaControl.crear()">+ Registrar PC</button></div></div>'+
    '<div class="grid3" style="margin-bottom:18px"><div class="kpi"><b>'+ds.length+'</b><span>Computadoras registradas</span></div><div class="kpi"><b>'+ds.filter(alive).length+'</b><span>Conectadas recientemente</span></div><div class="kpi"><b>'+pending.length+'</b><span>Solicitudes pendientes</span></div></div>'+
    (ds.length?ds.map(d=>'<div class="card" style="margin:12px 0"><div class="row" style="align-items:center;justify-content:space-between"><div><b>'+esc(d.label)+'</b> <span class="tag '+(alive(d)?'green':'orange')+'">'+(alive(d)?'Conectada':'Sin conexión reciente')+'</span><div class="note">'+esc(d.id)+' · Quiosco '+(d.kiosk_enabled?'activado':'desactivado')+' · Modo '+(d.desktop_mode==='office'?'Ofimática':'Solo Krueka')+' (PC: '+(d.desktop_mode_observed==='office'?'Ofimática':d.desktop_mode_observed==='edge'?'Solo Krueka':'sin confirmar')+') · '+(d.last_seen?'Última conexión '+new Date(d.last_seen).toLocaleString("es-PY"):'Aún no instalada')+'</div></div><span class="tag '+(d.enabled?'blue':'orange')+'">'+(d.enabled?'Web restringida':'Navegación liberada')+'</span></div>'+
       estadoOffice(d)+
       '<div class="row" style="margin-top:12px"><button class="btn sm" onclick="AulaControl.codigo(\''+d.id+'\')">Generar código</button> '+actionBtns(d)+'<button class="btn sec sm" onclick="AulaControl.agregar(\''+d.id+'\')">+ Autorizar web</button><button class="btn sec sm" onclick="AulaControl.renombrar(\''+d.id+'\')">Renombrar</button>'+modoButton(d)+'<button class="btn sec sm" onclick="AulaControl.renovarToken(\''+d.id+'\')">Nuevo token</button><button class="btn sec sm" onclick="AulaControl.kiosco(\''+d.id+'\','+(!d.kiosk_enabled)+')">'+(d.kiosk_enabled?'Desactivar quiosco':'Activar quiosco')+'</button></div>'+
       '<div class="note" style="margin-top:10px"><b>Brave: sin verificación del bloqueo real</b> (agente '+esc(d.agent_version||'sin versión')+'). La versión del agente no demuestra que Windows impida navegar con Brave.</div>'+ 
       '<div class="note" style="margin-top:10px">Permitidas: '+(d.allowed||[]).map(a=>'<span style="display:inline-flex;gap:4px;margin:3px;padding:4px 6px;border:1px solid var(--line);border-radius:6px">'+esc(a)+(AulaControl.dominiosBase.includes(a)?'':' <button aria-label="Quitar" onclick="AulaControl.quitar(\''+d.id+'\',\''+a+'\')" style="border:0;background:none;color:var(--red);cursor:pointer">×</button>')+'</span>').join('')+'</div></div>').join(''):'<div class="alert info">Todavía no hay PCs. Usá «Registrar PC» y después instalá el agente Windows.</div>')+
    '<div class="alert info" style="margin-top:16px" role="note"><b>Comprobación pendiente de Brave:</b> Krueka todavía no recibe del agente Windows una prueba de bloqueo por navegador. Si una PC abre Internet con Brave, usá el <a href="https://github.com/naakita/krueka/tree/main/windows" target="_blank" rel="noopener noreferrer">comprobador y reparador local de Brave</a> con una cuenta administradora de Windows. No cambia Office ni el bloqueo web de Edge.</div>'+ 
    '<div class="alert info" style="margin-top:10px" role="note"><b>Seguridad al cambiar de cuenta: sin comprobar en Windows.</b> El quiosco puede aplicarse solo a una cuenta. Para que otra sesión no permita Internet libre, usá el <a href="https://github.com/naakita/krueka/tree/main/windows" target="_blank" rel="noopener noreferrer">diagnóstico y protección de todas las sesiones Windows</a> con permiso del administrador del equipo. Cambiar el modo desde el panel no instala estas directivas automáticamente.</div>'+ 
    '<h2 style="margin-top:20px">Solicitudes de alumnos</h2>'+
    (pending.length?pending.map(r=>{const d=ds.find(x=>x.id===r.device_id);return '<div class="stage"><div style="flex:1"><b>'+esc(r.domain)+'</b><div class="note">'+esc(d?.label||'PC')+' · '+esc(r.reason||'Uso educativo')+' · '+new Date(r.created_at).toLocaleString('es-PY')+'</div></div><button class="btn sm ok" onclick="AulaControl.decidir(\''+r.device_id+'\',\''+r.id+'\',true)">Aprobar</button><button class="btn sec sm" onclick="AulaControl.decidir(\''+r.device_id+'\',\''+r.id+'\',false)">Rechazar</button></div>';}).join(''):'<p class="sub">No hay solicitudes pendientes.</p>')+
    '<div class="alert info" style="margin-top:15px">La orden de Ofimática se aplica por Windows, no solo por Krueka. Confirmá que el equipo indique «PC: Ofimática». Si aparece «Office NO habilitado en Windows», se necesita revisar el quiosco o el agente de esa PC.</div>';
 },
 async ejecutar(action,payload,success){
  try{const result=await AulaControl.api(action,payload);if(success)success(result);await AulaControl.cargar();}catch(e){alert(e.message);}
 },
 async crear(){
  const label=prompt("Nombre de la computadora, por ejemplo PC 01 - Club");
  if(!label?.trim())return;
  try{
   const d=await AulaControl.api("create",{label:label.trim()});
   AulaControl.mostrarCredenciales({label,id:d.id,token:d.token,hub_url:d.hub_url},false);
   await AulaControl.cargar();
  }catch(e){alert(e.message);}
 },
 async renovarToken(id){
  const equipo=(AulaControl.cache.devices||[]).find(d=>d.id===id);
  if(!equipo)return alert("No se encontró la computadora.");
  if(!confirm("¿Generar un token nuevo para "+equipo.label+"?\n\nEl token anterior dejará de funcionar. Si el programa ya está instalado, tendrás que actualizar su configuración."))return;
  try{
   const d=await AulaControl.api("rotate_token",{device_id:id});
   AulaControl.mostrarCredenciales({label:d.label,id:d.id,token:d.token,hub_url:d.hub_url},true);
  }catch(e){alert("No se pudo generar un token nuevo: "+e.message);}
 },
 mostrarCredenciales(datos,renovado){
  const existente=document.getElementById("aula-credenciales-overlay");
  if(existente)existente.remove();
  const fondo=document.createElement("div");
  fondo.id="aula-credenciales-overlay";
  fondo.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,.68);z-index:20000;display:flex;align-items:center;justify-content:center;padding:16px";
  const modal=document.createElement("section");
  modal.setAttribute("role","dialog");
  modal.setAttribute("aria-modal","true");
  modal.setAttribute("aria-labelledby","aula-cred-titulo");
  modal.style.cssText="background:var(--panel,#fff);color:var(--tx,#222);border-radius:15px;max-width:630px;width:100%;max-height:90vh;overflow:auto;padding:22px;box-shadow:0 20px 70px rgba(0,0,0,.3)";
  modal.innerHTML='<h2 id="aula-cred-titulo" style="font-size:20px;margin:0 0 8px">'+(renovado?'Token nuevo generado':'Registrar computadora')+'</h2>'+
   '<p class="sub" style="margin-bottom:15px">Estos datos se muestran una sola vez. Copialos y guardalos donde solo tenga acceso el administrador.</p>'+
   '<div id="aula-cred-campos"></div>'+
   '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:18px"><button class="btn" type="button" id="aula-copiar-todo">📋 Copiar todos los datos</button><button class="btn sec" type="button" id="aula-cred-cerrar">Cerrar</button></div>'+
   '<p id="aula-copy-status" role="status" aria-live="polite" style="font-size:12px;min-height:18px;margin:12px 0 0"></p>'+
   '<p class="note" style="margin-top:8px">El token da acceso de esta computadora al servidor. No lo compartas con alumnos ni lo incluyas en capturas.</p>';
  fondo.appendChild(modal);
  document.body.appendChild(fondo);
  const campos=modal.querySelector("#aula-cred-campos");
  const camposData=[["Nombre",String(datos.label)],["ID de PC",String(datos.id)],["Token secreto",String(datos.token)],["Servidor",String(datos.hub_url)]];
  const status=modal.querySelector("#aula-copy-status");
  async function copiar(valor){
   try{
    if(navigator.clipboard&&navigator.clipboard.writeText){
     await navigator.clipboard.writeText(valor);
    }else{
     const temp=document.createElement("textarea");
     temp.value=valor;temp.style.cssText="position:fixed;left:-10000px;top:-10000px";
     document.body.appendChild(temp);
     temp.focus();temp.select();
     const ok=document.execCommand("copy");
     temp.remove();
     if(!ok)throw new Error("copy failed");
    }
    status.textContent="✓ Copiado al portapapeles. Podés pegarlo con Ctrl + V.";
    status.style.color="var(--green,#17804a)";
   }catch(e){
    status.textContent="No fue posible copiar automáticamente. Seleccioná el dato y presioná Ctrl + C.";
    status.style.color="var(--red,#c33)";
   }
  }
  camposData.forEach(([titulo,valor])=>{
   const fila=document.createElement("div");
   fila.style.cssText="margin-bottom:12px";
   const label=document.createElement("label");
   label.textContent=titulo;
   label.style.cssText="display:block;font-weight:600;margin-bottom:5px";
   const alineado=document.createElement("div");
   alineado.style.cssText="display:flex;gap:7px;align-items:center";
   const input=document.createElement("input");
   input.value=valor;input.readOnly=true;input.setAttribute("aria-label",titulo);
   input.style.cssText="flex:1;min-width:0;font-family:Consolas,monospace;font-size:13px";
   input.addEventListener("click",()=>input.select());
   const boton=document.createElement("button");
   boton.type="button";boton.className="btn sec sm";boton.textContent="Copiar";
   boton.setAttribute("aria-label","Copiar "+titulo);
   boton.addEventListener("click",()=>copiar(valor));
   alineado.append(input,boton);
   fila.append(label,alineado);
   campos.appendChild(fila);
  });
  modal.querySelector("#aula-copiar-todo").addEventListener("click",()=>copiar("Nombre: "+datos.label+"\nID: "+datos.id+"\nTOKEN: "+datos.token+"\nServidor: "+datos.hub_url));
  const onKey=e=>{if(e.key==="Escape"){e.preventDefault();cerrar();}};
  const cerrar=()=>{fondo.remove();document.removeEventListener("keydown",onKey);};
  modal.querySelector("#aula-cred-cerrar").addEventListener("click",cerrar);
  document.addEventListener("keydown",onKey);
  modal.querySelector("#aula-copiar-todo").focus();
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
 kiosco(id,kiosk_enabled){
  const msg=kiosk_enabled?'¿Volver a activar el quiosco de Windows?':'¿Salir del quiosco de Windows? Se requiere reiniciar la PC y una cuenta administradora de Windows.';
  if(!confirm(msg))return;
  AulaControl.ejecutar("kiosk",{device_id:id,kiosk_enabled},()=>alert("Orden enviada. Windows aplicará el cambio y requerirá reiniciar o cerrar sesión para que surta efecto."));
 },
 modoOfimatica(id,mode){
  if(!confirm(mode==='office'?'¿Solicitar o reintentar Word, Excel y PowerPoint en esta PC?\n\nLa navegación web seguirá restringida. Si Windows devuelve un error de quiosco, hay que repararlo en esa PC con permisos de administrador.':'¿Volver al quiosco de solo Krueka? Guardá los trabajos de Office antes de cerrar sesión.'))return;
  AulaControl.ejecutar("desktop_mode",{device_id:id,mode},()=>alert("Solicitud registrada, no confirmación de aplicación. Esperá la sincronización y cerrá sesión en Windows o reiniciá la PC. Luego actualizá este panel y comprobá que diga PC: Ofimática. Si aparece un error del quiosco de Windows, debe corregirse localmente."));
 },
 renombrar(id){
  const d=prompt("Nuevo nombre de la PC");
  if(d)AulaControl.ejecutar("rename",{device_id:id,label:d});
 },
 decidir(device_id,request_id,approve){
  AulaControl.ejecutar("decision",{device_id,request_id,approve});
 }
};
