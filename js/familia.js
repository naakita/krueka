/* ==================== KRUEKA · FAMILIA Y COMUNICADOS ====================
   v1 — Recomendación de mayor impacto:
   - Hoy la info queda en docente/dirección. La familia pregunta por WhatsApp.
   - Este módulo cierra el loop: comunicados + ficha del alumno para la familia,
     sin romper clases por etapas ni cambiar tablas existentes.
   - Modo demo: si aún no corriste supabase_familia.sql, guarda comunicados
     en localStorage y lee asistencia/notas de las vistas que ya existen.

   Instalación:
   1. Subí js/familia.js al hosting y agregá el <script> en app.html
   2. (Opcional pero recomendado) corré supabase_familia.sql en Supabase
   ============================================================================ */

const Familia = {
  cursoId: null, alumnoId: null, alumnoNombre: "", cursos: [], alumnos: [], coms: [], ficha: null,

  /* ---------- entrada familia (tab nuevo) ---------- */
  async initTab(){
    // Agrega el tercer tab si el HTML aún es el viejo de 2 tabs
    const tabs = document.querySelector("#screen-login .tabs");
    if(tabs && !$("tab-fam")){
      const b = document.createElement("button");
      b.id = "tab-fam"; b.type = "button";
      b.setAttribute("aria-selected","false");
      b.textContent = "Soy familia";
      b.onclick = ()=>UI.loginTab("fam");
      tabs.appendChild(b);
      // formulario familia
      const card = tabs.parentElement;
      const f = document.createElement("form");
      f.id = "form-fam"; f.className = "hidden";
      f.onsubmit = (e)=>Familia.entrar(e);
      f.innerHTML =
        '<div id="err-fam" class="alert err hidden"></div>' +
        '<label for="fam-curso">Curso del estudiante</label><select id="fam-curso" onchange="Familia.cargarAlumnos()"><option value="">Cargando cursos…</option></select>' +
        '<label for="fam-alu">Estudiante</label><select id="fam-alu"><option value="">Primero elegí el curso</option></select>' +
        '<div class="linkfila"><a href="index.html">← Volver al inicio</a></div>' +
        '<div style="height:14px"></div>' +
        '<button class="btn" style="width:100%;justify-content:center" type="submit">Ver ficha de mi hijo/a</button>' +
        '<p class="note" style="text-align:center;margin:12px 0 0">Acceso simple para la familia: sin contraseña. Elegí el curso y el nombre tal como está en la lista del docente.</p>';
      card.insertBefore(f, card.querySelector("p.note"));
      Familia.cargarCursos();
    }
    // parche loginTab para 3 estados
    if(UI && !UI._famPatch){
      UI._famPatch = true;
      const orig = UI.loginTab.bind(UI);
      UI.loginTab = function(w){
        orig(w === "fam" ? "doc" : w);
        const esFam = (w === "fam");
        ["tab-doc","tab-alu","tab-fam"].forEach(id=>{
          const el = $(id); if(el) el.setAttribute("aria-selected", id === ("tab-"+w));
        });
        ["form-doc","form-alu","form-fam"].forEach(id=>{
          const el = $(id); if(el) el.classList.toggle("hidden", id !== ("form-"+w));
        });
        if(esFam) Familia.cargarCursos();
      };
    }
  },

  async cargarCursos(){
    const sel = $("fam-curso");
    if(!sel) return;
    try{
      // cursos públicos con alumnos activos (solo id + nombre, sin datos sensibles)
      const { data, error } = await db.from("courses").select("id,nombre").order("nombre").limit(200);
      if(error) throw error;
      Familia.cursos = data || [];
      sel.innerHTML = '<option value="">Elegí el curso</option>' +
        Familia.cursos.map(c=>'<option value="'+c.id+'">'+esc(c.nombre)+'</option>').join("");
    }catch(e){
      sel.innerHTML = '<option value="">No se pudo cargar (revisá tu conexión)</option>';
    }
  },

  async cargarAlumnos(){
    const cid = $("fam-curso").value, sel = $("fam-alu");
    Familia.cursoId = cid || null;
    if(!cid){ sel.innerHTML = '<option value="">Primero elegí el curso</option>'; return; }
    sel.innerHTML = '<option value="">Cargando…</option>';
    try{
      const { data, error } = await db.from("enrollments")
        .select("students(id,nombre)").eq("course_id", cid).eq("activo", true).limit(500);
      if(error) throw error;
      Familia.alumnos = (data||[]).map(e=>e.students).filter(Boolean)
        .sort((a,b)=>a.nombre.localeCompare(b.nombre));
      sel.innerHTML = '<option value="">Elegí el nombre</option>' +
        Familia.alumnos.map(a=>'<option value="'+a.id+'">'+esc(a.nombre)+'</option>').join("");
    }catch(e){
      sel.innerHTML = '<option value="">No se pudo cargar la lista</option>';
    }
  },

  async entrar(e){
    if(e) e.preventDefault();
    const err = $("err-fam");
    const cid = $("fam-curso").value, aid = $("fam-alu").value;
    if(!cid || !aid){ err.textContent = "Elegí el curso y el nombre del estudiante."; err.classList.remove("hidden"); return; }
    err.classList.add("hidden");
    Familia.cursoId = cid; Familia.alumnoId = aid;
    Familia.alumnoNombre = ($("fam-alu").selectedOptions[0]||{}).textContent || "";
    $("screen-login").classList.add("hidden");
    $("screen-app").classList.add("hidden");
    let p = $("screen-fam");
    if(!p){
      p = document.createElement("div");
      p.id = "screen-fam";
      p.innerHTML = '<div class="topbar"><div class="in"><img class="marca" alt="Krueka" style="height:32px">' +
        '<div><b>Portal Familia</b><div class="note" id="fam-who"></div></div>' +
        '<button class="btn sec sm" style="margin-left:auto" onclick="location.reload()">Salir</button></div></div>' +
        '<div class="wrap" id="fam-view"><div class="spinner">Cargando…</div></div>';
      document.body.appendChild(p);
      document.querySelectorAll("img.marca").forEach(i=>{ if(!i.src) i.src = (window.KRUEKA_BASE||"")+"logo.svg"; });
    }
    p.classList.remove("hidden");
    $("fam-who").textContent = Familia.alumnoNombre;
    Familia.verFicha();
  },

  /* ---------- ficha del alumno ---------- */
  async verFicha(){
    const v = $("fam-view");
    v.innerHTML = '<div class="spinner">Cargando ficha…</div>';
    let resumen = null, asis = [], coms = [];
    try{
      const r = await db.from("v_alumno_resumen").select("*").ilike("alumno", Familia.alumnoNombre).limit(5);
      if(r.data && r.data.length){
        resumen = r.data.find(x=>String(x.curso||"") && true) || r.data[0];
        // si hay varios cursos, preferir el curso elegido
        const cn = (Familia.cursos.find(c=>c.id===Familia.cursoId)||{}).nombre;
        if(cn){ const m = r.data.find(x=>x.curso===cn); if(m) resumen = m; }
      }
    }catch(e){}
    try{
      // últimas asistencias (vía sessions del curso)
      const s = await db.from("class_sessions").select("id,created_at,fecha")
        .order("created_at",{ascending:false}).limit(60);
      const ids = (s.data||[]).map(x=>x.id);
      if(ids.length){
        const a = await db.from("attendance").select("estado,registrado_at,session_id")
          .eq("student_id", Familia.alumnoId).in("session_id", ids).limit(60);
        asis = a.data || [];
      }
    }catch(e){}
    coms = await Comunicados.paraFamilia(Familia.cursoId);
    Familia.ficha = { resumen, asis, coms };

    const r = resumen || {};
    const pres = r.presentes ?? asis.filter(a=>a.estado==="presente").length;
    const aus = r.ausentes ?? asis.filter(a=>a.estado==="ausente").length;
    const tar = r.tardanzas ?? asis.filter(a=>a.estado==="tarde").length;
    const prom = (r.promedio==null || r.promedio==="") ? "—" : r.promedio;
    const cond = (r.puntos_conducta==null) ? "—" : r.puntos_conducta;

    v.innerHTML =
      '<div class="card" style="text-align:center"><span class="tag green">Portal Familia</span>' +
      '<h1 style="margin-top:8px">'+esc(Familia.alumnoNombre)+'</h1>' +
      '<p class="sub">'+esc(r.curso || ((Familia.cursos.find(c=>c.id===Familia.cursoId)||{}).nombre||""))+'</p>' +
      '<div class="grid3" style="text-align:left">' +
      '<div class="kpi"><b>'+pres+'</b><span>Presentes</span></div>' +
      '<div class="kpi"><b>'+aus+'</b><span>Ausentes</span></div>' +
      '<div class="kpi"><b>'+tar+'</b><span>Tardanzas</span></div>' +
      '<div class="kpi"><b>'+prom+'</b><span>Promedio</span></div>' +
      '<div class="kpi"><b>'+cond+'</b><span>Puntos de conducta</span></div>' +
      '<div class="kpi"><b>'+coms.length+'</b><span>Comunicados</span></div>' +
      '</div></div>' +
      '<div class="card"><h2>Comunicados de la escuela</h2>' +
      (coms.length ? coms.map(c=>
        '<div class="stage on" style="display:block"><b>'+esc(c.titulo)+'</b>' +
        '<div class="note">'+esc(c.fecha||"")+(c.curso_nombre?" · "+esc(c.curso_nombre):"")+'</div>' +
        '<div>'+esc(c.cuerpo).replace(/\n/g,"<br>")+'</div></div>'
      ).join("") : '<p class="note">No hay comunicados para este curso todavía.</p>') + '</div>' +
      '<div class="card"><h2>Últimas asistencias</h2>' +
      (asis.length ? '<table><thead><tr><th>Fecha</th><th>Estado</th></tr></thead><tbody>' +
        asis.slice(0,20).map(a=>'<tr><td class="note">'+esc((a.registrado_at||"").slice(0,10))+'</td>' +
          '<td><span class="tag '+(a.estado==="presente"?"green":a.estado==="tarde"?"orange":a.estado==="ausente"?"red":"blue")+'">'+esc(a.estado)+'</span></td></tr>').join("") +
        '</tbody></table>' : '<p class="note">Todavía no hay asistencias registradas para mostrar.</p>') + '</div>' +
      '<div class="card"><h2>Ficha para imprimir</h2>' +
      '<p class="sub">Descargá la ficha con asistencia, promedio y comunicados para firmar o archivar.</p>' +
      '<div class="row"><button class="btn sec" onclick="Familia.descargarFicha()">Descargar en Word</button>' +
      '<button class="btn sec" onclick="Familia.verFicha()">Actualizar</button></div></div>' +
      '<p class="note" style="text-align:center">¿Ves un error en los datos? Escribí a <a href="mailto:contacto@krueka.com">contacto@krueka.com</a> indicando curso y nombre del estudiante.</p>';
    Comunicados.marcarLeidos(coms);
  },

  descargarFicha(){
    if(typeof KG === "undefined" || !KG.word){ alert("La descarga estará disponible al actualizar la app."); return; }
    const f = Familia.ficha || {}, r = f.resumen || {};
    const rows = (f.asis||[]).slice(0,30).map(a=>"<tr><td>"+esc((a.registrado_at||"").slice(0,10))+"</td><td>"+esc(a.estado)+"</td></tr>").join("");
    const coms = (f.coms||[]).map(c=>"<p><b>"+esc(c.titulo)+"</b> ("+esc(c.fecha||"")+")<br>"+esc(c.cuerpo)+"</p>").join("");
    KG.word("Ficha_"+Familia.alumnoNombre.replace(/\s+/g,"_"),
      "Ficha del estudiante",
      "<h1>Ficha del estudiante — Krueka</h1>" +
      "<p><b>Estudiante:</b> "+esc(Familia.alumnoNombre)+"<br><b>Curso:</b> "+esc(r.curso||"")+
      "<br><b>Promedio:</b> "+esc(String(r.promedio ?? "—"))+"<br><b>Conducta:</b> "+esc(String(r.puntos_conducta ?? "—"))+"</p>" +
      "<h2>Asistencia reciente</h2><table><tr><th>Fecha</th><th>Estado</th></tr>"+rows+"</table>" +
      "<h2>Comunicados</h2>"+(coms||"<p>Sin comunicados.</p>"));
  }
};

