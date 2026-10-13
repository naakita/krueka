/* Krueka Personajes 2D · modo liviano para PC antiguas. Sin WebGL, CDN ni API de IA. */
(function(){
"use strict";
var url="https://janebfpnknapvntfqolf.supabase.co";
var key="sb_publishable_mSuSFqWycvm9dQQzjpeaRA_kAyZOJl0";
var colors=["#242f48","#4c93ff","#6ee4ff","#ffffff","#ffd86b","#fa7893","#8ae58a","#a778f6","#ff9d63","#a0b4c8","#e0f9ff","#96583c"];
var roles=["hero","friend","enemy"], labels={hero:"Protagonista",friend:"Amigo",enemy:"Enemigo"};
var ink=colors[1],erase=false,mirror=false,down=false,who="hero",session=null,projectId="new",dirty=false,saveTimer=null,busy=false,undoState=null;
var modelColors={hero:"#4c93ff",friend:"#8ae58a",enemy:"#fa7893"};
var state=null, guest=false;
function el(id){return document.getElementById(id);}
function txt(id,text){if(el(id))el(id).textContent=text;}
function status(message,kind){var e=el("save-status");if(e){e.textContent=message;e.className=kind||"";}}
function loginStatus(message,error){txt("login-status",message);el("login-status").className="info"+(error?" error":"");}
function copy(a){return JSON.parse(JSON.stringify(a));}
function empty(){var a=[],i;for(i=0;i<144;i++)a.push("");return a;}
function sprite(type,role){
 var templates={
 robot:["...XXXXXX...","...XBBBBX...","...XBBBBX...","...XWBBWX...","...XBBBBX...","..XXYYYYXX..","..XBBBBBBX..","..XBBBBBBX..","...XBXXBX...","...XBXXBX...","...XX..XX...","............"],
 alien:["....XXXX....","...XBBBBX...","..XBBBBBBX..","..XWBBWBX..","..XBBBBBBX..","...XBBBBX...","....XXXX....","...XBBBBX...","..XBBBBBBX..","..XBXBBXBX..","...XX..XX...","............"],
 animal:["..XX....XX..","..XBX..XBX..","..XBBBBBBX..","...XBBBBX...","...XWBBWX...","...XBY YBX...","...XBBBBX...","..XXBBBBXX..","..XBBBBBBX..","..XXBXXBXX..","...XX..XX...","............"],
 monster:["...XX..XX...","..XBBXXBBX..","..XBBBBBBX..","..XWBBWBX...","..XBBBBBBX..","..XBYYYYBX..","...XBBBBX...","..XXBBBBXX..","..XBBBBBBX..","..XXBXXBXX..","...XX..XX...","............"]
 };
 var rows=templates[type]||templates.robot,px=[],row,i,j,k;
 for(i=0;i<12;i++){
  row=(rows[i]||"").replace(/ /g,".").substring(0,12);
  while(row.length<12)row+=".";
  for(j=0;j<12;j++){
   k=row.charAt(j);
   px.push(k==="."?"":k==="X"?colors[0]:k==="W"?colors[3]:k==="Y"?colors[4]:k==="B"?modelColors[role]:"");
  }
 }
 return px;
}
function fresh(){
 return {version:1,characters:{
  hero:{name:"Volt",model:"robot",pixels:sprite("robot","hero")},
  friend:{name:"Pixel",model:"animal",pixels:sprite("animal","friend")},
  enemy:{name:"Sombra",model:"monster",pixels:sprite("monster","enemy")}
 }};
}
function clean(v){
 if(!v||!v.characters)return fresh();
 var s=fresh(),i,r,a,x,p;
 for(i=0;i<roles.length;i++){
  r=roles[i];a=v.characters[r];
  if(!a)continue;
  s.characters[r].name=String(a.name||s.characters[r].name).replace(/[<>\\]/g,"").slice(0,28);
  s.characters[r].model=/^(robot|animal|alien|monster)$/.test(a.model)?a.model:"robot";
  if(Array.isArray(a.pixels)&&a.pixels.length===144){
   p=[];
   for(x=0;x<144;x++)p.push(/^#[0-9a-f]{6}$/i.test(String(a.pixels[x]))?String(a.pixels[x]):"");
   s.characters[r].pixels=p;
  }
 }
 return s;
}
function saveLocal(){
 try{localStorage.setItem("krueka-personajes-2d:"+(session&&session.student&&(session.student.student_id||session.student.id)||"guest"),JSON.stringify(state));}
 catch(e){}
}
function loadLocal(){
 try{
  var v=localStorage.getItem("krueka-personajes-2d:"+(session&&session.student&&(session.student.student_id||session.student.id)||"guest"));
  return v?clean(JSON.parse(v)):null;
 }catch(e){return null;}
}
function changed(){
 dirty=true;saveLocal();drawEditor();drawStage();
 if(!guest){status("Cambios en este equipo. Guardado automático en unos segundos…");clearTimeout(saveTimer);saveTimer=setTimeout(saveCloud,8000);}
 else status("Modo de prueba: guardado en esta PC. Descargá tu respaldo antes de salir.");
}
function imgToData(role){
 var c=document.createElement("canvas"),ctx=c.getContext("2d"),p=state.characters[role].pixels,x,y;
 c.width=144;c.height=144;ctx.clearRect(0,0,144,144);
 for(y=0;y<12;y++)for(x=0;x<12;x++){if(p[y*12+x]){ctx.fillStyle=p[y*12+x];ctx.fillRect(x*12,y*12,12,12);}}
 return c.toDataURL("image/png");
}
function renderPage(){
 var out=[],i,r,img,name;
 for(i=0;i<roles.length;i++){
  r=roles[i];img=imgToData(r);name=state.characters[r].name.replace(/[&<>"]/g,"");
  out.push('<article><img alt="Personaje" src="'+img+'"><h2>'+name+'</h2><p>'+labels[r]+'</p></article>');
 }
 return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mis personajes de Krueka</title><style>body{font:16px Arial;text-align:center;background:#101a32;color:#fff;padding:30px}main{display:flex;justify-content:center;flex-wrap:wrap;gap:22px;margin-top:35px}article{background:#213759;border-radius:20px;padding:20px;min-width:190px}img{width:150px;height:150px;image-rendering:pixelated}p{color:#ace7ff}</style></head><body><h1>Mi equipo de personajes</h1><p>Creado en Krueka · Club de Informática</p><main>'+out.join("")+'</main></body></html>';
}
function request(path,body,done){
 var xhr=new XMLHttpRequest();
 xhr.open("POST",url+path,true);xhr.timeout=20000;
 xhr.setRequestHeader("Content-Type","application/json");xhr.setRequestHeader("apikey",key);
 xhr.onreadystatechange=function(){
  if(xhr.readyState!==4)return;
  var obj;try{obj=JSON.parse(xhr.responseText);}catch(e){done(Error("Krueka no devolvió una respuesta válida."));return;}
  if(xhr.status<200||xhr.status>=300||obj.ok===false){done(Error(obj.error||obj.message||"No se pudo conectar."));return;}
  done(null,obj);
 };
 xhr.onerror=function(){done(Error("Sin conexión. Revisá internet y volvé a intentar."));};
 xhr.ontimeout=function(){done(Error("La conexión tardó demasiado."));};
 xhr.send(JSON.stringify(body));
}
function browserId(){
 var id;
 try{id=localStorage.getItem("krueka_device");}catch(e){}
 if(!id){id="krueka2d-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,13);try{localStorage.setItem("krueka_device",id);}catch(e){}}
 return id;
}
function reqStudio(action,args,done){
 var student=session&&session.student,base={action:action,projectId:projectId,studentId:student&&(student.student_id||student.id),deviceId:session&&session.token};
 var k;for(k in args)if(Object.prototype.hasOwnProperty.call(args,k))base[k]=args[k];
 request("/functions/v1/krueka-studio-ai",base,done);
}
function cloudLoad(){
 reqStudio("list",{},function(err,result){
  if(err){status("No se pudo recuperar la nube: "+err.message+" Podés descargar un respaldo.","error");return;}
  var list=(result.projects||[]),choice=null,i,p;
  for(i=0;i<list.length;i++){
   p=list[i];if(p&&p.title&&p.title.indexOf("Personajes 2D ·")===0&&(choice===null||String(p.updated_at)>String(choice.updated_at)))choice=p;
  }
  if(!choice){dirty=true;status("Proyecto nuevo. Creá y guardá tu equipo en Krueka.");return;}
  projectId=choice.id;
  reqStudio("load",{projectId:projectId},function(e,d){
   if(e){status("No pude recuperar el proyecto anterior: "+e.message,"error");return;}
   try{
    var saved=d.project&&d.project.files&&d.project.files["personajes.json"];
    if(saved){state=clean(JSON.parse(saved));saveLocal();syncUI();status("✓ Personajes recuperados de Krueka.","ok");}
    else status("Tu proyecto anterior no contiene personajes. Empezá de nuevo.");
   }catch(ex){status("No se pudo leer el respaldo en la nube. Descargá tu proyecto local.","error");}
  });
 });
}
function saveCloud(){
 if(guest){saveLocal();status("Guardado en esta PC (modo prueba). Exportá el archivo para tener respaldo.","ok");return;}
 if(!session){status("No hay una sesión con código. Descargá un respaldo.","error");return;}
 if(busy){clearTimeout(saveTimer);saveTimer=setTimeout(saveCloud,1800);return;}
 clearTimeout(saveTimer);
 if(!dirty){status("✓ Sin cambios pendientes.","ok");return;}
 busy=true;el("save").disabled=true;
 var snap=JSON.stringify(state),files={"index.html":renderPage(),"personajes.json":snap},old=projectId;
 status("Guardando los tres personajes en Krueka…");
 reqStudio("save",{projectId:old,title:"Personajes 2D · Club Junior",files:files,history:[],draft:""},function(err,data){
  busy=false;el("save").disabled=false;
  if(err){status("⚠ No se guardó en la nube: "+err.message+" Descargá una copia.","error");return;}
  if(data.id)projectId=data.id;
  if(snap===JSON.stringify(state)){dirty=false;status("✓ Guardado en Krueka. Podés continuar desde otra computadora.","ok");}
  else{status("Se guardó una versión anterior. Actualizando los nuevos cambios…");clearTimeout(saveTimer);saveTimer=setTimeout(saveCloud,1800);}
 });
}
function saveBackup(name,data,kind){
 var a=document.createElement("a");
 a.download=name;
 a.href=kind==="png"?data:"data:application/json;charset=utf-8,"+encodeURIComponent(data);
 document.body.appendChild(a);a.click();document.body.removeChild(a);
}
function renderPalette(){
 var wrap=el("palette");wrap.innerHTML="";
 for(var i=0;i<colors.length;i++)(function(color){
  var b=document.createElement("button");b.type="button";b.className="color"+(ink===color&&!erase?" active":"");b.style.backgroundColor=color;b.setAttribute("aria-label","Pintar color "+color);
  b.onclick=function(){ink=color;erase=false;el("tool-pencil").className="active";el("tool-erase").className="";renderPalette();};
  wrap.appendChild(b);
 })(colors[i]);
}
function syncUI(){
 el("name").value=state.characters[who].name;
 el("model").value=state.characters[who].model;
 var rolesBtns=document.querySelectorAll(".role");
 for(var i=0;i<rolesBtns.length;i++)rolesBtns[i].className="role"+(rolesBtns[i].getAttribute("data-role")===who?" active":"");
 renderPalette();drawEditor();drawStage();
}
function drawEditor(){
 var ctx=el("paint").getContext("2d"),p=state.characters[who].pixels,x,y,c=30;
 for(y=0;y<12;y++)for(x=0;x<12;x++){
  ctx.fillStyle=(x+y)%2?"#dce6f2":"#f2f6fc";ctx.fillRect(x*c,y*c,c,c);
  if(p[y*12+x]){ctx.fillStyle=p[y*12+x];ctx.fillRect(x*c,y*c,c,c);}
  ctx.strokeStyle="rgba(29,49,71,.23)";ctx.lineWidth=1;ctx.strokeRect(x*c+.5,y*c+.5,c,c);
 }
}
function drawSprite(ctx,role,mid,ground,size){
 var p=state.characters[role].pixels,x,y,c=size;
 for(y=0;y<12;y++)for(x=0;x<12;x++)if(p[y*12+x]){
  ctx.fillStyle=p[y*12+x];ctx.fillRect(Math.floor(mid-6*c+x*c),Math.floor(ground-12*c+y*c),c,c);
 }
}
function drawStage(){
 var ctx=el("stage").getContext("2d"),i,r,x,gr=ctx.createLinearGradient(0,0,0,350);
 gr.addColorStop(0,"#102243");gr.addColorStop(1,"#47669b");ctx.fillStyle=gr;ctx.fillRect(0,0,600,350);
 ctx.fillStyle="#e9f1ff";
 for(i=0;i<18;i++){x=(i*147+27)%600;ctx.fillRect(x,(i*61+22)%190,2,2);}
 ctx.fillStyle="#5c87a1";ctx.fillRect(0,270,600,80);
 ctx.fillStyle="#68b898";ctx.fillRect(0,265,600,13);
 ctx.fillStyle="#315a75";for(i=0;i<10;i++){ctx.fillRect(i*66,284,50,4);}
 for(i=0;i<roles.length;i++){
  r=roles[i];x=105+i*195;
  ctx.fillStyle="rgba(0,0,0,.25)";ctx.fillRect(x-47,267,94,6);
  drawSprite(ctx,r,x,265,8);
  ctx.fillStyle="#fff";ctx.font="bold 16px Arial";ctx.textAlign="center";ctx.fillText(state.characters[r].name.slice(0,20),x,303,180);
  ctx.font="13px Arial";ctx.fillStyle="#c9e6ff";ctx.fillText(labels[r],x,323,180);
 }
}
function beginPaint(e){
 if(e.cancelable&&e.type.indexOf("touch")===0)e.preventDefault();
 down=true;undoState=state.characters[who].pixels.slice();applyPixel(e);
}
function getPoint(e){
 var r=el("paint").getBoundingClientRect(),point=e.touches&&e.touches[0]||e.changedTouches&&e.changedTouches[0]||e;
 return {x:Math.floor((point.clientX-r.left)*12/r.width),y:Math.floor((point.clientY-r.top)*12/r.height)};
}
function applyPixel(e){
 if(!down)return;
 if(e.cancelable&&e.type.indexOf("touch")===0)e.preventDefault();
 var p=getPoint(e),arr=state.characters[who].pixels,n=p.y*12+p.x;
 if(p.x<0||p.x>=12||p.y<0||p.y>=12)return;
 arr[n]=erase?"":ink;
 if(mirror)arr[p.y*12+11-p.x]=erase?"":ink;
 changed();
}
function enter(){
 el("login").className="off";el("studio").className="";
 txt("session-label",guest?"Prueba local": "Código del Club");
 if(!state)state=fresh();
 who="hero";syncUI();
 if(guest){status("Modo de prueba: no se guarda en la nube. Descargá un respaldo.");}
 else{status("Buscando tus personajes guardados en Krueka…");cloudLoad();}
}
function signin(){
 var code=el("code").value.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,6);
 if(code.length!==6){loginStatus("El código debe tener seis letras o números.",true);return;}
 el("login-button").disabled=true;loginStatus("Comprobando código personal…");
 request("/rest/v1/rpc/club_studio_entrar",{p_codigo:code,p_device:browserId(),p_agent:String(navigator.userAgent||"").slice(0,240)},function(err,data){
  el("login-button").disabled=false;
  if(err||!data||data.ok!==true){loginStatus(err?err.message:(data&&data.error||"Código no válido."),true);return;}
  session=data;guest=false;state=loadLocal()||fresh();projectId="new";dirty=false;
  try{sessionStorage.setItem("krueka2d-session",JSON.stringify(data));}catch(e){}
  el("code").value="";enter();
 });
}
function logout(){
 if(dirty&&!guest&&!confirm("Tenés cambios sin confirmar en la nube. Descargá una copia o cancelá y guardá antes de salir."))return;
 var old=session;session=null;guest=false;state=null;projectId="new";dirty=false;clearTimeout(saveTimer);
 try{sessionStorage.removeItem("krueka2d-session");}catch(e){}
 el("studio").className="off";el("login").className="panel login";loginStatus("Ingresá tu código o probá el editor.");
 if(old&&old.token)request("/rest/v1/rpc/club_studio_salir",{p_token:old.token},function(){});
}
function init(){
 if(!el("paint").getContext||!el("paint").getContext("2d")){loginStatus("Este navegador no admite Canvas 2D. Probá actualizarlo.",true);el("demo").disabled=true;return;}
 el("login-form").onsubmit=function(e){e.preventDefault();signin();};
 el("code").oninput=function(){this.value=this.value.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,6);};
 el("demo").onclick=function(){guest=true;session=null;state=loadLocal()||fresh();enter();};
 el("logout").onclick=logout;
 var rb=document.querySelectorAll(".role");
 for(var i=0;i<rb.length;i++)rb[i].onclick=function(){who=this.getAttribute("data-role");undoState=null;syncUI();};
 el("name").oninput=function(){state.characters[who].name=this.value.replace(/[<>\\]/g,"").slice(0,28);changed();};
 el("apply-model").onclick=function(){
  var model=el("model").value;
  if(!confirm("¿Cambiar solo este personaje por el modelo "+model+"? Podés volver a pintar sus detalles."))return;
  undoState=state.characters[who].pixels.slice();
  state.characters[who].model=model;state.characters[who].pixels=sprite(model,who);changed();
 };
 el("tool-pencil").onclick=function(){erase=false;this.className="active";el("tool-erase").className="";renderPalette();};
 el("tool-erase").onclick=function(){erase=true;this.className="active";el("tool-pencil").className="";renderPalette();};
 el("tool-mirror").onclick=function(){mirror=!mirror;this.className=mirror?"active":"";};
 el("undo").onclick=function(){if(!undoState){status("Todavía no hay un cambio para deshacer.");return;}var p=state.characters[who].pixels;state.characters[who].pixels=undoState;undoState=p;changed();};
 var c=el("paint");
 c.onmousedown=beginPaint;c.onmousemove=applyPixel;c.onmouseup=function(){down=false;};c.onmouseleave=function(){down=false;};
 c.addEventListener("touchstart",beginPaint,{passive:false});
 c.addEventListener("touchmove",applyPixel,{passive:false});
 c.addEventListener("touchend",function(){down=false;});
 el("save").onclick=saveCloud;
 el("import").onclick=function(){el("import-file").click();};
 el("import-file").onchange=function(){
  var file=this.files&&this.files[0];this.value="";
  if(!file)return;
  if(file.size>100000){status("El respaldo es demasiado grande.","error");return;}
  var reader=new FileReader();
  reader.onload=function(){
   try{var parsed=JSON.parse(String(reader.result||""));
    if(!parsed.characters||!parsed.characters.hero||!parsed.characters.friend||!parsed.characters.enemy)throw Error("Formato de respaldo no válido");
    if(!confirm("¿Abrir este respaldo? Reemplazará los personajes que estás viendo."))return;
    state=clean(parsed);who="hero";syncUI();changed();status("Respaldo abierto. Guardá los personajes en Krueka.");
   }catch(e){status("El archivo no es un respaldo válido de Krueka.","error");}
  };
  reader.onerror=function(){status("No se pudo leer el archivo.","error");};
  reader.readAsText(file);
 };
 el("download").onclick=function(){saveBackup("krueka-personajes-2d.json",JSON.stringify(state,null,2));status("Respaldo JSON descargado. Guardalo para volver a abrirlo.");};
 el("png").onclick=function(){saveBackup("personaje-"+who+".png",imgToData(who),"png");status("Imagen PNG del "+labels[who].toLowerCase()+" lista.");};
 var saved=null;try{saved=JSON.parse(sessionStorage.getItem("krueka2d-session")||"null");}catch(e){}
 if(saved&&saved.ok===true&&saved.token&&saved.student&&Date.parse(saved.expiresAt)>Date.now()){
  session=saved;guest=false;state=loadLocal()||fresh();enter();
 }
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);
else init();
})();