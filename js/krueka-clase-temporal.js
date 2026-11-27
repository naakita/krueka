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
let sb=null,classes=[],selected=null,items=[],guidePreview=null,guideBlob=null,materialPreview=null;
let materialUrls=[],materialRequestId=0;
let classPage=0,classMeta={total:0,page:0,page_size:12},classRequestId=0,classSearchTimer=null;
const materialQueues=new Map();
let newMaterialQueue=null,createdActivityId=null,createBusy=false,materialSession=0;
function resetPdf(){
 guidePreview?.destroy();guidePreview=null;guideBlob=null;
 $('student-pdf-frame').replaceChildren();
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
  guideBlob=pdf;
  if(!materialPreview||!$('student-materials').querySelector('.preview-surface'))
   guidePreview=window.KruekaMaterialPreview.open($('student-pdf-frame'),pdf,name||'actividad.pdf');
  message('pdf-message','');
 }catch(err){if(normalizeCode($('student-code').value)===code)message('pdf-message',err.message,true);}
}
$('open-guide').addEventListener('click',()=>{
 if(!guideBlob)return;
 if(!guidePreview||$('student-pdf-frame').hidden)
  guidePreview=window.KruekaMaterialPreview.open($('student-pdf-frame'),guideBlob,$('student-pdf-name').textContent||'actividad.pdf');
 guidePreview.expand();
});