/* ==================== COMUNICADOS (docente / dirección) ==================== */

const Comunicados = {
  KEY: "krueka_coms_demo",
  tablaOK: null,

  demoLeer(){
    try{ return JSON.parse(localStorage.getItem(Comunicados.KEY)||"[]"); }
    catch(e){ return []; }
  },
  demoGuardar(l){ localStorage.setItem(Comunicados.KEY, JSON.stringify(l)); },

  async hayTabla(){
    if(Comunicados.tablaOK !== null) return Comunicados.tablaOK;
    try{
      const r = await db.from("comunicados").select("id").limit(1);
      Comunicados.tablaOK = !r.error;
    }catch(e){ Comunicados.tablaOK = false; }
    return Comunicados.tablaOK;
  },

  async listar(){
    // 1) intenta tabla real, 2) cae a demo local (no rompe nada)
    if(await Comunicados.hayTabla()){
      try{
        let q = db.from("comunicados").select("id,titulo,cuerpo,course_id,created_at,courses(nombre)").order("created_at",{ascending:false}).limit(100);
        if(St.perfil && St.perfil.role === "docente"){
          const cids = (St.asignaciones||[]).map(a=>a.courses.id);
          if(cids.length) q = q.or("course_id.is.null,course_id.in.("+cids.join(",")+")");
        }
        const { data, error } = await q;
        if(!error) return (data||[]).map(x=>({ id:x.id, titulo:x.titulo, cuerpo:x.cuerpo,
          course_id:x.course_id, curso_nombre:x.courses?x.courses.nombre:"Toda la escuela",
          fecha:(x.created_at||"").slice(0,10) }));
      }catch(e){}
    }
    return Comunicados.demoLeer().map((x,i)=>({ id:"demo-"+i, titulo:x.titulo, cuerpo:x.cuerpo,
      course_id:x.course_id, curso_nombre:x.curso_nombre||"Curso", fecha:x.fecha }));
  },

  async paraFamilia(courseId){
    const todos = await Comunicados.listar();
    const cn = (Familia.cursos.find(c=>c.id===courseId)||{}).nombre;
    return todos.filter(c=>!c.course_id || c.course_id===courseId || (cn && c.curso_nombre===cn));
  },

  async crear(titulo, cuerpo, courseId){
    if(await Comunicados.hayTabla()){
      const { error } = await db.from("comunicados").insert({
        institution_id: St.perfil.institution_id, autor_id: St.perfil.id,
        titulo, cuerpo, course_id: courseId || null });
      if(error){ alert("No se pudo publicar: "+error.message); return false; }
      return true;
    }
    // demo local
    const l = Comunicados.demoLeer();
    const cn = courseId ? ((KG.cursos().find(c=>c.id===courseId)||{}).nombre || "Curso") : "Toda la escuela";
    l.unshift({ titulo, cuerpo, course_id:courseId||null, curso_nombre:cn, fecha:new Date().toISOString().slice(0,10) });
    Comunicados.demoGuardar(l);
    return true;
  },

  async borrar(id){
    if(String(id).startsWith("demo-")){
      const l = Comunicados.demoLeer();
      l.splice(Number(String(id).split("-")[1]),1);
      Comunicados.demoGuardar(l);
      return;
    }
    await db.from("comunicados").delete().eq("id", id);
  },

  async marcarLeidos(){ /* v2: registra lectura por alumno cuando exista la tabla lecturas */ },

  /* ---------- vista docente / dirección ---------- */
  async vComunicados(){
    await cargarAsignaciones();
    const lista = await Comunicados.listar();
    const cursos = KG.cursos();
    const esDir = St.perfil && (St.perfil.role === "director" || St.perfil.role === "admin");
    $("view").innerHTML =
      '<h1>Comunicados</h1>' +
      '<p class="sub">Avisá a las familias sin usar WhatsApp: reuniones, actos, cuotas del club, cambios de horario. ' +
      (!(await Comunicados.hayTabla()) ? 'Estás en <b>modo demo</b> (se guarda en esta PC). Corré <b>supabase_familia.sql</b> para que llegue a todas las familias.' : 'Publicado en la base central: la familia lo ve en el Portal Familia.') + '</p>' +
      '<div class="card"><h2>Nuevo comunicado</h2>' +
      '<label>Título</label><input id="cm-t" placeholder="Ej.: Reunión de padres — viernes 19:00">' +
      '<label>Mensaje</label><textarea id="cm-c" style="min-height:90px" placeholder="Escribí claro y corto: qué, cuándo, dónde y qué traer."></textarea>' +
      '<label>Destino</label><select id="cm-curso"><option value="">Toda la escuela</option>' +
      cursos.map(c=>'<option value="'+c.id+'">'+esc(c.nombre)+'</option>').join("") + '</select>' +
      '<div style="height:10px"></div><button class="btn" onclick="Comunicados.publicar()">Publicar comunicado</button></div>' +
      '<div class="card"><h2>Publicados ('+lista.length+')</h2>' +
      (lista.length ? lista.map(c=>
        '<div class="stage on" style="display:block"><div class="row" style="justify-content:space-between;align-items:center">' +
        '<div style="flex:1"><b>'+esc(c.titulo)+'</b><div class="note">'+esc(c.fecha||"")+' · '+esc(c.curso_nombre||"")+'</div>' +
        '<div style="margin-top:6px">'+esc(c.cuerpo).replace(/\n/g,"<br>")+'</div></div>' +
        (esDir || true ? '<button class="btn sec sm" onclick="Comunicados.eliminar(\''+c.id+'\')">Borrar</button>' : "") +
        '</div></div>').join("") : '<p class="note">Todavía no publicaste nada. El primero puede ser: “Bienvenidos a Krueka — así van a recibir los avisos”. </p>') +
      '</div>';
  },

  async publicar(){
    const t = ($("cm-t").value||"").trim(), c = ($("cm-c").value||"").trim();
    const curso = $("cm-curso").value || null;
    if(t.length < 4){ alert("Poné un título un poco más claro."); return; }
    if(c.length < 10){ alert("El mensaje es muy corto: contá qué, cuándo y dónde."); return; }
    const ok = await Comunicados.crear(t, c, curso);
    if(ok){ aviso("Comunicado publicado."); UI.ir("comunicados"); }
  },

  async eliminar(id){
    if(!confirm("¿Borrar este comunicado? Las familias ya no lo van a ver.")) return;
    await Comunicados.borrar(id);
    UI.ir("comunicados");
  }
};

