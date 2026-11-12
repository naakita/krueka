import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ORIGINS = new Set(["https://krueka.com", "https://www.krueka.com"]);
const STORAGE = "krueka-actividades-clase";
const MAX = 10 * 1024 * 1024;
const MAX_MATERIALS=20;
const URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supa = createClient(URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const MIME: Record<string,string> = {
 ".docx":"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
 ".xlsx":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
 ".pptx":"application/vnd.openxmlformats-officedocument.presentationml.presentation",
 ".pdf":"application/pdf"
};
const escape=(v:unknown,n:number)=>String(v??"").trim().replace(/[\u0000-\u001f\u007f]/g," ").slice(0,n);
const codeOf=(v:unknown)=>String(v??"").toUpperCase().replace(/[\s-]/g,"");
const uuid=(v:unknown)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v??""));
const cors=(req:Request)=>{
 const origin=req.headers.get("origin")||"";
 return {"Access-Control-Allow-Origin":ORIGINS.has(origin)?origin:"https://www.krueka.com",
 "Access-Control-Allow-Methods":"GET,POST,OPTIONS",
 "Access-Control-Allow-Headers":"content-type,authorization,apikey,x-client-info",
 "Cache-Control":"no-store, private","Vary":"Origin"};
};
const json=(req:Request,v:unknown,status=200)=>new Response(JSON.stringify(v),{
 status,headers:{...cors(req),"Content-Type":"application/json; charset=utf-8"}
});
const fail=(req:Request,message:string,status=400)=>json(req,{ok:false,error:message},status);
async function sha(text:string){
 const x=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(text));
 return Array.from(new Uint8Array(x),n=>n.toString(16).padStart(2,"0")).join("");
}
function randomCode(){
 const abc="ABCDEFGHJKLMNPQRSTUVWXYZ23456789",data=new Uint8Array(12);
 crypto.getRandomValues(data);return Array.from(data,n=>abc[n&31]).join("");
}
async function teacher(req:Request){
 const token=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"").trim();
 if(!token)return null;
 const {data:{user},error}=await supa.auth.getUser(token);
 if(error||!user||!user.email_confirmed_at)return null;
 const email=(user.email||"").trim().toLowerCase();
 const {data:p,error:roleErr}=await supa.from("profiles").select("role,activo").eq("id",user.id).maybeSingle();
 if(!roleErr&&p?.activo&&["admin","docente","director"].includes(String(p.role)))return {id:user.id,email};
 // Existing Krueka central admin was granted reviewer access to existing submission modules.
 if(email==="contacto@titanteo.com")return {id:user.id,email};
 return null;
}
function validOOXML(bytes:Uint8Array,ext:string){
 if(bytes.length<200||bytes[0]!==0x50||bytes[1]!==0x4b||bytes[2]!==0x03||bytes[3]!==0x04)return false;
 const text=new TextDecoder("latin1").decode(bytes);
 const needed:Record<string,string>={".docx":"word/document.xml",".xlsx":"xl/workbook.xml",".pptx":"ppt/presentation.xml"};
 if(!text.includes("[Content_Types].xml")||!text.includes(needed[ext]))return false;
 if(/vbaProject\.bin|\.exe|\.dll/i.test(text))return false;
 return true;
}
function validFile(bytes:Uint8Array,ext:string){
 if(ext===".pdf"){
  return bytes.length>=100&&bytes[0]===0x25&&bytes[1]===0x50&&bytes[2]===0x44&&bytes[3]===0x46&&bytes[4]===0x2d;
 }
 return validOOXML(bytes,ext);
}
function safeFileName(s:string){
 return s.replace(/[^A-Za-z0-9 _().\-\u00c0-\u024f]/g,"").replace(/\s+/g," ").slice(0,175)||"trabajo";
}

