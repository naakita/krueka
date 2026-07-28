/* ==================== OFICINA KRUEKA: DOCUMENTO, PLANILLA Y DIAPOSITIVAS ==================== */
/* Todo funciona dentro de la plataforma: sin cuentas, sin registro y sin salir a otra pagina. */

const OFICINA = {
  documento:    { t:"Documento",    d:"Escribir textos",        ico:"\u270E" },
  planilla:     { t:"Planilla",     d:"Tablas y graficos",      ico:"\u25A6" },
  diapositivas: { t:"Diapositivas", d:"Presentacion con laminas", ico:"\u25B6" }
};

const COLS = ["A","B","C","D","E","F","G","H"];
const FILAS = 24;

const Oficina = {
  tipo:null, datos:null, slide:0, timer:null,

  /* ---------- abrir y cerrar ---------- */
  async abrir(tipo){
    if(!OFICINA[tipo]) return;
    if(!(typeof Alumno !== "undefined" && Alumno.yo && Alumno.codigo)){ Oficina.abrirSuelto(tipo); return; }
    Oficina.tipo = tipo;
    Oficina.datos = await Oficina.cargar(tipo);
    Oficina.pintar();
  },
  abrirSuelto(tipo){
    Oficina.tipo = tipo;
    Oficina.datos = Oficina.vacio(tipo);
    Oficina.pintar(true);
  },
  vacio(tipo){
    if(tipo==="planilla") return { titulo:"", contenido:{ celdas:{} } };
    if(tipo==="diapositivas") return { titulo:"", contenido:{ slides:[{ titulo:"", texto:"" }] } };
    return { titulo:"", contenido:{ html:"" } };
  },
  async cargar(tipo){
    try{
      const { data } = await db.rpc("mis_docs", { p_codigo:Alumno.codigo, p_student_id:Alumno.yo.id });
      const d = (data||[]).find(x=>x.tipo===tipo);
      if(d) return { titulo:d.titulo||"", contenido:d.contenido||Oficina.vacio(tipo).contenido };
    }catch(e){}
    return Oficina.vacio(tipo);
  },
  cerrar(){
    Oficina.recoger();
    Oficina.guardar(true);
    const p = document.getElementById("ofi"); if(p) p.remove();
    Oficina.tipo = null;
  },

  /* ---------- marco comun ---------- */
  pintar(suelto){
    const h = OFICINA[Oficina.tipo];
    let p = document.getElementById("ofi");
    if(!p){ p = document.createElement("div"); p.id = "ofi"; document.body.appendChild(p); }
    p.setAttribute("style", "position:fixed;inset:0;z-index:60;background:#F9F8F7;display:flex;flex-direction:column;font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#2C2C2B");
    p.innerHTML =
      '<div style="background:#fff;border-bottom:1px solid #E6E5E3;padding:10px 16px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">' +
        '<img src="logo.svg" alt="Krueka" style="height:28px;background:#fff;border-radius:8px">' +
        '<b>' + h.ico + " " + h.t + '</b>' +
        '<input id="ofi-tit" value="' + Oficina.esc(Oficina.datos.titulo||"") + '" placeholder="Ponele un nombre a tu trabajo" ' +
          'style="flex:1;min-width:180px;padding:7px 10px;border:1px solid #E6E5E3;border-radius:8px;font:inherit">' +
        '<span id="ofi-est" style="font-size:13px;color:#7D7A75">' + (suelto?"Modo de prueba":"Se guarda solo") + '</span>' +
        '<button onclick="Oficina.guardar()" style="' + Oficina.btn("#2783DE","#fff") + '">Guardar</button>' +
        '<button onclick="Oficina.cerrar()" style="' + Oficina.btn("#F0EFED","#2C2C2B") + '">Volver a la actividad</button>' +
      '</div>' +
      '<div id="ofi-cuerpo" style="flex:1;overflow:auto;padding:16px"></div>';
    if(Oficina.tipo==="documento") Oficina.verDocumento();
    if(Oficina.tipo==="planilla") Oficina.verPlanilla();
    if(Oficina.tipo==="diapositivas") Oficina.verDiapositivas();
    const t = document.getElementById("ofi-tit");
    if(t) t.oninput = ()=>{ Oficina.datos.titulo = t.value; Oficina.marcar(); };
  },
  btn(bg, fg){ return "padding:8px 14px;border:0;border-radius:9px;background:"+bg+";color:"+fg+";font:inherit;font-weight:600;cursor:pointer"; },
  esc(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); },
  estado(txt){ const e = document.getElementById("ofi-est"); if(e) e.textContent = txt; },
  marcar(){
    Oficina.estado("Cambios sin guardar\u2026");
    if(Oficina.timer) clearTimeout(Oficina.timer);
    Oficina.timer = setTimeout(()=>Oficina.guardar(true), 4000);
  },

  /* ---------- guardado ---------- */
  recoger(){
    if(Oficina.tipo==="documento"){
      const d = document.getElementById("ofi-doc");
      if(d) Oficina.datos.contenido = { html:d.innerHTML };
    }
    if(Oficina.tipo==="diapositivas"){
      const t = document.getElementById("ofi-s-tit"), x = document.getElementById("ofi-s-txt");
      const s = Oficina.datos.contenido.slides[Oficina.slide];
      if(s && t) s.titulo = t.value;
      if(s && x) s.texto = x.value;
    }
  },
  async guardar(silencioso){
    Oficina.recoger();
    if(!(typeof Alumno !== "undefined" && Alumno.yo && Alumno.codigo)){ Oficina.estado("Modo de prueba: no se guarda"); return; }
    Oficina.estado("Guardando\u2026");
    const { error } = await db.rpc("guardar_doc", {
      p_codigo: Alumno.codigo, p_student_id: Alumno.yo.id, p_tipo: Oficina.tipo,
      p_titulo: Oficina.datos.titulo || null, p_contenido: Oficina.datos.contenido
    });
    if(error){ Oficina.estado("No se pudo guardar"); if(!silencioso) alert("No se pudo guardar: "+error.message); return; }
    const hora = new Date().toLocaleTimeString("es-PY", { hour:"2-digit", minute:"2-digit" });
    Oficina.estado("Guardado a las " + hora);
  },

  /* ---------- documento ---------- */
  verDocumento(){
    const barra = [
      ["bold","","<b>N</b>","Negrita"], ["italic","","<i>C</i>","Cursiva"], ["underline","","<u>S</u>","Subrayado"],
      ["formatBlock","h2","T\u00edtulo","T\u00edtulo"], ["formatBlock","h3","Subt\u00edtulo","Subt\u00edtulo"], ["formatBlock","p","Normal","Texto normal"],
      ["insertUnorderedList","","\u2022 Lista","Lista"], ["insertOrderedList","","1. Lista","Lista numerada"],
      ["justifyLeft","","\u2261","Alinear a la izquierda"], ["justifyCenter","","\u2261","Centrar"],
      ["undo","","Deshacer","Deshacer"], ["redo","","Rehacer","Rehacer"]
    ];
    document.getElementById("ofi-cuerpo").innerHTML =
      '<div style="max-width:900px;margin:0 auto">' +
        '<div style="background:#fff;border:1px solid #E6E5E3;border-radius:12px;padding:8px;display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">' +
          barra.map(b=>'<button title="'+b[3]+'" onclick="Oficina.cmd(\''+b[0]+'\',\''+b[1]+'\')" style="padding:6px 10px;border:1px solid #E6E5E3;border-radius:8px;background:#F9F8F7;font:inherit;cursor:pointer">'+b[2]+'</button>').join("") +
          '<span id="ofi-pal" style="margin-left:auto;align-self:center;font-size:13px;color:#7D7A75"></span>' +
        '</div>' +
        '<div id="ofi-doc" contenteditable="true" style="background:#fff;border:1px solid #E6E5E3;border-radius:12px;min-height:60vh;padding:34px 40px;outline:none"></div>' +
        '<p style="font-size:13px;color:#7D7A75">Escrib\u00ed ac\u00e1 tu trabajo. Se guarda solo cada unos segundos y el profesor lo ve desde su panel.</p>' +
      '</div>';
    const d = document.getElementById("ofi-doc");
    d.innerHTML = Oficina.datos.contenido.html || "";
    d.oninput = ()=>{ Oficina.palabras(); Oficina.marcar(); };
    Oficina.palabras();
    d.focus();
  },
  cmd(c, v){
    document.getElementById("ofi-doc").focus();
    document.execCommand(c, false, v || null);
    Oficina.marcar();
  },
  palabras(){
    const d = document.getElementById("ofi-doc"), p = document.getElementById("ofi-pal");
    if(!d || !p) return;
    const n = (d.innerText||"").trim().split(/\s+/).filter(Boolean).length;
    p.textContent = n + (n===1?" palabra":" palabras");
  },

  /* ---------- planilla ---------- */
  verPlanilla(){
    let h = '<div style="max-width:1000px;margin:0 auto">' +
      '<div style="background:#fff;border:1px solid #E6E5E3;border-radius:12px;padding:10px;margin-bottom:12px;font-size:13px;color:#7D7A75">' +
        'Escrib\u00ed n\u00fameros o texto en las celdas. Para calcular empez\u00e1 con <b>=</b> : ' +
        '<code>=A1+B1</code>, <code>=SUMA(A1:A10)</code>, <code>=PROMEDIO(B1:B8)</code>, <code>=MAX(C1:C5)</code>, <code>=MIN(C1:C5)</code>, <code>=CONTAR(A1:A20)</code>.' +
        '<div style="margin-top:8px"><button onclick="Oficina.grafico()" style="'+Oficina.btn("#F0EFED","#2C2C2B")+'">Hacer gr\u00e1fico de barras (columna A: nombres, columna B: n\u00fameros)</button></div>' +
      '</div>' +
      '<div id="ofi-graf"></div>' +
      '<div style="overflow:auto;background:#fff;border:1px solid #E6E5E3;border-radius:12px"><table style="border-collapse:collapse;font-size:14px"><tr>' +
      '<th style="'+Oficina.th()+'"></th>' + COLS.map(c=>'<th style="'+Oficina.th()+'min-width:110px">'+c+'</th>').join("") + '</tr>';
    for(let f=1; f<=FILAS; f++){
      h += '<tr><th style="'+Oficina.th()+'">'+f+'</th>';
      for(const c of COLS){
        const ref = c+f;
        h += '<td id="c-'+ref+'" data-ref="'+ref+'" contenteditable="true" ' +
             'onfocus="Oficina.foco(this)" onblur="Oficina.salir(this)" ' +
             'style="border:1px solid #E6E5E3;padding:6px 8px;min-width:110px;outline:none"></td>';
      }
      h += '</tr>';
    }
    h += '</table></div></div>';
    document.getElementById("ofi-cuerpo").innerHTML = h;
    Oficina.recalcular();
  },
  th(){ return "background:#F0EFED;border:1px solid #E6E5E3;padding:6px 8px;color:#7D7A75;font-weight:600;"; },
  celdas(){ return Oficina.datos.contenido.celdas || (Oficina.datos.contenido.celdas = {}); },
  foco(td){ td.textContent = Oficina.celdas()[td.dataset.ref] || ""; },
  salir(td){
    const v = td.textContent.trim();
    const cs = Oficina.celdas();
    if(v) cs[td.dataset.ref] = v; else delete cs[td.dataset.ref];
    Oficina.recalcular();
    Oficina.marcar();
  },
  valor(ref, visto){
    const bruto = Oficina.celdas()[ref];
    if(bruto == null || bruto === "") return 0;
    if(String(bruto).charAt(0) !== "=") { const n = Number(String(bruto).replace(",",".")); return isNaN(n) ? 0 : n; }
    const r = Oficina.evaluar(String(bruto), visto || []);
    return typeof r === "number" ? r : 0;
  },
  rango(a, b, visto){
    const m1 = a.match(/^([A-H])(\d+)$/i), m2 = b.match(/^([A-H])(\d+)$/i);
    if(!m1 || !m2) return [];
    const c1 = COLS.indexOf(m1[1].toUpperCase()), c2 = COLS.indexOf(m2[1].toUpperCase());
    const f1 = Number(m1[2]), f2 = Number(m2[2]);
    const out = [];
    for(let c=Math.min(c1,c2); c<=Math.max(c1,c2); c++)
      for(let f=Math.min(f1,f2); f<=Math.max(f1,f2); f++)
        out.push(Oficina.valor(COLS[c]+f, visto));
    return out;
  },
  evaluar(formula, visto){
    let e = formula.slice(1).toUpperCase().replace(/,/g, ".");
    e = e.replace(/(SUMA|PROMEDIO|MAX|MIN|CONTAR)\(([A-H]\d+):([A-H]\d+)\)/g, (t, fn, a, b)=>{
      const v = Oficina.rango(a, b, visto);
      if(fn==="SUMA") return v.reduce((s,x)=>s+x, 0);
      if(fn==="PROMEDIO") return v.length ? (v.reduce((s,x)=>s+x, 0) / v.length) : 0;
      if(fn==="MAX") return v.length ? Math.max.apply(null, v) : 0;
      if(fn==="MIN") return v.length ? Math.min.apply(null, v) : 0;
      if(fn==="CONTAR") return v.filter(x=>x!==0).length;
      return 0;
    });
    e = e.replace(/([A-H]\d+)/g, (t, ref)=>{
      if(visto.indexOf(ref) >= 0) return 0;
      return Oficina.valor(ref, visto.concat([ref]));
    });
    if(/[^0-9+\-*/(). ]/.test(e)) return "\u00a1Error!";
    try{
      const r = Function('"use strict";return (' + (e || "0") + ')')();
      if(typeof r !== "number" || !isFinite(r)) return "\u00a1Error!";
      return Math.round(r * 10000) / 10000;
    }catch(err){ return "\u00a1Error!"; }
  },
  recalcular(){
    const cs = Oficina.celdas();
    for(const c of COLS) for(let f=1; f<=FILAS; f++){
      const ref = c+f, td = document.getElementById("c-"+ref);
      if(!td || td === document.activeElement) continue;
      const bruto = cs[ref];
      if(bruto == null || bruto === ""){ td.textContent = ""; td.style.textAlign = "left"; continue; }
      if(String(bruto).charAt(0) === "="){
        const r = Oficina.evaluar(String(bruto), [ref]);
        td.textContent = r; td.style.textAlign = "right"; td.style.background = "#E5F2FC";
      } else {
        td.textContent = bruto; td.style.background = "";
        td.style.textAlign = isNaN(Number(String(bruto).replace(",","."))) ? "left" : "right";
      }
    }
  },
  grafico(){
    const cs = Oficina.celdas(), datos = [];
    for(let f=1; f<=FILAS; f++){
      const et = cs["A"+f];
      if(!et) continue;
      datos.push({ et:String(et), v:Oficina.valor("B"+f, []) });
    }
    const g = document.getElementById("ofi-graf");
    if(!datos.length){ g.innerHTML = '<div style="background:#FBEBDE;border-radius:12px;padding:12px;margin-bottom:12px">Escrib\u00ed los nombres en la columna A y los n\u00fameros en la columna B, y volv\u00e9 a apretar el bot\u00f3n.</div>'; return; }
    const max = Math.max.apply(null, datos.map(d=>d.v).concat([1]));
    g.innerHTML = '<div style="background:#fff;border:1px solid #E6E5E3;border-radius:12px;padding:16px;margin-bottom:12px">' +
      '<b>Gr\u00e1fico de barras</b>' +
      datos.map(d=>'<div style="margin-top:10px"><div style="font-size:13px;color:#7D7A75">'+Oficina.esc(d.et)+' \u00b7 '+d.v+'</div>' +
        '<div style="background:#F0EFED;border-radius:6px;height:18px"><div style="width:'+Math.max(2, Math.round(d.v/max*100))+'%;height:18px;border-radius:6px;background:#2783DE"></div></div></div>').join("") +
      '</div>';
  },

  /* ---------- diapositivas ---------- */
  verDiapositivas(){
    const ss = Oficina.datos.contenido.slides || (Oficina.datos.contenido.slides = [{ titulo:"", texto:"" }]);
    if(Oficina.slide >= ss.length) Oficina.slide = ss.length - 1;
    const s = ss[Oficina.slide];
    document.getElementById("ofi-cuerpo").innerHTML =
      '<div style="max-width:1000px;margin:0 auto;display:flex;gap:16px;flex-wrap:wrap">' +
        '<div style="width:190px;min-width:160px">' +
          ss.map((x,i)=>'<div onclick="Oficina.irSlide('+i+')" style="cursor:pointer;background:'+(i===Oficina.slide?"#E5F2FC":"#fff")+';border:1px solid '+(i===Oficina.slide?"#2783DE":"#E6E5E3")+';border-radius:10px;padding:10px;margin-bottom:8px">' +
            '<div style="font-size:12px;color:#7D7A75">L\u00e1mina '+(i+1)+'</div>' +
            '<div style="font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+(Oficina.esc(x.titulo)||"Sin t\u00edtulo")+'</div></div>').join("") +
          '<button onclick="Oficina.nuevaSlide()" style="'+Oficina.btn("#F0EFED","#2C2C2B")+'width:100%;margin-bottom:8px">+ Nueva l\u00e1mina</button>' +
          (ss.length>1?'<button onclick="Oficina.borrarSlide()" style="'+Oficina.btn("#FCE9E7","#E56458")+'width:100%;margin-bottom:8px">Borrar esta l\u00e1mina</button>':"") +
          '<button onclick="Oficina.presentar()" style="'+Oficina.btn("#46A171","#fff")+'width:100%">Presentar</button>' +
        '</div>' +
        '<div style="flex:1;min-width:280px;background:#fff;border:1px solid #E6E5E3;border-radius:12px;padding:20px">' +
          '<label style="font-size:13px;color:#7D7A75">T\u00edtulo de la l\u00e1mina</label>' +
          '<input id="ofi-s-tit" value="'+Oficina.esc(s.titulo)+'" style="width:100%;padding:10px;border:1px solid #E6E5E3;border-radius:8px;font:inherit;font-size:20px;font-weight:700;margin-bottom:12px">' +
          '<label style="font-size:13px;color:#7D7A75">Contenido (una idea por l\u00ednea)</label>' +
          '<textarea id="ofi-s-txt" style="width:100%;min-height:40vh;padding:12px;border:1px solid #E6E5E3;border-radius:8px;font:inherit">'+Oficina.esc(s.texto)+'</textarea>' +
        '</div>' +
      '</div>';
    const t = document.getElementById("ofi-s-tit"), x = document.getElementById("ofi-s-txt");
    t.oninput = ()=>{ s.titulo = t.value; Oficina.marcar(); };
    x.oninput = ()=>{ s.texto = x.value; Oficina.marcar(); };
  },
  irSlide(i){ Oficina.recoger(); Oficina.slide = i; Oficina.verDiapositivas(); },
  nuevaSlide(){
    Oficina.recoger();
    Oficina.datos.contenido.slides.push({ titulo:"", texto:"" });
    Oficina.slide = Oficina.datos.contenido.slides.length - 1;
    Oficina.verDiapositivas(); Oficina.marcar();
  },
  borrarSlide(){
    const ss = Oficina.datos.contenido.slides;
    if(ss.length <= 1) return;
    ss.splice(Oficina.slide, 1);
    Oficina.slide = Math.max(0, Oficina.slide - 1);
    Oficina.verDiapositivas(); Oficina.marcar();
  },
  presentar(){
    Oficina.recoger();
    const ss = Oficina.datos.contenido.slides;
    let i = 0;
    const caja = document.createElement("div");
    caja.setAttribute("style", "position:fixed;inset:0;z-index:70;background:#2C2C2B;color:#fff;display:flex;flex-direction:column;justify-content:center;padding:8vh 8vw;font:20px/1.6 system-ui,sans-serif");
    const pintar = ()=>{
      const s = ss[i];
      caja.innerHTML = '<h1 style="font-size:44px;margin:0 0 24px">' + (Oficina.esc(s.titulo)||"") + '</h1>' +
        String(s.texto||"").split("\\n").filter(Boolean).map(l=>'<p style="margin:8px 0">\u2022 ' + Oficina.esc(l) + '</p>').join("") +
        '<div style="position:absolute;bottom:20px;left:0;right:0;display:flex;justify-content:center;gap:10px;align-items:center">' +
          '<button id="pr-a" style="'+Oficina.btn("#7D7A75","#fff")+'">Anterior</button>' +
          '<span style="font-size:14px">' + (i+1) + ' / ' + ss.length + '</span>' +
          '<button id="pr-s" style="'+Oficina.btn("#2783DE","#fff")+'">Siguiente</button>' +
          '<button id="pr-x" style="'+Oficina.btn("#F0EFED","#2C2C2B")+'">Cerrar</button>' +
        '</div>';
      caja.querySelector("#pr-a").onclick = ()=>{ if(i>0){ i--; pintar(); } };
      caja.querySelector("#pr-s").onclick = ()=>{ if(i<ss.length-1){ i++; pintar(); } };
      caja.querySelector("#pr-x").onclick = ()=>caja.remove();
    };
    pintar();
    document.body.appendChild(caja);
  },

  /* ---------- resumen para la entrega ---------- */
  async resumen(){
    if(!(typeof Alumno !== "undefined" && Alumno.yo && Alumno.codigo)) return "";
    let ds = [];
    try{
      const { data } = await db.rpc("mis_docs", { p_codigo:Alumno.codigo, p_student_id:Alumno.yo.id });
      ds = data || [];
    }catch(e){ return ""; }
    if(!ds.length) return "";
    return '<div class="alert ok">Trabajos hechos en Krueka que se env\u00edan con tu entrega: ' +
      ds.map(d=>"<b>"+OFICINA[d.tipo].t+"</b>"+(d.titulo?" ("+esc(d.titulo)+")":"")).join(" \u00b7 ") + '</div>';
  }
};
