/* Club - auditoría de accesos y gestión de alumnos del club (admin/dirección) */
const ClubAud = {
  async vAuditoria(){
    const cont = document.getElementById('view');
    if(cont) cont.innerHTML = '<div class="card"><div class="spinner">Cargando auditoria...</div></div>';
    const { data, error } = await db.rpc('club_accesos_panel');
    if(error){ if(cont) cont.innerHTML = '<div class="alert err">' + esc(error.message) + '</div>'; return; }
    this.panel = data;
    this.pinta();
  },
  pinta(){
    const d = this.panel, cont = document.getElementById('view');
    if(!cont) return;
    const fAlu = a => {
      const sospe = Number(a.sospechosos||0);
      return '<tr>'
        + '<td><b>' + esc(a.nombre) + '</b><div class="note">' + esc(a.grupo||'') + ' · ' + esc(a.codigo) + '</div></td>'
        + '<td>' + (a.activo ? '<span class="tag green">activo</span>' : '<span class="tag gray">inactivo</span>') + '</td>'
        + '<td>' + (a.device_registrado ? '<span class="tag blue">1 equipo</span>' : '<span class="tag gray">sin registrar</span>')
        + '<div class="note">' + (a.ultimo_acceso ? ('ultimo: ' + String(a.ultimo_acceso).slice(0,16).replace('T',' ')) : 'nunca') + '</div></td>'
        + '<td>' + (a.accesos||0) + (sospe > 0 ? ' <span class="tag red">' + sospe + ' sospechoso' + (sospe>1?'s':'') + '</span>' : '') + '</td>'
        + '<td style="white-space:nowrap">'
        + '<button class="btn sm sec" onclick="ClubAud.editar(\'' + a.id + '\',\'' + esc(a.nombre) + '\',' + (a.activo?'true':'false') + ')">editar</button> '
        + '<button class="btn sm sec" onclick="ClubAud.liberar(\'' + a.id + '\',\'' + esc(a.nombre) + '\')">liberar equipo</button> '
        + (a.activo ? '<button class="btn sm" onclick="ClubAud.regenerar(\'' + a.id + '\',\'' + esc(a.nombre) + '\')">nuevo código</button> ' : '')
        + (a.activo ? '<button class="btn sm dan" onclick="ClubAud.quitar(\'' + a.id + '\',\'' + esc(a.nombre) + '\')">quitar</button>' : '')
        + '</td></tr>';
    };
    const fAcc = x => '<tr><td>' + String(x.fecha||'').slice(0,16).replace('T',' ') + '</td>'
      + '<td>' + esc(x.nombre) + '</td>'
      + '<td class="note">' + esc((x.device||'').slice(0,14)) + '</td>'
      + '<td>' + (x.sospechoso ? '<span class="tag red">bloqueado</span>' : '<span class="tag green">ok</span>') + '</td></tr>';
    const fAud = x => '<tr><td>' + String(x.fecha||'').slice(0,16).replace('T',' ') + '</td>'
      + '<td><b>' + esc(x.accion) + '</b></td>'
      + '<td class="note">' + esc(x.actor||'-') + '</td>'
      + '<td class="note">' + esc(JSON.stringify(x.detalle||{})) + '</td></tr>';

    cont.innerHTML =
      '<div class="card"><div style="font-size:19px;font-weight:700">🛡️ Auditoría del club</div>'
      + '<div class="note">Cada código queda ligado a una computadora. El administrador puede liberar el equipo o generar un código nuevo sin borrar el avance del alumno.</div></div>'
      + '<h3>Alumnos del club y su acceso</h3>'
      + '<div id="ca-msg"></div>'
      + '<div class="card" style="overflow:auto"><table>'
      + '<tr><th>Alumno</th><th>Estado</th><th>Equipo</th><th>Accesos</th><th>Acciones</th></tr>'
      + ((d.alumnos||[]).length ? d.alumnos.map(fAlu).join('') : '<tr><td colspan="5" class="note">Sin alumnos.</td></tr>')
      + '</table></div>'
      + '<h3 style="margin-top:16px">Ultimos accesos</h3>'
      + '<div class="card" style="overflow:auto"><table>'
      + '<tr><th>Fecha</th><th>Alumno</th><th>Equipo</th><th>Resultado</th></tr>'
      + ((d.accesos||[]).length ? d.accesos.map(fAcc).join('') : '<tr><td colspan="4" class="note">Sin accesos aun.</td></tr>')
      + '</table></div>'
      + '<h3 style="margin-top:16px">Auditoria de acciones</h3>'
      + '<div class="card" style="overflow:auto"><table>'
      + '<tr><th>Fecha</th><th>Accion</th><th>Hecha por</th><th>Detalle</th></tr>'
      + ((d.auditoria||[]).length ? d.auditoria.map(fAud).join('') : '<tr><td colspan="4" class="note">Sin acciones aun.</td></tr>')
      + '</table></div>';
  },
  async liberar(id, nombre){
    if(!confirm('Liberar el equipo registrado de ' + nombre + '? Va a poder entrar desde otra computadora con el mismo código.')) return;
    const { error } = await db.rpc('club_liberar_dispositivo', { p_student: id });
    if(error){ alert(error.message); return; }
    await this.vAuditoria();
    const m = document.getElementById('ca-msg');
    if(m) m.innerHTML = '<div class="alert ok">Equipo liberado. ' + esc(nombre) + ' puede entrar desde una nueva computadora con el mismo código.</div>';
  },
  async regenerar(id, nombre){
    if(!confirm('Generar un código nuevo para ' + nombre + '? El código anterior dejará de funcionar, se liberará el equipo y el avance se conservará.')) return;
    const { data, error } = await db.rpc('club_regenerar_codigo', { p_student: id });
    if(error){ alert(error.message); return; }
    await this.vAuditoria();
    const m = document.getElementById('ca-msg');
    if(m) m.innerHTML = '<div class="alert ok"><b>Nuevo código para ' + esc(data.nombre||nombre) + ':</b> '
      + '<span class="code" style="display:inline-block;font-size:25px;margin:4px 10px">' + esc(data.codigo) + '</span>'
      + '<button class="btn sm" onclick="ClubAud.copiarCodigo(\'' + esc(data.codigo) + '\')">copiar código</button>'
      + '<div class="note">El código anterior ya no funciona. El alumno mantiene todas sus misiones, puntos y evidencias.</div></div>';
  },
  copiarCodigo(codigo){
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(codigo).then(() => alert('Código copiado: ' + codigo));
    }else{
      prompt('Copiá el nuevo código:', codigo);
    }
  },
  editar(id, nombre, activo){
    const m = document.getElementById('ca-msg');
    m.innerHTML = '<div class="card" style="background:#E5F2FC">'
      + '<div style="font-weight:700">Editar a ' + esc(nombre) + '</div>'
      + '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px">'
      + '<div style="min-width:200px"><label>Nombre</label><input id="ce-nom" value="' + esc(nombre) + '"></div>'
      + '<div style="min-width:120px"><label>Estado</label><select id="ce-act"><option value="true"' + (activo?' selected':'') + '>activo</option><option value="false"' + (activo?'':' selected') + '>inactivo</option></select></div>'
      + '</div>'
      + '<div style="margin-top:10px;display:flex;gap:8px">'
      + '<button class="btn sm" onclick="ClubAud.guardar(\'' + id + '\')">Guardar</button>'
      + '<button class="btn sm sec" onclick="document.getElementById(\'ca-msg\').innerHTML=\'\'">Cancelar</button></div></div>';
  },
  async guardar(id){
    const nom = document.getElementById('ce-nom').value;
    const act = document.getElementById('ce-act').value === 'true';
    const { error } = await db.rpc('club_alumno_guardar', { p_student: id, p_nombre: nom, p_activo: act });
    if(error){ alert(error.message); return; }
    this.vAuditoria();
  },
  async quitar(id, nombre){
    if(!confirm('Quitar a ' + nombre + ' del club? Quedara inactivo y no podra entrar.')) return;
    const { error } = await db.rpc('club_alumno_quitar', { p_student: id });
    if(error){ alert(error.message); return; }
    this.vAuditoria();
  }
};

(function(){
  if(typeof UI === 'undefined') return;
  const menus = UI.menus.bind(UI);
  UI.menus = function(){
    const m = menus();
    try{
      const rol = (typeof St !== 'undefined' && St.perfil) ? St.perfil.role : '';
      if((rol === 'admin' || rol === 'director') && Array.isArray(m) && !m.some(x => x[0] === 'audclub')){
        m.push(['audclub','🛡️ Auditoría club']);
      }
    }catch(e){}
    return m;
  };
  const ir = UI.ir.bind(UI);
  UI.ir = function(k){
    if(k === 'audclub'){ if(typeof St !== 'undefined') St.tab = 'audclub'; return ClubAud.vAuditoria(); }
    return ir(k);
  };
})();
