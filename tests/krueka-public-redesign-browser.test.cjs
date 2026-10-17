const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..');
const browser=['chromium','chromium-browser','google-chrome','google-chrome-stable'].find(x=>cp.spawnSync(x,['--version'],{encoding:'utf8',timeout:2500}).status===0);
assert.ok(browser,'Se necesita Chromium');
const temp=path.join(root,'__kx_showcase_qa__.html'),home=fs.readFileSync(path.join(root,'index.html'),'utf8');
const script='<script>setTimeout(function(){try{'+
'var hero=document.querySelector(".kx-hero-text"),shell=document.querySelector(".kx-demo-shell"),nav=document.querySelector(".menu-button"),' +
'tabs=document.querySelectorAll(".kx-demo-tab"),people=document.querySelector(".kx-people-grid"),w=innerWidth,over=document.documentElement.scrollWidth-w;' +
'var click=document.querySelector("[data-demo=ai]");if(click)click.click();'+
'var ai=document.querySelector("[data-panel=ai]"),create=document.querySelector("[data-panel=create]");'+
'var checks={hero:hero&&hero.getBoundingClientRect().height>250,center:getComputedStyle(hero).textAlign==="center",stage:shell&&shell.getBoundingClientRect().width>200,art:document.querySelector(".kx-character-head")!==null,tabs:tabs.length===3,click:ai&&!ai.hidden&&create.hidden,nav:nav&&getComputedStyle(nav).display===(w<=810?"flex":"none"),people:people&&people.getBoundingClientRect().height>250,overflow:over<=3};'+
'var bad=Object.keys(checks).filter(function(k){return !checks[k]});document.body.dataset.visualQa=bad.length?"FAIL:"+bad.join(","):"PASS";document.body.dataset.viewport=String(w);document.body.dataset.overflow=String(over);'+
'}catch(e){document.body.dataset.visualQa="ERROR:"+e.message}},700)</script>';
try{
 fs.writeFileSync(temp,home.replace('</body>',script+'</body>'));
 for(const size of ['390,900','1440,900']){
  const r=cp.spawnSync(browser,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--allow-file-access-from-files','--disable-background-networking','--window-size='+size,'--virtual-time-budget=2400','--dump-dom','file://'+temp],{encoding:'utf8',timeout:45000,maxBuffer:16000000});
  assert.equal(r.status,0,(r.stderr||'').slice(-500));
  const outcome=r.stdout.match(/data-visual-qa="([^"]+)"/)?.[1]||'missing';
  const width=r.stdout.match(/data-viewport="([^"]+)"/)?.[1]||'missing';
  const over=r.stdout.match(/data-overflow="([^"]+)"/)?.[1]||'missing';
  assert.equal(outcome,'PASS','Viewport '+size+' ('+width+'px, overflow='+over+'): '+outcome);
  console.log('PASS Chromium Krueka '+size+', real='+width+', overflow='+over);
 }
}finally{try{fs.unlinkSync(temp)}catch(_){}}
