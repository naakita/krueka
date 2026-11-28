/* Studio 3D: geometría propia, editor de escena y juego; sin servicios ni librerías externas. */
(function(){
'use strict';
if(window.Studio3D||!window.StudioKits)return;
function avatarProfiles(){
 return {
  robot:{name:'Robot violeta',color:'#a5b4fc',short:'Robot'},
  explorador:{name:'Explorador del bosque',color:'#4cae89',short:'Explorador'},
  piloto:{name:'Piloto celeste',color:'#4ca9e8',short:'Piloto'},
  minero:{name:'Minerito de bloques',color:'#e7a846',short:'Minero con lámpara',block:true},
  constructora:{name:'Constructora de cubos',color:'#ee8154',short:'Constructora con overol',block:true},
  aventurera:{name:'Aventurera pixel',color:'#7b66d9',short:'Aventurera con mochila',block:true},
  guardian:{name:'Guardián de obsidiana',color:'#6555a2',short:'Guardián luminoso',block:true},
  velocista:{name:'Velocista del circuito',color:'#f75a7e',short:'Velocista con zapatillas',block:true},
  astronauta:{name:'Astronauta de cubos',color:'#80baff',short:'Astronauta con visor',block:true},
  brote:{name:'Brote de cubos',color:'#79bf5e',short:'Criatura del bosque',block:true},
  aldeana:{name:'Aldeana del huerto',color:'#dc7857',short:'Aldeana con sombrero',block:true}
 };
}
function normalise(raw){
  const profiles=avatarProfiles(),style=v=>typeof v==='string'&&Object.hasOwn(profiles,v)?v:'robot';
  const c=raw&&typeof raw==='object'?raw:{},num=(v,a,b,d)=>Number.isFinite(Number(v))?Math.max(a,Math.min(b,Number(v))):d;
  const color=(v,d)=>/^#[0-9a-f]{6}$/i.test(String(v))?String(v):d,ids=new Set();
  const themes=['station','forest','island'],theme=themes.includes(c.theme)?c.theme:'station';
  const zones=(Array.isArray(c.zones)?c.zones:[]).map((z,i)=>({name:String(z?.name||'Zona '+(i+2)).trim().slice(0,32)||'Zona '+(i+2),theme:themes.includes(z?.theme)?z.theme:theme}));
  const counts=Array(zones.length+1).fill(0);
  const objects=(Array.isArray(c.objects)?c.objects:[]).flatMap((o,i)=>{
    o=o&&typeof o==='object'?o:{};
    const zone=Number.isInteger(o.zone)&&o.zone>=0&&o.zone<=zones.length?o.zone:0;
    if(counts[zone]>=48)return [];counts[zone]++;
    let id=/^[a-z0-9-]{1,32}$/.test(String(o.id))?String(o.id):'object-'+i;let salt=0;while(ids.has(id))id='object-'+i+'-'+(++salt);ids.add(id);
    return {id,type:['crystal','crate','pillar','tree','drone','beacon','house','car','road','wall','rock','lamp','arch','mountain','airplane','shield','staff','character'].includes(o.type)?o.type:'crate',label:String(o.label||'Objeto '+(i+1)).slice(0,32),x:num(o.x,-10,10,0),z:num(o.z,-12,12,0),size:num(o.size,.4,4,1),height:num(o.height,.5,5,1.5),color:color(o.color,'#67e8f9'),...(zone?{zone}:{}),...(o.type==='character'?{avatarStyle:style(o.avatarStyle)}:{})};
  });
  return {...c,kind:'explore3d',title:String(c.title||'Exploradores 3D').slice(0,60),theme,zones,lighting:['cryo','alert','sunset'].includes(c.lighting)?c.lighting:'cryo',avatarColor:color(c.avatarColor,'#a5b4fc'),avatarStyle:style(c.avatarStyle),jumpEnabled:c.jumpEnabled!==false,speed:num(c.speed,2,9,5),lives:Math.round(num(c.lives,1,9,3)),seconds:Math.round(num(c.seconds,30,300,120)),camera:c.camera==='orbit'?'orbit':'follow',quality:c.quality==='high'?'high':'low',objects};
}
function runtime(isolated){
  'use strict';
  const cfg=normalise(window.KRUEKA_GAME),hud=document.getElementById('hud'),status=document.getElementById('status'),mode=document.getElementById('mode'),renderer=document.getElementById('renderer');
  document.getElementById('game-title').textContent=cfg.title;document.title=cfg.title;
  let canvas=document.getElementById('arena'),gl=null,ctx=null,program,buffer,projectionLocation,positionLocation,colorLocation;
  let player,collected,lives,time,invincible,elapsed,ended=false,paused=true,editing=true,last=0,lastDraw=0,yaw=.48,picked=null,drag=null,viewProjection;
  const keys={},clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255),sub=(a,b)=>a.map((v,i)=>v-b[i]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],unit=a=>{const d=Math.hypot(...a)||1;return a.map(v=>v/d)};
  const light={cryo:{direction:[.5,1,.7],tint:[.5,.84,1],accent:'#67e8f9',bg:'#081329'},alert:{direction:[-.5,1,.3],tint:[1,.36,.3],accent:'#fb7185',bg:'#241025'},sunset:{direction:[-.8,.7,.5],tint:[1,.8,.5],accent:'#fbbf24',bg:'#212039'}}[cfg.lighting];
  const palettes={station:{floor:'#192c46',edge:'#344a66',accent:'#4fbce7'},forest:{floor:'#244b3e',edge:'#18362f',accent:'#86efac'},island:{floor:'#354364',edge:'#63739b',accent:'#c4b5fd'}};
  const zones=[{name:'Zona inicial',theme:cfg.theme},...cfg.zones],step=28,lastZone=zones.length-1,gateZ=-12-step*lastZone;
  const worldZ=o=>o.z-step*(o.zone||0),zoneOf=z=>clamp(Math.floor((14-z)/step),0,lastZone);
  const crystals=cfg.objects.filter(o=>o.type==='crystal'),zoneObjects=zones.map((_,i)=>cfg.objects.filter(o=>(o.zone||0)===i));
  let palette=palettes[cfg.theme],viewZone=0,playerZone=0;
  document.body.style.setProperty('--accent',light.accent);document.body.style.background=light.bg;
  let model=null,drawQueued=false;
  function queueDraw(){if(!drawQueued){drawQueued=true;requestAnimationFrame(()=>{drawQueued=false;if(model)draw();});}}
  function cpu(){
    if(gl){const old=canvas;canvas=old.cloneNode(false);old.replaceWith(canvas);}gl=null;
    ctx=canvas.getContext('2d');renderer.textContent='Modo compatible · sin WebGL';
    if(!ctx){status.textContent='Este navegador no puede dibujar el escenario. Probá otra base del Studio.';return false;}return true;
  }
  try{
    gl=canvas.getContext('webgl',{alpha:false,antialias:cfg.quality==='high',powerPreference:'low-power'});
    if(gl){
      const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error('Shader no disponible');return s;};
      program=gl.createProgram();const vs=shader(gl.VERTEX_SHADER,'attribute vec3 aPosition; attribute vec3 aColor; uniform mat4 uVP; varying vec3 vColor; varying float vDepth; void main(){gl_Position=uVP*vec4(aPosition,1.0);vColor=aColor;vDepth=gl_Position.w;}'),fs=shader(gl.FRAGMENT_SHADER,'precision mediump float; varying vec3 vColor; varying float vDepth; uniform vec3 uFog; void main(){float fog=clamp((vDepth-28.0)/60.0,0.0,0.75);gl_FragColor=vec4(mix(vColor,uFog,fog),1.0);}');
      gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Programa 3D no disponible');gl.deleteShader(vs);gl.deleteShader(fs);gl.useProgram(program);
      buffer=gl.createBuffer();positionLocation=gl.getAttribLocation(program,'aPosition');colorLocation=gl.getAttribLocation(program,'aColor');projectionLocation=gl.getUniformLocation(program,'uVP');gl.uniform3fv(gl.getUniformLocation(program,'uFog'),rgb(light.bg));gl.enable(gl.DEPTH_TEST);renderer.textContent='3D · WebGL';
      canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();if(cpu()){bindCanvas();if(isolated)queueDraw();}});
    }else if(!cpu())return;
  }catch(_e){if(!cpu())return;}
  function matrixMultiply(a,b){const out=new Float32Array(16);for(let col=0;col<4;col++)for(let row=0;row<4;row++)for(let k=0;k<4;k++)out[col*4+row]+=a[k*4+row]*b[col*4+k];return out;}
  function camera(){
    const follow=!editing&&cfg.camera==='follow',focus=isolated?Math.max(1.25,model.height*.58):0,target=isolated?[0,focus,0]:follow?[player.x,0,player.z-1]:[0,0,-step*(editing?viewZone:playerZone)],distance=isolated?Math.max(6,model.height*1.9,model.size*1.8,5.7/(canvas.width/canvas.height)):follow?19:30,eye=[target[0]+Math.sin(yaw)*distance,isolated?focus+1.65:follow?13:23,target[2]+Math.cos(yaw)*distance];
    const z=unit(sub(eye,target)),x=unit(cross([0,1,0],z)),y=cross(z,x),dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0);
    const view=new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);
    const f=1/Math.tan(Math.PI/8),aspect=canvas.width/canvas.height,near=.1,far=100;
    const perspective=new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0]);viewProjection=matrixMultiply(perspective,view);
  }
  let triangles=[],drawLayer=0;const lightDirection=unit(light.direction);
  function triangle(a,b,c,color,glow){
    const n=unit(cross(sub(b,a),sub(c,a))),diffuse=Math.max(0,n.reduce((v,e,i)=>v+e*lightDirection[i],0));
    const base=rgb(color),lit=base.map((v,i)=>clamp(glow?v:v*(.4+diffuse*.7)*(.6+light.tint[i]*.4),0,1));triangles.push({p:[a,b,c],color:lit,layer:drawLayer});
  }
  function mesh(vertices,faces,color,glow){for(const face of faces)for(let i=1;i<face.length-1;i++)triangle(vertices[face[0]],vertices[face[i]],vertices[face[i+1]],color,glow);}
  function box(x,y,z,w,h,d,color,rotation=0,glow=false){
    const co=Math.cos(rotation),si=Math.sin(rotation),v=[[-1,0,-1],[1,0,-1],[1,0,1],[-1,0,1],[-1,1,-1],[1,1,-1],[1,1,1],[-1,1,1]].map(p=>[x+p[0]*w/2*co+p[2]*d/2*si,y+p[1]*h,z-p[0]*w/2*si+p[2]*d/2*co]);
    mesh(v,[[0,1,2,3],[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]],color,glow);
  }
  function pyramid(x,y,z,size,height,color){mesh([[x-size,y,z-size],[x+size,y,z-size],[x+size,y,z+size],[x-size,y,z+size],[x,y+height,z]],[[0,4,1],[1,4,2],[2,4,3],[3,4,0]],color);}
  function crystal(x,y,z,s,color){const a=elapsed*.8,co=Math.cos(a),si=Math.sin(a),v=[[0,-s,0],[s,0,0],[0,0,s],[-s,0,0],[0,0,-s],[0,s,0]].map(p=>[x+p[0]*co+p[2]*si,y+p[1],z-p[0]*si+p[2]*co]);mesh(v,[[0,2,1],[0,3,2],[0,4,3],[0,1,4],[5,1,2],[5,2,3],[5,3,4],[5,4,1]],color);}
  function objectPosition(o){return {x:o.x+(o.type==='drone'?Math.sin(elapsed*1.1+o.z)*1.5:0),z:worldZ(o)};}
  function objectMesh(o,p){const s=o.size;
      if(o.type==='crystal'){box(p.x,0,p.z,s,.15,s,palette.edge);crystal(p.x,1+Math.sin(elapsed*2+o.x)*.12,p.z,s*.45,o.color);}
      else if(o.type==='character'){avatar(p.x,0,p.z,o.color,o.avatarStyle,s,o.height/2);}
      else if(o.type==='tree'){box(p.x,0,p.z,s*.3,o.height*.45,s*.3,'#8b6650');pyramid(p.x,o.height*.25,p.z,s*.8,o.height*.85,o.color);pyramid(p.x,o.height*.6,p.z,s*.55,o.height*.7,o.color);}
      else if(o.type==='drone'){box(p.x,.8,p.z,s,.4,s*.65,o.color);box(p.x,.94,p.z+s*.33,s*.6,.12,.03,'#fb7185',0,true);box(p.x,.86,p.z,s*1.9,.07,.2,palette.edge,elapsed*4);}
      else if(o.type==='beacon'){box(p.x,0,p.z,s*.5,o.height,s*.5,palette.edge);crystal(p.x,o.height+.3,p.z,s*.45,o.color);}
      else if(o.type==='house'){box(p.x,0,p.z,s,o.height*.75,s,o.color);pyramid(p.x,o.height*.75,p.z,s*.72,o.height*.32,'#ac6555');box(p.x,0,p.z+s*.505,s*.24,o.height*.52,.08,'#eac18a');box(p.x-s*.28,o.height*.34,p.z+s*.52,s*.2,.18,.06,'#9ed9f2');}
      else if(o.type==='car'){box(p.x,.2,p.z,s*.95,o.height*.3,s*1.6,o.color);box(p.x,o.height*.28+.18,p.z,s*.68,o.height*.34,s*.83,'#8ab6cf');for(const dx of [-.36,.36])for(const dz of [-.55,.55])box(p.x+dx*s,.02,p.z+dz*s,s*.16,s*.32,s*.3,'#182334');box(p.x,o.height*.3,p.z+s*.82,s*.6,.08,.04,'#fff7c2',0,true);}
      else if(o.type==='mountain'){pyramid(p.x,0,p.z,s*.73,o.height,o.color);pyramid(p.x,o.height*.72,p.z,s*.205,o.height*.28,'#edeefa');}
      else if(o.type==='airplane'){box(p.x,.27,p.z,s*.24,o.height*.42,s*1.27,o.color);box(p.x,.39,p.z,s*1.52,.12,s*.32,o.color);box(p.x,.71,p.z+.46*s,s*.09,o.height*.41,s*.24,o.color);box(p.x,.48,p.z-.32*s,s*.22,o.height*.23,s*.45,'#7db8d9');}
      else if(o.type==='shield'){box(p.x,0,p.z,s*.45,.12,s*.42,palette.edge);box(p.x,.24,p.z,s*.7,o.height,.17,o.color);box(p.x,.25,p.z+.11,s*.12,o.height*.88,.06,'#fde68a');}
      else if(o.type==='staff'){box(p.x,0,p.z,s*.43,.12,s*.43,palette.edge);box(p.x,.1,p.z,s*.12,o.height,s*.12,o.color);crystal(p.x,o.height+.18,p.z,s*.22,o.color);}
      else if(o.type==='road'){box(p.x,-.025,p.z,s,.06,s*1.8,o.color);for(let i=-1;i<=1;i++)box(p.x,.01,p.z+i*s*.52,s*.07,.015,s*.23,'#f6db85');}
      else if(o.type==='wall'){box(p.x,0,p.z,s,o.height,s*.24,o.color);box(p.x,o.height-.12,p.z,s*1.08,.12,s*.32,palette.edge);}
      else if(o.type==='rock'){pyramid(p.x,0,p.z,s*.58,o.height*.95,o.color);box(p.x,0,p.z,s*.48,o.height*.25,s*.48,palette.edge);}
      else if(o.type==='lamp'){box(p.x,0,p.z,s*.15,o.height,s*.15,'#526477');box(p.x,o.height-.15,p.z,s*.62,.12,s*.5,o.color);box(p.x,o.height-.29,p.z,s*.46,.12,s*.38,'#ffe9a1',0,true);}
      else if(o.type==='arch'){box(p.x-s*.42,0,p.z,s*.18,o.height,s*.35,o.color);box(p.x+s*.42,0,p.z,s*.18,o.height,s*.35,o.color);box(p.x,o.height-.19,p.z,s*1.05,.22,s*.44,o.color);}
      else{box(p.x,0,p.z,s,o.height,s,o.color);box(p.x,o.height-.15,p.z,s*1.02,.12,s*1.02,palette.edge);}
  }
  function geometry(){
    triangles=[];drawLayer=0;
    if(isolated){
      box(0,-.12,0,4.4,.1,4.4,palette.edge);drawLayer=1;
      objectMesh(model,{x:0,z:0});return;
    }
    const nearby=editing?viewZone:playerZone;
    for(let i=Math.max(0,nearby-1);i<=Math.min(lastZone,nearby+1);i++){
      const terrain=zones[i].theme,offset=-i*step;palette=palettes[terrain];
      drawLayer=0;box(0,-.65,offset,24,.6,28,palette.edge);
      drawLayer=1;
      for(let x=-10;x<=10;x+=4)for(let z=-12;z<=12;z+=4)box(x,-.06,z+offset,3.94,.06,3.94,((x+z)/4)%2?palette.floor:palette.edge);
      if(i<lastZone){
        box(0,-.04,offset-14,21,.035,.36,palette.accent,0,true);
        for(const x of [-8,8]){box(x,0,offset-14,.2,1.7,.2,palette.edge);box(x,1.7,offset-14,.35,.3,.35,palette.accent,0,true);}
      }
      drawLayer=2;
      for(let local=-12;local<=12;local+=4){
        const z=local+offset;
        if(terrain==='station'){for(const x of [-11,11]){box(x,0,z,.5,3,.6,palette.edge);box(x,.3,z,.55,2.3,.2,light.accent,0,true);}box(0,-.02,z,.04,.02,3.8,light.accent,0,true);}
        else if(terrain==='forest')for(const x of [-11,11]){box(x,0,z,.4,1,.4,'#715843');pyramid(x,.8,z,1.3,2.8,'#296b54');}
        else for(const x of [-11,11])crystal(x,.4,z,.4,'#c4b5fd');
      }
      for(const o of zoneObjects[i]){
        if(o.type==='crystal'&&collected.has(o.id))continue;
        const p=objectPosition(o),s=o.size;objectMesh(o,p);
        if(picked===o.id){box(p.x,-.01,p.z,s+1,.08,.06,'#fde68a',0,true);box(p.x,-.01,p.z,.06,.08,s+1,'#fde68a',0,true);}
      }
    }
    if(lastZone<=nearby+1){
      palette=palettes[zones[lastZone].theme];
      const gate=collected.size===crystals.length?'#86efac':'#8b9ab1';
      box(-1.3,0,gateZ,.4,3,.4,palette.edge);box(1.3,0,gateZ,.4,3,.4,palette.edge);box(0,2.6,gateZ,3,.4,.4,gate,0,true);box(0,.02,gateZ+.3,2.6,.05,1.3,gate);
    }
    if(Math.abs(playerZone-nearby)>1)return;
    palette=palettes[zones[playerZone].theme];
    const x=player.x,y=player.y,z=player.z,walk=Math.sin(elapsed*9)*(keys.ArrowLeft||keys.ArrowRight||keys.ArrowUp||keys.ArrowDown||keys.w||keys.a||keys.s||keys.d?1:0);
    avatar(x,y,z,cfg.avatarColor,cfg.avatarStyle,1,1,player.angle,walk);
  }
  function avatar(x,y,z,color,style,s,h,angle=0,walk=0){
    if(['minero','constructora','aventurera','guardian','velocista','astronauta','brote','aldeana'].includes(style)){
      blockAvatar(x,y,z,color,style,s,h,angle,walk);return;
    }
    box(x,y+.5*h,z,.65*s,.7*h,.45*s,color,angle);
    box(x,y+1.22*h,z,.64*s,.48*h,.55*s,color,angle);
    box(x,y+1.32*h,z+.3*s,.45*s,.2*h,.05*s,'#67e8f9',angle,true);
    for(const dir of [-1,1]){
      box(x+dir*.2*s,y+Math.max(0,dir*walk*.1)*h,z,.22*s,.5*h,.28*s,palette.edge);
      box(x+dir*.45*s,y+(.55-dir*walk*.08)*h,z,.18*s,.55*h,.22*s,color);
    }
    if(style==='piloto'){box(x,y+1.62*h,z,.7*s,.17*h,.6*s,'#e2e8f0',angle);box(x,y+.65*h,z-.26*s,.46*s,.53*h,.25*s,'#334155',angle);}
    else if(style==='explorador'){box(x,y+1.6*h,z,.84*s,.09*h,.69*s,'#db9a63',angle);box(x,y+1.67*h,z,.48*s,.21*h,.46*s,'#957153',angle);}
    else{box(x,y+1.7*h,z,.08*s,.25*h,.08*s,palette.edge);crystal(x,y+1.97*h,z,.1*s,light.accent);}
  }
  function blockAvatar(x,y,z,color,style,s,h,angle,walk){
    const co=Math.cos(angle),si=Math.sin(angle);
    const part=(dx,dy,dz,w,t,d,tone,lit=false)=>box(x+(dx*co+dz*si)*s,y+dy*h,z+(-dx*si+dz*co)*s,w*s,t*h,d*s,tone,angle,lit);
    const bulky=style==='guardian'||style==='astronauta',fast=style==='velocista';
    const face=style==='guardian'?'#2f294f':style==='brote'?'#637f35':style==='astronauta'?'#dceafa':style==='minero'?'#a97758':style==='constructora'?'#9a654d':'#dbab85';
    const pants=style==='guardian'?'#3b315c':style==='brote'?'#715938':style==='aldeana'?'#816851':style==='astronauta'?'#e1eaf5':'#29384f';
    const arm=bulky?.26:.20,body=bulky?.76:.63,head=bulky?.69:.59,shoe=fast?'#f8edcf':'#202938';
    for(const dir of [-1,1]){
      const bounce=Math.max(0,dir*walk*.10);
      part(dir*.19,.11+bounce,-dir*walk*.08,.27,.45,.35,pants);
      part(dir*.19,.02+bounce,.065-dir*walk*.08,.30,.13,.45,style==='brote'?'#5b472b':shoe);
      if(fast)part(dir*.19,.1+bounce,.29-dir*walk*.08,.23,.05,.025,color,true);
      part(dir*(body*.5+arm*.52),.63+dir*walk*.06,0,arm,.48,.32,color);
      part(dir*(body*.5+arm*.52),.49+dir*walk*.06,0,arm*.93,.18,.31,bulky||style==='constructora'?'#dceafa':face);
    }
    part(0,.56,0,body,.60,.43,color);
    part(0,1.17,0,head,.53,.55,face);
    if(style==='astronauta'){
      part(0,1.16,0,head+.11,.61,.64,'#deeaf5');
      part(0,1.28,.33,.60,.34,.10,'#182d53');
      part(-.13,1.52,.39,.29,.038,.012,'#a0ecf7',true);
      part(0,.61,-.33,.55,.58,.30,color);
      part(0,.80,.23,.28,.19,.04,'#293b58');
      part(0,.91,.257,.17,.045,.015,'#68e6c3',true);
    }else if(style==='guardian'){
      part(0,1.17,.28,.52,.16,.062,'#272137');
      for(const dir of [-1,1]){part(dir*.26,1.70,0,.18,.22,.26,color);part(dir*.14,1.22,.325,.12,.058,.025,'#a7f3f0',true);part(dir*.44,1.02,0,.28,.18,.42,'#42376b');}
      part(0,.77,.234,.35,.25,.09,'#42376b');part(0,.82,.286,.15,.14,.035,'#c4abff',true);
    }else{
      for(const dir of [-1,1])part(dir*.13,1.37,.285,.073,.07,.024,'#30243a');
      part(0,1.245,.285,.115,.030,.021,'#5b3943');
      if(style==='minero'||style==='constructora'){
        part(0,1.62,.02,.72,.09,.64,style==='minero'?'#be7c29':'#e7aa49');
        part(0,1.70,.02,.58,.17,.53,style==='minero'?'#dca33f':'#fac45f');
        if(style==='minero'){part(0,1.69,.33,.23,.18,.11,'#364150');part(0,1.73,.394,.135,.10,.028,'#fff1a7',true);}
        else{for(const dir of [-1,1]){part(dir*.17,.71,.227,.085,.38,.035,'#37486a');part(dir*.17,.84,.253,.062,.055,.02,'#ffd27f');}part(0,.65,.239,.38,.20,.04,'#37486a');}
      }else if(style==='aventurera'){
        part(0,1.58,-.045,.63,.19,.61,'#603d35');part(0,1.49,.28,.64,.088,.075,color);
        part(0,.68,-.34,.53,.45,.33,'#614e7c');part(0,.72,-.515,.32,.18,.04,'#bdb1df');
      }else if(style==='velocista'){
        part(0,1.60,-.016,.60,.16,.57,'#58404c');part(0,1.49,.29,.63,.09,.061,color);
        part(0,.78,.227,.28,.28,.034,'#f0e4ce');part(0,.91,.253,.15,.052,.012,color);
      }else if(style==='brote'){
        part(-.14,1.65,-.03,.15,.39,.16,'#40734e');part(-.25,1.89,0,.28,.12,.20,color);
        part(.22,1.62,-.02,.18,.22,.23,'#589864');part(0,.80,.229,.32,.26,.04,'#b3d271');
      }else{
        part(0,1.59,.01,.92,.092,.74,'#e5bc70');part(0,1.68,.02,.59,.23,.53,'#c29352');
        part(0,1.69,.295,.60,.07,.047,color);part(0,.61,.234,.43,.35,.053,'#e9d2a2');
      }
    }
  }
  function project(v){const m=viewProjection,x=v[0],y=v[1],z=v[2],w=m[3]*x+m[7]*y+m[11]*z+m[15];if(w<=.1)return null;return {x:(1+(m[0]*x+m[4]*y+m[8]*z+m[12])/w)*canvas.width/2,y:(1-(m[1]*x+m[5]*y+m[9]*z+m[13])/w)*canvas.height/2,depth:w};}
  function draw(){
    const r=canvas.getBoundingClientRect(),limit=cfg.quality==='high'?960:720,w=Math.max(1,Math.round(Math.min(limit,r.width||720))),h=Math.max(1,Math.round(w*(r.height||450)/(r.width||720)));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}camera();geometry();
    if(gl){
      const data=new Float32Array(triangles.length*18);let i=0;for(const t of triangles)for(const p of t.p){data.set(p,i);data.set(t.color,i+3);i+=6;}
      gl.viewport(0,0,w,h);const bg=rgb(light.bg);gl.clearColor(...bg,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);gl.uniformMatrix4fv(projectionLocation,false,viewProjection);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);gl.enableVertexAttribArray(positionLocation);gl.vertexAttribPointer(positionLocation,3,gl.FLOAT,false,24,0);gl.enableVertexAttribArray(colorLocation);gl.vertexAttribPointer(colorLocation,3,gl.FLOAT,false,24,12);gl.drawArrays(gl.TRIANGLES,0,triangles.length*3);
    }else{
      ctx.fillStyle=light.bg;ctx.fillRect(0,0,w,h);const faces=triangles.map(t=>({p:t.p.map(project),color:t.color,layer:t.layer})).filter(t=>t.p.every(Boolean));faces.sort((a,b)=>a.layer-b.layer||b.p.reduce((n,p)=>n+p.depth,0)-a.p.reduce((n,p)=>n+p.depth,0));
      for(const t of faces){ctx.fillStyle='rgb('+t.color.map(v=>Math.round(v*255)).join(',')+')';ctx.beginPath();t.p.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fill();}
    }
    if(!isolated){const i=editing?viewZone:playerZone;const note=(lastZone?'Zona '+(i+1)+' / '+zones.length+' · '+zones[i].name+' · ':'')+'Cristales '+collected.size+' / '+crystals.length+' · Vidas '+lives+' · '+Math.max(0,Math.ceil(time))+' s';if(hud.textContent!==note)hud.textContent=note;}
  }
  function reset(){player={x:0,y:0,z:11,vy:0,angle:0};playerZone=0;collected=new Set();lives=cfg.lives;time=cfg.seconds;elapsed=0;invincible=0;ended=false;paused=true;editing=true;last=0;Object.keys(keys).forEach(k=>keys[k]=false);mode.textContent='▶ Jugar';status.textContent='Vista de edición: arrastrá para girar; tocá un objeto para editarlo en Krueka.';}
  function blocked(x,z){return cfg.objects.some(o=>['crate','pillar','tree','house','car','wall','rock','lamp','mountain','airplane'].includes(o.type)&&player.y<o.height-.1&&Math.abs(x-o.x)<(o.type==='tree'?o.size*.25:o.size*.5)+.3&&Math.abs(z-worldZ(o))<(o.type==='tree'?o.size*.25:o.size*.5)+.3);}
  function update(dt){
    elapsed+=dt;if(paused||ended)return;time-=dt;invincible=Math.max(0,invincible-dt);if(time<=0){ended=true;status.textContent='Se terminó el tiempo. Ajustá el recorrido o intentá otra vez.';return;}
    let dx=Number(!!(keys.ArrowRight||keys.d))-Number(!!(keys.ArrowLeft||keys.a)),dz=Number(!!(keys.ArrowDown||keys.s))-Number(!!(keys.ArrowUp||keys.w)),length=Math.hypot(dx,dz)||1;dx=dx/length*cfg.speed*dt;dz=dz/length*cfg.speed*dt;
    if(!blocked(player.x+dx,player.z))player.x=clamp(player.x+dx,-10.5,10.5);if(!blocked(player.x,player.z+dz))player.z=clamp(player.z+dz,gateZ-.5,12.5);if(dx||dz)player.angle=Math.atan2(dx,dz);
    const entered=zoneOf(player.z);
    if(entered!==playerZone){playerZone=entered;status.textContent='Entraste en '+zones[entered].name+'. Podés volver por el mismo camino.';}
    if(cfg.jumpEnabled){if((keys[' ']||keys.jump)&&player.y===0)player.vy=7;}player.vy-=18*dt;player.y=Math.max(0,player.y+player.vy*dt);if(player.y===0)player.vy=0;
    for(const o of cfg.objects){const p=objectPosition(o),near=Math.hypot(player.x-p.x,player.z-p.z);
      if(o.type==='crystal'&&near<o.size*.6+.4&&!collected.has(o.id)){collected.add(o.id);status.textContent=collected.size===crystals.length?'¡Abriste el portal! Llegá al arco de la última zona.':'Cristal encontrado. Buscá el siguiente.';}
      if(o.type==='drone'&&near<o.size*.6+.35&&player.y<1.3&&invincible===0){lives--;invincible=1.8;if(lives<=0){ended=true;status.textContent='Fin del intento. Podés mover obstáculos y probar una ruta distinta.';}}
    }
    if(collected.size===crystals.length&&Math.abs(player.x)<1.4&&player.z<gateZ+1){ended=true;status.textContent='¡Misión cumplida! Construiste, probaste y exploraste tu mundo 3D.';}
  }
  function bindCanvas(){
    canvas.onpointerdown=e=>{drag={x:e.clientX,y:e.clientY,lastX:e.clientX,moved:false};canvas.setPointerCapture(e.pointerId);canvas.focus();};
    canvas.onpointermove=e=>{if(!drag)return;const delta=e.clientX-drag.lastX;drag.moved=drag.moved||Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>7;yaw-=delta*(isolated?.011:.007);drag.lastX=e.clientX;if(isolated)queueDraw();};
    canvas.onpointerup=e=>{if(!isolated&&drag&&!drag.moved&&editing){const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*canvas.width/r.width,y=(e.clientY-r.top)*canvas.height/r.height;let best=null,distance=45;for(const o of zoneObjects[viewZone]){const p=project([o.x,o.type==='crystal'?1:o.height/2,worldZ(o)]);if(p){const d=Math.hypot(p.x-x,p.y-y);if(d<distance){best=o.id;distance=d;}}}if(best){picked=best;parent.postMessage({type:'krueka-scene-select',id:best},'*');}}drag=null;};
    canvas.onpointercancel=()=>drag=null;
  }
  if(isolated){
    elapsed=0;
    bindCanvas();
    addEventListener('message',e=>{
      if(e.source!==parent||e.data?.type!=='krueka-piece-model')return;
      model=normalise({objects:[e.data.object]}).objects[0];
      document.body.dataset.piece=model.type;
      queueDraw();
    });
    addEventListener('resize',queueDraw);
    document.getElementById('rotate-left').onclick=()=>{yaw+=.35;queueDraw();};
    document.getElementById('rotate-right').onclick=()=>{yaw-=.35;queueDraw();};
    return;
  }
  addEventListener('message',e=>{
    if(e.source!==parent)return;
    if(e.data?.type==='krueka-scene-zone'&&Number.isInteger(e.data.zone)){viewZone=clamp(e.data.zone,0,lastZone);picked=null;}
    else if(e.data?.type==='krueka-scene-highlight'){const object=cfg.objects.find(o=>o.id===e.data.id);picked=object?.id||null;if(object)viewZone=object.zone||0;}
  });
  addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key))e.preventDefault();keys[e.key.length===1?e.key.toLowerCase():e.key]=true;});
  addEventListener('keyup',e=>keys[e.key.length===1?e.key.toLowerCase():e.key]=false);addEventListener('blur',()=>Object.keys(keys).forEach(k=>keys[k]=false));
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&!editing&&!ended){paused=true;document.getElementById('pause').textContent='Continuar';}});
  document.querySelectorAll('[data-key]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys[b.dataset.key]=true;};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>keys[b.dataset.key]=false;});
  mode.onclick=()=>{editing=!editing;paused=editing;mode.textContent=editing?'▶ Jugar':'✎ Editar escena';document.getElementById('pause').textContent='Pausar';status.textContent=editing?'Vista de edición: arrastrá para girar; tocá un objeto para seleccionarlo.':'Flechas o WASD para explorar; Espacio para saltar. Juntá los cristales y llegá al portal.';};
  document.getElementById('pause').onclick=()=>{if(editing||ended)return;paused=!paused;document.getElementById('pause').textContent=paused?'Continuar':'Pausar';};document.getElementById('restart').onclick=reset;
  document.getElementById('rotate-left').onclick=()=>yaw+=.25;document.getElementById('rotate-right').onclick=()=>yaw-=.25;
  reset();bindCanvas();function frame(now){const dt=last?Math.min((now-last)/1000,.06):0;last=now;update(dt);if(now-lastDraw>=1000/30){draw();lastDraw=now;}requestAnimationFrame(frame);}requestAnimationFrame(frame);
}
// La cámara de inspección solo cambia la proyección: no toca el archivo de
// escena, la posición del jugador, las reglas ni el estado guardado.
function mountInspectionCamera(){
  const turn=document.querySelector('.camera'),stage=turn?.closest('.stage');
  if(!stage)return;
  const bar=document.createElement('div');bar.className='kr-inspect-view';bar.setAttribute('role','group');bar.setAttribute('aria-label','Cámara de la zona');
  bar.innerHTML='<b>Vista 3D</b><button type="button" id="kr-view-out" aria-label="Alejar zona">−</button><output id="kr-view-level" aria-label="Zoom de la zona">100%</output><button type="button" id="kr-view-in" aria-label="Acercar zona">＋</button><button type="button" id="kr-view-pan" aria-pressed="false" title="Arrastrá el escenario para mover la vista">Mover vista</button><button type="button" id="kr-view-reset">Centrar</button>';
  stage.before(bar);
  const style=document.createElement('style');
  style.textContent='.kr-inspect-view{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:8px 0;color:#e6f0fa;font:12px system-ui}.kr-inspect-view b{color:#b8d1e7;margin-right:2px}.kr-inspect-view button{min-width:42px;min-height:42px;padding:6px 9px}.kr-inspect-view button:disabled{opacity:.5;cursor:default}.kr-inspect-view button[aria-pressed=true]{background:var(--accent);color:#082437}.kr-inspect-view :focus-visible{outline:2px solid #fef08a;outline-offset:2px}.kr-inspect-view output{min-width:33px;text-align:center;font-variant-numeric:tabular-nums}';
  document.head.append(style);
  const out=document.getElementById('kr-view-out'),level=document.getElementById('kr-view-level'),inside=document.getElementById('kr-view-in'),move=document.getElementById('kr-view-pan');
  function refresh(){level.value=Math.round(inspectionZoom*100)+'%';out.disabled=inspectionZoom<=.75;inside.disabled=inspectionZoom>=2;move.disabled=!editing;move.setAttribute('aria-pressed',String(editing&&inspectionPan));}
  function zoom(delta){inspectionZoom=clamp(inspectionZoom+delta,.75,2);refresh();}
  out.onclick=()=>zoom(-.25);inside.onclick=()=>zoom(.25);
  move.onclick=()=>{inspectionPan=!inspectionPan;refresh();};
  document.getElementById('kr-view-reset').onclick=()=>{inspectionZoom=1;inspectionX=inspectionZ=0;inspectionPan=false;yaw=inspectionYaw;refresh();};
  mode.addEventListener('click',refresh);
  document.getElementById('restart').addEventListener('click',refresh);
  // La rueda normal mantiene el desplazamiento del panel. Los botones también
  // funcionan con teclado o pantalla táctil sin pedir gestos especiales.
  refresh();
}
const oldNormaliserSource=normalise.toString().replace('[]).map((z,i)','[]).slice(0,3).map((z,i)').replace('[]).flatMap','[]).slice(0,192).flatMap');
const baseNormalise=normalise;
const standardGame='/* Motor 3D propio: geometría, cámara, iluminación, colisiones y modo compatible. */\nconst avatarProfiles = '+avatarProfiles.toString()+';\nconst normalise = '+oldNormaliserSource+';\n('+runtime.toString()+')();';
const inspectableGame=standardGame
  .replace('  function camera(){','  let inspectionZoom=1,inspectionX=0,inspectionZ=0,inspectionPan=false;const inspectionYaw=yaw;\n  function camera(){')
  .replace('    const z=unit(sub(eye,target))','    if(editing&&!isolated){target[0]+=inspectionX;eye[0]+=inspectionX;target[2]+=inspectionZ;eye[2]+=inspectionZ;}\n    const z=unit(sub(eye,target))')
  .replace('const f=1/Math.tan(Math.PI/8)','const f=(isolated?1:inspectionZoom)/Math.tan(Math.PI/8)')
  .replace('lastX:e.clientX,moved:false','lastX:e.clientX,lastY:e.clientY,pointer:e.pointerId,pan:!isolated&&editing&&(inspectionPan||e.shiftKey),moved:false')
  .replace('canvas.onpointerdown=e=>{drag=','canvas.onpointerdown=e=>{if(drag||!e.isPrimary||e.button!==0)return;drag=')
  .replace('if(!drag)return;const delta=','if(!drag||drag.pointer!==e.pointerId)return;const delta=')
  .replace('yaw-=delta*(isolated?.011:.007);drag.lastX=e.clientX;', 'if(drag.pan){const pixel=31/Math.max(180,canvas.clientHeight)/inspectionZoom,dy=e.clientY-drag.lastY;inspectionX=clamp(inspectionX-(delta*Math.cos(yaw)+dy*Math.sin(yaw))*pixel,-12,12);inspectionZ=clamp(inspectionZ+(delta*Math.sin(yaw)-dy*Math.cos(yaw))*pixel,-14,14);}else yaw-=delta*(isolated?.011:.007);drag.lastX=e.clientX;drag.lastY=e.clientY;')
  .replace('canvas.onpointerup=e=>{if(!isolated&&drag&&!drag.moved&&editing)', 'canvas.onpointerup=e=>{if(!drag||drag.pointer!==e.pointerId)return;if(!isolated&&!drag.pan&&!drag.moved&&editing)')
  .replace('canvas.onpointercancel=()=>drag=null;','canvas.onpointercancel=canvas.onlostpointercapture=e=>{if(drag?.pointer===e.pointerId)drag=null;};')
  .replace('viewZone=clamp(e.data.zone,0,lastZone);picked=null;', 'const next=clamp(e.data.zone,0,lastZone);if(next!==viewZone)inspectionX=inspectionZ=0;viewZone=next;picked=null;')
  .replace("addEventListener('keydown',e=>{if([", "addEventListener('keydown',e=>{if(e.target?.closest?.('button'))return;if([")
  .replace('  reset();bindCanvas();','  reset();('+mountInspectionCamera.toString()+')();bindCanvas();');
