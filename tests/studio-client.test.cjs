const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('node:path').join(__dirname,'../js/club-studio-ai.js'),'utf8');
const begin=source.indexOf('  async request(body){'),end=source.indexOf('\n  async open(){',begin);
assert.ok(begin>=0&&end>begin,'El método de red del Studio existe');
const method=source.slice(begin,end).replace(/,\s*$/,'');
let fakeFetch=async()=>new Response(JSON.stringify({ok:true,ai:{ready:true}})),timer,cleared=0,seen;
const context=vm.createContext({
  SUPABASE_URL:'https://test.invalid',SUPABASE_KEY:'publishable',
  AbortController,Error,TypeError,JSON,Object,Response,
  fetch:async(url,options)=>{seen={url,options};return fakeFetch(url,options)},
  setTimeout:(fn,ms)=>{timer={fn,ms};return 7},
  clearTimeout:()=>{cleared++}
});
const client=vm.runInContext('({'+method+'})',context);
const who={sid:()=> 'test-student',did:()=> 'test-device'};
const call=body=>client.request.call(who,body);
(async()=>{
  let out=await call({action:'status'});assert.equal(out.ok,true);
  assert.equal(seen.url,'https://test.invalid/functions/v1/krueka-studio-ai');
  assert.equal(seen.options.headers.apikey,'publishable');
  assert.ok(seen.options.signal);assert.equal(timer.ms,18000);
  assert.ok(seen.options.body.includes('test-device'));
  fakeFetch=async()=>new Response(JSON.stringify({ok:false,error:'Cambio inválido',code:'invalid_change'}),{status:422});
  await assert.rejects(call({action:'ai'}),e=>e.code==='invalid_change'&&/Cambio inválido/.test(e.message));assert.equal(timer.ms,88000);
  fakeFetch=async()=>new Response('<html>Error</html>',{status:200});
  await assert.rejects(call({action:'status'}),/no devolvió una respuesta válida/);
  fakeFetch=async()=>{timer.fn();throw Object.assign(new Error('aborted'),{name:'AbortError'})};
  await assert.rejects(call({action:'ai'}),e=>e.code==='timeout'&&/tardó demasiado/.test(e.message));
  fakeFetch=async()=>{throw Object.assign(new Error('network'),{name:'TypeError'})};
  await assert.rejects(call({action:'status'}),/No se pudo conectar/);
  assert.ok(cleared>=5,'Timers liberados');
  console.log('PASS: respuestas válidas e inválidas, HTTP 422, timeout de IA y recuperación de red.');
})().catch(e=>{console.error(e);process.exitCode=1});
