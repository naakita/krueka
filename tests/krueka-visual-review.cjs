const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..');
const exe=['chromium','chromium-browser','google-chrome','google-chrome-stable'].find(x=>cp.spawnSync(x,['--version'],{encoding:'utf8',timeout:2500}).status===0);
if(!exe)throw Error('Se requiere Chromium');
for(const [name,size] of [['DESKTOP','1440,1160'],['MOBILE','390,920']]){
 const file=path.join(root,'__kp_'+name.toLowerCase()+'.png');
 try{
  const r=cp.spawnSync(exe,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--allow-file-access-from-files','--disable-background-networking','--hide-scrollbars','--window-size='+size,'--virtual-time-budget=1800','--screenshot='+file,'file://'+path.join(root,'index.html')],{encoding:'utf8',timeout:40000});
  if(r.status!==0)throw Error('Falla de Chromium: '+r.stderr);
  const bytes=fs.readFileSync(file);
  if(bytes.length<4500||bytes.length>1500000)throw Error('Captura inesperada '+bytes.length);
  console.log('KP_SCREENSHOT_'+name+'_BEGIN'+bytes.toString('base64')+'KP_SCREENSHOT_'+name+'_END');
  console.log('Visual QA '+name+': '+bytes.length+' bytes');
 }finally{try{fs.unlinkSync(file)}catch(_){}}
}