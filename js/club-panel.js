/* Club de informatica - panel de admin y direccion (cargar despues de club.js) */
Object.assign(Club, {
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
      + '<div><span class="tag blue">Inscripcion: ' + location.origin + location.pathname.replace(/index\.html?$/,'').replace(/\/$/,'') + '/club</span></div></div>'
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
  }
});
