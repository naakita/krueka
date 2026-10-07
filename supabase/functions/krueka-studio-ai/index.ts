import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json"}});
const allowed=/\.(html|css|js|json|svg|txt|md)$/i;
const badPersonal=(s:string)=>/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/.test(s)||/(?:\+?595\s*)?0?9\d{2}[\s.-]?\d{3}[\s.-]?\d{3}/.test(s)||/\b(?:contrase(?:ñ|n)a|password|c[eé]dula|tarjeta de cr[eé]dito)\b/i.test(s);
const size=(files:Record<string,string>)=>Object.values(files).reduce((n,v)=>n+String(v||"").length,0);
function cleanFiles(raw:any){
  const out:Record<string,string>={};
  if(!raw||typeof raw!=="object")return out;
  for(const [k,v] of Object.entries(raw)){
    const name=String(k);
    if(!allowed.test(name)||name.includes("..")||name.startsWith("/"))continue;
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
async function muse(system:string,user:string){
  const key=Deno.env.get("OPENCODE_API_KEY")||"";
  const headers:Record<string,string>={"Content-Type":"application/json"};
  if(key)headers["Authorization"]="Bearer "+key;
  const r=await fetch("https://opencode.ai/zen/v1/responses",{method:"POST",headers,body:JSON.stringify({model:"muse-spark-1.3-contributor-free",instructions:system,input:user,max_output_tokens:12000})});
  if(!r.ok){console.warn("Studio IA provider",{model:"muse-spark-1.3-contributor-free",status:r.status,keyConfigured:!!key});throw new Error("Muse Spark "+r.status);}
  return {data:await r.json(),model:"Muse Spark 1.3 Contributor Free"};
}
async function fallback(system:string,user:string){
  const key=Deno.env.get("OPENCODE_API_KEY")||"";
  const headers:Record<string,string>={"Content-Type":"application/json"};
  if(key)headers["Authorization"]="Bearer "+key;
  for(const model of ["nemotron-3.5-lightning-free","mimo-v2.6-flash-free","ling-3.1-flash-free"]){
    const r=await fetch("https://opencode.ai/zen/v1/chat/completions",{method:"POST",headers,body:JSON.stringify({model,messages:[{role:"system",content:system},{role:"user",content:user}],max_tokens:12000,temperature:.2})});
    if(r.ok)return {data:await r.json(),model};
    console.warn("Studio IA provider",{model,status:r.status,keyConfigured:!!key});
  }
  throw new Error("Los modelos gratuitos de IA no respondieron.");
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
}
async function ensureBucket(admin:any){
  const name="krueka-studio";
  const list=await admin.storage.listBuckets();
  if(list.error)throw list.error;
  if(!(list.data||[]).some((b:any)=>b.name===name)){
    const c=await admin.storage.createBucket(name,{public:false,fileSizeLimit:1048576,allowedMimeTypes:["application/json"]});
    if(c.error&&!/already exists/i.test(c.error.message||""))throw c.error;
  }
  return name;
}
Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
  if(req.method!=="POST")return reply({ok:false,error:"Método no permitido."},405);
  try{
    const body=await req.json();
    const action=String(body?.action||"ai");
    const studentId=String(body?.studentId||"");
    const deviceId=String(body?.deviceId||"").slice(0,100);
    if(!studentId||!deviceId)return reply({ok:false,error:"Faltan datos de acceso."},400);
    const {pub,admin}=await clients();
    await validate(pub,studentId,deviceId);

    if(action==="load"||action==="save"){
      const bucket=await ensureBucket(admin);
      const path="students/"+studentId+"/studio.json";
      if(action==="load"){
        const d=await admin.storage.from(bucket).download(path);
        if(d.error){
          if(/not found|object not found/i.test(d.error.message||""))return reply({ok:true,project:null});
          throw d.error;
        }
        return reply({ok:true,project:JSON.parse(await d.data.text())});
      }
      const files=cleanFiles(body?.files);
      const history=Array.isArray(body?.history)?body.history.slice(-30).map((m:any)=>({role:String(m?.role||"").slice(0,10),text:String(m?.text||"").slice(0,1400)})):[];
      if(Object.keys(files).length>45||size(files)>220000)return reply({ok:false,error:"El proyecto es demasiado grande."},413);
      const project={version:1,updatedAt:new Date().toISOString(),files,history};
      const up=await admin.storage.from(bucket).upload(path,new Blob([JSON.stringify(project)],{type:"application/json"}),{upsert:true,contentType:"application/json"});
      if(up.error)throw up.error;
      return reply({ok:true,updatedAt:project.updatedAt});
    }

    const prompt=String(body?.prompt||"").trim().slice(0,1200);
    const mode=body?.mode==="plan"?"plan":"build";
    const files=cleanFiles(body?.files);
    const history=Array.isArray(body?.history)?body.history.slice(-8):[];
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
    const recent=history.map((m:any)=>`${m?.role==="user"?"ALUMNO":"IA"}: ${String(m?.text||"").slice(0,1000)}`).join("\n");
    const user=`MODO: ${mode==="plan"?"PLANEAR":"CONSTRUIR"}\nINSTRUCCIÓN: ${prompt}\n\nHISTORIAL:\n${recent||"(vacío)"}\n\nPROYECTO:${project}`;
    let result;try{result=await muse(system,user)}catch(_e){result=await fallback(system,user)}
    const raw=extract(result.data);if(!raw)throw new Error("La IA respondió sin contenido utilizable.");
    const p=parse(raw);
    return reply({ok:true,model:result.model,summary:String(p?.summary||"Listo.").slice(0,1000),test:String(p?.test||"Abrí la vista previa y comprobá el cambio.").slice(0,800),files:mode==="build"?cleanFiles(p?.files):{}});
  }catch(e){return reply({ok:false,error:String(e instanceof Error?e.message:e).slice(0,600)},500)}
});