// El visor habilita el zoom para proyectos de la edición anterior sin
// reescribir el motor guardado ni tocar proyectos con JavaScript propio.
function previewFiles(files){return files?.['game.js']===standardGame?{...files,'game.js':inspectableGame}:files;}
// El índice de la zona sigue identificando sus objetos. La cuadrícula solo
// decide dónde aparece; los mundos antiguos conservan la misma fila vertical.
function gridDirections(){
 return [['up',0,-1,'↑ Arriba'],['right',1,0,'→ Derecha'],['down',0,1,'↓ Abajo'],['left',-1,0,'← Izquierda']];
}
function mapNormalise(raw){
 const cfg=baseNormalise(raw),placed=[{col:0,row:0}],input=Array.isArray(raw?.zones)?raw.zones:[],directions=gridDirections();
 const cells=new Set(['0,0']),key=(col,row)=>col+','+row,occupied=(col,row)=>cells.has(key(col,row));
 for(const [i,z] of cfg.zones.entries()){
  const pick=input[i]||{},valid=Number.isSafeInteger(pick.col)&&Number.isSafeInteger(pick.row)&&
   !occupied(pick.col,pick.row)&&directions.some(([,dx,dz])=>occupied(pick.col+dx,pick.row+dz));
  let col=pick.col,row=pick.row;
  if(!valid){
   outer:for(let j=placed.length-1;j>=0;j--)for(const [,dx,dz] of directions){
    col=placed[j].col+dx;row=placed[j].row+dz;if(!occupied(col,row))break outer;
   }
  }
  cells.add(key(col,row));placed.push({col,row});Object.assign(z,{col,row});
 }
 return cfg;
}
function worldLayout(cfg){
 const width=24,depth=28,directions=gridDirections();
 const zones=[{name:'Zona inicial',theme:cfg.theme,col:0,row:0},...(cfg.zones||[])].map((p,i)=>({...p,col:p.col??0,row:p.row??-i,x:(p.col??0)*width,z:(p.row??-i)*depth}));
 const byCell=new Map(zones.map((p,i)=>[p.col+','+p.row,i]));
 const exits=zones.map(p=>directions.flatMap(([id,dx,dz,label])=>{
  const index=byCell.get((p.col+dx)+','+(p.row+dz));return index===undefined?[]:[{id,dx,dz,label,index}];
 }));
 const gateIndex=zones.length-1,goal=zones[gateIndex];
 // Dejar el portal en un borde libre, aun cuando la zona final tenga un
 // vecino arriba. Primero se intenta la posición clásica.
 const gateSide=directions.find(([id])=>!exits[gateIndex].some(e=>e.id===id));
 const [gateDir,gdx,gdz]=gateSide||directions[0],gate={x:goal.x+gdx*(gateSide?9.75:6),z:goal.z+gdz*(gateSide?12:7),dir:gateDir,dx:gdx,dz:gdz};
 function locate(x,z){return byCell.get(Math.floor((x+width/2)/width)+','+Math.floor((z+depth/2)/depth));}
 function walkable(x,z){
  const i=locate(x,z);if(i===undefined)return false;
  const p=zones[i],lx=x-p.x,lz=z-p.z;
  if(Math.abs(lx)<=10.5&&Math.abs(lz)<=12.5)return true;
  return exits[i].some(({dx,dz})=>dx?dx*lx>=10.5&&Math.abs(lz)<=9:dz*lz>=12.5&&Math.abs(lx)<=10);
 }
 function point(o){const p=zones[o.zone||0];return {x:p.x+o.x,z:p.z+o.z};}
 function atGate(x,z){const lx=x-gate.x,lz=z-gate.z;return Math.abs(gdx?lz:lx)<1.4&&Math.abs(gdx?lx:lz)<1.15;}
 return {width,depth,zones,directions,exits,gate,locate,walkable,point,atGate};
}
function connectorMesh(p,edge,palette){
 const {dx,dz}=edge,wide=dx?18:20;
 box(p.x+dx*11.95,-.032,p.z+dz*13.95,dx?.34:wide,.03,dx?wide:.34,palette.accent,0,true);
 for(const side of [-1,1]){
  const x=p.x+dx*11.95+dz*side*(wide/2),z=p.z+dz*13.95+dx*side*(wide/2);
  box(x,0,z,.2,1.5,.2,palette.edge);box(x,1.5,z,.32,.22,.32,palette.accent,0,true);
 }
}
function portalMesh(gate,palette,open){
 const {x,z,dx,dz}=gate,color=open?'#86efac':'#8b9ab1';
 for(const dir of [-1,1])box(x+dz*dir*1.3,0,z+dx*dir*1.3,.4,3,.4,palette.edge);
 box(x,2.6,z,dx?.4:3,.4,dx?3:.4,color,0,true);
 box(x-dx*.3,.02,z-dz*.3,dx?1.3:2.6,.05,dx?2.6:1.3,color);
}
function runtimeGrid(base){
 const declarations=[gridDirections,mapNormalise,worldLayout].map(fn=>fn.toString()).join('\n');
 const enlarged=base.replace('const normalise = '+oldNormaliserSource,'const baseNormalise = '+normalise.toString());
 return enlarged
  .replace(';\n(function runtime(isolated){',';\n'+declarations+'\nconst normalise=mapNormalise;\n(function runtime(isolated){')
  .replace(/const zones=\[\{name:'Zona inicial'.*\n  const worldZ=.*?;/,'const map=worldLayout(cfg),zones=map.zones,lastZone=zones.length-1;')
  .replace('[0,0,-step*(editing?viewZone:playerZone)]','[zones[editing?viewZone:playerZone].x,0,zones[editing?viewZone:playerZone].z]')
  .replace(/const crystals=cfg.objects.filter[^;]+;/,`const crystals=cfg.objects.filter(o=>o.type==='crystal'),zoneObjects=zones.map(()=>[]);
  for(const obj of cfg.objects)zoneObjects[obj.zone||0].push(obj);
  const nearbyObjects=zoneObjects.map((objs,i)=>objs.concat(...map.exits[i].map(e=>zoneObjects[e.index])));`)
  .replace('function blocked(x,z){return cfg.objects.some','function blocked(x,z){return nearbyObjects[playerZone].some')
  .replace('for(const o of cfg.objects){const p=objectPosition(o),near=', 'for(const o of nearbyObjects[playerZone]){const p=objectPosition(o),near=')

  .replace(/function objectPosition\(o\)\{[^\n]+/,"function objectPosition(o){const p=map.point(o);p.x+=o.type==='drone'?Math.sin(elapsed*1.1+o.z)*1.5:0;return p;}")
  .replace('  function geometry(){','  '+connectorMesh.toString()+'\n  '+portalMesh.toString()+'\n  function geometry(){')
  .replace('for(let i=Math.max(0,nearby-1);i<=Math.min(lastZone,nearby+1);i++){','const visible=[nearby,...map.exits[nearby].map(e=>e.index)];\n    for(const i of visible){')
  .replace(/const terrain=zones\[i\].theme,offset=-i\*step;[^]*?      drawLayer=2;/,`const {theme:terrain,x:cx,z:cz}=zones[i];palette=palettes[terrain];
      drawLayer=0;box(cx,-.65,cz,map.width,.6,map.depth,palette.edge);
      drawLayer=1;
      for(let x=-10;x<=10;x+=4)for(let z=-12;z<=12;z+=4)box(cx+x,-.06,cz+z,3.94,.06,3.94,((x+z)/4)%2?palette.floor:palette.edge);
      for(const edge of map.exits[i])connectorMesh(zones[i],edge,palette);
      drawLayer=2;`)
  .replace('const z=local+offset;','const z=local+cz;')
  .replace('for(const x of [-11,11]){box(x,0,z,.5,3,.6,palette.edge);box(x,.3,z,.55,2.3,.2,light.accent,0,true);}box(0,-.02,z,.04,.02,3.8,light.accent,0,true);','for(const side of [-1,1]){if(Math.abs(local)<=8&&map.exits[i].some(e=>e.dx===side))continue;const x=cx+side*11;box(x,0,z,.5,3,.6,palette.edge);box(x,.3,z,.55,2.3,.2,light.accent,0,true);}box(cx,-.02,z,.04,.02,3.8,light.accent,0,true);')
  .replace("for(const x of [-11,11]){box(x,0,z,.4,1,.4,'#715843');", "for(const side of [-1,1]){if(Math.abs(local)<=8&&map.exits[i].some(e=>e.dx===side))continue;const x=cx+side*11;box(x,0,z,.4,1,.4,'#715843');")
  .replace("for(const x of [-11,11])crystal(x,.4,z,.4,'#c4b5fd');","for(const side of [-1,1])if(!(Math.abs(local)<=8&&map.exits[i].some(e=>e.dx===side)))crystal(cx+side*11,.4,z,.4,'#c4b5fd');")
  .replace(/    if\(lastZone<=nearby\+1\)\{[^]*?if\(Math.abs\(playerZone-nearby\)>1\)return;/,`    if(visible.includes(lastZone))portalMesh(map.gate,palettes[zones[lastZone].theme],collected.size===crystals.length);
    if(!visible.includes(playerZone))return;`)
  .replace('Math.abs(x-o.x)','Math.abs(x-map.point(o).x)').replace('Math.abs(z-worldZ(o))','Math.abs(z-map.point(o).z)')
  .replace(/if\(!blocked\(player.x\+dx,player.z\)\)[^\n]+\n    const entered=zoneOf\(player.z\);/,`if(map.walkable(player.x+dx,player.z)&&!blocked(player.x+dx,player.z))player.x+=dx;
    if(map.walkable(player.x,player.z+dz)&&!blocked(player.x,player.z+dz))player.z+=dz;
    if(dx||dz)player.angle=Math.atan2(dx,dz);
    const entered=map.locate(player.x,player.z)??playerZone;`)
  .replace('Math.abs(player.x)<1.4&&player.z<gateZ+1','map.atGate(player.x,player.z)')
  .replace("Llegá al arco de la última zona.","Buscá el portal de la última zona.")
  .replace('const p=project([o.x,o.type===\'crystal\'?1:o.height/2,worldZ(o)]);',"const obj=objectPosition(o),p=project([obj.x,o.type==='crystal'?1:o.height/2,obj.z]);");
}
const directionalGame=runtimeGrid(inspectableGame);
const themes={station:'Estación neón',forest:'Bosque de cristales',island:'Isla flotante'},lights={cryo:'Azul frío',alert:'Alerta roja',sunset:'Atardecer'},types={crystal:'Cristal',crate:'Bloque',pillar:'Columna',tree:'Árbol',drone:'Dron',beacon:'Baliza',house:'Casa',car:'Auto decorativo',road:'Camino',wall:'Muro',rock:'Roca',lamp:'Farola',arch:'Arco',mountain:'Montaña',airplane:'Avión decorativo',shield:'Escudo de fantasía',staff:'Vara de luz',character:'Personaje de escena'};
function create(legacy=false){
  const objects=[[-7,8],[7,7],[-5,2],[6,1],[-7,-5],[7,-8],[0,-7]].map(([x,z],i)=>({id:'crystal-'+i,type:'crystal',label:'Cristal '+(i+1),x,z,size:1,height:1.5,color:'#67e8f9'}));
  objects.push(...[[-4,6],[4,3],[-3,-2],[5,-5]].map(([x,z],i)=>({id:'block-'+i,type:'crate',label:'Bloque '+(i+1),x,z,size:2,height:1.2,color:'#526889'})),...[[0,4],[-4,-6]].map(([x,z],i)=>({id:'drone-'+i,type:'drone',label:'Dron '+(i+1),x,z,size:1,height:1,color:'#fb7185'})),{id:'beacon-0',type:'beacon',label:'Baliza',x:8,z:-3,size:1,height:2.5,color:'#a5b4fc'});
  const cfg=mapNormalise({title:'Exploradores 3D',objects});
  return {'index.html':'<!doctype html>\n<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Exploradores 3D</title><link rel="stylesheet" href="style.css"></head><body><main><header><div><small>KRUEKA · MI MUNDO 3D</small><h1 id="game-title"></h1></div><button id="mode">▶ Jugar</button></header><div class="toolbar"><span id="hud" role="status"></span><span id="renderer"></span><button id="pause">Pausar</button><button id="restart">Reiniciar</button></div><div class="stage"><canvas id="arena" tabindex="0" aria-label="Mundo 3D: arrastrá para girar la vista"></canvas><div class="camera"><button id="rotate-left" aria-label="Girar cámara a la izquierda">↶</button><button id="rotate-right" aria-label="Girar cámara a la derecha">↷</button></div><div class="badge">CREÁ TU PROPIO RECORRIDO</div></div><div id="controls"><button data-key="ArrowLeft" aria-label="Izquierda">←</button><button data-key="ArrowUp" aria-label="Avanzar">↑</button><button data-key="ArrowDown" aria-label="Retroceder">↓</button><button data-key="ArrowRight" aria-label="Derecha">→</button><button data-key="jump">Saltar</button></div><p id="status" role="status"></p></main><script src="game-config.js"><\/script><script src="game.js"><\/script></body></html>',
    'style.css':'*{box-sizing:border-box}body{margin:0;background:#081329;color:#eef6ff;font-family:system-ui,sans-serif;--accent:#67e8f9}main{max-width:1100px;margin:auto;padding:14px}header{display:flex;justify-content:space-between;align-items:center;gap:12px}h1{font-size:clamp(22px,3vw,32px);margin:5px 0}small{font-size:10px;letter-spacing:.18em;color:var(--accent)}button{border:1px solid #ffffff30;background:#172338;color:#e9f5ff;border-radius:10px;font:inherit;font-size:12px;padding:10px 13px;cursor:pointer;touch-action:none}#mode{background:var(--accent);color:#102238;font-weight:800;white-space:nowrap}.toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:11px;margin:10px 0}#hud{font-weight:750;flex:1;min-width:170px}#renderer{color:#9ab0cd;font-size:10px}.stage{position:relative;border:1px solid #5a7caa66;border-radius:16px;overflow:hidden;box-shadow:0 16px 60px #0004}canvas{display:block;width:100%;height:clamp(300px,56vh,600px);touch-action:none;outline:0}.camera{position:absolute;right:12px;bottom:12px;display:flex;gap:6px}.badge{position:absolute;left:14px;top:14px;pointer-events:none;color:#abc7e1;font-size:9px;letter-spacing:.12em}#controls{display:flex;justify-content:center;gap:6px;margin:12px 0}#controls button{min-width:42px;min-height:42px}#status{font-size:12px;text-align:center;line-height:1.5;color:#a8bdd7;min-height:36px}@media(max-width:480px){main{padding:9px}#renderer{display:none}canvas{height:340px}#controls button{padding:9px 11px}.toolbar button{padding:8px}}',
    'game-config.js':StudioKits.configFile(cfg),'game.js':legacy===true?inspectableGame:directionalGame,
    'LEEME.md':'# Exploradores 3D\n\nTema: Escenarios 3D y reglas de un videojuego.\nCapacidad: Construir y probar un recorrido, modificando objetos y ambientación.\nIndicadores: ubico objetos; comparo dos luces; pruebo colisiones y controles; explico una mejora.\n\n1. Elegí Bases y reglas: cambiá luces, escenario y personaje.\n2. Seleccioná un objeto en la escena o en la lista; cambiá X y Z, tamaño y altura.\n3. Probá con Jugar: juntá cristales y llegá al arco del fondo.\n4. Si es difícil, mové un obstáculo o aumentá el tiempo.\n5. Escribí acá qué cambiaste y qué mejoró. Enviá al profe.\n\nLos controles visuales no consultan IA. El Chat puede guardar ideas pendientes de conexión.\n'};
}
function piecePreview(){
 const source="window.KRUEKA_GAME={};const avatarProfiles="+avatarProfiles.toString()+";const normalise="+normalise.toString()+";("+runtime.toString()+")(true);";
 return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'"><title>Vista de la pieza</title><style>*{box-sizing:border-box}body{margin:0;background:#081329;color:#f1f5ff;font:12px system-ui}canvas{display:block;width:100%;height:100dvh;touch-action:none}nav{position:fixed;bottom:8px;left:50%;transform:translateX(-50%);display:flex;gap:8px}button{font:inherit;color:inherit;min-width:44px;min-height:38px;border:1px solid #728aa7;border-radius:8px;background:#13283c;cursor:pointer}#status{position:absolute;top:0;left:8px;right:8px}</style></head><body><span id="renderer" hidden></span><span id="game-title" hidden></span><p id="status" role="status"></p><canvas id="arena" tabindex="0" aria-label="Modelo 3D aislado: arrastrá para girarlo"></canvas><nav aria-label="Girar el modelo"><button id="rotate-left" aria-label="Girar a la izquierda">↶</button><button id="rotate-right" aria-label="Girar a la derecha">↷</button></nav><script>'+source+'<\/script></body></html>';
}

function renderEditor(studio,el,raw){
  const cfg=mapNormalise(raw),zone=Math.max(0,Math.min(cfg.zones.length,studio.expansionZone||0)),objects=cfg.objects.filter(o=>(o.zone||0)===zone),selected=objects.find(o=>o.id===studio.selectedSceneObject)||objects[0];studio.selectedSceneObject=selected?.id||null;
  const compatibleTypes=studio.files?.['game.js']===create()['game.js']?types:Object.fromEntries(Object.entries(types).filter(([key])=>(key!=='character'&&!['mountain','airplane','shield','staff'].includes(key))||key===selected?.type));
  const options=(entries,value)=>Object.entries(entries).map(([id,label])=>'<option value="'+id+'" '+(id===value?'selected':'')+'>'+esc(label)+'</option>').join('');
  el.innerHTML='<div class="ks-section-label">CONSTRUÍ · ILUMINÁ · JUGÁ</div><h2>Tu mundo 3D</h2><p>Mové objetos, elegí las luces y probá tu recorrido. Estos controles funcionan sin IA.</p><div class="ks-light-grid">'+Object.entries(lights).map(([id,label])=>'<button class="ks-btn ks-light '+id+'" data-light="'+id+'" aria-pressed="'+(id===cfg.lighting)+'"><span></span>'+label+'</button>').join('')+'</div><section class="ks-settings"><h3>Ambientación y reglas</h3><label>Nombre en el juego<input data-scene="title" maxlength="60" value="'+esc(cfg.title)+'"></label><div class="ks-fields"><label>Mundo<select data-scene="theme">'+options(themes,cfg.zones[zone-1]?.theme||cfg.theme)+'</select></label><label>Color del explorador<input data-scene="avatarColor" type="color" value="'+cfg.avatarColor+'"></label><label>Velocidad<input data-scene="speed" type="number" min="2" max="9" step=".5" value="'+cfg.speed+'"></label><label>Vidas<input data-scene="lives" type="number" min="1" max="9" value="'+cfg.lives+'"></label><label>Tiempo (segundos)<input data-scene="seconds" type="number" min="30" max="300" value="'+cfg.seconds+'"></label><label>Cámara<select data-scene="camera">'+options({follow:'Seguir al personaje',orbit:'Vista general'},cfg.camera)+'</select></label><label>Calidad<select data-scene="quality">'+options({low:'Liviana',high:'Más nitidez'},cfg.quality)+'</select></label></div><button id="ks-scene-apply" class="ks-btn primary">Aplicar y probar</button></section><section class="ks-settings" id="ks-scene-objects"><h3>Objetos del mundo · '+objects.length+' / 48</h3><p>Tocá un objeto en la vista de edición o elegilo aquí. X mueve a los lados; Z, adelante y atrás.</p><div class="ks-scene-list">'+objects.map(o=>'<button class="ks-btn" data-object="'+o.id+'" aria-pressed="'+(o.id===selected?.id)+'">'+esc(o.label)+'<small>'+esc(types[o.type])+'</small></button>').join('')+'</div>'+ (selected?'<label>Nombre del objeto<input data-object-field="label" maxlength="32" value="'+esc(selected.label)+'"></label><div class="ks-fields"><label>Tipo<select data-object-field="type">'+options(compatibleTypes,selected.type)+'</select></label>'+[['x','Posición X',-10,10],['z','Posición Z',-12,12],['size','Tamaño',.4,4],['height','Altura',.5,5]].map(([id,label,min,max])=>'<label>'+label+'<input data-object-field="'+id+'" type="number" min="'+min+'" max="'+max+'" step=".5" value="'+selected[id]+'"></label>').join('')+'<label>Color<input data-object-field="color" type="color" value="'+selected.color+'"></label></div><div class="ks-scene-actions"><button id="ks-object-apply" class="ks-btn primary">Guardar objeto</button><button id="ks-object-copy" class="ks-btn">Duplicar</button><button id="ks-object-remove" class="ks-btn">Quitar</button></div>':'<p>Agregá objetos para construir tu recorrido.</p>')+'<div class="ks-scene-add"><select id="ks-object-type" aria-label="Tipo de objeto nuevo">'+options(Object.fromEntries(Object.entries(compatibleTypes).filter(([key])=>key!=='character')),'crystal')+'</select><button id="ks-object-add" class="ks-btn">＋ Agregar objeto</button></div></section><button id="ks-scene-bases" class="ks-btn">Cambiar base de juego</button><p class="ks-tip">Tus cambios se guardan en game-config.js y se pueden deshacer. Aplicar reinicia la vista del juego.</p>';
  const apply=next=>{if(studio.busy||!studio.cloudReady)return;try{const files=studio.validFiles({...studio.files,'game-config.js':StudioKits.configFile(mapNormalise(next))});studio.checkpoint();studio.files=files;}catch(e){const note=document.getElementById('k3d-zone-message');if(note)note.textContent='No se pudo aplicar: '+e.message;return;}studio.changed();studio.refreshAll();studio.lock(false);};
  el.querySelectorAll('[data-light]').forEach(b=>b.onclick=()=>apply({...cfg,lighting:b.dataset.light}));
  el.querySelector('#ks-scene-apply').onclick=()=>{const next={...cfg};el.querySelectorAll('[data-scene]').forEach(x=>next[x.dataset.scene]=x.type==='number'?Number(x.value):x.value);if(zone){next.zones=cfg.zones.map((item,i)=>i===zone-1?{...item,theme:next.theme}:item);next.theme=cfg.theme;}apply(next);};
  el.querySelectorAll('[data-object]').forEach(b=>b.onclick=()=>{studio.selectedSceneObject=b.dataset.object;window.Studio3D.renderEditor(studio,el,cfg);if(el.querySelector('#k3d-manual'))el.querySelector('#k3d-manual').open=true;document.getElementById('ks-frame')?.contentWindow?.postMessage({type:'krueka-scene-highlight',id:b.dataset.object},'*');});
  if(selected){
    el.querySelector('#ks-object-apply').onclick=()=>{const changed={...selected};el.querySelectorAll('[data-object-field]').forEach(x=>changed[x.dataset.objectField]=x.type==='number'?Number(x.value):x.value);apply({...cfg,objects:cfg.objects.map(o=>o.id===selected.id?changed:o)});};
    el.querySelector('#ks-object-remove').onclick=()=>apply({...cfg,objects:cfg.objects.filter(o=>o.id!==selected.id)});
    el.querySelector('#ks-object-copy').onclick=()=>add({...selected,x:Math.min(10,selected.x+1.5),label:selected.label+' copia'});
  }
  function add(source){if(objects.length>=48)return;const object={id:'o-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6),type:'crystal',label:'Objeto nuevo',x:0,z:0,size:1,height:1.5,color:'#67e8f9',...source,zone};object.id='o-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6);studio.selectedSceneObject=object.id;apply({...cfg,objects:[...cfg.objects,object]});}
  el.querySelector('#ks-object-add').onclick=()=>add({type:el.querySelector('#ks-object-type').value,label:types[el.querySelector('#ks-object-type').value]+' nuevo'});
  for(const id of ['ks-object-add','ks-object-copy']){const b=el.querySelector('#'+id);if(b){b.dataset.limitReached=String(objects.length>=48);b.disabled=studio.busy||!studio.cloudReady||objects.length>=48;}}
  el.querySelector('#ks-scene-bases').onclick=()=>studio.showKits();
}
window.Studio3D={normalise:mapNormalise,layout:worldLayout,create,renderEditor,piecePreview,avatarProfiles,previewFiles};
StudioKits.catalog.unshift({id:'explore3d',icon:'🧊',title:'Exploradores 3D',tag:'Mundos, luces y objetos',description:'Construí una escena 3D, explorá y abrí el portal.',challenge:'Compará dos luces, mové un obstáculo y explicá cómo cambia el recorrido.'});
const originalCreate=StudioKits.create.bind(StudioKits),originalArt=StudioKits.art.bind(StudioKits);
const originalConfig=StudioKits.configFile.bind(StudioKits);
StudioKits.configFile=function(cfg){
 const pretty=originalConfig(cfg);
 if(cfg?.kind!=='explore3d'||pretty.length<70000)return pretty;
 return '/* Mapa 3D. Editá las zonas y sus piezas en el taller. */\nwindow.KRUEKA_GAME = '+JSON.stringify(cfg)+';\n';
};
StudioKits.create=id=>id==='explore3d'?create():originalCreate(id);
StudioKits.art=id=>id==='explore3d'?'<svg viewBox="0 0 190 65" role="img" aria-label="Mundo 3D" xmlns="http://www.w3.org/2000/svg"><path d="M15 46L95 9l80 37-80 18z" fill="#243f5f"/><path d="M50 28l15-9 15 9v21l-15 9-15-9z" fill="#a5b4fc"/><path d="M65 19v39m-15-30l15 9 15-9" stroke="#e0e7ff" fill="none"/><path d="M119 17l9-14 9 14-9 17z" fill="#67e8f9"/><path d="M115 45h31" stroke="#67e8f9" stroke-width="3"/><path d="M32 46l61 15 62-15" stroke="#4bbde2" fill="none"/></svg>':originalArt(id);
})();
