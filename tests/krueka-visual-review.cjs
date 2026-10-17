const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..');
const exe=['chromium','chromium-browser','google-chrome','google-chrome-stable'].find(x=>cp.spawnSync(x,['--version'],{encoding:'utf8',timeout:2500}).status===0);
if(!exe)throw Error('Chromium no encontrado');
const file=path.join(root,'__kp_review.png');
try{
 const r=cp.spawnSync(exe,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--allow-file-access-from-files','--disable-background-networking','--hide-scrollbars','--window-size=1440,1120','--virtual-time-budget=2200','--screenshot='+file,'file://'+path.join(root,'index.html')],{encoding:'utf8',timeout:40000});
 if(r.status!==0)throw Error('Falla al capturar: '+r.stderr);
 const buffer=fs.readFileSync(file);
 if(buffer.length<5000||buffer.length>1400000)throw Error('Captura inesperada '+buffer.length);
 console.log('KP_SCREENSHOT_BEGIN'+buffer.toString('base64')+'KP_SCREENSHOT_END');
 console.log('Visual QA: PNG '+buffer.length+' bytes');
}finally{try{fs.unlinkSync(file)}catch(_){}}
