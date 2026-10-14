import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
const ORIGINS=new Set(["https://krueka.com","https://www.krueka.com"]);
const BUCKET="krueka-word-entregas";
// Allowlist de responsables habilitados para revisar documentos escolares.
const STAFF_EMAILS=new Set(["admin@krueka.edu.py","contacto@titanteo.com"]);
const WORD_MIME="application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const MAX_FILE=5*1024*1024;
const url=Deno.env.get("SUPABASE_URL")||"";
const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
function cors(req:Request):Record<string,string>{
 const origin=req.headers.get("origin")||"";
 return {"Access-Control-Allow-Origin":ORIGINS.has(origin)?origin:"https://www.krueka.com",
  "Vary":"Origin","Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info",
  "Access-Control-Allow-Methods":"GET,POST,OPTIONS","Cache-Control":"no-store"};
}
const response=(req:Request,data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors(req),"Content-Type":"application/json; charset=utf-8"}});
const clean=(v:unknown,n:number)=>String(v??"").trim().replace(/[\u0000-\u001f\u007f]/g," ").slice(0,n);
const fail=(req:Request,message:string,status=400)=>response(req,{ok:false,error:message},status);
const safeName=(v:string)=>v.replace(/[^a-z0-9áéíóúüñ _().-]/gi,"").replace(/\s+/g," ").slice(0,150);
async function hash(value:string){
 const bytes=new TextEncoder().encode(value);
 const digest=await crypto.subtle.digest("SHA-256",bytes);
 return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");
}
function looksLikeWord(bytes:Uint8Array){
 if(bytes.length<170||bytes[0]!==80||bytes[1]!==75||bytes[2]!==3||bytes[3]!==4)return false;
 const names=new TextDecoder("iso-8859-1").decode(bytes);
 return names.includes("[Content_Types].xml")&&names.includes("word/document.xml");
}
async function teacher(req:Request){
 const token=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"").trim();
 if(!token)return null;
 const {data:{user},error}=await admin.auth.getUser(token);
 if(error||!user)return null;
 // No alcanza con poseer una cuenta o elegir el rol "docente" durante el registro.
 // Requerimos dominio de una dirección expresamente habilitada y correo confirmado.
 const verifiedEmail=(user.email||"").trim().toLowerCase();
 if(!STAFF_EMAILS.has(verifiedEmail)||!user.email_confirmed_at)return null;
 // Permiso acotado exclusivamente a la bandeja Word para la dirección propietaria
 // verificada por correo; NO crea ni concede el rol global admin de Krueka.
 if(verifiedEmail==="contacto@titanteo.com")return {id:user.id,role:"revisor_word"};
 const {data:profile,error:profileError}=await admin.from("profiles").select("role,activo").eq("id",user.id).maybeSingle();
 if(profileError||!profile||profile.activo!==true||!["docente","director","admin"].includes(profile.role))return null;
 return {id:user.id,role:profile.role};
}
async function adminAction(req:Request){
 const t=await teacher(req);
 if(!t)return fail(req,"Acceso reservado a docentes autorizados. Iniciá sesión con tu cuenta de Krueka.",403);
 let data:Record<string,unknown>;
 try{data=await req.json();}catch{return fail(req,"Solicitud inválida.");}
 const action=String(data.action||"");
 if(action==="list"){
  const {data:rows,error}=await admin.from("word_dropbox_submissions")
    .select("id,student_name,class_name,assignment,original_filename,size_bytes,review_status,teacher_note,uploaded_at,reviewed_at")
    .order("uploaded_at",{ascending:false}).limit(350);
  if(error)return fail(req,"No pudimos consultar las entregas.",503);
  return response(req,{ok:true,items:rows||[]});
 }
 if(!/^[0-9a-f-]{36}$/i.test(String(data.id||"")))return fail(req,"Entrega no válida.");
 const id=String(data.id);
 if(action==="download"){
  const {data:row,error}=await admin.from("word_dropbox_submissions").select("object_path,original_filename").eq("id",id).maybeSingle();
  if(error||!row)return fail(req,"No encontramos la entrega.",404);
  const {data:link,error:linkError}=await admin.storage.from(BUCKET).createSignedUrl(row.object_path,120,{download:row.original_filename});
  if(linkError||!link?.signedUrl)return fail(req,"No pudimos preparar el archivo.",503);
  return response(req,{ok:true,url:link.signedUrl,expires_in:120});
 }
 if(action==="review"){
  const status=String(data.status||"");
  if(!["pendiente","revisado","corregir"].includes(status))return fail(req,"Estado inválido.");
  const note=clean(data.note,1000);
  const {error}=await admin.from("word_dropbox_submissions")
   .update({review_status:status,teacher_note:note,reviewed_at:status==="pendiente"?null:new Date().toISOString()}).eq("id",id);
  if(error)return fail(req,"No pudimos guardar la revisión.",503);
  return response(req,{ok:true});
 }
 return fail(req,"Acción desconocida.");
}
async function upload(req:Request){
 const len=Number(req.headers.get("content-length")||0);
 if(len>MAX_FILE+18000)return fail(req,"Máximo 5 MB por documento.",413);
 let form:FormData;
 try{form=await req.formData();}catch{return fail(req,"No pudimos leer el formulario.");}
 const file=form.get("document");
 const student=clean(form.get("student"),90),assignment=clean(form.get("assignment"),100);
 let course=clean(form.get("course"),60);
 const code=String(form.get("grade_code")||"").toUpperCase().replace(/[\s-]/g,"");
 let group:{id:string,name:string,accepting:boolean}|null=null;
 if(code){
  if(!/^[A-Z2-9]{12}$/.test(code))return fail(req,"El código del grado debe tener 12 letras o números.");
  const {data:g,error:groupError}=await admin.from("word_grade_groups").select("id,name,accepting").eq("code_hash",await hash(code)).maybeSingle();
  if(groupError)return fail(req,"No pudimos verificar el código del grado.",503);
  if(!g||!g.accepting)return fail(req,"Código de grado incorrecto o entrega cerrada.",403);
  group=g;course=g.name;
 }
 if(!(file instanceof File))return fail(req,"Seleccioná un archivo Word .docx.");
 if(student.length<3||course.length<2||assignment.length<2)return fail(req,"Completá nombre, grado y título del trabajo.");
 if(file.size<170||file.size>MAX_FILE)return fail(req,"El archivo debe tener entre 170 bytes y 5 MB.");
 if(!/\.docx$/i.test(file.name)||/\.docm$/i.test(file.name))return fail(req,"Sólo se permite Word .docx (no PDF, Word con macros ni ZIP).");
 const bytes=new Uint8Array(await file.arrayBuffer());
 if(!looksLikeWord(bytes))return fail(req,"El archivo no parece ser un documento Word .docx válido.");
 const ip=(req.headers.get("cf-connecting-ip")||req.headers.get("x-forwarded-for")?.split(",")[0]||"unknown").trim().slice(0,75);
 const fingerprint=await hash(ip+":"+(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||""));
 const {data:reserved,error:limitError}=await admin.rpc("word_dropbox_reserve",{p_ip_hash:fingerprint});
 if(limitError)return fail(req,"El servidor de entregas no está disponible.",503);
 if(!reserved)return fail(req,"Demasiados envíos en poco tiempo. Consultá al profesor.",429);
 const id=crypto.randomUUID();
 const path=(group?group.id+"/":"")+new Date().toISOString().slice(0,10)+"/"+id+".docx";
 const {error:storageError}=await admin.storage.from(BUCKET).upload(path,new Blob([bytes],{type:WORD_MIME}),{contentType:WORD_MIME,upsert:false,cacheControl:"0"});
 if(storageError)return fail(req,"No pudimos subir el documento. Intentá de nuevo.",503);
 const {error:dbError}=await admin.from("word_dropbox_submissions").insert({
  id,student_name:student,class_name:course,assignment,original_filename:safeName(file.name)||"entrega.docx",
  object_path:path,size_bytes:file.size,grade_group_id:group?.id??null
 });
 if(dbError){
  await admin.storage.from(BUCKET).remove([path]);
  return fail(req,"No pudimos registrar la entrega. Intentá nuevamente.",503);
 }
 return response(req,{ok:true,receipt:id.slice(0,8).toUpperCase(),grade:course,message:"Entrega recibida correctamente."});
}
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(req)});
 if(req.method==="GET")return response(req,{ok:true,service:"Buzón Word Krueka",max_mb:5,format:".docx"});
 if(req.method!=="POST")return fail(req,"Método no permitido.",405);
 const origin=req.headers.get("origin");
 if(origin&&!ORIGINS.has(origin))return fail(req,"Origen no autorizado.",403);
 try{
  if((req.headers.get("content-type")||"").startsWith("multipart/form-data"))return await upload(req);
  return await adminAction(req);
 }catch(e){console.error("word dropbox error",e instanceof Error?e.message:"unexpected");return fail(req,"Ocurrió un error. Intentá de nuevo.",503);}
});