/* ---------- parche de menú (no toca los archivos viejos) ---------- */
(function(){
  if(typeof UI === "undefined") return;
  if(UI._comsPatch) return;
  UI._comsPatch = true;
  const base = UI.menus.bind(UI);
  UI.menus = function(){
    const m = base();
    const r = St.perfil ? St.perfil.role : "";
    if((r==="docente"||r==="director"||r==="admin") && !m.some(x=>x[0]==="comunicados")){
      m.splice(1, 0, ["comunicados","Comunicados"]);
    }
    if(r==="director"||r==="admin"){
      if(!m.some(x=>x[0]==="portal-fam")) m.push(["portal-fam","Portal Familia"]);
    }
    return m;
  };
  const irBase = UI.ir.bind(UI);
  UI.ir = function(k){
    if(k === "comunicados"){ St.tab = k;
      document.querySelectorAll("#nav button").forEach(b=>b.setAttribute("aria-selected", b.dataset.k===k));
      $("view").innerHTML = '<div class="spinner">Cargando…</div>';
      Comunicados.vComunicados(); return; }
    if(k === "portal-fam"){ St.tab = k;
      document.querySelectorAll("#nav button").forEach(b=>b.setAttribute("aria-selected", b.dataset.k===k));
      $("view").innerHTML =
        '<div class="card"><h2>Portal Familia — vista previa</h2>' +
        '<p class="sub">Así lo ve la familia. Probalo sin salir de tu usuario.</p>' +
        '<div class="row"><button class="btn" onclick="Comunicados.vistaPrevia()">Abrir vista previa</button></div></div>';
      return; }
    return irBase(k);
  };
  Comunicados.vistaPrevia = async function(){
    const w = window.open(location.pathname, "_blank");
    if(!w) alert("El navegador bloqueó la ventana. Permití ventanas emergentes para ver la vista previa.");
  };
  // activar tab familia en el login
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", ()=>Familia.initTab());
  else Familia.initTab();
})();
