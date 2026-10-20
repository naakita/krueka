/* Krueka · actividades temporales por código.
 * El servidor valida toda solicitud; esta interfaz no guarda documentos ni códigos del alumno.
 */
(function(){
'use strict';
const BASE='https://janebfpnknapvntfqolf.supabase.co';
const KEY='sb_publishable_mSuSFqWycvm9dQQzjpeaRA_kAyZOJl0';
const API=BASE+'/functions/v1/krueka-actividades-clase';
const $=id=>document.getElementById(id);
const teacherMode=new URLSearchParams(location.search).get('docente')==='1';
$('student').hidden=teacherMode;$('teacher').hidden=!teacherMode;
let sb=null,classes=[],selected=null,items=[];
function message(id,text,error=false){
 const node=$(id);node.replaceChildren();if(!text)return;
 const el=document.createElement('div');el.className='notice '+(error?'error':'success');el.textContent=text;node.append(el);
}
function el(tag,cl,text){
 const n=document.createElement(tag);if(cl)n.className=cl;
 if(text!==undefined)n.textContent=text;return n;
}
function button(label,cls,callback){
 const n=el('button','btn '+(cls||''),label);n.type='button';n.addEventListener('click',callback);return n;
}
async function api(body,token){
 const form=body instanceof FormData;
 const headers={apikey:KEY,...(token?{authorization:'Bearer '+token}:{})};
 if(!form)headers['Content-Type']='application/json';
 const res=await fetch(API,{method:'POST',headers,body:form?body:JSON.stringify(body),cache:'no-store'});
 let reply;try{reply=await res.json();}catch{throw Error('El servidor no respondió correctamente.');}
 if(!res.ok||!reply.ok)throw Error(reply.error||'No se pudo completar el pedido.');
 return reply;
}
function normalizeCode(s){return String(s||'').toUpperCase().replace(/[\s-]/g,'');}
$('student-code').addEventListener('input',e=>{e.target.value=e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g,'').slice(0,14);$('activity-view').hidden=true;});
$('lookup-form').addEventListener('submit',async e=>{
 e.preventDefault();message('lookup-message','');
 const code=normalizeCode($('student-code').value);
 if(code.length!==12){message('lookup-message','El código tiene 12 letras o números.',true);return;}
 const btn=$('lookup-button');btn.disabled=true;
 try{
  const res=await api({action:'lookup',code});
  const g=res.activity;
  $('activity-title').textContent=g.title;
  $('activity-info').replaceChildren();
  $('activity-info').append(el('span','',g.grade),el('span','',g.subject));
  $('activity-instructions').textContent=g.instructions;
  $('activity-view').hidden=false;$('upload-form').reset();message('upload-message','');
  $('activity-view').scrollIntoView({behavior:'smooth',block:'start'});
 }catch(err){$('activity-view').hidden=true;message('lookup-message',err.message,true);}
 finally{btn.disabled=false}
});
$('upload-form').addEventListener('submit',async e=>{
 e.preventDefault();message('upload-message','');
 const code=normalizeCode($('student-code').value),file=$('student-file').files[0];
 if(!file||!/.\.(docx|xlsx|pptx|pdf)$/i.test(file.name)||file.size>10*1024*1024){
  message('upload-message','Elegí un archivo Word, Excel, PowerPoint o PDF de hasta 10 MB.',true);return;
 }
 const form=new FormData($('upload-form'));form.set('code',code);
 const btn=$('upload-button');btn.disabled=true;btn.textContent='Enviando trabajo…';
 try{
  const data=await api(form);message('upload-message','✓ '+data.message+'\nComprobante: '+data.receipt);
  $('student-file').value='';
 }catch(err){message('upload-message',err.message,true);}
 finally{btn.disabled=false;btn.textContent='↑ Enviar trabajo al docente';}
});
if(!teacherMode)return;
if(!window.supabase){message('login-message','No pudo cargarse el sistema de inicio de sesión.',true);return;}
sb=window.supabase.createClient(BASE,KEY);
const captcha=()=>document.querySelector('#teacher-login [name="cf-turnstile-response"]')?.value||window.turnstile?.getResponse?.()||'';
const resetCaptcha=()=>{try{window.turnstile?.reset?.();}catch(_){}};
async function token(){
 const {data:{session},error}=await sb.auth.getSession();
 if(error||!session)throw Error('Iniciá sesión con tu cuenta docente.');
 return session.access_token;
}
async function staff(action,payload={}){return api({action,...payload},await token());}
async function loadClasses(){
 const r=await staff('list-classes');classes=r.classes||[];renderClasses();
}
function showCode(code){
 $('new-code').textContent=code;$('new-code-box').hidden=false;
 $('new-code-box').scrollIntoView({behavior:'smooth',block:'center'});
}
async function copyText(text,target){
 try{await navigator.clipboard.writeText(text);target.textContent='✓ Copiado';}
 catch(_){
  const range=document.createRange();range.selectNodeContents($('new-code'));const sel=window.getSelection();
  sel.removeAllRanges();sel.addRange(range);target.textContent='Seleccionado · Ctrl+C';
 }
}
$('copy-code').addEventListener('click',()=>copyText($('new-code').textContent,$('copy-code')));
$('copy-link').addEventListener('click',()=>copyText('https://www.krueka.com/actividades-clase.html',$('copy-link')));
$('create-form').addEventListener('submit',async e=>{
 e.preventDefault();message('teacher-message','');const b=$('create-button');b.disabled=true;
 try{
  const r=await staff('create-class',{
   grade:$('new-grade').value,subject:$('new-subject').value,
   title:$('new-title').value,instructions:$('new-instructions').value
  });
  $('create-form').reset();showCode(r.code);await loadClasses();
 }catch(err){message('teacher-message',err.message,true);}
 finally{b.disabled=false;}
});
function renderClasses(){
 $('classes').replaceChildren();
 if(!classes.length){$('classes').append(el('p','note','No tenés actividades. Creá tu primera clase a la izquierda.'));return;}
 classes.forEach(c=>{
  const card=el('article','item'),header=el('div','activity-head');
  const group=el('div'),title=el('div','itemtitle',c.title),detail=el('small','',c.grade+' · '+c.subject);
  group.append(title,detail);
  header.append(group,el('span','tag'+(!c.accepting?' closed':''),c.accepting?'● Código habilitado':'● Clase cerrada'));
  card.append(header);
  const actions=el('div','toolbar');
  actions.append(button('📂 Ver entregas','secondary',async()=>{
   selected=c;$('selected-title').textContent=c.title;$('submissions-panel').hidden=false;
   $('submissions-panel').scrollIntoView({behavior:'smooth',block:'start'});await loadSubmissions();
  }));
  if(c.accepting){
   actions.append(button('■ Cerrar clase','danger',async()=>{
    if(!confirm('¿Cerrar la clase '+c.title+'? El código dejará de servir para ver la actividad y para entregar archivos. Este cierre es definitivo.'))return;
    try{
     await staff('close-class',{activity_id:c.id});
     message('teacher-message','Clase cerrada. El código ya no permite ver la consigna ni entregar archivos.');
     await loadClasses();
    }catch(err){message('teacher-message',err.message,true);}
   }));
  }
  card.append(actions);$('classes').append(card);
 });
}
async function loadSubmissions(){
 if(!selected)return;
 message('submission-message','');
 try{
  const r=await staff('submissions',{activity_id:selected.id});items=r.items||[];renderSubmissions();
 }catch(err){message('submission-message',err.message,true);}
}
function renderSubmissions(){
 if(!selected)return;
 const needle=$('filter-student').value.trim().toLocaleLowerCase('es');
 const visible=items.filter(x=>!needle||(x.student_name+' '+x.file_name).toLocaleLowerCase('es').includes(needle));
 $('selected-count').textContent=items.length+' entrega(s) recibida(s) · '+items.filter(x=>x.status==='pendiente').length+' pendiente(s)';
 $('submissions').replaceChildren();
 if(!visible.length){$('submissions').append(el('p','note',items.length?'No hay resultados.':'Todavía no llegaron trabajos.'));return;}
 visible.forEach(item=>{
  const box=el('article','submission');
  box.append(el('strong','',item.student_name));
  const date=new Date(item.uploaded_at).toLocaleString('es-PY',{dateStyle:'short',timeStyle:'short'});
  box.append(el('small','',item.file_name+' · '+Math.round(item.size_bytes/1024)+' KB · '+date));
  const bar=el('div','toolbar');
  bar.append(button('↓ Descargar','secondary',async()=>{
   try{
    const r=await staff('download',{activity_id:selected.id,submission_id:item.id});
    if(!r.url.startsWith(BASE+'/storage/v1/object/sign/'))throw Error('La URL de descarga no es válida.');
    window.open(r.url,'_blank','noopener,noreferrer');
   }catch(err){message('submission-message',err.message,true);}
  }));
  box.append(bar);
  const row=el('div','review'),stateGroup=el('div'),notesGroup=el('div');
  const sl=el('label','', 'Estado');stateGroup.append(sl);
  const select=el('select');select.setAttribute('aria-label','Estado de '+item.student_name);
  [['pendiente','Pendiente'],['revisado','Revisado'],['corregir','Necesita corrección']].forEach(([v,t])=>select.add(new Option(t,v)));
  select.value=item.status;stateGroup.append(select);
  const nl=el('label','', 'Observación');notesGroup.append(nl);
  const note=el('input');note.value=item.teacher_note||'';note.maxLength=1000;note.placeholder='Comentario del docente';note.setAttribute('aria-label','Observación de '+item.student_name);notesGroup.append(note);
  row.append(stateGroup,notesGroup,button('Guardar','',async()=>{
   try{
    await staff('review',{activity_id:selected.id,submission_id:item.id,status:select.value,note:note.value});
    item.status=select.value;item.teacher_note=note.value;
    message('submission-message','Corrección guardada.');$('selected-count').textContent=items.length+' entrega(s) · '+items.filter(x=>x.status==='pendiente').length+' pendiente(s)';
   }catch(err){message('submission-message',err.message,true);}
  }));
  box.append(row);$('submissions').append(box);
 });
}
$('refresh-classes').onclick=async()=>{try{await loadClasses()}catch(err){message('teacher-message',err.message,true)}};
$('refresh-submissions').onclick=loadSubmissions;
$('filter-student').oninput=renderSubmissions;
$('sign-out').onclick=async()=>{
 await sb.auth.signOut();$('teacher-board').hidden=true;$('teacher-login').hidden=false;
 selected=null;items=[];$('new-code-box').hidden=true;$('new-code').textContent='';
};
async function enter(){
 // Server validates role before revealing teacher board.
 await staff('list-classes');
 $('teacher-login').hidden=true;$('teacher-board').hidden=false;
 await loadClasses();
}
$('login-form').onsubmit=async e=>{
 e.preventDefault();message('login-message','');const b=$('sign-in');b.disabled=true;
 try{
  const proof=captcha();if(!proof)throw Error('Completá la verificación de seguridad.');
  if(!$('teacher-password').value)throw Error('Escribí tu contraseña o solicitá un enlace por correo.');
  const {error}=await sb.auth.signInWithPassword({
   email:$('teacher-email').value.trim(),password:$('teacher-password').value,
   options:{captchaToken:proof}
  });
  if(error)throw Error(error.message);
  await enter();$('teacher-password').value='';
 }catch(err){message('login-message',err.message,true);resetCaptcha();}
 finally{b.disabled=false;}
};
$('email-link').onclick=async()=>{
 message('login-message','');const b=$('email-link');b.disabled=true;
 try{
  const email=$('teacher-email').value.trim(),proof=captcha();
  if(!email||!email.includes('@'))throw Error('Escribí primero tu correo registrado.');
  if(!proof)throw Error('Completá la verificación de seguridad.');
  const {error}=await sb.auth.signInWithOtp({
   email,options:{shouldCreateUser:false,captchaToken:proof,
   emailRedirectTo:'https://www.krueka.com/actividades-clase.html?docente=1'}
  });
  if(error)throw Error(error.message);
  message('login-message','Si el correo está autorizado, recibirás un enlace para ingresar. Revisá también Spam.');
 }catch(err){message('login-message',err.message,true);}
 finally{resetCaptcha();b.disabled=false;}
};
sb.auth.getSession().then(async({data:{session}})=>{
 if(!session)return;
 try{await enter();}catch(_){/* Sin rol válido: conservar el formulario */ }
});
})();
