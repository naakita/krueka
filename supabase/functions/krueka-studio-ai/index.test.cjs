const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),{stripTypeScriptTypes}=require('node:module');
const source=fs.readFileSync(require('node:path').join(__dirname,'index.ts'),'utf8').replace(/^import .*;\n/gm,'');
const student='11111111-1111-4111-8111-111111111111',project='22222222-2222-4222-8222-222222222222',rows=new Map(),bucket=new Map(),env={SUPABASE_URL:'https://test.invalid',SUPABASE_ANON_KEY:'public',SUPABASE_SERVICE_ROLE_KEY:'server'};let handler,upstreamCalls=0,bucketCalls=0,replyMode='ok',quotaBlock=false,settled=[],reserved=[],providerPause=null;
const pub={rpc:async(name,a)=>{
 if(a.p_device!=='test-device')return {error:{message:'Dispositivo no autorizado'}};
 if(name==='club_crea_listar')return {data:Array.from(rows.values()).map(x=>({id:x.id,type:'web',title:x.title,status:x.status}))};
 if(name==='club_crea_guardar'){const p={id:a.p_project||project,title:a.p_title,content:a.p_content,status:'draft',updated_at:'today'};rows.set(p.id,p);return {data:p};}
 if(name==='club_crea_cargar')return rows.has(a.p_project)?{data:rows.get(a.p_project)}:{error:{message:'Proyecto no encontrado'}};
 if(name==='club_crea_solicitar_revision'){rows.get(a.p_project).status='review';return {data:{ok:true}};}
 throw new Error('Unknown RPC '+name);
}};
const admin={rpc:async(name,a)=>{if(name==='club_studio_ai_status')return {data:{usedToday:2,dailyLimit:12,budgetAvailable:true}};if(name==='club_studio_ai_reserve'){reserved.push(a);return {data:quotaBlock?{ok:false,code:'budget',error:'Cupo agotado'}:{ok:true,requestId:'reserve'}}}if(name==='club_studio_ai_finish'){settled.push(a);return {data:null}}throw new Error(name)},storage:{listBuckets:async()=>(bucketCalls++,{data:[{name:'krueka-studio'}]}),from:()=>({download:async path=>bucket.has(path)?{data:new Blob([bucket.get(path)])}:{error:{message:'Object not found'}},upload:async(path,data)=>{bucketCalls++;bucket.set(path,await data.text());return {data:{}}}})}};
const context=vm.createContext({console,Response,Request,Blob,AbortSignal,TextEncoder,Deno:{env:{get:k=>env[k]},serve:h=>handler=h},createClient:(_url,key)=>key==='server'?admin:pub,fetch:async(url,options)=>{upstreamCalls++;assert.equal(url,'https://api.openai.com/v1/responses');const body=JSON.parse(options.body);assert.equal(body.model,'gpt-6-luna');assert.equal(body.service_tier,'default');assert.equal(body.store,false);assert.equal(body.max_output_tokens,2000);assert.equal(body.reasoning.effort,'none');assert.equal(body.text.format.strict,true);assert.ok(body.text.format.schema.required.includes('patches'));assert.ok(!body.tools);assert.ok(!options.body.includes('student_id'));if(replyMode==='timeout')throw new Error('Timeout');if(replyMode==='auth')return new Response('{}',{status:401});const usesPatches=['patch','sequence','missing','blank','atomic','too-many'].includes(replyMode);let patches=usesPatches?[{path:'style.css',find:'body{}',replace:'body{color:red}'}]:[];if(replyMode==='sequence')patches=[{path:'style.css',find:'body{}',replace:'body{color:blue}'},{path:'style.css',find:'body{color:blue}',replace:'body{color:red}'}];if(replyMode==='missing')patches[0].path='missing.css';if(replyMode==='blank')patches[0].find='';if(replyMode==='atomic')patches.push({path:'style.css',find:'absent',replace:'no'});if(replyMode==='too-many')patches=Array(33).fill(patches[0]);const result=JSON.stringify({summary:'Cambio',files:usesPatches?[]:[{path:replyMode==='invalid'?'../bad.js':'style.css',content:'body{color:red}'}],patches,test:'Probá'});let output=[{type:'message',role:'assistant',content:[{type:'output_text',text:result}]}];
if(replyMode==='commentary')output=[{type:'message',role:'assistant',channel:'commentary',content:[{type:'output_text',text:'Voy a corregir los controles.'}]},{type:'message',role:'assistant',channel:'final',content:[{type:'output_text',text:result}]}];
if(replyMode==='multiple')output=[{type:'message',role:'assistant',content:[{type:'output_text',text:'Voy a corregir los controles.'}]},{type:'message',role:'assistant',content:[{type:'output_text',text:result}]}];
if(replyMode==='split')output=[{type:'message',role:'assistant',channel:'final',content:[{type:'output_text',text:result.slice(0,15)},{type:'output_text',text:result.slice(15)}]}];
if(replyMode==='refusal')output=[{type:'message',role:'assistant',channel:'final',content:[{type:'refusal',refusal:'No permitido'}]}];
if(replyMode==='malformed')output=[{type:'message',role:'assistant',channel:'final',content:[{type:'output_text',text:'Voy a corregir los controles.'}]}];
return new Response(JSON.stringify({status:replyMode==='partial'?'incomplete':'completed',usage:{input_tokens:1000,output_tokens:2000},output_text:replyMode==='commentary'?'Voy a corregir los controles.':undefined,output}),{status:200});}});
admin.from=name=>{assert.equal(name,'club_studio_ai_provider');return {select:()=>({eq:()=>({maybeSingle:async()=>({data:providerPause})})}),upsert:async data=>{providerPause=data;return {data:null}}}};
vm.runInContext(stripTypeScriptTypes(source),context);
const call=async b=>{const r=await handler(new Request('https://test.invalid',{method:'POST',body:JSON.stringify({studentId:student,deviceId:'test-device',...b})}));return {status:r.status,...await r.json()};};
(async()=>{
 assert.equal((await call({action:'load'})).project,null);const files={'index.html':'<!doctype html><h1>Prueba</h1>','style.css':'body{}'};
 const history=[{role:'user',text:'Agregá estrellas',pending:true},{role:'ai',text:'Cambio',artifact:{title:'Prueba',files:['style.css']}}];
 assert.equal((await call({action:'save',files,history,draft:'Idea sin enviar',title:'Anterior'})).ok,true);const legacy=(await call({action:'load'})).project;assert.equal(legacy.draft,'Idea sin enviar');assert.equal(legacy.history[0].pending,true);assert.equal(legacy.history[1].artifact.title,'Prueba');
 assert.equal((await call({action:'save',projectId:'new',files,history,draft:'Otro',title:'Nuevo'})).id,project);assert.equal((await call({action:'load',projectId:project})).project.draft,'Otro');
 assert.equal((await call({action:'list'})).projects.length,2);assert.equal((await call({action:'submit',projectId:project})).submitted,true);
 const count=bucketCalls;assert.equal((await call({action:'load',deviceId:'wrong-device'})).ok,false);assert.equal(bucketCalls,count);
 const unavailable=await call({action:'ai',prompt:'Agregá monedas',files});assert.equal(unavailable.status,503);assert.equal(unavailable.setupRequired,true);assert.equal(upstreamCalls,0);
 env.OPENAI_API_KEY='test-only';assert.equal((await call({action:'status'})).ai.ready,false);env.STUDIO_AI_ENABLED='true';assert.equal((await call({action:'status'})).ai.ready,true);
 const ai=await call({action:'ai',prompt:'Cambiá color',files,model:'gpt-6-astra'});assert.equal(ai.files['style.css'],'body{color:red}');assert.match(ai.model,/gpt-6-luna/);assert.ok(reserved[0].p_micros>=1000);assert.equal(settled.at(-1).p_actual_micros,1100);
 quotaBlock=true;const before=upstreamCalls;assert.equal((await call({action:'ai',prompt:'Cambiá color',files})).status,429);assert.equal(upstreamCalls,before);quotaBlock=false;
 for(const mode of ['partial','invalid']){replyMode=mode;const d=await call({action:'ai',prompt:'Cambiá color',files});assert.equal(d.ok,false);assert.equal(d.files,undefined);assert.equal(d.ai.usedToday,2);assert.equal(settled.at(-1).p_actual_micros,1100)}

 for(const mode of ['patch','sequence']){replyMode=mode;const d=await call({action:'ai',prompt:'Cambiá color',files});assert.equal(d.files['style.css'],'body{color:red}');assert.equal(files['style.css'],'body{}');}
 for(const mode of ['missing','blank','atomic','too-many']){replyMode=mode;const d=await call({action:'ai',prompt:'Cambiá color',files});assert.equal(d.status,422);assert.equal(d.code,'invalid_change');assert.equal(d.ok,false);assert.equal(d.files,undefined);assert.equal(files['style.css'],'body{}');assert.equal(d.ai.usedToday,2);}
 replyMode='patch';const ambiguous=await call({action:'ai',prompt:'Cambiá color',files:{...files,'style.css':'body{}body{}'}});assert.equal(ambiguous.ok,false);assert.equal(ambiguous.files,undefined);
 const plan=await call({action:'ai',mode:'plan',prompt:'Qué mejorarías',files});assert.equal(plan.ok,true);assert.equal(Object.keys(plan.files).length,0);

 const configFiles={...files,'game-config.js':'window.KRUEKA_GAME = {"kind":"stars","lives":3};','game.js':'BIG_MOTOR'+('/* motor conservado */\n'.repeat(3200))};
 const defaultFetch=context.fetch;let foreignChange=false;
 context.fetch=async(_url,options)=>{upstreamCalls++;const body=JSON.parse(options.body);assert.equal(body.max_output_tokens,512);assert.equal(body.model,'gpt-6-luna');assert.ok(options.body.length<5000);assert.ok(!options.body.includes('BIG_MOTOR'));assert.ok(body.input[1].content.includes(configFiles['game-config.js']));
  return new Response(JSON.stringify({status:'completed',usage:{input_tokens:400,output_tokens:200},output_text:JSON.stringify({summary:'Cinco vidas',test:'Probá',files:[],patches:[foreignChange?{path:'style.css',find:'body{}',replace:'body{color:red}'}:{path:'game-config.js',find:'"lives":3',replace:'"lives":5'}]})}),{status:200});};
 const small=await call({action:'ai',prompt:'Cambiá las vidas a 5',files:configFiles});assert.equal(small.ok,true);assert.equal(small.files['game-config.js'],'window.KRUEKA_GAME = {"kind":"stars","lives":5};');assert.equal(small.files['game.js'],undefined);assert.ok(configFiles['game.js'].length>65000);
 const smallPlan=await call({action:'ai',mode:'plan',prompt:'Cómo agrego un enemigo que persiga la nave',files:configFiles});assert.equal(smallPlan.ok,true);assert.equal(Object.keys(smallPlan.files).length,0);
 foreignChange=true;assert.equal((await call({action:'ai',prompt:'Cambiá vidas a 5',files:configFiles})).code,'invalid_change');
 const noPrivate=upstreamCalls;assert.equal((await call({action:'ai',prompt:'Cambiá vidas a 5',files:{...configFiles,'info.txt':'ejemplo@test.com'}})).status,400);assert.equal(upstreamCalls,noPrivate);
 assert.equal((await call({action:'ai',prompt:'Agregá un enemigo con vidas',files:configFiles})).status,413);context.fetch=defaultFetch;
 assert.equal(context.providerDelay(new Headers({'retry-after':'1800'})),1800,'Nunca adelantar un Retry-After largo');
 assert.equal(context.providerDelay(new Headers({'x-ratelimit-remaining-tokens':'0','x-ratelimit-reset-tokens':'6m0s'})),360);
 assert.equal(context.providerDelay(new Headers({'x-ratelimit-remaining-tokens':'100','x-ratelimit-reset-tokens':'6m0s'})),20);

 for(const mode of ['commentary','multiple','split']){replyMode=mode;const d=await call({action:'ai',prompt:'no se esta moviendo el personaje',files});assert.equal(d.ok,true);assert.equal(d.files['style.css'],'body{color:red}');}
 for(const mode of ['refusal','malformed']){replyMode=mode;const d=await call({action:'ai',prompt:'no se esta moviendo el personaje',files});assert.equal(d.ok,false);assert.equal(d.files,undefined);assert.ok(!/Unexpected token|JSON|SyntaxError/.test(d.error));assert.equal(d.ai.usedToday,2);}
 replyMode='timeout';assert.equal((await call({action:'ai',prompt:'Cambiá color',files})).ok,false);assert.equal(settled.at(-1).p_actual_micros,null);
 replyMode='auth';assert.equal((await call({action:'ai',prompt:'Cambiá color',files})).setupRequired,true);assert.equal(settled.at(-1).p_actual_micros,0);
 for(const [code,type,reason] of [['credit_balance_exhausted','insufficient_quota','provider_credit_balance'],['project_spend_limit_exceeded','insufficient_quota','provider_spend_limit'],['organization_usage_limit_exceeded','insufficient_quota','provider_usage_limit'],['insufficient_quota','insufficient_quota','provider_quota'],['rate_limit_exceeded','rate_limit_error','provider_rate_limit'],['other','','provider_limit']]){
  providerPause=null;context.fetch=async()=>{upstreamCalls++;return new Response(JSON.stringify({error:{code,type,message:'No exponer mensaje del proveedor'}}),{status:429,headers:{'retry-after':'40'}})};
  const limited=await call({action:'ai',prompt:'Cambiá color',files});assert.equal(limited.status,429);assert.equal(limited.code,reason);assert.equal(limited.ai.ready,false);assert.equal(limited.ai.reason,reason);assert.equal(settled.at(-1).p_actual_micros,0);assert.ok(!limited.error.includes('No exponer'));
  const count=upstreamCalls;assert.equal((await call({action:'status'})).ai.ready,false);assert.equal((await call({action:'ai',prompt:'Cambiá color',files})).code,reason);assert.equal(upstreamCalls,count,'La pausa no llama al proveedor');
  providerPause.paused_until='2000-01-01T00:00:00Z';assert.equal((await call({action:'status'})).ai.ready,true);
 }
 providerPause=null;
 assert.equal((await call({action:'unknown'})).status,400);assert.equal((await call({action:'ai',prompt:'mi correo ejemplo@test.com',files})).status,400);
 const final=upstreamCalls;assert.equal((await call({action:'ai',prompt:'Cambiá color',files:{...files,'info.txt':'ejemplo@test.com'}})).status,400);assert.equal(upstreamCalls,final);
 console.log('PASS: fragmentos exactos/secuenciales; rechazo atómico de ambigüedad/ruta/fragmento inválido; plan sin cambios; contador en errores; historial, borradores y tarjetas; proyectos privados; API desactivada; modelo fijo; reserva previa; cuotas; consumo; respuestas incompletas/invalidas; fallo sin reintentos ni cambios parciales.');
})().catch(e=>{console.error(e);process.exit(1)});
