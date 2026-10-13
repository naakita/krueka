import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
const ORIGINS=new Set(["https://krueka.com","https://www.krueka.com"]);
const STAFF=new Set(["admin@krueka.edu.py","contacto@titanteo.com"]);
const STORAGE="krueka-excel-por-grado";
const MIME="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const MAX=10*1024*1024;
const base=Deno.env.get("SUPABASE_URL")||"";
const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const db=createClient(base,key,{auth:{persistSession:false,autoRefreshToken:false}});
const cors=(r:Request)=>{
 const origin=r.headers.get("origin")||"";
 return {"Access-Control-Allow-Origin":ORIGINS.has(origin)?origin:"https://www.krueka.com",
 "Access-Control-Allow-Methods":"GET,POST,OPTIONS",
 "Access-Control-Allow-Headers":"apikey,authorization,content-type,x-client-info",
 "Cache-Control":"no-store","Vary":"Origin"};
};
const json=(r:Request,data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors(r),"Content-Type":"application/json; charset=utf-8"}});
const fail=(r:Request,message:string,status=400)=>json(r,{ok:false,error:message},status);
const trim=(v:unknown,max:number)=>String(v??"").trim().replace(/[\u0000-\u001f\u007f]/g," ").slice(0,max);
const codeOf=(s:unknown)=>String(s||"").toUpperCase().replace(/[\s-]/g,"");
const hex=async(s:string)=>{
 const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));
 return Array.from(new Uint8Array(d),x=>x.toString(16).padStart(2,"0")).join("");
};
function randomCode(){
 const alphabet="ABCDEFGHJKLMNPQRSTUVWXYZ23456789",bytes=new Uint8Array(12);
 crypto.getRandomValues(bytes);
 return Array.from(bytes,b=>alphabet[b%alphabet.length]).join("");
}
const filename=(s:string)=>s.replace(/[^A-Za-z0-9 _().\-\u00c0-\u024f]/g,"").replace(/\s+/g," ").slice(0,150)||"actividad.xlsx";
function validExcel(data:Uint8Array){
 if(data.length<180||data[0]!==0x50||data[1]!==0x4b||data[2]!==0x03||data[3]!==0x04)return false;
 const names=new TextDecoder("latin1").decode(data);
 // Excel sin macros. El cliente no puede limitarse a renombrar una imagen como .xlsx
 return names.includes("[Content_Types].xml")&&names.includes("xl/workbook.xml")&&!names.includes("xl/vbaProject.bin");
}
async function reviewer(req:Request){
 const token=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"").trim();
 if(!token)return null;
 const {data:{user},error}=await db.auth.getUser(token);
 if(error||!user||!user.email_confirmed_at)return null;
 const email=(user.email||"").trim().toLowerCase();
 if(!STAFF.has(email))return null;
 if(email==="contacto@titanteo.com")return {id:user.id,email,role:"revisor_excel"};
 const {data:p,error:e}=await db.from("profiles").select("role,activo").eq("id",user.id).maybeSingle();
 if(e||!p||!p.activo||!["admin","director","docente"].includes(p.role))return null;
 return {id:user.id,email,role:p.role};
}
const uuid=(s:unknown)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(s||""));
async function actions(req:Request){
 const staff=await reviewer(req);
 if(!staff)return fail(req,"Solo un docente autorizado y con correo verificado puede revisar los trabajos.",403);
 let form:Record<string,unknown>;
 try{form=await req.json();}catch{return fail(req,"Solicitud inválida.");}
 const action=String(form.action||"");
 if(action==="groups"){
  const {data,error}=await db.from("excel_grade_groups").select("id,name,accepting,created_at").order("created_at",{ascending:false}).limit(100);
  if(error)return fail(req,"No se pudieron consultar las carpetas.",503);
  return json(req,{ok:true,groups:data||[]});
 }
 if(action==="create"){
  const name=trim(form.name,80);
  if(name.length<2)return fail(req,"Escribí el grado o curso.");
  const code=randomCode(),hash=await hex(code);
  const {data,error}=await db.from("excel_grade_groups").insert({name,code_hash:hash}).select("id,name,accepting,created_at").single();
  if(error)return fail(req,"No pudimos crear el grado. Intentá nuevamente.",503);
  return json(req,{ok:true,group:data,code,notice:"Guardá y compartí este código; solo se muestra al crearlo."});
 }
 if(!uuid(form.group_id))return fail(req,"Seleccioná un grado válido.");
 const group=String(form.group_id);
 if(action==="rotate"){
  const code=randomCode(),hash=await hex(code);
  const {data,error}=await db.from("excel_grade_groups").update({code_hash:hash}).eq("id",group).select("id,name").maybeSingle();
  if(error||!data)return fail(req,"No pudimos cambiar el código.",503);
  return json(req,{ok:true,code,group:data,notice:"El código anterior dejó de funcionar. Guardá el nuevo."});
 }
 if(action==="close"){
  if(typeof form.accepting!=="boolean")return fail(req,"Estado de recepción incorrecto.");
  const {data,error}=await db.from("excel_grade_groups").update({accepting:form.accepting}).eq("id",group).select("id,name,accepting").maybeSingle();
  if(error||!data)return fail(req,"No pudimos actualizar la carpeta.",503);
  return json(req,{ok:true,group:data});
 }
 if(action==="list"){
  const {data,error}=await db.from("excel_grade_submissions")
    .select("id,student_name,assignment,original_filename,size_bytes,status,teacher_note,uploaded_at,reviewed_at")
    .eq("group_id",group).order("uploaded_at",{ascending:false}).limit(500);
  if(error)return fail(req,"No pudimos cargar las entregas.",503);
  return json(req,{ok:true,items:data||[]});
 }
 if(!uuid(form.id))return fail(req,"Trabajo no válido.");
 const id=String(form.id);
 // Tanto descarga como revisión verifican el grado; nunca se comparte un objeto de otro grupo.
 const {data:item,error:loadError}=await db.from("excel_grade_submissions")
  .select("id,group_id,object_path,original_filename").eq("id",id).eq("group_id",group).maybeSingle();
 if(loadError||!item)return fail(req,"Trabajo no encontrado en ese grado.",404);
 if(action==="download"){
  const {data,error}=await db.storage.from(STORAGE).createSignedUrl(item.object_path,90,{download:item.original_filename});
  if(error||!data?.signedUrl)return fail(req,"No pudimos generar la descarga.",503);
  return json(req,{ok:true,url:data.signedUrl,expires_in:90});
 }
 if(action==="review"){
  const status=String(form.status||""),note=trim(form.note,1000);
  if(!["pendiente","revisado","corregir"].includes(status))return fail(req,"Estado incorrecto.");
  const {error}=await db.from("excel_grade_submissions").update({
   status,teacher_note:note,reviewed_at:status==="pendiente"?null:new Date().toISOString()
  }).eq("id",id).eq("group_id",group);
  if(error)return fail(req,"No pudimos guardar la corrección.",503);
  return json(req,{ok:true});
 }
 return fail(req,"Acción no permitida.",400);
}
async function upload(req:Request){
 const length=Number(req.headers.get("content-length")||0);
 if(length>MAX+24000)return fail(req,"El archivo supera 10 MB.",413);
 let form:FormData;
 try{form=await req.formData();}catch{return fail(req,"No se pudo leer el envío.");}
 const code=codeOf(form.get("code"));
 const student=trim(form.get("student"),90),assignment=trim(form.get("assignment"),120);
 const file=form.get("document");
 if(!/^[A-HJ-NP-Z2-9]{12}$/.test(code))return fail(req,"Código de grado no válido.",403);
 if(student.length<3||assignment.length<2)return fail(req,"Completá tu nombre y el tema del trabajo.");
 if(!(file instanceof File)||!/\.xlsx$/i.test(file.name)||/\.xlsm$/i.test(file.name))return fail(req,"Solo se permiten archivos Excel .xlsx (sin macros).");
 if(file.size<180||file.size>MAX)return fail(req,"Seleccioná un Excel de hasta 10 MB.");
 const {data:g,error:e}=await db.from("excel_grade_groups").select("id,name,accepting").eq("code_hash",await hex(code)).maybeSingle();
 if(e||!g||!g.accepting)return fail(req,"Código incorrecto o recepción cerrada. Pedí el código al profesor.",403);
 const bytes=new Uint8Array(await file.arrayBuffer());
 if(!validExcel(bytes))return fail(req,"El archivo no tiene el formato válido de Excel .xlsx sin macros.");
 const ip=(req.headers.get("cf-connecting-ip")||req.headers.get("x-forwarded-for")?.split(",")[0]||"unknown").slice(0,80);
 const fingerprint=await hex(ip+":"+key);
 const {data:permit,error:limitError}=await db.rpc("excel_grade_reserve",{p_ip_hash:fingerprint,p_group_id:g.id});
 if(limitError)return fail(req,"El buzón no responde. Intentá de nuevo.",503);
 if(!permit)return fail(req,"Muchos envíos recientes. Consultá a tu profesor.",429);
 const id=crypto.randomUUID(),objectPath=g.id+"/"+new Date().toISOString().slice(0,10)+"/"+id+".xlsx";
 const {error:storageError}=await db.storage.from(STORAGE).upload(objectPath,new Blob([bytes],{type:MIME}),{
  contentType:MIME,upsert:false,cacheControl:"0"
 });
 if(storageError)return fail(req,"No pudimos guardar el archivo en el servidor.",503);
 const {error:insertError}=await db.from("excel_grade_submissions").insert({
  id,group_id:g.id,student_name:student,assignment,original_filename:filename(file.name),
  object_path:objectPath,size_bytes:file.size
 });
 if(insertError){
  await db.storage.from(STORAGE).remove([objectPath]);
  return fail(req,"Hubo un problema al registrar tu entrega. Probá otra vez.",503);
 }
 return json(req,{ok:true,receipt:id.slice(0,8).toUpperCase(),message:"Archivo recibido. No podés ver otras entregas."});
}
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(req)});
 if(req.method==="GET")return json(req,{ok:true,service:"Krueka Excel por grado",format:".xlsx",max_mb:10});
 if(req.method!=="POST")return fail(req,"Método no permitido.",405);
 const origin=req.headers.get("origin");
 if(origin&&!ORIGINS.has(origin))return fail(req,"Acceso desde origen no autorizado.",403);
 try{
  if((req.headers.get("content-type")||"").startsWith("multipart/form-data"))return await upload(req);
  return await actions(req);
 }catch(err){console.error("excel grades:",err instanceof Error?err.message:"unexpected");return fail(req,"Error temporal al procesar el pedido.",503);}
});