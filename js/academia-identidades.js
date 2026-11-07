/* Krueka ID · Fase 1: reservas de direcciones y seguimiento docente.
   NO crea buzones, NO registra cuentas Google, NO maneja contraseñas de menores. */
(function(){
'use strict';
var doc=document,root=doc.getElementById('academy-identities');
if(!root)return;
var teacher=null,students=[],busy=false,sessionCounter=0;
function $(id){return doc.getElementById(id);}
function node(tag,value,cls){var n=doc.createElement(tag);if(value!==undefined&&value!==null)n.textContent=String(value);if(cls)n.className=cls;return n;}
function add(parent,child){parent.appendChild(child);return child;}
function button(label,handler,cls){var n=node('button',label,'btn '+(cls||'secondary'));n.type='button';n.addEventListener('click',handler);return n;}
function status(message,isError){var n=$('ki-message');n.className=isError?'result warn':'result good';n.textContent=String(message);n.hidden=false;}
function errorMessage(e){return (e&&e.message)||'No se pudo completar la operación.';}
function labelFor(platform){return {classroom:'Google Classroom',codeorg:'Code.org',scratch:'Scratch',tinkercad:'Tinkercad',otra:'Otra plataforma'}[platform]||platform;}
function stateFor(status){return {pendiente:'Sin iniciar',gestionando:'En gestión manual',registrado_manual:'Registrado manualmente',suspendido:'Suspendido'}[status]||status;}
async function api(action,payload){
 if(!teacher)throw Error('La sesión docente no está disponible.');
 var res=await teacher.rpc('academia_identity_manage',{p_action:action,p_payload:payload||{}});
 if(res.error)throw res.error;
 if(!res.data||!res.data.ok)throw Error(res.data&&res.data.error||'Solicitud rechazada.');
 return res.data;
}
async function reload(){
 var currentTeacher=teacher,currentCounter=sessionCounter;
 var r=await api('list',{});
 if(currentTeacher!==teacher||currentCounter!==sessionCounter)return;
 students=r.students||[];
 renderStudents();renderSelect();
 $('ki-count').textContent=students.filter(function(s){return !!s.email;}).length+' direcciones reservadas · '+students.length+' alumnos';
}
async function action(name,payload,success){
 if(busy)return;busy=true;status('Guardando cambios…',false);
 try{var result=await api(name,payload);await reload();status(result.notice||success||'Datos guardados.',false);return result;}
 catch(e){status(errorMessage(e),true);return null;}
 finally{busy=false;}
}
root.innerHTML=
 '<details class="ki-root"><summary><span class="ki-icon">🔐</span> Krueka ID · Correos educativos <span id="ki-count" class="ki-counter"></span></summary>'+
 '<div class="ki-body"><div class="ki-notice"><strong>Etapa de preparación.</strong> Se reservan direcciones <b>@krueka.com</b> pero <b>todavía no son buzones activos</b> ni reciben códigos. No se crean cuentas en Google ni en otros sitios desde este panel.</div>'+
 '<p id="ki-message" class="result" role="status" aria-live="polite">Ingresá como docente para administrar identidades.</p>'+
 '<section class="ki-section"><h3>1. Reservar una dirección educativa</h3>'+
 '<form id="ki-reserve"><label for="ki-student">Alumno registrado en Academia</label><select id="ki-student" required></select>'+
 '<label for="ki-alias">Nombre de la dirección (alias)</label><div class="ki-email-input"><input id="ki-alias" autocomplete="off" maxlength="20" minlength="3" pattern="[a-z][a-z0-9]{2,19}" placeholder="alumno015" spellcheck="false" required><span>@krueka.com</span></div>'+
 '<p class="small muted">El alias debe tener entre 3 y 20 letras o números y empezar por una letra. No uses documentos, contraseñas ni datos sensibles.</p>'+
 '<label class="ki-consent"><input id="ki-consent" type="checkbox" required> Confirmo que existe autorización verificable del responsable para reservar una identidad educativa y gestionar el uso supervisado de servicios externos.</label>'+
 '<button class="btn" type="submit">Reservar dirección · no activa el correo</button></form></section>'+
 '<section class="ki-section"><h3>2. Identidades y plataformas</h3><p class="small muted">El estado de cada plataforma es un registro administrativo, no una alta automática. Nunca ingreses contraseñas de los alumnos en Krueka.</p><div id="ki-students"></div></section>'+
 '<section class="ki-section"><h3>3. Activación real de los correos (pendiente)</h3>'+
 '<ol class="ki-steps"><li>Verificar el proveedor de correo del dominio <code>krueka.com</code> y los registros MX existentes, sin interrumpir los correos institucionales.</li>'+
 '<li>Configurar direcciones o rutas a un buzón supervisado del docente mediante un proveedor autorizado.</li>'+
 '<li>Comprobar la recepción de un mensaje de prueba desde otro dominio antes de entregar la dirección al alumno.</li>'+
 '<li>Para Classroom de menores, verificar la elegibilidad y gestión institucional de Google Workspace for Education o Nonprofits; la dirección por sí sola no concede acceso.</li></ol>'+
 '<p class="small muted">Los alumnos continuarán entrando a Krueka con sus códigos. No se habilita un buzón personal abierto ni acceso libre a mensajes privados.</p></section>'+
 '</div></details>';
function renderSelect(){
 var selector=$('ki-student'),previous=selector.value;
 selector.replaceChildren();
 students.forEach(function(s){
   if(s.email||!s.active)return;
   var opt=node('option',s.name);opt.value=s.student_id;selector.appendChild(opt);
 });
 if(previous&&Array.from(selector.options||[]).some(function(o){return o.value===previous;}))selector.value=previous;
 if(!selector.children.length){var opt=node('option','No hay alumnos pendientes de identidad');opt.value='';selector.appendChild(opt);}
}
function copyAddress(address){
 if(navigator.clipboard&&navigator.clipboard.writeText){
   navigator.clipboard.writeText(address).then(function(){status('Dirección copiada. Todavía no es un correo activo.',false);})
     .catch(function(){status('No se pudo copiar. Seleccioná la dirección manualmente.',true);});
 }else status('Seleccioná la dirección para copiarla manualmente.',true);
}
function renderStudents(){
 var host=$('ki-students');host.replaceChildren();
 if(!students.length){host.appendChild(node('p','Primero registrá alumnos en «Alumnos y códigos personales».','small muted'));return;}
 students.forEach(function(s){
   var card=add(host,node('article',null,'ki-student-card'));
   add(card,node('h4',s.name+(s.active?'':' · Inactivo')));
   if(!s.email){add(card,node('p','Todavía no tiene dirección educativa reservada.','small muted'));return;}
   var email=add(card,node('p',s.email,'ki-address'));
   var copy=button('Copiar dirección',function(){copyAddress(s.email);});
   card.appendChild(copy);
   var state=add(card,node('p',s.consent_verified?'Autorización registrada · correo SIN configurar':'Autorización revocada · cuenta detenida','ki-state'));
   if(!s.consent_verified){
     card.appendChild(button('Revalidar autorización',async function(){
       if(!confirm('Confirmá que existe una nueva autorización verificable del responsable. ¿Continuar?'))return;
       await action('reconsent',{student_id:s.student_id,consent_verified:true},'Nueva autorización registrada.');
     }));
     return;
   }
   if(!s.active){add(card,node('p','Alumno inactivo. Reactivalo desde la matrícula para gestionar sus plataformas.','small muted'));return;}
   var pSection=add(card,node('div',null,'ki-platforms'));
   var existing=s.accounts||[];
   if(existing.length){
     var ul=add(pSection,node('ul','', 'ki-platform-list'));
     existing.forEach(function(account){
       add(ul,node('li',labelFor(account.platform)+' — '+stateFor(account.state)));
     });
   }else add(pSection,node('p','Sin plataformas registradas.','small muted'));
   var controls=add(pSection,node('div',null,'ki-controls'));
   var platform=add(controls,node('select'));platform.setAttribute('aria-label','Plataforma externa de '+s.name);
   ['classroom','codeorg','scratch','tinkercad','otra'].forEach(function(k){
     var o=node('option',labelFor(k));o.value=k;platform.appendChild(o);
   });
   var progress=add(controls,node('select'));progress.setAttribute('aria-label','Estado de inscripción externa');
   [['pendiente','Planificada'],['gestionando','En gestión (manual)'],['registrado_manual','Registrada manualmente'],['suspendido','Suspendida']].forEach(function(entry){
     var option=node('option',entry[1]);option.value=entry[0];progress.appendChild(option);
   });
   var checks=add(pSection,node('div',null,'ki-checks'));
   var confirmTerms=add(checks,node('label',null,'ki-checkline'));
   var check=node('input');check.type='checkbox';add(confirmTerms,check);
   confirmTerms.appendChild(doc.createTextNode(' Revisé autorización, edad mínima y condiciones de la plataforma.'));
   var edu=add(checks,node('label',null,'ki-checkline'));
   var eduCheck=node('input');eduCheck.type='checkbox';add(edu,eduCheck);
   edu.appendChild(doc.createTextNode(' Para Classroom: confirmé una cuenta institucional adecuada (Workspace for Education o Nonprofits).'));
   function syncChecks(){
     var active=progress.value==='gestionando'||progress.value==='registrado_manual';
     checks.hidden=!active;
     edu.hidden=!active||platform.value!=='classroom';
   }
   progress.addEventListener('change',syncChecks);platform.addEventListener('change',function(){
     var stored=existing.find(function(x){return x.platform===platform.value;});
     progress.value=stored?stored.state:'pendiente';confirmTerms.firstChild.checked=!!(stored&&stored.requirements_checked);
     eduCheck.checked=false;syncChecks();
   });
   var saved=existing.find(function(x){return x.platform===platform.value;});
   if(saved)progress.value=saved.state;
   syncChecks();
   card.appendChild(button('Guardar estado externo',async function(){
     var active=progress.value==='gestionando'||progress.value==='registrado_manual';
     if(active&&!confirmTerms.firstChild.checked){
       status('Confirmá primero los requisitos de la plataforma.',true);return;
     }
     if(active&&platform.value==='classroom'&&!eduCheck.checked){
       status('Classroom para menores requiere una cuenta institucional compatible.',true);return;
     }
     await action('platform_set',{
       student_id:s.student_id,platform:platform.value,state:progress.value,
       requirements_checked:active&&confirmTerms.firstChild.checked,
       education_account_verified:active&&platform.value==='classroom'&&eduCheck.checked
     },'Estado anotado manualmente.');
   }));
   card.appendChild(button('Revocar autorización',async function(){
     if(!confirm('Esto bloqueará nuevas gestiones en Krueka. Las cuentas externas deberán suspenderse también en sus propios paneles. ¿Continuar?'))return;
     await action('revoke',{student_id:s.student_id},'Autorización revocada.');
   },'danger'));
 });
}
$('ki-reserve').addEventListener('submit',async function(ev){
 ev.preventDefault();
 var id=$('ki-student').value,alias=$('ki-alias').value.trim().toLowerCase();
 if(!id){status('Primero seleccioná un alumno registrado en Academia.',true);return;}
 if(!$('ki-consent').checked){status('Hace falta autorización verificable del responsable.',true);return;}
 var result=await action('reserve',{student_id:id,alias:alias,consent_verified:true},
     'Dirección reservada. El buzón NO está activado: falta configurar correo y probar la recepción.');
 if(result){$('ki-reserve').reset();status(result.email+' reservada. El buzón todavía no recibe correos.',false);}
});
async function loadTeacher(client){
 teacher=client;
 var currentCounter=++sessionCounter;
 try{await reload();if(currentCounter===sessionCounter)status('Identidades cargadas. Los buzones todavía no están activos.',false);}
 catch(e){if(currentCounter===sessionCounter)status(errorMessage(e),true);}
}
function clear(){
 sessionCounter++;teacher=null;students=[];
 $('ki-students').replaceChildren();
 $('ki-student').replaceChildren();
 $('ki-count').textContent='';
 $('ki-reserve').reset();
 status('Ingresá como docente para administrar las identidades.',false);
}
window.AcademiaIdentidades={loadTeacher:loadTeacher,clear:clear};
})();