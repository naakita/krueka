/* ==================== KRUEKA · PRIMARIA ====================
   - Materias oficiales por ciclo (1.º a 3.º y 4.º a 6.º)
   - Planeamiento: se tilda el dia, se pone la fecha y se elige la materia
   - Capacidades institucionales L / NL (9 puntos) con aviso al registro anecdotico
   - Tareas, trabajos, examenes parciales y globales
   - Planilla R.S.A. consolidada por materia
============================================================ */

const Prim = {
  materias: [],
  etapa: 1,
  async cargarMaterias(courseId){
    if(!courseId){ Prim.materias = []; return; }
    const { data } = await db.rpc("materias_de_curso", { p_course_id: courseId });
    Prim.materias = data || [];
  },
  selEtapa(fn){
    return '<select onchange="' + fn + '(this.value)">' +
      [1,2,3].map(e=>'<option value="' + e + '"' + (Prim.etapa===e?" selected":"") + '>' + e + '.ª etapa</option>').join("") +
      '</select>';
  },
  cursoActual(){
    const c = KG.cursos();
    if(!Prim.courseId || !c.some(x=>x.id===Prim.courseId)) Prim.courseId = c.length ? c[0].id : null;
    return Prim.courseId;
  },
  selCurso(fn){
    const c = KG.cursos();
    return '<select onchange="' + fn + '(this.value)">' +
      c.map(x=>'<option value="' + x.id + '"' + (x.id===Prim.courseId?" selected":"") + '>' + esc(x.nombre) + '</option>').join("") +
      '</select>';
  },
  selMaterias(valor, onchange){
    if(!Prim.materias.length) return '<input value="' + esc(valor||"") + '" oninput="' + onchange + '">';
    return '<select onchange="' + onchange + '"><option value="">Elegí la materia</option>' +
      Prim.materias.map(m=>'<option' + (m===valor?" selected":"") + '>' + esc(m) + '</option>').join("") +
      (valor && Prim.materias.indexOf(valor) < 0 ? '<option selected>' + esc(valor) + '</option>' : "") +
      '</select>';
  }
};

/* ---------- Planeamiento: tildar el dia y elegir la materia de la lista ---------- */

