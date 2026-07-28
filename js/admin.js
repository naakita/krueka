/* ==================== PANEL DE ADMINISTRACIÓN ==================== */
const Admin = {
  async vUsuarios(){
    const { data } = await db.from("profiles").select("*").order("role").order("nombre");
    $("view").innerHTML = `
      <h1>Usuarios y roles</h1>
      <p class="sub">Creá las cuentas de la escuela y asigná el rol de cada persona. El rol define qué ve y qué puede hacer.</p>
      <div class="card">
        <h2>Crear un usuario nuevo</h2>
        <div class="grid2">
          <div><label>Nombre y apellido</label><input id="u-nom" placeholder="Lic. María González"></div>
          <div><label>Correo institucional</label><input id="u-mail" type="email" placeholder="maria@krueka.edu.py"></div>
          <div><label>Contraseña inicial</label><input id="u-pass" placeholder="Mínimo 8 caracteres"></div>
          <div><label>Rol</label><select id="u-rol">
            <option value="docente">Docente</option>
            <option value="director">Dirección</option>
            <option value="admin">Administrador</option>
          </select></div>
        </div>
        <div style="height:12px"></div>
        <button class="btn" onclick="Admin.crearUsuario()">Crear usuario</button>
        <p class="note" style="margin-top:8px">La persona entra con ese correo y esa contraseña. Pedile que la cambie en su primer ingreso.</p>
      </div>
      <div class="card"><table><thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Último acceso</th></tr></thead><tbody>
      ${(data||[]).map(p=>`<tr>
        <td><b>${esc(p.nombre)}</b></td><td>${esc(p.email||"")}</td>
        <td><select onchange="Admin.rol('${p.id}', this.value)">
          ${["admin","director","docente","alumno"].map(r=>`<option value="${r}" ${p.role===r?"selected":""}>${r}</option>`).join("")}
        </select></td>
        <td><button class="btn sec sm" onclick="Admin.activo('${p.id}', ${!p.activo})">${p.activo?"Activo":"Inactivo"}</button></td>
        <td class="note">${p.ultimo_acceso? new Date(p.ultimo_acceso).toLocaleString("es-PY") : "nunca"}</td>
      </tr>`).join("")}
      </tbody></table></div>
      <div class="card">
        <h2>Qué puede hacer cada rol</h2>
        <p class="sub"><b>Docente:</b> dicta sus clases, toma asistencia, carga planificaciones y corrige entregas.<br>
        <b>Dirección:</b> ve el cumplimiento de todos los docentes, los alumnos y las planificaciones.<br>
        <b>Administrador:</b> además crea usuarios, asigna roles y administra cursos y materias.</p>
      </div>`;
  },
  async crearUsuario(){
    const nombre = $("u-nom").value.trim(), email = $("u-mail").value.trim().toLowerCase(),
          pass = $("u-pass").value, role = $("u-rol").value;
    if(!nombre || !email || pass.length < 8){ alert("Completá nombre, correo y una contraseña de al menos 8 caracteres."); return; }
    const { data, error } = await db.functions.invoke("crear-usuario", { body:{ nombre, email, password:pass, role } });
    const msg = (data && data.error) ? data.error : (error ? error.message : null);
    if(msg){ alert("No se pudo crear el usuario: " + msg); return; }
    UI.ir("usuarios");
    alert("Usuario creado. Ya puede entrar con su correo y contraseña.");
  },
  async rol(id, role){ await db.from("profiles").update({ role }).eq("id", id); aviso("Rol actualizado."); },
  async activo(id, v){ await db.from("profiles").update({ activo:v }).eq("id", id); UI.ir("usuarios"); },

  async vEstructura(){
    const [{data:cursos}, {data:materias}, {data:docentes}, {data:asigs}] = await Promise.all([
      db.from("courses").select("*").order("nombre"),
      db.from("subjects").select("*").order("nombre"),
      db.from("profiles").select("id,nombre").eq("role","docente").order("nombre"),
      db.from("course_subjects").select("id, teacher_id, courses(id,nombre), subjects(id,nombre), profiles(nombre), horas_semanales")
    ]);
    $("view").innerHTML = `
      <h1>Cursos, materias y asignaciones</h1>
      <div class="grid2">
        <div class="card">
          <h2>Nuevo curso</h2>
          <label>Nombre</label><input id="c-nom" placeholder="9.º grado — Sección C">
          <div class="grid2"><div><label>Grado</label><input id="c-gra" placeholder="9.º"></div>
          <div><label>Sección</label><input id="c-sec" placeholder="C"></div></div>
          <div style="height:10px"></div><button class="btn" onclick="Admin.nuevoCurso()">Crear curso</button>
        </div>
        <div class="card">
          <h2>Nueva materia</h2>
          <label>Nombre</label><input id="m-nom" placeholder="Matemática">
          <label>Área</label><input id="m-area" placeholder="Ciencias exactas">
          <div style="height:10px"></div><button class="btn" onclick="Admin.nuevaMateria()">Crear materia</button>
        </div>
      </div>
      <div class="card">
        <h2>Asignar docente</h2>
        <div class="grid2">
          <div><label>Curso</label><select id="a-cur">${(cursos||[]).map(c=>`<option value="${c.id}">${esc(c.nombre)}</option>`).join("")}</select></div>
          <div><label>Materia</label><select id="a-mat">${(materias||[]).map(m=>`<option value="${m.id}">${esc(m.nombre)}</option>`).join("")}</select></div>
          <div><label>Docente</label><select id="a-doc">${(docentes||[]).map(d=>`<option value="${d.id}">${esc(d.nombre)}</option>`).join("")}</select></div>
          <div><label>Horas semanales</label><input id="a-hs" type="number" step="0.5" value="2"></div>
        </div>
        <div style="height:10px"></div><button class="btn" onclick="Admin.asignar()">Asignar</button>
      </div>
      <div class="card">
        <h2>Asignaciones actuales</h2>
        <p class="sub">Cambiá el docente o las horas, o borrá la asignación si ese grado ya no se dicta.</p>
        <table><thead><tr><th>Curso</th><th>Materia</th><th>Docente</th><th>Horas</th><th></th></tr></thead><tbody>
        ${(asigs||[]).map(a=>`<tr>
          <td><b>${esc(a.courses.nombre)}</b></td>
          <td>${esc(a.subjects.nombre)}</td>
          <td><select onchange="Admin.cambiarDocente('${a.id}', this.value)">
            <option value="">Sin asignar</option>
            ${(docentes||[]).map(d=>`<option value="${d.id}" ${a.teacher_id===d.id?"selected":""}>${esc(d.nombre)}</option>`).join("")}
          </select></td>
          <td style="width:92px"><input type="number" step="0.5" value="${a.horas_semanales==null?"":a.horas_semanales}" onchange="Admin.cambiarHoras('${a.id}', this.value)"></td>
          <td style="text-align:right"><button class="btn sec sm" onclick="Admin.borrarAsignacion('${a.id}')">Borrar</button></td>
        </tr>`).join("") || '<tr><td colspan="5" class="note">Sin asignaciones.</td></tr>'}
        </tbody></table>
      </div>

      <div class="grid2">
        <div class="card">
          <h2>Cursos cargados</h2>
          <table><tbody>${(cursos||[]).map(c=>`<tr><td>${esc(c.nombre)}</td>
            <td style="text-align:right">
              <button class="btn sec sm" onclick="Admin.renombrarCurso('${c.id}')">Renombrar</button>
              <button class="btn dan sm" onclick="Admin.borrarCurso('${c.id}')">Eliminar</button>
            </td></tr>`).join("") || '<tr><td class="note">Sin cursos.</td></tr>'}</tbody></table>
          <p class="note" style="margin-top:8px">Al eliminar un curso se borran también sus materias asignadas, sus clases y su lista de alumnos.</p>
        </div>
        <div class="card">
          <h2>Materias cargadas</h2>
          <table><tbody>${(materias||[]).map(m=>`<tr><td>${esc(m.nombre)}</td>
            <td style="text-align:right">
              <button class="btn sec sm" onclick="Admin.renombrarMateria('${m.id}')">Renombrar</button>
              <button class="btn dan sm" onclick="Admin.borrarMateria('${m.id}')">Eliminar</button>
            </td></tr>`).join("") || '<tr><td class="note">Sin materias.</td></tr>'}</tbody></table>
        </div>
      </div>`;
  },
  async cambiarDocente(id, teacherId){
    const { error } = await db.from("course_subjects").update({ teacher_id: teacherId || null }).eq("id", id);
    if(error){ alert("No se pudo cambiar: "+error.message); return; }
    aviso("Docente actualizado.");
  },
  async cambiarHoras(id, v){
    await db.from("course_subjects").update({ horas_semanales: v==="" ? null : Number(v) }).eq("id", id);
    aviso("Horas actualizadas.");
  },
  async borrarAsignacion(id){
    if(!confirm("¿Borrar esta asignación? Se eliminan también sus planificaciones y sus clases.")) return;
    const { error } = await db.from("course_subjects").delete().eq("id", id);
    if(error){ alert("No se pudo borrar: "+error.message); return; }
    UI.ir("estructura");
  },
  async renombrarCurso(id){
    const n = prompt("Nuevo nombre del curso:"); if(!n || !n.trim()) return;
    const { error } = await db.from("courses").update({ nombre:n.trim() }).eq("id", id);
    if(error){ alert("No se pudo renombrar: "+error.message); return; }
    UI.ir("estructura");
  },
  async borrarCurso(id){
    if(!confirm("¿Eliminar el curso con todas sus materias, clases y alumnos inscriptos?")) return;
    const { error } = await db.from("courses").delete().eq("id", id);
    if(error){ alert("No se pudo eliminar: "+error.message); return; }
    UI.ir("estructura");
  },
  async renombrarMateria(id){
    const n = prompt("Nuevo nombre de la materia:"); if(!n || !n.trim()) return;
    const { error } = await db.from("subjects").update({ nombre:n.trim() }).eq("id", id);
    if(error){ alert("No se pudo renombrar: "+error.message); return; }
    UI.ir("estructura");
  },
  async borrarMateria(id){
    if(!confirm("¿Eliminar la materia y todas sus asignaciones?")) return;
    const { error } = await db.from("subjects").delete().eq("id", id);
    if(error){ alert("No se pudo eliminar: "+error.message); return; }
    UI.ir("estructura");
  },
  async nuevoCurso(){
    const { error } = await db.from("courses").insert({ institution_id:St.perfil.institution_id, nombre:$("c-nom").value.trim(), grado:$("c-gra").value.trim(), seccion:$("c-sec").value.trim() });
    if(error){ alert(error.message); return; } UI.ir("estructura");
  },
  async nuevaMateria(){
    const { error } = await db.from("subjects").insert({ institution_id:St.perfil.institution_id, nombre:$("m-nom").value.trim(), area:$("m-area").value.trim() });
    if(error){ alert(error.message); return; } UI.ir("estructura");
  },
  async asignar(){
    const { error } = await db.from("course_subjects").insert({ course_id:$("a-cur").value, subject_id:$("a-mat").value, teacher_id:$("a-doc").value, horas_semanales:Number($("a-hs").value)||null });
    if(error){ alert(error.message); return; } UI.ir("estructura");
  }
};
