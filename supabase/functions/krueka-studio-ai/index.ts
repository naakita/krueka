import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json"}});
const allowed=/\.(html|css|js|json|svg|txt|md)$/i;
const badPersonal=(s:string)=>/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/.test(s)||/(?:\+?595\s*)?0?9\d{2}[\s.-]?\d{3}[\s.-]?\d{3}/.test(s)||/\b(?:contrase(?:ñ|n)a|password|c[eé]dula|tarjeta de cr[eé]dito)\b/i.test(s);
const size=(files:Record<string,string>)=>Object.values(files).reduce((n,v)=>n+String(v||"").length,0);
class ProviderSetupError extends Error {}
function aiStatus(){
  const cloudflare=!!(Deno.env.get("CLOUDFLARE_ACCOUNT_ID")&&Deno.env.get("CLOUDFLARE_API_TOKEN"));
  const groq=!!Deno.env.get("GROQ_API_KEY");
  return {ready:cloudflare||groq,provider:cloudflare?"Cloudflare":groq?"Groq":null};
}
async function generate(system:string,user:string){
  const candidates:Array<{name:string;url:string;key:string;model:string;cloudflare?:boolean}>=[];
  const account=Deno.env.get("CLOUDFLARE_ACCOUNT_ID"),token=Deno.env.get("CLOUDFLARE_API_TOKEN");
  if(account&&token)candidates.push({name:"Cloudflare",url:"https://api.cloudflare.com/client/v4/accounts/"+encodeURIComponent(account)+"/ai/run/"+(Deno.env.get("CLOUDFLARE_AI_MODEL")||"@cf/qwen/qwen2.5-coder-32b-instruct"),key:token,model:Deno.env.get("CLOUDFLARE_AI_MODEL")||"@cf/qwen/qwen2.5-coder-32b-instruct",cloudflare:true});
  const groq=Deno.env.get("GROQ_API_KEY");
  if(groq)candidates.push({name:"Groq",url:"https://api.groq.com/openai/v1/chat/completions",key:groq,model:Deno.env.get("GROQ_MODEL")||"openai/gpt-oss-20b"});
  if(!candidates.length)throw new ProviderSetupError("El profe debe conectar Cloudflare Workers AI o Groq en el servidor. Podés seguir creando con las bases jugables y el editor.");
  let unavailable=false;
  for(const c of candidates){
    try{
      const r=await fetch(c.url,{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+c.key},signal:AbortSignal.timeout(60000),body:JSON.stringify({...(c.cloudflare?{}:{model:c.model,response_format:{type:"json_object"}}),messages:[{role:"system",content:system},{role:"user",content:user}],max_tokens:4500,temperature:.2})});
      if(!r.ok){console.warn("Studio provider",{provider:c.name,status:r.status});if(r.status===401||r.status===403){unavailable=true;continue;}continue;}
      const data=await r.json();const raw=c.cloudflare?String(data?.result?.response||""):extract(data);
      if(!raw)continue;
      const parsed=parse(raw);return {parsed,model:c.name+" · "+c.model};
    }catch(_e){console.warn("Studio provider request failed",{provider:c.name});}
  }
  if(unavailable)throw new ProviderSetupError("La conexión de IA requiere que el profe revise la clave o los permisos del proveedor.");
  throw new Error("La IA está ocupada, agotó su cupo o no devolvió un cambio completo. Tu juego sigue guardado. Intentá más tarde.");
}
function cleanFiles(raw:any){
  const out:Record<string,string>={};
  if(!raw||typeof raw!=="object")return out;
  for(const [k,v] of Object.entries(raw)){
    const name=String(k);
    if(!allowed.test(name)||! /^[a-zA-Z0-9_./-]+$/.test(name)||name.includes("..")||name.startsWith("/"))continue;
    const val=String(v??"");
    if(val.length<=120000)out[name]=val;
  }
  return out;
}
function extract(data:any){
  if(typeof data?.output_text==="string")return data.output_text;
  if(Array.isArray(data?.output))for(const item of data.output)if(Array.isArray(item?.content))for(const c of item.content)if(typeof c?.text==="string")return c.text;
  if(typeof data?.choices?.[0]?.message?.content==="string")return data.choices[0].message.content;
  return "";
}
function parse(raw:string){
  let t=String(raw||"").trim().replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/i,"");
  const a=t.indexOf("{"),b=t.lastIndexOf("}");if(a>=0&&b>a)t=t.slice(a,b+1);
  return JSON.parse(t);
}
async function clients(){
  const url=Deno.env.get("SUPABASE_URL")!;
  let pub=Deno.env.get("SUPABASE_ANON_KEY")||"";
  try{const m=JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS")||"{}");if(m?.default&&Deno.env.get(m.default))pub=Deno.env.get(m.default)||pub}catch(_e){}
  const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
  return {pub:createClient(url,pub,{auth:{persistSession:false}}),admin:createClient(url,service,{auth:{persistSession:false}})};
}
async function validate(pub:any,studentId:string,deviceId:string){
  const r=await pub.rpc("club_crea_listar",{p_student:studentId,p_device:deviceId});
  if(r.error)throw new Error("No se pudo validar el acceso del alumno al Club.");
  return Array.isArray(r.data)?r.data:[];
}
async function ensureBucket(admin:any){
  const name="krueka-studio";
  const list=await admin.storage.listBuckets();
  if(list.error)throw new Error(list.error.message||"No se pudo completar la operación.");
  if(!(list.data||[]).some((b:any)=>b.name===name)){
    const c=await admin.storage.createBucket(name,{public:false,fileSizeLimit:1048576,allowedMimeTypes:["application/json"]});
    if(c.error&&!/already exists/i.test(c.error.message||""))throw new Error(c.error.message||"No se pudo completar la operación.");
  }
  return name;
}
Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
  if(req.method!=="POST")return reply({ok:false,error:"Método no permitido."},405);
  try{
    const rawBody=await req.text();if(rawBody.length>500000)return reply({ok:false,error:"El proyecto supera el tamaño permitido."},413);
    const body=JSON.parse(rawBody);
    const action=String(body?.action||"ai");
    const studentId=String(body?.studentId||"");
    const deviceId=String(body?.deviceId||"").slice(0,100);
    if(!/^[0-9a-f-]{36}$/i.test(studentId)||!deviceId)return reply({ok:false,error:"Faltan datos de acceso."},400);
    const {pub,admin}=await clients();
    const projects=await validate(pub,studentId,deviceId);
    const projectId=String(body?.projectId||"legacy");
    if(!["legacy","new"].includes(projectId)&&! /^[0-9a-f-]{36}$/i.test(projectId))return reply({ok:false,error:"Proyecto no válido."},400);
    const ai=aiStatus();
    if(action==="status")return reply({ok:true,ai});
    if(!["load","save","list","submit","ai"].includes(action))return reply({ok:false,error:"Acción no permitida."},400);
    const title=String(body?.title||"Mi proyecto").trim().slice(0,80)||"Mi proyecto";
    const files=cleanFiles(body?.files);
    const history=Array.isArray(body?.history)?body.history.slice(-30).map((m:any)=>({role:String(m?.role||"").slice(0,10),text:String(m?.text||"").slice(0,1400)})):[];
    if(Object.keys(files).length>45||size(files)>220000)return reply({ok:false,error:"El proyecto es demasiado grande."},413);
    if(action==="save"&&!files["index.html"])return reply({ok:false,error:"El proyecto necesita index.html."},400);
    if(action==="list"){
      const result=projects.filter((p:any)=>p.type==="web");
      const bucket=await ensureBucket(admin),d=await admin.storage.from(bucket).download("students/"+studentId+"/studio.json");
      if(!d.error){const legacy=JSON.parse(await d.data.text());result.push({id:"legacy",title:legacy.title||"Mi portal de juegos",status:"draft",updated_at:legacy.updatedAt});}
      else if(!/not found|object not found/i.test(d.error.message||""))throw new Error(d.error.message||"No se pudo completar la operación.");
      return reply({ok:true,projects:result,ai});
    }
    if((action==="save"&&projectId!=="legacy")||action==="submit"){
      let id=projectId;
      if(action==="save"||id==="legacy"){
        if(!files["index.html"])return reply({ok:false,error:"El proyecto necesita index.html."},400);
        const result=await pub.rpc("club_crea_guardar",{p_student:studentId,p_device:deviceId,p_project:["legacy","new"].includes(id)?null:id,p_type:"web",p_title:title,p_content:{studio:{version:2,files,history}}});
        if(result.error)throw new Error(result.error.message||"No se pudo completar la operación.");id=result.data.id;
        if(action==="save")return reply({ok:true,id,updatedAt:result.data.updated_at});
      }
      const review=await pub.rpc("club_crea_solicitar_revision",{p_student:studentId,p_device:deviceId,p_project:id});
      return reply({ok:true,id,submitted:!review.error,...(review.error?{error:review.error.message}:{})});
    }
    if(action==="load"&&projectId!=="legacy"){
      const d=await pub.rpc("club_crea_cargar",{p_student:studentId,p_device:deviceId,p_project:projectId});if(d.error)throw new Error(d.error.message||"No se pudo completar la operación.");
      if(!d.data?.content?.studio?.files)return reply({ok:false,error:"Este proyecto se abre desde su taller original."},400);
      return reply({ok:true,project:{...d.data.content.studio,id:d.data.id,title:d.data.title,status:d.data.status,reviewNote:d.data.review_note},ai});
    }

    if(action==="load"||action==="save"){
      const bucket=await ensureBucket(admin);
      const path="students/"+studentId+"/studio.json";
      if(action==="load"){
        const d=await admin.storage.from(bucket).download(path);
        if(d.error){
          if(/not found|object not found/i.test(d.error.message||""))return reply({ok:true,project:null,ai});
          throw new Error(d.error.message||"No se pudo completar la operación.");
        }
        return reply({ok:true,project:{...JSON.parse(await d.data.text()),id:"legacy"},ai});
      }
      const project={version:2,title,updatedAt:new Date().toISOString(),files,history};
      const up=await admin.storage.from(bucket).upload(path,new Blob([JSON.stringify(project)],{type:"application/json"}),{upsert:true,contentType:"application/json"});
      if(up.error)throw new Error(up.error.message||"No se pudo completar la operación.");
      return reply({ok:true,updatedAt:project.updatedAt});
    }

    const prompt=String(body?.prompt||"").trim().slice(0,1200);
    const mode=body?.mode==="plan"?"plan":"build";

    if(!prompt)return reply({ok:false,error:"Escribí qué querés construir."},400);
    if(badPersonal(prompt))return reply({ok:false,error:"Quitá datos personales antes de consultar a la IA."},400);
    if(Object.keys(files).length>45||size(files)>220000)return reply({ok:false,error:"El proyecto es demasiado grande para esta versión."},413);

    const system=`Sos el copiloto constructor de Krueka Studio IA para estudiantes Juniors. Ayudás a construir videojuegos web visibles en el navegador.
REGLAS:
- Una solicitud = una tarea.
- Conservá lo que ya funciona y no borres juegos anteriores.
- No agregues nada no pedido.
- Priorizá HTML, CSS y JavaScript estándar, sin dependencias, CDN, fetch ni APIs externas.
- Podés usar Canvas, SVG, DOM, CSS y WebGL nativo.
- Nunca solicites datos personales.
- Respuestas cortas. No expliques código largo salvo pedido.
- PLANEAR: no modifiques archivos.
- CONSTRUIR: devolvé contenido COMPLETO solo de archivos modificados.
- El resultado debe funcionar dentro de un navegador.
DEVOLVÉ SOLO JSON válido:
{"summary":"1-3 frases","test":"qué debe probar","files":{"ruta.ext":"contenido completo"}}
En PLANEAR files debe ser {}.`;
    const project=Object.keys(files).sort().map(n=>`\n--- FILE: ${n} ---\n${String(files[n]).slice(0,60000)}`).join("");
    const recent=history.slice(-6).map((m:any)=>`${m?.role==="user"?"ALUMNO":"IA"}: ${String(m?.text||"").slice(0,1000)}`).join("\n");
    const user=`MODO: ${mode==="plan"?"PLANEAR":"CONSTRUIR"}\nINSTRUCCIÓN: ${prompt}\n\nHISTORIAL:\n${recent||"(vacío)"}\n\nPROYECTO:${project}`;
    if(project.length>65000)return reply({ok:false,error:"Este proyecto es grande para el cupo de IA. Trabajá en un proyecto más pequeño o editá sus archivos."},413);
    const result=await generate(system,user);
    const p=result.parsed;
    const edits=mode==="build"?cleanFiles(p?.files):{};
    if(size({...files,...edits})>220000||Object.keys({...files,...edits}).length>45)throw new Error("El cambio de IA supera el tamaño del proyecto.");
    return reply({ok:true,model:result.model,summary:String(p?.summary||"Listo.").slice(0,1000),test:String(p?.test||"Abrí la vista previa y comprobá el cambio.").slice(0,800),files:edits});
  }catch(e){return reply({ok:false,error:String(e instanceof Error?e.message:e).slice(0,600),setupRequired:e instanceof ProviderSetupError},e instanceof ProviderSetupError?503:500)}
});
