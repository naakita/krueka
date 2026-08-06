/* Club Krueka 2/4 */
Object.assign(Club,{mapa(){
    const a = this.alumno;
    if(!a) return this.vEntrar();
    this.aplicarNivel(a.nivel);
    const lecs = a.lecciones || [];
    const aprob = lecs.filter(l => l.estado === 'aprobado').length;
    const pct = lecs.length ? Math.round(aprob/lecs.length*100) : 0;
    const junior = a.nivel === 'mayores';
    const modulos = [];
    lecs.forEach(l => { const m=l.modulo||'Misiones'; if(!modulos.includes(m)) modulos.push(m); });
    const mapa = modulos.map((m,idx) => {
      const cards = lecs.filter(l => (l.modulo||'Misiones')===m).map(l=>this.tarjetaMision(l)).join('');
      return '<section class="club-module"><div class="club-module-title"><span>' + String(idx+1).padStart(2,'0') + '</span><h2>' + esc(m) + '</h2></div>'
        + '<div class="club-mission-grid">' + cards + '</div></section>';
    }).join('');

    this.pinta('<main class="club-dashboard">'
      + '<header class="club-dashboard-top">'
      + '<div><span class="club-brand-dot"></span><b>KRUEKA LAB</b><small>' + esc(this.etiquetaNivel()) + '</small></div>'
      + '<button class="club-ghost" onclick="Club.abrir()">Salir</button></header>'
      + '<section class="club-dashboard-hero">'
      + '<div class="club-avatar">' + (a.avatar || (junior?'🧑‍💻':'🦊')) + '</div>'
      + '<div class="club-hero-copy"><span class="club-kicker">' + (junior?'LABORATORIO DE PROYECTOS':'EXPEDICIÓN CREATIVA') + '</span>'
      + '<h1>' + (junior?'Construí algo que importe, ':'¡Hola, ') + esc(a.nombre||'') + (junior?'':'!') + '</h1>'
      + '<p>' + (junior
        ? 'No venís a memorizar botones: investigás, programás, probás y defendés decisiones.'
        : 'Cada misión tiene una historia, algo para construir y un desafío para desbloquear.') + '</p></div>'
      + '<div class="club-score"><strong>' + esc(a.puntos||0) + '</strong><span>XP</span></div>'
      + '<div class="club-progress-wrap"><div><b>' + aprob + ' / ' + lecs.length + '</b><span>misiones superadas</span></div>'
      + '<div class="club-progress"><i style="width:' + pct + '%"></i></div><small>' + pct + '% del recorrido</small></div>'
      + '</section>'
      + (lecs.length ? mapa : '<div class="club-empty"><span>🛰️</span><h2>Las misiones están cargándose</h2><p>El profe está preparando este recorrido.</p></div>')
      + '</main>');
  },
async leccion(id){
    this.pinta(this.cabecera('Cargando misión') + '<div class="club-loading"><i></i><p>Preparando el laboratorio…</p></div>');
    const { data, error } = await db.rpc('club_leccion', {
      p_student:this.alumno.student_id || this.alumno.id,
      p_lesson:id
    });
    if(error || !data){
      this.pinta(this.cabecera('No se pudo abrir') + '<div class="club-empty"><span>🛠️</span><h2>Esta misión necesita una revisión</h2><p>' + esc((error&&error.message)||'Intentá nuevamente.') + '</p><button class="club-primary" onclick="Club.volverMapa()">Volver al mapa</button></div>');
      return;
    }
    this.lec = data;
    this.i = 0;
    this.aciertos = 0;
    this.respondiendo = false;
    this.briefing();
  },
briefing(){
    const l=this.lec, m=l.mision||{};
    const objetivos=(l.objetivos||[]).map(x=>'<li><span>✓</span>' + esc(x) + '</li>').join('');
    this.pinta(this.cabecera('Misión ' + l.orden)
      + '<section class="club-brief" style="--mission:' + esc(l.color||'#6C5CE7') + '">'
      + '<div class="club-brief-icon">' + (l.icono||'✨') + '</div>'
      + '<div class="club-brief-main"><span class="club-kicker">' + esc(l.modulo||'Nueva misión') + '</span>'
      + '<h1>' + esc(l.titulo||'') + '</h1><p>' + esc(l.resumen||'') + '</p>'
      + '<div class="club-brief-meta"><b>⏱ ' + esc(l.duracion_min||60) + ' minutos</b>' + this.estrellas(l.dificultad) + '<b>🏅 ' + esc(l.insignia||'Nueva insignia') + '</b></div></div>'
      + '</section>'
      + '<div class="club-two-col">'
      + '<section class="club-panel club-story"><span class="club-panel-label">EL DESAFÍO</span><h2>' + esc(m.gancho||'Tu misión') + '</h2><p>' + esc(m.historia||'') + '</p><div class="club-target"><b>Objetivo</b><span>' + esc(m.meta||'Completar el desafío.') + '</span></div></section>'
      + '<section class="club-panel"><span class="club-panel-label">LO QUE VAS A DOMINAR</span><ul class="club-objectives">' + objetivos + '</ul></section>'
      + '</div>'
      + '<div class="club-actions"><button class="club-ghost" onclick="Club.volverMapa()">Volver al mapa</button><button class="club-primary" onclick="Club.lectura()">Aceptar misión <span>→</span></button></div>');
  },
lectura(){
    const l=this.lec;
    const pasos=(l.lectura||[]).map((x,idx)=>{
      const codigo=x.codigo ? '<pre class="club-code"><code>' + esc(x.codigo) + '</code></pre>' : '';
      return '<article class="club-learning-step ' + esc(x.tipo||'concepto') + '"><span class="club-step-index">' + String(idx+1).padStart(2,'0') + '</span>'
        + '<div class="club-step-emoji">' + (x.emoji||'✨') + '</div><div><small>' + esc((x.tipo||'idea').toUpperCase()) + '</small><h2>' + esc(x.titulo||'Idea clave') + '</h2><p>' + esc(x.texto||'') + '</p>' + codigo + '</div></article>';
    }).join('');
    this.pinta(this.cabecera(l.titulo)
      + '<section class="club-section-head"><div><span class="club-kicker">FASE 1 · ENTENDER</span><h1>Briefing de la misión</h1><p>Leé, probá las ideas y explicalas con tus propias palabras.</p></div>'
      + (this.alumno.nivel==='peques' ? '<button class="club-ghost" onclick="Club.leerVoz()">🔊 Leer en voz alta</button>' : '') + '</section>'
      + '<div class="club-learning-path">' + pasos + '</div>'
      + '<div class="club-actions"><button class="club-ghost" onclick="Club.briefing()">← Ver desafío</button><button class="club-primary" onclick="Club.proyecto()">Ir a construir <span>→</span></button></div>');
  },
leerVoz(){
    if(!('speechSynthesis' in window)) return alert('Este navegador no tiene lectura en voz alta.');
    speechSynthesis.cancel();
    const texto=[this.lec.titulo].concat((this.lec.lectura||[]).map(x=>(x.titulo||'')+'. '+(x.texto||''))).join('. ');
    const voz=new SpeechSynthesisUtterance(texto);
    voz.lang='es-PY'; voz.rate=.92; voz.pitch=1.05;
    speechSynthesis.speak(voz);
  }});
