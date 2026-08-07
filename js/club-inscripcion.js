/* Inscripción privada al Club B.E.I. · 20260807a */
(function(){
'use strict';
var SUPABASE_URL='https://janebfpnknapvntfqolf.supabase.co';
var SUPABASE_KEY='sb_publishable_mSuSFqWycvm9dQQzjpeaRA_kAyZOJl0';
var dbRegistro=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
var token=new URLSearchParams(location.search).get('t')||'';
var form=document.getElementById('club-form'),msg=document.getElementById('msg'),button=document.getElementById('enviar');
function value(id){return (document.getElementById(id).value||'').trim()}
function show(text,type){msg.textContent=text;msg.className='msg on '+(type||'err')}
function dateISO(d){return d.toISOString().slice(0,10)}
var today=new Date(),youngest=new Date(today.getFullYear()-7,today.getMonth(),today.getDate()),oldest=new Date(today.getFullYear()-18,today.getMonth(),today.getDate()+1);
document.getElementById('nacimiento').max=dateISO(youngest);document.getElementById('nacimiento').min=dateISO(oldest);
if(token.length<24){show('Este enlace de inscripción no es válido. Solicita uno nuevo a dirección de B.E.I.');button.disabled=true}
form.addEventListener('submit',async function(event){
 event.preventDefault();
 if(token.length<24)return;
 if(!form.reportValidity())return;
 var phone=value('telefono').replace(/\D/g,'');
 if(value('alumno').length<5||value('tutor').length<5){show('Escribe el nombre y apellido del estudiante y del responsable.');return}
 if(phone.length<6){show('Escribe un teléfono de contacto válido.');return}
 button.disabled=true;button.textContent='Enviando…';show('Estamos registrando la solicitud.','ok');
 var payload={
  alumno:value('alumno'),fecha_nacimiento:value('nacimiento'),grado:value('grado'),
  tutor:value('tutor'),parentesco:value('parentesco'),telefono:value('telefono'),email:value('email'),
  salud:value('salud'),comentario:value('comentario'),
  confirma_bei:document.getElementById('confirma').checked,
  autoriza_fotos:document.getElementById('fotos').checked
 };
 try{
  var result=await dbRegistro.rpc('club_inscribir_bei',{p_token:token,p:payload});
  if(result.error)throw result.error;
  var data=result.data||{};
  document.getElementById('form-box').hidden=true;document.getElementById('success').hidden=false;
  document.getElementById('success-text').textContent=(data.duplicada?'La solicitud ya estaba registrada. ':'')+'Se asignó al grupo '+(data.grupo||'correspondiente')+'. Dirección la revisará y entregará el código personal.';
  history.replaceState({},document.title,location.pathname);
 }catch(error){show(error.message||'No se pudo enviar la inscripción. Intenta nuevamente.');button.disabled=false;button.textContent='Enviar inscripción'}
});
})();
