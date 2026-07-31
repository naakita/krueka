/* ==================== KRUEKA · GESTION ====================
   - Arregla el quitar alumno de la lista
   - Indicadores manuales por clase y correccion por indicadores
   - Planeamiento semanal de primaria (varias materias por dia + Word para direccion)
   - Archivos: subir a la nube, exportar a Excel y a Word
   - Imagenes de apoyo para los alumnos
   - Avisos, panel de direccion y auditoria
============================================================ */

const KG = {
  bucket: "krueka",
  hoyISO(){ return new Date().toISOString().slice(0,10); },
  lunes(d){
    const x = d ? new Date(d+"T12:00:00") : new Date();
    const n = (x.getDay()+6)%7;
    x.setDate(x.getDate()-n);
    return x.toISOString().slice(0,10);
  },
  masDias(iso, n){
    const x = new Date(iso+"T12:00:00");
    x.setDate(x.getDate()+n);
    return x.toISOString().slice(0,10);
  },
  fecha(iso){
    if(!iso) return "—";
    const x = new Date(iso+"T12:00:00");
    return x.toLocaleDateString("es-PY", { day:"2-digit", month:"2-digit" });
  },
  slug(s){
    return String(s||"archivo").normalize("NFD").replace(/[\u0300-\u036f]/g,"")
      .replace(/[^a-zA-Z0-9.\-_]+/g,"_").slice(0,60);
  },
  async subir(file, carpeta){
    const path = carpeta + "/" + Date.now() + "_" + KG.slug(file.name);
    const { error } = await db.storage.from(KG.bucket).upload(path, file, { upsert:true });
    if(error) throw error;
    return { path: path, url: KG.url(path), nombre: file.name };
  },
  url(path){
    if(!path) return "";
    return db.storage.from(KG.bucket).getPublicUrl(path).data.publicUrl;
  },
  bajar(nombre, contenido, tipo){
    const b = new Blob([contenido], { type: tipo });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(b);
    a.download = nombre;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href), 4000);
  },
  excel(nombre, filas){
    const csv = filas.map(f=>f.map(c=>{
      const t = c===null || c===undefined ? "" : String(c);
      return /[";\n]/.test(t) ? '"' + t.replace(/"/g,'""') + '"' : t;
    }).join(";")).join("\r\n");
    KG.bajar(nombre + ".csv", "\ufeff" + csv, "text/csv;charset=utf-8");
  },
  word(nombre, titulo, html){
    const doc = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">' +
      '<head><meta charset="utf-8"><title>' + esc(titulo) + '</title>' +
      '<style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt;color:#222}' +
      'h1{font-size:16pt}h2{font-size:13pt}table{border-collapse:collapse;width:100%}' +
      'td,th{border:1px solid #999;padding:5px;font-size:10pt;vertical-align:top}</style></head>' +
      '<body>' + html + '</body></html>';
    KG.bajar(nombre + ".doc", doc, "application/msword");
  },
  cursos(){
    const vistos = {}, out = [];
    (St.asignaciones||[]).forEach(a=>{
      const c = a.courses;
      if(c && !vistos[c.id]){ vistos[c.id] = 1; out.push(c); }
    });
    return out;
  },
  materias(){
    const vistos = {}, out = [];
    (St.asignaciones||[]).forEach(a=>{
      const s = a.subjects;
      if(s && !vistos[s.id]){ vistos[s.id] = 1; out.push(s); }
    });
    return out;
  }
};

/* ==================== 1 · QUITAR ALUMNO (arreglado) ==================== */

if(typeof Docente !== "undefined"){
  Docente.quitarAlumno = async function(id){
    const a = asignacionActual();
    if(!a){ alert("Elegí primero un curso."); return; }
    if(!confirm("¿Quitar a este alumno de la lista del curso?\n\nSus trabajos y registros quedan guardados en la escuela.")) return;
    const { error } = await db.rpc("quitar_alumno", { p_student_id:id, p_course_id: a.course_id || a.courses.id });
    if(error){ alert("No se pudo quitar: " + error.message); return; }
    UI.ir("alumnos");
  };

  Docente.exportarLista = function(){
    const a = asignacionActual();
    const filas = [["N.º","Alumno"]].concat((St.alumnos||[]).map((x,i)=>[i+1, x.nombre]));
    KG.excel("Lista_" + KG.slug(a ? a.courses.nombre : "curso"), filas);
  };

  Docente.importarLista = function(input){
    const f = input.files && input.files[0];
    if(!f) return;
    const r = new FileReader();
    r.onload = async ()=>{
      const txt = String(r.result||"");
      const nombres = txt.split(/\r?\n/).map(l=>{
        const p = l.split(/[;,\t]/);
        let n = p.length > 1 && /^\s*\d+\s*$/.test(p[0]) ? p[1] : p[0];
        return String(n||"").replace(/^"|"$/g,"").trim();
      }).filter(n=>n && !/^(n|nº|nro|alumno|alumnos|apellidos)/i.test(n));
      if(!nombres.length){ alert("No se encontraron nombres en el archivo."); return; }
      if(!confirm("Se van a agregar " + nombres.length + " alumnos. ¿Seguimos?")) return;
      const a = asignacionActual();
      const { data:creados, error } = await db.from("students")
        .insert(nombres.map(n=>({ institution_id: St.perfil.institution_id, nombre:n }))).select();
      if(error){ alert("No se pudo importar: " + error.message); return; }
      await db.from("enrollments").insert(creados.map(s=>({ student_id:s.id, course_id: a.course_id || a.courses.id })));
      UI.ir("alumnos");
    };
    r.readAsText(f, "utf-8");
  };

  Docente.cardArchivos = function(){
    return '<div class="card"><h2>Lista en Excel</h2>' +
      '<p class="sub">Descargá la lista para tus planillas, o traé una lista desde un archivo (una fila por alumno).</p>' +
      '<div class="row">' +
      '<button class="btn sec" onclick="Docente.exportarLista()">Descargar en Excel</button>' +
      '<label class="btn sec" style="margin:0;color:var(--tx)">Importar desde archivo' +
      '<input type="file" accept=".csv,.txt" style="display:none" onchange="Docente.importarLista(this)"></label>' +
      '</div></div>';
  };
}

