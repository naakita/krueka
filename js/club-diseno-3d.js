/* Taller de bloques 3D del Club. Sin cuenta externa ni librerías de dibujo. */
const Taller3D = {
  modelo:null, proyectoId:null, capa:0, giro:0, color:'#2783de', borrando:false,
  temporizador:null, cola:Promise.resolve(),
  paleta:['#2783de','#46a171','#e7a33e','#e56458','#9b70d2','#f4d95c'],
  iniciar(){
    const anterior=Club.proyecto;
    Club.proyecto=function(){
      anterior.apply(this,arguments);
      if(!this.alumno||!this.lec)return;
      const caja=document.getElementById('club-box');if(!caja)return;
      const zona=document.createElement('section');zona.className='club-panel';zona.style.marginTop='16px';
      zona.innerHTML='<h2>🧊 Taller de diseño 3D</h2><p>Construí por capas, girá tu creación y explicá sus formas. Se guarda en Krueka para que el profe pueda revisarla.</p><button class="club-primary" type="button" onclick="Taller3D.abrir()">Crear en 3D</button>';
      caja.appendChild(zona);
    };
  },
  clave(){return 'krueka-3d-v1:'+(Club.alumno.student_id||Club.alumno.id)+':'+Club.lec.id;},
  nuevo(){return {titulo:'Mi construcción 3D',bloques:[]};},
  validar(raw){
    if(!raw||typeof raw!=='object'||typeof raw.titulo!=='string'||raw.titulo.length>80||
      !Array.isArray(raw.bloques)||raw.bloques.length>256)throw new Error('El diseño no tiene el formato esperado.');
    const usados=new Set();
    const bloques=raw.bloques.map(b=>{
      if(!b||![b.x,b.y,b.z].every(n=>Number.isInteger(n)&&n>=0)||b.x>=8||b.y>=8||b.z>=4||
        !this.paleta.includes(b.color))throw new Error('Hay un bloque inválido.');
      const key=[b.x,b.y,b.z].join(',');if(usados.has(key))throw new Error('Hay bloques repetidos.');usados.add(key);
      return {x:b.x,y:b.y,z:b.z,color:b.color};
    });
    return {titulo:raw.titulo,bloques};
  },
  async abrir(){
    if(!Club.alumno||!Club.lec)return;
    await this.cola.catch(()=>{});
    const alumno=Club.alumno.student_id,leccion=Club.lec.id;
    const boton=document.querySelector('#club-box button[onclick="Taller3D.abrir()"]');if(boton)boton.disabled=true;
    let local=null,aviso='';
    try{local=localStorage.getItem(this.clave());this.modelo=local?this.validar(JSON.parse(local)):this.nuevo();}
    catch(_e){this.modelo=this.nuevo();}
    this.proyectoId=null;
    try{
      const acceso={p_student:alumno,p_device:deviceId()};
      const lista=await db.rpc('club_crea_listar',acceso);if(lista.error)throw lista.error;
      for(const item of (Array.isArray(lista.data)?lista.data:[]).filter(p=>p.type==='design')){
        const detalle=await db.rpc('club_crea_cargar',{...acceso,p_project:item.id});
        if(detalle.error)throw detalle.error;
        if(detalle.data?.content?.lesson_id!==leccion||!detalle.data?.content?.model)continue;
        this.proyectoId=detalle.data.id;
        const nube=this.validar(detalle.data.content.model);
        if(!local||JSON.stringify(this.modelo)===JSON.stringify(nube)||
          confirm('Hay un diseño en Krueka y otro en este equipo. ¿Abrir el de Krueka?')){
          this.modelo=nube;
          try{localStorage.setItem(this.clave(),JSON.stringify(nube));}catch(_e){}
          aviso='Diseño recuperado de Krueka. '+(detalle.data.review_note?'Observación del profe: '+detalle.data.review_note:'');
        }else aviso='Estás usando la copia de este equipo. Guardá para subirla a Krueka.';
        break;
      }
      if(!aviso)aviso='Empezá a construir: tu trabajo se guardará en Krueka.';
    }catch(_e){aviso='Sin conexión con Krueka. Descargá una copia antes de cerrar.';}
    if(boton)boton.disabled=false;
    if(!Club.alumno||Club.alumno.student_id!==alumno||!Club.lec||Club.lec.id!==leccion)return;
    const viejo=document.getElementById('t3d-panel');if(viejo)viejo.remove();
    const panel=document.createElement('div');panel.id='t3d-panel';
    panel.style.cssText='position:fixed;inset:0;z-index:102;background:var(--bg);color:var(--tx);overflow:auto;padding:16px';
    panel.innerHTML='<main style="max-width:1100px;margin:auto"><header style="display:flex;justify-content:space-between;align-items:center;gap:12px"><div><h1>🧊 Taller de diseño 3D</h1><p class="note">Coordenadas, capas, simetría y volumen. Construí una idea propia.</p></div><button class="btn sec" id="t3d-salir">Volver</button></header><div class="grid2"><section class="card"><label for="t3d-titulo">Nombre de tu diseño</label><input id="t3d-titulo" maxlength="80"><p>1. Elegí una capa y un color. 2. Tocá una casilla para colocar un bloque. 3. Girá la vista y comprobá tu diseño.</p><label for="t3d-capa">Altura: <span id="t3d-capa-txt">1</span> de 4</label><input id="t3d-capa" type="range" min="0" max="3" value="0"><div id="t3d-colores" style="display:flex;gap:7px;flex-wrap:wrap;margin:12px 0"></div><button class="btn sec sm" id="t3d-borrar">Borrar bloques: no</button> <button class="btn sec sm" id="t3d-girar">↻ Girar vista</button><p class="note">Un bloque de una capa alta necesita otro debajo. Al borrar una columna se quitan los bloques superiores.</p><div id="t3d-cuadricula" style="display:grid;grid-template-columns:repeat(8,minmax(28px,1fr));max-width:440px;gap:3px"></div><p id="t3d-estado" role="status" aria-live="polite"></p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sec" id="t3d-pista">💡 Pedir una pista</button><button class="btn" id="t3d-guardar">Guardar en Krueka</button><button class="btn sec" id="t3d-enviar">Enviar al profe</button><button class="btn sec sm" id="t3d-descargar">Descargar JSON</button></div></section><section class="card"><h2>Tu construcción</h2><canvas id="t3d-canvas" width="600" height="440" style="display:block;width:100%;max-width:600px;background:#f1f5f9;border-radius:12px" aria-label="Vista en perspectiva del diseño"></canvas><p class="note" id="t3d-contador"></p><p class="note">Esta vista se gira con el botón. Cada casilla representa una posición en el plano.</p></section></div></main>';
    document.body.appendChild(panel);
    panel.querySelector('#t3d-titulo').value=this.modelo.titulo;
    panel.querySelector('#t3d-salir').onclick=()=>this.cerrar();
    panel.querySelector('#t3d-titulo').oninput=e=>{this.modelo.titulo=e.target.value;this.guardar();};
    panel.querySelector('#t3d-capa').oninput=e=>{this.capa=Number(e.target.value);panel.querySelector('#t3d-capa-txt').textContent=this.capa+1;this.tablero();};
    panel.querySelector('#t3d-colores').innerHTML=this.paleta.map((c,i)=>'<button type="button" data-color="'+c+'" aria-label="Color '+(i+1)+'" style="width:38px;height:38px;border-radius:9px;border:2px solid var(--tx);background:'+c+'"></button>').join('');
    panel.querySelector('#t3d-colores').onclick=e=>{const b=e.target.closest('[data-color]');if(b){this.color=b.dataset.color;this.borrando=false;this.herramienta();}};
    panel.querySelector('#t3d-borrar').onclick=()=>{this.borrando=!this.borrando;this.herramienta();};
    panel.querySelector('#t3d-girar').onclick=()=>{this.giro=(this.giro+1)%4;this.dibujar();};
    panel.querySelector('#t3d-cuadricula').onclick=e=>{const b=e.target.closest('[data-x]');if(b)this.colocar(Number(b.dataset.x),Number(b.dataset.y));};
    panel.querySelector('#t3d-pista').onclick=()=>this.pista();
    panel.querySelector('#t3d-guardar').onclick=()=>this.guardarNube();
    panel.querySelector('#t3d-enviar').onclick=()=>this.entregar();
    panel.querySelector('#t3d-descargar').onclick=()=>this.descargar();
    this.capa=0;this.giro=0;this.borrando=false;this.herramienta();this.tablero();this.dibujar();this.estado(aviso);
  },
  herramienta(){
    const b=document.getElementById('t3d-borrar');if(b)b.textContent='Borrar bloques: '+(this.borrando?'sí':'no');
    document.querySelectorAll('#t3d-colores [data-color]').forEach(el=>el.style.outline=el.dataset.color===this.color&&!this.borrando?'3px solid var(--tx)':'none');
  },
  tablero(){
    const zona=document.getElementById('t3d-cuadricula');if(!zona||!this.modelo)return;
    zona.innerHTML=Array.from({length:64},(_,i)=>{
      const x=i%8,y=Math.floor(i/8),b=this.modelo.bloques.find(p=>p.x===x&&p.y===y&&p.z===this.capa);
      const alto=this.modelo.bloques.filter(p=>p.x===x&&p.y===y).length;
      return '<button type="button" data-x="'+x+'" data-y="'+y+'" aria-label="Columna '+(x+1)+', fila '+(y+1)+', '+alto+' bloques" style="height:42px;min-width:28px;border:1px solid var(--line);border-radius:5px;background:'+(b?b.color:'var(--soft)')+';color:var(--tx);cursor:pointer">'+(b?'■':alto?'·':'')+'</button>';
    }).join('');
  },
  colocar(x,y){
    const lista=this.modelo.bloques,indice=lista.findIndex(p=>p.x===x&&p.y===y&&p.z===this.capa);
    if(this.borrando){this.modelo.bloques=lista.filter(p=>p.x!==x||p.y!==y||p.z<this.capa);}
    else{
      if(this.capa>0&&!lista.some(p=>p.x===x&&p.y===y&&p.z===this.capa-1)){
        this.estado('Primero colocá un bloque debajo, en la capa '+this.capa+'.');return;
      }
      if(indice>=0)lista[indice].color=this.color;
      else lista.push({x,y,z:this.capa,color:this.color});
    }
    this.guardar();this.tablero();this.dibujar();
  },
  rotar(x,y,giro){
    for(let i=0;i<giro;i++)[x,y]=[7-y,x];
    return [x,y];
  },
  dibujarEn(canvas,modelo,giro=0){
    const ctx=canvas?.getContext('2d');if(!ctx)return;
    const w=canvas.width,h=canvas.height,escala=Math.min(w/600,h/440),sx=25*escala,sy=13*escala,sz=30*escala;
    ctx.clearRect(0,0,w,h);ctx.fillStyle='#f1f5f9';ctx.fillRect(0,0,w,h);
    const P=(x,y,z)=>[w/2+(x-y)*sx,h*.32+(x+y)*sy-z*sz];
    const cara=(puntos,color)=>{ctx.beginPath();puntos.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=color;ctx.fill();ctx.strokeStyle='rgba(22,35,50,.28)';ctx.stroke();};
    for(let x=0;x<8;x++)for(let y=0;y<8;y++)cara([P(x,y,0),P(x+1,y,0),P(x+1,y+1,0),P(x,y+1,0)],(x+y)%2?'#e2e8ef':'#eaf0f5');
    const bloques=this.validar(modelo).bloques.map(b=>({...b,pos:this.rotar(b.x,b.y,giro)}));
    bloques.sort((a,b)=>(a.pos[0]+a.pos[1]+a.z)-(b.pos[0]+b.pos[1]+b.z));
    for(const b of bloques){
      const [x,y]=b.pos,z=b.z,c=b.color;
      cara([P(x,y+1,z+1),P(x+1,y+1,z+1),P(x+1,y+1,z),P(x,y+1,z)],this.tono(c,.76));
      cara([P(x+1,y,z+1),P(x+1,y+1,z+1),P(x+1,y+1,z),P(x+1,y,z)],this.tono(c,.62));
      cara([P(x,y,z+1),P(x+1,y,z+1),P(x+1,y+1,z+1),P(x,y+1,z+1)],c);
    }
  },
  tono(hex,factor){return '#'+[1,3,5].map(i=>Math.round(parseInt(hex.slice(i,i+2),16)*factor).toString(16).padStart(2,'0')).join('');},
  dibujar(){
    const canvas=document.getElementById('t3d-canvas');if(canvas&&this.modelo)this.dibujarEn(canvas,this.modelo,this.giro);
    const cuenta=document.getElementById('t3d-contador');if(cuenta&&this.modelo)cuenta.textContent='Bloques: '+this.modelo.bloques.length+' · Volumen: '+this.modelo.bloques.length+' unidades cúbicas';
  },
  pista(){
    const b=this.modelo.bloques,el=document.getElementById('t3d-estado');if(!el)return;
    if(!b.length)el.textContent='Pista: elegí una forma simple, como una torre o un puente. ¿En qué casillas iría la base?';
    else if(b.length<5)el.textContent='Pista: girá la vista. ¿Tu figura se ve igual desde todos los lados? Probá agregar un bloque y compará.';
    else el.textContent='Pista: tenés '+b.length+' cubos. ¿Cómo calcularías el volumen? Buscá una parte simétrica y explicá por qué lo es.';
  },
  estado(t){const el=document.getElementById('t3d-estado');if(el)el.textContent=t;},
  guardar(){
    try{localStorage.setItem(this.clave(),JSON.stringify(this.modelo));this.estado('Guardado en este equipo. Sincronizando…');}
    catch(_e){this.estado('Descargá una copia: este equipo no pudo guardar el diseño.');}
    clearTimeout(this.temporizador);
    this.temporizador=setTimeout(()=>{this.temporizador=null;this.guardarNube();},2500);
  },
  guardarNube(enviar=false){
    if(!this.modelo||!Club.alumno||!Club.lec)return Promise.resolve(false);
    let modelo;
    try{modelo=this.validar(this.modelo);if(!modelo.titulo.trim())throw Error('Poné un nombre al diseño.');}
    catch(e){this.estado(e.message);return Promise.resolve(false);}
    const args={p_student:Club.alumno.student_id,p_device:deviceId(),p_type:'design',
      p_project:this.proyectoId,p_title:modelo.titulo,p_content:{lesson_id:Club.lec.id,model:modelo}};
    this.cola=this.cola.catch(()=>{}).then(async()=>{
      args.p_project=this.proyectoId;
      const r=await db.rpc('club_crea_guardar',args);
      if(r.error){this.estado('No se guardó en Krueka: '+r.error.message+' Descargá una copia.');return false;}
      this.proyectoId=r.data.id;
      if(enviar&&r.data.status==='draft'){
        const entrega=await db.rpc('club_crea_solicitar_revision',{p_student:args.p_student,p_device:args.p_device,p_project:this.proyectoId});
        if(entrega.error){this.estado('Guardado, pero no enviado: '+entrega.error.message);return false;}
      }
      this.estado(enviar?'Diseño enviado al profe.':'Diseño guardado en Krueka.');return true;
    });
    return this.cola;
  },
  async entregar(){
    if(!this.modelo||!this.modelo.bloques.length){this.estado('Colocá al menos un bloque antes de enviar el diseño.');return false;}
    clearTimeout(this.temporizador);this.temporizador=null;
    const b=document.getElementById('t3d-enviar');if(b)b.disabled=true;
    const ok=await this.guardarNube(true);if(b)b.disabled=false;return ok;
  },
  descargar(){
    const url=URL.createObjectURL(new Blob([JSON.stringify(this.modelo,null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='mi-diseno-3d-krueka.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  },
  cerrar(){
    if(this.temporizador){clearTimeout(this.temporizador);this.temporizador=null;this.guardarNube();}
    document.getElementById('t3d-panel')?.remove();this.modelo=null;
  }
};
Taller3D.iniciar();
