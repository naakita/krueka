import { createClient } from "npm:@supabase/supabase-js@2.57.2";
const URL = Deno.env.get("SUPABASE_URL")!;
const KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db = createClient(URL, KEY, {auth:{persistSession:false,autoRefreshToken:false}});
const origins = ["https://krueka.com","https://www.krueka.com"];
function respond(req:Request, body:unknown, status=200):Response {
 const origin=req.headers.get("origin") || "";
 return new Response(JSON.stringify(body),{status,headers:{
  "content-type":"application/json; charset=utf-8","cache-control":"no-store",
  "access-control-allow-origin": origins.includes(origin)?origin:"https://www.krueka.com",
  "access-control-allow-methods":"POST, OPTIONS",
  "access-control-allow-headers":"authorization, apikey, content-type, x-client-info, x-device-id",
  "vary":"Origin","x-content-type-options":"nosniff"
 }});
}
function fail(code:number,message:string):never {throw {code,message};}
function hex(bytes:Uint8Array):string {return [...bytes].map(b=>b.toString(16).padStart(2,"0")).join("");}
function bytes(n:number):Uint8Array {return crypto.getRandomValues(new Uint8Array(n));}
async function digest(s:string):Promise<string>{return hex(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s))));}
function equal(a:string,b:string):boolean{if(a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0;}
function domain(raw:unknown):string{
 if(typeof raw!=="string"||raw.length>300)fail(400,"Dominio inválido");
 let s=raw.trim().toLowerCase();
 if(/^https?:\/\//.test(s)){try{const u=new URL(s);if(u.username||u.password||u.port)fail(400,"No se admiten puertos");s=u.hostname;}catch{fail(400,"URL inválida");}}
 s=s.replace(/\.$/,"");
 if(s.length<4||s.length>253||!s.includes(".")||!(/^[a-z0-9.-]+$/).test(s)||s.includes("..")||s.split(".").some(p=>!p||p.length>63||p.startsWith("-")||p.endsWith("-")))fail(400,"Dominio inválido");
 return s;
}
function allowed(arr:any):string[]{return [...new Set(["krueka.com", ...(Array.isArray(arr)?arr:[]).filter(v=>typeof v==="string").map(v=>domain(v))])].sort().slice(0,80);}
function assert(ok:any,message:string,code=400):void{if(!ok)fail(code,message);}
async function guard(query:any):Promise<any>{const {data,error}=await query;if(error)fail(500,"Error de almacenamiento: "+error.code);return data;}
async function audit(inst:string,device:string|null,actor:string|null,event:string,detail:Record<string,unknown>={}){
 await db.from("aula_audit").insert({institution_id:inst,device_id:device,actor_id:actor,event,detail});
}
async function actor(req:Request){
 const auth=req.headers.get("authorization")||"";
 assert(/^Bearer \S+$/.test(auth),"Se requiere iniciar sesión",401);
 const {data:{user},error}=await db.auth.getUser(auth.slice(7));
 if(error||!user)fail(401,"Sesión vencida");
 const p=await guard(db.from("profiles").select("id,role,activo,institution_id").eq("id",user.id).single());
 if(!p||!p.activo||!["admin","director","docente"].includes(p.role)||!p.institution_id)fail(403,"Tu rol no permite gestionar computadoras");
 return p;
}
async function own(p:any,id:unknown){
 assert(typeof id==="string"&&/^[0-9a-f-]{36}$/.test(id),"Equipo inválido");
 const d=await guard(db.from("aula_devices").select("*").eq("id",id).eq("institution_id",p.institution_id).maybeSingle());
 if(!d)fail(404,"PC no encontrada en tu institución");
 return d;
}
async function userAction(req:Request,b:any):Promise<unknown>{
 const p=await actor(req);
 switch(b.action){
 case "list": {
  const devices=await guard(db.from("aula_devices").select("id,label,enabled,allowed,kiosk_enabled,kiosk_observed,kiosk_error,last_seen,created_at").eq("institution_id",p.institution_id).order("created_at",{ascending:true}).limit(100));
  const ids=(devices||[]).map((d:any)=>d.id);
  const requests=ids.length?await guard(db.from("aula_requests").select("id,device_id,domain,reason,status,created_at").in("device_id",ids).order("created_at",{ascending:false}).limit(200)):[];
  return {devices,requests};
 }
 case "create": {
  assert(typeof b.label==="string"&&b.label.trim().length>0&&b.label.length<=80,"Nombre de PC inválido");
  const token=hex(bytes(32));
  const d=await guard(db.from("aula_devices").insert({label:b.label.trim(),institution_id:p.institution_id,token_hash:await digest(token),created_by:p.id}).select("id,label").single());
  await audit(p.institution_id,d.id,p.id,"device_created",{label:d.label});
  return {id:d.id,token,hub_url:URL+"/functions/v1/aula-control"};
 }

 case "rotate_token": {
  const d=await own(p,b.device_id);
  const token=hex(bytes(32));
  await guard(db.from("aula_devices").update({token_hash:await digest(token)}).eq("id",d.id));
  await audit(p.institution_id,d.id,p.id,"device_token_rotated");
  return {id:d.id,label:d.label,token,hub_url:URL+"/functions/v1/aula-control"};
 }
 case "allow": {
  const d=await own(p,b.device_id); const v=domain(b.domain);
  let next=allowed(d.allowed);
  if(b.add===false){if(v==="krueka.com")fail(400,"Krueka siempre debe estar disponible");next=next.filter(x=>x!==v);}
  else next=allowed([...next,v]);
  await guard(db.from("aula_devices").update({allowed:next}).eq("id",d.id));
  await audit(p.institution_id,d.id,p.id,b.add===false?"remove_domain":"allow_domain",{domain:v});
  return {ok:true,allowed:next};
 }
 case "lock": {
  const d=await own(p,b.device_id);
  assert(typeof b.enabled==="boolean","Valor inválido");
  await guard(db.from("aula_devices").update({enabled:b.enabled}).eq("id",d.id));
  await audit(p.institution_id,d.id,p.id,b.enabled?"web_restricted":"web_unrestricted");
  return {ok:true};
 }
 case "decision": {
  const d=await own(p,b.device_id);
  assert(typeof b.request_id==="string","Solicitud inválida");
  const r=await guard(db.from("aula_requests").select("*").eq("id",b.request_id).eq("device_id",d.id).eq("status","pending").maybeSingle());
  if(!r)fail(404,"Solicitud no encontrada o ya respondida");
  await guard(db.from("aula_requests").update({status:b.approve===true?"approved":"denied"}).eq("id",r.id).eq("status","pending"));
  if(b.approve===true){await guard(db.from("aula_devices").update({allowed:allowed([...d.allowed,r.domain])}).eq("id",d.id));}
  await audit(p.institution_id,d.id,p.id,b.approve===true?"request_approved":"request_denied",{domain:r.domain});
  return {ok:true};
 }
 case "kiosk": {
  const d=await own(p,b.device_id);
  assert(typeof b.kiosk_enabled==="boolean","Valor de quiosco inválido");
  await guard(db.from("aula_devices").update({kiosk_enabled:b.kiosk_enabled}).eq("id",d.id));
  await audit(p.institution_id,d.id,p.id,b.kiosk_enabled?"kiosk_enable_requested":"kiosk_disable_requested");
  return {ok:true,warning:"La sesión de Windows debe reiniciarse para que el cambio sea visible"};
 }
 case "code": {
  const d=await own(p,b.device_id);const minutes=Number(b.minutes);
  assert([10,30,60].includes(minutes),"Duración inválida");
  const unexpired=await guard(db.from("aula_unlock_codes").select("id").eq("device_id",d.id).is("used_at",null).gt("expires_at",new Date().toISOString()).limit(4));
  if(unexpired.length>=3)fail(429,"Ya hay 3 códigos activos para esta computadora");
  const code=String(crypto.getRandomValues(new Uint32Array(1))[0]%100000000).padStart(8,"0");
  const salt=bytes(16);
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(code),"PBKDF2",false,["deriveBits"]);
  const hash=new Uint8Array(await crypto.subtle.deriveBits({name:"PBKDF2",salt,iterations:180000,hash:"SHA-256"},key,256));
  const expires=new Date(Date.now()+15*60000).toISOString();
  const dcode=await guard(db.from("aula_unlock_codes").insert({device_id:d.id,salt:btoa(String.fromCharCode(...salt)),hash:btoa(String.fromCharCode(...hash)),minutes,expires_at:expires,created_by:p.id}).select("id").single());
  await audit(p.institution_id,d.id,p.id,"code_generated",{minutes,code_id:dcode.id});
  return {code,minutes,expires_at:expires};
 }
 case "rename": {
  const d=await own(p,b.device_id);
  assert(typeof b.label==="string"&&b.label.trim().length>0&&b.label.length<=80,"Nombre inválido");
  await guard(db.from("aula_devices").update({label:b.label.trim()}).eq("id",d.id));
  return {ok:true};
 }
 default:fail(400,"Acción no admitida");
 }
}
async function agent(req:Request,b:any):Promise<unknown>{
 const id=req.headers.get("x-device-id")||"";
 const token=(req.headers.get("authorization")||"").replace(/^Bearer /,"");
 assert(/^[0-9a-f-]{36}$/.test(id)&&/^[0-9a-f]{64}$/.test(token),"Credenciales del equipo incorrectas",401);
 const d=await guard(db.from("aula_devices").select("*").eq("id",id).maybeSingle());
 if(!d||!equal(d.token_hash,await digest(token)))fail(401,"Equipo no registrado");
 const pending=Array.isArray(b.requests)?b.requests.slice(0,35):[];
 for(const r of pending){
  if(!r||!/^[0-9a-f]{24}$/.test(r.id)||r.status!=="pending")continue;
  let url:string;try{url=domain(r.domain);}catch{continue;}
  const reason=typeof r.reason==="string"?r.reason.slice(0,300):"";
  await guard(db.from("aula_requests").upsert({device_id:id,client_id:r.id,domain:url,reason,status:"pending"},{onConflict:"device_id,client_id",ignoreDuplicates:true}));
 }
 const consumed=Array.isArray(b.consumed_codes)?b.consumed_codes.filter((x:unknown)=>typeof x==="string"&&/^[0-9a-f-]{36}$/.test(x)).slice(0,100):[];
 if(consumed.length)await guard(db.from("aula_unlock_codes").update({used_at:new Date().toISOString()}).eq("device_id",id).in("id",consumed).is("used_at",null));
 const heartbeat:any={last_seen:new Date().toISOString()};
 if(typeof b.kiosk_observed==="boolean")heartbeat.kiosk_observed=b.kiosk_observed;
 if(typeof b.kiosk_error==="string")heartbeat.kiosk_error=b.kiosk_error.slice(0,250);
 await guard(db.from("aula_devices").update(heartbeat).eq("id",id));
 const requests=await guard(db.from("aula_requests").select("client_id,status").eq("device_id",id).neq("status","pending").order("created_at",{ascending:false}).limit(100));
 const codes=await guard(db.from("aula_unlock_codes").select("id,salt,hash,minutes,expires_at").eq("device_id",id).is("used_at",null).gt("expires_at",new Date().toISOString()).limit(10));
 return {enabled:d.enabled,kiosk_enabled:d.kiosk_enabled,allowlist:allowed(d.allowed),decisions:Object.fromEntries((requests||[]).map((r:any)=>[r.client_id,r.status])),unlock_codes:codes||[]};
}
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return respond(req,{ok:true});
 if(req.method!=="POST")return respond(req,{error:"Método no permitido"},405);
 try{
  const clen=Number(req.headers.get("content-length")||"0");
  if(clen>65536)fail(413,"Solicitud demasiado grande");
  const b=await req.json();
  if(!b||typeof b.action!=="string")fail(400,"Acción requerida");
  const data=b.action==="sync"?await agent(req,b):await userAction(req,b);
  return respond(req,data);
 }catch(e){const x=e as {code?:number,message?:string};return respond(req,{error:x.message||"Error inesperado"},x.code||500);}
});
