/* Prueba del recorrido público, sin iniciar sesión ni conectarse a Supabase. */
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const assert=require('node:assert/strict');
const cp=require('node:child_process');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'club-krueka-guia.html'),'utf8');
const injected=`<script>
setTimeout(function(){
 const failures=[];
 function check(condition,message){if(!condition)failures.push(message);}
 try{
  check(document.querySelectorAll('.guide-track-button').length===2,'dos rutas');
  check(document.querySelectorAll('.guide-level').length===6,'seis niveles');
  check(document.querySelectorAll('.guide-lesson-button').length===24,'24 lecciones');
  check(document.querySelectorAll('.guide-step-list li').length>=4,'instrucciones concretas');
  check(document.querySelector('.guide-article h2').textContent.includes('Tu primer proyecto'),'primera lección Scratch');
  document.querySelector('[data-track="roblox"]').click();
  check(document.querySelector('.guide-article').textContent.includes('requiere instalarse'),'advertencia Studio');
  const search=document.getElementById('guide-search');search.value='NPC';search.dispatchEvent(new Event('input',{bubbles:true}));
  check(document.querySelectorAll('.guide-lesson-button').length>=1,'filtro NPC');
  check(document.querySelectorAll('.guide-lesson-button').length<24,'filtro restringe');
  document.querySelector('.guide-lesson-button').click();
  check(document.querySelector('.guide-article h2').textContent.length>8,'abrir lección filtrada');
  document.querySelector('.guide-complete').click();
  check(document.querySelector('.guide-complete').getAttribute('aria-pressed')==='true','marcar completado');
  check(document.getElementById('guide-completed-total').textContent==='1 / 24','contador completado');
  document.querySelector('[data-track="scratch"]').click();
  check(document.getElementById('guide-completed-total').textContent==='0 / 24','rutas separadas');
  check(new URLSearchParams(location.search).get('ruta')==='scratch','URL actualizada');
  document.querySelector('.guide-nav-btn.next').click();
  check(document.querySelector('.guide-article h2').textContent.includes('Coordenadas'),'siguiente lección');
 }catch(e){failures.push(String(e.stack||e));}
 document.body.dataset.guiaSmoke=failures.length?'FAIL '+failures.join(' | '):'PASS';
},0);
</script>`;
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'krueka-guia-'));
const html=path.join(tmp,'index.html');
async function main(){
 try{
  fs.writeFileSync(html,source.replace('<head>','<head><base href="file://'+root+'/">').replace('</body>',injected+'</body>'));
  let binary=process.env.STUDIO_CHROMIUM;
  if(!binary)for(const name of ['chromium','google-chrome','google-chrome-stable','chromium-browser'])if(cp.spawnSync(name,['--version'],{encoding:'utf8',timeout:3000}).status===0){binary=name;break;}
  assert.ok(binary,'Chromium no disponible');
  const run=cp.spawnSync(binary,['--headless=new','--no-sandbox','--no-zygote','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--window-size=1280,900','--virtual-time-budget=10000','--dump-dom','file://'+html],{encoding:'utf8',timeout:30000,maxBuffer:8e6});
  assert.equal(run.status,0,(run.stderr||'').slice(-1000));
  assert.match(run.stdout,/data-guia-smoke="PASS"/,run.stdout.match(/data-guia-smoke="[^"]{0,500}"/)?.[0]||'Sin resultado');
  console.log('PASS navegador: Scratch, Roblox, búsqueda, completado y navegación.');
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
