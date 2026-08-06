/* Gestion de alumnos por pestanas: grados, sin curso e inactivos (admin/direccion) */
const Alumnos = {
  lista: [],
  cursos: [],
  filtro: 'todos',
  busca: '',
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

  /* ---------- pestanas ---------- */
  pestanas(){
    const activos = this.lista.filter(a => a.activo);
    const grupos = [];
    const vistos = {};
    activos.forEach(a => {
      const suyos = (a.cursos && a.cursos.length) ? a.cursos : [null];
      suyos.forEach(c => {
        const id = c ? ('c:' + c.id) : 'sincurso';
        const nombre = c ? c.nombre : 'Sin curso';
        if(!vistos[id]){ vistos[id] = { id: id, nombre: nombre, n: 0 }; grupos.push(vistos[id]); }
        vistos[id].n++;
      });
    });
    grupos.sort(function(x, y){
      if(x.id === 'sincurso') return 1;
      if(y.id === 'sincurso') return -1;
      return x.nombre.localeCompare(y.nombre, 'es', { numeric: true });
    });
    const inactivos = this.lista.filter(a => !a.activo).length;
    return [{ id:'todos', nombre:'Todos', n: activos.length }]
      .concat(grupos)
      .concat([{ id:'inactivos', nombre:'Inactivos', n: inactivos }]);
  },
  filtrados(){
    const t = (this.busca || '').trim().toLowerCase();
    const f = this.filtro;
    return this.lista.filter(a => {
      if(f === 'inactivos'){ if(a.activo) return false; }
      else if(!a.activo){ return false; }
      const cursos = a.cursos || [];
      if(f === 'sincurso' && cursos.length) return false;
      if(f.indexOf('c:') === 0 && !cursos.some(c => c.id === f.slice(2))) return false;
      if(t){
        const txt = (a.nombre + ' ' + (a.documento || '') + ' ' + cursos.map(c => c.nombre).join(' ')).toLowerCase();
        if(txt.indexOf(t) < 0) return false;
      }
      return true;
    }).sort((x, y) => x.nombre.localeCompare(y.nombre, 'es', { numeric: true }));
  },
  ver(id){ this.filtro = id; this.pintaTabs(); this.pintaTabla(); },
  buscar(v){ this.busca = v; this.pintaTabla(); },

  /* ---------- pintado ---------- */
  pinta(){
    const cont = document.getElementById('view');
    if(!cont) return;
    this._ops = this.cursos.map(c => '<option value="' + c.id + '">' + esc(c.nombre) + '</option>').join('');
    cont.innerHTML =
      '<div class="card" style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:12px">'
      + '<div><div style="font-size:19px;font-weight:700">Alumnos</div>'
      + '<div class="note">Estan separados por grado. Editalos, agrega nuevos o quitalos en cualquier momento.</div></div>'
      + '<div style="display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap">'
      + '<div><label for="al-busca">Buscar</label>'
      + '<input id="al-busca" type="search" placeholder="Nombre o documento" autocomplete="off" oninput="Alumnos.buscar(this.value)"></div>'
      + '<button class="btn" onclick="Alumnos.formulario(null)">+ Agregar alumno</button></div></div>'
      + '<div id="al-msg"></div>'
      + '<div id="al-tabs" class="card" style="display:flex;gap:8px;flex-wrap:wrap" role="tablist" aria-label="Listas de alumnos por grado"></div>'
      + '<div id="al-tabla"></div>';
    this.pintaTabs();
    this.pintaTabla();
  },
  pintaTabs(){
    const cont = document.getElementById('al-tabs');
    if(!cont) return;
    cont.innerHTML = this.pestanas().map(p => {
      const activa = p.id === this.filtro;
      return '<button role="tab" aria-selected="' + (activa ? 'true' : 'false') + '"'
        + ' class="btn sm' + (activa ? '' : ' sec') + '"'
        + ' onclick="Alumnos.ver(\'' + p.id + '\')">'
        + esc(p.nombre) + ' (' + p.n + ')</button>';
    }).join('');
  },
  pintaTabla(){
    const cont = document.getElementById('al-tabla');
    if(!cont) return;
    const lista = this.filtrados();
    const filas = lista.map(a => {
      const cursos = (a.cursos || []).map(c => esc(c.nombre)).join(', ') || '<span class="note">sin curso</span>';
      const extra = [];
      if(a.documento) extra.push('doc. ' + esc(a.documento));
      if(a.nivel_apoyo) extra.push('apoyo: ' + esc(a.nivel_apoyo));
      return '<tr>'
        + '<td><b>' + esc(a.nombre) + '</b>'
        + (extra.length ? '<div class="note">' + extra.join(' &middot; ') + '</div>' : '') + '</td>'
        + '<td>' + cursos + '</td>'
        + '<td>' + (a.activo ? '<span class="tag green">activo</span>' : '<span class="tag gray">inactivo</span>') + '</td>'
        + '<td style="white-space:nowrap">'
        + '<button class="btn sm sec" onclick="Alumnos.formulario(\'' + a.id + '\')">editar</button> '
        + '<button class="btn sm ' + (a.activo ? 'dan' : 'ok') + '" onclick="Alumnos.toggle(\'' + a.id + '\',' + (a.activo ? 'false' : 'true') + ')">'
        + (a.activo ? 'quitar' : 'activar') + '</button>'
        + '</td></tr>';
    }).join('');
    cont.innerHTML = '<div class="card" style="overflow:auto">'
      + '<div class="note" style="margin-bottom:8px">' + lista.length + ' alumno' + (lista.length === 1 ? '' : 's') + ' en esta lista.</div>'
      + '<table><tr><th>Alumno</th><th>Grado</th><th>Estado</th><th>Acciones</th></tr>'
      + (filas || '<tr><td colspan="4" class="note">No hay alumnos en esta lista.</td></tr>')
      + '</table></div>';
  },

  /* ---------- alta y edicion ---------- */
  formulario(id){
    const a = id ? this.lista.find(x => x.id === id) : null;
    const m = document.getElementById('al-msg');
    if(!m) return;
    const cursoId = a && a.cursos && a.cursos[0] ? a.cursos[0].id : '';
    m.innerHTML = '<div class="card" style="background:#E5F2FC">'
      + '<div style="font-weight:700">' + (a ? 'Editar a ' + esc(a.nombre) : 'Agregar alumno') + '</div>'
      + '<div class="grid2" style="margin-top:8px">'
      + '<div><label for="al-nom">Nombre y apellido *</label><input id="al-nom" value="' + (a ? esc(a.nombre) : '') + '"></div>'
      + '<div><label for="al-doc">Documento</label><input id="al-doc" value="' + (a && a.documento ? esc(a.documento) : '') + '"></div>'
      + '<div><label for="al-curso">Grado</label><select id="al-curso"><option value="">(sin cambiar)</option>' + this._ops + '</select></div>'
      + '<div><label for="al-apoyo">Nivel de apoyo</label><select id="al-apoyo"><option value="">(ninguno)</option>'
      + '<option value="lee"' + (a && a.nivel_apoyo === 'lee' ? ' selected' : '') + '>lee</option>'
      + '<option value="no_lee"' + (a && a.nivel_apoyo === 'no_lee' ? ' selected' : '') + '>no_lee</option>'
      + '<option value="apoyo"' + (a && a.nivel_apoyo === 'apoyo' ? ' selected' : '') + '>apoyo</option></select></div>'
      + '</div>'
      + '<div style="margin-top:10px;display:flex;gap:8px">'
      + '<button class="btn sm" onclick="Alumnos.guardar(' + (a ? ('\'' + a.id + '\'') : 'null') + ')">' + (a ? 'Guardar cambios' : 'Agregar') + '</button>'
      + '<button class="btn sm sec" onclick="Alumnos.cerrarFormulario()">Cancelar</button></div></div>';
    const sel = document.getElementById('al-curso');
    if(sel && cursoId) sel.value = cursoId;
    const nom = document.getElementById('al-nom');
    if(nom) nom.focus();
  },
  cerrarFormulario(){ const m = document.getElementById('al-msg'); if(m) m.innerHTML = ''; },
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
    await this.vGestion();
    const m = document.getElementById('al-msg');
    if(m) m.innerHTML = '<div class="alert ok">' + (id ? 'Cambios guardados.' : 'Alumno agregado.') + '</div>';
  },
  async toggle(id, activar){
    const { error } = await db.rpc('admin_student_save', { p_id: id, p_nombre: this.nombreDe(id), p_activo: activar });
    if(error){ alert(error.message); return; }
    await this.vGestion();
  },
  nombreDe(id){ const a = this.lista.find(x => x.id === id); return a ? a.nombre : ''; }
};

/* Pestana "Gestion de alumnos" para admin y direccion (clave propia para no chocar con la vista del docente) */
(function(){
  if(typeof UI === 'undefined') return;
  const menus = UI.menus.bind(UI);
  UI.menus = function(){
    const m = menus();
    try{
      const rol = (typeof St !== 'undefined' && St.perfil) ? St.perfil.role : '';
      if((rol === 'admin' || rol === 'director') && Array.isArray(m) && !m.some(x => x[0] === 'gestalumnos')){
        m.push(['gestalumnos', 'Gestion de alumnos']);
      }
    }catch(e){}
    return m;
  };
  const ir = UI.ir.bind(UI);
  UI.ir = function(k){
    if(k === 'gestalumnos'){
      if(typeof St !== 'undefined') St.tab = 'gestalumnos';
      document.querySelectorAll('#nav button').forEach(b => b.setAttribute('aria-selected', b.dataset.k === k));
      return Alumnos.vGestion();
    }
    return ir(k);
  };
})();
