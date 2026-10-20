const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const bin=['chromium','chromium-browser','google-chrome','google-chrome-stable'].find(c=>cp.spawnSync(c,['--version'],{encoding:'utf8',timeout:2500}).status===0);
assert.ok(bin,'No hay Chromium');
const raw=fs.readFileSync(path.join(root,'actividades-clase.html'),'utf8');
const client=fs.readFileSync(path.join(root,'js/krueka-clase-temporal.js'),'utf8');
const temp=path.join(root,'__test_temp_classes.html');
const mock='<script>'+
'window.fetch=async function(url,opts){let body;if(typeof opts.body==="string")body=JSON.parse(opts.body);'+
'if(body&&body.action==="lookup")return {ok:true,json:async()=>({ok:true,activity:{title:"Actividad real de prueba",grade:"Octavo grado",subject:"Informática",instructions:"Escribí un documento y entregalo en la clase.",has_pdf:true,pdf_name:"guia-ejemplo.pdf"}})};'+
'if(body&&body.action==="guide")return {ok:true,blob:async()=>new Blob(["%PDF-1.4\\n1 0 obj\\n%%EOF"],{type:"application/pdf"})};'+
'return {ok:false,json:async()=>({ok:false,error:"Mock sin entrega real"})};};'+
'</script>';
const test='<script>setTimeout(function(){try{'+
'var code=document.getElementById("student-code"),form=document.getElementById("lookup-form");'+
'code.value="ABCDEFGHJKLM";form.dispatchEvent(new Event("submit",{cancelable:true,bubbles:true}));'+
'setTimeout(function(){'+
'var view=document.getElementById("activity-view"),inst=document.getElementById("activity-instructions"),heading=document.getElementById("activity-title");'+
'var checks={student:!document.getElementById("student").hidden,teacher:document.getElementById("teacher").hidden,'+
'view:view&&!view.hidden,heading:heading&&heading.textContent==="Actividad real de prueba",instructions:inst&&inst.textContent.includes("entregalo en la clase"),file:!!document.getElementById("student-file"),pdf:!document.getElementById("student-pdf").hidden,pdfSource:document.getElementById("student-pdf-frame").src.startsWith("blob:"),overflow:document.documentElement.scrollWidth-innerWidth<=3};'+
'var bad=Object.keys(checks).filter(function(k){return !checks[k]});document.body.dataset.test=bad.length?"FAIL:"+bad.join(","):"PASS";'+
'},500);'+
'}catch(err){document.body.dataset.test="ERROR:"+err.message}},350)</script>';
try{
 const cleaned=raw.replace(/<script src="https:\/\/cdn\.jsdelivr[^>]*><\/script>/g,'').replace(/<script src="https:\/\/challenges\.cloudflare[^>]*><\/script>/g,'')
  .replace(/<script src="js\/krueka-clase-temporal\.js[^>]*><\/script>/,mock+'<script>'+client+'</script>');
 fs.writeFileSync(temp,cleaned.replace('</body>',test+'</body>'));
 for(const size of ['390,850','1350,900']){
  const r=cp.spawnSync(bin,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--allow-file-access-from-files','--disable-background-networking','--window-size='+size,'--virtual-time-budget=2700','--dump-dom','file://'+temp],{encoding:'utf8',timeout:45000,maxBuffer:15000000});
  assert.equal(r.status,0,'Chromium falló '+(r.stderr||'').slice(-600));
  const status=r.stdout.match(/data-test="([^"]+)"/)?.[1]||'SIN_RESULTADO';
  assert.equal(status,'PASS',size+' '+status);
  console.log('PASS Actividades clase Chromium '+size+' + consigna y acceso privado.');
 }
}finally{try{fs.unlinkSync(temp)}catch(_){}}
