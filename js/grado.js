/* ==================== CICLOS Y DOCENTE DE GRADO ====================
   Primer ciclo   · 1.o a 3.o grado   → maestro de grado (9 materias)
   Segundo ciclo  · 4.o a 6.o grado   → maestro de grado (10 materias)
   Tercer ciclo   · 7.o a 9.o grado   → por materia
   Nivel medio    · 1.er a 3.er curso → por materia
===================================================================== */

const CICLOS = [
  ["1-3",   "Primer ciclo",  "1.º a 3.º grado",   "9 materias · maestro de grado"],
  ["4-6",   "Segundo ciclo", "4.º a 6.º grado",   "10 materias · maestro de grado"],
  ["7-9",   "Tercer ciclo",  "7.º a 9.º grado",   "por materia"],
  ["media", "Nivel medio",   "1.º a 3.º curso",   "por materia"]
];

const Grado = {
  docentes: [], resumen: [],
  async cargar(){
    const [d, r] = await Promise.all([
      db.from("profiles").select("id,nombre").eq("role","docente").eq("activo", true).order("nombre"),
      db.rpc("docentes_de_grado")
    ]);
    Grado.docentes = d.data || [];
    Grado.resumen = r.data || [];
  },
  primaria(){ return Grado.resumen.filter(x=>x.maestro_de_grado); },
  html(){
    const prim = Grado.primaria();
    return '<div class="card" style="border-color:#2783DE">' +
      '<h2>Docente de grado (primaria)</h2>' +
      '<p class="sub">En el <b>primer ciclo</b> (1.º a 3.º) y en el <b>segundo ciclo</b> (4.º a 6.º) el maestro está a cargo de <b>todo el grado</b>. Elegí el grado y el docente: la plataforma crea de una sola vez las materias oficiales del ciclo y se las asigna todas. En el <b>tercer ciclo</b> (7.º a 9.º) y en el <b>nivel medio</b> (1.º a 3.º curso) la asignación es por materia, con el bloque de abajo.</p>' +
      (prim.length
        ? '<div class="grid2">' +
          '<div><label>Grado</label><select id="g-cur">' +
            prim.map(c=>'<option value="' + c.course_id + '">' + esc(c.curso) + '</option>').join("") + '</select></div>' +
          '<div><label>Docente a cargo</label><select id="g-doc">' +
            Grado.docentes.map(d=>'<option value="' + d.id + '">' + esc(d.nombre) + '</option>').join("") + '</select></div>' +
          '<div><label>Horas semanales por materia (opcional)</label><input id="g-hs" type="number" step="0.5" placeholder="dejar vacío"></div>' +
          '<div><label>Materias que ya tienen otro docente</label><select id="g-rep">' +
            '<option value="1">Pasarlas también a este docente</option>' +
            '<option value="0">Dejarlas como están</option></select></div>' +
          '</div><div style="height:10px"></div>' +
          '<button class="btn" onclick="Grado.asignar()">Asignar docente a todo el grado</button>'
        : '<p class="alert info">Todavía no hay grados de 1.º a 6.º cargados. Creá el curso con su grado (por ejemplo <b>6.º</b>) y vuelve a aparecer acá.</p>') +
      '</div>' +
      Grado.tabla();
  },
  tabla(){
    return '<div class="card"><h2>Grados y cursos por ciclo</h2>' +
      '<p class="sub">Si un curso aparece sin ciclo, completá su campo <b>Grado</b> (por ejemplo 6.º, 8.º o 2.º Curso).</p>' +
      CICLOS.map(c=>{
        const filas = Grado.resumen.filter(x=>x.ciclo === c[0]);
        return '<h3 style="margin-top:14px">' + c[1] + ' <span class="note">' + c[2] + ' · ' + c[3] + '</span></h3>' +
          (filas.length
            ? '<div style="overflow:auto"><table><thead><tr><th>Curso</th><th>Materias</th><th>Docentes</th><th>Sin docente</th></tr></thead><tbody>' +
              filas.map(x=>'<tr><td><b>' + esc(x.curso) + '</b></td><td>' + x.materias + '</td>' +
                '<td>' + ((x.docentes||[]).map(n=>esc(n)).join(", ") || '<span class="note">—</span>') + '</td>' +
                '<td>' + (Number(x.sin_docente) ? '<span class="tag orange">' + x.sin_docente + '</span>' : '<span class="tag green">0</span>') + '</td></tr>').join("") +
              '</tbody></table></div>'
            : '<p class="note">Sin cursos cargados en este ciclo.</p>');
      }).join("") +
      (Grado.resumen.some(x=>!x.ciclo)
        ? '<h3 style="margin-top:14px">Sin ciclo definido</h3><ul>' +
          Grado.resumen.filter(x=>!x.ciclo).map(x=>'<li>' + esc(x.curso) + '</li>').join("") +
          '</ul><p class="note">Renombrá el curso o cargá su grado para que entre en el ciclo que corresponde.</p>'
        : "") +
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
    aviso("Listo. " + data.ciclo_nombre + ". Materias asignadas: " + data.materias_asignadas +
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
      t.insertAdjacentHTML("afterbegin", '<p class="note">Usá este bloque para <b>una materia suelta</b>: tercer ciclo, nivel medio, o Informática e Inglés de primaria. Para el maestro de grado usá el bloque de arriba.</p>');
    } else {
      el.insertAdjacentHTML("beforeend", Grado.html());
    }
  };
})();
