/* Estudio de juegos 2D del Club: borrador local y copia privada en Supabase. */
const EstudioClub = {
  ancho:12, alto:8, juego:null, jugando:false, jugador:{x:1,y:1}, recogidos:0, cola:Promise.resolve(), temporizador:null,
  colores:{bosque:['#dff2dd','#346847','#89bb72'],espacio:['#171c3c','#8998ff','#4c568e'],oceano:['#d7f4fb','#246c96','#69b8cf']},
  iniciar(){
    const original=Club.proyecto;
    Club.proyecto=function(){
      original.apply(this,arguments);
      if(!this.alumno || this.alumno.nivel!=='mayores' || !this.lec) return;
      const caja=document.getElementById('club-box'); if(!caja) return;
      const zona=document.createElement('section'); zona.className='club-panel'; zona.style.marginTop='16px';
      zona.innerHTML='<h2>🎮 Estudio de juegos</h2><p>Creá un juego 2D: diseñá el escenario, poné obstáculos y tesoros, jugá y mejoralo.</p><button class="club-primary" type="button" onclick="EstudioClub.abrir()">Crear mi juego</button>';
      caja.appendChild(zona);
    };
  },
  clave(){ return 'krueka-juego-v1:'+(Club.alumno.student_id||Club.alumno.id)+':'+Club.lec.id; },
  nuevo(){return {titulo:'Mi primer juego',tema:'bosque',personaje:'explorador',muros:[[4,2],[4,3],[4,4],[8,4]],tesoros:[[3,1],[7,3],[9,6]],salida:[10,6]};},
  validar(raw){
    if(!raw || typeof raw!=='object') throw new Error('Archivo inválido.');
    const punto=p=>Array.isArray(p)&&p.length===2&&Number.isInteger(p[0])&&Number.isInteger(p[1])&&p[0]>=0&&p[0]<12&&p[1]>=0&&p[1]<8;
    if(typeof raw.titulo!=='string'||raw.titulo.length>50||!this.colores[raw.tema]||
       !['explorador','robot','nave'].includes(raw.personaje)||!Array.isArray(raw.muros)||
       !Array.isArray(raw.tesoros)||raw.muros.length>40||raw.tesoros.length>20||
       !raw.muros.every(punto)||!raw.tesoros.every(punto)||!punto(raw.salida)) throw new Error('El proyecto no tiene el formato esperado.');
    const usados=new Set(['1,1']);
    for(const p of [...raw.muros,...raw.tesoros,raw.salida]){const k=p.join(',');if(usados.has(k))throw new Error('Dos objetos ocupan la misma casilla.');usados.add(k);}
    return {titulo:raw.titulo,tema:raw.tema,personaje:raw.personaje,muros:raw.muros.map(p=>[...p]),tesoros:raw.tesoros.map(p=>[...p]),salida:[...raw.salida]};
  },
  async abrir(){
    if(!Club.alumno||Club.alumno.nivel!=='mayores'||!Club.lec)return;
    await this.cola.catch(()=>{});
    const leccion=Club.lec.id, alumno=Club.alumno.student_id;
    const boton=document.querySelector('#club-box button[onclick="EstudioClub.abrir()"]');
    if(boton) boton.disabled=true;
    let guardado=null;
    try{guardado=localStorage.getItem(this.clave());}catch(_e){}
    try{this.juego=guardado?this.validar(JSON.parse(guardado)):this.nuevo();}catch(_e){this.juego=this.nuevo();}
    let aviso='';this.proyectoId=null;this.estadoNube=null;
    try{
      const acceso={p_student:alumno,p_device:deviceId()};
      const r=await db.rpc('club_crea_listar',acceso);
      if(r.error)throw r.error;
      let encontrado=null;
      for(const item of (Array.isArray(r.data)?r.data:[]).filter(p=>p.type==='game')){
        const detalle=await db.rpc('club_crea_cargar',{...acceso,p_project:item.id});
        if(detalle.error)throw detalle.error;
        if(detalle.data?.content?.lesson_id===leccion){encontrado=detalle.data;break;}
      }
      if(encontrado){
        this.proyectoId=encontrado.id;this.estadoNube=encontrado.status;
        const nube=this.validar(encontrado.content.game);
        if(!guardado||JSON.stringify(this.juego)===JSON.stringify(nube)||
          confirm('Hay un proyecto en Krueka y otro en este equipo. ¿Querés abrir el guardado en Krueka?')){
          this.juego=nube;
          try{localStorage.setItem(this.clave(),JSON.stringify(nube));}catch(_e){}
          aviso='Proyecto recuperado de Krueka. '+(encontrado.review_note?'Observación del profe: '+encontrado.review_note:'');
        }else aviso='Estás usando la copia de este equipo. Guardá para subirla a Krueka.';
      }else aviso='Proyecto nuevo. Tus cambios se guardarán en Krueka.';
    }catch(_e){aviso='Sin conexión con Krueka: trabajá acá y descargá una copia antes de cerrar.';}
    if(boton)boton.disabled=false;
    if(!Club.alumno||Club.alumno.student_id!==alumno||!Club.lec||Club.lec.id!==leccion)return;
    this.jugando=false;this.jugador={x:1,y:1};this.recogidos=0;
    const viejo=document.getElementById('estudio-panel');if(viejo)viejo.remove();
    const panel=document.createElement('div');panel.id='estudio-panel';
    panel.style.cssText='position:fixed;inset:0;z-index:101;background:var(--bg);color:var(--tx);overflow:auto;padding:16px';
    panel.innerHTML='<main style="max-width:1050px;margin:auto"><header style="display:flex;justify-content:space-between;align-items:center;gap:12px"><div><h1>Estudio de juegos · Club Junior</h1><p class="note">Diseñá → Probá → Mejorá. Guardado en Krueka y copia en este equipo.</p></div><button class="btn sec" type="button" id="es-volver">Volver</button></header><div class="grid2"><section class="card"><h2>1. Imaginá tu juego</h2><label for="es-titulo">Nombre</label><input id="es-titulo" maxlength="50"><label for="es-tema">Escenario</label><select id="es-tema"><option value="bosque">Bosque</option><option value="espacio">Espacio</option><option value="oceano">Océano</option></select><label for="es-personaje">Personaje</label><select id="es-personaje"><option value="explorador">Explorador</option><option value="robot">Robot</option><option value="nave">Nave</option></select><h2 style="margin-top:18px">2. Construí el nivel</h2><p class="note">Elegí una pieza y tocá una casilla. El inicio está en la esquina superior izquierda.</p><div style="display:flex;gap:6px;flex-wrap:wrap" id="es-herramientas"><button class="btn sm" type="button" data-pieza="muro">🧱 Obstáculo</button><button class="btn sec sm" type="button" data-pieza="tesoro">⭐ Tesoro</button><button class="btn sec sm" type="button" data-pieza="salida">🏁 Meta</button><button class="btn sec sm" type="button" data-pieza="borrar">Borrar</button></div><p id="es-pieza" class="note" role="status">Pieza elegida: obstáculo</p><h2>3. Probá y explicá</h2><p class="note">¿Se puede llegar a la meta y recoger los tesoros? Probá distintas rutas y cambiá lo que no funcione.</p><button class="btn" id="es-probar" type="button">▶ Probar juego</button> <button class="btn sec" id="es-editar" type="button">✏️ Editar</button><p id="es-estado" role="status" aria-live="polite"></p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="es-guardar" type="button">Guardar en Krueka</button><button class="btn sec" id="es-entregar" type="button">Enviar al profe</button><button class="btn sec sm" id="es-descargar" type="button">Descargar proyecto</button><button class="btn sec sm" id="es-cargar" type="button">Abrir proyecto</button><input id="es-archivo" type="file" accept="application/json,.json" hidden></div></section><section class="card"><h2>Tu escenario</h2><canvas id="es-lienzo" width="600" height="400" style="display:block;width:100%;max-width:600px;border-radius:10px;touch-action:none" aria-label="Tablero del juego de doce columnas y ocho filas"></canvas><p class="note">Para jugar: flechas o W A S D. En celular, usá los botones.</p><div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><button class="btn sec" type="button" data-mover="0,-1">↑</button><button class="btn sec" type="button" data-mover="-1,0">←</button><button class="btn sec" type="button" data-mover="0,1">↓</button><button class="btn sec" type="button" data-mover="1,0">→</button></div><p class="note" id="es-contador"></p></section></div></main>';
    document.body.appendChild(panel);
    this.pieza='muro';
    panel.querySelector('#es-titulo').value=this.juego.titulo;
    panel.querySelector('#es-tema').value=this.juego.tema;
    panel.querySelector('#es-personaje').value=this.juego.personaje;
    panel.querySelector('#es-volver').onclick=()=>this.cerrar();
    for(const campo of ['titulo','tema','personaje']){
      panel.querySelector('#es-'+campo).addEventListener(campo==='titulo'?'input':'change',e=>{
        this.juego[campo]=e.target.value;this.guardar();this.dibujar();
      });
    }
    panel.querySelector('#es-herramientas').onclick=e=>{
      const boton=e.target.closest('button[data-pieza]');if(!boton)return;
      this.pieza=boton.dataset.pieza;
      for(const b of panel.querySelectorAll('[data-pieza]')) b.className='btn '+(b===boton?'':'sec ')+'sm';
      panel.querySelector('#es-pieza').textContent='Pieza elegida: '+({muro:'obstáculo',tesoro:'tesoro',salida:'meta',borrar:'borrar'}[this.pieza]);
    };
    panel.querySelector('#es-lienzo').onclick=e=>this.colocar(e);
    panel.querySelector('#es-probar').onclick=()=>this.probar();
    panel.querySelector('#es-editar').onclick=()=>{this.jugando=false;this.estado('Podés seguir editando y volver a probar.');this.dibujar();};
    panel.querySelector('#es-descargar').onclick=()=>this.descargar();
    panel.querySelector('#es-guardar').onclick=()=>this.guardarNube();
    panel.querySelector('#es-entregar').onclick=()=>this.entregar();
    panel.querySelector('#es-cargar').onclick=()=>panel.querySelector('#es-archivo').click();
    panel.querySelector('#es-archivo').onchange=e=>this.cargar(e.target.files[0]);
    panel.querySelectorAll('[data-mover]').forEach(b=>b.onclick=()=>this.mover(...b.dataset.mover.split(',').map(Number)));
    this.teclas=e=>{
      if(document.activeElement?.matches('input,textarea,select'))return;
      const dir={ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1],ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0]}[e.key];
      if(dir&&this.jugando){e.preventDefault();this.mover(...dir);}
    };
    window.addEventListener('keydown',this.teclas);
    this.dibujar();
    this.estado(aviso);
  },
  cerrar(){
    if(this.temporizador){clearTimeout(this.temporizador);this.temporizador=null;this.guardarNube();}
    window.removeEventListener('keydown',this.teclas);document.getElementById('estudio-panel')?.remove();this.jugando=false;this.juego=null;
  },
  guardar(){
    try{localStorage.setItem(this.clave(),JSON.stringify(this.juego));this.estado('Guardado en este equipo. Sincronizando…');}
    catch(_e){this.estado('No se pudo guardar en este equipo. Descargá una copia.');}
    clearTimeout(this.temporizador);
    this.temporizador=setTimeout(()=>{this.temporizador=null;this.guardarNube();},2500);
  },
  guardarNube(enviar=false){
    if(!this.juego||!Club.alumno||!Club.lec)return Promise.resolve(false);
    let juego;
    try{juego=this.validar(this.juego);if(!juego.titulo.trim())throw new Error('Poné un nombre al juego.');}
    catch(e){this.estado(e.message);return Promise.resolve(false);}
    const args={p_student:Club.alumno.student_id,p_device:deviceId(),
      p_project:this.proyectoId,p_type:'game',p_title:juego.titulo,
      p_content:{lesson_id:Club.lec.id,game:juego}};
    this.cola=this.cola.catch(()=>{}).then(async()=>{
      args.p_project=this.proyectoId;
      const r=await db.rpc('club_crea_guardar',args);
      if(r.error){this.estado('No se guardó en Krueka: '+r.error.message+' Descargá una copia.');return false;}
      this.proyectoId=r.data.id;this.estadoNube=r.data.status;
      if(enviar&&this.estadoNube==='draft'){
        const envio=await db.rpc('club_crea_solicitar_revision',{
          p_student:args.p_student,p_device:args.p_device,p_project:this.proyectoId});
        if(envio.error){this.estado('Juego guardado, pero no enviado: '+envio.error.message);return false;}
        this.estadoNube='review';
      }
      this.estado(enviar?'Juego enviado al profe para revisión.':'Juego guardado en Krueka. Podés abrirlo desde otro equipo.');
      return true;
    });
    return this.cola;
  },
  async entregar(){
    clearTimeout(this.temporizador);this.temporizador=null;
    const boton=document.getElementById('es-entregar');if(boton)boton.disabled=true;
    const ok=await this.guardarNube(true);
    if(boton)boton.disabled=false;
    return ok;
  },
  estado(msg){const el=document.getElementById('es-estado');if(el)el.textContent=msg;},
  colocar(e){
    if(this.jugando){this.estado('Tocá Editar para cambiar el nivel.');return;}
    const rect=e.currentTarget.getBoundingClientRect();
    const x=Math.floor((e.clientX-rect.left)*this.ancho/rect.width),y=Math.floor((e.clientY-rect.top)*this.alto/rect.height);
    if(x<0||x>=this.ancho||y<0||y>=this.alto)return;
    if(x===1&&y===1){this.estado('La casilla de inicio queda libre para el personaje.');return;}
    const j=this.juego,same=p=>p[0]===x&&p[1]===y;
    j.muros=j.muros.filter(p=>!same(p));j.tesoros=j.tesoros.filter(p=>!same(p));
    if(this.pieza==='muro'&&j.muros.length<40)j.muros.push([x,y]);
    if(this.pieza==='tesoro'&&j.tesoros.length<20)j.tesoros.push([x,y]);
    if(this.pieza==='salida')j.salida=[x,y];
    if(this.pieza!=='salida'&&same(j.salida)){this.estado('Primero mové la meta a otra casilla.');this.dibujar();return;}
    this.guardar();this.dibujar();
  },
  probar(){
    if(!this.juego.tesoros.length){this.estado('Agregá al menos un tesoro antes de probar.');return;}
    this.jugando=true;this.jugador={x:1,y:1};this.recogidos=0;
    this.pendientes=this.juego.tesoros.map(p=>[...p]);this.estado('Jugá: recogé todos los tesoros y llegá a la meta.');this.dibujar();
  },
  mover(dx,dy){
    if(!this.jugando||Math.abs(dx)+Math.abs(dy)!==1)return;
    const x=this.jugador.x+dx,y=this.jugador.y+dy;
    if(x<0||x>=this.ancho||y<0||y>=this.alto||this.juego.muros.some(p=>p[0]===x&&p[1]===y))return;
    this.jugador={x,y};
    const n=this.pendientes.length;this.pendientes=this.pendientes.filter(p=>p[0]!==x||p[1]!==y);
    if(this.pendientes.length<n)this.recogidos++;
    if(this.juego.salida[0]===x&&this.juego.salida[1]===y){
      if(!this.pendientes.length){this.jugando=false;this.estado('¡Lograste tu meta! Ahora cambiá una regla u obstáculo y explicá qué mejoró.');}
      else this.estado('La meta está cerca, pero faltan '+this.pendientes.length+' tesoros. ¿Qué ruta podrías intentar?');
    }
    this.dibujar();
  },
  dibujar(){
    const canvas=document.getElementById('es-lienzo');if(!canvas||!this.juego)return;
    const ctx=canvas.getContext('2d');if(!ctx)return;
    const [fondo,borde,muro]=this.colores[this.juego.tema];
    ctx.fillStyle=fondo;ctx.fillRect(0,0,600,400);
    ctx.strokeStyle=borde;ctx.globalAlpha=.32;
    for(let x=0;x<=600;x+=50){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,400);ctx.stroke();}
    for(let y=0;y<=400;y+=50){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(600,y);ctx.stroke();}ctx.globalAlpha=1;
    ctx.fillStyle=muro;
    for(const [x,y] of this.juego.muros)ctx.fillRect(x*50+4,y*50+4,42,42);
    ctx.font='30px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    const icono=(x,y,s)=>ctx.fillText(s,x*50+25,y*50+26);
    icono(...this.juego.salida,'🏁');
    for(const p of this.jugando?this.pendientes:this.juego.tesoros)icono(...p,'⭐');
    const avatar={explorador:'🧑‍🚀',robot:'🤖',nave:'🚀'}[this.juego.personaje];
    icono(this.jugando?this.jugador.x:1,this.jugando?this.jugador.y:1,avatar);
    const contador=document.getElementById('es-contador');
    if(contador)contador.textContent=this.jugando?'Tesoros: '+this.recogidos+' / '+this.juego.tesoros.length:'Obstáculos: '+this.juego.muros.length+' · Tesoros: '+this.juego.tesoros.length;
  },
  descargar(){
    const blob=new Blob([JSON.stringify(this.juego,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='mi-juego-krueka.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  },
  async cargar(file){
    if(!file||file.size>20000){this.estado('Elegí un proyecto JSON de menos de 20 KB.');return;}
    try{
      this.juego=this.validar(JSON.parse(await file.text()));this.jugando=false;
      for(const campo of ['titulo','tema','personaje'])document.getElementById('es-'+campo).value=this.juego[campo];
      this.guardar();this.dibujar();
    }catch(_e){this.estado('No se pudo abrir ese proyecto. Revisá que sea un juego de Krueka.');}
  }
};
EstudioClub.iniciar();
