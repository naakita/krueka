/* Krueka - Club: gestion de alumnos y finanzas (admin/direccion).
   Cargar despues de club-auditoria.js. Requiere migracion 041
   (supabase_club_gestion.sql): club_alumno_eliminar, club_alumno_fusionar,
   club_finanzas. Mudar de grupo usa club_alumno_guardar(p_group) que ya existe. */

const ClubG = {
  alumnos: [], grupos: [], filtro: "", grupo: "", inactivos: false,
  fin: null, fanio: new Date().getFullYear(), fmes: new Date().getMonth() + 1,

  /* ==================== ALUMNOS ==================== */
  async vAlumnos(){
    const v = document.getElementById("view");
    v.innerHTML = '<div class="spinner">Cargando alumnos del club…</div>';
    const { data, error } = await db.rpc("club_panel");
    if(error){ v.innerHTML = '<div class="alert err">' + esc(error.message) + '</div>'; return; }
    this.alumnos = data.alumnos || [];
    this.grupos = data.grupos || [];
    this.pintaAlumnos();
  },
  norma(s){
    return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
  },
  duplicados(){
    const mapa = {}, out = [];
    this.alumnos.forEach(a=>{
      const k = ClubG.norma(a.nombre);
      if(!k) return;
      (mapa[k] = mapa[k] || []).push(a);
    });
    Object.keys(mapa).forEach(k=>{ if(mapa[k].length > 1) out.push(mapa[k]); });
    return out;
  },
  lista(){
    const f = ClubG.norma(this.filtro);
    return this.alumnos.filter(a=>{
      if(!this.inactivos && !a.activo) return false;
      if(this.grupo && String(a.grupo) !== String(this.grupo)) return false;
      if(f && ClubG.norma(a.nombre).indexOf(f) < 0) return false;
      return true;
    });
  },
  pintaAlumnos(){
    const v = document.getElementById("view");
    const dups = this.duplicados(), filas = this.lista();
    const opsG = this.grupos.map(g=>'<option value="' + esc(g.nombre) + '">' + esc(g.nombre) + '</option>').join("");
    v.innerHTML =
      '<h1>Alumnos del club</h1>'
      + '<p class="sub">Cambiá nombres, mudá de grupo, desactivá, fusioná duplicados o eliminá definitivo. Todo queda registrado en la auditoría.</p>'
      + '<div class="card"><div class="row">'
      + '<div style="flex:2;min-width:200px"><label>Buscar</label><input id="cg-q" value="' + esc(this.filtro) + '" placeholder="Nombre del alumno" oninput="ClubG.filtro=this.value;ClubG.refresca()"></div>'
      + '<div style="flex:1;min-width:160px"><label>Grupo</label><select onchange="ClubG.grupo=this.value;ClubG.pintaAlumnos()"><option value="">Todos</option>'
      + this.grupos.map(g=>'<option value="' + esc(g.nombre) + '"' + (this.grupo===g.nombre?" selected":"") + '>' + esc(g.nombre) + '</option>').join("") + '</select></div>'
      + '<div style="min-width:150px"><label>&nbsp;</label><label style="display:flex;gap:8px;align-items:center;font-weight:400"><input type="checkbox" style="width:auto"' + (this.inactivos?" checked":"") + ' onchange="ClubG.inactivos=this.checked;ClubG.pintaAlumnos()"> Ver inactivos</label></div>'
      + '</div></div>'
      + '<div id="cg-msg"></div>'
      + (dups.length ? '<div class="card"><h2>Posibles duplicados (' + dups.length + ')</h2>'
        + dups.map(g=>'<div class="alert info">'
          + g.map(a=>'<b>' + esc(a.nombre) + '</b> <span class="note">(' + esc(a.grupo||"sin grupo") + (a.activo?"":", inactivo") + ')</span>').join(" · ")
          + '<div style="margin-top:6px"><button class="btn sm sec" onclick="ClubG.formFusionar(\'' + g[0].id + '\')">Fusionar…</button></div></div>').join("")
        + '</div>' : "")
      + '<div class="card" style="overflow:auto"><table><thead><tr>'
      + '<th>Alumno</th><th>Grupo</th><th>Código</th><th>Estado</th><th style="min-width:260px">Acciones</th>'
      + '</tr></thead><tbody>'
      + (filas.map(a=>'<tr>'
        + '<td><b>' + esc(a.nombre) + '</b><div class="note">' + esc(a.ultimo_pago ? "último pago " + a.ultimo_pago : "sin pagos") + '</div></td>'
        + '<td>' + esc(a.grupo || "sin grupo") + '</td>'
        + '<td><b style="letter-spacing:2px">' + esc(a.codigo || "—") + '</b></td>'
        + '<td>' + (a.activo ? '<span class="tag green">activo</span>' : '<span class="tag gray">inactivo</span>') + '</td>'
        + '<td style="white-space:nowrap"><div class="row" style="gap:6px">'
        + '<button class="btn sm sec" onclick="ClubG.formEditar(\'' + a.id + '\')">Editar</button>'
        + '<button class="btn sm sec" onclick="ClubG.formFusionar(\'' + a.id + '\')">Fusionar</button>'
        + '<button class="btn sm sec" onclick="ClubG.miniCuenta(\'' + a.id + '\',\'' + esc(a.nombre).replace(/'/g, "\\'") + '\')">Cuenta</button>'
        + (a.activo
          ? '<button class="btn sm sec" onclick="ClubG.activar(\'' + a.id + '\',false)">Desactivar</button>'
          : '<button class="btn sm ok" onclick="ClubG.activar(\'' + a.id + '\',true)">Reactivar</button>')
        + '<button class="btn sm dan" onclick="ClubG.eliminar(\'' + a.id + '\',\'' + esc(a.nombre).replace(/'/g, "\\'") + '\',' + (a.ultimo_pago ? "true" : "false") + ')">Eliminar</button>'
        + '</div></td></tr>').join("")
        || '<tr><td colspan="5" class="note">Sin alumnos con ese filtro.</td></tr>')
      + '</tbody></table></div>'
      + '<p class="note">Mostrando ' + filas.length + ' de ' + this.alumnos.length + ' alumnos.</p>';
    const q = document.getElementById("cg-q");
    if(q){ q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
  },
  refresca(){
    const q = document.getElementById("cg-q");
    const pos = q ? q.selectionStart : 0;
    const tabla = document.querySelector("#view table tbody");
    if(!tabla){ this.pintaAlumnos(); return; }
    const filas = this.lista();
    tabla.innerHTML = filas.map(a=>'<tr>'
      + '<td><b>' + esc(a.nombre) + '</b><div class="note">' + esc(a.ultimo_pago ? "último pago " + a.ultimo_pago : "sin pagos") + '</div></td>'
      + '<td>' + esc(a.grupo || "sin grupo") + '</td>'
      + '<td><b style="letter-spacing:2px">' + esc(a.codigo || "—") + '</b></td>'
      + '<td>' + (a.activo ? '<span class="tag green">activo</span>' : '<span class="tag gray">inactivo</span>') + '</td>'
      + '<td style="white-space:nowrap"><div class="row" style="gap:6px">'
      + '<button class="btn sm sec" onclick="ClubG.formEditar(\'' + a.id + '\')">Editar</button>'
      + '<button class="btn sm sec" onclick="ClubG.formFusionar(\'' + a.id + '\')">Fusionar</button>'
      + '<button class="btn sm sec" onclick="ClubG.miniCuenta(\'' + a.id + '\',\'' + esc(a.nombre).replace(/'/g, "\\'") + '\')">Cuenta</button>'
      + (a.activo
        ? '<button class="btn sm sec" onclick="ClubG.activar(\'' + a.id + '\',false)">Desactivar</button>'
        : '<button class="btn sm ok" onclick="ClubG.activar(\'' + a.id + '\',true)">Reactivar</button>')
      + '<button class="btn sm dan" onclick="ClubG.eliminar(\'' + a.id + '\',\'' + esc(a.nombre).replace(/'/g, "\\'") + '\',' + (a.ultimo_pago ? "true" : "false") + ')">Eliminar</button>'
      + '</div></td></tr>').join("")
      || '<tr><td colspan="5" class="note">Sin alumnos con ese filtro.</td></tr>';
    const q2 = document.getElementById("cg-q");
    if(q2){ q2.focus(); try{ q2.setSelectionRange(pos, pos); }catch(e){} }
  },
  msg(html){ const m = document.getElementById("cg-msg"); if(m) m.innerHTML = html; },
  porId(id){ return (this.alumnos || []).find(a=>a.id === id) || {}; },
  grupoId(nombre){
    const g = (this.grupos || []).find(x=>x.nombre === nombre);
    return g ? g.id : null;
  },
  formEditar(id){
    const a = this.porId(id);
    const ops = this.grupos.map(g=>'<option value="' + g.id + '"' + (a.grupo===g.nombre?" selected":"") + '>' + esc(g.nombre) + '</option>').join("");
    this.msg('<div class="card" style="background:var(--blue-bg)"><div style="font-weight:700">Editar a ' + esc(a.nombre) + '</div>'
      + '<div class="row" style="margin-top:8px"><div style="flex:2;min-width:200px"><label>Nombre y apellido</label><input id="ce-n"></div>'
      + '<div style="flex:1;min-width:160px"><label>Grupo</label><select id="ce-g">' + ops + '</select></div></div>'
      + '<div style="margin-top:10px;display:flex;gap:8px"><button class="btn sm" onclick="ClubG.guardarEditar(\'' + id + '\')">Guardar cambios</button>'
      + '<button class="btn sm sec" onclick="ClubG.msg(\'\')">Cancelar</button></div></div>');
    document.getElementById("ce-n").value = a.nombre || "";
  },
  async guardarEditar(id){
    const nom = (document.getElementById("ce-n").value || "").trim();
    const gid = document.getElementById("ce-g").value || null;
    if(nom.length < 3){ alert("El nombre es muy corto."); return; }
    const { error } = await db.rpc("club_alumno_guardar", { p_student: id, p_nombre: nom, p_group: gid });
    if(error){ alert(error.message); return; }
    await this.vAlumnos();
  },
  async activar(id, on){
    const a = this.porId(id);
    if(!on && !confirm("Desactivar a " + (a.nombre || "") + "? No podrá entrar hasta reactivarlo.")) return;
    const { error } = await db.rpc("club_alumno_guardar", { p_student: id, p_activo: on });
    if(error){ alert(error.message); return; }
    await this.vAlumnos();
  },
  formFusionar(id){
    const a = this.porId(id);
    const ops = this.alumnos.filter(x=>x.id !== id)
      .map(x=>'<option value="' + x.id + '">' + esc(x.nombre) + ' (' + esc(x.grupo || "sin grupo") + (x.activo ? "" : ", inactivo") + ')</option>').join("");
    this.msg('<div class="card" style="background:var(--blue-bg)"><div style="font-weight:700">Fusionar duplicado con ' + esc(a.nombre) + '</div>'
      + '<p class="sub">Los pagos del duplicado pasan a <b>' + esc(a.nombre) + '</b> (el que queda) y el duplicado se borra con su avance. Usalo cuando el mismo chico aparece dos veces.</p>'
      + '<label>El duplicado que se va a borrar</label><select id="cf-saca">' + ops + '</select>'
      + '<div style="margin-top:10px;display:flex;gap:8px"><button class="btn sm dan" onclick="ClubG.fusionar(\'' + id + '\')">Fusionar y borrar duplicado</button>'
      + '<button class="btn sm sec" onclick="ClubG.msg(\'\')">Cancelar</button></div></div>');
  },
  async fusionar(idQueda){
    const saca = document.getElementById("cf-saca").value;
    if(!saca){ alert("Elegí el duplicado."); return; }
    const b = this.porId(saca);
    if(!confirm("Pasar los pagos de " + (b.nombre || "") + " a " + (this.porId(idQueda).nombre || "") + " y BORRAR a " + (b.nombre || "") + "?")) return;
    const { data, error } = await db.rpc("club_alumno_fusionar", { p_queda: idQueda, p_saca: saca });
    if(error){ alert(error.message); return; }
    await this.vAlumnos();
    this.msg('<div class="alert ok">Fusionado. Se movieron ' + ((data || {}).pagos_movidos || 0) + ' pagos.</div>');
  },
  async eliminar(id, nombre, conPagos){
    const a = this.porId(id);
    let txt = "ELIMINAR DEFINITIVO a " + nombre + "?\n\nSe borra su avance, accesos y códigos.";
    if(conPagos || a.ultimo_pago) txt += "\n\nOJO: tiene pagos registrados (" + (a.ultimo_pago || "") + "). Se borran también.";
    txt += "\n\nEsta acción queda registrada. Para una salida temporal usá Desactivar.";
    if(!confirm(txt)) return;
    if(!confirm("Confirmá de nuevo: ¿borrar para siempre a " + nombre + "?")) return;
    const { error } = await db.rpc("club_alumno_eliminar", { p_student: id });
    if(error){ alert(error.message); return; }
    await this.vAlumnos();
  },
  async miniCuenta(id, nombre){
    const { data, error } = await db.rpc("club_cuenta", { p_student: id, p_anio: this.fin ? this.fin.anio : new Date().getFullYear() });
    if(error){ alert(error.message); return; }
    const filas = (data.meses || []).map(m=>{
      const tag = m.estado === "completo" ? '<span class="tag green">completo</span>'
        : (m.estado === "parcial" ? '<span class="tag orange">parcial</span>' : '<span class="tag gray">pendiente</span>');
      return '<tr><td>' + MESES[m.mes - 1] + '</td><td>' + gs(m.pagado) + '</td><td>' + gs(m.saldo) + '</td><td>' + tag + '</td></tr>';
    }).join("");
    this.msg('<div class="card"><div style="font-weight:700">Meses de ' + esc(nombre) + ' · ' + data.anio + ' (cuota ' + gs(data.cuota) + ')</div>'
      + '<table style="margin-top:8px"><tr><th>Mes</th><th>Pagado</th><th>Debe</th><th>Estado</th></tr>' + filas + '</table>'
      + '<div class="note" style="margin-top:6px">Para registrar abonos andá a la pestaña 🎮 Club de informatica.</div>'
      + '<div style="margin-top:10px"><button class="btn sm sec" onclick="ClubG.msg(\'\')">Cerrar</button></div></div>');
    document.getElementById("cg-msg").scrollIntoView();
  },

  /* ==================== FINANZAS ==================== */
  async vFinanzas(){
    const v = document.getElementById("view");
    v.innerHTML = '<div class="spinner">Cargando finanzas del club…</div>';
    const { data, error } = await db.rpc("club_finanzas", { p_anio: this.fanio, p_mes: this.fmes });
    if(error){ v.innerHTML = '<div class="alert err">' + esc(error.message) + '</div>'; return; }
    this.fin = data;
    this.pintaFinanzas();
  },
  tagDeuda(pagado, cuota){
    if(pagado > 0) return '<span class="tag orange">parcial</span>';
    return '<span class="tag red">debe</span>';
  },
  pintaFinanzas(){
    const d = this.fin, v = document.getElementById("view");
    const k = d.kpis || {};
    const pct = Number(k.cuota_mes) > 0 ? Math.round(Number(k.cobrado_mes) / Number(k.cuota_mes) * 100) : 0;
    const mesesOps = MESES.map((m, i)=>'<option value="' + (i + 1) + '"' + ((i + 1) === d.mes ? " selected" : "") + '>' + m + '</option>').join("");
    const anios = [];
    const ya = new Date().getFullYear();
    for(let a = ya - 2; a <= ya + 1; a++) anios.push(a);
    const maxHist = Math.max.apply(null, (d.hist || []).map(h=>Number(h.cobrado)).concat([1]));
    const fDeu = r=>'<tr><td><b>' + esc(r.nombre) + '</b><div class="note">' + esc(r.grupo || "sin grupo") + (r.activo === false ? " · inactivo" : "") + '</div></td>'
      + '<td class="note">' + esc(r.tutor || "—") + '<br>' + esc(r.telefono || "") + '</td>'
      + '<td>' + gs(r.cuota) + '</td><td>' + gs(r.pagado) + '</td><td><b>' + gs(r.saldo) + '</b></td>'
      + '<td>' + ClubG.tagDeuda(Number(r.pagado), Number(r.cuota)) + '<div class="note">' + esc(r.ultimo_pago ? "últ: " + r.ultimo_pago : "sin pagos") + '</div></td></tr>';
    v.innerHTML =
      '<h1>Finanzas del club</h1>'
      + '<p class="sub">Cuántos alumnos hay, quiénes deben este mes y el anterior, quiénes entraron y salieron.</p>'
      + '<div class="card"><div class="row"><div style="min-width:150px"><label>Mes</label><select onchange="ClubG.fmes=Number(this.value);ClubG.vFinanzas()">' + mesesOps + '</select></div>'
      + '<div style="min-width:120px"><label>Año</label><select onchange="ClubG.fanio=Number(this.value);ClubG.vFinanzas()">'
      + anios.map(a=>'<option' + (a === d.anio ? " selected" : "") + '>' + a + '</option>').join("") + '</select></div>'
      + '<div style="margin-left:auto;align-self:end"><button class="btn sec sm" onclick="ClubG.excel()">Descargar Excel</button></div></div></div>'
      + '<div class="grid3">'
      + '<div class="kpi"><b>' + (k.activos || 0) + '</b><span>Alumnos activos (' + (k.inactivos || 0) + ' inactivos)</span></div>'
      + '<div class="kpi"><b>' + gs(k.cobrado_mes) + '</b><span>Cobrado de ' + gs(k.cuota_mes) + ' (' + pct + '%)</span><div class="bar" style="margin-top:6px"><i style="width:' + pct + '%"></i></div></div>'
      + '<div class="kpi"><b>' + (k.deudores || 0) + '</b><span>Deben este mes · ' + (k.al_dia || 0) + ' al día</span></div>'
      + '</div>'
      + '<div class="card"><h2>Deben ' + MESES[d.mes - 1] + ' (' + (d.deudores_actual || []).length + ')</h2>'
      + '<div style="overflow:auto"><table><thead><tr><th>Alumno</th><th>Contacto</th><th>Cuota</th><th>Pagado</th><th>Debe</th><th>Estado</th></tr></thead><tbody>'
      + ((d.deudores_actual || []).map(fDeu).join("") || '<tr><td colspan="6" class="note">Todos al día. 🎉</td></tr>')
      + '</tbody></table></div></div>'
      + '<div class="card"><h2>Debían ' + MESES[d.mes_ant.mes - 1] + ' (' + (d.deudores_anterior || []).length + ')</h2>'
      + '<div style="overflow:auto"><table><thead><tr><th>Alumno</th><th>Contacto</th><th>Cuota</th><th>Pagado</th><th>Debía</th><th>Estado</th></tr></thead><tbody>'
      + ((d.deudores_anterior || []).map(fDeu).join("") || '<tr><td colspan="6" class="note">Sin deudas el mes anterior.</td></tr>')
      + '</tbody></table></div></div>'
      + '<div class="grid2"><div class="card"><h2>Por grupo</h2><table><thead><tr><th>Grupo</th><th>Activos</th><th>Cobrado</th></tr></thead><tbody>'
      + ((d.por_grupo || []).map(g=>'<tr><td><b>' + esc(g.grupo) + '</b><div class="note">cuota ' + gs(g.cuota) + '</div></td><td>' + g.activos + '</td><td>' + gs(g.cobrado) + '</td></tr>').join(""))
      + '</tbody></table></div>'
      + '<div class="card"><h2>Cobro últimos 6 meses</h2>'
      + ((d.hist || []).map(h=>'<div style="margin-top:8px"><div class="note">' + MESES[h.mes - 1] + ' ' + h.anio + ' · ' + gs(h.cobrado) + ' (' + h.abonos + ' abonos)</div>'
        + '<div class="bar"><i style="width:' + Math.round(Number(h.cobrado) / maxHist * 100) + '%"></i></div></div>').join(""))
      + '</div></div>'
      + '<div class="grid2"><div class="card"><h2>Entraron en ' + MESES[d.mes - 1] + ' (' + (d.altas || []).length + ')</h2>'
      + ((d.altas || []).map(a=>'<div>✅ <b>' + esc(a.nombre) + '</b> <span class="note">' + esc(a.grupo || "") + ' · ' + esc(a.fecha || "") + '</span></div>').join("") || '<p class="note">Nadie nuevo este mes.</p>')
      + '</div><div class="card"><h2>Salieron en ' + MESES[d.mes - 1] + ' (' + (d.bajas || []).length + ')</h2>'
      + ((d.bajas || []).map(a=>'<div>➖ <b>' + esc(a.nombre || "—") + '</b> <span class="note">' + esc(a.fecha || "") + '</span></div>').join("") || '<p class="note">Nadie salió este mes.</p>')
      + '</div></div>';
  },
  excel(){
    const d = this.fin;
    if(!d){ alert("Cargá las finanzas primero."); return; }
    const fh = v=>{ const t = v === null || v === undefined ? "" : String(v); return /[";\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; };
    const lin = [];
    lin.push(["Finanzas club", MESES[d.mes - 1], d.anio].map(fh).join(";"));
    lin.push(["Activos", (d.kpis || {}).activos, "Inactivos", (d.kpis || {}).inactivos].map(fh).join(";"));
    lin.push(["Cuota total mes", (d.kpis || {}).cuota_mes, "Cobrado", (d.kpis || {}).cobrado_mes].map(fh).join(";"));
    lin.push([]);
    lin.push(["DEBEN " + MESES[d.mes - 1], "Grupo", "Tutor", "Teléfono", "Cuota", "Pagado", "Debe"].map(fh).join(";"));
    (d.deudores_actual || []).forEach(r=>lin.push([r.nombre, r.grupo, r.tutor, r.telefono, r.cuota, r.pagado, r.saldo].map(fh).join(";")));
    lin.push([]);
    lin.push(["DEBIAN " + MESES[d.mes_ant.mes - 1], "Grupo", "Cuota", "Pagado", "Debía"].map(fh).join(";"));
    (d.deudores_anterior || []).forEach(r=>lin.push([r.nombre, r.grupo, r.cuota, r.pagado, r.saldo].map(fh).join(";")));
    lin.push([]);
    lin.push(["ENTRARON"].map(fh).join(";"));
    (d.altas || []).forEach(a=>lin.push([a.nombre, a.grupo, a.fecha].map(fh).join(";")));
    lin.push(["SALIERON"].map(fh).join(";"));
    (d.bajas || []).forEach(a=>lin.push([a.nombre, a.fecha].map(fh).join(";")));
    const csv = "﻿" + lin.join("\r\n");
    const f = "Finanzas_club_" + MESES[d.mes - 1] + "_" + d.anio;
    if(typeof KG !== "undefined" && KG.bajar) KG.bajar(f + ".csv", csv, "text/csv;charset=utf-8");
    else { const b = new Blob([csv], { type: "text/csv;charset=utf-8" }); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = f + ".csv"; document.body.appendChild(a); a.click(); a.remove(); }
  }
};

/* ===== Pestañas para admin y direccion ===== */
(function(){
  if(typeof UI === "undefined") return;
  if(UI._clubGPatch) return;
  UI._clubGPatch = true;
  const menus = UI.menus.bind(UI);
  UI.menus = function(){
    const m = menus();
    try{
      const rol = St.perfil ? St.perfil.role : "";
      if((rol === "admin" || rol === "director") && Array.isArray(m)){
        if(!m.some(x=>x[0] === "club-alumnos")) m.push(["club-alumnos", "👥 Alumnos club"]);
        if(!m.some(x=>x[0] === "club-finanzas")) m.push(["club-finanzas", "💰 Finanzas club"]);
      }
    }catch(e){}
    return m;
  };
  const ir = UI.ir.bind(UI);
  UI.ir = function(k){
    St.tab = k;
    if(k === "club-alumnos"){
      document.querySelectorAll("#nav button").forEach(b=>b.setAttribute("aria-selected", b.dataset.k === k));
      return ClubG.vAlumnos();
    }
    if(k === "club-finanzas"){
      document.querySelectorAll("#nav button").forEach(b=>b.setAttribute("aria-selected", b.dataset.k === k));
      return ClubG.vFinanzas();
    }
    return ir(k);
  };
})();