/* ==================== 2 · INDICADORES MANUALES ==================== */

const Indic = {
  planId: null,
  items: [],
  async cargar(planId){
    Indic.planId = planId || null;
    Indic.items = [];
    if(!planId) return;
    const { data } = await db.from("lesson_indicators").select("*").eq("lesson_plan_id", planId).order("orden");
    Indic.items = (data||[]).map(x=>({ id:x.id, descripcion:x.descripcion, puntaje_max:Number(x.puntaje_max) }));
  },
  card(){
    if(!Indic.planId) return "";
    return '<div class="card" id="ind-card"><h2>Indicadores de esta clase</h2>' +
      '<p class="sub">Escribí los que de verdad vas a evaluar hoy y el puntaje que vos considerás. Pueden ser dos o tres de un punto cada uno.</p>' +
      '<div id="ind-box"></div>' +
      '<div class="row" style="margin-top:10px">' +
      '<button class="btn sec sm" onclick="Indic.agregar()">+ Agregar indicador</button>' +
      '<button class="btn sec sm" onclick="Indic.preset(2,1)">2 de 1 punto</button>' +
      '<button class="btn sec sm" onclick="Indic.preset(3,1)">3 de 1 punto</button>' +
      '<button class="btn ok sm" onclick="Indic.guardar()">Guardar indicadores</button>' +
      '</div></div>';
  },
  pintar(){
    const box = $("ind-box");
    if(!box) return;
    const total = Indic.items.reduce((s,i)=>s + (Number(i.puntaje_max)||0), 0);
    box.innerHTML = '<table><thead><tr><th style="width:60%">Indicador</th><th style="width:110px">Puntaje</th><th></th></tr></thead><tbody>' +
      (Indic.items.map((it,i)=>
        '<tr><td><input value="' + esc(it.descripcion||"") + '" oninput="Indic.set(' + i + ',\'descripcion\',this.value)" placeholder="Ej.: Sigue la consigna"></td>' +
        '<td><input type="number" step="0.5" min="0" value="' + (it.puntaje_max!==undefined?it.puntaje_max:1) + '" oninput="Indic.set(' + i + ',\'puntaje_max\',this.value)"></td>' +
        '<td style="text-align:right"><button class="btn sec sm" onclick="Indic.quitar(' + i + ')">Quitar</button></td></tr>'
      ).join("") || '<tr><td colspan="3" class="note">Todavía no cargaste indicadores para esta clase.</td></tr>') +
      '</tbody></table><p class="note" style="margin-top:8px">Puntaje total de la clase: <b>' + total + '</b></p>';
  },
  set(i, campo, valor){
    if(!Indic.items[i]) return;
    Indic.items[i][campo] = campo === "puntaje_max" ? Number(valor) : valor;
    if(campo === "puntaje_max") Indic.pintar();
  },
  agregar(){ Indic.items.push({ descripcion:"", puntaje_max:1 }); Indic.pintar(); },
  quitar(i){ Indic.items.splice(i,1); Indic.pintar(); },
  preset(n, p){
    Indic.items = [];
    for(let i=0;i<n;i++) Indic.items.push({ descripcion:"", puntaje_max:p });
    Indic.pintar();
  },
  async guardar(){
    if(!Indic.planId){ alert("Elegí primero la clase."); return; }
    const items = Indic.items.filter(i=>String(i.descripcion||"").trim());
    const { data, error } = await db.rpc("guardar_indicadores", { p_lesson_plan_id: Indic.planId, p_items: items });
    if(error){ alert("No se pudo guardar: " + error.message); return; }
    Indic.items = (data||[]).map(x=>({ id:x.id, descripcion:x.descripcion, puntaje_max:Number(x.puntaje_max) }));
    Indic.pintar();
    aviso("Indicadores guardados.");
  }
};

/* ==================== 3 · PUNTUAR POR INDICADORES ==================== */