(function(){
  if(typeof Plan6 === "undefined") return;

  const vista = Plan6.vista.bind(Plan6);
  Plan6.vista = async function(){
    await cargarAsignaciones();
    const c = KG.cursos();
    const cid = Plan6.courseId || (c.length ? c[0].id : null);
    await Prim.cargarMaterias(cid);
    await vista();
  };

  Plan6.diaActivo = function(dia){
    return Plan6.items.some(i=>i.dia === dia);
  };

  Plan6.tildar = function(dia, on){
    if(on){ if(!Plan6.diaActivo(dia)) Plan6.agregar(dia); }
    else { Plan6.items = Plan6.items.filter(i=>i.dia !== dia); Plan6.pintarDias(); }
  };

  Plan6.pintarDias = function(){
    const cont = $("pl-dias");
    if(!cont) return;
    cont.innerHTML = DIAS.slice(0,5).map((d, di)=>{
      const dia = di + 1;
      const fecha = KG.masDias(Plan6.desde, di);
      const on = Plan6.diaActivo(dia);
      const filas = Plan6.items.map((it,i)=>({ it:it, i:i })).filter(x=>x.it.dia === dia);
      return '<div class="card" style="' + (on ? "" : "opacity:.75") + '">' +
        '<div class="row" style="justify-content:space-between;align-items:center">' +
        '<label style="display:flex;align-items:center;gap:9px;margin:0;font-size:16px;color:var(--tx);font-weight:700">' +
        '<input type="checkbox" style="width:19px;height:19px"' + (on?" checked":"") + ' onchange="Plan6.tildar(' + dia + ', this.checked)"> ' + d +
        ' <span class="tag ' + (on?"blue":"gray") + '">' + KG.fecha(fecha) + '</span></label>' +
        (on ? '<button class="btn sec sm" onclick="Plan6.agregar(' + dia + ')">+ Agregar materia</button>' : "") +
        '</div>' +
        (on
          ? (filas.length ? filas.map(x=>Plan6.fila(x.it, x.i)).join("") : '<p class="note" style="margin-top:10px">Agregá la primera materia del día.</p>')
          : '<p class="note" style="margin-top:8px">Día sin clases. Tildá la casilla para cargar las materias.</p>') +
        '</div>';
    }).join("");
  };

  Plan6.fila = function(it, i){
    const inds = (it.indicadores||[]).map(x=>(x.descripcion||"") + (x.puntaje!==undefined && x.puntaje!==null ? "; " + x.puntaje : "")).join("\n");
    const puntos = (it.indicadores||[]).reduce((s,x)=>s + (Number(x.puntaje)||0), 0);
    return '<div style="border:1px solid var(--line);border-radius:10px;padding:12px;margin-top:10px">' +
      '<div class="grid2">' +
      '<div><label>Materia</label>' + Prim.selMaterias(it.materia, "Plan6.set(" + i + ",'materia',this.value)") + '</div>' +
      '<div><label>Tema del día</label><input value="' + esc(it.tema||"") + '" oninput="Plan6.set(' + i + ',\'tema\',this.value)"></div>' +
      '</div>' +
      '<label>Capacidad</label><input value="' + esc(it.capacidad||"") + '" oninput="Plan6.set(' + i + ',\'capacidad\',this.value)">' +
      '<label>Actividades</label><textarea oninput="Plan6.set(' + i + ',\'actividades\',this.value)">' + esc(it.actividades||"") + '</textarea>' +
      '<label>Indicadores diarios del R.S.A. (uno por línea, con el puntaje después del punto y coma)</label>' +
      '<textarea placeholder="Reconoce las partes de la célula; 1" oninput="Plan6.setInd(' + i + ',this.value);Plan6.puntos(' + i + ')">' + esc(inds) + '</textarea>' +
      '<p class="note" id="pl-p-' + i + '">Puntaje del día en esta materia: <b>' + puntos + '</b></p>' +
      '<label>Recursos</label><input value="' + esc(it.recursos||"") + '" oninput="Plan6.set(' + i + ',\'recursos\',this.value)">' +
      '<div style="text-align:right;margin-top:8px"><button class="btn sec sm" onclick="Plan6.quitar(' + i + ')">Quitar esta materia</button></div>' +
      '</div>';
  };

  Plan6.puntos = function(i){
    const el = $("pl-p-" + i);
    if(!el || !Plan6.items[i]) return;
    const t = (Plan6.items[i].indicadores||[]).reduce((s,x)=>s + (Number(x.puntaje)||0), 0);
    el.innerHTML = "Puntaje del día en esta materia: <b>" + t + "</b>";
  };

  Plan6.cambiarCurso = async function(id){
    Plan6.courseId = id;
    await Prim.cargarMaterias(id);
    Plan6.vista();
  };
})();

/* ==================== CAPACIDADES INSTITUCIONALES ==================== */

