/* Club Krueka 4/4 */
Object.assign(Club,{async responder(op){
    if(this.respondiendo) return;
    this.respondiendo=true;
    document.querySelectorAll('.club-option').forEach(b=>b.disabled=true);
    const acts=this.lec.actividades||[], a=acts[this.i], msg=document.getElementById('cj-msg');
    msg.innerHTML='<div class="club-msg loading">Analizando tu decisión…</div>';
    const {data,error}=await db.rpc('club_responder',{
      p_student:this.alumno.student_id||this.alumno.id,
      p_activity:a.id,
      p_respuesta:op
    });
    if(error){
      this.respondiendo=false; document.querySelectorAll('.club-option').forEach(b=>b.disabled=false);
      msg.innerHTML='<div class="club-msg error">No se pudo comprobar. Intentá otra vez.</div>'; return;
    }
    const ok=data&&(data.correcto===true||data.ok===true);
    if(ok){
      this.aciertos++;
      const ultimo=this.i+1 >= acts.length;
      msg.innerHTML='<div class="club-feedback-card success"><span>' + (this.alumno.nivel==='mayores'?'✓':'🎉') + '</span><div><b>' + (this.alumno.nivel==='mayores'?'Decisión correcta':'¡Lo resolviste!') + '</b><p>' + esc(data.explicacion||'Buena estrategia.') + '</p></div></div>'
        + '<button class="club-primary" onclick="Club.jugar(' + (this.i+1) + ')">' + (ultimo?'Ver resultado':'Siguiente desafío') + ' →</button>';
    }else{
      this.respondiendo=false;
      document.querySelectorAll('.club-option').forEach(b=>b.disabled=false);
      msg.innerHTML='<div class="club-feedback-card error"><span>↻</span><div><b>' + (this.alumno.nivel==='mayores'?'Revisá el razonamiento':'Probemos otra estrategia') + '</b><p>' + esc((data&&data.explicacion)||'Usá la pista y volvé a intentar.') + '</p></div></div>'
        + '<div class="club-feedback-actions"><button class="club-secondary" onclick="Club.jugar(' + this.i + ')">Intentar otra vez</button><button class="club-ghost" onclick="Club.lectura()">Revisar ideas</button></div>';
    }
  },
async fin(){
    const total=(this.lec.actividades||[]).length;
    this.pinta(this.cabecera('Calculando resultado') + '<div class="club-loading"><i></i><p>Guardando tu progreso…</p></div>');
    const {data,error}=await db.rpc('club_terminar',{
      p_student:this.alumno.student_id||this.alumno.id,
      p_lesson:this.lec.id,
      p_aciertos:this.aciertos,
      p_total:total
    });
    if(error){
      this.pinta(this.cabecera('Resultado')+'<div class="club-empty"><span>🛠️</span><h2>No pudimos guardar el resultado</h2><p>'+esc(error.message)+'</p><button class="club-primary" onclick="Club.jugar(0)">Intentar otra vez</button></div>'); return;
    }
    if(data&&data.estado==='proyecto_pendiente'){ this.lec.entrega=null; this.proyecto(); return; }
    const aprobado=data&&(data.estado==='aprobado'||data.aprobado===true);
    await this.recargar();
    if(aprobado) this.confeti();
    const junior=this.alumno.nivel==='mayores';
    this.pinta(this.cabecera('Resultado')
      + '<section class="club-result ' + (aprobado?'win':'retry') + '">'
      + '<div class="club-result-mark">' + (aprobado?(junior?'✓':'🏆'):'↻') + '</div>'
      + '<span class="club-kicker">' + (aprobado?'MISIÓN SUPERADA':'ITERAR ES APRENDER') + '</span>'
      + '<h1>' + (aprobado?(junior?'Entrega validada':'¡Desbloqueaste una nueva misión!'):'Todavía no termina') + '</h1>'
      + '<p>' + esc((data&&data.mensaje)||(aprobado?'Excelente trabajo.':'Revisá y volvé a probar.')) + '</p>'
      + '<div class="club-result-stats"><div><strong>' + this.aciertos + '/' + total + '</strong><span>retos resueltos</span></div><div><strong>+' + esc((data&&data.puntos)||0) + '</strong><span>XP obtenidos</span></div></div>'
      + '<div class="club-actions">' + (aprobado?'':'<button class="club-secondary" onclick="Club.lectura()">Revisar misión</button>')
      + '<button class="club-primary" onclick="Club.volverMapa()">Volver al mapa →</button></div></section>');
  },
confeti(){
    const capa=document.createElement('div'); capa.className='club-confetti';
    for(let i=0;i<40;i++){
      const p=document.createElement('i'); p.style.left=Math.random()*100+'%'; p.style.setProperty('--d',(1.5+Math.random()*2)+'s'); p.style.setProperty('--r',(Math.random()*360)+'deg'); p.style.background=['#6C5CE7','#00D4B8','#FFD166','#FF6B8A','#35A7FF'][i%5]; capa.appendChild(p);
    }
    document.body.appendChild(capa); setTimeout(()=>capa.remove(),3800);
  },
volverMapa(){
    try{ if('speechSynthesis' in window) speechSynthesis.cancel(); }catch(e){}
    this.recargar().then(()=>this.mapa());
  }});