const Eval = {
  async card(){
    if(!St.sesion) return "";
    const [{ data:subs }, { data:inds }] = await Promise.all([
      db.from("submissions").select("id, student_id, nota, entregado_at").eq("session_id", St.sesion.id),
      db.from("lesson_indicators").select("*").eq("lesson_plan_id", St.sesion.lesson_plan_id).order("orden")
    ]);
    Eval.subs = subs || [];
    Eval.inds = inds || [];
    if(!Eval.inds.length) return "";
    if(!Eval.subs.length) return '<div class="card"><h2>Puntuar por indicadores</h2><p class="note">Cuando los alumnos entreguen, acá vas a puntuar cada indicador.</p></div>';
    const ids = Eval.subs.map(s=>s.id);
    const { data:sc } = await db.from("indicator_scores").select("*").in("submission_id", ids);
    Eval.scores = {};
    (sc||[]).forEach(x=>{ Eval.scores[x.submission_id + "|" + x.indicator_id] = Number(x.puntaje); });
    const nom = {};
    (St.alumnos||[]).forEach(a=>{ nom[a.id] = a.nombre; });
    const max = Eval.inds.reduce((s,i)=>s + Number(i.puntaje_max), 0);
    return '<div class="card"><h2>Puntuar por indicadores</h2>' +
      '<p class="sub">Puntaje máximo de la clase: ' + max + ' puntos. La nota se calcula sola con la suma.</p>' +
      '<div style="overflow:auto"><table><thead><tr><th>Alumno</th>' +
      Eval.inds.map(i=>'<th title="' + esc(i.descripcion) + '">' + esc(String(i.descripcion).slice(0,28)) + '<div class="note">/' + Number(i.puntaje_max) + '</div></th>').join("") +
      '<th>Total</th><th></th></tr></thead><tbody>' +
      Eval.subs.map(s=>
        '<tr><td>' + esc(nom[s.student_id] || "Alumno") + '</td>' +
        Eval.inds.map(i=>'<td><input style="width:76px" type="number" step="0.5" min="0" max="' + Number(i.puntaje_max) + '" id="ev-' + s.id + '-' + i.id + '" value="' + (Eval.scores[s.id+"|"+i.id]!==undefined ? Eval.scores[s.id+"|"+i.id] : "") + '" oninput="Eval.total(\'' + s.id + '\')"></td>').join("") +
        '<td><b id="ev-t-' + s.id + '">' + (s.nota!==null && s.nota!==undefined ? s.nota : "—") + '</b></td>' +
        '<td><button class="btn ok sm" onclick="Eval.guardar(\'' + s.id + '\')">Guardar</button></td></tr>'
      ).join("") + '</tbody></table></div>' +
      '<div class="row" style="margin-top:10px"><button class="btn" onclick="Eval.guardarTodo()">Guardar todas las notas</button>' +
      '<button class="btn sec" onclick="Eval.exportar()">Descargar en Excel</button></div></div>';
  },
  total(sid){
    let t = 0;
    Eval.inds.forEach(i=>{
      const el = $("ev-" + sid + "-" + i.id);
      if(el && el.value !== "") t += Number(el.value);
    });
    const b = $("ev-t-" + sid);
    if(b) b.textContent = t;
    return t;
  },
  async guardar(sid){
    const scores = Eval.inds.map(i=>{
      const el = $("ev-" + sid + "-" + i.id);
      return { indicator_id: i.id, puntaje: el && el.value !== "" ? Number(el.value) : 0 };
    });
    const { error } = await db.rpc("corregir_por_indicadores", { p_submission_id: sid, p_scores: scores, p_devolucion: null });
    if(error){ alert("No se pudo guardar: " + error.message); return false; }
    Eval.total(sid);
    return true;
  },
  async guardarTodo(){
    for(const s of Eval.subs) await Eval.guardar(s.id);
    aviso("Notas guardadas.");
  },
  exportar(){
    const nom = {};
    (St.alumnos||[]).forEach(a=>{ nom[a.id] = a.nombre; });
    const filas = [["Alumno"].concat(Eval.inds.map(i=>i.descripcion + " (" + Number(i.puntaje_max) + ")")).concat(["Total"])];
    Eval.subs.forEach(s=>{
      const f = [nom[s.student_id] || ""];
      let t = 0;
      Eval.inds.forEach(i=>{
        const el = $("ev-" + s.id + "-" + i.id);
        const v = el && el.value !== "" ? Number(el.value) : 0;
        t += v; f.push(v);
      });
      f.push(t); filas.push(f);
    });
    KG.excel("Notas_por_indicadores", filas);
  }
};

/* ==================== 4 · IMAGENES DE APOYO ==================== */

const Imagenes = {
  planId: null,
  items: [],
  async cargar(planId){
    Imagenes.planId = planId || null;
    Imagenes.items = [];
    if(!planId) return;
    const { data } = await db.from("lesson_plans").select("imagenes").eq("id", planId).maybeSingle();
    Imagenes.items = (data && data.imagenes) || [];
  },
  card(){
    if(!Imagenes.planId) return "";
    return '<div class="card"><h2>Imágenes de apoyo</h2>' +
      '<p class="sub">Los alumnos las ven en el aula, con su explicación debajo. Sirven para reconocer mejor a la hora de estudiar.</p>' +
      '<div id="img-box"></div>' +
      '<div class="row" style="margin-top:10px">' +
      '<label class="btn sec" style="margin:0;color:var(--tx)">Subir imagen<input type="file" accept="image/*" style="display:none" onchange="Imagenes.subir(this)"></label>' +
      '<button class="btn sec" onclick="Imagenes.agregarUrl()">Agregar por enlace</button>' +
      '<button class="btn ok" onclick="Imagenes.guardar()">Guardar imágenes</button>' +
      '</div></div>';
  },
  pintar(){
    const box = $("img-box");
    if(!box) return;
    box.innerHTML = Imagenes.items.map((im,i)=>
      '<div class="row" style="align-items:flex-start;border:1px solid var(--line);border-radius:10px;padding:10px;margin-bottom:8px">' +
      '<img src="' + esc(im.url) + '" alt="" style="width:120px;height:90px;object-fit:cover;border-radius:8px;background:var(--soft)">' +
      '<div style="flex:1;min-width:200px">' +
      '<input value="' + esc(im.titulo||"") + '" placeholder="Título de la imagen" oninput="Imagenes.set(' + i + ',\'titulo\',this.value)">' +
      '<textarea placeholder="Detalle: qué tiene que mirar el alumno en esta imagen" oninput="Imagenes.set(' + i + ',\'detalle\',this.value)">' + esc(im.detalle||"") + '</textarea>' +
      '</div><button class="btn sec sm" onclick="Imagenes.quitar(' + i + ')">Quitar</button></div>'
    ).join("") || '<p class="note">Todavía no hay imágenes en esta clase.</p>';
  },
  set(i, campo, valor){ if(Imagenes.items[i]) Imagenes.items[i][campo] = valor; },
  quitar(i){ Imagenes.items.splice(i,1); Imagenes.pintar(); },
  agregarUrl(){
    const u = prompt("Pegá el enlace de la imagen:");
    if(!u) return;
    Imagenes.items.push({ url:u, titulo:"", detalle:"" });
    Imagenes.pintar();
  },
  async subir(input){
    const f = input.files && input.files[0];
    if(!f) return;
    try{
      const r = await KG.subir(f, "imagenes");
      Imagenes.items.push({ url:r.url, titulo:f.name.replace(/\.[a-z]+$/i,""), detalle:"" });
      Imagenes.pintar();
    }catch(e){ alert("No se pudo subir: " + e.message); }
  },
  async guardar(){
    if(!Imagenes.planId) return;
    const { error } = await db.rpc("guardar_imagenes", { p_lesson_plan_id: Imagenes.planId, p_imagenes: Imagenes.items });
    if(error){ alert("No se pudo guardar: " + error.message); return; }
    aviso("Imágenes guardadas. Los alumnos ya las ven en el aula.");
  }
};

