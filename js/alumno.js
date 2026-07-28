/* ==================== AULA DEL ALUMNO ==================== */
const Alumno = { aula:null, codigo:"", yo:null,
  async buscar(){
    const cod = $("cod").value.trim().toUpperCase();
    const sel = $("nom");
    if(cod.length < 6){ sel.innerHTML = '<option value="">Primero escribí el código</option>'; return; }
    const { data, error } = await db.rpc("aula_por_codigo", { p_codigo:cod });
    if(error || !data){ sel.innerHTML = '<option value="">Código no encontrado</option>'; return; }
    Alumno.aula = data; Alumno.codigo = cod;
    sel.innerHTML = '<option value="">Elegí tu nombre</option>' + (data.alumnos||[]).map(a=>`<option value="${a.id}">${esc(a.nombre)}</option>`).join("");
  },
  async entrar(e){
    e.preventDefault();
    const err = $("err-alu"); err.classList.add("hidden");
    if(!Alumno.aula){ err.textContent = "Ese código no corresponde a ninguna clase abierta."; err.classList.remove("hidden"); return; }
    if(!$("nom").value){ err.textContent = "Elegí tu nombre en la lista."; err.classList.remove("hidden"); return; }
    Alumno.yo = { id:$("nom").value, nombre:$("nom").selectedOptions[0].textContent };
    $("screen-login").classList.add("hidden");
    $("screen-alu").classList.remove("hidden");
    $("alu-who").textContent = Alumno.yo.nombre + " · " + Alumno.aula.curso;
    Alumno.render();
    setInterval(Alumno.refrescar, 15000);
  },
  async refrescar(){
    const { data } = await db.rpc("aula_por_codigo", { p_codigo:Alumno.codigo });
    if(data){ Alumno.aula = data; Alumno.render(); }
  },
  async render(){
    const a = Alumno.aula, et = a.etapas||{}, cl = a.clase||{};
    const res = await db.rpc("mi_resultado", { p_codigo:Alumno.codigo, p_student_id:Alumno.yo.id });
    const r = res.data || {};
    $("alu-view").innerHTML = `
      ${et.tema ? `<div class="card">
        <span class="tag blue">${esc(a.materia)}</span>
        <h1 style="margin-top:10px">${esc(cl.titulo||"")}</h1>
        <p class="sub">${esc(cl.unidad||"")}</p>
        <p><b>Lo que vamos a lograr:</b> ${esc(cl.capacidad||"")}</p>
      </div>` : '<div class="card"><h2>Esperá al profesor</h2><p class="sub">En unos momentos se habilita el tema de la clase.</p></div>'}

      ${et.actividad ? `<div class="card">
        <h2>${esc(cl.actividad_titulo||"Actividad")}</h2>
        <p class="sub">${esc(cl.actividad_objetivo||"")}</p>
        ${cl.guia_alumno?`<div class="card" style="background:var(--soft);margin:0 0 12px"><h3>Para guiarte</h3>${cl.guia_alumno.split("\n").filter(Boolean).map(l=>`<p style="margin:4px 0">${esc(l)}</p>`).join("")}</div>`:""}
        <h3>Pasos</h3>
        <ol>${(cl.pasos||[]).map(p=>`<li>${esc(p)}</li>`).join("")}</ol>
        ${cl.actividad_archivo?`<div class="alert info">Guardá tu archivo con el nombre <b>${esc(cl.actividad_archivo)}</b></div>`:""}
        ${Taller.tarjeta(cl.herramienta)}
      </div>` : ""}

      ${et.actividad ? Taller.buscador() : ""}

      ${et.entrega ? `<div class="card">
        <h2>Entregar mi trabajo</h2>
        ${r.entregado?'<div class="alert ok">Ya enviaste tu trabajo. Podés corregirlo y volver a enviar.</div>':""}
        ${(cl.preguntas||[]).map((p,i)=>`<label>${esc(p)}</label><textarea id="q${i}"></textarea>`).join("")}
        <label>Nombre del archivo que guardaste</label><input id="e-arch" value="${esc(cl.actividad_archivo||"")}">
        <label>Enlace (opcional)</label><input id="e-link" placeholder="Si subiste el trabajo a la nube">
        <label>Compañeros de equipo (opcional)</label><input id="e-eq">
        <label>Comentario para el profesor (opcional)</label><input id="e-com">
        <div style="height:12px"></div>
        <button class="btn" onclick="Alumno.entregar(${(cl.preguntas||[]).length})">Enviar mi trabajo</button>
      </div>` : ""}

      ${et.resultado ? `<div class="card">
        <h2>Mi resultado</h2>
        ${r.nota!=null ? `<div class="code" style="font-size:44px">${r.nota}</div><p><b>Devolución:</b> ${esc(r.devolucion||"—")}</p>`
          : '<p class="sub">El profesor todavía no corrigió tu trabajo.</p>'}
      </div>` : ""}`;
  },
  async entregar(nPreg){
    const respuestas = [];
    for(let i=0;i<nPreg;i++) respuestas.push($("q"+i).value.trim());
    const { error } = await db.rpc("entregar_trabajo", {
      p_codigo:Alumno.codigo, p_student_id:Alumno.yo.id, p_respuestas:respuestas,
      p_archivo:$("e-arch").value.trim(), p_enlace:$("e-link").value.trim(),
      p_equipo:$("e-eq").value.trim(), p_comentario:$("e-com").value.trim()
    });
    if(error){ alert("No se pudo enviar: "+error.message); return; }
    Alumno.render();
    alert("Trabajo enviado. Ya le llegó al profesor.");
  }
};

/* ==================== INICIO ==================== */
(async function(){
  const { data } = await db.auth.getSession();
  if(data.session){ St.user = data.session.user; await Auth.cargarPerfil(); }
})();
