/* Club de informatica - entrada del chico y juego de lecciones (cargar despues de club.js) */
Object.assign(Club, {
  /* ============ ENTRADA DEL CHICO ============ */
  vEntrar(){
    this.pinta(this.barra('Entrar al club')
      + '<div class="card" style="text-align:center">'
      + '<div style="font-size:44px">🎮</div>'
      + '<div style="font-size:18px;font-weight:700">Escribi tu codigo</div>'
      + '<div class="note">Son 6 letras y numeros. Te lo da tu profe.</div>'
      + '<input id="cf-cod" maxlength="6" style="margin:12px auto 0;text-transform:uppercase;letter-spacing:6px;font-size:26px;text-align:center;width:240px">'
      + '<div id="ce-msg" style="margin-top:10px"></div>'
      + '<div style="margin-top:12px;display:flex;gap:10px;justify-content:center">'
      + '<button class="btn" onclick="Club.entrar()">Entrar</button>'
      + '<button class="btn sec" onclick="Club.abrir()">Volver</button></div></div>');
    const i = document.getElementById('cf-cod');
    i.focus();
    i.addEventListener('keydown', e => { if(e.key === 'Enter') Club.entrar(); });
  },
  entrar(){ this.entrarCon((document.getElementById('cf-cod')||{}).value); },
  async entrarCon(cod){
    cod = (cod||'').trim().toUpperCase();
    if(cod.length < 4){ alert('Escribi tu codigo completo.'); return; }
    const { data, error } = await db.rpc('club_entrar', { p_codigo: cod });
    if(error || !data || data.error){ alert('Ese codigo no existe. Pedile ayuda a tu profe.'); return; }
    this.alumno = data;
    this.mapa();
  },
  async recargar(){
    if(!this.alumno) return;
    const { data } = await db.rpc('club_entrar', { p_codigo: this.alumno.codigo || this.alumno.cod });
    if(data) this.alumno = data;
  },

  /* ============ MAPA DE LECCIONES ============ */
  mapa(){
    const a = this.alumno;
    const lecs = a.lecciones || [];
    const tarjetas = lecs.map((l,idx) => {
      const est = l.estado || 'pendiente';
      const abierta = l.abierta !== false;
      const color = est==='aprobado' ? '#E8F1EC' : (est==='repasar' ? '#FBEBDE' : '#F0EFED');
      const sello = est==='aprobado' ? '⭐ Aprobada' : (est==='repasar' ? '🔁 A repasar' : (abierta ? '▶ Jugar' : '🔒 Bloqueada'));
      return '<div class="card" style="flex:1;min-width:210px;background:' + color + ';opacity:' + (abierta?1:0.55) + ';cursor:' + (abierta?'pointer':'not-allowed') + '"'
        + (abierta ? ' onclick="Club.leccion(\'' + l.id + '\')"' : '') + '>'
        + '<div style="font-size:34px">' + (l.icono || '💡') + '</div>'
        + '<div class="note">Leccion ' + (idx+1) + '</div>'
        + '<div style="font-weight:700">' + esc(l.titulo||'') + '</div>'
        + '<div style="margin-top:6px">' + sello + '</div>'
        + (l.puntos ? '<div class="note">' + l.puntos + ' puntos</div>' : '')
        + '</div>';
    }).join('');
    const aprob = lecs.filter(l => l.estado === 'aprobado').length;
    this.pinta(this.barra('Hola ' + esc(a.nombre||''))
      + '<div class="card" style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">'
      + '<div style="font-size:44px">' + (a.avatar || '🐤') + '</div>'
      + '<div><div style="font-size:18px;font-weight:700">' + esc(a.nombre||'') + '</div>'
      + '<div class="note">' + aprob + ' de ' + lecs.length + ' lecciones aprobadas</div></div>'
      + '<div style="margin-left:auto;font-size:22px;font-weight:700">' + (a.puntos||0) + ' ⭐</div></div>'
      + '<div class="row">' + tarjetas + '</div>');
  },

  async leccion(id){
    this.pinta(this.barra('Cargando...') + '<div class="card"><div class="spinner">Un momento...</div></div>');
    const { data, error } = await db.rpc('club_leccion', { p_student: this.alumno.student_id || this.alumno.id, p_lesson: id });
    if(error || !data){ this.pinta(this.barra('Ups') + '<div class="alert err">No se pudo abrir la leccion.</div>'); return; }
    this.lec = data; this.i = 0; this.aciertos = 0;
    this.lectura();
  },
  lectura(){
    const l = this.lec;
    const parr = (l.lectura || []).map(x =>
      '<div class="card" style="display:flex;gap:14px;align-items:center">'
      + (x.imagen ? '<img src="' + x.imagen + '" style="width:90px;height:90px;object-fit:contain">' : '<div style="font-size:44px">' + (x.emoji||'✨') + '</div>')
      + '<div style="font-size:16px;line-height:1.5">' + esc(x.texto||'') + '</div></div>').join('');
    this.pinta(this.barra((l.icono||'💡') + ' ' + esc(l.titulo||''))
      + '<div class="note" style="margin-bottom:8px">Lee con atencion y despues jugamos.</div>'
      + parr
      + '<div class="card" style="display:flex;gap:10px;flex-wrap:wrap">'
      + '<button class="btn" onclick="Club.jugar(0)">🎮 Ahora si, a jugar</button>'
      + '<button class="btn sec" onclick="Club.volverMapa()">Volver</button></div>');
  },
  jugar(i){
    const acts = this.lec.actividades || [];
    if(i >= acts.length){ this.fin(); return; }
    this.i = i;
    const a = acts[i];
    const ops = (a.opciones || []).map(o =>
      '<button class="card" style="flex:1;min-width:150px;text-align:center;cursor:pointer" onclick="Club.responder(\'' + o.id + '\')">'
      + (o.imagen ? '<img src="' + o.imagen + '" style="width:90px;height:90px;object-fit:contain">' : '<div style="font-size:46px">' + (o.emoji||'❓') + '</div>')
      + '<div style="margin-top:6px;font-weight:600">' + esc(o.texto||'') + '</div></button>').join('');
    this.pinta(this.barra((this.lec.icono||'💡') + ' ' + esc(this.lec.titulo||''))
      + '<div class="card"><div class="note">Pregunta ' + (i+1) + ' de ' + acts.length + '</div>'
      + '<div style="font-size:20px;font-weight:700;margin-top:6px">' + esc(a.pregunta||'') + '</div>'
      + (a.pista ? '<div class="note">💡 ' + esc(a.pista) + '</div>' : '') + '</div>'
      + '<div class="row">' + ops + '</div>'
      + '<div id="cj-msg" style="margin-top:12px"></div>');
  },
  async responder(op){
    const acts = this.lec.actividades || [];
    const a = acts[this.i];
    const msg = document.getElementById('cj-msg');
    const { data } = await db.rpc('club_responder', {
      p_student: this.alumno.student_id || this.alumno.id,
      p_activity: a.id, p_respuesta: op
    });
    const ok = data && (data.correcto === true || data.ok === true);
    if(ok){
      this.aciertos++;
      msg.innerHTML = '<div class="alert ok" style="font-size:18px">🎉 Muy bien!' + (data.explicacion ? ' ' + esc(data.explicacion) : '') + '</div>';
      setTimeout(() => Club.jugar(Club.i + 1), 1100);
    } else {
      msg.innerHTML = '<div class="alert err" style="font-size:17px">😕 Todavia no. '
        + esc((data && data.explicacion) || (a.explicacion||'')) + '</div>'
        + '<div style="margin-top:10px;display:flex;gap:10px;flex-wrap:wrap">'
        + '<button class="btn" onclick="Club.lectura()">📖 Volver a leer la leccion</button>'
        + '<button class="btn sec" onclick="Club.jugar(' + this.i + ')">Intentar de nuevo</button></div>';
    }
  },
  async fin(){
    const total = (this.lec.actividades || []).length;
    const { data } = await db.rpc('club_terminar', {
      p_student: this.alumno.student_id || this.alumno.id,
      p_lesson: this.lec.id, p_aciertos: this.aciertos, p_total: total
    });
    const aprobado = data && (data.estado === 'aprobado' || data.aprobado === true);
    await this.recargar();
    this.pinta(this.barra('Resultado')
      + '<div class="card" style="text-align:center">'
      + '<div style="font-size:54px">' + (aprobado ? '🏆' : '🔁') + '</div>'
      + '<div style="font-size:20px;font-weight:700">' + (aprobado ? 'Aprobaste la leccion!' : 'Casi! Vamos a repasar') + '</div>'
      + '<div class="note">Acertaste ' + this.aciertos + ' de ' + total + '</div>'
      + (data && data.puntos ? '<div style="margin-top:8px;font-size:18px">+' + data.puntos + ' ⭐</div>' : '')
      + '<div style="margin-top:14px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap">'
      + (aprobado ? '' : '<button class="btn" onclick="Club.lectura()">📖 Repasar y volver a intentar</button>')
      + '<button class="btn sec" onclick="Club.volverMapa()">Ir a mis lecciones</button></div></div>');
  },
  volverMapa(){ this.recargar().then(() => this.mapa()); }
});
