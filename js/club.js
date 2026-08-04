/* Krueka - Club de Informatica
   Registro totalmente separado de la escuela: usa las tablas club_* y nunca
   toca students / enrollments / courses. */

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
function gs(n){ return Number(n||0).toLocaleString('es-PY') + " Gs"; }

const Club = {
  alumno:null, lec:null, i:0, aciertos:0, grupos:[], panel:null,
  anio:new Date().getFullYear(), mesNum:new Date().getMonth()+1,

  ov(){
    let o = document.getElementById('club-ov');
    if(!o){
      o = document.createElement('div');
      o.id = 'club-ov';
      o.style.cssText = 'position:fixed;inset:0;z-index:80;background:#F9F8F7;overflow:auto;display:none';
      o.innerHTML = '<div id="club-box" style="max-width:980px;margin:0 auto;padding:18px 16px 60px"></div>';
      document.body.appendChild(o);
    }
    return o;
  },
  cerrar(){
    this.ov().style.display='none';
    if(location.hash === '#club') history.replaceState(null,'',location.pathname + location.search);
  },
  pinta(html){
    const o = this.ov(); o.style.display='block';
    document.getElementById('club-box').innerHTML = html;
    o.scrollTop = 0;
  },
  barra(titulo, btnCerrar){
    return '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px">'
      + '<div><div style="font-size:20px;font-weight:700">' + titulo + '</div>'
      + '<div class="note">Club de informatica - Betesda. Registro aparte del sistema escolar.</div></div>'
      + (btnCerrar===false ? '' : '<button class="btn sec" onclick="Club.cerrar()">Cerrar</button>')
      + '</div>';
  },

  /* ============ PORTADA PUBLICA ============ */
  async abrir(){
    this.pinta(this.barra('Club de informatica') + '<div class="card"><div class="spinner">Cargando...</div></div>');
    const { data, error } = await db.rpc('club_grupos');
    if(error){ this.pinta(this.barra('Club de informatica') + '<div class="alert err">No se pudo cargar: ' + esc(error.message) + '</div>'); return; }
    this.grupos = data || [];
    const cards = this.grupos.map(g =>
      '<div class="card" style="flex:1;min-width:240px">'
      + '<div style="font-size:34px">' + (g.nivel==='peques' ? '🧸' : '🚀') + '</div>'
      + '<div style="font-size:17px;font-weight:700">' + esc(g.nombre) + '</div>'
      + '<div class="note">' + (g.edad_min||'') + ' a ' + (g.edad_max||'') + ' anos</div>'
      + '<div style="margin-top:8px"><span class="tag blue">' + esc(g.dias||'') + '</span> <span class="tag green">' + esc(g.horario||'') + '</span></div>'
      + '<div style="margin-top:8px;font-weight:600">' + gs(g.cuota) + ' por mes</div>'
      + '<div class="note">Se puede abonar por semana (por ejemplo 20.000 Gs) y se descuenta del mes.</div>'
      + '</div>').join('');
    this.pinta(this.barra('Club de informatica')
      + '<div class="card"><div style="font-size:18px;font-weight:700">Aprender jugando con la computadora</div>'
      + '<div class="note">Clases los sabados en la escuela Betesda. Cada chico tiene su propio usuario y avanza a su ritmo.</div></div>'
      + '<div class="row">' + cards + '</div>'
      + '<div class="card" style="margin-top:12px;display:flex;gap:10px;flex-wrap:wrap">'
      + '<button class="btn" onclick="Club.vForm()">📝 Quiero inscribirme</button>'
      + '<button class="btn sec" onclick="Club.vEntrar()">🎮 Ya soy del club, quiero jugar</button>'
      + '</div>');
  },

  /* ============ FORMULARIO DE INSCRIPCION ============ */
  vForm(){
    const ops = this.grupos.map(g => '<option value="' + g.id + '">' + esc(g.nombre) + ' (' + g.edad_min + '-' + g.edad_max + ' anos, ' + esc(g.dias||'') + ' ' + esc(g.horario||'') + ')</option>').join('');
    const f = (id,label,tipo,req) => '<div style="flex:1;min-width:220px"><label>' + label + (req?' *':'') + '</label>'
      + '<input id="' + id + '" type="' + (tipo||'text') + '"></div>';
    this.pinta(this.barra('Inscripcion al club')
      + '<div class="card">'
      + '<div class="note">Completa los datos. Solo la direccion y el administrador del club los pueden ver.</div>'
      + '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:10px">'
      + '<div style="flex:1;min-width:220px"><label>Grupo *</label><select id="cf-grupo">' + ops + '</select></div>'
      + f('cf-alumno','Nombre y apellido del alumno','text',true)
      + f('cf-nac','Fecha de nacimiento','date')
      + f('cf-edad','Edad','number')
      + f('cf-escuela','Escuela a la que asiste')
      + f('cf-grado','Grado o curso')
      + f('cf-tutor','Nombre del padre, madre o tutor','text',true)
      + f('cf-par','Parentesco')
      + f('cf-tel','Telefono de contacto','text',true)
      + f('cf-mail','Correo electronico','email')
      + f('cf-dir','Direccion')
      + f('cf-salud','Alguna condicion de salud o alergia')
      + '</div>'
      + '<div style="margin-top:10px"><label>Comentario</label><textarea id="cf-com" rows="3"></textarea></div>'
      + '<div style="margin-top:10px"><label style="display:inline"><input type="checkbox" id="cf-fotos" checked style="width:auto"> Autorizo el uso de fotos de las clases</label></div>'
      + '<div id="cf-msg" style="margin-top:10px"></div>'
      + '<div style="margin-top:12px;display:flex;gap:10px"><button class="btn" onclick="Club.enviar()">Enviar inscripcion</button>'
      + '<button class="btn sec" onclick="Club.abrir()">Volver</button></div>'
      + '</div>');
  },
  async enviar(){
    const v = id => (document.getElementById(id) ? (document.getElementById(id).value||'').trim() : '');
    const msg = document.getElementById('cf-msg');
    if(!v('cf-alumno') || !v('cf-tutor') || !v('cf-tel')){
      msg.innerHTML = '<div class="alert err">Falta el nombre del alumno, el tutor o el telefono.</div>'; return;
    }
    msg.innerHTML = '<div class="note">Enviando...</div>';
    const p = {
      group_id: v('cf-grupo'), alumno: v('cf-alumno'), fecha_nacimiento: v('cf-nac') || null,
      edad: v('cf-edad') || null, escuela: v('cf-escuela'), grado: v('cf-grado'),
      tutor: v('cf-tutor'), parentesco: v('cf-par'), telefono: v('cf-tel'), email: v('cf-mail'),
      direccion: v('cf-dir'), salud: v('cf-salud'), comentario: v('cf-com'),
      autoriza_fotos: document.getElementById('cf-fotos').checked
    };
    const { error } = await db.rpc('club_inscribir', { p });
    if(error){ msg.innerHTML = '<div class="alert err">' + esc(error.message) + '</div>'; return; }
    this.pinta(this.barra('Inscripcion enviada')
      + '<div class="card"><div style="font-size:40px">✅</div>'
      + '<div style="font-size:18px;font-weight:700">Listo, recibimos la inscripcion</div>'
      + '<div class="note">La direccion la va a revisar y te vamos a pasar el codigo personal del alumno para entrar a jugar.</div>'
      + '<div style="margin-top:12px"><button class="btn sec" onclick="Club.abrir()">Volver al inicio</button></div></div>');
  },

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
  async entrar(){
    const cod = (document.getElementById('cf-cod').value||'').trim().toUpperCase();
    const msg = document.getElementById('ce-msg');
    if(cod.length < 4){ msg.innerHTML = '<div class="alert err">Escribi tu codigo completo.</div>'; return; }
    msg.innerHTML = '<div class="note">Buscando...</div>';
    const { data, error } = await db.rpc('club_entrar', { p_codigo: cod });
    if(error || !data || data.error){
      msg.innerHTML = '<div class="alert err">Ese codigo no existe. Pedile ayuda a tu profe.</div>'; return;
    }
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
  volverMapa(){ this.recargar().then(() => this.mapa()); },

  /* ============ PANEL DE ADMIN Y DIRECCION ============ */
  async vPanel(){
    const cont = document.getElementById('view');
    if(cont) cont.innerHTML = '<div class="card"><div class="spinner">Cargando el club...</div></div>';
    const { data, error } = await db.rpc('club_panel');
    if(error){ if(cont) cont.innerHTML = '<div class="alert err">' + esc(error.message) + '</div>'; return; }
    this.panel = data;
    this.anio = data.anio || this.anio;
    this.mesNum = data.mes_num || this.mesNum;
    this.pintaPanel();
  },
  pintaPanel(){
    const d = this.panel, cont = document.getElementById('view');
    if(!cont) return;
    const pend = (d.inscripciones||[]).filter(r => r.estado === 'pendiente');
    const resto = (d.inscripciones||[]).filter(r => r.estado !== 'pendiente');

    const grupos = (d.grupos||[]).map(g =>
      '<div class="card" style="flex:1;min-width:230px">'
      + '<div style="font-weight:700">' + esc(g.nombre) + '</div>'
      + '<div class="note">' + g.edad_min + ' a ' + g.edad_max + ' anos - ' + (g.alumnos||0) + ' alumnos</div>'
      + '<div style="margin-top:6px"><span class="tag blue">' + esc(g.dias||'') + '</span> <span class="tag green">' + esc(g.horario||'') + '</span></div>'
      + '<div style="margin-top:6px;font-weight:600">' + gs(g.cuota) + ' / mes</div></div>').join('');

    const fInsc = r =>
      '<div class="card" style="border-left:4px solid ' + (r.estado==='pendiente' ? '#D5803B' : (r.estado==='aceptado' ? '#46A171' : '#E56458')) + '">'
      + '<div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap">'
      + '<div><div style="font-weight:700;font-size:16px">' + esc(r.alumno) + '</div>'
      + '<div class="note">' + (r.edad ? r.edad + ' anos - ' : '') + esc(r.grupo||'sin grupo') + ' - ' + esc(r.fecha||'') + '</div></div>'
      + '<div><span class="tag ' + (r.estado==='pendiente'?'orange':(r.estado==='aceptado'?'green':'red')) + '">' + esc(r.estado) + '</span></div></div>'
      + '<div class="grid2" style="margin-top:8px;font-size:14px">'
      + '<div><b>Tutor:</b> ' + esc(r.tutor||'-') + (r.parentesco ? ' (' + esc(r.parentesco) + ')' : '') + '</div>'
      + '<div><b>Telefono:</b> ' + esc(r.telefono||'-') + '</div>'
      + '<div><b>Correo:</b> ' + esc(r.email||'-') + '</div>'
      + '<div><b>Escuela:</b> ' + esc(r.escuela||'-') + ' ' + esc(r.grado||'') + '</div>'
      + '<div><b>Direccion:</b> ' + esc(r.direccion||'-') + '</div>'
      + '<div><b>Salud:</b> ' + esc(r.salud||'-') + '</div>'
      + '<div><b>Fotos:</b> ' + (r.autoriza_fotos ? 'autoriza' : 'no autoriza') + '</div>'
      + (r.comentario ? '<div><b>Comentario:</b> ' + esc(r.comentario) + '</div>' : '')
      + '</div>'
      + (r.estado==='pendiente'
          ? '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">'
            + '<button class="btn ok sm" onclick="Club.aceptar(\'' + r.id + '\',\'' + (r.group_id||'') + '\')">Aceptar y generar codigo</button>'
            + '<button class="btn dan sm" onclick="Club.rechazar(\'' + r.id + '\')">Rechazar</button></div>'
          : '')
      + '</div>';

    const fAlu = a => {
      const saldo = Number(a.saldo_mes||0);
      const estado = a.al_dia ? '<span class="tag green">al dia</span>'
        : (Number(a.pagado_mes||0) > 0 ? '<span class="tag orange">parcial</span>' : '<span class="tag red">debe</span>');
      return '<tr>'
        + '<td><b>' + esc(a.nombre) + '</b><div class="note">' + esc(a.grupo||'') + '</div></td>'
        + '<td><b style="letter-spacing:2px">' + esc(a.codigo) + '</b> '
        + '<button class="btn sm sec" onclick="Club.copiar(\'' + esc(a.codigo) + '\')">copiar</button></td>'
        + '<td>' + (a.aprobadas||0) + '/' + (a.total_lecciones||0) + '<div class="note">' + (a.puntos||0) + ' ⭐</div></td>'
        + '<td>' + gs(a.pagado_mes) + ' de ' + gs(a.cuota) + '<div class="note">' + (saldo > 0 ? 'falta ' + gs(saldo) : 'completo') + '</div></td>'
        + '<td>' + estado + '<div class="note">' + esc(a.ultimo_pago||'sin pagos') + '</div></td>'
        + '<td style="white-space:nowrap">'
        + '<button class="btn sm" onclick="Club.abono(\'' + a.id + '\',20000)">+20.000</button> '
        + '<button class="btn sm sec" onclick="Club.formAbono(\'' + a.id + '\',\'' + esc(a.nombre) + '\')">otro monto</button> '
        + '<button class="btn sm sec" onclick="Club.cuenta(\'' + a.id + '\',\'' + esc(a.nombre) + '\')">cuenta</button>'
        + '</td></tr>';
    };

    cont.innerHTML =
      '<div class="card" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">'
      + '<div><div style="font-size:19px;font-weight:700">🎮 Club de informatica</div>'
      + '<div class="note">Datos separados del registro escolar. Mes en curso: ' + MESES[(this.mesNum||1)-1] + ' ' + this.anio + '</div></div>'
      + '<div><span class="tag blue">Inscripcion: ' + location.origin + location.pathname + '#club</span></div></div>'
      + '<div class="row">' + grupos + '</div>'
      + '<h3 style="margin-top:18px">Inscripciones pendientes (' + pend.length + ')</h3>'
      + (pend.length ? pend.map(fInsc).join('') : '<div class="note">No hay inscripciones pendientes.</div>')
      + '<h3 style="margin-top:18px">Alumnos del club y cuotas</h3>'
      + '<div id="club-msg"></div>'
      + '<div class="card" style="overflow:auto"><table>'
      + '<tr><th>Alumno</th><th>Codigo</th><th>Avance</th><th>Mes actual</th><th>Estado</th><th>Registrar</th></tr>'
      + ((d.alumnos||[]).length ? d.alumnos.map(fAlu).join('') : '<tr><td colspan="6" class="note">Todavia no hay alumnos aceptados.</td></tr>')
      + '</table></div>'
      + '<h3 style="margin-top:18px">Historial de inscripciones (' + resto.length + ')</h3>'
      + (resto.length ? resto.map(fInsc).join('') : '<div class="note">Sin registros.</div>');
  },

  copiar(t){ navigator.clipboard.writeText(t); const m = document.getElementById('club-msg'); if(m) m.innerHTML = '<div class="alert ok">Codigo ' + esc(t) + ' copiado.</div>'; },

  async aceptar(id, grupo){
    const { data, error } = await db.rpc('club_aceptar', { p_request: id, p_group: grupo || null });
    if(error){ alert(error.message); return; }
    await this.vPanel();
    const m = document.getElementById('club-msg');
    if(m && data) m.innerHTML = '<div class="alert ok">Alumno aceptado. Su codigo es <b style="letter-spacing:3px">' + esc(data.codigo||'') + '</b> - pasaselo a la familia.</div>';
  },
  async rechazar(id){
    if(!confirm('Rechazar esta inscripcion?')) return;
    const { error } = await db.rpc('club_rechazar', { p_request: id });
    if(error){ alert(error.message); return; }
    this.vPanel();
  },

  /* ---- abonos ---- */
  async abono(sid, monto, mes, medio, nota, fecha){
    const { data, error } = await db.rpc('club_pagar', {
      p_student: sid, p_anio: this.anio, p_mes: mes || this.mesNum,
      p_monto: monto, p_medio: medio || 'efectivo', p_nota: nota || null, p_fecha: fecha || null
    });
    if(error){ alert(error.message); return; }
    await this.vPanel();
    const m = document.getElementById('club-msg');
    if(m && data) m.innerHTML = '<div class="alert ok">Abono de ' + gs(monto) + ' registrado. Lleva pagado ' + gs(data.pagado)
      + ' de ' + gs(data.cuota) + (Number(data.saldo) > 0 ? ' - falta ' + gs(data.saldo) : ' - cuota completa ✅') + '</div>';
  },
  formAbono(sid, nombre){
    const meses = MESES.map((m,i) => '<option value="' + (i+1) + '"' + ((i+1)===this.mesNum?' selected':'') + '>' + m + '</option>').join('');
    const m = document.getElementById('club-msg');
    m.innerHTML = '<div class="card" style="background:#E5F2FC">'
      + '<div style="font-weight:700">Registrar abono de ' + esc(nombre) + '</div>'
      + '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px">'
      + '<div style="min-width:120px"><label>Mes</label><select id="ab-mes">' + meses + '</select></div>'
      + '<div style="min-width:120px"><label>Monto</label><input id="ab-monto" type="number" step="1000" value="20000"></div>'
      + '<div style="min-width:120px"><label>Medio</label><input id="ab-medio" value="efectivo"></div>'
      + '<div style="min-width:140px"><label>Fecha</label><input id="ab-fecha" type="date"></div>'
      + '<div style="min-width:140px"><label>Nota</label><input id="ab-nota"></div>'
      + '</div>'
      + '<div style="margin-top:10px;display:flex;gap:8px">'
      + '<button class="btn sm" onclick="Club.abono(\'' + sid + '\', Number(document.getElementById(\'ab-monto\').value), Number(document.getElementById(\'ab-mes\').value), document.getElementById(\'ab-medio\').value, document.getElementById(\'ab-nota\').value, document.getElementById(\'ab-fecha\').value||null)">Guardar abono</button>'
      + '<button class="btn sm sec" onclick="document.getElementById(\'club-msg\').innerHTML=\'\'">Cancelar</button></div></div>';
  },
  async cuenta(sid, nombre){
    const { data, error } = await db.rpc('club_cuenta', { p_student: sid, p_anio: this.anio });
    if(error){ alert(error.message); return; }
    const filas = (data.meses||[]).map(m => {
      const tag = m.estado==='completo' ? '<span class="tag green">completo</span>'
        : (m.estado==='parcial' ? '<span class="tag orange">parcial</span>' : '<span class="tag gray">pendiente</span>');
      const abonos = (m.abonos||[]).map(x =>
        '<div class="note">' + esc(x.fecha||'') + ' - ' + gs(x.monto) + ' (' + esc(x.medio||'-') + ') '
        + '<a href="#" onclick="Club.quitarAbono(\'' + x.id + '\',\'' + sid + '\',\'' + esc(nombre) + '\');return false">quitar</a></div>').join('');
      return '<tr><td>' + MESES[m.mes-1] + '</td><td>' + gs(m.pagado) + '</td><td>' + gs(m.saldo) + '</td><td>' + tag + '</td><td>' + (abonos||'<span class="note">-</span>') + '</td></tr>';
    }).join('');
    document.getElementById('club-msg').innerHTML =
      '<div class="card"><div style="display:flex;justify-content:space-between;flex-wrap:wrap">'
      + '<div style="font-weight:700">Cuenta de ' + esc(nombre) + ' - ' + data.anio + '</div>'
      + '<div class="note">Cuota mensual ' + gs(data.cuota) + '</div></div>'
      + '<table style="margin-top:8px">'
      + '<tr><th>Mes</th><th>Pagado</th><th>Saldo</th><th>Estado</th><th>Abonos</th></tr>'
      + filas + '</table>'
      + '<div style="margin-top:10px"><button class="btn sm sec" onclick="document.getElementById(\'club-msg\').innerHTML=\'\'">Cerrar</button></div></div>';
  },
  async quitarAbono(id, sid, nombre){
    if(!confirm('Quitar este abono?')) return;
    const { error } = await db.rpc('club_quitar_abono', { p_id: id });
    if(error){ alert(error.message); return; }
    await this.vPanel();
    this.cuenta(sid, nombre);
  }
};

/* ===== Pestana "Club" para admin y direccion ===== */
(function(){
  if(typeof UI === 'undefined') return;
  const menus = UI.menus.bind(UI);
  UI.menus = function(){
    const m = menus();
    try{
      const rol = (typeof St !== 'undefined' && St.perfil) ? St.perfil.role : '';
      if((rol === 'admin' || rol === 'director') && Array.isArray(m) && !m.some(x => x[0] === 'club')){
        m.push(['club','🎮 Club de informatica']);
      }
    }catch(e){}
    return m;
  };
  const ir = UI.ir.bind(UI);
  UI.ir = function(k){
    if(k === 'club'){ if(typeof St !== 'undefined') St.tab = 'club'; return Club.vPanel(); }
    return ir(k);
  };
})();

/* ===== Acceso publico desde la pantalla de login y por #club ===== */
(function(){
  function tarjeta(){
    const s = document.getElementById('screen-login');
    if(!s || document.getElementById('club-card')) return;
    const d = document.createElement('div');
    d.id = 'club-card';
    d.className = 'card';
    d.style.cssText = 'text-align:center;cursor:pointer';
    d.innerHTML = '<div style="font-size:30px">🎮</div>'
      + '<div style="font-weight:700">Club de informatica</div>'
      + '<div class="note">Sabados - 7 a 11 anos de 09:00 a 10:00 y 12 anos en adelante de 10:00 a 11:00. Inscribite o entra con tu codigo.</div>';
    d.onclick = () => Club.abrir();
    s.appendChild(d);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tarjeta);
  else tarjeta();
  function porHash(){ if(location.hash === '#club') Club.abrir(); }
  window.addEventListener('hashchange', porHash);
  setTimeout(porHash, 300);
})();