/* ==================== 5 · PLANEAMIENTO SEMANAL (PRIMARIA) ==================== */

const DIAS = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];

const Plan6 = {
  courseId: null,
  desde: null,
  plan: null,
  items: [],
  async vista(){
    await cargarAsignaciones();
    const cursos = KG.cursos();
    if(!cursos.length){ $("view").innerHTML = '<div class="card"><p class="sub">Sin cursos asignados.</p></div>'; return; }
    if(!Plan6.courseId || !cursos.some(c=>c.id===Plan6.courseId)) Plan6.courseId = cursos[0].id;
    if(!Plan6.desde) Plan6.desde = KG.lunes();
    await Plan6.cargar();
    Plan6.pintar(cursos);
  },
  async cargar(){
    const { data } = await db.rpc("planeamiento_semana", { p_course_id: Plan6.courseId, p_desde: Plan6.desde });
    Plan6.plan = data && data.plan ? data.plan : null;
    Plan6.items = data && data.items ? data.items.map(i=>({
      dia: i.dia, materia: i.materia, tema: i.tema || "", capacidad: i.capacidad || "",
      actividades: i.actividades || "", recursos: i.recursos || "",
      indicadores: i.indicadores || []
    })) : [];
  },
  pintar(cursos){
    const hasta = KG.masDias(Plan6.desde, 4);
    const est = Plan6.plan ? Plan6.plan.estado : "borrador";
    const tag = { borrador:"gray", enviado:"blue", visto:"green", observado:"orange" }[est] || "gray";
    $("view").innerHTML =
      '<div class="card">' +
      '<h1>Planeamiento semanal</h1>' +
      '<p class="sub">Cargá una vez por semana todas las materias del grado, con sus actividades e indicadores. La dirección lo lee desde su panel.</p>' +
      '<div class="grid2">' +
      '<div><label>Grado o curso</label><select onchange="Plan6.cambiarCurso(this.value)">' +
        cursos.map(c=>'<option value="' + c.id + '"' + (c.id===Plan6.courseId?" selected":"") + '>' + esc(c.nombre) + '</option>').join("") +
      '</select></div>' +
      '<div><label>Semana desde (lunes)</label><input type="date" value="' + Plan6.desde + '" onchange="Plan6.cambiarSemana(this.value)"></div>' +
      '</div>' +
      '<p class="note" style="margin-top:10px">Semana del ' + KG.fecha(Plan6.desde) + ' al ' + KG.fecha(hasta) + ' · <span class="tag ' + tag + '">' + est + '</span></p>' +
      (Plan6.plan && Plan6.plan.observacion_direccion ? '<div class="alert info"><b>Dirección:</b> ' + esc(Plan6.plan.observacion_direccion) + '</div>' : "") +
      '</div>' +

      '<div class="card"><h2>Documento del planeamiento</h2>' +
      '<p class="sub">Subí el planeamiento en Word. Queda guardado y la directora lo puede abrir y leer.</p>' +
      '<div class="row">' +
      '<label class="btn sec" style="margin:0;color:var(--tx)">Subir documento<input type="file" accept=".doc,.docx,.pdf,.odt" style="display:none" onchange="Plan6.subirDoc(this)"></label>' +
      (Plan6.plan && Plan6.plan.archivo_path ? '<a class="btn sec" href="' + KG.url(Plan6.plan.archivo_path) + '" target="_blank">Abrir ' + esc(Plan6.plan.archivo_nombre||"documento") + '</a>' : '<span class="note" style="align-self:center">Todavía no subiste el documento.</span>') +
      '</div></div>' +

      '<div id="pl-dias"></div>' +

      '<div class="card"><div class="row">' +
      '<button class="btn sec" onclick="Plan6.guardar(\'borrador\')">Guardar borrador</button>' +
      '<button class="btn" onclick="Plan6.guardar(\'enviado\')">Enviar a dirección</button>' +
      '<button class="btn sec" onclick="Plan6.exportarWord()">Descargar en Word</button>' +
      '<button class="btn sec" onclick="Plan6.exportarExcel()">Descargar en Excel</button>' +
      '<button class="btn sec" onclick="Plan6.copiarSemanaAnterior()">Copiar la semana anterior</button>' +
      '</div></div>';
    Plan6.pintarDias();
  },
  pintarDias(){
    const cont = $("pl-dias");
    if(!cont) return;
    const materias = KG.materias();
    cont.innerHTML = DIAS.slice(0,5).map((d, di)=>{
      const dia = di + 1;
      const filas = Plan6.items.map((it,i)=>({ it:it, i:i })).filter(x=>x.it.dia === dia);
      return '<div class="card"><div class="row" style="justify-content:space-between;align-items:center">' +
        '<h2 style="margin:0">' + d + ' <span class="note">' + KG.fecha(KG.masDias(Plan6.desde, di)) + '</span></h2>' +
        '<button class="btn sec sm" onclick="Plan6.agregar(' + dia + ')">+ Agregar materia</button></div>' +
        (filas.length ? filas.map(x=>Plan6.fila(x.it, x.i, materias)).join("") : '<p class="note" style="margin-top:10px">Sin materias cargadas para este día.</p>') +
        '</div>';
    }).join("");
  },
  fila(it, i, materias){
    const inds = (it.indicadores||[]).map(x=>(x.descripcion||"") + (x.puntaje!==undefined && x.puntaje!==null ? "; " + x.puntaje : "")).join("\n");
    return '<div style="border:1px solid var(--line);border-radius:10px;padding:12px;margin-top:10px">' +
      '<div class="grid2">' +
      '<div><label>Materia</label><input list="pl-materias" value="' + esc(it.materia||"") + '" oninput="Plan6.set(' + i + ',\'materia\',this.value)" placeholder="Matemática"></div>' +
      '<div><label>Tema del día</label><input value="' + esc(it.tema||"") + '" oninput="Plan6.set(' + i + ',\'tema\',this.value)"></div>' +
      '</div>' +
      '<label>Capacidad</label><input value="' + esc(it.capacidad||"") + '" oninput="Plan6.set(' + i + ',\'capacidad\',this.value)">' +
      '<label>Actividades</label><textarea oninput="Plan6.set(' + i + ',\'actividades\',this.value)">' + esc(it.actividades||"") + '</textarea>' +
      '<label>Indicadores (uno por línea, con el puntaje después del punto y coma)</label>' +
      '<textarea placeholder="Reconoce las partes de la célula; 1" oninput="Plan6.setInd(' + i + ',this.value)">' + esc(inds) + '</textarea>' +
      '<label>Recursos</label><input value="' + esc(it.recursos||"") + '" oninput="Plan6.set(' + i + ',\'recursos\',this.value)">' +
      '<div style="text-align:right;margin-top:8px"><button class="btn sec sm" onclick="Plan6.quitar(' + i + ')">Quitar esta materia</button></div>' +
      '<datalist id="pl-materias">' + materias.map(m=>'<option value="' + esc(m.nombre) + '">').join("") + '</datalist>' +
      '</div>';
  },
  set(i, campo, valor){ if(Plan6.items[i]) Plan6.items[i][campo] = valor; },
  setInd(i, texto){
    if(!Plan6.items[i]) return;
    Plan6.items[i].indicadores = String(texto||"").split("\n").map(l=>l.trim()).filter(Boolean).map(l=>{
      const p = l.split(";");
      const punt = p.length > 1 ? Number(String(p.pop()).replace(",",".")) : 1;
      return { descripcion: p.join(";").trim(), puntaje: isNaN(punt) ? 1 : punt };
    });
  },
  agregar(dia){
    Plan6.items.push({ dia:dia, materia:"", tema:"", capacidad:"", actividades:"", recursos:"", indicadores:[] });
    Plan6.pintarDias();
  },
  quitar(i){ Plan6.items.splice(i,1); Plan6.pintarDias(); },
  cambiarCurso(id){ Plan6.courseId = id; Plan6.vista(); },
  cambiarSemana(d){ Plan6.desde = KG.lunes(d); Plan6.vista(); },
  async copiarSemanaAnterior(){
    const ant = KG.masDias(Plan6.desde, -7);
    const { data } = await db.rpc("planeamiento_semana", { p_course_id: Plan6.courseId, p_desde: ant });
    if(!data || !data.items || !data.items.length){ alert("No hay planeamiento cargado en la semana anterior."); return; }
    Plan6.items = data.items.map(i=>({
      dia:i.dia, materia:i.materia, tema:i.tema||"", capacidad:i.capacidad||"",
      actividades:i.actividades||"", recursos:i.recursos||"", indicadores:i.indicadores||[]
    }));
    Plan6.pintarDias();
    aviso("Copiado. Revisá y ajustá lo que cambie esta semana.");
  },
  async subirDoc(input){
    const f = input.files && input.files[0];
    if(!f) return;
    try{
      const r = await KG.subir(f, "planeamientos");
      await Plan6.guardar(Plan6.plan ? Plan6.plan.estado : "borrador", r);
    }catch(e){ alert("No se pudo subir: " + e.message); }
  },
  async guardar(estado, archivo){
    const items = Plan6.items.filter(i=>String(i.materia||"").trim()).map((i, n)=>({
      dia:i.dia, fecha: KG.masDias(Plan6.desde, i.dia-1), materia:i.materia, tema:i.tema,
      capacidad:i.capacidad, actividades:i.actividades, recursos:i.recursos, indicadores:i.indicadores||[]
    }));
    const { error } = await db.rpc("guardar_planeamiento", {
      p_course_id: Plan6.courseId,
      p_desde: Plan6.desde,
      p_hasta: KG.masDias(Plan6.desde, 4),
      p_titulo: "Semana del " + KG.fecha(Plan6.desde),
      p_items: items,
      p_estado: estado || "borrador",
      p_archivo_path: archivo ? archivo.path : null,
      p_archivo_nombre: archivo ? archivo.nombre : null
    });
    if(error){ alert("No se pudo guardar: " + error.message); return; }
    await Plan6.vista();
    aviso(estado === "enviado" ? "Enviado a dirección." : "Planeamiento guardado.");
  },
  exportarWord(){
    const cursos = KG.cursos().filter(c=>c.id===Plan6.courseId);
    let html = '<h1>Planeamiento semanal</h1><p><b>' + esc(cursos.length?cursos[0].nombre:"") + '</b> · semana del ' + KG.fecha(Plan6.desde) + ' al ' + KG.fecha(KG.masDias(Plan6.desde,4)) + '</p>';
    DIAS.slice(0,5).forEach((d, di)=>{
      const filas = Plan6.items.filter(i=>i.dia === di+1);
      if(!filas.length) return;
      html += '<h2>' + d + '</h2><table><tr><th>Materia</th><th>Tema y capacidad</th><th>Actividades</th><th>Indicadores</th></tr>' +
        filas.map(f=>'<tr><td>' + esc(f.materia) + '</td><td>' + esc(f.tema) + '<br><i>' + esc(f.capacidad||"") + '</i></td><td>' +
          esc(f.actividades||"").replace(/\n/g,"<br>") + '</td><td>' +
          (f.indicadores||[]).map(x=>esc(x.descripcion) + " (" + x.puntaje + ")").join("<br>") + '</td></tr>').join("") +
        '</table>';
    });
    KG.word("Planeamiento_" + Plan6.desde, "Planeamiento semanal", html);
  },
  exportarExcel(){
    const filas = [["Día","Fecha","Materia","Tema","Capacidad","Actividades","Indicadores","Puntaje total"]];
    Plan6.items.forEach(i=>{
      filas.push([ DIAS[i.dia-1], KG.masDias(Plan6.desde, i.dia-1), i.materia, i.tema, i.capacidad, i.actividades,
        (i.indicadores||[]).map(x=>x.descripcion).join(" / "),
        (i.indicadores||[]).reduce((s,x)=>s+(Number(x.puntaje)||0),0) ]);
    });
    KG.excel("Planeamiento_" + Plan6.desde, filas);
  }
};

