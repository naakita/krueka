/* ==================== AULA DEL ALUMNO ==================== */
const Alumno = { aula:null, codigo:"", yo:null, equipo:[], hist:null,
  async buscar(){
    const cod = $("cod").value.trim().toUpperCase();
    const sel = $("nom");
    if(cod.length < 6){ sel.innerHTML = '<option value="">Primero escribí el código</option>'; return; }
    const { data, error } = await db.rpc("aula_por_codigo", { p_codigo:cod });
    if(error || !data){ sel.innerHTML = '<option value="">Código no encontrado</option>'; return; }
    Alumno.aula = data; Alumno.codigo = cod;
    sel.innerHTML = '<option value="">Elegí tu nombre</option>' + Alumno.opciones();
  },
  opciones(excluir){
    const mi = deviceId(), fuera = (excluir||[]).map(x=>x.id);
    return (Alumno.aula.alumnos||[]).filter(a=>!fuera.includes(a.id)).map(a=>{
      const tomado = a.device && a.device !== mi;
      return `<option value="${a.id}" ${tomado?"disabled":""}>${esc(a.nombre)}${tomado?" — ya entró en otra computadora":""}</option>`;
    }).join("");
  },
  async entrar(e){
    e.preventDefault();
    const err = $("err-alu"); err.classList.add("hidden");
    if(!Alumno.aula){ err.textContent = "Ese código no corresponde a ninguna clase abierta."; err.classList.remove("hidden"); return; }
    if(!$("nom").value){ err.textContent = "Elegí tu nombre en la lista."; err.classList.remove("hidden"); return; }
    const yo = { id:$("nom").value, nombre:$("nom").selectedOptions[0].textContent };
    const { error } = await db.rpc("reclamar_alumno", {
      p_codigo:Alumno.codigo, p_student_id:yo.id, p_device_id:deviceId(), p_device_alias:null });
    if(error){ err.textContent = error.message; err.classList.remove("hidden"); return; }
    Alumno.yo = yo; Alumno.equipo = [yo];
    $("screen-login").classList.add("hidden");
    $("screen-alu").classList.remove("hidden");
    $("alu-who").textContent = yo.nombre + " · " + Alumno.aula.curso;
    Centinela.iniciar(Alumno.codigo, yo.id);
    Kiosco.iniciar(Alumno.codigo, yo.id);
    Alumno.render();
    setInterval(Alumno.refrescar, 15000);
  },
  async sumar(){
    const sel = $("eq-sel");
    if(!sel || !sel.value) return;
    const nuevo = { id:sel.value, nombre:sel.selectedOptions[0].textContent };
    const { error } = await db.rpc("reclamar_alumno", {
      p_codigo:Alumno.codigo, p_student_id:nuevo.id, p_device_id:deviceId(), p_device_alias:null });
    if(error){ alert(error.message); return; }
    Alumno.equipo.push(nuevo);
    Alumno.render();
  },
  quitarDelEquipo(id){
    if(id === Alumno.yo.id) return;
    Alumno.equipo = Alumno.equipo.filter(x=>x.id!==id);
    Alumno.render();
  },
  async refrescar(){
    const { data } = await db.rpc("aula_por_codigo", { p_codigo:Alumno.codigo });
    if(data){ Alumno.aula = data; Alumno.render(); }
  },
  async verHistorial(){
    const { data } = await db.rpc("mi_historial", { p_codigo:Alumno.codigo, p_student_id:Alumno.yo.id });
    Alumno.hist = data || { trabajos:[], ganados:0, posibles:0 };
    Alumno.render();
  },
  cardHistorial(){
    const h = Alumno.hist;
    if(!h) return `<div class="card"><h2>Mis puntos</h2>
      <p class="sub">Mirá todos tus trabajos entregados y cuántos puntos ganaste en cada uno.</p>
      <button class="btn sec" onclick="Alumno.verHistorial()">Ver mi historial de puntos</button></div>`;
    const t = h.trabajos || [];
    const pct = h.posibles ? Math.round(h.ganados / h.posibles * 100) : null;
    return `<div class="card">
      <h2>Mis puntos</h2>
      <p><b>${h.ganados||0}</b> de <b>${h.posibles||0}</b> puntos corregidos${pct!=null?` · <span class="tag ${pct>=70?"green":pct>=50?"orange":"red"}">${pct}%</span>`:""}</p>
      <table><thead><tr><th>Clase</th><th>Entregado</th><th>Puntos</th><th>Devolución</th></tr></thead><tbody>
      ${t.map(w=>{
        const gan = w.nota==null ? null : Number(w.nota);
        const max = Number(w.maximo||100);
        return `<tr>
          <td><b>${w.numero?"Clase "+w.numero:"Clase"}</b><div class="note">${esc(w.titulo||"")}</div></td>
          <td>${w.entregado_at?new Date(w.entregado_at).toLocaleDateString("es-PY"):"—"}
              ${w.acreditado?'<div class="note">Falta justificada</div>':""}</td>
          <td>${gan==null?'<span class="note">Sin corregir</span>':`<b>${gan}</b> / ${max}
              ${gan<max?`<div class="note">Perdiste ${max-gan}</div>`:'<div class="note">Puntaje completo</div>'}`}</td>
          <td class="note">${esc(w.devolucion||"—")}</td>
        </tr>`;
      }).join("") || '<tr><td colspan="4" class="note">Todavía no entregaste ningún trabajo.</td></tr>'}
      </tbody></table>
      <div style="height:10px"></div>
      <button class="btn sec sm" onclick="Alumno.verHistorial()">Actualizar</button>
    </div>`;
  },
  async render(){
    const a = Alumno.aula, et = a.etapas||{}, cl = a.clase||{};
    const res = await db.rpc("mi_resultado", { p_codigo:Alumno.codigo, p_student_id:Alumno.yo.id });
    const r = res.data || {};
    const cerrado = r.entregado && !r.edicion_habilitada;
    $("alu-view").innerHTML = `
      ${et.tema ? `<div class="card">
        <span class="tag blue">${esc(a.materia)}</span>
        <h1 style="margin-top:10px">${esc(cl.titulo||"")}</h1>
        <p class="sub">${esc(cl.unidad||"")}</p>
        <p><b>Lo que vamos a lograr:</b> ${esc(cl.capacidad||"")}</p>
      </div>` : '<div class="card"><h2>Esperá al profesor</h2><p class="sub">En unos momentos se habilita el tema de la clase.</p></div>'}

      <div class="card">
        <h3>Quiénes trabajan en esta computadora</h3>
        <p>${Alumno.equipo.map(x=>`<span class="tag blue">${esc(x.nombre)}${x.id!==Alumno.yo.id?` <a href="#" onclick="Alumno.quitarDelEquipo('${x.id}');return false">✕</a>`:""}</span> `).join("")}</p>
        <p class="note">Si trabajan de dos o tres en la misma máquina, sumá a tus compañeros acá: cada uno recibe su propio puntaje y ninguno puede volver a entrar desde otra computadora.</p>
        <select id="eq-sel"><option value="">Elegí un compañero</option>${Alumno.opciones(Alumno.equipo)}</select>
        <div style="height:8px"></div>
        <button class="btn sec sm" onclick="Alumno.sumar()">Sumar compañero</button>
      </div>

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
        ${cerrado ? `<div class="alert warn">Tu trabajo ya fue entregado el ${r.entregado_at?new Date(r.entregado_at).toLocaleString("es-PY"):""} y quedó cerrado. Si necesitás cambiar algo, pedile al profesor que te habilite la edición.</div>`
          : `${r.entregado?'<div class="alert ok">El profesor te habilitó una edición. Corregí y volvé a enviar: después queda cerrado otra vez.</div>':""}
        ${(cl.preguntas||[]).map((p,i)=>`<label>${esc(p)}</label><textarea id="q${i}"></textarea>`).join("")}
        <label>Nombre del archivo que guardaste</label><input id="e-arch" value="${esc(cl.actividad_archivo||"")}">
        <label>Enlace (opcional)</label><input id="e-link" placeholder="Si subiste el trabajo a la nube">
        <label>Comentario para el profesor (opcional)</label><input id="e-com">
        <div class="alert info">Se envía una entrega para cada uno: ${esc(Alumno.equipo.map(x=>x.nombre).join(", "))}</div>
        <button class="btn" onclick="Alumno.entregar(${(cl.preguntas||[]).length})">Enviar mi trabajo</button>`}
      </div>` : ""}

      ${et.resultado ? `<div class="card">
        <h2>Mi resultado de hoy</h2>
        ${r.nota!=null ? `<div class="code" style="font-size:44px">${r.nota}</div><p><b>Devolución:</b> ${esc(r.devolucion||"—")}</p>`
          : '<p class="sub">El profesor todavía no corrigió tu trabajo.</p>'}
      </div>` : ""}

      ${Alumno.cardHistorial()}`;
  },
  async entregar(nPreg){
    const respuestas = [];
    for(let i=0;i<nPreg;i++) respuestas.push($("q"+i).value.trim());
    const equipo = Alumno.equipo.map(x=>x.nombre).join(", ");
    const arch = $("e-arch").value.trim(), link = $("e-link").value.trim(), com = $("e-com").value.trim();
    const fallas = [];
    for(const m of Alumno.equipo){
      const { error } = await db.rpc("entregar_trabajo", {
        p_codigo:Alumno.codigo, p_student_id:m.id, p_respuestas:respuestas,
        p_archivo:arch, p_enlace:link, p_equipo:equipo, p_comentario:com
      });
      if(error) fallas.push(m.nombre + ": " + error.message);
    }
    Alumno.hist = null;
    Alumno.render();
    if(fallas.length) alert("Algunas entregas no se pudieron enviar:\n" + fallas.join("\n"));
    else alert("Trabajo enviado. Ya le llegó al profesor y quedó cerrado.");
  }
};

/* ==================== INICIO ==================== */
(async function(){
  const { data } = await db.auth.getSession();
  if(data.session){ St.user = data.session.user; await Auth.cargarPerfil(); }
})();