const Cap = {
  datos: null,
  async vista(){
    await cargarAsignaciones();
    const cid = Prim.cursoActual();
    if(!cid){ $("view").innerHTML = '<div class="card"><p class="sub">Sin cursos asignados.</p></div>'; return; }
    const { data, error } = await db.rpc("capacidades_curso", { p_course_id: cid, p_etapa: Prim.etapa });
    if(error){ $("view").innerHTML = '<div class="card"><p class="alert err">' + esc(error.message) + '</p></div>'; return; }
    Cap.datos = data;
    Cap.pintar();
  },
  pintar(){
    const inds = Cap.datos.indicadores || [];
    const als = Cap.datos.alumnos || [];
    const total = inds.reduce((s,i)=>s + Number(i.puntaje), 0);
    $("view").innerHTML =
      '<h1>Capacidades institucionales</h1>' +
      '<p class="sub">Cada indicador vale 1 punto (' + total + ' puntos en total) y se suma al R.S.A. Marcar <b>NL</b> deja constancia automática en el registro anecdótico con el día y la hora. Con <b>dos o más NL</b> en el mismo indicador el alumno pierde ese punto.</p>' +
      '<div class="card"><div class="row">' +
      '<div style="flex:1;min-width:220px"><label>Grado</label>' + Prim.selCurso("Cap.cambiarCurso") + '</div>' +
      '<div style="flex:1;min-width:160px"><label>Etapa</label>' + Prim.selEtapa("Cap.cambiarEtapa") + '</div>' +
      '</div></div>' +
      '<div class="card"><div style="overflow:auto"><table><thead><tr><th>Alumno</th>' +
      inds.map(i=>'<th title="' + esc(i.descripcion) + '">' + i.orden + '</th>').join("") +
      '<th>Puntos</th></tr></thead><tbody>' +
      als.map(a=>{
        const m = {};
        (a.marcas||[]).forEach(x=>{ m[x.indicator_id] = x; });
        return '<tr><td>' + esc(a.alumno) + '</td>' +
          inds.map(i=>{
            const x = m[i.id];
            const nl = x ? Number(x.nl) : 0;
            const cls = nl >= 2 ? "red" : (nl === 1 ? "orange" : "green");
            const txt = nl >= 1 ? "NL×" + nl : "L";
            return '<td style="text-align:center"><button class="tag ' + cls + '" style="border:0;cursor:pointer" ' +
              'title="' + esc(i.descripcion) + (x && x.motivo ? " · " + esc(x.motivo) : "") + '" ' +
              'onclick="Cap.marcar(\'' + a.student_id + '\',\'' + i.id + '\',\'' + esc(a.alumno).replace(/'/g,"") + '\')">' + txt + '</button></td>';
          }).join("") +
          '<td><b>' + Number(a.puntos) + '</b>/' + total + '</td></tr>';
      }).join("") +
      '</tbody></table></div>' +
      '<div class="row" style="margin-top:10px"><button class="btn sec sm" onclick="Cap.exportar()">Descargar en Excel</button></div></div>' +
      '<div class="card"><h2>Referencia de los indicadores</h2><ol>' +
      inds.map(i=>'<li>' + esc(i.descripcion) + ' <span class="note">(' + Number(i.puntaje) + ' punto)</span></li>').join("") +
      '</ol><p class="note">La dirección o el administrador pueden cambiar la redacción de estos indicadores.</p></div>';
  },
  async marcar(studentId, indicatorId, alumno){
    const q = prompt("Alumno: " + alumno + "\n\nEscribí el motivo para marcar NO LOGRADO (NL).\nDejá vacío y aceptá para marcar LOGRADO (L).");
    if(q === null) return;
    const valor = q.trim() ? "NL" : "L";
    const { data, error } = await db.rpc("marcar_institucional", {
      p_student_id: studentId, p_course_id: Prim.courseId, p_indicator_id: indicatorId,
      p_valor: valor, p_motivo: q.trim() || null, p_etapa: Prim.etapa, p_course_subject_id: null
    });
    if(error){ alert("No se pudo marcar: " + error.message); return; }
    if(data && data.pierde_punto) aviso("Ya son " + data.nl + " NL en ese indicador: el alumno pierde ese punto.", "err");
    else if(valor === "NL") aviso("NL registrado. Quedó asentado en el registro anecdótico con el día y la hora.");
    else aviso("Logro registrado.");
    Cap.vista();
  },
  cambiarCurso(id){ Prim.courseId = id; Cap.vista(); },
  cambiarEtapa(e){ Prim.etapa = Number(e); Cap.vista(); },
  exportar(){
    const inds = Cap.datos.indicadores || [];
    const filas = [["Alumno"].concat(inds.map(i=>i.orden + ". " + i.descripcion)).concat(["Puntos"])];
    (Cap.datos.alumnos||[]).forEach(a=>{
      const m = {};
      (a.marcas||[]).forEach(x=>{ m[x.indicator_id] = x; });
      filas.push([a.alumno].concat(inds.map(i=>{
        const nl = m[i.id] ? Number(m[i.id].nl) : 0;
        return nl >= 2 ? "NL (pierde punto)" : (nl === 1 ? "NL x1" : "L");
      })).concat([a.puntos]));
    });
    KG.excel("Capacidades_institucionales", filas);
  }
};

/* ==================== TAREAS, TRABAJOS Y EXAMENES ==================== */

const TIPOS = [["tarea","Tarea"],["trabajo","Trabajo práctico"],["parcial","Examen parcial"],["global","Examen global"]];

const Tareas = {
  lista: [],
  async vista(){
    await cargarAsignaciones();
    const cid = Prim.cursoActual();
    if(!cid){ $("view").innerHTML = '<div class="card"><p class="sub">Sin cursos asignados.</p></div>'; return; }
    await Prim.cargarMaterias(cid);
    const { data, error } = await db.rpc("evaluaciones", { p_course_id: cid, p_etapa: Prim.etapa, p_materia: null });
    if(error){ $("view").innerHTML = '<div class="card"><p class="alert err">' + esc(error.message) + '</p></div>'; return; }
    Tareas.lista = data || [];
    Tareas.pintar();
  },
  pintar(){
    const nom = {}; TIPOS.forEach(t=>{ nom[t[0]] = t[1]; });
    const suma = tipo => Tareas.lista.filter(x=>x.tipo===tipo).reduce((s,x)=>s + Number(x.puntaje_max), 0);
    $("view").innerHTML =
      '<h1>Tareas y exámenes</h1>' +
      '<p class="sub">Todo lo que cargás acá se suma al R.S.A. de la materia: tareas, trabajos, parciales y globales.</p>' +
      '<div class="card"><div class="row">' +
      '<div style="flex:1;min-width:220px"><label>Grado</label>' + Prim.selCurso("Tareas.cambiarCurso") + '</div>' +
      '<div style="flex:1;min-width:160px"><label>Etapa</label>' + Prim.selEtapa("Tareas.cambiarEtapa") + '</div>' +
      '</div></div>' +
      '<div class="grid3">' +
      '<div class="kpi"><b>' + suma("tarea") + '</b><span>Puntos en tareas</span></div>' +
      '<div class="kpi"><b>' + suma("trabajo") + '</b><span>Puntos en trabajos</span></div>' +
      '<div class="kpi"><b>' + suma("parcial") + '</b><span>Puntos en parciales</span></div>' +
      '<div class="kpi"><b>' + suma("global") + '</b><span>Puntos en globales</span></div>' +
      '</div>' +
      '<div class="card"><h2>Cargar una nueva</h2>' +
      '<div class="grid2">' +
      '<div><label>Materia</label>' + Prim.selMaterias("", "Tareas.nueva.materia=this.value") + '</div>' +
      '<div><label>Tipo</label><select onchange="Tareas.nueva.tipo=this.value">' +
        TIPOS.map(t=>'<option value="' + t[0] + '">' + t[1] + '</option>').join("") + '</select></div>' +
      '</div>' +
      '<label>Título</label><input id="tr-tit" placeholder="Ej.: Tarea de fracciones">' +
      '<label>Consigna (opcional)</label><textarea id="tr-con"></textarea>' +
      '<div class="grid3">' +
      '<div><label>Fecha de entrega</label><input type="date" id="tr-fe" value="' + KG.hoyISO() + '"></div>' +
      '<div><label>Puntaje</label><input type="number" step="0.5" min="0" id="tr-pt" value="1"></div>' +
      '<div style="display:flex;align-items:flex-end"><button class="btn" onclick="Tareas.guardar()">Cargar</button></div>' +
      '</div></div>' +
      '<div class="card"><h2>Cargadas en esta etapa</h2>' +
      (Tareas.lista.length ? '<div style="overflow:auto"><table><thead><tr><th>Materia</th><th>Tipo</th><th>Título</th><th>Entrega</th><th>Puntaje</th><th>Puntuados</th><th></th></tr></thead><tbody>' +
        Tareas.lista.map(a=>'<tr><td>' + esc(a.materia) + '</td>' +
          '<td><span class="tag ' + (a.tipo==="global"?"red":a.tipo==="parcial"?"orange":a.tipo==="trabajo"?"blue":"green") + '">' + nom[a.tipo] + '</span></td>' +
          '<td>' + esc(a.titulo) + '</td><td>' + (a.fecha_entrega ? KG.fecha(a.fecha_entrega) : "—") + '</td>' +
          '<td>' + Number(a.puntaje_max) + '</td><td>' + a.puntuados + '</td>' +
          '<td><button class="btn sec sm" onclick="Tareas.puntuar(\'' + a.id + '\')">Puntuar</button></td></tr>').join("") +
        '</tbody></table></div>'
        : '<p class="note">Todavía no cargaste tareas ni exámenes en esta etapa.</p>') + '</div>';
  },
  nueva: { materia:"", tipo:"tarea" },
  async guardar(){
    const tit = $("tr-tit").value.trim();
    if(!Tareas.nueva.materia){ alert("Elegí la materia."); return; }
    if(!tit){ alert("Poné un título."); return; }
    const { error } = await db.rpc("guardar_evaluacion", {
      p_id: null, p_course_id: Prim.courseId, p_materia: Tareas.nueva.materia,
      p_tipo: Tareas.nueva.tipo, p_titulo: tit, p_consigna: $("tr-con").value || null,
      p_fecha: KG.hoyISO(), p_fecha_entrega: $("tr-fe").value || null,
      p_puntaje_max: Number($("tr-pt").value || 1), p_etapa: Prim.etapa
    });
    if(error){ alert("No se pudo guardar: " + error.message); return; }
    aviso("Cargado. Ya suma al R.S.A. de la materia.");
    Tareas.vista();
  },
  async puntuar(id){
    const a = Tareas.lista.find(x=>x.id === id);
    const { data, error } = await db.rpc("puntajes_evaluacion", { p_assessment_id: id });
    if(error){ alert(error.message); return; }
    const filas = data || [];
    const p = document.createElement("div");
    p.id = "tr-panel";
    p.setAttribute("style", "position:fixed;inset:0;z-index:65;background:var(--bg);overflow:auto;padding:20px");
    p.innerHTML = '<div style="max-width:760px;margin:0 auto">' +
      '<div class="row" style="justify-content:space-between;align-items:center;margin-bottom:12px">' +
      '<h2 style="margin:0">' + esc(a.titulo) + ' <span class="note">' + esc(a.materia) + ' · hasta ' + Number(a.puntaje_max) + ' puntos</span></h2>' +
      '<button class="btn sec" id="tr-x">Cerrar</button></div>' +
      '<div class="card"><table><thead><tr><th>Alumno</th><th style="width:110px">Entregó</th><th style="width:120px">Puntaje</th><th>Observación</th></tr></thead><tbody>' +
      filas.map(f=>'<tr><td>' + esc(f.alumno) + '</td>' +
        '<td style="text-align:center"><input type="checkbox" style="width:19px;height:19px" id="tp-e-' + f.student_id + '"' + (f.entregado?" checked":"") + '></td>' +
        '<td><input type="number" step="0.5" min="0" max="' + Number(a.puntaje_max) + '" id="tp-p-' + f.student_id + '" value="' + (f.puntaje!==null && f.puntaje!==undefined ? f.puntaje : "") + '"></td>' +
        '<td><input id="tp-o-' + f.student_id + '" value="' + esc(f.observacion||"") + '"></td></tr>').join("") +
      '</tbody></table>' +
      '<div class="row" style="margin-top:12px">' +
      '<button class="btn ok" onclick="Tareas.guardarPuntajes(\'' + id + '\')">Guardar puntajes</button>' +
      '<button class="btn sec" onclick="Tareas.todos(\'' + id + '\',' + Number(a.puntaje_max) + ')">Poner el puntaje completo a todos</button>' +
      '</div></div></div>';
    document.body.appendChild(p);
    p.querySelector("#tr-x").onclick = ()=>p.remove();
    Tareas.alumnosPanel = filas;
  },
  todos(id, max){
    (Tareas.alumnosPanel||[]).forEach(f=>{
      const e = $("tp-p-" + f.student_id); if(e) e.value = max;
      const c = $("tp-e-" + f.student_id); if(c) c.checked = true;
    });
  },
  async guardarPuntajes(id){
    const scores = (Tareas.alumnosPanel||[]).map(f=>({
      student_id: f.student_id,
      puntaje: $("tp-p-" + f.student_id).value,
      entregado: $("tp-e-" + f.student_id).checked,
      observacion: $("tp-o-" + f.student_id).value
    }));
    const { error } = await db.rpc("puntuar_evaluacion", { p_assessment_id: id, p_scores: scores });
    if(error){ alert("No se pudo guardar: " + error.message); return; }
    const p = $("tr-panel"); if(p) p.remove();
    aviso("Puntajes guardados.");
    Tareas.vista();
  },
  cambiarCurso(id){ Prim.courseId = id; Tareas.vista(); },
  cambiarEtapa(e){ Prim.etapa = Number(e); Tareas.vista(); }
};

/* ==================== PLANILLA R.S.A. ==================== */

const Planilla = {
  materia: null,
  datos: null,
  async vista(){
    await cargarAsignaciones();
    const cid = Prim.cursoActual();
    if(!cid){ $("view").innerHTML = '<div class="card"><p class="sub">Sin cursos asignados.</p></div>'; return; }
    await Prim.cargarMaterias(cid);
    if(!Planilla.materia) Planilla.materia = Prim.materias[0] || null;
    if(!Planilla.materia){ $("view").innerHTML = '<div class="card"><p class="sub">Este curso no tiene materias de primaria cargadas.</p></div>'; return; }
    const { data, error } = await db.rpc("planilla_rsa", {
      p_course_id: cid, p_materia: Planilla.materia, p_etapa: Prim.etapa, p_desde: null, p_hasta: null
    });
    if(error){ $("view").innerHTML = '<div class="card"><p class="alert err">' + esc(error.message) + '</p></div>'; return; }
    Planilla.datos = data;
    Planilla.pintar();
  },
  pintar(){
    const d = Planilla.datos, m = d.maximos;
    $("view").innerHTML =
      '<h1>Planilla R.S.A.</h1>' +
      '<p class="sub">Suma de los indicadores diarios del planeamiento, las tareas y trabajos, los exámenes parciales y globales, y los ' + Number(m.institucional) + ' puntos de las capacidades institucionales.</p>' +
      '<div class="card"><div class="row">' +
      '<div style="flex:1;min-width:200px"><label>Grado</label>' + Prim.selCurso("Planilla.cambiarCurso") + '</div>' +
      '<div style="flex:1;min-width:200px"><label>Materia</label><select onchange="Planilla.cambiarMateria(this.value)">' +
        Prim.materias.map(x=>'<option' + (x===Planilla.materia?" selected":"") + '>' + esc(x) + '</option>').join("") + '</select></div>' +
      '<div style="flex:1;min-width:150px"><label>Etapa</label>' + Prim.selEtapa("Planilla.cambiarEtapa") + '</div>' +
      '</div></div>' +
      '<div class="card"><div style="overflow:auto"><table><thead><tr>' +
      '<th>N.º</th><th>Alumno</th>' +
      '<th>R.S.A. diario<div class="note">/' + Number(m.diario) + '</div></th>' +
      '<th>Tareas y trabajos<div class="note">/' + Number(m.tareas) + '</div></th>' +
      '<th>Parcial<div class="note">/' + Number(m.parcial) + '</div></th>' +
      '<th>Global<div class="note">/' + Number(m.global) + '</div></th>' +
      '<th>Capacidad inst.<div class="note">/' + Number(m.institucional) + '</div></th>' +
      '<th>Total<div class="note">/' + Number(m.total) + '</div></th><th>%</th><th>Calif.</th>' +
      '</tr></thead><tbody>' +
      (d.filas||[]).map((f,i)=>'<tr><td>' + (i+1) + '</td><td>' + esc(f.alumno) + '</td>' +
        '<td>' + Number(f.rsa_diario) + '</td><td>' + Number(f.tareas) + '</td>' +
        '<td>' + Number(f.parcial) + '</td><td>' + Number(f.global) + '</td>' +
        '<td>' + Number(f.institucional) + '</td><td><b>' + Number(f.total) + '</b></td>' +
        '<td>' + (f.porcentaje!==null ? Number(f.porcentaje) + "%" : "—") + '</td>' +
        '<td><span class="tag ' + (f.calificacion >= 4 ? "green" : f.calificacion === 3 ? "blue" : f.calificacion === 2 ? "orange" : "red") + '">' + (f.calificacion || "—") + '</span></td></tr>').join("") +
      '</tbody></table></div>' +
      '<div class="row" style="margin-top:10px">' +
      '<button class="btn sec" onclick="Planilla.exportar()">Descargar en Excel</button>' +
      '<button class="btn sec" onclick="Planilla.word()">Descargar en Word</button>' +
      '</div>' +
      '</div>' +
      Planilla.cardEscala();
  },
  cambiarCurso(id){ Prim.courseId = id; Planilla.materia = null; Planilla.vista(); },
  cambiarMateria(m){ Planilla.materia = m; Planilla.vista(); },
  cambiarEtapa(e){ Prim.etapa = Number(e); Planilla.vista(); },
  filas(){
    const d = Planilla.datos;
    return [["N.º","Alumno","R.S.A. diario","Tareas y trabajos","Parcial","Global","Capacidad institucional","Total","%","Calificación"]]
      .concat((d.filas||[]).map((f,i)=>[i+1, f.alumno, f.rsa_diario, f.tareas, f.parcial, f.global, f.institucional, f.total, f.porcentaje, f.calificacion]));
  },
  cardEscala(){
    const e = Planilla.datos.escala || { maximo:0, base:0, tramos:[] };
    const color = { 2:"orange", 3:"blue", 4:"green", 5:"green" };
    return '<div class="card"><h2>Escala de calificación</h2>' +
      '<p class="sub">El 70% del puntaje total es la nota <b>2</b>. Por debajo de ese puntaje la nota es <b>1</b>. Lo que va del 70% al 100% se divide en cuatro tramos y, cuando no dan montos iguales, los puntos que sobran se suman a las notas 2 y 3: al 4 y al 5 llegan solamente los mayores puntajes.</p>' +
      '<div style="overflow:auto"><table><thead><tr><th>Calificación</th><th>Puntaje</th><th>Porcentaje</th><th>Alumnos</th></tr></thead><tbody>' +
      '<tr><td><span class="tag red">1</span></td><td>0 a ' + Math.max(0, Number(e.base) - 1) + '</td><td>menos del 70%</td><td>' +
        (Planilla.datos.filas||[]).filter(f=>f.calificacion === 1).length + '</td></tr>' +
      (e.tramos||[]).map(t=>'<tr><td><span class="tag ' + (color[t.calificacion]||"gray") + '">' + t.calificacion + '</span></td>' +
        '<td>' + t.desde + ' a ' + t.hasta + '</td>' +
        '<td>' + (e.maximo ? Math.round(t.desde * 100 / e.maximo) + '% a ' + Math.round(t.hasta * 100 / e.maximo) + '%' : "—") + '</td>' +
        '<td>' + (Planilla.datos.filas||[]).filter(f=>f.calificacion === t.calificacion).length + '</td></tr>').join("") +
      '</tbody></table></div>' +
      '<p class="note">Puntaje total de la materia en esta etapa: <b>' + Number(e.maximo) + '</b> puntos. Base para aprobar (70%): <b>' + Number(e.base) + '</b> puntos.</p></div>';
  },
  exportar(){
    KG.excel("Planilla_RSA_" + KG.slug(Planilla.materia) + "_etapa" + Prim.etapa, Planilla.filas());
  },
  word(){
    const fs = Planilla.filas();
    const html = '<h1>Planilla de proceso · R.S.A.</h1><p><b>' + esc(Planilla.materia) + '</b> · ' + Prim.etapa + '.ª etapa</p>' +
      '<table><tr>' + fs[0].map(h=>'<th>' + esc(String(h)) + '</th>').join("") + '</tr>' +
      fs.slice(1).map(r=>'<tr>' + r.map(c=>'<td>' + esc(String(c===null||c===undefined?"":c)) + '</td>').join("") + '</tr>').join("") + '</table>';
    KG.word("Planilla_RSA_" + KG.slug(Planilla.materia), "Planilla R.S.A.", html);
  }
};

/* ==================== MENU ==================== */

(function(){
  if(typeof UI === "undefined") return;
  const menus = UI.menus.bind(UI);
  UI.menus = function(){
    const m = menus();
    const r = St.perfil ? St.perfil.role : "";
    if(r === "docente"){
      m.push(["tareas","Tareas y exámenes"]);
      m.push(["capacidades","Capacidades"]);
      m.push(["planilla","Planilla R.S.A."]);
    } else if(r === "director" || r === "admin"){
      m.push(["capacidades","Capacidades"]);
      m.push(["planilla","Planilla R.S.A."]);
    }
    return m;
  };
  const ir = UI.ir.bind(UI);
  const extra = {
    tareas: ()=>Tareas.vista(),
    capacidades: ()=>Cap.vista(),
    planilla: ()=>Planilla.vista()
  };
  UI.ir = function(k){
    if(extra[k]){
      St.tab = k;
      document.querySelectorAll("#nav button").forEach(b=>b.setAttribute("aria-selected", b.dataset.k === k));
      $("view").innerHTML = '<div class="spinner">Cargando…</div>';
      extra[k]();
      return;
    }
    ir(k);
  };
})();

/* ---------- atajo: crear las materias oficiales del grado ---------- */
(function(){
  if(typeof Docente === "undefined" || !Docente.vMisCursos) return;
  const v = Docente.vMisCursos.bind(Docente);
  Docente.vMisCursos = async function(){
    await v();
    const el = $("view");
    if(!el) return;
    el.insertAdjacentHTML("beforeend",
      '<div class="card"><h2>Materias de primaria</h2>' +
      '<p class="sub">Para 1.º a 3.º y para 4.º a 6.º la plataforma ya tiene la lista oficial de materias. Elegí el grado y se crean todas de una vez.</p>' +
      '<div class="row"><div style="flex:1;min-width:220px">' + Prim.selCurso("Prim.courseId=") + '</div>' +
      '<button class="btn sec" onclick="Prim.crearMaterias()">Crear las materias del grado</button></div></div>');
  };
})();

Prim.crearMaterias = async function(){
  const cid = Prim.cursoActual();
  if(!cid) return;
  const { data, error } = await db.rpc("crear_materias_grado", { p_course_id: cid, p_teacher_id: null });
  if(error){ alert("No se pudo: " + error.message); return; }
  aviso("Listo. Materias creadas: " + data.creadas + " (ciclo " + data.ciclo + ").");
  await cargarAsignaciones();
};
