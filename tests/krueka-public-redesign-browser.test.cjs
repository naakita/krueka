const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..');
const browser=['chromium','chromium-browser','google-chrome','google-chrome-stable'].find(x=>cp.spawnSync(x,['--version'],{encoding:'utf8',timeout:2500}).status===0);
assert.ok(browser,'Se requiere Chromium para QA visual');
const temp=path.join(root,'__kx_visual_qa__.html');
const home=fs.readFileSync(path.join(root,'index.html'),'utf8');
const inline='<script>setTimeout(function(){try{'+
'var body=getComputedStyle(document.body),menu=document.querySelector(".menu-button"),hero=document.querySelector(".kx-hero-text"),stage=document.querySelector("#kx-ai-stage"),canvas=document.querySelector("#kx-ai-canvas"),people=document.querySelector(".kx-people-grid");'+
'var w=innerWidth,over=document.documentElement.scrollWidth-w;'+
'var checks={bg:body.backgroundColor==="rgb(246, 249, 255)",hero:hero&&hero.getBoundingClientRect().height>280,scene:stage&&stage.getBoundingClientRect().height>250&&canvas&&canvas.getBoundingClientRect().width>250,centered:hero&&getComputedStyle(hero).textAlign==="center",fallback:stage&&!!stage.querySelector(".kx-ai-fallback"),people:people&&people.getBoundingClientRect().height>250,menu:menu&&getComputedStyle(menu).display===(w<=810?"flex":"none"),links:document.querySelectorAll("a[href]").length>22,overflow:over<=3,illustrative:document.body.textContent.includes("Escena 3D conceptual")};'+
'var bad=Object.keys(checks).filter(function(k){return !checks[k]});document.body.dataset.visualQa=bad.length?"FAIL:"+bad.join(","):"PASS";document.body.dataset.vp=String(w);document.body.dataset.overflow=String(over);'+
'}catch(e){document.body.dataset.visualQa="ERROR:"+e.message}},400)</script>';
try{
 fs.writeFileSync(temp,home.replace('</body>',inline+'</body>'));
 for(const width of ['390,900','1440,900']){
  const result=cp.spawnSync(browser,['--headless=new','--no-sandbox','--enable-unsafe-swiftshader','--disable-dev-shm-usage','--allow-file-access-from-files','--disable-background-networking','--window-size='+width,'--virtual-time-budget=1800','--dump-dom','file://'+temp],{encoding:'utf8',timeout:45000,maxBuffer:16000000});
  assert.equal(result.status,0,'Chromium: '+width+' '+(result.stderr||'').slice(-500));
  const v=result.stdout.match(/data-visual-qa="([^"]+)"/)?.[1]||'missing';
  const vp=result.stdout.match(/data-vp="([^"]+)"/)?.[1]||'missing';
  const over=result.stdout.match(/data-overflow="([^"]+)"/)?.[1]||'missing';
  assert.equal(v,'PASS','Viewport '+width+' ('+vp+' real, overflow '+over+'): '+v);
  console.log('PASS Chromium Krueka '+width+' actual='+vp+' overflow='+over);
 }
}finally{try{fs.unlinkSync(temp)}catch(_){}}
