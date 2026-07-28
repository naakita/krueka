/* ==================== PANEL DE DIRECCIÓN ==================== */
const Direccion = {
  async vControl(){
    const { data } = await db.from("v_docente_cumplimiento").select("*").order("docente");
    const filas = data || [];
    const tot = filas.reduce((s,f)=>({
      clases: s.clases + Number(f.clases_dictadas||0),
      asis: s.asis + Number(f.clases_con_asistencia||0),
      anec: s.anec + Number(f.registros_anecdoticos||0),
      plan: s.plan + Number(f.planificaciones_listas||0)
    }), {clases:0, asis:0, anec:0, plan:0});
    $("view").innerHTML = `
      <h1>Control de implementación</h1>
      <p class="sub">Estado real de cada docente: clases dictadas, asistencia tomada, registro anecdótico y correcciones.</p>
      <div class="grid3">
        <div class="kpi"><b>${filas.length}</b><span>Asignaciones activas</span></div>
        <div class="kpi"><b>${tot.clases}</b><span>Clases dictadas</span></div>
        <div class="kpi"><b>${tot.clases?Math.round(100*tot.asis/tot.clases):0}%</b><span>Con asistencia tomada</span></div>
        <div class="kpi"><b>${tot.anec}</b><span>Registros anecdóticos</span></div>
        <div class="kpi"><b>${tot.plan}</b><span>Planificaciones listas</span></div>
      </div>
      <div class="card">
        <table><thead><tr><th>Docente</th><th>Curso y materia</th><th>Planificaciones</th><th>Clases</th><th>Asistencia</th><th>Registro anecdótico</th><th>Correcciones</th><th>Última clase</th></tr></thead><tbody>
        ${filas.map(f=>{
          const pct = Number(f.pct_asistencia_tomada||0);
          const color = pct>=80?"green":pct>=50?"orange":"red";
          return `<tr>
            <td><b>${esc(f.docente||"Sin asignar")}</b><div class="note">${esc(f.email||"")}</div></td>
            <td>${esc(f.curso)}<div class="note">${esc(f.materia)}</div></td>
            <td>${f.planificaciones_listas}/${f.planificaciones}</td>
            <td>${f.clases_dictadas}</td>
            <td><span class="tag ${color}">${pct}%</span><div class="bar" style="margin-top:5px"><i style="width:${pct}%"></i></div></td>
            <td>${f.registros_anecdoticos} <span class="note">(${f.puntos_asignados} pts)</span></td>
            <td>${f.entregas_corregidas}/${f.entregas_recibidas}</td>
            <td>${f.ultima_clase||"—"}</td>
          </tr>`;
        }).join("") || '<tr><td colspan="8" class="note">Sin datos todavía.</td></tr>'}
        </tbody></table>
      </div>`;
  },
  async vAlumnos(){
    const { data } = await db.from("v_alumno_resumen").select("*").order("curso").order("alumno");
    $("view").innerHTML = `
      <h1>Alumnos</h1>
      <div class="card"><table><thead><tr><th>Alumno</th><th>Curso</th><th>Presentes</th><th>Ausentes</th><th>Tardanzas</th><th>Puntos de conducta</th><th>Promedio</th></tr></thead><tbody>
      ${(data||[]).map(a=>`<tr><td>${esc(a.alumno)}</td><td>${esc(a.curso)}</td><td>${a.presentes}</td><td>${a.ausentes}</td><td>${a.tardanzas}</td><td>${a.puntos_conducta}</td><td>${a.promedio==null?"—":a.promedio}</td></tr>`).join("") || '<tr><td colspan="7" class="note">Sin alumnos cargados.</td></tr>'}
      </tbody></table></div>`;
  },
  async vPlanes(){
    const { data } = await db.from("lesson_plans").select("*, course_subjects(courses(nombre), subjects(nombre), profiles(nombre)), lesson_indicators(id)").order("fecha_prevista", { ascending:false }).limit(100);
    $("view").innerHTML = `
      <h1>Planificaciones cargadas</h1>
      <p class="sub">Lo que cada docente dejó preparado para las próximas clases.</p>
      <div class="card"><table><thead><tr><th>Fecha</th><th>Docente</th><th>Curso y materia</th><th>Clase</th><th>Indicadores</th><th>Estado</th></tr></thead><tbody>
      ${(data||[]).map(p=>{
        const cs = p.course_subjects||{};
        return `<tr><td>${p.fecha_prevista||"—"}</td><td>${esc(cs.profiles?cs.profiles.nombre:"—")}</td>
        <td>${esc(cs.courses?cs.courses.nombre:"")}<div class="note">${esc(cs.subjects?cs.subjects.nombre:"")}</div></td>
        <td><b>${esc(p.titulo)}</b><div class="note">${esc(p.capacidad||"")}</div></td>
        <td>${(p.lesson_indicators||[]).length}</td>
        <td><span class="tag ${p.estado==="dictada"?"green":p.estado==="borrador"?"gray":"blue"}">${p.estado}</span></td></tr>`;
      }).join("") || '<tr><td colspan="6" class="note">Sin planificaciones.</td></tr>'}
      </tbody></table></div>`;
  }
};
