/* ==================== INCLUSION Y CIERRE DE CLASE ==================== */
/* Se agrega encima de docente.js y alumno.js sin modificarlos. */

const Inclusion = {
  lista: [],

  /* ---------- panel del docente: quienes trabajan con adaptacion ---------- */
  async cargar(){
    const a = asignacionActual();
    if(!a) return [];
    const { data } = await db.from("enrollments")
      .select("students(id,nombre,adaptacion,nivel_apoyo,apoyo_grupo,apoyo_nota)")
      .eq("course_id", a.course_id).eq("activo", true);
    Inclusion.lista = (data||[]).map(e=>e.students).filter(Boolean)
      .sort((x,y)=>x.nombre.localeCompare(y.nombre));
    return Inclusion.lista;
  },
  card(){
    const ls = Inclusion.lista;
    const con = ls.filter(s=>s.adaptacion);
    const grupos = {};
    con.forEach(s=>{ const g = (s.apoyo_grupo||"").trim(); if(g){ (grupos[g] = grupos[g]||[]).push(s.nombre); } });
    return '<div class="card">' +
      '<h2>\u267F Inclusi\u00f3n y adaptaciones</h2>' +
      '<p class="sub">Marc\u00e1 qui\u00e9nes necesitan adaptaci\u00f3n curricular. A esos alumnos la plataforma les muestra la versi\u00f3n adaptada del tema y de la actividad, con pasos m\u00e1s cortos y menos texto. Si les pon\u00e9s el mismo <b>equipo de apoyo</b>, pueden trabajar y entregar juntos.</p>' +
      (ls.length ? '<table class="tb"><tr><th>Alumno</th><th>Adaptaci\u00f3n</th><th>C\u00f3mo trabaja</th><th>Equipo de apoyo</th><th>Observaci\u00f3n</th></tr>' +
        ls.map(s=>{
          const on = !!s.adaptacion;
          return '<tr>' +
            '<td>' + esc(s.nombre) + '</td>' +
            '<td><input type="checkbox" ' + (on?"checked":"") + ' onchange="Inclusion.set(\'' + s.id + '\',\'adaptacion\',this.checked)"></td>' +
            '<td><select ' + (on?"":"disabled") + ' onchange="Inclusion.set(\'' + s.id + '\',\'nivel_apoyo\',this.value)">' +
              ['','lee','no_lee','apoyo'].map(v=>'<option value="'+v+'" '+((s.nivel_apoyo||"")===v?"selected":"")+'>' +
                (v===""?"Elegir":v==="lee"?"Lee solo":v==="no_lee"?"Todav\u00eda no lee":"Necesita acompa\u00f1amiento") + '</option>').join("") +
            '</select></td>' +
            '<td><input value="' + esc(s.apoyo_grupo||"") + '" placeholder="Ej: Equipo A" ' + (on?"":"disabled") + ' style="width:120px" onchange="Inclusion.set(\'' + s.id + '\',\'apoyo_grupo\',this.value)"></td>' +
            '<td><input value="' + esc(s.apoyo_nota||"") + '" placeholder="Opcional" ' + (on?"":"disabled") + ' onchange="Inclusion.set(\'' + s.id + '\',\'apoyo_nota\',this.value)"></td>' +
          '</tr>';
        }).join("") + '</table>' : '<p class="note">Todav\u00eda no hay alumnos cargados en este curso.</p>') +
      (Object.keys(grupos).length ? '<div class="alert info" style="margin-top:10px">Equipos de apoyo: ' +
        Object.keys(grupos).map(g=>'<b>'+esc(g)+'</b>: '+esc(grupos[g].join(", "))).join(" \u00b7 ") + '</div>' : "") +
      (con.length ? '<p class="note">' + con.length + ' alumno(s) con adaptaci\u00f3n. Record\u00e1 cargar la versi\u00f3n adaptada del tema en <b>Clase de hoy</b> (abajo de todo) para cada clase.</p>' : "") +
    '</div>';
  },
  async set(id, campo, valor){
    const v = (campo==="adaptacion") ? !!valor : (String(valor||"").trim() || null);
    const { error } = await db.from("students").update({ [campo]: v }).eq("id", id);
    if(error){ alert("No se pudo guardar: " + error.message); return; }
    const s = Inclusion.lista.find(x=>x.id===id);
    if(s) s[campo] = v;
    if(campo==="adaptacion") UI.ir("alumnos"); else aviso("Guardado.");
  },

  /* ---------- material adaptado de la clase ---------- */
  async cargarPlan(){
    if(!St.sesion || !St.sesion.lesson_plan_id) return null;
    const { data } = await db.from("lesson_plans")
      .select("id,titulo,actividad_adaptada,guia_adaptada,pasos_adaptados,preguntas_adaptadas")
      .eq("id", St.sesion.lesson_plan_id).maybeSingle();
    Inclusion.plan = data || null;
    return Inclusion.plan;
  },
  cardMaterial(){
    const p = Inclusion.plan;
    if(!p) return '<div class="card"><h2>\u267F Material adaptado</h2><p class="note">Abr\u00ed una clase para cargar la versi\u00f3n adaptada.</p></div>';
    const pasos = (p.pasos_adaptados||[]).join("\n");
    const preg = (p.preguntas_adaptadas||[]).join("\n");
    return '<div class="card">' +
      '<h2>\u267F Material adaptado de esta clase</h2>' +
      '<p class="sub">Esto es lo que ven <b>solo</b> los alumnos marcados con adaptaci\u00f3n. El resto sigue con la actividad normal.</p>' +
      '<label>T\u00edtulo de la actividad adaptada</label><input id="ad-tit" value="' + esc(p.actividad_adaptada||"") + '">' +
      '<label>Explicaci\u00f3n del tema, en palabras simples (una idea por l\u00ednea)</label><textarea id="ad-guia" rows="4">' + esc(p.guia_adaptada||"") + '</textarea>' +
      '<label>Pasos de la actividad adaptada (uno por l\u00ednea)</label><textarea id="ad-pasos" rows="7">' + esc(pasos) + '</textarea>' +
      '<label>Preguntas del cierre, m\u00e1s simples (una por l\u00ednea)</label><textarea id="ad-preg" rows="3">' + esc(preg) + '</textarea>' +
      '<button class="btn" onclick="Inclusion.guardarMaterial()">Guardar material adaptado</button>' +
    '</div>';
  },
  async guardarMaterial(){
    if(!Inclusion.plan) return;
    const lineas = id => ($(id).value||"").split("\n").map(s=>s.trim()).filter(Boolean);
    const { error } = await db.from("lesson_plans").update({
      actividad_adaptada: $("ad-tit").value.trim() || null,
      guia_adaptada: $("ad-guia").value.trim() || null,
      pasos_adaptados: lineas("ad-pasos"),
      preguntas_adaptadas: lineas("ad-preg")
    }).eq("id", Inclusion.plan.id);
    if(error){ alert("No se pudo guardar: " + error.message); return; }
    aviso("Material adaptado guardado.");
  },

  /* ---------- cerrar y guardar la clase ---------- */
  cardCierre(){
    if(!St.sesion) return "";
    return '<div class="card">' +
      '<h2>\u2705 Cerrar y guardar la clase</h2>' +
      '<p class="sub">Al cerrar, la clase queda guardada en tu registro con la asistencia, las entregas y tus observaciones. Los alumnos ya no pueden entrar con el c\u00f3digo.</p>' +
      '<label>C\u00f3mo result\u00f3 la clase (opcional)</label><textarea id="cl-nota" rows="3" placeholder="Ej: se trabaj\u00f3 bien, faltaron dos alumnos, el equipo de apoyo termin\u00f3 la tabla."></textarea>' +
      '<button class="btn" onclick="Inclusion.cerrarClase()">Cerrar y guardar la clase</button>' +
    '</div>';
  },
  async cerrarClase(){
    if(!St.sesion) return;
    if(!confirm("\u00bfCerr\u00e1s la clase? Los alumnos ya no van a poder entrar con el c\u00f3digo.")) return;
    const nota = $("cl-nota") ? $("cl-nota").value : "";
    const { error } = await db.rpc("cerrar_clase", { p_session_id: St.sesion.id, p_nota: nota || null });
    if(error){ alert("No se pudo cerrar: " + error.message); return; }
    St.sesion = null;
    UI.ir("clase");
    aviso("Clase cerrada y guardada en el registro.");
  },

  /* ---------- registro de clases dictadas ---------- */
  async registro(){
    const a = asignacionActual();
    if(!a) return [];
    const { data } = await db.rpc("clases_dictadas", { p_course_subject_id: a.id });
    return data || [];
  },
  cardRegistro(rs){
    if(!rs.length) return '<div class="card"><h2>\u{1F4D2} Registro de clases</h2><p class="note">Todav\u00eda no hay clases guardadas en este curso.</p></div>';
    return '<div class="card"><h2>\u{1F4D2} Registro de clases</h2>' +
      '<table class="tb"><tr><th>Fecha</th><th>Clase</th><th>Estado</th><th>Asistencia</th><th>Entregas</th><th>Observaci\u00f3n</th></tr>' +
      rs.map(r=>{
        const s = r.resumen || {};
        return '<tr>' +
          '<td>' + esc(r.fecha||"") + '</td>' +
          '<td>' + (r.plan_numero ? "N\u00ba " + r.plan_numero + " \u00b7 " : "") + esc(r.plan_titulo||"Sin plan") + '</td>' +
          '<td>' + (r.abierta ? '<span class="tag green">Abierta</span>' : '<span class="tag gray">Cerrada</span>') + '</td>' +
          '<td>' + (r.abierta ? "\u2014" : ((s.presentes||0) + " pres. \u00b7 " + (s.ausentes||0) + " aus. \u00b7 " + (s.justificados||0) + " just.")) + '</td>' +
          '<td>' + (r.abierta ? "\u2014" : ((s.entregas||0) + " (" + (s.corregidas||0) + " corregidas" + (s.promedio!=null?", prom. "+s.promedio:"") + ")")) + '</td>' +
          '<td>' + esc(r.cerrada_nota||"") + '</td>' +
        '</tr>';
      }).join("") + '</table></div>';
  }
};

