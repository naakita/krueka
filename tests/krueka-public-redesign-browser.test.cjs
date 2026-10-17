const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..');
const chrome=['chromium','chromium-browser','google-chrome','google-chrome-stable'].find(x=>cp.spawnSync(x,['--version'],{encoding:'utf8',timeout:2500}).status===0);
assert.ok(chrome,'Se requiere Chromium para verificar la interfaz');
function verifyHome(){
 try{
  var w=innerWidth,board=document.getElementById('kp-lab-board'),app=document.getElementById('kp-app');
  var nav=document.querySelector('.menu-button');
  var checks={
   cells:board&&board.querySelectorAll('.kp-lab-cell').length===56,
   shown:app&&app.getBoundingClientRect().height>390,
   center:getComputedStyle(document.querySelector('.kp-hero-copy')).textAlign==='center',
   menu:nav&&getComputedStyle(nav).display===(w<=820?'flex':'none'),
   overflow:document.documentElement.scrollWidth-w<=3
  };
  document.querySelector('[data-kp-move="right"]').click();
  checks.move=document.getElementById('kp-step-count').textContent==='1 paso';
  document.querySelector('[data-kp-mode="teacher"]').click();
  checks.teacher=!document.getElementById('kp-mode-teacher').hidden&&document.getElementById('kp-mode-studio').hidden;
  document.querySelectorAll('[data-kp-indicator]')[1].click();
  checks.review=document.getElementById('kp-progress-count').textContent==='2 de 3 indicadores';
  document.querySelector('[data-kp-mode="uploads"]').click();
  checks.uploads=!document.getElementById('kp-mode-uploads').hidden&&!!document.querySelector('#kp-mode-uploads a[href="entregas-excel.html"]');
  nav.click();checks.nav=document.getElementById('nav-links').classList.contains('open');nav.click();
  var errors=Object.keys(checks).filter(function(key){return !checks[key];});
  document.body.dataset.qaResult=errors.length?'FAIL:'+errors.join(','):'PASS';
  document.body.dataset.qaOverflow=String(document.documentElement.scrollWidth-w);
 }catch(e){document.body.dataset.qaResult='ERROR:'+e.message;}
}
function verifyAccess(){
 try{
  var w=innerWidth,menu=document.querySelector('.menu-button');
  var checks={
   cards:document.querySelectorAll('.ka-card').length===3,
   deliveries:document.querySelectorAll('.ka-format').length===3,
   menu:menu&&getComputedStyle(menu).display===(w<=820?'flex':'none'),
   overflow:document.documentElement.scrollWidth-w<=3
  };
  var errors=Object.keys(checks).filter(function(key){return !checks[key];});
  document.body.dataset.qaResult=errors.length?'FAIL:'+errors.join(','):'PASS';
  document.body.dataset.qaOverflow=String(document.documentElement.scrollWidth-w);
 }catch(e){document.body.dataset.qaResult='ERROR:'+e.message;}
}
for(const filename of ['index.html','accesos.html']){
 const source=fs.readFileSync(path.join(root,filename),'utf8');
 const temp=path.join(root,'__krueka_qa_'+filename);
 const fn=filename==='index.html'?verifyHome:verifyAccess;
 const script='<script>setTimeout(('+fn.toString()+'),700)</'+'script>';
 try{
  fs.writeFileSync(temp,source.replace('</body>',script+'</body>'));
  for(const viewport of ['390,900','1440,900']){
   const result=cp.spawnSync(chrome,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--allow-file-access-from-files','--disable-background-networking','--window-size='+viewport,'--virtual-time-budget=3500','--dump-dom','file://'+temp],{encoding:'utf8',timeout:45000,maxBuffer:15000000});
   assert.equal(result.status,0,'Chromium: '+(result.stderr||'').slice(-450));
   const resultText=result.stdout.match(/data-qa-result="([^"]+)"/)?.[1]||'missing';
   const overflow=result.stdout.match(/data-qa-overflow="([^"]+)"/)?.[1]||'missing';
   assert.equal(resultText,'PASS',filename+' '+viewport+' overflow='+overflow+' '+resultText);
   console.log('PASS '+filename+' '+viewport+' overflow='+overflow+' with interactions');
  }
 }finally{try{fs.unlinkSync(temp)}catch(_){}}
}