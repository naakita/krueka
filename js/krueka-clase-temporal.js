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
let sb=null,classes=[],selected=null,items=[],studentPdfUrl=null;
let materialUrls=[];
let classPage=0,classMeta={total:0,page:0,page_size:12},classRequestId=0,classSearchTimer=null;
function resetPdf(){
 if(studentPdfUrl){URL.revokeObjectURL(studentPdfUrl);studentPdfUrl=null;}
 $('student-pdf-frame').removeAttribute('src');
 $('download-guide').removeAttribute('href');
 $('open-guide').removeAttribute('href');
 $('student-pdf').hidden=true;message('pdf-message','');
}
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
async function getPdf(body,accessToken){
 const headers={apikey:KEY,'Content-Type':'application/json',...(accessToken?{authorization:'Bearer '+accessToken}:{})};
 const res=await fetch(API,{method:'POST',headers,body:JSON.stringify(body),cache:'no-store'});
 if(!res.ok){let message='No se pudo cargar la guía PDF.';
  try{const r=await res.json();message=r.error||message;}catch(_){}
  throw Error(message);
 }
 const pdf=await res.blob();
 if(pdf.type!=='application/pdf'||!pdf.size)throw Error('El documento recibido no es un PDF.');
 return pdf;
}
async function loadStudentPdf(code,name){
 resetPdf();
 $('student-pdf').hidden=false;
 $('student-pdf-name').textContent=name||'Documento de la actividad';
 message('pdf-message','Cargando el PDF…');
 try{
  const pdf=await getPdf({action:'guide',code});
  if(normalizeCode($('student-code').value)!==code||$('activity-view').hidden)return;
  studentPdfUrl=URL.createObjectURL(pdf);
  $('student-pdf-frame').src=studentPdfUrl;
  $('download-guide').href=studentPdfUrl;
  $('open-guide').href=studentPdfUrl;
  $('download-guide').download=name||'actividad.pdf';
  message('pdf-message','');
 }catch(err){if(normalizeCode($('student-code').value)===code)message('pdf-message',err.message,true);}
}

