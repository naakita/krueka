/* Club Krueka 1/4 */
Object.assign(Club,{respondiendo:false,
aplicarNivel(nivel){
    const tema = nivel === 'mayores' ? 'juniors' : (nivel === 'peques' ? 'exploradores' : 'publico');
    document.body.dataset.clubNivel = tema;
    document.documentElement.dataset.clubNivel = tema;
  },
etiquetaNivel(){
    return this.alumno && this.alumno.nivel === 'mayores' ? 'Juniors 12–17' : 'Exploradores 7–11';
  },
cabecera(titulo, volver){
    const nivel = this.etiquetaNivel();
    return '<header class="club-cabecera">'
      + '<button class="club-icon-btn" type="button" onclick="' + (volver || 'Club.volverMapa()') + '" aria-label="Volver">←</button>'
      + '<div class="club-cabecera-txt"><span>' + esc(nivel) + '</span><strong>' + esc(titulo || 'Misión') + '</strong></div>'
      + '<div class="club-xp" title="Puntos acumulados">' + esc((this.alumno && this.alumno.puntos) || 0) + ' XP</div>'
      + '</header>';
  },
vEntrar(){
    this.aplicarNivel('');
    this.pinta('<div class="club-login">'
      + '<div class="club-login-orbit" aria-hidden="true"><i></i><i></i><i></i></div>'
      + '<div class="club-login-card">'
      + '<button class="club-back-link" onclick="Club.abrir()">← Volver al club</button>'
      + '<div class="club-login-icon">🚀</div>'
      + '<div class="club-kicker">Tu próxima misión está lista</div>'
      + '<h1>Entrá a tu laboratorio</h1>'
      + '<p>Usá el código personal de 6 caracteres que te dio el profe.</p>'
      + '<label class="club-code-label" for="cf-cod">Código de acceso</label>'
      + '<input id="cf-cod" class="club-code-input" maxlength="6" autocomplete="one-time-code" inputmode="text" aria-describedby="ce-msg">'
      + '<div id="ce-msg" class="club-inline-msg" aria-live="polite"></div>'
      + '<button class="club-primary club-wide" onclick="Club.entrar()">Entrar a mis misiones <span>→</span></button>'
      + '<small>El código es personal. Si cambiaste de computadora, pedile ayuda al profe.</small>'
      + '</div></div>');
    const i = document.getElementById('cf-cod');
    i.focus();
    i.addEventListener('input', () => { i.value = i.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6); });
    i.addEventListener('keydown', e => { if(e.key === 'Enter') Club.entrar(); });
  },
entrar(){ this.entrarCon((document.getElementById('cf-cod')||{}).value); },
async entrarCon(cod){
    cod = (cod||'').trim().toUpperCase();
    const msg = document.getElementById('ce-msg');
    if(cod.length !== 6){
      if(msg) msg.innerHTML = '<div class="club-msg error">El código debe tener 6 letras o números.</div>';
      else alert('Escribí tu código completo de 6 caracteres.');
      return;
    }
    if(msg) msg.innerHTML = '<div class="club-msg loading">Comprobando código…</div>';
    const payload = {
      p_codigo: cod,
      p_device: typeof deviceId === 'function' ? deviceId() : null,
      p_agent: (navigator.userAgent || '').slice(0,240)
    };
    const { data, error } = await db.rpc('club_entrar', payload);
    if(error || !data || data.error){
      const texto = (error && error.message) || (data && data.error) || 'Ese código no existe.';
      if(msg) msg.innerHTML = '<div class="club-msg error">' + esc(texto) + '</div>';
      else alert(texto);
      return;
    }
    this.alumno = data;
    this.aplicarNivel(data.nivel);
    this.mapa();
  },
async recargar(){
    if(!this.alumno) return;
    const codigo = this.alumno.codigo || this.alumno.cod;
    if(!codigo) return;
    const { data } = await db.rpc('club_entrar', {
      p_codigo:codigo,
      p_device:typeof deviceId === 'function' ? deviceId() : null,
      p_agent:(navigator.userAgent || '').slice(0,240)
    });
    if(data) this.alumno = data;
  },
estrellas(n){
    n = Math.max(1, Math.min(5, Number(n||1)));
    return '<span class="club-dificultad" aria-label="Dificultad ' + n + ' de 5">'
      + Array.from({length:5},(_,i)=>'<i class="' + (i<n?'on':'') + '"></i>').join('') + '</span>';
  },
tarjetaMision(l){
    const est = l.estado || 'pendiente';
    const abierta = l.abierta !== false;
    const clase = est === 'aprobado' ? 'done' : (est === 'repasar' ? 'review' : (abierta ? 'ready' : 'locked'));
    const estado = est === 'aprobado' ? 'Misión superada' : (est === 'repasar' ? 'Volvé más fuerte' : (abierta ? 'Empezar misión' : 'Bloqueada'));
    const accion = abierta ? ' onclick="Club.leccion(\'' + l.id + '\')"' : ' disabled';
    return '<button class="club-mission ' + clase + '" type="button" style="--mission:' + esc(l.color || '#6C5CE7') + '"' + accion + '>'
      + '<span class="club-mission-number">' + String(l.orden||'').padStart(2,'0') + '</span>'
      + '<span class="club-mission-icon">' + (l.icono || '💡') + '</span>'
      + '<span class="club-mission-body">'
      + '<small>' + esc(l.modulo || 'Misión') + '</small>'
      + '<strong>' + esc(l.titulo||'') + '</strong>'
      + '<em>' + esc(l.resumen||'') + '</em>'
      + '<span class="club-meta"><b>⏱ ' + esc(l.duracion_min||60) + ' min</b>' + this.estrellas(l.dificultad) + '</span>'
      + '</span>'
      + '<span class="club-mission-state">' + (clase==='done'?'✓ ':clase==='locked'?'🔒 ':'→ ') + estado + '</span>'
      + (l.proyecto_entregado && clase!=='done' ? '<span class="club-submitted">Proyecto entregado</span>' : '')
      + '</button>';
  }});
