const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../js/club-studio-focus-chat.js'),'utf8');
const studio={
 renderAIStatus(){return 'ready'},
 renderChat(){return 'rendered'},
 showTab(tab){this.tab=tab;return tab},
 cloudReady:false,aiReady:true,title:'Mi juego',history:[{role:'sys',text:'Bienvenido'}]
};
const ctx={StudioIA:studio,StudioKits:{read:()=>({kind:'hero-manager'})},console,setInterval(){return 1},clearInterval(){}};
ctx.window=ctx;vm.createContext(ctx);vm.runInContext(source,ctx);
const F=ctx.StudioFocusChat;
assert.ok(F&&F.install&&F.mount&&F.enter&&F.exit&&F.toggleGame&&F.sync);
assert.equal(studio.__focusChatInstalled,true,'El chat del proyecto se integra sin un servicio extra');
assert.match(F.statusText({aiReady:true}),/disponible/);
assert.match(F.statusText({aiReady:false,aiStatus:{reason:'budget'}}),/presupuesto/);
assert.match(F.statusText({aiReady:false,aiStatus:{reason:'daily_limit'}}),/Cupo diario/);
assert.match(source,/studio\.history\.some\(m=>m&&\['user','ai'\]\.includes\(m\.role\)\)/);
assert.doesNotMatch(source,/chatgpt\.com\/c\/|https:\/\/chatgpt\.com/,'No se conecta a una sesión privada ajena');
assert.doesNotMatch(source,/OPENAI_API_KEY|Bearer\s|\bsupabase\b/i,'No introduce secretos ni backends');
assert.ok(fs.readFileSync(path.join(__dirname,'../app.html'),'utf8').includes('club-studio-focus-chat.js?v=20261009a'));
assert.ok(fs.readFileSync(path.join(__dirname,'../club/club-studio.css'),'utf8').includes('.ks-chat-focus'));
console.log('PASS: experiencia de chat individual, cuotas reales y separación de cuentas.');
