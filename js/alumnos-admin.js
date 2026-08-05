/* Gestión de alumnos de la plataforma: editar, agregar y quitar (admin/dirección) */
const Alumnos = {
  async vGestion(){
    const cont = document.getElementById('view');
    if(cont) cont.innerHTML = '<div class="card"><div class="spinner">Cargando alumnos...</div></div>';
    const [{ data: lista, error }, { data: cursos }] = await Promise.all([
      db.rpc('admin_students_list'),
      db.from('courses').select('id, nombre').order('nombre')
    ]);
    if(error){ if(cont) cont.innerHTML = '<div class="alert err">' + esc(error.message) + '</div>'; return; }
    this.lista = lista || [];
    this.cursos = cursos || [];
    this.pinta();
  },
  pinta(){
    const cont = document.getElementById('view');
    if(!cont) return;
    const ops = this.cursos.map(c => '<option value="' + c.id + '">' + esc(c.nombre) + '</option>').join('');
    const filas = this.lista.map(a => {
      const cursos = (a.cursos||[]).map(c => c.nombre).join(', ') || '<span class="note">sin curso</span>';
      return '<tr>'
        + '<td><b>' + esc(a.nombre) + '</b><div class="note">' + cursos + (a.documento ? ' · ' + esc(a.documento) : '') + (a.nivel_apoyo ? ' · apoyo: ' + esc(a.nivel_apoyo) : '') + '</div></td>'
        + '<td>' + (a.activo ? '<span class="tag green">activo</span>' : '<span class="tag gray">inactivo</span>') + '</td>'
        + '<td style="white-space:nowrap">'
        + '<button class="btn sm sec" onclick="Alumnos.formulario(\'' + a.id + '\')">editar</button> '
        + '<button class="btn sm ' + (a.activo ? 'dan' : 'ok') + '" onclick="Alumnos.toggle(\'' + a.id + '\',' + (a.activo?'false':'true') + ')">' + (a.activo ? 'quitar' : 'activar') + '</button>'
        + '</td></tr>';
    }).join('');
    cont.innerHTML =
      '<div class="card" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">'
      + '<div><div style="font-size:19px;font-weight:700">🧒 Alumnos</div>'
      + '<div class="note">Editá los datos de cualquier alumno, agregá nuevos o quitalos en cualquier momento.</div></div>'
      + '<button class="btn" onclick="Alumnos.formulario(null)">+ Agregar alumno</button></div>'
      + '<div id="al-msg"></div>'
      + '<div class="card" style="overflow:auto"><table>'
      + '<tr><th>Alumno</th><th>Estado</th><th>Acciones</th></tr>'
      + (filas || '<tr><td colspan="3" class="note">Sin alumnos.</td></tr>')
      + '</table></div>';
    this._ops = ops;
  },
  formulario(id){
    const a = id ? this.lista.find(x => x.id === id) : null;
    const m = document.getElementById('al-msg');
    const cursoId = a && a.cursos && a.cursos[0] ? a.cursos[0].id : '';
    m.innerHTML = '<div class="card" style="background:#E5F2FC">'
      + '<div style="font-weight:700">' + (a ? 'Editar a ' + esc(a.nombre) : 'Agregar alumno') + '</div>'
      + '<div class="grid2" style="margin-top:8px">'
      + '<div><label>Nombre y apellido *</label><input id="al-nom" value="' + (a ? esc(a.nombre) : '') + '"></div>'
      + '<div><label>Documento</label><input id="al-doc" value="' + (a && a.documento ? esc(a.documento) : '') + '"></div>'
      + '<div><label>Curso</label><select id="al-curso"><option value="">(sin cambiar)</option>' + this._ops + '</select></div>'
      + '<div><label>Nivel de apoyo</label><select id="al-apoyo"><option value="">(ninguno)</option>'
      + '<option value="lee"' + (a && a.nivel_apoyo==='lee' ? ' selected' : '') + '>lee</option>'
      + '<option value="no_lee"' + (a && a.nivel_apoyo==='no_lee' ? ' selected' : '') + '>no_lee</option>'
      + '<option value="apoyo"' + (a && a.nivel_apoyo==='apoyo' ? ' selected' : '') + '>apoyo</option></select></div>'
      + '</div>'
      + '<div style="margin-top:10px;display:flex;gap:8px">'
      + '<button class="btn sm" onclick="Alumnos.guardar(' + (a ? ('\'' + a.id + '\'') : 'null') + ')">' + (a ? 'Guardar cambios' : 'Agregar') + '</button>'
      + '<button class="btn sm sec" onclick="document.getElementById(\'al-msg\').innerHTML=\'\'">Cancelar</button></div></div>';
    const sel = document.getElementById('al-curso');
    if(sel && cursoId) sel.value = cursoId;
  },
  async guardar(id){
    const nom = document.getElementById('al-nom').value;
    const doc = document.getElementById('al-doc').value;
    const curso = document.getElementById('al-curso').value || null;
    const apoyo = document.getElementById('al-apoyo').value || null;
    if(!nom.trim()){ alert('El nombre es obligatorio.'); return; }
    const { error } = await db.rpc('admin_student_save', {
      p_id: id, p_nombre: nom, p_documento: doc || null, p_course: curso, p_nivel_apoyo: apoyo
    });
    if(error){ alert(error.message); return; }
    this.vGestion();
    const m = document.getElementById('al-msg');
    if(m) m.innerHTML = '<div class="alert ok">' + (id ? 'Cambios guardados.' : 'Alumno agregado.') + '</div>';
  },
  async toggle(id, activar){
    const { error } = await db.rpc('admin_student_save', { p_id: id, p_nombre: this.nombreDe(id), p_activo: activar });
    if(error){ alert(error.message); return; }
    this.vGestion();
  },
  nombreDe(id){ const a = this.lista.find(x => x.id === id); return a ? a.nombre : ''; }
};

/* Pestaña "Alumnos" para admin y dirección */
(function(){
  if(typeof UI === 'undefined') return;
  const menus = UI.menus.bind(UI);
  UI.menus = function(){
    const m = menus();
    try{
      const rol = (typeof St !== 'undefined' && St.perfil) ? St.perfil.role : '';
      if((rol === 'admin' || rol === 'director') && Array.isArray(m) && !m.some(x => x[0] === 'alumnos')){
        m.push(['alumnos','🧒 Alumnos']);
      }
    }catch(e){}
    return m;
  };
  const ir = UI.ir.bind(UI);
  UI.ir = function(k){
    if(k === 'alumnos'){ if(typeof St !== 'undefined') St.tab = 'alumnos'; return Alumnos.vGestion(); }
    return ir(k);
  };
})();