/* ==================== 6 · DIRECCION: PANEL, PLANEAMIENTOS, AUDITORIA ==================== */

const Dir2 = {
  async vPanel(){
    const desde = KG.masDias(KG.hoyISO(), -30);
    const { data, error } = await db.rpc("panel_direccion", { p_desde: desde, p_hasta: KG.hoyISO() });
    if(error){ $("view").innerHTML = '<div class="card"><p class="alert err">' + esc(error.message) + '</p></div>'; return; }
    const docs = data.docentes || [], al = data.alertas || [], cl = data.clases || [];
    const tot = docs.reduce((s,d)=>s + d.clases, 0);
    const cer = docs.reduce((s,d)=>s + d.cerradas, 0);
    const anec = docs.reduce((s,d)=>s + d.anecdoticos, 0);
    $("view").innerHTML =
      '<h1>Panel de dirección</h1><p class="sub">Últimos 30 días · del ' + KG.fecha(desde) + ' al ' + KG.fecha(KG.hoyISO()) + '</p>' +
      '<div class="grid3">' +
      '<div class="kpi"><b>' + docs.length + '</b><span>Docentes activos</span></div>' +
      '<div class="kpi"><b>' + tot + '</b><span>Clases dictadas</span></div>' +
      '<div class="kpi"><b>' + cer + '</b><span>Clases cerradas con registro</span></div>' +
      '<div class="kpi"><b>' + anec + '</b><span>Registros anecdóticos</span></div>' +
      '</div>' +
      '<div class="card"><h2>Cumplimiento por docente</h2><div style="overflow:auto"><table><thead><tr>' +
      '<th>Docente</th><th>Cursos</th><th>Clases</th><th>Cerradas</th><th>Asistencia</th><th>Anecdótico</th><th>Corregidas</th><th>Planeamientos</th></tr></thead><tbody>' +
      docs.map(d=>'<tr><td><b>' + esc(d.docente) + '</b><div class="note">' + esc(d.email||"") + '</div></td>' +
        '<td>' + d.cursos + '</td><td>' + d.clases + '</td>' +
        '<td>' + d.cerradas + '</td><td>' + d.asistencias + '</td>' +
        '<td><span class="tag ' + (d.anecdoticos > 0 ? "green" : "red") + '">' + d.anecdoticos + '</span></td>' +
        '<td>' + d.corregidas + '/' + d.entregas + '</td>' +
        '<td><span class="tag ' + (d.planeamientos_enviados > 0 ? "green" : "gray") + '">' + d.planeamientos_enviados + '</span></td></tr>').join("") +
      '</tbody></table></div>' +
      '<div style="margin-top:10px"><button class="btn sec sm" onclick="Dir2.exportarPanel()">Descargar en Excel</button></div></div>' +
      '<div class="card"><h2>Avisos del Centinela</h2>' +
      (al.length ? '<table><tbody>' + al.map(a=>'<tr><td class="note">' + new Date(a.fecha).toLocaleString("es-PY") + '</td><td>' + esc(a.curso||"") + '</td><td>' + esc(a.alumno||"") + '</td><td><span class="tag orange">' + esc(a.tipo) + '</span></td></tr>').join("") + '</tbody></table>'
        : '<p class="note">Sin avisos en el período.</p>') + '</div>' +
      '<div class="card"><h2>Últimas clases</h2>' +
      (cl.length ? '<table><thead><tr><th>Fecha</th><th>Curso</th><th>Materia</th><th>Docente</th><th>Cierre</th></tr></thead><tbody>' +
        cl.map(c=>'<tr><td>' + c.fecha + '</td><td>' + esc(c.curso) + '</td><td>' + esc(c.materia) + '</td><td>' + esc(c.docente||"—") + '</td>' +
        '<td><span class="tag ' + (c.cerrada?"green":"gray") + '">' + (c.cerrada?"cerrada":"abierta") + '</span></td></tr>').join("") + '</tbody></table>'
        : '<p class="note">Sin clases en el período.</p>') + '</div>';
    Dir2._docs = docs;
  },
  exportarPanel(){
    const filas = [["Docente","Correo","Cursos","Clases","Cerradas","Asistencias","Anecdóticos","Corregidas","Entregas","Planeamientos enviados"]];
    (Dir2._docs||[]).forEach(d=>filas.push([d.docente, d.email, d.cursos, d.clases, d.cerradas, d.asistencias, d.anecdoticos, d.corregidas, d.entregas, d.planeamientos_enviados]));
    KG.excel("Panel_direccion", filas);
  },
  async vPlaneamientos(){
    const { data, error } = await db.rpc("planeamientos", { p_desde: null });
    if(error){ $("view").innerHTML = '<div class="card"><p class="alert err">' + esc(error.message) + '</p></div>'; return; }
    const l = data || [];
    $("view").innerHTML = '<h1>Planeamientos semanales</h1>' +
      '<p class="sub">Lo que cada docente planificó para la semana, con el documento en Word que subió.</p>' +
      '<div class="card"><table><thead><tr><th>Semana</th><th>Curso</th><th>Docente</th><th>Materias</th><th>Documento</th><th>Estado</th><th></th></tr></thead><tbody>' +
      (l.map(p=>'<tr><td>' + KG.fecha(p.desde) + ' al ' + KG.fecha(p.hasta) + '</td>' +
        '<td>' + esc(p.curso) + '</td><td>' + esc(p.docente) + '</td><td>' + p.dias + '</td>' +
        '<td>' + (p.archivo_path ? '<a href="' + KG.url(p.archivo_path) + '" target="_blank">Abrir</a>' : '<span class="note">—</span>') + '</td>' +
        '<td><span class="tag ' + ({borrador:"gray",enviado:"blue",visto:"green",observado:"orange"}[p.estado]||"gray") + '">' + p.estado + '</span></td>' +
        '<td><button class="btn sec sm" onclick="Dir2.verPlan(\'' + p.course_id + '\',\'' + p.desde + '\',\'' + p.id + '\')">Ver</button></td></tr>').join("") ||
        '<tr><td colspan="7" class="note">Todavía no hay planeamientos cargados.</td></tr>') +
      '</tbody></table></div>';
  },
  async verPlan(courseId, desde, id){
    const { data } = await db.rpc("planeamiento_semana", { p_course_id: courseId, p_desde: desde });
    const items = (data && data.items) || [];
    const p = document.createElement("div");
    p.setAttribute("style", "position:fixed;inset:0;z-index:60;background:var(--bg);overflow:auto;padding:20px");
    p.innerHTML = '<div style="max-width:900px;margin:0 auto">' +
      '<div class="row" style="justify-content:space-between;align-items:center;margin-bottom:12px">' +
      '<h2 style="margin:0">Planeamiento · semana del ' + KG.fecha(desde) + '</h2><button class="btn sec" id="pv-x">Cerrar</button></div>' +
      DIAS.slice(0,5).map((d,di)=>{
        const f = items.filter(i=>i.dia === di+1);
        if(!f.length) return "";
        return '<div class="card"><h3>' + d + '</h3><table><thead><tr><th>Materia</th><th>Tema</th><th>Actividades</th><th>Indicadores</th></tr></thead><tbody>' +
          f.map(x=>'<tr><td><b>' + esc(x.materia) + '</b></td><td>' + esc(x.tema||"") + '</td><td>' + esc(x.actividades||"").replace(/\n/g,"<br>") + '</td>' +
          '<td>' + (x.indicadores||[]).map(y=>esc(y.descripcion) + " (" + y.puntaje + ")").join("<br>") + '</td></tr>').join("") +
          '</tbody></table></div>';
      }).join("") +
      '<div class="card"><label>Observación para el docente</label><textarea id="pv-obs"></textarea>' +
      '<div class="row" style="margin-top:10px">' +
      '<button class="btn ok" onclick="Dir2.revisar(\'' + id + '\',\'visto\')">Marcar como visto</button>' +
      '<button class="btn sec" onclick="Dir2.revisar(\'' + id + '\',\'observado\')">Dejar observación</button>' +
      '</div></div></div>';
    document.body.appendChild(p);
    p.querySelector("#pv-x").onclick = ()=>p.remove();
  },
  async revisar(id, estado){
    const obs = $("pv-obs") ? $("pv-obs").value : "";
    const { error } = await db.rpc("revisar_planeamiento", { p_id:id, p_estado:estado, p_observacion:obs });
    if(error){ alert("No se pudo guardar: " + error.message); return; }
    document.querySelectorAll("[style*='z-index:60']").forEach(x=>x.remove());
    UI.ir("planeamientos");
  },
  async vAuditoria(){
    const { data, error } = await db.rpc("auditoria", { p_limite: 100 });
    if(error){ $("view").innerHTML = '<div class="card"><p class="alert err">' + esc(error.message) + '</p></div>'; return; }
    $("view").innerHTML = '<h1>Auditoría</h1>' +
      '<p class="sub">Toda modificación queda registrada con su autor y su fecha. Los datos personales de alumnos y usuarios solo los puede cambiar la dirección o el administrador.</p>' +
      '<div class="card"><table><thead><tr><th>Fecha</th><th>Quién</th><th>Acción</th><th>Sobre</th></tr></thead><tbody>' +
      ((data||[]).map(a=>'<tr><td class="note">' + new Date(a.fecha).toLocaleString("es-PY") + '</td><td>' + esc(a.actor) + '</td>' +
        '<td><span class="tag blue">' + esc(a.accion) + '</span></td><td>' + esc(a.entidad||"") + '</td></tr>').join("") ||
        '<tr><td colspan="4" class="note">Sin movimientos registrados.</td></tr>') +
      '</tbody></table></div>';
  }
};