const materialExt=/\.(pdf|docx|xlsx|pptx|doc|xls|ppt|odt|ods|odp|txt|csv|rtf|jpg|jpeg|png|webp|gif|zip)$/i;
function validateMaterials(files){
 if(files.length>20)throw Error('Se permiten hasta 20 materiales por actividad.');
 for(const file of files){
  if(!materialExt.test(file.name)||file.size<1||file.size>10*1024*1024)
   throw Error('Revisá "'+file.name+'": formato no admitido o tamaño superior a 10 MB.');
 }
}
async function uploadMaterials(activityId,files){
 validateMaterials(files);
 const results=[];
 for(const file of files){
  const data=new FormData();
  data.set('action','upload-material');data.set('activity_id',activityId);data.set('material',file);
  try{await api(data,await token());results.push(file.name);}
  catch(err){throw Error('Se subieron '+results.length+' archivo(s), pero falló "'+file.name+'": '+err.message);}
 }
 return results.length;
}
function clearMaterials(){
 for(const url of materialUrls)URL.revokeObjectURL(url);
 materialUrls=[];
 $('student-materials').hidden=true;
 $('student-materials-list').replaceChildren();
 message('materials-message','');
}
async function fetchMaterial(code,id){
 const response=await fetch(API,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},
  body:JSON.stringify({action:'material',code,material_id:id}),cache:'no-store'});
 if(!response.ok){
  let msg='No se pudo abrir el archivo.';
  try{const data=await response.json();msg=data.error||msg;}catch(_){}
  throw Error(msg);
 }
 return response.blob();
}
function renderStudentMaterials(code,materials){
 clearMaterials();
 if(!materials.length)return;
 $('student-materials').hidden=false;
 for(const m of materials){
  const item=el('div','item'),name=el('strong','',m.file_name),bar=el('div','toolbar');
  item.append(name);
  if(m.size_bytes)item.append(el('p','note',Math.ceil(m.size_bytes/1024)+' KB'));
  const pdf=m.mime_type==='application/pdf',img=/^image\//.test(m.mime_type);
  async function open(download){
   const target=download?null:window.open('about:blank','_blank');
   try{
    const blob=await fetchMaterial(code,m.id);
    if(normalizeCode($('student-code').value)!==code){target?.close();return;}
    const url=URL.createObjectURL(blob);materialUrls.push(url);
    if(download){
     const a=document.createElement('a');a.href=url;a.download=m.file_name;document.body.append(a);a.click();a.remove();
    }else if(target){target.location.href=url;}
    else{message('materials-message','El navegador bloqueó la pestaña. Usá Descargar.',true);}
   }catch(err){target?.close();message('materials-message',err.message,true);}
  }
  if(pdf||img)bar.append(button('↗ Ver archivo','secondary',()=>open(false)));
  bar.append(button('↓ Descargar','secondary',()=>open(true)));
  item.append(bar);$('student-materials-list').append(item);
 }
}
function normalizeCode(s){return String(s||'').toUpperCase().replace(/[\s-]/g,'');}
$('student-code').addEventListener('input',e=>{e.target.value=e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g,'').slice(0,14);$('activity-view').hidden=true;resetPdf();clearMaterials();});
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
  resetPdf();renderStudentMaterials(code,g.materials||[]);
  if(g.has_pdf&&!(g.materials||[]).length)loadStudentPdf(code,g.pdf_name);
  $('activity-view').scrollIntoView({behavior:'smooth',block:'start'});
 }catch(err){$('activity-view').hidden=true;resetPdf();clearMaterials();message('lookup-message',err.message,true);}
 finally{btn.disabled=false}
});
$('upload-form').addEventListener('submit',async e=>{
 e.preventDefault();message('upload-message','');
 const code=normalizeCode($('student-code').value),file=$('student-file').files[0];
 if(!file||!/\.(docx|xlsx|pptx|pdf)$/i.test(file.name)||file.size>10*1024*1024){
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
async function uploadGuide(activityId,file){
 if(!file||!(/\.pdf$/i).test(file.name)||file.size>10*1024*1024||file.size<100)
  throw Error('Seleccioná un archivo PDF válido de hasta 10 MB.');
 const data=new FormData();
 data.set('action','upload-guide');data.set('activity_id',activityId);data.set('guide',file);
 return api(data,await token());
}
function classFilters(){
 return {page:classPage,search:$('class-search').value.trim(),
  grade:$('class-grade').value.trim(),status:$('class-status').value,
  month:$('class-month').value,sort:$('class-sort').value};
}
async function loadClasses(){
 const request=++classRequestId;
 $('class-results').textContent='Buscando actividades…';
 const r=await staff('list-classes',classFilters());
 if(request!==classRequestId)return; // Ignorar resultados de filtros anteriores.
 classes=r.classes||[];
 classMeta={total:Number(r.total)||0,page:Number(r.page)||0,page_size:Number(r.page_size)||12};
 if(classPage>0&&!classes.length&&classMeta.total>0){
  classPage=Math.max(0,Math.ceil(classMeta.total/classMeta.page_size)-1);
  return loadClasses();
 }
 renderClasses();
}
function resetClassFilters(){
 $('class-search').value='';$('class-grade').value='';
 $('class-status').value='all';$('class-month').value='';$('class-sort').value='recent';
 classPage=0;
}
function scheduleClassLoad(delayed=false){
 classPage=0;clearTimeout(classSearchTimer);
 const go=()=>loadClasses().catch(err=>message('teacher-message',err.message,true));
 if(delayed)classSearchTimer=setTimeout(go,280);else go();
}
function renderClassPages(){
 const target=$('class-pages');target.replaceChildren();
 const {total,page_size}=classMeta;
 if(total<=page_size)return;
 const pages=Math.ceil(total/page_size);
 const prev=button('← Anteriores','secondary',()=>{classPage--;loadClasses().catch(err=>message('teacher-message',err.message,true));});
 const next=button('Siguientes →','secondary',()=>{classPage++;loadClasses().catch(err=>message('teacher-message',err.message,true));});
 prev.disabled=classPage<=0;next.disabled=classPage>=pages-1;
 target.append(prev,el('span','note','Página '+(classPage+1)+' de '+pages),next);
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
  const files=Array.from($('new-pdf').files);
  validateMaterials(files);
  const instructions=$('new-instructions').value.trim()||(files.length?'Revisá los materiales de esta actividad, realizá el trabajo solicitado y entregá tu archivo aquí.':'');
  if(!files.length&&instructions.length<15)throw Error('Escribí una consigna de al menos 15 caracteres o adjuntá un documento.');
  const r=await staff('create-class',{
   grade:$('new-grade').value,subject:$('new-subject').value,
   title:$('new-title').value,instructions
  });
  showCode(r.code);
  if(files.length){
   try{await uploadMaterials(r.activity.id,files);}
   catch(err){
    message('teacher-message','La actividad y el código se crearon, pero hubo un problema con los materiales: '+err.message+' Podés completarlos desde Mis clases.',true);
    resetClassFilters();await loadClasses();return;
   }
  }
  $('create-form').reset();resetClassFilters();await loadClasses();
  message('teacher-message','Actividad creada'+(files.length?' con '+files.length+' material(es).':'.')+' Compartí el código con tus alumnos.');
 }catch(err){message('teacher-message',err.message,true);}
 finally{b.disabled=false;}
});
function renderClasses(){
 $('classes').replaceChildren();
 const {total,page_size}=classMeta;
 const start=total?classPage*page_size+1:0;
 const end=Math.min((classPage+1)*page_size,total);
 $('class-results').textContent=total
  ?'Mostrando '+start+'–'+end+' de '+total+' actividad(es) · Ordenadas por fecha'
  :'0 actividades con estos filtros';
 if(!classes.length){
  $('classes').append(el('p','note',total===0?
   'No hay actividades con esos filtros. Probá limpiar filtros o revisar otra fecha.':
   'No hay actividades en esta página. Probá la anterior.'));
  renderClassPages();return;
 }
 classes.forEach(c=>{
  const card=el('article','item'),header=el('div','activity-head');
  const group=el('div'),title=el('div','itemtitle',c.title),detail=el('small','',c.grade+' · '+c.subject);
  group.append(title,detail);
  const created=new Date(c.created_at);
  if(!Number.isNaN(created.getTime()))group.append(el('p','class-date','Creada: '+created.toLocaleString('es-PY',{dateStyle:'short',timeStyle:'short'})));
  if(c.closed_at){
   const closed=new Date(c.closed_at);
   if(!Number.isNaN(closed.getTime()))group.append(el('p','class-date','Cerrada: '+closed.toLocaleString('es-PY',{dateStyle:'short',timeStyle:'short'})));
  }
  header.append(group,el('span','tag'+(!c.accepting?' closed':''),c.accepting?'● Código habilitado':'● Clase cerrada'));
  card.append(header);
  const materialsBox=el('div','note','Cargando materiales…');
  card.append(materialsBox);
  (async()=>{
   try{
    const r=await staff('list-materials',{activity_id:c.id});
    materialsBox.replaceChildren();
    const files=r.materials||[];
    if(!files.length)materialsBox.append(el('p','note','Todavía no hay materiales adjuntos.'));
    files.forEach(m=>{
     const line=el('div','toolbar');
     line.append(el('span','note','📎 '+m.file_name));
     if(c.accepting)line.append(button('Quitar','danger',async()=>{
      if(!confirm('¿Eliminar "'+m.file_name+'" de esta actividad?'))return;
      try{await staff('delete-material',{activity_id:c.id,material_id:m.id});
       message('teacher-message','Material eliminado.');await loadClasses();}
      catch(err){message('teacher-message',err.message,true);}
     }));
     materialsBox.append(line);
    });
   }catch(err){materialsBox.textContent='No se pudo cargar la lista de materiales.';}
  })();
  const actions=el('div','toolbar');
  actions.append(button('📂 Ver entregas','secondary',async()=>{
   selected=c;$('selected-title').textContent=c.title;$('submissions-panel').hidden=false;
   $('submissions-panel').scrollIntoView({behavior:'smooth',block:'start'});await loadSubmissions();
  }));
  if(c.accepting){
   const materialInput=el('input');materialInput.type='file';materialInput.multiple=true;
   materialInput.accept='.pdf,.docx,.xlsx,.pptx,.doc,.xls,.ppt,.odt,.ods,.odp,.txt,.csv,.rtf,.jpg,.jpeg,.png,.webp,.gif,.zip';
   materialInput.hidden=true;
   materialInput.setAttribute('aria-label','Elegí materiales para '+c.title);
   materialInput.addEventListener('change',async()=>{
    const files=Array.from(materialInput.files);if(!files.length)return;
    try{
     await uploadMaterials(c.id,files);
     message('teacher-message',files.length+' material(es) agregados a '+c.title+'.');
     await loadClasses();
    }catch(err){message('teacher-message',err.message,true);}
    finally{materialInput.value='';}
   });
   actions.append(button('＋ Agregar archivos','secondary',()=>materialInput.click()),materialInput);
   actions.append(button('↻ Nuevo código','secondary',async()=>{
    if(!confirm('¿Generar un código nuevo para '+c.title+'? El anterior dejará de funcionar.'))return;
    try{
     const r=await staff('reissue-code',{activity_id:c.id});
     showCode(r.code);message('teacher-message','Código anterior invalidado. Compartí el nuevo.');
    }catch(err){message('teacher-message',err.message,true);}
   }));
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
 renderClassPages();
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
$('class-search').addEventListener('input',()=>scheduleClassLoad(true));
$('class-grade').addEventListener('input',()=>scheduleClassLoad(true));
for(const id of ['class-sort','class-status','class-month']){
 $(id).addEventListener('change',()=>scheduleClassLoad());
}
$('class-clear').addEventListener('click',()=>{resetClassFilters();loadClasses().catch(err=>message('teacher-message',err.message,true));});
$('refresh-submissions').onclick=loadSubmissions;
$('filter-student').oninput=renderSubmissions;
$('sign-out').onclick=async()=>{
 await sb.auth.signOut();$('teacher-board').hidden=true;$('teacher-login').hidden=false;
 classRequestId++;clearTimeout(classSearchTimer);resetClassFilters();
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
