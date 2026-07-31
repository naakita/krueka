/* ==================== DOCENTE DE GRADO (PRIMARIA) ====================
   En primaria el maestro esta a cargo de todas las materias del grado,
   no de una sola materia.
====================================================================== */

const Grado = {
  cursos: [], docentes: [], resumen: [],
  async cargar(){
    const [c, d, r] = await Promise.all([
      db.from("courses").select("id,nombre,grado").order("nombre"),
      db.from("profiles").select("id,nombre").eq("role","docente").eq("activo", true).order("nombre"),
      db.rpc("docentes_de_grado")
    ]);
    Grado.cursos = c.data || [];
    Grado.docentes = d.data || [];
    Grado.resumen = r.data || [];
  },
  html(){
    return '<div class="card" style="border-color:#2783DE">' +
      '<h2>Docente de grado (primaria)</h2>' +
      '<p class="sub">En primaria el maestro está a cargo de <b>todo el grado</b>. Elegí el grado y el docente: la plataforma crea de una sola vez las materias oficiales del ciclo y se las asigna todas. Después podés cambiar alguna materia suelta abajo, en “Asignaciones actuales” (por ejemplo si Informática o Inglés las da otro docente).</p>' +
      '<div class="grid2">' +
      '<div><label>Grado</label><select id="g-cur">' +
        Grado.cursos.map(c=>'<option value="' + c.id + '">' + esc(c.nombre) + '</option>').join("") + '</select></div>' +
      '<div><label>Docente a cargo</label><select id="g-doc">' +
        Grado.docentes.map(d=>'<option value="' + d.id + '">' + esc(d.nombre) + '</option>').join("") + '</select></div>' +
      '<div><label>Horas semanales por materia (opcional)</label><input id="g-hs" type="number" step="0.5" placeholder="dejar vacío"></div>' +
      '<div><label>Materias que ya tienen otro docente</label><select id="g-rep">' +
        '<option value="1">Pasarlas también a este docente</option>' +
        '<option value="0">Dejarlas como están</option></select></div>' +
      '</div>' +
      '<div style="height:10px"></div>' +
      '<button class="btn" onclick="Grado.asignar()">Asignar docente a todo el grado</button>' +
      '<p class="note" style="margin-top:8px">1.º a 3.º: 9 materias · 4.º a 6.º: 10 materias.</p>' +
      (Grado.resumen.length ? '<div style="overflow:auto;margin-top:14px"><table><thead><tr><th>Grado</th><th>Ciclo</th><th>Materias</th><th>Docente a cargo</th><th>Sin docente</th></tr></thead><tbody>' +
        Grado.resumen.map(x=>'<tr><td><b>' + esc(x.curso) + '</b></td>' +
          '<td><span class="tag blue">' + (x.ciclo === "1-3" ? "1.º a 3.º" : "4.º a 6.º") + '</span></td>' +
          '<td>' + x.materias + '</td>' +
          '<td>' + ((x.docentes||[]).map(n=>esc(n)).join(", ") || '<span class="note">—</span>') + '</td>' +
          '<td>' + (Number(x.sin_docente) ? '<span class="tag orange">' + x.sin_docente + '</span>' : '<span class="tag green">0</span>') + '</td></tr>').join("") +
        '</tbody></table></div>' : "") +
      '</div>';
  },
  async asignar(){
    const cur = $("g-cur").value, doc = $("g-doc").value, hs = $("g-hs").value;
    if(!cur || !doc){ alert("Elegí el grado y el docente."); return; }
    const { data, error } = await db.rpc("asignar_docente_grado", {
      p_course_id: cur, p_teacher_id: doc,
      p_horas: hs === "" ? null : Number(hs),
      p_reemplazar: $("g-rep").value === "1"
    });
    if(error){ alert("No se pudo asignar: " + error.message); return; }
    aviso("Listo. Materias asignadas: " + data.materias_asignadas +
      (data.materias_creadas ? " (se crearon " + data.materias_creadas + " materias nuevas)" : "") + ".");
    UI.ir("estructura");
  }
};

(function(){
  if(typeof Admin === "undefined" || !Admin.vEstructura) return;
  const v = Admin.vEstructura.bind(Admin);
  Admin.vEstructura = async function(){
    await v();
    await Grado.cargar();
    const el = $("view");
    if(!el) return;
    const cards = Array.from(el.querySelectorAll(".card"));
    const t = cards.find(c=>{ const h = c.querySelector("h2"); return h && h.textContent.trim() === "Asignar docente"; });
    if(t){
      t.insertAdjacentHTML("beforebegin", Grado.html());
      t.insertAdjacentHTML("afterbegin", '<p class="note">Usá este bloque solo para <b>una materia suelta</b> (secundaria, o Informática e Inglés de primaria). Para el maestro de grado usá el bloque de arriba.</p>');
    } else {
      el.insertAdjacentHTML("beforeend", Grado.html());
    }
  };
})();