/* ==================== 7 · AVISOS (campana) ==================== */

const Avisos = {
  lista: [],
  async cargar(){
    if(!St.perfil) return;
    const { data } = await db.rpc("mis_avisos", { p_solo_nuevos: false });
    Avisos.lista = data || [];
    Avisos.pintar();
  },
  pintar(){
    const barra = document.querySelector("#screen-app .topbar .in");
    if(!barra) return;
    const nuevos = Avisos.lista.filter(a=>!a.leido).length;
    let b = $("av-btn");
    if(!b){
      b = document.createElement("button");
      b.id = "av-btn";
      b.className = "btn sec sm";
      b.onclick = Avisos.abrir;
      const salir = barra.querySelector("button.btn.sec.sm");
      barra.insertBefore(b, salir || null);
    }
    b.innerHTML = "🔔" + (nuevos ? ' <span class="tag red">' + nuevos + "</span>" : "");
  },
  async abrir(){
    const p = document.createElement("div");
    p.setAttribute("style", "position:fixed;inset:0;z-index:70;background:rgba(0,0,0,.35);padding:60px 16px;overflow:auto");
    p.innerHTML = '<div class="card" style="max-width:520px;margin:0 auto">' +
      '<div class="row" style="justify-content:space-between;align-items:center"><h2 style="margin:0">Avisos</h2>' +
      '<button class="btn sec sm" id="av-x">Cerrar</button></div>' +
      (Avisos.lista.length ? Avisos.lista.map(a=>
        '<div class="stage' + (a.leido ? "" : " on") + '" style="display:block"><b>' + esc(a.titulo) + '</b>' +
        '<div class="note">' + new Date(a.created_at).toLocaleString("es-PY") + '</div>' +
        (a.cuerpo ? '<div>' + esc(a.cuerpo) + '</div>' : "") + '</div>').join("")
        : '<p class="note">No tenés avisos.</p>') + '</div>';
    document.body.appendChild(p);
    p.querySelector("#av-x").onclick = ()=>p.remove();
    await db.rpc("marcar_avisos_leidos");
    Avisos.lista.forEach(a=>{ a.leido = true; });
    Avisos.pintar();
  }
};

