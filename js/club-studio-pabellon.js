// Geometría y cámaras originales. La misma escena se guarda dentro de cada proyecto.
(function () {
'use strict';
const game = 'pabellon-juego', film = 'pabellon-cine';
const kits = [
 {id:game,title:'El pabellón de las semillas',group:'juegos',icon:'🌱',description:'Recorré el jardín en primera persona y reuní tres semillas de luz.'},
 {id:film,title:'Vuelo sobre el jardín',group:'animaciones',icon:'🎬',description:'Dirigí tres planos de cámara y animá el vuelo de un ave de papel.'}
];
function defaults(id) {
 return {kind:id,title:kits.find(k=>k.id===id).title,light:'tarde',finish:'jade',shots:['terraza','vuelo','planetario'],seconds:15,wing:'oro',seeds:3};
}
const htmlBody = `<main><canvas id="vista" tabindex="0" aria-label="Escenario tridimensional del pabellón"></canvas>
<header><small id="tipo"></small><h1 id="titulo"></h1><p id="detalle"></p></header>
<div class="tools"><label>Luz <select id="luz"><option value="dia">Día</option><option value="tarde">Atardecer</option><option value="noche">Noche</option></select></label></div>
<div class="bottom"><div class="strip"><button id="accion"></button><button id="reinicio" hidden>Reiniciar</button><output id="estado" aria-live="polite"></output></div>
<div id="cine" hidden><label for="tiempo">Tiempo</label><input id="tiempo" type="range" min="0" step="0.05" value="0"><span id="reloj"></span></div>
<div id="mover" hidden><button data-key="ArrowLeft" aria-label="Girar a la izquierda">↶</button><button data-key="ArrowUp" aria-label="Avanzar">▲</button><button data-key="ArrowDown" aria-label="Retroceder">▼</button><button data-key="ArrowRight" aria-label="Girar a la derecha">↷</button></div></div></main>`;
const css = `*{box-sizing:border-box}html,body,main{margin:0;width:100%;height:100%;overflow:hidden}main{position:relative;background:#182c35;color:#fff9e8;font:16px/1.35 system-ui,sans-serif}canvas{display:block;width:100%;height:100%;touch-action:none}header{pointer-events:none;position:absolute;inset:0 0 auto;padding:clamp(14px,3vw,38px);padding-right:118px;background:linear-gradient(#14212bd9,transparent);text-shadow:0 2px 9px #13242b}small{font-weight:750;letter-spacing:.16em;font-size:.74rem;color:#ffe1a0}h1{font:500 clamp(23px,4.5vw,52px)/1.06 Georgia,serif;margin:7px 0}header p{margin:5px 0;font-size:.94rem;max-width:42ch}.tools{position:absolute;top:12px;right:12px}.tools label{display:grid;gap:2px;background:#17302de8;padding:6px 9px;border-radius:10px;font-size:.76rem}select,button{font:inherit;color:inherit;border-radius:8px;border:1px solid #ffffff55;background:#193b37;padding:8px;cursor:pointer}button{min-height:42px;font-weight:650}button:hover,button:focus-visible{background:#316658}button:focus-visible,select:focus-visible,input:focus-visible{outline:3px solid #ffe6a1}.bottom{position:absolute;bottom:0;left:0;width:100%;padding:clamp(10px,2vw,26px);background:linear-gradient(transparent,#101e23ed);pointer-events:none}.bottom>*{pointer-events:auto}.strip,#cine,#mover{display:flex;align-items:center;gap:8px;flex-wrap:wrap;width:fit-content}#accion{background:#ffda86;color:#24342e;border-color:#ffe8b2;padding:8px 17px}#estado,#reloj{font-size:.89rem;text-shadow:0 1px 4px #000;background:#122923c9;padding:4px 8px;border-radius:5px}#cine,#mover{margin-top:8px}#tiempo{width:min(44vw,360px);accent-color:#ffda86}#mover button{min-width:44px;touch-action:none}body [hidden]{display:none!important}@media(max-height:370px){header p{display:none}.bottom{padding:6px}header{padding:7px 110px 7px 10px}h1{font-size:21px}}`;

// Esta función también corre en el HTML descargado, sin red ni sesión.
function scene() {
 const cfg=window.KRUEKA_GAME, movie=cfg.kind==='pabellon-cine', by=id=>document.getElementById(id);
 let canvas=by('vista'),ctx,drawGPU;
 const tau=Math.PI*2, clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), lerp=(a,b,t)=>a+(b-a)*t;
 const mix=(a,b,t)=>a.map((v,i)=>lerp(v,b[i],t)), rgb=s=>'rgb('+s.map(v=>Math.round(clamp(v,0,255))).join(',')+')';
 const color=h=>[16,8,0].map(k=>(parseInt(h,16)>>k)&255);
 const sub=(a,b)=>a.map((v,i)=>v-b[i]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 const unit=a=>a.map(v=>v/(Math.hypot(...a)||1)),dot=(a,b)=>a.reduce((sum,v,i)=>sum+v*b[i],0);
 const looks={dia:['86bdd1','e9eed1',1],tarde:['7eafbb','ffd29d',.93],noche:['182946','6b8094',.47]};
 const wood=['a96643','a05e3e','aa6b49','b6754f'], stone='e1cfa6', brass='e6ae58', metal='385e57';
 const accent=({jade:'398879',arcilla:'b8614b',azul:'527eab'})[cfg.finish]||'398879';
 const leaf=['407a66','598d68','83a575'], ink='26493f';
 let faces=[],fixed,elapsed=0,time=0,walk=false,running=false,last=0,dirty=true,w=0,h=0;
 let eye,forward,right,up,zoom,light,sky,haze,sorted,score=0;
 const seconds=clamp(Number(cfg.seconds)||15,6,45),required=clamp(Math.round(Number(cfg.seeds)||3),1,3);
 const seeds=[[-3.7,-2.7],[4,1.2],[-.6,5.1]].slice(0,required),taken=new Set(),keys=new Set(),obstacles=[];
 let player={x:0,z:-6.5,yaw:0,pitch:0},drag;
 function face(pts,col,glow=false){
  const n=unit(cross(sub(pts[1],pts[0]),sub(pts[2],pts[0])));
  faces.push({pts,col:color(col),shade:.70+.26*Math.abs(n[1])+.11*n[0]-.08*n[2],glow});
 }
 function box(x,y,z,a,b,c,col){
  const p=[];for(const dz of [-1,1])for(const dy of [0,1])for(const dx of [-1,1])p.push([x+dx*a/2,y+dy*b,z+dz*c/2]);
  for(const ids of [[0,1,3,2],[4,6,7,5],[0,2,6,4],[1,5,7,3],[2,3,7,6]])face(ids.map(i=>p[i]),col);
 }
 function rod(a,b,r,col,sides=6,tip=r){
  const axis=unit(sub(b,a)),side=unit(cross(axis,Math.abs(axis[1])>.9?[1,0,0]:[0,1,0])),other=cross(axis,side);
  const ring=(p,radius)=>Array.from({length:sides},(_,i)=>p.map((v,j)=>v+radius*(side[j]*Math.cos(tau*i/sides)+other[j]*Math.sin(tau*i/sides))));
  const low=ring(a,r),high=ring(b,tip);
  for(let i=0;i<sides;i++){const j=(i+1)%sides;face([low[i],low[j],high[j],high[i]],col);}
  if(tip>0)face(high,col);
 }
 function shade(x,z,rx,rz){
  const pts=Array.from({length:12},(_,i)=>[x+rx*Math.cos(tau*i/12),.025,z+rz*Math.sin(tau*i/12)]);
  face(pts,'8f694c');
 }
 function plant(x,z,scale){
  const s=scale;shade(x,z,.6*s,.48*s);
  rod([x,0,z],[x,.62*s,z],.32*s,'ae7256',8,.46*s);
  for(let i=0;i<7;i++){
   const a=i*2.39,dx=Math.cos(a)*s,dz=Math.sin(a)*s,y=(1.25+i%3*.27)*s;
   const base=[x,.55*s,z],tip=[x+dx*.72,y,z+dz*.72],mid=[x+.32*dx,y-.16*s,z+.32*dz];
   const l=[mid[0]-dz*.19,mid[1]-.13*s,mid[2]+dx*.19],r=[mid[0]+dz*.19,mid[1]-.13*s,mid[2]-dx*.19];
   face([base,l,tip,mid],leaf[i%3]);face([base,mid,tip,r],leaf[(i+1)%3]);
  }
  obstacles.push([x,z,.48*s,.48*s]);
 }
 function bench(x,z){
  shade(x,z,1.55,.58);
  for(const dx of [-.96,.96])box(x+dx,.02,z,.16,.47,.69,metal);
  for(let i=0;i<4;i++)box(x,.48,z-.3+i*.2,2.65,.12,.17,wood[i]);
  box(x,.66,z+.43,2.65,.45,.12,accent);obstacles.push([x,z,1.4,.55]);
 }
 // La plataforma se divide en baldosas para resolver la profundidad al caminar.
 for(let i=-4;i<4;i++)for(let j=-5;j<6;j++){
  const x=i*2,z=j*1.5;
  face([[x,0,z],[x+1.99,0,z],[x+1.99,0,z+1.49],[x,0,z+1.49]],wood[Math.abs(i*13+j*17)%4]);
 }
 for(let i=-4;i<4;i++)for(const z of [-7.5,9])face([[i*2,-.55,z],[i*2+2,-.55,z],[i*2+2,0,z],[i*2,0,z]],'8a634b');
 for(let j=-5;j<6;j++)for(const x of [-8,8])face([[x,-.55,j*1.5],[x,-.55,(j+1)*1.5],[x,0,(j+1)*1.5],[x,0,j*1.5]],'8a634b');
 const floorEnd=faces.length;
 // Tres arcos de madera laminada, con un lucernario abierto al cielo.
 for(const z of [-4,1,6]){
  for(const x of [-6,6]){
   box(x,0,z,.29,3.1,.38,stone);box(x,0,z,.49,.24,.55,metal);
  }
  const arch=i=>[6*Math.cos(Math.PI*i/12),3+3.3*Math.sin(Math.PI*i/12),z];
  for(let i=0;i<12;i++)rod(arch(i),arch(i+1),.16, i%2?'c99564':'dca976',5);
 }
 for(const x of [-5.6,-3.8,0,3.8,5.6]){
  const y=3+3.3*Math.sqrt(1-(x/6)**2);
  box(x,y,-.1,.14,.12,12.9,metal);
 }
 for(const x of [-7.6,7.6]){
  for(let z=-6;z<=8;z+=2)box(x,0,z,.12,.9,.12,metal);
  box(x,.87,.7,.13,.11,15,stone);
 }
 bench(-4.7,2.7);bench(4.45,4.15);
 for(const p of [[-5.7,-3,1.45],[5.5,-2.8,1.8],[-5.8,5.8,1.7],[5.8,6.8,1.3],[-2.8,6.6,1]])plant(...p);
 // Planetario de latón, con anillos inclinados alrededor de la esfera.
 shade(0,3,1.55,1);rod([0,0,3],[0,.32,3],1.18,stone,12);
 rod([0,.32,3],[0,1.36,3],.55,accent,10,.38);
 for(const angle of [-.67,.45]){
  const point=a=>[1.14*Math.cos(a),2.05+1.14*Math.sin(a)*Math.cos(angle),3+1.14*Math.sin(a)*Math.sin(angle)];
  for(let i=0;i<20;i++)rod(point(tau*i/20),point(tau*(i+1)/20),.045,brass,4);
 }
 rod([0,1.58,3],[0,2.07,3],.02,accent,9,.48);
 rod([0,2.07,3],[0,2.54,3],.48,accent,9,.02);obstacles.push([0,3,1.28,1.28]);
 // Islas distantes y cipreses: igual geometría desde cualquier ángulo.
 for(let i=0;i<24;i++){
  const a=i*tau/24,r=27+(i*7%11),x=r*Math.sin(a),z=r*Math.cos(a),y=-2+i%4;
  rod([x,-5,z],[x,y,z],5+i%4,'719683',7,.4);
  for(let j=0;j<3;j++)rod([x+j-1,y-.8,z],[x+j-1,y+1.7+j*.35,z],.55,leaf[(i+j)%3],5,0);
 }
 // Una biblioteca baja, lámparas colgantes y macizos enmarcan el planetario.
 for(const x of [-3.7,3.7]){
  box(x,0,7.4,2.75,1.65,.18,ink);
  for(const dx of [-1.35,1.35])box(x+dx,.05,7.13,.14,1.72,.56,wood[0]);
  for(const y of [.16,.88,1.64])box(x,y,7.12,2.83,.095,.63,stone);
  const jackets=['b06b4f','e2b45f','3e7774','e4d4a6','577794','986950'];
  for(let j=0;j<2;j++)for(let i=0;i<10;i++)box(x-1.16+i*.233,.26+j*.72,7.06,.16,.36+((i*3+j)%5)*.065,.35,jackets[(i+j*3)%6]);
  obstacles.push([x,7.2,1.49,.49]);
 }
 for(const z of [-3.8,1.1,5.8])for(const x of [-3.8,3.8]){
  rod([x,5.45,z],[x,3.83,z],.025,metal,4);
  rod([x,3.83,z],[x,3.45,z],.075,brass,8,.4);
  const ring=Array.from({length:8},(_,i)=>[x+.385*Math.sin(i*tau/8),3.447,z+.385*Math.cos(i*tau/8)]);
  face(ring,'ffe3a5',true);
 }
 for(const x of [-6.8,6.8]){
  box(x,.02,.5,.75,.46,5.6,stone);obstacles.push([x,.5,.48,2.9]);
  for(let i=0;i<14;i++){
   const z=-2+i*.38,dx=Math.sin(i*5)*.22;
   rod([x+dx,.47,z],[x+dx,.85+i%3*.13,z],.018,metal,4);
   rod([x+dx,.81+i%3*.13,z],[x+dx,.98+i%3*.13,z],.12,['efb949','dc896f','f6db9c'][i%3],5,.045);
  }
 }
 fixed=faces;faces=[];
 const groups=[[],[],[]];
 fixed.forEach((f,i)=>{const p=f.pts[0];groups[Math.max(Math.abs(p[0]),Math.abs(p[2]))>17?0:i<floorEnd?1:2].push(f);});
 // Dos pasadas: la primera proyecta las sombras del sol sobre el pabellón.
 // La segunda resuelve la profundidad de cada píxel desde la cámara del alumno.
 function gpuRenderer(gl){
  function program(vertex,fragment){
   const prog=gl.createProgram();
   for(const [type,source] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]]){
    const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error('Sombreado no disponible');
    gl.attachShader(prog,shader);
   }
   gl.linkProgram(prog);if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw Error('Programa de escena no disponible');return prog;
  }
  const sunlight=`uniform float night; vec3 sunSpace(vec3 p){
   vec3 ray=normalize(vec3(-.62,night>.98?1.4:.76,-.45));vec3 side=normalize(cross(vec3(0.,1.,0.),ray));
   return vec3(dot(p,side)/15.,dot(p,cross(ray,side))/15.,-dot(p,ray)/30.);}`;
  const depth=program('attribute vec3 pos;'+sunlight+'void main(){gl_Position=vec4(sunSpace(pos),1.);}',
   'precision mediump float;void main(){gl_FragColor=vec4(vec3(gl_FragCoord.z),1.);}');
  const material=program(`attribute vec3 pos;attribute vec3 tint;attribute float shade;
   uniform vec3 eye,side,up,front;uniform vec2 scale;varying vec3 world,col,shadow;varying float dist,grain;`+sunlight+`
   void main(){vec3 d=pos-eye;float z=dot(d,front);gl_Position=vec4(dot(d,side)*scale.x,dot(d,up)*scale.y-.02*z,z*1.003-.31,z);
    world=pos;col=tint;grain=shade;dist=z;shadow=sunSpace(pos)*.5+.5;}`,
   `precision mediump float;varying vec3 world,col,shadow;varying float dist,grain;
    uniform vec3 fogColor;uniform float night;uniform sampler2D shadowMap;
    void main(){float visibility=1.;
     if(all(greaterThan(shadow,vec3(0.)))&&all(lessThan(shadow,vec3(1.)))){
      for(int i=-1;i<=1;i++){for(int j=-1;j<=1;j++){
       float depth=texture2D(shadowMap,shadow.xy+vec2(float(i),float(j))*.0014).r;
       visibility-=shadow.z-.0045>depth?.043:0.;}}}
     float pattern=1.;
     if(col.r>col.g*1.25&&col.g>col.b*1.15){
      float bands=sin(world.x*29.+2.*sin(world.z*2.3))+sin(world.x*83.+sin(world.z*3.));
      pattern+=.023*bands;}
     vec3 color=col*grain*pattern*(grain>1.02?1.:night*visibility);
     if(night<.6){vec2 lamp=vec2(abs(world.x)-3.8,mod(world.z+1.25,4.8)-2.4);
      color+=vec3(.22,.12,.035)*exp(-dot(lamp,lamp)*.65)*clamp((4.-world.y)/3.,0.,1.);}
     color=mix(color,fogColor,smoothstep(13.,58.,dist)*.74);
     gl_FragColor=vec4(color,1.);}`);
  const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1024,1024,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
  const target=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,target);
  gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);
  const zbuffer=gl.createRenderbuffer();gl.bindRenderbuffer(gl.RENDERBUFFER,zbuffer);
  gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,1024,1024);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,zbuffer);
  if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Sombras no disponibles');
  function pack(list){
   const out=[];for(const f of list)for(let i=1;i<f.pts.length-1;i++)for(const p of [f.pts[0],f.pts[i],f.pts[i+1]])out.push(...p,...f.col.map(c=>c/255),f.glow?1.1:f.shade);
   return new Float32Array(out);
  }
  const fixedBuffer=gl.createBuffer(),movingBuffer=gl.createBuffer(),layout=pack(fixed);
  gl.bindBuffer(gl.ARRAY_BUFFER,fixedBuffer);gl.bufferData(gl.ARRAY_BUFFER,layout,gl.STATIC_DRAW);
  function bindings(prog){
   const uniforms={};for(const key of ['eye','side','up','front','scale','fogColor','night','shadowMap'])uniforms[key]=gl.getUniformLocation(prog,key);
   const attrs=['pos','tint','shade'].map(key=>gl.getAttribLocation(prog,key));return {uniforms,attrs};
  }
  const sunLoc=bindings(depth),camLoc=bindings(material);
  function draw({attrs},buffer,count){gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
   attrs.forEach((loc,i)=>{if(loc<0)return;gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,i===2?1:3,gl.FLOAT,false,28,i*12);});
   gl.drawArrays(gl.TRIANGLES,0,count);
  }
  gl.enable(gl.DEPTH_TEST);
  return ()=>{
   const moving=pack(faces);gl.bindBuffer(gl.ARRAY_BUFFER,movingBuffer);gl.bufferData(gl.ARRAY_BUFFER,moving,gl.DYNAMIC_DRAW);
   function paint(loc){draw(loc,fixedBuffer,layout.length/7);draw(loc,movingBuffer,moving.length/7);}
   gl.bindTexture(gl.TEXTURE_2D,null);gl.bindFramebuffer(gl.FRAMEBUFFER,target);gl.viewport(0,0,1024,1024);
   gl.clearColor(1,1,1,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(depth);gl.uniform1f(sunLoc.uniforms.night,light);paint(sunLoc);
   gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,w,h);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
   gl.useProgram(material);const u=camLoc.uniforms;gl.uniform3fv(u.eye,eye);gl.uniform3fv(u.side,right);gl.uniform3fv(u.up,up);gl.uniform3fv(u.front,forward);
   gl.uniform2f(u.scale,2*zoom/w,2*zoom/h);gl.uniform3fv(u.fogColor,haze.map(c=>c/255));gl.uniform1f(u.night,light);
   gl.bindTexture(gl.TEXTURE_2D,texture);gl.uniform1i(u.shadowMap,0);paint(camLoc);
  };
 }

 try{const gl=canvas.getContext('webgl',{alpha:true,antialias:true});if(gl)drawGPU=gpuRenderer(gl);}
 catch(_e){const copy=canvas.cloneNode(false);canvas.replaceWith(copy);canvas=copy;}
 if(!drawGPU)ctx=canvas.getContext('2d',{alpha:false});
 function bird(t){
  const a=t*.55,x=2.9*Math.sin(a),z=.1+2.7*Math.cos(a),y=3.3+.32*Math.sin(a*2);
  const feather=({oro:'ffc351',coral:'ff8767',cielo:'89dbeb'})[cfg.wing]||'ffc351';
  const vertex=(side,height,length)=>[x+side*Math.sin(a)+length*Math.cos(a),y+height,z+side*Math.cos(a)-length*Math.sin(a)];
  const beak=vertex(0,.06,.55),tail=vertex(0,.12,-.56),breast=vertex(0,-.22,.08),spine=vertex(0,.13,.05);
  for(const side of [-1,1]){
   const elbow=vertex(side*.44,.17,-.08),tip=vertex(side*.98,.28+.34*Math.sin(t*4),-.42);
   face([beak,breast,elbow],feather);face([beak,elbow,spine],'ffe3a2');
   face([elbow,tip,tail],feather);face([elbow,tail,spine],'d38e42');
  }
 }
 function gem(x,z,t){
  const y=1+.15*Math.sin(t*2+x),ring=Array.from({length:5},(_,i)=>[x+.25*Math.sin(t+i*tau/5),y,z+.25*Math.cos(t+i*tau/5)]);
  for(let i=0;i<5;i++){const j=(i+1)%5;face([ring[i],ring[j],[x,y+.46,z]],i%2?'ffee9e':'ffbf53',true);face([ring[j],ring[i],[x,y-.37,z]],'eba73f',true);}
 }
 function camera(pos,target){
  eye=pos;forward=unit(sub(target,pos));right=unit(cross([0,1,0],forward));up=cross(forward,right);
 }
 function shot(name,t){
  if(name==='vuelo'){
   const a=time*.55,x=2.9*Math.sin(a),z=.1+2.7*Math.cos(a);
   camera([x-2.3*Math.cos(a)-1.2,3.75,z+2.3*Math.sin(a)-2.3],[x,3.28,z]);
  }
  else if(name==='planetario')camera([3.25*Math.sin(.55+1.4*t),2.28,3-3.25*Math.cos(.55+1.4*t)],[0,1.97,3]);
  else camera([lerp(-9,-5,t),lerp(5.3,3.4,t),lerp(-12,-8,t)],[0,1.75,1.35]);
 }
 function project(poly){
  let pts=poly.pts.map(p=>{const d=sub(p,eye);return [dot(d,right),dot(d,up),dot(d,forward)];});
  if(pts.every(p=>p[2]<.18))return;
  if(pts.some(p=>p[2]<.18)){
   const clipped=[];let prev=pts[pts.length-1];
   for(const p of pts){if((prev[2]<.18)!==(p[2]<.18))clipped.push(mix(prev,p,(.18-prev[2])/(p[2]-prev[2])));if(p[2]>=.18)clipped.push(p);prev=p;}pts=clipped;
  }
  const xy=pts.map(p=>[w*.5+p[0]*zoom/p[2],h*.51-p[1]*zoom/p[2]]);
  if(xy.every(p=>p[0]<0)||xy.every(p=>p[0]>w)||xy.every(p=>p[1]<0)||xy.every(p=>p[1]>h))return;
  const depth=pts.reduce((n,p)=>n+p[2],0)/pts.length;
  const intensity=poly.glow?1:poly.shade*light;
  const fill=rgb(mix(poly.col.map(v=>v*intensity),haze,clamp((depth-13)/58,0,.73)));
  sorted.push({xy,depth,fill});
 }
 function render(){
  const scale=Math.min(window.devicePixelRatio||1,1.4,1150/Math.max(canvas.clientWidth,1));
  w=Math.max(1,Math.round(canvas.clientWidth*scale));h=Math.max(1,Math.round(canvas.clientHeight*scale));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
  zoom=Math.min(h*.95,w*1.03);
  const colors=looks[by('luz').value]||looks.tarde;sky=color(colors[0]);haze=color(colors[1]);light=colors[2];
  if(walk){const p=player;camera([p.x,1.65,p.z],[p.x+Math.sin(p.yaw),1.65+Math.tan(p.pitch),p.z+Math.cos(p.yaw)]);}
  else if(movie){const segment=Math.min(2,Math.floor(time/seconds*3));shot(cfg.shots[segment],clamp(time/seconds*3-segment,0,1));}
  else shot('terraza',.23);
  const horizon=h*.51+forward[1]*zoom;
  const t=movie?time:elapsed;faces=[];bird(t);
  if(!movie)seeds.forEach(([x,z],i)=>{if(!taken.has(i))gem(x,z,t);});
  const skyBackground='linear-gradient('+rgb(sky)+', '+rgb(haze)+' '+Math.round(clamp(horizon/h,.05,.92)*100)+'%, '+rgb(mix(haze,[67,107,99],.72))+')';
  const orbX=clamp(72-Math.atan2(forward[0],forward[2])*35,-25,125);
  canvas.style.background='radial-gradient(circle at '+orbX+'% 21%, #fff1c8 0 .65%, #ffe1a959 1.4%, transparent 10%), '+skyBackground;
  if(drawGPU){drawGPU();return;}
  const gradient=ctx.createLinearGradient(0,0,0,h);gradient.addColorStop(0,rgb(sky));gradient.addColorStop(clamp(horizon/h,.05,.92),rgb(haze));gradient.addColorStop(1,rgb(mix(haze,[67,107,99],.72)));
  ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
  sorted=[];
  // Dibujar primero el paisaje, después el suelo y al final los objetos cercanos.
  const layers=groups.map((group,i)=>{sorted=[];group.forEach(project);if(i===2)faces.forEach(project);return sorted.sort((a,b)=>b.depth-a.depth);});sorted=layers.flat();
  for(const p of sorted){ctx.beginPath();p.xy.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=p.fill;ctx.fill();}
 }
 function free(x,z){
  return Math.abs(x)<7.25&&z> -7.05&&z<8.25&&!obstacles.some(([ox,oz,rx,rz])=>Math.abs(x-ox)<rx+.16&&Math.abs(z-oz)<rz+.16);
 }
 function move(dt){
  const down=(...codes)=>codes.some(k=>keys.has(k))?1:0;
  player.yaw+=(down('ArrowRight','KeyD')-down('ArrowLeft','KeyA'))*dt*1.65;
  const step=(down('ArrowUp','KeyW')-down('ArrowDown','KeyS'))*dt*3.15;
  const x=player.x+Math.sin(player.yaw)*step,z=player.z+Math.cos(player.yaw)*step;
  if(free(x,player.z))player.x=x;if(free(player.x,z))player.z=z;
  seeds.forEach(([sx,sz],i)=>{if(!taken.has(i)&&Math.hypot(player.x-sx,player.z-sz)<1.1){taken.add(i);score=taken.size;status();}});
 }
 function status(){
  by('accion').textContent=movie?(running?'Pausar':time>=seconds?'Volver a ver':'Reproducir'):(walk?'Ver el pabellón':'Entrar al jardín');
  by('estado').textContent=movie?({terraza:'Plano general',vuelo:'Vuelo del ave',planetario:'Detalle del planetario'}[cfg.shots[Math.min(2,Math.floor(time/seconds*3))]]||'Plano general'):score===required?'¡Encontraste todas las semillas!':score+' de '+required+' semillas';
  by('mover').hidden=!walk;by('reinicio').hidden=movie||(!walk&&!score);
  by('detalle').textContent=movie?'Un cortometraje en tres planos.':walk?'Avanzá con ↑ y ↓. Girá con ← y → o arrastrá la vista.':'Encontrá las semillas doradas entre los arcos del invernadero.';
 }
 function updateClock(){
  by('tiempo').value=String(time);by('reloj').textContent=time.toFixed(1)+' / '+seconds+' s';
 }
 function reset(){
  time=0;running=false;score=0;taken.clear();keys.clear();player={x:0,z:-6.5,yaw:0,pitch:0};status();updateClock();dirty=true;
 }
 function toggle(){
  if(movie){if(time>=seconds)time=0;running=!running;}
  else{walk=!walk;keys.clear();if(walk)canvas.focus();}
  status();dirty=true;
 }
 by('titulo').textContent=cfg.title;document.title=cfg.title;
 by('tipo').textContent=movie?'ANIMACIÓN 3D':'EXPLORACIÓN 3D';
 by('luz').value=looks[cfg.light]?cfg.light:'tarde';by('luz').onchange=()=>{dirty=true;};
 by('cine').hidden=!movie;by('tiempo').max=String(seconds);
 by('tiempo').oninput=e=>{time=Number(e.target.value);running=false;updateClock();status();dirty=true;};
 by('accion').onclick=toggle;by('reinicio').onclick=reset;
 for(const b of by('mover').querySelectorAll('button')){
  b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.key);};
  b.onlostpointercapture=()=>keys.delete(b.dataset.key);
  b.onkeydown=e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();keys.add(b.dataset.key);}};
  b.onkeyup=()=>keys.delete(b.dataset.key);b.onblur=()=>keys.delete(b.dataset.key);
 }
 canvas.onpointerdown=e=>{if(walk){canvas.focus();canvas.setPointerCapture(e.pointerId);drag=[e.clientX,e.clientY];}};
 canvas.onpointermove=e=>{if(!drag)return;player.yaw+=(e.clientX-drag[0])*.007;player.pitch=clamp(player.pitch-(e.clientY-drag[1])*.006,-.75,.75);drag=[e.clientX,e.clientY];dirty=true;};
 canvas.onlostpointercapture=()=>{drag=null;};
 addEventListener('keydown',e=>{if(walk&&document.activeElement===canvas&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD'].includes(e.code)){e.preventDefault();keys.add(e.code);}});
 addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>keys.clear());
 addEventListener('resize',()=>{dirty=true;});
 document.addEventListener('visibilitychange',()=>{last=0;keys.clear();});
 addEventListener('message',e=>{if(e.source===parent&&e.data?.type==='krueka-preview-play'&&!(walk||running))toggle();});
 const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 function frame(now){
  if(!last||now-last>=33){
   const dt=last?Math.min((now-last)/1000,.1):0;last=now;
   if(walk&&keys.size){move(dt);dirty=true;}
   if(!movie&&!reduce){elapsed+=dt;dirty=true;}
   if(movie&&running){
    const prev=Math.floor(time/seconds*3);time=Math.min(seconds,time+dt);
    if(time===seconds)running=false;
    if(prev!==Math.floor(time/seconds*3)||!running)status();
    updateClock();dirty=true;
   }
   if(dirty){render();dirty=false;}
  }
  requestAnimationFrame(frame);
 }
 reset();render();requestAnimationFrame(frame);
}
function project(id){
 const cfg=defaults(id);
 return {'index.html':'<!doctype html><html lang="es-PY"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pabellón 3D</title><link rel="stylesheet" href="style.css"></head><body>'+htmlBody+'<script src="game-config.js"></script><script src="game.js"></script></body></html>',
 'style.css':css,'game.js':'('+scene.toString()+')();','game-config.js':window.StudioKits.configFile(cfg),'tipo-club.txt':kits.find(k=>k.id===id).group,
 'LEEME.md':'# '+cfg.title+'\n\n'+kits.find(k=>k.id===id).description+'\nPersonalizá la luz, los materiales y la escena en Mi creación. Guardá tu proyecto y compartilo con tu profe.'};
}
function editor(studio,el,cfg){
 const movie=cfg.kind===film,form=document.createElement('form');form.className='ks-settings';
 const heading=document.createElement('h2');heading.textContent=movie?'Dirigí tu cortometraje':'Diseñá tu exploración';el.replaceChildren(heading,form);
 const fields=document.createElement('div');fields.className='ks-fields';form.append(fields);
 function field(label,key,choices,value){
  const wrap=document.createElement('label');wrap.textContent=label;
  const input=document.createElement(choices?'select':'input');input.name=key;
  if(choices)for(const [id,name] of Object.entries(choices))input.add(new Option(name,id));
  else{input.maxLength=60;input.required=true;}
  input.value=String(value);wrap.append(input);fields.append(wrap);return input;
 }
 const title=field('Título de tu obra','title',null,cfg.title);
 const light=field('Luz inicial','light',{dia:'Día',tarde:'Atardecer',noche:'Noche'},cfg.light);
 const finish=field('Color del mobiliario','finish',{jade:'Verde jade',arcilla:'Terracota',azul:'Azul lago'},cfg.finish);
 const wing=field('Color del ave','wing',{oro:'Dorado',coral:'Coral',cielo:'Celeste'},cfg.wing);
 const shots=movie?cfg.shots.map((v,i)=>field('Plano '+(i+1),'plano'+i,{terraza:'Vista del pabellón',vuelo:'Seguir al ave',planetario:'Rodear el planetario'},v)):[];
 const length=movie?field('Duración','seconds',{9:'9 segundos',15:'15 segundos',24:'24 segundos',36:'36 segundos'},cfg.seconds):field('Semillas por encontrar','seeds',{1:'Una',2:'Dos',3:'Tres'},cfg.seeds);
 const apply=document.createElement('button');apply.className='ks-btn primary';apply.textContent='Aplicar y ver mi obra';form.append(apply);
 form.onsubmit=e=>{
  e.preventDefault();if(studio.busy||!studio.cloudReady)return;
  const next={...cfg,title:title.value.trim()||cfg.title,light:light.value,finish:finish.value,wing:wing.value};
  if(movie){next.seconds=Number(length.value);next.shots=shots.map(select=>select.value);}else next.seeds=Number(length.value);
  const files=studio.validFiles({...studio.files,'game-config.js':StudioKits.configFile(next)});
  studio.checkpoint();studio.files=files;studio.changed();studio.refreshAll();studio.playCurrent();
 };
}
if(document.body?.hasAttribute('data-pabellon')){
 const id=new URLSearchParams(location.search).get('modo')==='cine'?film:game;
 const style=document.createElement('style');style.textContent=css;document.head.append(style);
 document.body.insertAdjacentHTML('afterbegin',htmlBody);window.KRUEKA_GAME=defaults(id);scene();return;
}
if(!window.StudioKits||!window.StudioCreative||!window.StudioIA)return;
const create=StudioKits.create.bind(StudioKits),creator=StudioIA.renderCreator;
for(const k of kits){
 StudioKits.catalog.push({...k,tag:'PABELLÓN 3D',challenge:k.description});
 const path=StudioCreative.paths.find(p=>p.id===k.group);
 if(path){path.kits.unshift(k.id);path.first=k.id;path.text=k.description;}
}
StudioKits.create=id=>kits.some(k=>k.id===id)?project(id):create(id);
StudioIA.renderCreator=function(){
 const cfg=StudioKits.read(this.files),el=document.getElementById('ks-create');
 if(el&&kits.some(k=>k.id===cfg?.kind))return editor(this,el,cfg);
 return creator.apply(this,arguments);
};
})();
