/* Calificación por indicadores: el docente pone puntos a cada indicador y aprueba la tarea.
   La nota del alumno es la suma de los puntos (lo calcula corregir_por_indicadores en la base). */
(function(){
  if(typeof Docente === "undefined") return;

  Docente.calificar = async function(submissionId){
    const { data:inds, error } = await db.rpc("indicadores_de_entrega", { p_submission_id: submissionId });
    if(error){ alert("No se pudieron cargar los indicadores: " + error.message); return; }
    if(!inds || !inds.length){ alert("Esta clase no tiene indicadores cargados en la planificación."); return; }

    let p = document.getElementById("cal-ov");
    if(p) p.remove();
    p = document.createElement("div");
    p.id = "cal-ov";
    p.setAttribute("style","position:fixed;inset:0;z-index:70;background:rgba(0,0,0,.45);overflow:auto;display:flex;align-items:flex-start;justify-content:center;padding:30px 16px");
    const filas = inds.map(i=>{
      const max = Number(i.puntaje_max)||0;
      const val = (i.puntaje==null ? "" : i.puntaje);
      return '<div class="card" style="margin-bottom:10px">'
        + '<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap">'
        + '<div style="flex:1;min-width:200px"><b>' + esc(i.descripcion||"") + '</b><div class="note">Máximo: ' + max + ' pts</div></div>'
        + '<div style="width:120px"><label>Puntos</label>'
        + '<input type="number" class="cal-pts" data-ind="' + i.id + '" data-max="' + max + '" min="0" max="' + max + '" step="0.5" value="' + val + '"></div>'
        + '</div></div>';
    }).join("");
    p.innerHTML = '<div style="background:var(--bg);border-radius:14px;max-width:640px;width:100%;padding:20px">'
      + '<div class="row" style="justify-content:space-between;align-items:center">'
      + '<h2 style="margin:0">Calificar por indicadores</h2><button class="btn sec" id="cal-x">Cerrar</button></div>'
      + '<p class="sub">Poné los puntos de cada indicador. Al aprobar, la nota del alumno es la suma.</p>'
      + filas
      + '<label>Devolución (opcional)</label><input id="cal-dev" placeholder="Comentario para el alumno">'
      + '<div class="row" style="justify-content:space-between;align-items:center;margin-top:12px">'
      + '<div style="font-size:20px;font-weight:700">Total: <span id="cal-total">0</span> pts</div>'
      + '<button class="btn ok" id="cal-ok">Aprobar tarea</button></div>'
      + '<div id="cal-msg" style="margin-top:10px"></div>'
      + '</div>';
    document.body.appendChild(p);
    p.querySelector("#cal-x").onclick = () => p.remove();
    p.addEventListener("click", e => { if(e.target === p) p.remove(); });

    const total = () => {
      let t = 0;
      p.querySelectorAll(".cal-pts").forEach(i => { t += Number(i.value)||0; });
      p.querySelector("#cal-total").textContent = t;
    };
    p.querySelectorAll(".cal-pts").forEach(i => i.addEventListener("input", total));
    total();

    p.querySelector("#cal-ok").onclick = async () => {
      const scores = [];
      p.querySelectorAll(".cal-pts").forEach(i => {
        scores.push({ indicator_id: i.dataset.ind, puntaje: Number(i.value)||0 });
      });
      const dev = p.querySelector("#cal-dev").value;
      const btn = p.querySelector("#cal-ok");
      btn.disabled = true; btn.textContent = "Guardando…";
      const { error: e2 } = await db.rpc("corregir_por_indicadores", {
        p_submission_id: submissionId,
        p_scores: scores,
        p_devolucion: dev || null
      });
      btn.disabled = false; btn.textContent = "Aprobar tarea";
      if(e2){ p.querySelector("#cal-msg").innerHTML = '<div class="alert err">' + esc(e2.message) + '</div>'; return; }
      p.remove();
      aviso("Tarea aprobada. La nota del alumno es la suma de los puntos.");
      UI.ir("entregas");
    };
  };

  /* Agregar el botón "Por indicadores" a cada entrega de la tabla */
  const original = Docente.vEntregas.bind(Docente);
  Docente.vEntregas = async function(){
    await original();
    document.querySelectorAll('#view [onclick*="Docente.corregir("]').forEach(btn => {
      if(btn.dataset.calif) return;
      btn.dataset.calif = "1";
      const m = btn.getAttribute("onclick").match(/Docente\.corregir\('([^']+)'\)/);
      if(!m) return;
      const b = document.createElement("button");
      b.className = "btn sec sm";
      b.style.marginTop = "6px";
      b.textContent = "Por indicadores";
      b.onclick = () => Docente.calificar(m[1]);
      btn.parentElement.insertBefore(b, btn.nextSibling);
    });
  };
})();