/* ==================== 8 · MENU Y PATCHES ==================== */

(function(){
  if(typeof UI === "undefined") return;

  const menus = UI.menus.bind(UI);
  UI.menus = function(){
    const m = menus();
    const r = St.perfil ? St.perfil.role : "";
    if(r === "docente"){
      m.splice(2, 0, ["planeamiento","Planeamiento semanal"]);
    } else if(r === "director"){
      m.push(["planeamientos","Planeamientos"]);
      m.push(["panel","Panel completo"]);
      m.push(["auditoria","Auditoría"]);
    } else if(r === "admin"){
      m.push(["planeamientos","Planeamientos"]);
      m.push(["panel","Panel completo"]);
      m.push(["auditoria","Auditoría"]);
    }
    return m;
  };

  const ir = UI.ir.bind(UI);
  const extra = {
    planeamiento: ()=>Plan6.vista(),
    planeamientos: ()=>Dir2.vPlaneamientos(),
    panel: ()=>Dir2.vPanel(),
    auditoria: ()=>Dir2.vAuditoria()
  };
  UI.ir = function(k){
    if(extra[k]){
      St.tab = k;
      document.querySelectorAll("#nav button").forEach(b=>b.setAttribute("aria-selected", b.dataset.k === k));
      $("view").innerHTML = '<div class="spinner">Cargando…</div>';
      extra[k]();
      Avisos.cargar();
      return;
    }
    ir(k);
    Avisos.cargar();
  };
})();

