/* Club de informatica - acciones del panel: codigos y abonos (cargar despues de club-panel.js) */
Object.assign(Club, {
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
});

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
