/* Krueka | Escena 3D educativa original (WebGL nativo).
 * Sin CDN/iframes ni tokens. Órbitas, geometría iluminada y controles suaves.
 * Carga diferida, pausa fuera de pantalla y alternativa CSS en equipos sin WebGL.
 */
(function(){
  'use strict';
  var host=document.getElementById('kx-ai-stage');
  var canvas=document.getElementById('kx-ai-canvas');
  if(!host||!canvas)return;
  var reduceMotion=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var reducedData=!!(navigator.connection&&navigator.connection.saveData);
  var frame=0,running=false,inView=false,ready=false,gl=null,angle=0,mouseX=0,mouseY=0;
  var prog,attrPos,attrNormal,uniforms,geometry={},drawables=[],viewportW=1,viewportH=1;
  function fallback(){
    running=false;if(frame)cancelAnimationFrame(frame);
    host.dataset.renderMode='fallback';host.classList.remove('kx-stage-ready');
    if(gl){try{gl.deleteProgram(prog);}catch(_){}}
  }
  function shader(type,src){
    var sh=gl.createShader(type);gl.shaderSource(sh,src);gl.compileShader(sh);
    if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS)){var reason=gl.getShaderInfoLog(sh);gl.deleteShader(sh);throw Error('Error WebGL shader: '+reason);}
    return sh;
  }
  function buildShader(){
    var vert=shader(gl.VERTEX_SHADER, [
      'attribute vec3 aPosition;','attribute vec3 aNormal;',
      'uniform mat4 uMvp;','uniform mat4 uModel;',
      'varying vec3 vNormal;','varying vec3 vWorld;',
      'void main(){',' vec4 world=uModel*vec4(aPosition,1.0);',
      ' vWorld=world.xyz;vNormal=normalize(mat3(uModel)*aNormal);',
      ' gl_Position=uMvp*vec4(aPosition,1.0);','}'
    ].join('\n'));
    var frag=shader(gl.FRAGMENT_SHADER,[
      'precision mediump float;','varying vec3 vNormal;','varying vec3 vWorld;',
      'uniform vec3 uColor;','uniform float uGlow;','uniform float uAlpha;',
      'void main(){',' vec3 n=normalize(vNormal);','vec3 light=normalize(vec3(-0.5,0.8,1.6));',
      'float diff=max(dot(n,light),0.0);','float rim=pow(1.0-max(dot(n,normalize(vec3(0.0,0.0,1.0))),0.0),2.3);',
      'vec3 color=uColor*(0.43+diff*0.58)+vec3(0.76,0.90,1.0)*rim*0.22+uColor*uGlow;',
      'gl_FragColor=vec4(min(color,vec3(1.0)),uAlpha);','}'
    ].join('\n'));
    prog=gl.createProgram();gl.attachShader(prog,vert);gl.attachShader(prog,frag);
    gl.linkProgram(prog);
    if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw Error('Error al enlazar WebGL');
    gl.deleteShader(vert);gl.deleteShader(frag);gl.useProgram(prog);
    attrPos=gl.getAttribLocation(prog,'aPosition');attrNormal=gl.getAttribLocation(prog,'aNormal');
    uniforms={mvp:gl.getUniformLocation(prog,'uMvp'),model:gl.getUniformLocation(prog,'uModel'),
      color:gl.getUniformLocation(prog,'uColor'),glow:gl.getUniformLocation(prog,'uGlow'),alpha:gl.getUniformLocation(prog,'uAlpha')};
  }
  function identity(){return [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];}
  function product(a,b){var m=new Float32Array(16);for(var c=0;c<4;c++)for(var r=0;r<4;r++){
    var s=0;for(var k=0;k<4;k++)s+=a[k*4+r]*b[c*4+k];m[c*4+r]=s;
  }return m;}
  function translate(x,y,z){var m=identity();m[12]=x;m[13]=y;m[14]=z;return m;}
  function scale(x,y,z){var m=identity();m[0]=x;m[5]=y;m[10]=z;return m;}
  function rotateX(a){var m=identity(),c=Math.cos(a),s=Math.sin(a);m[5]=c;m[6]=s;m[9]=-s;m[10]=c;return m;}
  function rotateY(a){var m=identity(),c=Math.cos(a),s=Math.sin(a);m[0]=c;m[2]=-s;m[8]=s;m[10]=c;return m;}
  function rotateZ(a){var m=identity(),c=Math.cos(a),s=Math.sin(a);m[0]=c;m[1]=s;m[4]=-s;m[5]=c;return m;}
  function perspective(fov,aspect,near,far){
    var f=1/Math.tan(fov/2),o=new Float32Array(16);
    o[0]=f/aspect;o[5]=f;o[10]=(far+near)/(near-far);o[11]=-1;o[14]=2*far*near/(near-far);return o;
  }
  function makeMesh(positions,normals,indices){
    var mesh={count:indices.length};
    mesh.position=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,mesh.position);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(positions),gl.STATIC_DRAW);
    mesh.normal=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,mesh.normal);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(normals),gl.STATIC_DRAW);
    mesh.index=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,mesh.index);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
    return mesh;
  }
  function sphere(rows,cols){
    var p=[],n=[],ii=[];
    for(var j=0;j<=rows;j++){var v=j/rows,phi=v*Math.PI;
      for(var i=0;i<=cols;i++){var theta=i/cols*2*Math.PI;
        var x=Math.sin(phi)*Math.cos(theta),y=Math.cos(phi),z=Math.sin(phi)*Math.sin(theta);
        p.push(x,y,z);n.push(x,y,z);
      }
    }
    for(var y=0;y<rows;y++)for(var x=0;x<cols;x++){var a=y*(cols+1)+x,b=a+cols+1;ii.push(a,a+1,b,a+1,b+1,b);}
    return makeMesh(p,n,ii);
  }
  function ring(R,r,segments,tube){
    var p=[],n=[],ii=[];
    for(var s=0;s<=segments;s++){var u=s/segments*2*Math.PI,cu=Math.cos(u),su=Math.sin(u);
      for(var t=0;t<=tube;t++){var v=t/tube*2*Math.PI,cv=Math.cos(v),sv=Math.sin(v);
        var nx=cu*cv,ny=sv,nz=su*cv;
        p.push((R+r*cv)*cu,r*sv,(R+r*cv)*su);n.push(nx,ny,nz);
      }
    }
    for(var k=0;k<segments;k++)for(var j=0;j<tube;j++){var a=k*(tube+1)+j,b=a+tube+1;ii.push(a,b,a+1,a+1,b,b+1);}
    return makeMesh(p,n,ii);
  }
  function cube(){
    var p=[],n=[],i=[],faces=[
      [[0,0,1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]],
      [[0,0,-1],[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1]],
      [[0,1,0],[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1]],
      [[0,-1,0],[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1]],
      [[1,0,0],[1,-1,1],[1,-1,-1],[1,1,-1],[1,1,1]],
      [[-1,0,0],[-1,-1,-1],[-1,-1,1],[-1,1,1],[-1,1,-1]]
    ];
    faces.forEach(function(f){
      var off=p.length/3;for(var j=1;j<=4;j++){p.push.apply(p,f[j]);n.push.apply(n,f[0]);}
      i.push(off,off+1,off+2,off,off+2,off+3);
    });
    return makeMesh(p,n,i);
  }
  function renderMesh(mesh,model,color,glow,alpha,vp){
    if(alpha<1){gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);}
    else{gl.disable(gl.BLEND);gl.depthMask(true);}
    gl.bindBuffer(gl.ARRAY_BUFFER,mesh.position);gl.enableVertexAttribArray(attrPos);gl.vertexAttribPointer(attrPos,3,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ARRAY_BUFFER,mesh.normal);gl.enableVertexAttribArray(attrNormal);gl.vertexAttribPointer(attrNormal,3,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,mesh.index);
    gl.uniformMatrix4fv(uniforms.model,false,new Float32Array(model));
    gl.uniformMatrix4fv(uniforms.mvp,false,product(vp,model));
    gl.uniform3fv(uniforms.color,new Float32Array(color));gl.uniform1f(uniforms.glow,glow||0);
    gl.uniform1f(uniforms.alpha,alpha===undefined?1:alpha);
    gl.drawElements(gl.TRIANGLES,mesh.count,gl.UNSIGNED_SHORT,0);
  }
  function model(t,rX,rY,rZ,sX,sY,sZ){
    return product(translate(t[0],t[1],t[2]),
      product(rotateY(rY),product(rotateX(rX),product(rotateZ(rZ),scale(sX,sY,sZ)))));
  }
  function resize(){
    var rect=canvas.getBoundingClientRect();
    var dpr=Math.min(window.devicePixelRatio||1,reducedData?1:1.5);
    var w=Math.max(2,Math.round(rect.width*dpr)),h=Math.max(2,Math.round(rect.height*dpr));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    viewportW=w;viewportH=h;
    if(gl)gl.viewport(0,0,w,h);
  }
  function draw(){
    if(!gl)return;
    resize();gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.enable(gl.CULL_FACE);
    var w=canvas.getBoundingClientRect().width,wide=w>680;
    var zoom=wide?8.75:w>380?10.1:11.1;
    var projection=perspective((wide?42:47)*Math.PI/180,viewportW/viewportH,.1,70);
    var view=product(translate(0,0,-zoom),product(rotateX(-.11+mouseY*.08),rotateY(.28+mouseX*.23)));
    var vp=product(projection,view),t=angle;
    // 3D educativa: núcleo de IA rodeado de órbitas y módulos de aprendizaje.
    renderMesh(geometry.sphere,model([0,0,0],0,t*.17,0,1.0,1.0,1.0),[.18,.36,.85],.07,1,vp);
    renderMesh(geometry.sphere,model([-.14,.26,.56],0,t*.35,0,.57,.57,.57),[.24,.77,.95],.11,.65,vp);
    // Esfera interna cálida: inspiración + conexión humana.
    renderMesh(geometry.sphere,model([.08,-.10,.70],t*.28,t*.4,0,.33,.33,.33),[.98,.66,.47],.06,1,vp);
    var rings=[
      {rotation:[.35+t*.12,t*.16,.33],color:[.25,.65,.97],R:1.88},
      {rotation:[1.12+t*.09,-.5+t*.13,.5],color:[.98,.53,.38],R:2.15},
      {rotation:[-.72+t*.11,.8-t*.16,-.25],color:[.55,.43,.91],R:2.43}
    ];
    rings.forEach(function(r,k){
      renderMesh(geometry.torus,model([0,0,0],r.rotation[0],r.rotation[1],r.rotation[2],r.R,r.R,r.R),
        r.color,.06,1,vp);
    });
    // Cuerpos sólidos de conocimiento: cubos y prisma como sistemas que se interconectan.
    var parts=[
      {radius:2.85,phase:0,level:.44,color:[.24,.61,.94],size:.43},
      {radius:2.90,phase:2.28,level:-.15,color:[.99,.58,.37],size:.47},
      {radius:2.85,phase:4.05,level:.18,color:[.55,.49,.93],size:.40},
      {radius:3.14,phase:5.25,level:-.66,color:[.32,.81,.77],size:.28}
    ];
    parts.forEach(function(v,i){
      var a=v.phase+t*(i%2?-.22:.20),x=Math.cos(a)*v.radius,z=Math.sin(a)*v.radius*.57,y=v.level+Math.sin(a*1.35+t*.35)*.20;
      renderMesh(geometry.cube,model([x,y,z],.22+t*.34,.4+t*(i%2?-0.47:.42),.11+t*.22,v.size,v.size,v.size),
        v.color,.05,1,vp);
    });
    // Nodos luminosos de una red de conocimiento.
    for(var i=0;i<13;i++){
      var a=i*(2*Math.PI/13)+t*.11,r=3.05+(i%3)*.21,y=Math.sin(a*1.7)*1.58,z=Math.cos(a*.8)*.64;
      var s=.062+(i%4)*.019;
      renderMesh(geometry.smallSphere,model([Math.cos(a)*r,y,z],0,0,0,s,s,s),
        i%4===0?[.99,.61,.43]:i%3===0?[.45,.77,.87]:[.37,.49,.91],.18,1,vp);
    }
    gl.disable(gl.BLEND);gl.depthMask(true);
    if(!ready){ready=true;host.classList.add('kx-stage-ready');host.dataset.renderMode='webgl';}
  }
  function tick(){
    if(!running)return;
    angle+=(reducedData?.002:.004);
    draw();
    frame=window.requestAnimationFrame(tick);
  }
  function start(){
    if(!gl||running||!inView)return;
    if(reduceMotion){draw();return;}
    running=true;frame=window.requestAnimationFrame(tick);
  }
  function stop(){running=false;if(frame)cancelAnimationFrame(frame);frame=0;}
  function setup(){
    try{
      gl=canvas.getContext('webgl',{alpha:true,antialias:!reducedData,powerPreference:'low-power',premultipliedAlpha:false,depth:true,stencil:false})
        ||canvas.getContext('experimental-webgl',{alpha:true,antialias:false,powerPreference:'low-power'});
      if(!gl){fallback();return;}
      buildShader();
      geometry.sphere=sphere(21,32);geometry.smallSphere=sphere(9,12);
      geometry.torus=ring(1,.021,70,7);geometry.cube=cube();
      draw();start();
    }catch(e){fallback();}
  }
  canvas.addEventListener('webglcontextlost',function(event){event.preventDefault();stop();host.dataset.renderMode='fallback';host.classList.remove('kx-stage-ready');});
  canvas.addEventListener('webglcontextrestored',function(){ready=false;setup();});
  if(!reduceMotion){
    host.addEventListener('pointermove',function(e){
      if(e.pointerType==='touch')return;
      var rect=host.getBoundingClientRect();
      mouseX=Math.max(-1,Math.min(1,((e.clientX-rect.left)/rect.width-.5)*2));
      mouseY=Math.max(-1,Math.min(1,((e.clientY-rect.top)/rect.height-.5)*2));
    },{passive:true});
    host.addEventListener('pointerleave',function(){mouseX=0;mouseY=0;},{passive:true});
  }
  if('IntersectionObserver' in window){
    var observer=new IntersectionObserver(function(entries){
      inView=!!entries[0].isIntersecting&&!document.hidden;
      if(inView)start();else stop();
    },{threshold:.03});
    observer.observe(host);
  }else inView=true;
  document.addEventListener('visibilitychange',function(){
    if(document.hidden)stop();
    else{inView=true;start();}
  });
  window.addEventListener('resize',function(){if(gl){resize();if(reduceMotion)draw();}},{passive:true});
  // Esperar a que el primer texto esté visible antes de inicializar WebGL.
  if('requestIdleCallback' in window){
    requestIdleCallback(setup,{timeout:1200});
  }else window.setTimeout(setup,150);
})();
