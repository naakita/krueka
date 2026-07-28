/* ==================== PANEL DOCENTE ==================== */
const Docente = {
  async cambiarCurso(id){ St.csActual = id; UI.ir(St.tab); },

  async vClase(){
    await cargarAsignaciones();
    const a = asignacionActual();
    if(!a){ $("view").innerHTML = '<div class="card"><h2>Todavía no tenés cursos asignados</h2><p class="sub">Pedile a dirección que te asigne un curso y una materia.</p></div>'; return; }
    const [{data:planes}, {data:ses}] = await Promise.all([
      db.from("lesson_plans").select("*").eq("course_subject_id", a.id).order("numero"),
      db.from("class_sessions").select("*").eq("course_subject_id", a.id).eq("abierta", true).maybeSingle()
    ]);
    St.planes = planes || []; St.sesion = ses || null;
    await cargarAlumnos(a.courses.id);
    const plan = St.sesion ? St.planes.find(p=>p.id===St.sesion.lesson_plan_id) : St.planes[0];
    const et = (St.sesion && St.sesion.etapas) || {};
    let asis = {};
    if(St.sesion){
      const { data:att } = await db.from("attendance").select("*").eq("session_id", St.sesion.id);
      (att||[]).forEach(r=>asis[r.student_id]=r);
    }
    St.asis = asis;
    const presentes = Object.values(asis).filter(r=>r.estado==="presente").length;
    const tomados = Object.keys(asis).length;

    $("view").innerHTML = `
      <div class="card">
        <div class="row" style="justify-content:space-between">
          <div style="flex:1;min-width:260px">
            <span class="tag blue">${esc(a.courses.nombre)} · ${esc(a.subjects.nombre)}</span>
            <h1 style="margin-top:10px">${plan ? "Clase "+(plan.numero||"")+" · "+esc(plan.titulo) : "Sin planificación cargada"}</h1>
            <p class="sub" style="margin:0">${plan ? esc(plan.unidad||"")+" · "+plan.duracion_min+" minutos" : "Cargá una en la pestaña Planificación"}</p>
          </div>
          <div style="text-align:right">
            <div class="note">Código para los alumnos</div>
            <div class="code">${St.sesion ? esc(St.sesion.codigo) : "— — — —"}</div>
            <button class="btn sm" onclick="Docente.abrirClase()">${St.sesion ? "Abrir otra clase" : "Abrir la clase"}</button>
          </div>
        </div>
        <div class="hr"></div>
        <label>Clase a desarrollar</label>
        <div class="pill-list">${St.planes.map(p=>`<button class="pill" aria-pressed="${plan&&p.id===plan.id}" onclick="Docente.elegirPlan('${p.id}')">Clase ${p.numero||""}</button>`).join("") || '<span class="note">Sin planificaciones</span>'}</div>
      </div>

      <div class="grid3">
        <div class="kpi"><b>${St.alumnos.length}</b><span>Alumnos en la lista</span></div>
        <div class="kpi"><b>${presentes}</b><span>Presentes hoy</span></div>
        <div class="kpi"><b>${Object.keys(et).filter(k=>et[k]).length}/4</b><span>Etapas liberadas</span></div>
      </div>

      ${plan ? `<div class="card"><h2>Desarrollo de la clase</h2>
        <p><b>Capacidad:</b> ${esc(plan.capacidad||"—")}</p>
        <p><b>Inicio (8 min):</b> ${esc(plan.inicio||"—")}</p>
        <p><b>Desarrollo (40 min):</b> ${esc(plan.desarrollo||"—")}</p>
        <p><b>Cierre (12 min):</b> ${esc(plan.cierre||"—")}</p>
        <div class="alert info" style="margin-bottom:0"><b>Plan B:</b> ${esc(plan.plan_b||"—")}</div>
      </div>` : ""}

      <div class="card">
        <h2>Liberar por etapas</h2>
        <p class="sub">Los alumnos solo ven lo que vos habilitás.</p>
        ${ETAPAS.map(e=>`<div class="stage ${et[e.k]?"on":""}">
            <div style="flex:1"><b>${e.t}</b><div class="note">${e.d}</div></div>
            <button class="btn sm ${et[e.k]?"sec":"ok"}" ${St.sesion?"":"disabled"} onclick="Docente.etapa('${e.k}')">${et[e.k]?"Ocultar":"Liberar"}</button>
          </div>`).join("")}
        ${St.sesion?"":'<p class="note">Abrí la clase para poder liberar las etapas.</p>'}
      </div>

      <div class="card">
        <div class="row" style="justify-content:space-between;align-items:center">
          <h2 style="margin:0">Llamar la lista</h2>
          <span class="note">${tomados}/${St.alumnos.length} registrados</span>
        </div>
        <p class="sub">Cada marca queda guardada con la fecha y la hora exacta. Si el alumno avisó que faltaría, marcá “Avisó” y dejalo asentado en la observación.</p>
        ${!St.sesion ? '<p class="note">Abrí la clase para tomar asistencia.</p>' :
          (St.alumnos.length ? `
          <div class="row" style="margin-bottom:10px">
            <button class="btn sec sm" onclick="Docente.todosPresentes()">Marcar a todos presentes</button>
          </div>
          <table><thead><tr><th>Alumno</th><th>Estado</th><th>Observación</th><th>Registrado</th></tr></thead><tbody>
          ${St.alumnos.map(al=>{
            const r = asis[al.id] || {};
            return `<tr>
              <td style="min-width:150px"><b>${esc(al.nombre)}</b>
                ${r.aviso_previo?'<div><span class="tag blue">Avisó</span></div>':""}</td>
              <td style="min-width:230px"><div class="pill-list">
                ${[["presente","Presente"],["tarde","Tarde"],["ausente","Ausente"],["justificado","Justificado"]].map(([v,t])=>
                  `<button class="pill" aria-pressed="${r.estado===v}" onclick="Docente.asistencia('${al.id}','${v}')">${t}</button>`).join("")}
                <button class="pill" aria-pressed="${!!r.aviso_previo}" onclick="Docente.avisoPrevio('${al.id}')" title="El alumno o la familia avisó con anticipación">Avisó</button>
              </div></td>
              <td style="min-width:200px"><input id="obs-${al.id}" value="${esc(r.observacion||"")}" placeholder="Ej.: la mamá avisó que tenía consulta médica" onchange="Docente.observacion('${al.id}')"></td>
              <td class="note" style="white-space:nowrap">${r.registrado_at ? new Date(r.registrado_at).toLocaleString("es-PY",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}) : "—"}</td>
            </tr>`;
          }).join("")}</tbody></table>
          <p class="note" style="margin-top:8px">La observación se guarda sola al salir del casillero.</p>` : '<p class="note">Cargá la lista en la pestaña Alumnos.</p>')}
      </div>`;
  },

  async elegirPlan(id){
    if(!St.sesion){ St.planes.sort((a,b)=>(a.id===id?-1:1)); await Docente.abrirClase(id); return; }
    await db.from("class_sessions").update({ lesson_plan_id:id, etapas:{} }).eq("id", St.sesion.id);
    UI.ir("clase");
  },
  async abrirClase(planId){
    const plan = planId || (St.sesion ? St.sesion.lesson_plan_id : (St.planes[0] && St.planes[0].id));
    if(!plan){ alert("Primero cargá una planificación."); return; }
    const { error } = await db.rpc("abrir_clase", { p_course_subject_id:St.csActual, p_lesson_plan_id:plan });
    if(error){ alert("No se pudo abrir la clase: "+error.message); return; }
    UI.ir("clase");
  },
  async etapa(k){
    const et = Object.assign({}, St.sesion.etapas||{});
    et[k] = !et[k];
    await db.from("class_sessions").update({ etapas:et }).eq("id", St.sesion.id);
    UI.ir("clase");
  },
  async asistencia(studentId, estado){
    const prev = (St.asis||{})[studentId] || {};
    await db.from("attendance").upsert({ session_id:St.sesion.id, student_id:studentId, estado,
      observacion: prev.observacion || null, aviso_previo: !!prev.aviso_previo, registrado_por:St.perfil.id }, { onConflict:"session_id,student_id" });
    UI.ir("clase");
  },
  async observacion(studentId){
    const prev = (St.asis||{})[studentId] || {};
    await db.from("attendance").upsert({ session_id:St.sesion.id, student_id:studentId, estado: prev.estado || "presente",
      observacion: $("obs-"+studentId).value.trim() || null, aviso_previo: !!prev.aviso_previo, registrado_por:St.perfil.id }, { onConflict:"session_id,student_id" });
    aviso("Observación guardada.");
  },
  async avisoPrevio(studentId){
    const prev = (St.asis||{})[studentId] || {};
    await db.from("attendance").upsert({ session_id:St.sesion.id, student_id:studentId, estado: prev.estado || "ausente",
      observacion: prev.observacion || null, aviso_previo: !prev.aviso_previo, registrado_por:St.perfil.id }, { onConflict:"session_id,student_id" });
    UI.ir("clase");
  },
  async todosPresentes(){
    const filas = St.alumnos.filter(al=>!(St.asis||{})[al.id]).map(al=>({ session_id:St.sesion.id, student_id:al.id, estado:"presente", registrado_por:St.perfil.id }));
    if(!filas.length){ aviso("Ya están todos registrados."); return; }
    await db.from("attendance").upsert(filas, { onConflict:"session_id,student_id" });
    UI.ir("clase");
  },

  /* ---------- planificación ---------- */
  async vPlanificacion(){
    await cargarAsignaciones();
    const a = asignacionActual();
    if(!a){ $("view").innerHTML='<div class="card"><p class="sub">Sin cursos asignados.</p></div>'; return; }
    const { data:planes } = await db.from("lesson_plans").select("*, lesson_indicators(id,descripcion,puntaje_max,orden)").eq("course_subject_id", a.id).order("numero");
    $("view").innerHTML = `
      <div class="card">${selectorCurso("Docente.cambiarCurso(this.value)")}</div>
      <div class="card">
        <h2>Cargar una clase nueva</h2>
        <p class="sub">Preparala con anticipación: el día de la clase ya te aparece lista para dictar.</p>
        <div class="grid2">
          <div><label>Número</label><input id="p-num" type="number" min="1" value="${(planes||[]).length+1}"></div>
          <div><label>Fecha prevista</label><input id="p-fecha" type="date" value="${hoy()}"></div>
        </div>
        <label>Título de la clase</label><input id="p-tit" placeholder="Ej.: Hoja de cálculo y gráficos">
        <label>Unidad</label><input id="p-uni">
        <label>Capacidad del programa</label><textarea id="p-cap"></textarea>
        <div class="grid2">
          <div><label>Inicio (8 min)</label><textarea id="p-ini"></textarea></div>
          <div><label>Desarrollo (40 min)</label><textarea id="p-des"></textarea></div>
          <div><label>Cierre (12 min)</label><textarea id="p-cie"></textarea></div>
          <div><label>Plan B sin internet o sin electricidad</label><textarea id="p-pb"></textarea></div>
        </div>
        <div class="hr"></div>
        <h3>Actividad del alumno</h3>
        <div class="grid2">
          <div><label>Título</label><input id="p-atit"></div>
          <div><label>Nombre del archivo a entregar</label><input id="p-arch" placeholder="Tema_Nombre"></div>
        </div>
        <label>Objetivo</label><input id="p-aobj">
        <label>Guía breve del tema para el alumno</label>
        <textarea id="p-guia" placeholder="Lo justo para que puedan trabajar solos: qué es, para qué sirve y un ejemplo. 4 a 8 líneas."></textarea>
        <label>Herramienta con la que van a trabajar</label>
        <select id="p-herr">
          <option value="">Ninguna en particular</option>
          <option value="word">Word (documento)</option>
          <option value="excel">Excel (planilla y gráficos)</option>
          <option value="powerpoint">PowerPoint (presentación)</option>
          <option value="canva">Canva (diseño)</option>
          <option value="buscador">Buscador de la plataforma</option>
        </select>
        <label>Pasos (uno por línea)</label><textarea id="p-pasos"></textarea>
        <label>Preguntas de cierre (una por línea)</label><textarea id="p-preg"></textarea>
        <div class="hr"></div>
        <h3>Indicadores y puntajes</h3>
        <p class="sub">Un indicador por línea, con el puntaje al final separado por punto y coma. Ej.: <i>Cumple la consigna; 30</i></p>
        <textarea id="p-ind">Cumple la consigna solicitada; 30\nCalidad técnica del trabajo digital; 25\nCita fuentes confiables; 20\nPresentación y ortografía; 15\nEntrega en el tiempo previsto; 10</textarea>
        <div style="height:12px"></div>
        <button class="btn" onclick="Docente.guardarPlan()">Guardar planificación</button>
      </div>

      <div class="card">
        <h2>Planificaciones cargadas (${(planes||[]).length})</h2>
        <table><thead><tr><th>N.º</th><th>Clase</th><th>Fecha</th><th>Indicadores</th><th>Estado</th><th></th></tr></thead><tbody>
        ${(planes||[]).map(p=>`<tr>
          <td>${p.numero||""}</td>
          <td><b>${esc(p.titulo)}</b><div class="note">${esc(p.unidad||"")}</div></td>
          <td>${p.fecha_prevista||"—"}</td>
          <td>${(p.lesson_indicators||[]).length} · ${(p.lesson_indicators||[]).reduce((s,i)=>s+Number(i.puntaje_max),0)} pts</td>
          <td><span class="tag ${p.estado==="dictada"?"green":p.estado==="borrador"?"gray":"blue"}">${p.estado}</span></td>
          <td><button class="btn sec sm" onclick="Docente.borrarPlan('${p.id}')">Borrar</button></td>
        </tr>`).join("") || '<tr><td colspan="6" class="note">Todavía no cargaste ninguna.</td></tr>'}
        </tbody></table>
      </div>`;
  },
  async guardarPlan(){
    const val = id => $(id).value.trim();
    if(!val("p-tit")){ alert("Poné al menos el título de la clase."); return; }
    const lineas = t => t.split("\n").map(s=>s.trim()).filter(Boolean);
    const { data:plan, error } = await db.from("lesson_plans").insert({
      course_subject_id: St.csActual,
      numero: Number(val("p-num"))||null,
      titulo: val("p-tit"), unidad: val("p-uni"), capacidad: val("p-cap"),
      fecha_prevista: val("p-fecha")||null, duracion_min:60,
      inicio: val("p-ini"), desarrollo: val("p-des"), cierre: val("p-cie"), plan_b: val("p-pb"),
      actividad_titulo: val("p-atit"), actividad_objetivo: val("p-aobj"), actividad_archivo: val("p-arch"),
      guia_alumno: val("p-guia"), herramienta: $("p-herr").value || null,
      actividad_pasos: lineas($("p-pasos").value), actividad_preguntas: lineas($("p-preg").value),
      estado: "planificada", created_by: St.perfil.id
    }).select().single();
    if(error){ alert("No se pudo guardar: "+error.message); return; }
    const inds = lineas($("p-ind").value).map((l,i)=>{
      const p = l.split(";");
      return { lesson_plan_id:plan.id, descripcion:p[0].trim(), puntaje_max:Number((p[1]||"20").trim())||20, orden:i+1 };
    });
    if(inds.length) await db.from("lesson_indicators").insert(inds);
    UI.ir("planificacion"); aviso("Planificación guardada.");
  },
  async borrarPlan(id){
    if(!confirm("¿Borrar esta planificación?")) return;
    await db.from("lesson_plans").delete().eq("id", id);
    UI.ir("planificacion");
  },

  /* ---------- alumnos ---------- */
  async vAlumnos(){
    await cargarAsignaciones();
    const a = asignacionActual();
    if(!a){ $("view").innerHTML='<div class="card"><p class="sub">Sin cursos asignados.</p></div>'; return; }
    await cargarAlumnos(a.courses.id);
    $("view").innerHTML = `
      <div class="card">${selectorCurso("Docente.cambiarCurso(this.value)")}</div>
      <div class="card">
        <h2>Cargar la lista</h2>
        <p class="sub">Pegá los nombres, uno por línea. Podés copiarlos directamente desde Excel.</p>
        <textarea id="lista" style="min-height:130px" placeholder="Acosta, María Belén\nBenítez, Juan Carlos"></textarea>
        <div style="height:10px"></div>
        <button class="btn" onclick="Docente.guardarLista()">Agregar a la lista</button>
      </div>
      <div class="card">
        <h2>${esc(a.courses.nombre)} · ${St.alumnos.length} alumnos</h2>
        <table><tbody>${St.alumnos.map((al,i)=>`<tr><td style="width:34px" class="note">${i+1}</td><td>${esc(al.nombre)}</td>
          <td style="text-align:right"><button class="btn sec sm" onclick="Docente.quitarAlumno('${al.id}')">Quitar</button></td></tr>`).join("") || '<tr><td class="note">Lista vacía.</td></tr>'}</tbody></table>
      </div>`;
  },
  async guardarLista(){
    const a = asignacionActual();
    const nombres = $("lista").value.split("\n").map(s=>s.trim()).filter(Boolean);
    if(!nombres.length) return;
    const inst = St.perfil.institution_id;
    const { data:creados, error } = await db.from("students").insert(nombres.map(n=>({ institution_id:inst, nombre:n }))).select();
    if(error){ alert("No se pudo guardar: "+error.message); return; }
    await db.from("enrollments").insert(creados.map(s=>({ student_id:s.id, course_id:a.courses.id })));
    UI.ir("alumnos"); aviso(nombres.length+" alumnos agregados.");
  },
  async quitarAlumno(id){
    await db.from("students").update({ activo:false }).eq("id", id);
    UI.ir("alumnos");
  },

  /* ---------- mis cursos ---------- */
  async vMisCursos(){
    St.asignaciones = [];
    await cargarAsignaciones();
    const filas = St.asignaciones;
    $("view").innerHTML = `
      <h1>Mis cursos</h1>
      <p class="sub">Estos son los grados y materias que tenés a cargo. Si ya no dictás alguno, quitalo de tu lista: las planificaciones y los registros quedan guardados en la escuela.</p>
      <div class="card"><table><thead><tr><th>Curso</th><th>Materia</th><th>Horas semanales</th><th></th></tr></thead><tbody>
      ${filas.map(a=>`<tr>
        <td><b>${esc(a.courses.nombre)}</b></td>
        <td>${esc(a.subjects.nombre)}</td>
        <td>${a.horas_semanales||"—"}</td>
        <td style="text-align:right"><button class="btn sec sm" onclick="Docente.quitarCurso('${a.id}')">Quitar de mi lista</button></td>
      </tr>`).join("") || '<tr><td colspan="4" class="note">Todavía no tenés cursos asignados.</td></tr>'}
      </tbody></table></div>
      <p class="note">Para crear o eliminar definitivamente un curso, entrá con el usuario de dirección o de administrador.</p>`;
  },
  async quitarCurso(id){
    if(!confirm("¿Quitar este curso de tu lista?")) return;
    const { error } = await db.from("course_subjects").update({ teacher_id:null }).eq("id", id);
    if(error){ alert("No se pudo quitar: "+error.message); return; }
    if(St.csActual===id) St.csActual = null;
    UI.ir("miscursos");
  },

  /* ---------- entregas ---------- */
  async vTaller(){
    $("view").innerHTML = `
      <h1>Taller</h1>
      <p class="sub">Las mismas herramientas y el mismo buscador que ven los alumnos. Usá esta pestaña para preparar el ejemplo antes de la clase.</p>
      ${Taller.tarjeta(null)}
      ${Taller.buscador()}`;
  },

  async vEntregas(){
    await cargarAsignaciones();
    const a = asignacionActual();
    const { data:ses } = await db.from("class_sessions").select("id, fecha, codigo, lesson_plans(titulo, numero)").eq("course_subject_id", a.id).order("fecha", { ascending:false }).limit(20);
    const ids = (ses||[]).map(s=>s.id);
    const { data:subs } = ids.length ? await db.from("submissions").select("*, students(nombre)").in("session_id", ids).order("entregado_at", { ascending:false }) : { data:[] };
    $("view").innerHTML = `
      <div class="card">${selectorCurso("Docente.cambiarCurso(this.value)")}</div>
      <div class="card">
        <h2>Entregas recibidas (${(subs||[]).length})</h2>
        <table><thead><tr><th>Alumno</th><th>Clase</th><th>Trabajo</th><th>Nota</th><th>Devolución</th><th></th></tr></thead><tbody>
        ${(subs||[]).map(s=>{
          const se = (ses||[]).find(x=>x.id===s.session_id) || {};
          const cl = se.lesson_plans || {};
          return `<tr>
            <td><b>${esc(s.students?s.students.nombre:"")}</b><div class="note">${new Date(s.entregado_at).toLocaleString("es-PY")}</div></td>
            <td>${cl.numero?"Clase "+cl.numero:""}<div class="note">${esc(cl.titulo||"")}</div></td>
            <td>${esc(s.archivo_nombre||"—")}${s.enlace?`<div class="note">${esc(s.enlace)}</div>`:""}
                ${(s.respuestas||[]).length?`<details><summary class="note">Ver respuestas</summary>${(s.respuestas||[]).map(r=>`<p class="note">${esc(r)}</p>`).join("")}</details>`:""}</td>
            <td style="width:90px"><input type="number" min="0" max="100" value="${s.nota==null?"":s.nota}" id="n-${s.id}"></td>
            <td><input value="${esc(s.devolucion||"")}" id="d-${s.id}"></td>
            <td><button class="btn sm" onclick="Docente.corregir('${s.id}')">Guardar</button></td>
          </tr>`;
        }).join("") || '<tr><td colspan="6" class="note">Todavía no hay entregas.</td></tr>'}
        </tbody></table>
      </div>`;
  },
  async corregir(id){
    const nota = $("n-"+id).value === "" ? null : Number($("n-"+id).value);
    await db.from("submissions").update({ nota, devolucion:$("d-"+id).value, corregido_por:St.perfil.id, corregido_at:new Date().toISOString() }).eq("id", id);
    aviso("Corrección guardada.");
  },

  /* ---------- registro anecdótico ---------- */
  async vConducta(){
    await cargarAsignaciones();
    const a = asignacionActual();
    await cargarAlumnos(a.courses.id);
    const { data:regs } = await db.from("anecdotal_records").select("*, students(nombre)").eq("course_subject_id", a.id).order("fecha", { ascending:false }).limit(60);
    $("view").innerHTML = `
      <div class="card">${selectorCurso("Docente.cambiarCurso(this.value)")}</div>
      <div class="card">
        <h2>Nuevo registro</h2>
        <div class="grid2">
          <div><label>Alumno</label><select id="r-alu">${St.alumnos.map(al=>`<option value="${al.id}">${esc(al.nombre)}</option>`).join("")}</select></div>
          <div><label>Tipo</label><select id="r-tipo"><option value="positivo">Positivo</option><option value="a_mejorar">A mejorar</option><option value="observacion" selected>Observación</option></select></div>
          <div><label>Puntos (pueden ser negativos)</label><input id="r-pts" type="number" step="0.5" value="0"></div>
          <div><label>Fecha</label><input id="r-fecha" type="date" value="${hoy()}"></div>
        </div>
        <label>Descripción</label><textarea id="r-desc" placeholder="Qué se observó y en qué contexto"></textarea>
        <div style="height:10px"></div>
        <button class="btn" onclick="Docente.guardarConducta()">Registrar</button>
      </div>
      <div class="card">
        <h2>Últimos registros</h2>
        <table><thead><tr><th>Fecha</th><th>Alumno</th><th>Tipo</th><th>Descripción</th><th>Puntos</th></tr></thead><tbody>
        ${(regs||[]).map(r=>`<tr><td>${r.fecha}</td><td>${esc(r.students?r.students.nombre:"")}</td>
          <td><span class="tag ${r.tipo==="positivo"?"green":r.tipo==="a_mejorar"?"orange":"gray"}">${r.tipo.replace("_"," ")}</span></td>
          <td>${esc(r.descripcion)}</td><td><b>${r.puntos}</b></td></tr>`).join("") || '<tr><td colspan="5" class="note">Sin registros todavía.</td></tr>'}
        </tbody></table>
      </div>`;
  },
  async guardarConducta(){
    if(!$("r-desc").value.trim()){ alert("Escribí la descripción."); return; }
    const { error } = await db.from("anecdotal_records").insert({
      student_id: $("r-alu").value, course_subject_id: St.csActual,
      session_id: St.sesion ? St.sesion.id : null,
      fecha: $("r-fecha").value, tipo: $("r-tipo").value,
      descripcion: $("r-desc").value.trim(), puntos: Number($("r-pts").value)||0,
      registrado_por: St.perfil.id
    });
    if(error){ alert("No se pudo registrar: "+error.message); return; }
    UI.ir("conducta"); aviso("Registro guardado.");
  }
};
