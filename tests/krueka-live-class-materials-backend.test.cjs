/* Ejecuta el handler real de la Edge Function con Auth, Postgres y Storage simulados. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {stripTypeScriptTypes}=require('node:module'),{webcrypto,createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'supabase/functions/krueka-actividades-clase/index.ts'),'utf8');
const executable=stripTypeScriptTypes(source.replace(/^import[^\n]+\n/gm,''));
const CLASS='11111111-1111-4111-8111-111111111111',OTHER_CLASS='22222222-2222-4222-8222-222222222222';
const CODE='ABCDEFGHJKLM',OTHER_CODE='NPQRSTUVWXYZ',MAX=10*1024*1024,ORIGIN='https://www.krueka.com';
const digest=value=>createHash('sha256').update(value).digest('hex');
const identity=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const objectPath=(id,activity=CLASS)=>'materials/'+activity+'/'+id+'.bin';
const binary=Uint8Array.from([0,255,17,80,75,128,3,10]);
const pdf=Buffer.from('%PDF-1.4\n'+('Contenido de ensayo. '.repeat(10))+'\n%%EOF');
const office=part=>Buffer.from('PK\x03\x04'+('\0'.repeat(40))+'[Content_Types].xml\0'+part+'\0'+('ensayo '.repeat(40)));
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6iKsAAAAASUVORK5CYII=','base64');

function harness(){
 const state={
  tables:{
   profiles:[{id:'teacher-a',role:'docente',activo:true},{id:'teacher-b',role:'docente',activo:true},{id:'student',role:'alumno',activo:true},{id:'inactive',role:'docente',activo:false}],
   krueka_live_activities:[{id:CLASS,teacher_id:'teacher-a',accepting:true,code_hash:digest(CODE),title:'Actividad de ensayo',grade:'Curso de ensayo',subject:'Informática',instructions:'Leé los materiales y realizá la actividad.'},{id:OTHER_CLASS,teacher_id:'teacher-b',accepting:true,code_hash:digest(OTHER_CODE),title:'Otra actividad'}],
   krueka_live_materials:[],krueka_live_submissions:[]
  },objects:new Map(),uploads:[],removals:[],downloads:[],queries:[],rpcCalls:[],onUpload:null,onDownload:null,beforeInsert:null,afterInsert:null,afterRead:null,queryFailure:null
 };
 const users=Object.fromEntries(['teacher-a','teacher-b','student','inactive','unconfirmed'].map(id=>[id,{id,email:id+'@example.invalid',email_confirmed_at:id==='unconfirmed'?null:'2026-01-01T00:00:00Z'}]));
 class Query{
  constructor(table){this.table=table;this.filters=[];this.fields='*';this.options={};this.action='select';this.values=null;this.one=false;this.cap=Infinity;}
  select(fields,options={}){this.fields=fields;this.options=options;return this;}
  eq(key,value){this.filters.push([key,value]);return this;}
  order(){return this;}
  limit(value){this.cap=value;return this;}
  insert(values){this.action='insert';this.values=values;return this;}
  update(values){this.action='update';this.values=values;return this;}
  delete(){this.action='delete';return this;}
  maybeSingle(){this.one=true;return this;}
  single(){this.one=true;return this;}
  then(resolve,reject){return this.execute().then(resolve,reject);}
  async execute(){
   state.queries.push({table:this.table,action:this.action,filters:[...this.filters],options:this.options});
   const failure=state.queryFailure?.(this);if(failure)return {data:null,error:failure,count:null};
   const rows=state.tables[this.table];assert.ok(rows,'Tabla inesperada '+this.table);
   let result=rows.filter(row=>this.filters.every(([key,value])=>row[key]===value));
   if(this.action==='insert'){
    await state.beforeInsert?.(this.values,this.table);
    const row={uploaded_at:'2026-11-27T12:00:00Z',...this.values};
    if(this.table==='krueka_live_materials'){
     const activity=state.tables.krueka_live_activities.find(a=>a.id===row.activity_id);
     if(!activity?.accepting||rows.filter(m=>m.activity_id===row.activity_id).length>=20)return {data:null,error:{message:'Guard de clase y cupo'},count:null};
     if(rows.some(m=>m.id===row.id||m.object_path===row.object_path))return {data:null,error:{code:'23505'},count:null};
     assert.match(row.object_path,/^materials\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.bin$/);
     assert.ok(row.size_bytes>=1&&row.size_bytes<=MAX);
    }
    rows.push(row);result=[row];
    const error=await state.afterInsert?.(row,this.table);if(error)return {data:null,error,count:null};
   }else if(this.action==='update')result.forEach(row=>Object.assign(row,this.values));
   else if(this.action==='delete')state.tables[this.table]=rows.filter(row=>!result.includes(row));
   const count=result.length;
   const selected=result.slice(0,this.cap).map(row=>this.fields==='*'?{...row}:Object.fromEntries(this.fields.split(',').map(key=>[key,row[key]])));
   if(this.action==='select')await state.afterRead?.(this);
   return {data:this.options.head?null:this.one?(selected[0]||null):selected,error:null,count:this.options.count?count:null};
  }
 }
 const supa={
  auth:{getUser:async token=>({data:{user:users[token]||null},error:users[token]?null:{message:'Sesión inválida'}})},
  from:table=>new Query(table),
  storage:{from(bucket){assert.equal(bucket,'krueka-actividades-clase');return {
   async upload(key,blob,options){
    state.uploads.push({key,blob,options});assert.equal(options.upsert,false);
    const intercepted=await state.onUpload?.(key,blob,options);if(intercepted)return intercepted;
    const bytes=new Uint8Array(await blob.arrayBuffer());
    if(state.objects.has(key))return {error:{code:'Duplicate',statusCode:'409'}};
    state.objects.set(key,{bytes,type:options.contentType});return {data:{path:key},error:null};
   },
   async download(key){state.downloads.push(key);await state.onDownload?.(key);const file=state.objects.get(key);return file?{data:new Blob([file.bytes],{type:file.type}),error:null}:{data:null,error:{message:'Archivo ausente'}};},
   async remove(keys){state.removals.push(...keys);keys.forEach(key=>state.objects.delete(key));return {data:[],error:null};}
  };}},
  async rpc(name,params){
   state.rpcCalls.push({name,params});
   const activity=state.tables.krueka_live_activities.find(a=>a.id===params.p_activity_id&&a.code_hash===params.p_code_hash);
   if(!activity?.accepting)return {data:false,error:null};
   if(name==='krueka_live_finalize')state.tables.krueka_live_submissions.push({id:params.p_submission_id,activity_id:params.p_activity_id,file_name:params.p_filename,object_path:params.p_object_path});
   else assert.equal(name,'krueka_live_reserve');
   return {data:true,error:null};
  }
 };
 let handler;
 const context=vm.createContext({createClient:()=>supa,Deno:{env:{get:()=>''},serve:fn=>{handler=fn;}},Request,Response,FormData,File,Blob,TextEncoder,TextDecoder,Uint8Array,crypto:webcrypto,console:{error(){}}});
 vm.runInContext(executable,context,{filename:'krueka-actividades-clase/index.ts'});assert.equal(typeof handler,'function');
 function upload(name,bytes,options={}){
  const form=new FormData();form.set('action','upload-material');form.set('activity_id',options.activity||CLASS);form.set('material',new File([bytes],name,{type:options.type||'application/octet-stream'}));
  if(options.id!==undefined)form.set('upload_id',options.id);
  const headers={origin:options.origin||ORIGIN};if(options.token!==null)headers.authorization='Bearer '+(options.token||'teacher-a');
  return handler(new Request('https://backend.invalid/materials',{method:'POST',headers,body:form}));
 }
 function action(body,token){const headers={'content-type':'application/json',origin:ORIGIN};if(token)headers.authorization='Bearer '+token;return handler(new Request('https://backend.invalid/materials',{method:'POST',headers,body:JSON.stringify(body)}));}
 function seed(n,activity=CLASS){for(let i=0;i<n;i++){const id=identity(1000+i),key=objectPath(id,activity);state.tables.krueka_live_materials.push({id,activity_id:activity,file_name:'archivo-'+i,object_path:key,mime_type:'application/octet-stream',size_bytes:binary.length,uploaded_at:'2026-11-27T12:00:00Z'});state.objects.set(key,{bytes:binary,type:'application/octet-stream'});}}
 return {state,handler,upload,action,seed,activity:state.tables.krueka_live_activities[0]};
}

test('doce formatos y nombres sin extensión conservan todos sus bytes en la descarga privada',async()=>{
 const h=harness(),samples=[
  ['Guía (1).pdf',pdf,'application/pdf'],
  ['Texto.docx',office('word/document.xml'),'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ['Cálculos.xlsx',office('xl/workbook.xml'),'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  ['Presentación.pptx',office('ppt/presentation.xml'),'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  ['Imagen.png',png,'image/png'],['Lectura.txt',Buffer.from('Una lectura de ensayo.'),'text/plain'],
  ['Proyecto.sb3',binary,'application/octet-stream'],['Escena.blend',binary,'application/octet-stream'],
  ['Video.mp4',binary,'application/octet-stream'],['Página.html',Buffer.from('<script>parent.document.body.remove()</script>'),'application/octet-stream'],
  ['Dibujo.svg',Buffer.from('<svg onload="alert(1)"></svg>'),'application/octet-stream'],['LICENSE',binary,'application/octet-stream']
 ];
 for(let i=0;i<samples.length;i++){
  const [name,bytes,mime]=samples[i],id=identity(i+1),response=await h.upload(name,bytes,{id,type:'text/html'}),body=await response.json();
  assert.equal(response.status,200,JSON.stringify(body));assert.equal(body.material.id,id);assert.equal(body.material.file_name,name);assert.equal(body.material.mime_type,mime);assert.equal(body.material.size_bytes,bytes.length);
  const download=await h.action({action:'material',code:CODE,material_id:id});
  assert.equal(download.status,200);assert.deepEqual(Buffer.from(await download.arrayBuffer()),Buffer.from(bytes));
  assert.equal(download.headers.get('content-type'),mime);assert.match(download.headers.get('content-disposition'),/^attachment; filename\*=UTF-8''/);
  assert.equal(decodeURIComponent(download.headers.get('content-disposition').split("UTF-8''")[1]),name);
  assert.equal(download.headers.get('x-content-type-options'),'nosniff');assert.equal(download.headers.get('content-security-policy'),'sandbox');assert.equal(download.headers.get('cache-control'),'no-store, private');
 }
 assert.equal(h.state.tables.krueka_live_materials.length,12);assert.equal(h.state.objects.size,12);
 const lookup=await(await h.action({action:'lookup',code:CODE})).json();assert.equal(lookup.activity.materials.length,12);assert.ok(lookup.activity.materials.every(m=>!('object_path' in m)));
});

test('scripts, ejecutables, ZIP con código y contenido no reconocido se guardan como adjuntos inertes',async()=>{
 const h=harness(),zip=Buffer.from('PK\x03\x04\0carpeta/run.ps1\0Contenido de ensayo');
 const samples=[['programa.js',Buffer.from('alert(1)')],['instalador.exe',binary],['guion.ps1',Buffer.from('Write-Output ensayo')],['recursos.zip',zip],['falso.pdf',binary],['imagen.png',binary],['sin.tipo-admitido',binary]];
 for(let i=0;i<samples.length;i++){
  const [name,bytes]=samples[i],response=await h.upload(name,bytes,{id:identity(i+30),type:'image/png'}),body=await response.json();assert.equal(response.status,200);assert.equal(body.material.mime_type,'application/octet-stream');
  const saved=h.state.uploads.at(-1);assert.equal(saved.options.contentType,'application/octet-stream');assert.match(saved.key,/\.bin$/);assert.deepEqual(Buffer.from(await saved.blob.arrayBuffer()),Buffer.from(bytes));
 }
});

test('reintentar una respuesta perdida devuelve la misma identidad aun con 20 materiales y no sobrescribe bytes',async()=>{
 const h=harness(),id=identity(60);h.seed(19);
 const first=await(await h.upload('proyecto.sb3',binary,{id})).json();assert.equal(h.state.tables.krueka_live_materials.length,20);
 const retry=await h.upload('proyecto.sb3',Buffer.from('contenido diferente'),{id}),repeated=await retry.json();
 assert.equal(retry.status,200);assert.deepEqual(repeated,first);assert.equal(h.state.uploads.length,1);assert.equal(h.state.tables.krueka_live_materials.length,20);assert.deepEqual(h.state.objects.get(objectPath(id)).bytes,binary);
 const overflow=await h.upload('otro.sb3',binary,{id:identity(61)});assert.equal(overflow.status,400);assert.equal(h.state.uploads.length,1);
});

test('clientes anteriores reciben UUID de servidor y un upload_id inválido no crea objetos',async()=>{
 const h=harness(),response=await h.upload('SIN_EXTENSION',binary),body=await response.json();assert.equal(response.status,200);assert.match(body.material.id,/^[0-9a-f-]{36}$/);assert.ok(h.state.objects.has(objectPath(body.material.id)));
 const invalid=await h.upload('otro',binary,{id:'../../otro'});assert.equal(invalid.status,400);assert.equal(h.state.uploads.length,1);
});

test('JWT, correo confirmado, rol activo y autoría se validan antes de buscar o reutilizar materiales',async()=>{
 const h=harness(),id=identity(70);await h.upload('privado.sb3',binary,{id});const before=h.state.uploads.length;
 for(const token of [null,'expired','unconfirmed','student','inactive','teacher-b']){
  const response=await h.upload('privado.sb3',binary,{id,token});assert.equal(response.status,403,String(token));assert.equal(h.state.uploads.length,before);
 }
 const list=await h.action({action:'list-materials',activity_id:CLASS},'teacher-b');assert.equal(list.status,404);
 h.activity.accepting=false;const closed=await h.upload('privado.sb3',binary,{id});assert.equal(closed.status,403);assert.equal(h.state.uploads.length,before);
});

test('una colisión de UUID en otra clase no devuelve datos ni sustituye su objeto',async()=>{
 const h=harness(),id=identity(80),foreign=await h.upload('del-otro-docente.sb3',binary,{id,activity:OTHER_CLASS,token:'teacher-b'});assert.equal(foreign.status,200);
 const response=await h.upload('mi-archivo.sb3',Buffer.from('otro contenido'),{id});assert.equal(response.status,503);assert.equal(h.state.tables.krueka_live_materials.length,1);assert.ok(h.state.objects.has(objectPath(id,OTHER_CLASS)));assert.deepEqual(h.state.objects.get(objectPath(id,OTHER_CLASS)).bytes,binary);assert.equal(h.state.removals.length,0);
 const body=await response.json();assert.ok(!JSON.stringify(body).includes('del-otro-docente'));
});

test('descargas rechazan código incorrecto, material de otra clase, cierre y código renovado durante la lectura',async()=>{
 const h=harness(),id=identity(90);await h.upload('archivo.sb3',binary,{id});
 assert.equal((await h.action({action:'material',code:'BAD',material_id:id})).status,403);
 assert.equal((await h.action({action:'material',code:OTHER_CODE,material_id:id})).status,404);
 assert.equal(h.state.downloads.length,0);
 h.state.onDownload=()=>{h.activity.code_hash=digest('ZZZZZZZZZZZZ');};assert.equal((await h.action({action:'material',code:CODE,material_id:id})).status,403);
 h.activity.code_hash=digest(CODE);h.state.onDownload=()=>{h.activity.accepting=false;};assert.equal((await h.action({action:'material',code:CODE,material_id:id})).status,403);
 assert.equal((await h.action({action:'lookup',code:CODE})).status,403);
});

test('el cierre durante la subida elimina únicamente el objeto nuevo sin registrar materiales',async()=>{
 const h=harness(),id=identity(100);h.state.onUpload=()=>{h.activity.accepting=false;};
 assert.equal((await h.upload('archivo.sb3',binary,{id})).status,403);assert.equal(h.state.tables.krueka_live_materials.length,0);assert.equal(h.state.objects.size,0);assert.deepEqual(h.state.removals,[objectPath(id)]);
});

test('un conflicto de Storage devuelve el registro concurrente y nunca borra su objeto',async()=>{
 const h=harness(),id=identity(110);h.state.onUpload=async(key,blob,options)=>{
  h.state.objects.set(key,{bytes:new Uint8Array(await blob.arrayBuffer()),type:options.contentType});
  h.state.tables.krueka_live_materials.push({id,activity_id:CLASS,file_name:'archivo.sb3',object_path:key,mime_type:options.contentType,size_bytes:blob.size,uploaded_at:'2026-11-27T12:00:00Z'});
  return {error:{statusCode:'409',message:'Objeto existente'}};
 };
 const response=await h.upload('archivo.sb3',binary,{id}),body=await response.json();assert.equal(response.status,200);assert.equal(body.material.id,id);assert.equal(h.state.tables.krueka_live_materials.length,1);assert.equal(h.state.removals.length,0);assert.equal(h.state.objects.size,1);
});

test('un objeto que quedó sin metadatos tras una interrupción se recupera sólo con sus mismos bytes',async()=>{
 const h=harness(),id=identity(120);h.state.objects.set(objectPath(id),{bytes:binary,type:'application/octet-stream'});
 const response=await h.upload('archivo.sb3',binary,{id}),body=await response.json();assert.equal(response.status,200);assert.equal(body.material.id,id);assert.equal(h.state.removals.length,0);assert.equal(h.state.objects.size,1);assert.equal(h.state.tables.krueka_live_materials.length,1);assert.deepEqual(h.state.objects.get(objectPath(id)).bytes,binary);
});

test('un objeto previo con bytes diferentes requiere una identidad nueva y nunca se sobrescribe ni se borra',async()=>{
 const h=harness(),id=identity(121);h.state.objects.set(objectPath(id),{bytes:binary,type:'application/octet-stream'});
 const changed=new Uint8Array(binary);changed[3]=0;
 for(const bytes of [changed,new Uint8Array(binary.length+1)]){
  const response=await h.upload('archivo.sb3',bytes,{id}),body=await response.json();assert.equal(response.status,409);assert.match(body.error,/Quitá este pendiente y agregalo de nuevo/);
 }
 assert.equal(h.state.removals.length,0);assert.equal(h.state.tables.krueka_live_materials.length,0);assert.deepEqual(h.state.objects.get(objectPath(id)).bytes,binary);
});

test('si fallan registro y comprobación se conserva el objeto y un reintento posterior recupera la carga',async()=>{
 const h=harness(),id=identity(122);let insertFailed=false;
 h.state.queryFailure=query=>{
  if(query.table!=='krueka_live_materials')return null;
  if(query.action==='insert'){insertFailed=true;return {message:'Registro temporalmente no disponible'};}
  return insertFailed?{message:'Comprobación temporalmente no disponible'}:null;
 };
 assert.equal((await h.upload('archivo.sb3',binary,{id})).status,503);assert.equal(h.state.removals.length,0);assert.equal(h.state.objects.size,1);assert.equal(h.state.tables.krueka_live_materials.length,0);
 h.state.queryFailure=null;const retry=await h.upload('archivo.sb3',binary,{id});assert.equal(retry.status,200);assert.equal((await retry.json()).material.id,id);assert.equal(h.state.objects.size,1);assert.equal(h.state.tables.krueka_live_materials.length,1);assert.equal(h.state.removals.length,0);
});

test('recuperar un objeto previo mantiene cupo, cierre y guard transaccional sin borrarlo',async()=>{
 const h=harness(),id=identity(123);h.seed(20);h.state.objects.set(objectPath(id),{bytes:binary,type:'application/octet-stream'});
 assert.equal((await h.upload('archivo.sb3',binary,{id})).status,400);assert.equal(h.state.uploads.length,0);
 h.state.tables.krueka_live_materials.pop();h.state.beforeInsert=()=>{h.activity.accepting=false;};
 assert.equal((await h.upload('archivo.sb3',binary,{id})).status,503);assert.equal(h.state.tables.krueka_live_materials.length,19);assert.equal(h.state.removals.length,0);assert.ok(h.state.objects.has(objectPath(id)));
 assert.equal((await h.upload('archivo.sb3',binary,{id})).status,403);
});

test('una inserción confirmada cuya respuesta se pierde conserva el registro y el archivo',async()=>{
 const h=harness(),id=identity(130);h.state.afterInsert=()=>({message:'Respuesta interrumpida después del commit'});
 const response=await h.upload('archivo.sb3',binary,{id}),body=await response.json();assert.equal(response.status,200);assert.equal(body.material.id,id);assert.equal(h.state.removals.length,0);assert.equal(h.state.objects.size,1);assert.equal(h.state.tables.krueka_live_materials.length,1);
});

test('dos cargas simultáneas no superan 20 registros y el pendiente se puede reintentar al liberar espacio',async()=>{
 const h=harness();h.seed(19);
 let pending=0,release;const both=new Promise(resolve=>{release=resolve;});h.state.onUpload=async()=>{if(++pending===2)release();await both;};
 const results=await Promise.all([h.upload('uno.sb3',binary,{id:identity(140)}),h.upload('dos.sb3',binary,{id:identity(141)})]);
 assert.deepEqual(results.map(r=>r.status).sort(),[200,503]);assert.equal(h.state.tables.krueka_live_materials.length,20);assert.equal(h.state.objects.size,21);assert.equal(h.state.removals.length,0);
 const removed=h.state.tables.krueka_live_materials.shift();h.state.objects.delete(removed.object_path);
 const failed=results.findIndex(response=>response.status===503),retry=await h.upload(failed?'dos.sb3':'uno.sb3',binary,{id:identity(140+failed)});
 assert.equal(retry.status,200);assert.equal(h.state.tables.krueka_live_materials.length,20);assert.equal(h.state.objects.size,20);
});

test('un reintento que registra después de la comprobación del creador no pierde su objeto',async()=>{
 const h=harness(),id=identity(143);let failed=false,registered=false;
 h.state.queryFailure=query=>{if(query.table==='krueka_live_materials'&&query.action==='insert'){failed=true;return {message:'Interrupción de la primera inserción'};}return null;};
 h.state.afterRead=query=>{
  if(!failed||registered||query.table!=='krueka_live_materials'||!query.filters.some(([key,value])=>key==='id'&&value===id))return;
  // La respuesta SELECT ya se calculó como vacía. Otra petición confirma el registro.
  registered=true;h.state.tables.krueka_live_materials.push({id,activity_id:CLASS,file_name:'archivo.sb3',object_path:objectPath(id),mime_type:'application/octet-stream',size_bytes:binary.length,uploaded_at:'2026-11-27T12:00:00Z'});
 };
 assert.equal((await h.upload('archivo.sb3',binary,{id})).status,503);assert.equal(h.state.tables.krueka_live_materials.length,1);assert.ok(h.state.objects.has(objectPath(id)));assert.equal(h.state.removals.length,0);
 h.state.queryFailure=null;assert.equal((await h.upload('archivo.sb3',binary,{id})).status,200);
});

test('dos peticiones simultáneas con el mismo upload_id mantienen un solo archivo y admiten reintento',async()=>{
 const h=harness(),id=identity(145);let pending=0,release;const both=new Promise(resolve=>{release=resolve;});h.state.onUpload=async()=>{if(++pending===2)release();await both;};
 const responses=await Promise.all([h.upload('uno.sb3',binary,{id}),h.upload('uno.sb3',binary,{id})]);
 assert.ok(responses.some(response=>response.status===200));assert.ok(responses.every(response=>[200,503].includes(response.status)));
 const retry=await h.upload('uno.sb3',binary,{id});assert.equal(retry.status,200);assert.equal((await retry.json()).material.id,id);
 assert.equal(h.state.tables.krueka_live_materials.length,1);assert.equal(h.state.objects.size,1);assert.equal(h.state.removals.length,0);assert.deepEqual(h.state.objects.get(objectPath(id)).bytes,binary);
});

test('se conserva el límite de 10 MiB por archivo y se rechazan archivos vacíos',async()=>{
 const h=harness();assert.equal((await h.upload('vacío',new Uint8Array(),{id:identity(150)})).status,400);
 assert.equal((await h.upload('límite.dat',new Uint8Array(MAX),{id:identity(151)})).status,200);
 assert.equal((await h.upload('exceso.dat',new Uint8Array(MAX+1),{id:identity(152)})).status,400);assert.equal(h.state.objects.size,1);
});

test('admitir materiales docentes arbitrarios no amplía los formatos de entregas de alumnos',async()=>{
 const h=harness();
 async function submission(name,bytes){const form=new FormData();form.set('code',CODE);form.set('student','Alumno de prueba');form.set('document',new File([bytes],name));return h.handler(new Request('https://backend.invalid/submit',{method:'POST',headers:{origin:ORIGIN},body:form}));}
 assert.equal((await submission('proyecto.sb3',new Uint8Array(200))).status,400);assert.equal((await submission('falso.pdf',new Uint8Array(200))).status,400);assert.equal(h.state.rpcCalls.length,0);
 assert.equal((await submission('trabajo.pdf',pdf)).status,200);assert.deepEqual(h.state.rpcCalls.map(call=>call.name),['krueka_live_reserve','krueka_live_finalize']);assert.equal(h.state.tables.krueka_live_submissions.length,1);
});