/* ---------- enganches con las vistas que ya existen ---------- */
(function(){
  if(typeof Docente === "undefined") return;

  const vAlumnos = Docente.vAlumnos.bind(Docente);
  Docente.vAlumnos = async function(){
    await vAlumnos();
    await Inclusion.cargar();
    const v = $("view"); if(v) v.insertAdjacentHTML("beforeend", Inclusion.card());
  };

  const vClase = Docente.vClase.bind(Docente);
  Docente.vClase = async function(){
    await vClase();
    const v = $("view"); if(!v) return;
    if(St.sesion){
      await Inclusion.cargarPlan();
      v.insertAdjacentHTML("beforeend", Inclusion.cardMaterial());
      v.insertAdjacentHTML("beforeend", Inclusion.cardCierre());
    }
    const rs = await Inclusion.registro();
    v.insertAdjacentHTML("beforeend", Inclusion.cardRegistro(rs));
  };
})();

/* ---------- el alumno con adaptacion recibe el material adaptado ---------- */
(function(){
  if(typeof Alumno === "undefined") return;

  Alumno.adaptar = function(){
    const a = Alumno.aula, yo = Alumno.yo;
    if(!a || !a.clase || !yo) return;
    const equipo = (Alumno.equipo||[]).concat([yo]);
    const alguno = equipo.some(x=>x && x.adaptacion);
    const ad = a.clase.adaptada || {};
    const hay = ad.guia_alumno || (ad.pasos && ad.pasos.length) || ad.actividad_titulo;
    if(!alguno || !hay) return;
    if(!a.clase._original) a.clase._original = {
      actividad_titulo: a.clase.actividad_titulo,
      guia_alumno: a.clase.guia_alumno,
      pasos: a.clase.pasos,
      preguntas: a.clase.preguntas
    };
    if(ad.actividad_titulo) a.clase.actividad_titulo = ad.actividad_titulo;
    if(ad.guia_alumno) a.clase.guia_alumno = ad.guia_alumno;
    if(ad.pasos && ad.pasos.length) a.clase.pasos = ad.pasos;
    if(ad.preguntas && ad.preguntas.length) a.clase.preguntas = ad.preguntas;
    a.clase.es_adaptada = true;
  };

  const render = Alumno.render.bind(Alumno);
  Alumno.render = function(){
    Alumno.adaptar();
    render();
    if(Alumno.aula && Alumno.aula.clase && Alumno.aula.clase.es_adaptada){
      const v = $("alu-view");
      if(v) v.insertAdjacentHTML("afterbegin",
        '<div class="alert info">Esta actividad est\u00e1 preparada para vos y tu equipo. Van paso a paso, sin apurarse.</div>');
    }
  };
})();