const MAX_MATERIALS=20,MAX_MATERIAL_BYTES=10*1024*1024;
function validateMaterials(files){
 if(files.length>MAX_MATERIALS)throw Error('Se permiten hasta 20 materiales por actividad.');
 for(const file of files){
  if(file.size<1)throw Error('"'+file.name+'" está vacío.');
  if(file.size>MAX_MATERIAL_BYTES)throw Error('"'+file.name+'" supera los 10 MB por archivo.');
 }
}
function materialId(){
 if(typeof crypto.randomUUID==='function')return crypto.randomUUID();
 const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
 const hex=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
 return hex.slice(0,8)+'-'+hex.slice(8,12)+'-'+hex.slice(12,16)+'-'+hex.slice(16,20)+'-'+hex.slice(20);
}
const pendingMaterials=queue=>queue.entries.filter(entry=>entry.state!=='uploaded');
function reconcileMaterials(queue,materials){
 queue.saved=new Map(materials.map(m=>[m.id,m]));queue.ready=true;
 queue.entries=queue.entries.filter(entry=>entry.state!=='uploaded'||queue.saved.has(entry.id));
 for(const entry of queue.entries){
  if(queue.saved.has(entry.id)){entry.state='uploaded';entry.progress=100;entry.error='';entry.file=null;}
 }
 queue.render();
}
function makeMaterialQueue(input,host,activityId=null){
 const queue={input,host,activityId,entries:[],saved:new Map(),ready:!activityId,busy:false,locked:false,closed:false,notice:'',xhr:null,readVersion:0};
 const add=button('＋ Agregar archivos','secondary',()=>input.click());
 add.setAttribute('aria-label',activityId?'Agregar archivos a esta actividad':'Agregar archivos para los alumnos');
 const summary=el('p','material-queue-summary'),list=el('div','material-queue-list'),notice=el('div','material-queue-notice');
 summary.setAttribute('role','status');summary.setAttribute('aria-live','polite');
 notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');
 const send=activityId?button('Subir archivos','',async()=>{
  try{
   const result=await uploadMaterials(queue.activityId,queue);
   if(result.cancelled)return;
   message('teacher-message',result.failed?'Quedan '+result.failed+' archivo(s) sin subir. Reintentá desde la lista.':'Materiales guardados en la actividad.',!!result.failed);
   await loadClasses();
  }catch(err){queue.notice=err.message;queue.render();}
 }):null;
 host.append(add,summary,list,notice);if(send)host.append(send);
 input.addEventListener('change',()=>{
  if(queue.busy||queue.locked||queue.closed)return;
  const errors=[];
  for(const file of Array.from(input.files||[])){
   try{
    validateMaterials([file]);
    const signature=[file.name,file.size,file.lastModified].join('\u0000');
    if(queue.entries.some(entry=>entry.signature===signature)){errors.push('"'+file.name+'" ya está en la lista.');continue;}
    if(queue.saved.size+pendingMaterials(queue).length>=MAX_MATERIALS)throw Error('No se agregó "'+file.name+'": esta actividad admite hasta 20 materiales.');
    queue.entries.push({id:materialId(),file,name:file.name,size:file.size,signature,state:'pending',progress:0,error:''});
   }catch(err){errors.push(err.message);}
  }
  input.value='';queue.notice=errors.join('\n');queue.render();
 });
 queue.render=()=>{
  const pending=pendingMaterials(queue),uploaded=queue.entries.length-pending.length,disabled=queue.busy||queue.locked||queue.closed;
  add.disabled=disabled||!queue.ready||queue.saved.size+pending.length>=MAX_MATERIALS;
  input.disabled=add.disabled;
  summary.textContent=!queue.ready?'Consultando el espacio disponible…':
   queue.saved.size+pending.length+' de 20 materiales · '+pending.length+' por subir'+(uploaded?' · '+uploaded+' subido(s) de esta lista':'');
  notice.textContent=queue.closed?'Esta clase está cerrada. Los archivos pendientes no se han subido.':queue.notice;
  list.replaceChildren();
  for(const entry of queue.entries){
   const row=el('div','material-queue-row'),info=el('div');row.setAttribute('data-state',entry.state);
   const size=entry.size<1024*1024?Math.ceil(entry.size/1024)+' KB':(entry.size/(1024*1024)).toFixed(1)+' MB';
   const state=entry.state==='uploaded'?'✓ Subido':entry.state==='uploading'?
    (entry.progress===100?'Confirmando en el servidor…':'Subiendo… '+entry.progress+'%'):entry.state==='error'?'No se subió: '+entry.error:'Listo para subir';
   info.append(el('strong','',entry.name),el('small','',size+' · '+state));row.append(info);
   if(entry.state!=='uploaded'){
    const remove=button('Quitar','secondary',()=>{
     queue.entries=queue.entries.filter(item=>item!==entry);queue.notice='';queue.render();add.focus();
    });
    remove.disabled=disabled;remove.setAttribute('aria-label','Quitar '+entry.name+' de la lista');row.append(remove);
   }
   if(entry.state==='uploading'){
    const progress=el('progress');progress.max=100;progress.value=entry.progress;
    progress.setAttribute('aria-label','Subida de '+entry.name);row.append(progress);
   }
   list.append(row);
  }
  if(send){send.hidden=!pending.length;send.disabled=disabled||!queue.ready;send.textContent=queue.busy?'Subiendo archivos…':queue.entries.some(e=>e.state==='error')?'Reintentar pendientes':'Subir '+pending.length+' archivo(s)';}
 };
 queue.render();return queue;
}
function sendMaterial(queue,entry,activityId,accessToken){
 return new Promise((resolve,reject)=>{
  const data=new FormData();
  data.set('action','upload-material');data.set('activity_id',activityId);data.set('upload_id',entry.id);data.set('material',entry.file);
  const xhr=new XMLHttpRequest();queue.xhr=xhr;
  xhr.open('POST',API);xhr.setRequestHeader('apikey',KEY);xhr.setRequestHeader('authorization','Bearer '+accessToken);xhr.timeout=120000;
  xhr.upload.onprogress=e=>{
   if(!e.lengthComputable)return;
   const progress=Math.min(100,Math.round(e.loaded/e.total*100));
   if(progress!==entry.progress){entry.progress=progress;queue.render();}
  };
  xhr.onload=()=>{
   let reply;try{reply=JSON.parse(xhr.responseText);}catch{reject(Error('El servidor no respondió correctamente. Reintentá este archivo.'));return;}
   if(xhr.status<200||xhr.status>=300||!reply.ok){reject(Error(reply.error||'No se pudo subir el archivo.'));return;}
   if(reply.material?.id!==entry.id){reject(Error('No se pudo confirmar este archivo. Reintentá para verificarlo.'));return;}
   resolve(reply.material);
  };
  xhr.onerror=()=>reject(Error('Se interrumpió la conexión. Podés reintentar.'));
  xhr.ontimeout=()=>reject(Error('La subida demoró demasiado. Podés reintentar.'));
  xhr.onabort=()=>reject(Error('Subida cancelada.'));
  xhr.send(data);
 });
}
async function uploadMaterials(activityId,queue){
 if(queue.busy)return {failed:pendingMaterials(queue).length};
 const session=materialSession;queue.readVersion++;queue.busy=true;queue.notice='';queue.render();
 try{
  const existing=await staff('list-materials',{activity_id:activityId});
  if(session!==materialSession)return {cancelled:true};
  reconcileMaterials(queue,existing.materials||[]);
  for(const entry of pendingMaterials(queue)){
   if(session!==materialSession)return {cancelled:true};
   entry.state='uploading';entry.progress=0;entry.error='';queue.render();
   try{
    const accessToken=await token();if(session!==materialSession)return {cancelled:true};
    const material=await sendMaterial(queue,entry,activityId,accessToken);
    if(session!==materialSession)return {cancelled:true};
    queue.saved.set(material.id,material);entry.state='uploaded';entry.progress=100;entry.file=null;
   }catch(err){
    if(session!==materialSession)return {cancelled:true};
    entry.state='error';entry.error=err.message;
   }finally{queue.xhr=null;}
   queue.render();
  }
  const failed=pendingMaterials(queue).length;
  queue.notice=failed?'Conservamos '+failed+' archivo(s) pendiente(s). Reintentá sin volver a elegirlos.':'';
  return {failed};
 }finally{queue.readVersion++;queue.busy=false;if(session===materialSession)queue.render();}
}
function materialCanPreview(material){
 const extension=(String(material.file_name||'').match(/\.([a-z0-9]+)$/i)?.[1]||'').toLowerCase();
 const types={pdf:'application/pdf',jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',gif:'image/gif',
  txt:'text/plain',csv:'text/csv',rtf:'application/rtf',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  odt:'application/vnd.oasis.opendocument.text',ods:'application/vnd.oasis.opendocument.spreadsheet',odp:'application/vnd.oasis.opendocument.presentation',zip:'application/zip'};
 return !!types[extension]&&types[extension]===String(material.mime_type||'').split(';')[0].trim().toLowerCase();
}
function clearMaterials(){
 materialRequestId++;
 materialPreview?.destroy();materialPreview=null;
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
  const previewHost=el('div');previewHost.hidden=true;
  item.append(name);
  if(m.size_bytes)item.append(el('p','note',Math.ceil(m.size_bytes/1024)+' KB'));
  async function view(){
   if(!previewHost.hidden){materialPreview?.destroy();materialPreview=null;return;}
   const request=++materialRequestId;
   const viewButton=bar.querySelector('button');viewButton.disabled=true;viewButton.textContent='Cargando vista…';
   try{
    const blob=await fetchMaterial(code,m.id);
    if(request!==materialRequestId||normalizeCode($('student-code').value)!==code)return;
    materialPreview=window.KruekaMaterialPreview.open(previewHost,blob,m.file_name);
    previewHost.scrollIntoView({behavior:'smooth',block:'nearest'});
   }catch(err){message('materials-message',err.message,true);}
   finally{viewButton.disabled=false;viewButton.textContent='Ver vista previa';}
  }
  if(materialCanPreview(m))bar.append(button('Ver vista previa','secondary',view));
  else item.append(el('p','note','Descargá este archivo para abrirlo con su programa. No tiene vista previa en Krueka.'));
  bar.append(button('↓ Descargar archivo','secondary',async()=>{
   try{
    const blob=await fetchMaterial(code,m.id);
    if(normalizeCode($('student-code').value)!==code)return;
    const url=URL.createObjectURL(blob);materialUrls.push(url);
    const a=document.createElement('a');a.href=url;a.download=m.file_name;document.body.append(a);a.click();a.remove();
   }catch(err){message('materials-message',err.message,true);}
  }));
  item.append(bar,previewHost);$('student-materials-list').append(item);
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
  if(g.has_pdf)loadStudentPdf(code,g.pdf_name);
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
newMaterialQueue=makeMaterialQueue($('new-pdf'),$('new-material-queue'));
function creationControls(){
 for(const id of ['new-grade','new-subject','new-title','new-instructions'])$(id).disabled=createBusy||!!createdActivityId;
 $('create-button').disabled=createBusy;
 $('create-button').textContent=createBusy?'Guardando actividad y archivos…':createdActivityId?'Reintentar archivos pendientes':'+ Crear actividad y generar código';
}
function clearMaterialQueues(){
 materialSession++;
 for(const queue of [newMaterialQueue,...materialQueues.values()]){
  queue.xhr?.abort();queue.entries=[];queue.saved.clear();queue.notice='';queue.busy=false;queue.locked=false;
 }
 materialQueues.clear();createdActivityId=null;createBusy=false;
 newMaterialQueue.ready=true;newMaterialQueue.render();$('create-form').reset();creationControls();
}
window.addEventListener('beforeunload',e=>{
 if(createBusy||[newMaterialQueue,...materialQueues.values()].some(queue=>queue.busy||pendingMaterials(queue).length)){
  e.preventDefault();e.returnValue='';
 }
});
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
 e.preventDefault();if(createBusy)return;
 message('teacher-message','');createBusy=true;creationControls();
 const queue=newMaterialQueue,session=materialSession;
 queue.locked=true;queue.render();
 try{
  if(!createdActivityId){
   const files=pendingMaterials(queue).map(entry=>entry.file);validateMaterials(files);
   const instructions=$('new-instructions').value.trim()||(files.length?'Revisá los materiales de esta actividad, realizá el trabajo solicitado y entregá tu archivo aquí.':'');
   if(!files.length&&instructions.length<15)throw Error('Escribí una consigna de al menos 15 caracteres o adjuntá un documento.');
   const r=await staff('create-class',{
    grade:$('new-grade').value,subject:$('new-subject').value,
    title:$('new-title').value,instructions
   });
   if(session!==materialSession)return;
   createdActivityId=r.activity.id;showCode(r.code);
  }
  queue.locked=false;
  const result=pendingMaterials(queue).length?await uploadMaterials(createdActivityId,queue):{failed:0};
  if(session!==materialSession||result.cancelled)return;
  if(result.failed){
   message('teacher-message','La actividad y su código ya están creados. Quedan '+result.failed+' archivo(s) por subir. Reintentá los pendientes; se conservará el mismo código.',true);
   resetClassFilters();await loadClasses();return;
  }
  const count=queue.saved.size;
  $('create-form').reset();queue.entries=[];queue.saved.clear();queue.notice='';createdActivityId=null;queue.render();
  resetClassFilters();await loadClasses();
  if(session===materialSession)message('teacher-message','Actividad creada'+(count?' con '+count+' material(es).':'.')+' Compartí el código con tus alumnos.');
 }catch(err){if(session===materialSession)message('teacher-message',(createdActivityId?'La actividad ya está creada. Conservamos los archivos pendientes. ':'')+err.message,true);}
 finally{if(session===materialSession){createBusy=false;queue.locked=false;queue.render();creationControls();}}
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
  let queue=materialQueues.get(c.id);
  if(c.accepting&&!queue){
   const input=el('input');input.type='file';input.multiple=true;input.hidden=true;
   input.setAttribute('aria-label','Elegí archivos para '+c.title);
   const host=el('div','material-panel');host.append(input,el('p','note','Cualquier tipo de archivo · Hasta 20 materiales por actividad · 10 MB por archivo. Podés agregarlos en varias tandas.'));
   queue=makeMaterialQueue(input,host,c.id);materialQueues.set(c.id,queue);
  }
  if(queue){queue.closed=!c.accepting;queue.render();}
  const materialsBox=el('div','note','Cargando materiales…');
  card.append(materialsBox);
  const materialRead=queue?++queue.readVersion:0;
  (async()=>{
   try{
    const r=await staff('list-materials',{activity_id:c.id});
    materialsBox.replaceChildren();
    const files=r.materials||[];
    if(queue&&!queue.busy&&materialRead===queue.readVersion)reconcileMaterials(queue,files);
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
   }catch(err){
    materialsBox.textContent='No se pudo cargar la lista de materiales. Usá Actualizar para reintentar.';
    if(queue){queue.notice=err.message;queue.render();}
   }
  })();
  const actions=el('div','toolbar');
  actions.append(button('📂 Ver entregas','secondary',async()=>{
   selected=c;$('selected-title').textContent=c.title;$('submissions-panel').hidden=false;
   $('submissions-panel').scrollIntoView({behavior:'smooth',block:'start'});await loadSubmissions();
  }));
  if(c.accepting){
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
  card.append(actions);if(queue)card.append(queue.host);$('classes').append(card);
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
 clearMaterialQueues();$('classes').replaceChildren();
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
