/* Academia Krueka · cursos y matrículas. Solo datos docentes autenticados por RPC. */
(function(){
'use strict';
var BASE='https://janebfpnknapvntfqolf.supabase.co';
var PUB='sb_publishable_mSuSFqWycvm9dQQzjpeaRA_kAyZOJl0';
var doc=document;
function $(id){return doc.getElementById(id);}
function el(tag,text,className){var n=doc.createElement(tag);if(text!==undefined&&text!==null)n.textContent=String(text);if(className)n.className=className;return n;}
function text(node,content){node.textContent=String(content||'');}
function hide(node,v){if(node)node.hidden=!!v;}
function err(e){return e&&e.message||'No se pudo completar la operación.';}
function setStatus(id,message,error){var n=$(id);if(!n)return;text(n,message);n.className=error?'result warn':'result good';}
async function rpc(name,body){
 var resp=await fetch(BASE+'/rest/v1/rpc/'+name,{method:'POST',headers:{'Content-Type':'application/json','apikey':PUB},body:JSON.stringify(body)});
 var data=await resp.json();
 if(!resp.ok||!data.ok)throw Error(data.error||data.message||'No se pudo completar la operación.');
 return data;
}
var teacher=null,dashboard={students:[],courses:[]},student=null,token=null,studentCourses=[],current=null;
var newCodes=[];
var teacherRoot=$('academy-manager');
if(!teacherRoot){teacherRoot=el('section');teacherRoot.id='academy-manager';var board=$('teacher-board');if(board)board.insertBefore(teacherRoot,board.querySelector('.preview-grid'));}
teacherRoot.className='academy-management';
teacherRoot.innerHTML='<div id="am-status" class="result">Cargando matrícula...</div>'+
'<div class="am-columns"><section class="am-box"><h2>Alumnos y códigos personales</h2>'+
'<form id="am-student-form"><label for="am-name">Nombre del alumno</label><input id="am-name" required minlength="3" maxlength="100" placeholder="Nombre y apellido"><button class="btn" type="submit">+ Inscribir alumno</button></form>'+
'<div id="am-code-result" class="result good" hidden></div><p class="small muted">Cada código se muestra al generarlo o renovarlo. Guardá una copia: no se almacena en texto legible y no es posible recuperarlo después.</p>'+
'<button id="am-export" class="btn secondary" type="button">Descargar códigos generados</button><div id="am-students"></div></section>'+
'<section class="am-box"><h2>Cursos disponibles</h2><div id="am-courses"></div>'+
'<details class="am-editor"><summary>+ Crear un nuevo curso</summary>'+
'<form id="am-course-form"><label for="am-title">Nombre del curso</label><input id="am-title" minlength="4" maxlength="120" required placeholder="Ej.: Primeros pasos con Excel">'+
'<label for="am-summary">Descripción</label><textarea id="am-summary" maxlength="600" placeholder="Qué van a aprender"></textarea>'+
'<div id="am-lessons"></div><button id="am-add-lesson" type="button" class="btn secondary">+ Agregar lección</button>'+
'<button type="submit" class="btn">Guardar curso en borrador</button><p class="small muted">Primero guardá el curso, después publicalo y asignalo a los estudiantes.</p></form></details></section></div>';
var studentBox=el('section');studentBox.id='am-student-area';studentBox.className='card am-student-area';studentBox.hidden=true;
studentBox.innerHTML='<div class="teacher-head"><div><span class="pill">MI ACADEMIA KRUEKA</span><h1 id="am-hello">Mis cursos</h1><p class="muted">Aquí aparecen únicamente los cursos habilitados por tu docente.</p></div><button class="btn secondary" type="button" id="am-student-logout">Salir de la Academia</button></div>'+
'<p id="am-student-status" class="small muted" role="status" aria-live="polite"></p><div id="am-catalog" class="am-catalog"></div><div id="am-lesson-view" hidden></div>';
var main=doc.querySelector('#app main');if(main)main.appendChild(studentBox);
function btn(label,handler,style){var b=el('button',label,'btn '+(style||'secondary'));b.type='button';b.addEventListener('click',handler);return b;}
function paragraph(t){return el('p',t,'small muted');}
function displayOnce(name,code){
 newCodes.push({name:name,code:code});
 var target=$('am-code-result');target.replaceChildren();
 target.appendChild(el('strong','Código de '+name+':'));
 var v=el('p',code,'am-code');target.appendChild(v);
 target.appendChild(btn('Copiar código',function(){
   if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(code).catch(function(){});
   else {var tmp=el('textarea');tmp.value=code;doc.body.appendChild(tmp);tmp.select();doc.execCommand('copy');tmp.remove();}
 },'secondary'));
 hide(target,false);
}
function addLessonEditor(){
 var n=$('am-lessons').children.length;
 if(n>=12){setStatus('am-status','Máximo 12 lecciones por curso.',true);return;}
 var field=el('fieldset');field.className='am-lesson-editor';
 field.appendChild(el('legend','Lección '+(n+1)));
 var title=el('input');title.maxLength=100;title.required=true;title.placeholder='Título (ej. ¿Qué es una hoja de cálculo?)';title.setAttribute('aria-label','Título de la lección');
 var theory=el('textarea');theory.maxLength=3000;theory.required=true;theory.placeholder='Explicación paso a paso de al menos 30 caracteres';theory.setAttribute('aria-label','Explicación de la lección');
 var task=el('textarea');task.maxLength=1400;task.required=true;task.placeholder='Actividad práctica que debe realizar el alumno';task.setAttribute('aria-label','Actividad de la lección');
 field.append(title,theory,task);$('am-lessons').appendChild(field);
}
function lessonsFromEditor(){
 return Array.from($('am-lessons').children).map(function(f){
 var fields=f.querySelectorAll('input,textarea');return {title:fields[0].value.trim(),theory:fields[1].value.trim(),task:fields[2].value.trim()};
 });
}
async function manage(action,payload){
 if(!teacher)throw Error('Iniciá sesión como docente.');
 var r=await teacher.rpc('academia_teacher_manage',{p_action:action,p_payload:payload||{}});
 if(r.error)throw r.error;if(!r.data||!r.data.ok)throw Error(r.data&&r.data.error||'La operación fue rechazada.');
 return r.data;
}
async function loadTeacher(client){
 teacher=client;
 try{var d=await manage('dashboard',{});dashboard={students:d.students||[],courses:d.courses||[]};renderTeacher();setStatus('am-status','Alumnos: '+dashboard.students.length+' · Cursos: '+dashboard.courses.length,false);}
 catch(e){setStatus('am-status',err(e),true);}
}
async function mutate(action,payload,message){
 try{var d=await manage(action,payload);await loadTeacher(teacher);if(message)setStatus('am-status',message,false);return d;}
 catch(e){setStatus('am-status',err(e),true);throw e;}
}
function renderTeacher(){renderStudents();renderCourses();}
function renderStudents(){
 var host=$('am-students');host.replaceChildren();
 if(!dashboard.students.length){host.appendChild(paragraph('Todavía no hay alumnos. Inscribí uno para generar su código.'));return;}
 dashboard.students.forEach(function(s){
  var box=el('article');box.className='am-record';
  var title=el('h3',s.name+(s.active?'':' (inactivo)'));box.appendChild(title);
  box.appendChild(paragraph('Código protegido · emitilo nuevamente si se perdió.'));
  var row=el('div');row.className='actions';
  row.appendChild(btn('Nuevo código',async function(){
    if(!confirm('El código anterior de '+s.name+' dejará de funcionar. ¿Continuar?'))return;
    try{var result=await mutate('student_code_reset',{student_id:s.id},'Código renovado.');displayOnce(s.name,result.code);}catch(e){}
  }));
  row.appendChild(btn(s.active?'Desactivar':'Activar',async function(){
    if(s.active&&!confirm('¿Desactivar a '+s.name+'? Perderá el acceso hasta su reactivación.'))return;
    try{await mutate('student_active',{student_id:s.id,active:!s.active},'Acceso actualizado.');}catch(e){}
  }));
  row.appendChild(btn('Cambiar nombre',async function(){
    var newName=prompt('Nombre del alumno:',s.name);if(newName===null)return;
    try{await mutate('student_rename',{student_id:s.id,name:newName.trim()},'Nombre actualizado.');}catch(e){}
  }));
  box.appendChild(row);
  var label=el('p','Cursos permitidos:','small');box.appendChild(label);
  dashboard.courses.forEach(function(c){
    var wrap=el('label');wrap.className='am-check';
    var input=el('input');input.type='checkbox';input.checked=Array.isArray(s.enrollments)&&s.enrollments.indexOf(c.id)!==-1;
    input.addEventListener('change',async function(){
      input.disabled=true;var old=!input.checked;
      try{await mutate('assign',{student_id:s.id,course_id:c.id,active:input.checked},'Cursos asignados a '+s.name+'.');}
      catch(e){input.checked=old;}finally{input.disabled=false;}
    });
    wrap.append(input,doc.createTextNode(c.title+(c.published?'':' (borrador)')));box.appendChild(wrap);
  });
  host.appendChild(box);
 });
}
function renderCourses(){
 var host=$('am-courses');host.replaceChildren();
 dashboard.courses.forEach(function(c){
  var box=el('article');box.className='am-record';
  box.appendChild(el('h3',c.title));
  box.appendChild(paragraph((c.kind==='intro'?'Curso integrado · ':'Curso propio · ')+(c.published?'Publicado':'Borrador')));
  box.appendChild(paragraph(c.summary||'Sin descripción.'));
  box.appendChild(btn(c.published?'Ocultar curso':'Publicar curso',async function(){
    try{await mutate('course_publish',{course_id:c.id,published:!c.published},c.published?'Curso ocultado.':'Curso publicado.');}catch(e){}
  }));
  host.appendChild(box);
 });
}
$('am-student-form').addEventListener('submit',async function(event){
 event.preventDefault();var name=$('am-name').value.trim();
 try{var r=await mutate('student_add',{name:name},'Alumno inscrito correctamente.');displayOnce(name,r.code);$('am-student-form').reset();}
 catch(e){}
});
$('am-export').onclick=function(){
 if(!newCodes.length){setStatus('am-status','No hay códigos recién generados en esta sesión. Creá o renová uno primero.',true);return;}
 var data='KRUEKA ACADEMIA · CÓDIGOS PERSONALES\n\n'+newCodes.map(function(x){return x.name+'\t'+x.code;}).join('\n')+
 '\n\nGuardá esta lista en lugar seguro. No la compartas públicamente.';
 var blob=new Blob([data],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download='academia-codigos.txt';a.click();setTimeout(function(){URL.revokeObjectURL(url);},1000);
};
$('am-add-lesson').onclick=addLessonEditor;addLessonEditor();
$('am-course-form').addEventListener('submit',async function(e){
 e.preventDefault();
 var title=$('am-title').value.trim(),summary=$('am-summary').value.trim(),lessons=lessonsFromEditor();
 try{await mutate('course_add',{title:title,summary:summary,lessons:lessons},'Curso creado como borrador. Publicalo cuando esté listo.');$('am-course-form').reset();$('am-lessons').replaceChildren();addLessonEditor();}
 catch(error){}
});
function showStudentCourses(){
 if(!token)return;
 hide($('entry'),true);hide($('login'),true);hide($('teacher-login'),true);hide($('teacher-board'),true);
 hide($('academy'),true);hide($('logout'),true);
 hide(studentBox,false);hide($('am-lesson-view'),true);hide($('am-catalog'),false);
 text($('am-hello'),'Mis cursos · '+(student&&student.name||'Alumno'));
 renderStudentCourses();
}
async function studentLogin(code,device){
 var login=await rpc('academia_student_login',{p_code:code,p_device:device});
 token=login.token;student=login.student;
 await refreshStudentCourses();
 showStudentCourses();
}
async function refreshStudentCourses(){
 var d=await rpc('academia_student_courses',{p_token:token});
 student=d.student;studentCourses=d.courses||[];
}
function renderStudentCourses(){
 var host=$('am-catalog');host.replaceChildren();
 if(!studentCourses.length){host.appendChild(paragraph('Tu docente todavía no habilitó cursos para vos. Consultale qué clase vas a comenzar.'));return;}
 studentCourses.forEach(function(c){
   var box=el('article');box.className='am-record';
   box.appendChild(el('h2',c.title));
   box.appendChild(paragraph(c.summary));
   box.appendChild(btn('Comenzar curso →',function(){
     current=c;
     if(c.kind==='intro'){
       hide(studentBox,true);
       if(typeof window.AcademiaOpenIntro==='function')window.AcademiaOpenIntro(c,token,student);
       else {hide(studentBox,false);setStatus('am-student-status','No se pudo abrir el curso. Recargá la página.',true);}
     }else openCustom(c);
   }));
   host.appendChild(box);
 });
}
async function openCustom(c){
 var host=$('am-lesson-view');hide($('am-catalog'),true);hide(host,false);
 text($('am-student-status'),'Abriendo '+c.title+'...');
 var state={version:1,entries:{}};
 try{var data=await rpc('academia_student_progress',{p_token:token,p_course:c.id});if(data.data&&data.data.entries)state=data.data;}
 catch(e){text($('am-student-status'),err(e));return;}
 function render(){
   host.replaceChildren();
   host.appendChild(btn('← Volver a mis cursos',showStudentCourses));
   host.appendChild(el('h2',c.title));
   (c.lessons||[]).forEach(function(lesson,i){
     var box=el('article');box.className='am-record';
     box.appendChild(el('span','Lección '+(i+1),'step'));
     box.appendChild(el('h3',lesson.title));
     box.appendChild(el('p',lesson.theory,'am-preserve'));
     box.appendChild(el('h4','Tu actividad'));
     box.appendChild(el('p',lesson.task,'am-preserve'));
     var done=!!(state.entries&&state.entries['l'+i]&&state.entries['l'+i].done);
     box.appendChild(btn(done?'✓ Realizada':'Marcar lección realizada',async function(){
       var previous=JSON.parse(JSON.stringify(state));
       state.entries=state.entries||{};
       state.entries['l'+i]={done:!done,date:new Date().toISOString()};
       try{await rpc('academia_student_progress',{p_token:token,p_course:c.id,p_data:state});text($('am-student-status'),'Progreso guardado en Krueka.');render();}
       catch(e){state=previous;text($('am-student-status'),err(e));}
     },done?'secondary':''));
     host.appendChild(box);
   });
 }
 render();text($('am-student-status'),'Leé cada explicación, realizá la práctica y marcá tus avances.');
}
$('am-student-logout').onclick=async function(){
 var old=token;token=null;student=null;studentCourses=[];current=null;
 hide(studentBox,true);
 try{if(old)await rpc('academia_student_logout',{p_token:old});}catch(e){}
 if(typeof window.AcademiaGoHome==='function')window.AcademiaGoHome();
};
window.AcademiaPortal={loadTeacher:loadTeacher,studentLogin:studentLogin,showStudentCourses:showStudentCourses};
})();