const MATERIAL_MIME:Record<string,string>={
 ...MIME,
 ".doc":"application/msword",".xls":"application/vnd.ms-excel",".ppt":"application/vnd.ms-powerpoint",
 ".odt":"application/vnd.oasis.opendocument.text",".ods":"application/vnd.oasis.opendocument.spreadsheet",
 ".odp":"application/vnd.oasis.opendocument.presentation",
 ".txt":"text/plain",".csv":"text/csv",".rtf":"application/rtf",
 ".jpg":"image/jpeg",".jpeg":"image/jpeg",".png":"image/png",
 ".webp":"image/webp",".gif":"image/gif",".zip":"application/zip"
};
function validateMaterial(bytes:Uint8Array,ext:string){
 if(ext in MIME)return validFile(bytes,ext);
 if(bytes.length<1)return false;
 const zip=bytes[0]===0x50&&bytes[1]===0x4b&&bytes[2]===0x03&&bytes[3]===0x04;
 if([".odt",".ods",".odp",".zip"].includes(ext)){
  if(!zip)return false;
  const content=new TextDecoder("latin1").decode(bytes);
  if(/(?:^|[/\\])[^/\\]*\.(?:exe|dll|bat|cmd|ps1|js|vbs|scr|msi)(?:\u0000|$)/i.test(content))return false;
  if(ext!==".zip"&&!content.includes("mimetype"))return false;
  return true;
 }
 if([".doc",".xls",".ppt"].includes(ext))
  return bytes.length>=512&&[0xd0,0xcf,0x11,0xe0,0xa1,0xb1,0x1a,0xe1].every((v,i)=>bytes[i]===v);
 if(ext===".png")return [137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v);
 if(ext===".jpg"||ext===".jpeg")return bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 if(ext===".gif")return new TextDecoder().decode(bytes.slice(0,6)).match(/^GIF8[79]a$/)!==null;
 if(ext===".webp")return new TextDecoder().decode(bytes.slice(0,4))==="RIFF"&&new TextDecoder().decode(bytes.slice(8,12))==="WEBP";
 if(ext===".rtf")return new TextDecoder().decode(bytes.slice(0,5))==="{\\rtf";
 if(ext===".txt"||ext===".csv")return !bytes.includes(0)&&!new TextDecoder("utf-8",{fatal:false}).decode(bytes).includes("\ufffd");
 return false;
}
async function materialList(activityId:string){
 const {data,error}=await supa.from("krueka_live_materials")
  .select("id,file_name,mime_type,size_bytes,uploaded_at")
  .eq("activity_id",activityId).order("uploaded_at",{ascending:true}).order("id",{ascending:true}).limit(MAX_MATERIALS);
 if(error)throw Error("No se pudo consultar los materiales.");
 return data||[];
}
async function materialDownload(req:Request,code:string,materialId:string){
 if(!/^[A-HJ-NP-Z2-9]{12}$/.test(code)||!uuid(materialId))
  return fail(req,"Código o archivo no válido.",403);
 const a=await activityByCode(code);
 if(!a)return fail(req,"El código no existe o la clase terminó.",403);
 const {data:m,error}=await supa.from("krueka_live_materials")
  .select("id,object_path,file_name,mime_type").eq("activity_id",a.id).eq("id",materialId).maybeSingle();
 if(error||!m)return fail(req,"Material no encontrado.",404);
 const {data:file,error:downloadError}=await supa.storage.from(STORAGE).download(m.object_path);
 if(downloadError||!file)return fail(req,"No se pudo descargar el material.",503);
 const fresh=await activityByCode(code);
 if(!fresh||fresh.id!==a.id||fresh.code_hash!==a.code_hash)
  return fail(req,"El código dejó de estar disponible.",403);
 const inline=m.mime_type==="application/pdf"||m.mime_type.startsWith("image/");
 const filename=encodeURIComponent(m.file_name).replace(/['()]/g,escape);
 return new Response(file,{headers:{...cors(req),"Content-Type":m.mime_type,
  "Content-Disposition":(inline?"inline":"attachment")+"; filename*=UTF-8''"+filename,
  "X-Content-Type-Options":"nosniff","Content-Security-Policy":"sandbox"}});
}
async function uploadMaterial(req:Request,form:FormData){
 const staff=await teacher(req);
 if(!staff)return fail(req,"Iniciá sesión como docente.",403);
 const id=String(form.get("activity_id")||""),file=form.get("material");
 if(!uuid(id))return fail(req,"Actividad incorrecta.");
 if(!(file instanceof File)||file.size<1||file.size>MAX)
  return fail(req,"Elegí un archivo de hasta 10 MB.");
 const ext=/\.[a-z0-9]+$/i.exec(file.name)?.[0].toLowerCase()||"";
 if(!MATERIAL_MIME[ext])return fail(req,"Tipo de documento no admitido por seguridad.");
 const {data:a,error:ae}=await supa.from("krueka_live_activities")
  .select("id").eq("id",id).eq("teacher_id",staff.id).eq("accepting",true).maybeSingle();
 if(ae||!a)return fail(req,"Clase cerrada o sin autorización.",403);
 const {count,error:ce}=await supa.from("krueka_live_materials")
  .select("id",{count:"exact",head:true}).eq("activity_id",id);
 if(ce)return fail(req,"No se pudo comprobar el límite de archivos.",503);
 if((count||0)>=MAX_MATERIALS)return fail(req,"Cada actividad admite hasta 20 materiales.",400);
 const bytes=new Uint8Array(await file.arrayBuffer());
 if(!validateMaterial(bytes,ext))return fail(req,"El formato o contenido del archivo no es válido.");
 const path="materials/"+id+"/"+crypto.randomUUID()+ext;
 const {error:ue}=await supa.storage.from(STORAGE)
  .upload(path,new Blob([bytes],{type:MATERIAL_MIME[ext]}),
  {contentType:MATERIAL_MIME[ext],upsert:false,cacheControl:"0"});
 if(ue)return fail(req,"No se pudo guardar el documento.",503);
 const name=safeFileName(file.name).slice(0,175);
 const {data:active,error:check}=await supa.from("krueka_live_activities")
  .select("id").eq("id",id).eq("teacher_id",staff.id).eq("accepting",true).maybeSingle();
 if(check||!active){await supa.storage.from(STORAGE).remove([path]);return fail(req,"La clase se cerró durante la carga.",403);}
 const {data:saved,error:se}=await supa.from("krueka_live_materials")
  .insert({activity_id:id,file_name:name,object_path:path,mime_type:MATERIAL_MIME[ext],size_bytes:file.size})
  .select("id,file_name,mime_type,size_bytes,uploaded_at").single();
 if(se||!saved){await supa.storage.from(STORAGE).remove([path]);return fail(req,"No se pudo registrar el archivo o se alcanzó el límite.",503);}
 return json(req,{ok:true,material:saved});
}

async function handleStaff(req:Request,staff:{id:string,email:string},form:Record<string,unknown>){
 const action=String(form.action||"");
 if(action==="list-classes"){
  // Paginación real: no cortar el historial a 100 actividades.
  // Cada consulta se limita al propietario autenticado. No se devuelven códigos ni archivos.
  const pageSize=12;
  const rawPage=Number(form.page??0);
  const page=Number.isSafeInteger(rawPage)&&rawPage>=0&&rawPage<=100000?rawPage:0;
  const search=escape(form.search,80);
  const grade=escape(form.grade,80);
  const status=String(form.status||"all");
  const sort=String(form.sort||"recent");
  const month=String(form.month||"");
  if(!["all","open","closed"].includes(status)||!["recent","oldest"].includes(sort)||
      (month!==""&&!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)))
   return fail(req,"Revisá los filtros del historial.");
  let query=supa.from("krueka_live_activities")
   .select("id,title,grade,subject,accepting,created_at,closed_at,pdf_name",{count:"exact"})
   .eq("teacher_id",staff.id);
  const literal=(v:string)=>v.replace(/[\\%_]/g,(c)=>"\\"+c);
  if(search)query=query.ilike("title","%"+literal(search)+"%");
  if(grade)query=query.ilike("grade","%"+literal(grade)+"%");
  if(status!=="all")query=query.eq("accepting",status==="open");
  if(month){
   const year=Number(month.slice(0,4)),m=Number(month.slice(5,7));
   const start=new Date(Date.UTC(year,m-1,1)).toISOString();
   const end=new Date(Date.UTC(year,m,1)).toISOString();
   query=query.gte("created_at",start).lt("created_at",end);
  }
  const ascending=sort==="oldest";
  const {data,error,count}=await query.order("created_at",{ascending})
   .order("id",{ascending}).range(page*pageSize,(page+1)*pageSize-1);
  if(error)return fail(req,"No se pudieron cargar tus actividades.",503);
  return json(req,{ok:true,classes:data||[],total:count??0,page,page_size:pageSize});
 }
 if(action==="create-class"){
  const title=escape(form.title,140),grade=escape(form.grade,100),
    subject=escape(form.subject,100),instructions=String(form.instructions||"").trim().slice(0,10000);
  if(title.length<4||grade.length<2||subject.length<2||instructions.length<15)
    return fail(req,"Completá el título, curso, materia y una consigna de al menos 15 caracteres.");
  if(/[\u0000-\u0008\u000b\u000e-\u001f]/.test(instructions))
    return fail(req,"La consigna contiene caracteres no admitidos.");
  const code=randomCode(),hash=await sha(code);
  const {data,error}=await supa.from("krueka_live_activities")
    .insert({teacher_id:staff.id,title,grade,subject,instructions,code_hash:hash})
    .select("id,title,grade,subject,accepting,created_at").single();
  if(error||!data)return fail(req,"No se pudo crear la actividad. Probá nuevamente.",503);
  return json(req,{ok:true,activity:data,code,notice:"El código solo se muestra al crearlo; guardalo antes de salir."});
 }
 const id=String(form.activity_id||"");
 if(!uuid(id))return fail(req,"Seleccioná una actividad válida.");
 const {data:activity,error:ae}=await supa.from("krueka_live_activities")
  .select("id,title,teacher_id,accepting,pdf_path,pdf_name").eq("id",id).eq("teacher_id",staff.id).maybeSingle();
 if(ae||!activity)return fail(req,"La actividad no existe o no te pertenece.",404);
 if(action==="list-materials"){
  try{return json(req,{ok:true,materials:await materialList(id)});}
  catch{return fail(req,"No se pudieron consultar los materiales.",503);}
 }
 if(action==="delete-material"){
  if(!activity.accepting)return fail(req,"No se pueden modificar clases cerradas.",403);
  const mid=String(form.material_id||"");
  if(!uuid(mid))return fail(req,"Material incorrecto.");
  const {data:m,error:me}=await supa.from("krueka_live_materials")
   .select("id,object_path").eq("activity_id",id).eq("id",mid).maybeSingle();
  if(me||!m)return fail(req,"El archivo no existe.",404);
  const {error:de}=await supa.from("krueka_live_materials").delete()
   .eq("activity_id",id).eq("id",mid);
  if(de)return fail(req,"No se pudo quitar el archivo.",503);
  if(activity.pdf_path===m.object_path){
   await supa.from("krueka_live_activities").update({pdf_path:null,pdf_name:null})
    .eq("id",id).eq("teacher_id",staff.id);
  }
  await supa.storage.from(STORAGE).remove([m.object_path]);
  return json(req,{ok:true});
 }
 if(action==="reissue-code"){
  if(!activity.accepting)return fail(req,"La clase cerrada no admite nuevos códigos.",403);
  const code=randomCode(),hash=await sha(code);
  const {data,error}=await supa.from("krueka_live_activities")
   .update({code_hash:hash}).eq("id",id).eq("teacher_id",staff.id)
   .eq("accepting",true).select("id,title").maybeSingle();
  if(error||!data)return fail(req,"La clase se cerró o no se pudo renovar el código.",503);
  return json(req,{ok:true,code,notice:"El código anterior dejó de funcionar."});
 }
 if(action==="close-class"){
  if(!activity.accepting)return json(req,{ok:true,already_closed:true});
  const {data,error}=await supa.from("krueka_live_activities")
   .update({accepting:false,closed_at:new Date().toISOString()})
   .eq("id",id).eq("teacher_id",staff.id).eq("accepting",true)
   .select("id,accepting,closed_at").maybeSingle();
  if(error)return fail(req,"No se pudo cerrar la clase. Intentá otra vez.",503);
  // Concurrent close is idempotent. A closed code cannot be reopened in this module.
  return json(req,{ok:true,closed:true,activity:data||{id,accepting:false}});
 }
 if(action==="teacher-guide"){
  if(!activity.pdf_path)return fail(req,"Esta actividad todavía no tiene PDF.",404);
  return await servePdf(req,activity.pdf_path);
 }
 if(action==="submissions"){
  const {data,error}=await supa.from("krueka_live_submissions")
   .select("id,student_name,file_name,mime_type,size_bytes,uploaded_at,status,teacher_note,reviewed_at")
   .eq("activity_id",id).order("uploaded_at",{ascending:false}).limit(500);
  if(error)return fail(req,"No se pudieron ver las entregas.",503);
  return json(req,{ok:true,items:data||[]});
 }
 const itemId=String(form.submission_id||"");
 if(!uuid(itemId))return fail(req,"Seleccioná un trabajo válido.");
 const {data:item,error:ie}=await supa.from("krueka_live_submissions")
   .select("id,activity_id,object_path,file_name").eq("id",itemId).eq("activity_id",id).maybeSingle();
 if(ie||!item)return fail(req,"No se encontró el trabajo en esta clase.",404);
 if(action==="download"){
  const {data,error}=await supa.storage.from(STORAGE)
   .createSignedUrl(item.object_path,90,{download:item.file_name});
  if(error||!data?.signedUrl)return fail(req,"No se pudo preparar la descarga.",503);
  return json(req,{ok:true,url:data.signedUrl,expires_in:90});
 }
 if(action==="review"){
  const status=String(form.status||""),note=escape(form.note,1000);
  if(!["pendiente","revisado","corregir"].includes(status))return fail(req,"Estado de revisión no válido.");
  const {error}=await supa.from("krueka_live_submissions")
   .update({status,teacher_note:note,reviewed_at:status==="pendiente"?null:new Date().toISOString()})
   .eq("id",itemId).eq("activity_id",id);
  if(error)return fail(req,"No se pudo guardar tu devolución.",503);
  return json(req,{ok:true});
 }
 return fail(req,"Acción no permitida.",400);
}
async function servePdf(req:Request,path:string){
 const {data,error}=await supa.storage.from(STORAGE).download(path);
 if(error||!data)return fail(req,"No se pudo abrir el PDF. Avisá al docente.",503);
 return new Response(data,{status:200,headers:{...cors(req),
  "Content-Type":"application/pdf","Content-Disposition":"inline",
  "X-Content-Type-Options":"nosniff"}});
}
async function studentPdf(req:Request,code:string){
 if(!/^[A-HJ-NP-Z2-9]{12}$/.test(code))return fail(req,"Código no válido o clase cerrada.",403);
 const activity=await activityByCode(code);
 if(!activity)return fail(req,"El código no existe o la clase ya terminó.",403);
 if(!activity.pdf_path)return fail(req,"Esta actividad todavía no tiene una guía PDF.",404);
 const {data:file,error}=await supa.storage.from(STORAGE).download(activity.pdf_path);
 if(error||!file)return fail(req,"No se pudo abrir el PDF. Avisá al docente.",503);
 // Una renovación o cierre durante la lectura también invalida la respuesta.
 const {data:live,error:checkError}=await supa.from("krueka_live_activities")
  .select("accepting,pdf_path").eq("id",activity.id).eq("code_hash",activity.code_hash).maybeSingle();
 if(checkError||!live?.accepting||live.pdf_path!==activity.pdf_path)
  return fail(req,"El código dejó de estar disponible. Consultá al docente.",403);
 return new Response(file,{status:200,headers:{...cors(req),
  "Content-Type":"application/pdf","Content-Disposition":"inline",
  "X-Content-Type-Options":"nosniff"}});
}
async function uploadGuide(req:Request,form:FormData){
 const staff=await teacher(req);
 if(!staff)return fail(req,"Ingresá con tu cuenta docente para adjuntar el PDF.",403);
 const id=String(form.get("activity_id")||""),file=form.get("guide");
 if(!uuid(id))return fail(req,"Elegí una actividad válida.");
 if(!(file instanceof File)||file.size<100||file.size>MAX||!/\.pdf$/i.test(file.name))
  return fail(req,"Elegí un archivo PDF de hasta 10 MB.");
 const {data:activity,error:ae}=await supa.from("krueka_live_activities")
  .select("id,pdf_path").eq("id",id).eq("teacher_id",staff.id).eq("accepting",true).maybeSingle();
 if(ae||!activity)return fail(req,"La clase no existe, está cerrada o no te pertenece.",403);
 const bytes=new Uint8Array(await file.arrayBuffer());
 if(!validFile(bytes,".pdf")||!new TextDecoder("latin1").decode(bytes.slice(-2048)).includes("%%EOF"))
  return fail(req,"El documento no tiene un formato PDF válido.");
 const path="guides/"+id+"/"+crypto.randomUUID()+".pdf";
 const {error:uploadError}=await supa.storage.from(STORAGE)
  .upload(path,new Blob([bytes],{type:"application/pdf"}),{contentType:"application/pdf",upsert:false,cacheControl:"0"});
 if(uploadError)return fail(req,"No se pudo subir el PDF. Intentá nuevamente.",503);
 const pdfName=safeFileName(file.name);
 const {data:saved,error:saveError}=await supa.from("krueka_live_activities")
  .update({pdf_path:path,pdf_name:pdfName}).eq("id",id).eq("teacher_id",staff.id)
  .eq("accepting",true).select("id,pdf_name").maybeSingle();
 if(saveError||!saved){
  await supa.storage.from(STORAGE).remove([path]);
  return fail(req,"La clase se cerró o no fue posible asociar el PDF.",503);
 }
 if(activity.pdf_path&&activity.pdf_path!==path)
  await supa.storage.from(STORAGE).remove([activity.pdf_path]);
 return json(req,{ok:true,pdf_name:pdfName,message:"PDF asociado a esta clase."});
}
async function activityByCode(code:string){
 const hash=await sha(code);
 const {data,error}=await supa.from("krueka_live_activities")
  .select("id,title,grade,subject,instructions,accepting,code_hash,pdf_path,pdf_name")
  .eq("code_hash",hash).maybeSingle();
 if(error||!data||!data.accepting)return null;
 return data;
}
async function upload(req:Request){
 if(Number(req.headers.get("content-length")||0)>MAX+32000)
  return fail(req,"El documento supera 10 MB.",413);
 let form:FormData;
 try{form=await req.formData();}catch{return fail(req,"No se pudo leer el documento.",400);}
 if(form.get("action")==="upload-guide")return await uploadGuide(req,form);
 if(form.get("action")==="upload-material")return await uploadMaterial(req,form);
 const code=codeOf(form.get("code")),student=escape(form.get("student"),90),file=form.get("document");
 if(!/^[A-HJ-NP-Z2-9]{12}$/.test(code))return fail(req,"Código no válido o clase cerrada.",403);
 if(student.length<3)return fail(req,"Escribí tu nombre y apellido.");
 if(!(file instanceof File)||file.size>MAX||file.size<100)return fail(req,"Elegí un archivo de hasta 10 MB.");
 const ext=/\.(docx|xlsx|pptx|pdf)$/i.exec(file.name)?.[0].toLowerCase();
 if(!ext||!(ext in MIME))return fail(req,"Solo se admiten archivos Word, Excel, PowerPoint o PDF.");
 const g=await activityByCode(code);
 if(!g)return fail(req,"El código no funciona o el docente cerró la clase.",403);
 const bytes=new Uint8Array(await file.arrayBuffer());
 if(!validFile(bytes,ext))return fail(req,"El archivo no tiene un formato válido o puede contener macros.");
 const rawIp=(req.headers.get("cf-connecting-ip")||req.headers.get("x-forwarded-for")?.split(",")[0]||"unknown").slice(0,80);
 const ipHash=await sha(rawIp+":"+SERVICE_KEY);
 const {data:reserved,error:reserveError}=await supa.rpc("krueka_live_reserve",{
   p_activity_id:g.id,p_code_hash:g.code_hash,p_ip_hash:ipHash
 });
 if(reserveError)return fail(req,"No pudimos verificar la recepción. Intentá nuevamente.",503);
 if(!reserved)return fail(req,"Código vencido, clase cerrada o demasiados envíos. Consultá al docente.",403);
 const sid=crypto.randomUUID(),path=g.id+"/"+new Date().toISOString().slice(0,10)+"/"+sid+ext;
 const {error:saveError}=await supa.storage.from(STORAGE)
  .upload(path,new Blob([bytes],{type:MIME[ext]}),{contentType:MIME[ext],upsert:false,cacheControl:"0"});
 if(saveError)return fail(req,"No se pudo guardar el documento. Volvé a intentar.",503);
 const {data:done,error:finalError}=await supa.rpc("krueka_live_finalize",{
   p_activity_id:g.id,p_code_hash:g.code_hash,p_submission_id:sid,
   p_student:student,p_filename:safeFileName(file.name),p_object_path:path,
   p_mime:MIME[ext],p_size:file.size
 });
 if(finalError||!done){
  await supa.storage.from(STORAGE).remove([path]);
  if(!finalError)return fail(req,"El profesor cerró la clase antes de finalizar tu entrega.",403);
  return fail(req,"No se pudo finalizar la entrega. Intentá nuevamente.",503);
 }
 return json(req,{ok:true,receipt:sid.slice(0,8).toUpperCase(),
  message:"Trabajo recibido. Guardá el comprobante."});
}
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(req)});
 if(req.method==="GET")return json(req,{ok:true,service:"Actividades de clase Krueka",max_mb:10});
 if(req.method!=="POST")return fail(req,"Método no admitido.",405);
 const origin=req.headers.get("origin");
 if(origin&&!ORIGINS.has(origin))return fail(req,"Origen no autorizado.",403);
 try{
  if((req.headers.get("content-type")||"").startsWith("multipart/form-data"))return await upload(req);
  let body:Record<string,unknown>={};
  try{body=await req.json();}catch{return fail(req,"Solicitud incorrecta.");}
  if(body.action==="guide")return await studentPdf(req,codeOf(body.code));
  if(body.action==="material")return await materialDownload(req,codeOf(body.code),String(body.material_id||""));
  if(body.action==="lookup"){
   const code=codeOf(body.code);
   if(!/^[A-HJ-NP-Z2-9]{12}$/.test(code))return fail(req,"Código no válido o clase cerrada.",403);
   const data=await activityByCode(code);
   if(!data)return fail(req,"El código no existe o la clase ya terminó.",403);
   return json(req,{ok:true,activity:{title:data.title,grade:data.grade,subject:data.subject,
      instructions:data.instructions,has_pdf:!!data.pdf_path,pdf_name:data.pdf_name||null,
      materials:await materialList(data.id)}});
  }
  const staff=await teacher(req);
  if(!staff)return fail(req,"Ingresá con una cuenta docente autorizada y correo verificado.",403);
  return await handleStaff(req,staff,body);
 }catch(error){
  console.error("Krueka clase:",error instanceof Error?error.message:"error inesperado");
  return fail(req,"Error temporal. Intentá nuevamente.",503);
 }
});
