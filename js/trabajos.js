/* ==================== TRABAJOS HECHOS EN KRUEKA (vista del docente) ==================== */

Docente.verTrabajo = async function(sessionId, studentId){
  const { data:docs, error } = await db.from("student_docs")
    .select("tipo, titulo, contenido, actualizado_at")
    .eq("session_id", sessionId).eq("student_id", studentId);
  if(error){ alert("No se pudo abrir: " + error.message); return; }
  const nombre = { documento:"Documento", planilla:"Planilla", diapositivas:"Diapositivas" };
  let cuerpo = "";
  (docs||[]).forEach(d=>{
    const c = d.contenido || {};
    let bloque = "";
    if(d.tipo === "documento"){
      bloque = '<div style="background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:20px">' + (c.html || "<i>Sin texto</i>") + '</div>';
    } else if(d.tipo === "planilla"){
      const cs = c.celdas || {}, cols = ["A","B","C","D","E","F","G","H"];
      let filas = "";
      for(let f=1; f<=24; f++){
        if(!cols.some(x=>cs[x+f])) continue;
        filas += "<tr><th>" + f + "</th>" + cols.map(x=>"<td>" + esc(cs[x+f] || "") + "</td>").join("") + "</tr>";
      }
      bloque = filas
        ? '<table><thead><tr><th></th>' + cols.map(x=>"<th>"+x+"</th>").join("") + '</tr></thead><tbody>' + filas + '</tbody></table>'
        : '<p class="note">Planilla vac\u00eda.</p>';
    } else {
      bloque = (c.slides||[]).map((s,i)=>
        '<div style="background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:14px;margin-bottom:8px">' +
        '<div class="note">L\u00e1mina ' + (i+1) + '</div><b>' + esc(s.titulo||"") + '</b>' +
        String(s.texto||"").split("\n").filter(Boolean).map(l=>'<p style="margin:4px 0">\u2022 ' + esc(l) + '</p>').join("") +
        '</div>').join("") || '<p class="note">Sin l\u00e1minas.</p>';
    }
    cuerpo += '<div class="card"><h3>' + (nombre[d.tipo]||d.tipo) + (d.titulo ? " \u00b7 " + esc(d.titulo) : "") + '</h3>' +
              '<p class="note">\u00daltima edici\u00f3n: ' + new Date(d.actualizado_at).toLocaleString("es-PY") + '</p>' + bloque + '</div>';
  });
  if(!cuerpo) cuerpo = '<div class="card"><p class="note">Este alumno no us\u00f3 las herramientas de Krueka en esa clase.</p></div>';
  const p = document.createElement("div");
  p.setAttribute("style", "position:fixed;inset:0;z-index:60;background:var(--bg);overflow:auto;padding:20px");
  p.innerHTML = '<div style="max-width:900px;margin:0 auto">' +
    '<div class="row" style="justify-content:space-between;align-items:center;margin-bottom:12px">' +
    '<h2 style="margin:0">Trabajo del alumno</h2><button class="btn sec" id="vt-x">Cerrar</button></div>' + cuerpo + '</div>';
  document.body.appendChild(p);
  p.querySelector("#vt-x").onclick = ()=>p.remove();
};

Docente.panelTrabajos = async function(){
  const cont = document.createElement("div");
  cont.className = "card";
  cont.innerHTML = '<h2>Trabajos hechos dentro de Krueka</h2><p class="sub">Documentos, planillas y diapositivas que los alumnos hicieron en la plataforma.</p><div class="spinner">Cargando\u2026</div>';
  const v = $("view");
  if(!v) return;
  v.appendChild(cont);
  try{
    await cargarAsignaciones();
    const a = asignacionActual();
    if(!a){ cont.remove(); return; }
    const { data:ses } = await db.from("class_sessions")
      .select("id, fecha, lesson_plans(titulo, numero)")
      .eq("course_subject_id", a.id).order("fecha", { ascending:false }).limit(20);
    const ids = (ses||[]).map(s=>s.id);
    const { data:docs } = ids.length
      ? await db.from("student_docs").select("session_id, student_id, tipo, titulo, actualizado_at, students(nombre)")
          .in("session_id", ids).order("actualizado_at", { ascending:false })
      : { data:[] };
    const nombre = { documento:"Documento", planilla:"Planilla", diapositivas:"Diapositivas" };
    const filas = (docs||[]).map(d=>{
      const se = (ses||[]).find(x=>x.id===d.session_id) || {};
      const lp = se.lesson_plans || {};
      return '<tr><td><b>' + esc((d.students&&d.students.nombre)||"") + '</b></td>' +
        '<td>' + (se.fecha ? new Date(se.fecha + "T00:00:00").toLocaleDateString("es-PY") : "\u2014") +
        '<div class="note">' + esc(lp.titulo || "") + '</div></td>' +
        '<td><span class="tag blue">' + (nombre[d.tipo]||d.tipo) + '</span>' +
        (d.titulo ? '<div class="note">' + esc(d.titulo) + '</div>' : "") + '</td>' +
        '<td class="note">' + new Date(d.actualizado_at).toLocaleString("es-PY") + '</td>' +
        '<td><button class="btn sec sm" onclick="Docente.verTrabajo(\\'' + d.session_id + '\\',\\'' + d.student_id + '\\')">Ver trabajo</button></td></tr>';
    }).join("");
    cont.innerHTML = '<h2>Trabajos hechos dentro de Krueka (' + (docs||[]).length + ')</h2>' +
      '<p class="sub">Documentos, planillas y diapositivas que los alumnos hicieron en la plataforma. Abrilos ac\u00e1 y despu\u00e9s pon\u00e9 el puntaje arriba, en la entrega.</p>' +
      (filas
        ? '<table><thead><tr><th>Alumno</th><th>Clase</th><th>Herramienta</th><th>\u00daltima edici\u00f3n</th><th></th></tr></thead><tbody>' + filas + '</tbody></table>'
        : '<p class="note">Todav\u00eda no hay trabajos hechos con las herramientas de Krueka en este curso.</p>');
  }catch(e){
    cont.innerHTML = '<h2>Trabajos hechos dentro de Krueka</h2><p class="note">No se pudieron cargar los trabajos.</p>';
  }
};

(function(){
  if(typeof Docente === "undefined" || typeof Docente.vEntregas !== "function") return;
  const original = Docente.vEntregas;
  Docente.vEntregas = async function(){
    await original.call(Docente);
    Docente.panelTrabajos();
  };
})();