(function(){
  if(typeof Docente === "undefined") return;

  const vClase = Docente.vClase.bind(Docente);
  Docente.vClase = async function(){
    await vClase();
    const v = $("view");
    if(!v) return;
    const plan = St.sesion ? (St.planes||[]).find(p=>p.id === St.sesion.lesson_plan_id) : (St.planes||[])[0];
    if(plan){
      await Indic.cargar(plan.id);
      v.insertAdjacentHTML("beforeend", Indic.card());
      Indic.pintar();
      await Imagenes.cargar(plan.id);
      v.insertAdjacentHTML("beforeend", Imagenes.card());
      Imagenes.pintar();
    }
    const ev = await Eval.card();
    if(ev) v.insertAdjacentHTML("beforeend", ev);
  };

  const vAlumnos = Docente.vAlumnos.bind(Docente);
  Docente.vAlumnos = async function(){
    await vAlumnos();
    const v = $("view");
    if(v) v.insertAdjacentHTML("beforeend", Docente.cardArchivos());
  };

  const vPlanificacion = Docente.vPlanificacion.bind(Docente);
  Docente.vPlanificacion = async function(){
    await vPlanificacion();
    const v = $("view");
    if(!v) return;
    const a = asignacionActual();
    if(!a) return;
    const { data:planes } = await db.from("lesson_plans").select("id, numero, titulo").eq("course_subject_id", a.id).order("numero");
    if(!planes || !planes.length) return;
    v.insertAdjacentHTML("beforeend",
      '<div class="card"><h2>Ajustar indicadores de una clase ya cargada</h2>' +
      '<p class="sub">Elegí la clase y escribí los indicadores que vas a evaluar, con el puntaje que vos definas.</p>' +
      '<select onchange="Indic.elegir(this.value)"><option value="">Elegí una clase</option>' +
      planes.map(p=>'<option value="' + p.id + '">Clase ' + (p.numero||"") + " · " + esc(p.titulo) + '</option>').join("") +
      '</select><div id="ind-slot" style="margin-top:12px"></div></div>');
  };
})();

Indic.elegir = async function(planId){
  const slot = $("ind-slot");
  if(!slot) return;
  if(!planId){ slot.innerHTML = ""; return; }
  await Indic.cargar(planId);
  slot.innerHTML = '<div id="ind-box"></div>' +
    '<div class="row" style="margin-top:10px">' +
    '<button class="btn sec sm" onclick="Indic.agregar()">+ Agregar indicador</button>' +
    '<button class="btn sec sm" onclick="Indic.preset(2,1)">2 de 1 punto</button>' +
    '<button class="btn sec sm" onclick="Indic.preset(3,1)">3 de 1 punto</button>' +
    '<button class="btn ok sm" onclick="Indic.guardar()">Guardar indicadores</button></div>';
  Indic.pintar();
};

/* ---------- el alumno ve las imagenes con su detalle ---------- */
(function(){
  if(typeof Alumno === "undefined") return;
  const render = Alumno.render.bind(Alumno);
  Alumno.render = function(){
    render();
    const a = Alumno.aula;
    const ims = a && a.clase && a.clase.imagenes ? a.clase.imagenes : [];
    if(!ims.length) return;
    const v = $("alu-view");
    if(!v) return;
    v.insertAdjacentHTML("beforeend",
      '<div class="card"><h2>Para mirar con atención</h2>' +
      '<div class="grid2">' + ims.map(im=>
        '<div><img src="' + esc(im.url) + '" alt="' + esc(im.titulo||"") + '" style="width:100%;border-radius:10px;border:1px solid var(--line)">' +
        (im.titulo ? '<b>' + esc(im.titulo) + '</b>' : "") +
        (im.detalle ? '<p class="note">' + esc(im.detalle) + '</p>' : "") + '</div>').join("") +
      '</div></div>');
  };
})();
