const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const bin=['chromium','chromium-browser','google-chrome','google-chrome-stable'].find(c=>cp.spawnSync(c,['--version'],{encoding:'utf8',timeout:2500}).status===0);
assert.ok(bin,'No hay Chromium');
const raw=fs.readFileSync(path.join(root,'actividades-clase.html'),'utf8');
const client=fs.readFileSync(path.join(root,'js/krueka-clase-temporal.js'),'utf8');
const temp=path.join(root,'__test_temp_classes.html');
// PDF mínimo válido para comprobar la carga del visor nativo.
const pdfFixture=(()=>{
 const stream='BT /F1 22 Tf 46 190 Td (Guia de clase visible en pantalla) Tj ET\n';
 const objects=[
  '<< /Type /Catalog /Pages 2 0 R >>',
  '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 500 300] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  '<< /Length '+Buffer.byteLength(stream)+' >>\nstream\n'+stream+'endstream'
 ];
 let content='%PDF-1.4\n',offsets=[];
 for(let i=0;i<objects.length;i++){offsets.push(Buffer.byteLength(content));content+=(i+1)+' 0 obj\n'+objects[i]+'\nendobj\n';}
 const start=Buffer.byteLength(content);
 content+='xref\n0 '+(objects.length+1)+'\n0000000000 65535 f \n'+offsets.map(o=>String(o).padStart(10,'0')+' 00000 n \n').join('');
 content+='trailer\n<< /Size '+(objects.length+1)+' /Root 1 0 R >>\nstartxref\n'+start+'\n%%EOF\n';
 return Buffer.from(content,'latin1').toString('base64');
})();
const mock='<script>'+
'window.fetch=async function(url,opts){let body;if(typeof opts.body==="string")body=JSON.parse(opts.body);'+
'if(body&&body.action==="lookup")return {ok:true,json:async()=>({ok:true,activity:{title:"Actividad real de prueba",grade:"Octavo grado",subject:"Informática",instructions:"Escribí un documento y entregalo en la clase.",has_pdf:true,pdf_name:"guia-ejemplo.pdf"}})};'+
'if(body&&body.action==="guide")return {ok:true,blob:async()=>new Blob([Uint8Array.from(atob("'+pdfFixture+'"),c=>c.charCodeAt(0))],{type:"application/pdf"})};'+
'return {ok:false,json:async()=>({ok:false,error:"Mock sin entrega real"})};};'+
'</script>';
const test='<script>setTimeout(function(){try{'+
'var code=document.getElementById("student-code"),form=document.getElementById("lookup-form");'+
'code.value="ABCDEFGHJKLM";form.dispatchEvent(new Event("submit",{cancelable:true,bubbles:true}));'+
'setTimeout(function(){'+
'var view=document.getElementById("activity-view"),inst=document.getElementById("activity-instructions"),heading=document.getElementById("activity-title");'+
'var checks={student:!document.getElementById("student").hidden,teacher:document.getElementById("teacher").hidden,'+
'view:view&&!view.hidden,heading:heading&&heading.textContent==="Actividad real de prueba",instructions:inst&&inst.textContent.includes("entregalo en la clase"),file:!!document.getElementById("student-file"),pdf:!document.getElementById("student-pdf").hidden,pdfSource:document.getElementById("student-pdf-frame").src.startsWith("blob:"),nativeViewer:!document.getElementById("student-pdf-frame").hasAttribute("sandbox"),openPdf:document.getElementById("open-guide").href.startsWith("blob:"),overflow:document.documentElement.scrollWidth-innerWidth<=3};'+
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
