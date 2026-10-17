const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..');
let chromium=null;
for(const bin of ['chromium','chromium-browser','google-chrome','google-chrome-stable']){
 const r=cp.spawnSync(bin,['--version'],{encoding:'utf8',timeout:3000});
 if(r.status===0){chromium=bin;break;}
}
assert.ok(chromium,'El runner debe tener Chromium para QA visual de Krueka');
const page=fs.readFileSync(path.join(root,'index.html'),'utf8');
const temp=path.join(root,'__kx-layout-qa__.html');
const script=String.raw`<script>
setTimeout(function(){
 try{
  var css=getComputedStyle(document.body),nav=document.querySelector('.nav');
  var logo=document.querySelector('.brand-logo');
  var hero=document.querySelector('.kx-hero-content');
  var roles=document.querySelector('.kx-roles');
  var menu=document.querySelector('.menu-button');
  var width=innerWidth,overflow=document.documentElement.scrollWidth-width;
  var links=[...document.querySelectorAll('a[href]')];
  var mobile=width<790;
  var tests={
   stylesheet:css.backgroundColor==='rgb(8, 14, 27)',
   content:hero&&hero.getBoundingClientRect().height>200,
   logo:logo&&logo.naturalWidth>0,
   links:links.length>15,
   overflow:overflow<=3,
   menu:menu&&getComputedStyle(menu).display===(mobile?'flex':'none'),
   roleColumns:roles&&getComputedStyle(roles).gridTemplateColumns.length>0,
   font:css.fontFamily.toLowerCase().includes('system-ui'),
   focusable:document.querySelector('a[href="accesos.html"]')!==null,
   noJSHidden:false
  };
  tests.noJSHidden=document.querySelector('.kx-product')&&getComputedStyle(document.querySelector('.kx-product')).display!=='none';
  var failed=Object.keys(tests).filter(function(k){return !tests[k];});
  document.body.dataset.visualQa=failed.length?'FAIL '+failed.join(','):'PASS';
  document.body.dataset.viewport=String(width);
  document.body.dataset.overflow=String(overflow);
 }catch(e){document.body.dataset.visualQa='FAIL '+e.message}
},350);
</script>`;
try{
 fs.writeFileSync(temp,page.replace('</body>',script+'</body>'));
 for(const size of ['390,900','1440,900']){
  const r=cp.spawnSync(chromium,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--allow-file-access-from-files','--disable-background-networking','--window-size='+size,'--virtual-time-budget=2000','--dump-dom','file://'+temp],{encoding:'utf8',timeout:45000,maxBuffer:12000000});
  assert.equal(r.status,0,'Chromium falló a '+size+': '+(r.stderr||'').slice(-650));
  const outcome=r.stdout.match(/data-visual-qa="([^"]+)"/)?.[1]||'missing';
  const viewport=r.stdout.match(/data-viewport="([^"]+)"/)?.[1]||'missing';
  const overflow=r.stdout.match(/data-overflow="([^"]+)"/)?.[1]||'missing';
  assert.equal(outcome,'PASS','QA '+size+' ('+viewport+'px, overflow '+overflow+'): '+outcome);
  console.log('PASS: Krueka '+size+', viewport='+viewport+', overflow='+overflow);
 }
}finally{try{fs.unlinkSync(temp)}catch(_e){}}
