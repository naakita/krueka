/* ==================== OFICINA KRUEKA: DOCUMENTO, PLANILLA Y DIAPOSITIVAS ==================== */
/* Todo funciona dentro de la plataforma: sin cuentas, sin registro y sin salir a otra pagina. */

const OFICINA = {
  documento:    { t:"Documento",    d:"Escribir textos",        ico:"\u270E" },
  planilla:     { t:"Planilla",     d:"Tablas y graficos",      ico:"\u25A6" },
  diapositivas: { t:"Diapositivas", d:"Presentacion con laminas", ico:"\u25B6" }
};

const COLS = ["A","B","C","D","E","F","G","H","I","J"];
const FILAS = 48;

const Oficina = {
  tipo:null, datos:null, slide:0, timer:null, sel:"A1",

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
      const im = document.getElementById("ofi-s-img"), fo = document.getElementById("ofi-s-fondo"),
            al = document.getElementById("ofi-s-al");
      const s = Oficina.datos.contenido.slides[Oficina.slide];
      if(s && t) s.titulo = t.value;
      if(s && x) s.texto = x.value;
      if(s && im) s.img = im.value.trim();
      if(s && fo) s.fondo = fo.value;
      if(s && al) s.al = al.value;
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
    try{ document.execCommand("styleWithCSS", false, true); }catch(e){}
    const barra = [
      ["bold","","<b>N</b>","Negrita"], ["italic","","<i>C</i>","Cursiva"], ["underline","","<u>S</u>","Subrayado"],
      ["formatBlock","h1","T\u00edtulo grande","T\u00edtulo grande"], ["formatBlock","h2","T\u00edtulo","T\u00edtulo"], ["formatBlock","h3","Subt\u00edtulo","Subt\u00edtulo"], ["formatBlock","p","Normal","Texto normal"],
      ["insertUnorderedList","","\u2022 Lista","Lista"], ["insertOrderedList","","1. Lista","Lista numerada"],
      ["justifyLeft","","\u2261 Izq.","Alinear a la izquierda"], ["justifyCenter","","\u2261 Centro","Centrar"],
      ["justifyRight","","\u2261 Der.","Alinear a la derecha"], ["justifyFull","","\u2261 Just.","Justificar"],
      ["undo","","Deshacer","Deshacer"], ["redo","","Rehacer","Rehacer"], ["removeFormat","","Limpiar","Quitar formato"]
    ];
    document.getElementById("ofi-cuerpo").innerHTML =
      '<div style="display:flex;gap:16px;align-items:flex-start">' + Oficina.guia() +
      '<div style="flex:1;min-width:0;max-width:900px">' + Oficina.botonGuia() +
        '<div style="background:#fff;border:1px solid #E6E5E3;border-radius:12px;padding:8px;display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">' +
          barra.map(b=>'<button title="'+b[3]+'" onclick="Oficina.cmd(\''+b[0]+'\',\''+b[1]+'\')" style="padding:6px 10px;border:1px solid #E6E5E3;border-radius:8px;background:#F9F8F7;font:inherit;cursor:pointer">'+b[2]+'</button>').join("") +
          '<span id="ofi-pal" style="margin-left:auto;align-self:center;font-size:13px;color:#7D7A75"></span>' +
        '</div>' +
        '<div style="background:#fff;border:1px solid #E6E5E3;border-radius:12px;padding:8px;display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;align-items:center">' +
          '<label title="Color de letra" style="display:flex;align-items:center;gap:4px;font-size:13px;color:#7D7A75">A<input type="color" value="#2C2C2B" onchange="Oficina.cmd(\'foreColor\',this.value)" style="width:34px;height:28px;padding:0;border:1px solid #E6E5E3;border-radius:6px"></label>' +
          '<label title="Resaltar" style="display:flex;align-items:center;gap:4px;font-size:13px;color:#7D7A75">Resaltar<input type="color" value="#FFF3B0" onchange="Oficina.cmd(\'hiliteColor\',this.value)" style="width:34px;height:28px;padding:0;border:1px solid #E6E5E3;border-radius:6px"></label>' +
          '<select title="Tipo de letra" onchange="Oficina.cmd(\'fontName\',this.value);this.selectedIndex=0" style="padding:6px;border:1px solid #E6E5E3;border-radius:8px;font:inherit">' +
            '<option value="">Letra</option><option>Arial</option><option>Verdana</option><option>Georgia</option><option>Courier New</option><option>Times New Roman</option><option>Comic Sans MS</option></select>' +
          '<select title="Tama\u00f1o de letra" onchange="Oficina.cmd(\'fontSize\',this.value);this.selectedIndex=0" style="padding:6px;border:1px solid #E6E5E3;border-radius:8px;font:inherit">' +
            '<option value="">Tama\u00f1o</option><option value="2">Peque\u00f1o</option><option value="3">Normal</option><option value="4">Mediano</option><option value="5">Grande</option><option value="6">Muy grande</option></select>' +
          '<button title="Poner una imagen de internet" onclick="Oficina.imagenDoc()" style="padding:6px 10px;border:1px solid #E6E5E3;border-radius:8px;background:#F9F8F7;font:inherit;cursor:pointer">Imagen</button>' +
        '</div>' +
        '<div id="ofi-doc" contenteditable="true" style="background:#fff;border:1px solid #E6E5E3;border-radius:12px;min-height:60vh;padding:34px 40px;outline:none"></div>' +
        '<p style="font-size:13px;color:#7D7A75">Escrib\u00ed ac\u00e1 tu trabajo. Se guarda solo cada unos segundos y el profesor lo ve desde su panel.</p>' +
      '</div></div>';
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
  imagenDoc(){
    const u = prompt("Peg\u00e1 la direcci\u00f3n (URL) de la imagen:");
    if(!u) return;
    const url = String(u).trim();
    if(!/^https?:\/\//i.test(url)){ alert("La direcci\u00f3n tiene que empezar con http:// o https://"); return; }
    Oficina.cmd("insertImage", url);
  },
  palabras(){
    const d = document.getElementById("ofi-doc"), p = document.getElementById("ofi-pal");
    if(!d || !p) return;
    const n = (d.innerText||"").trim().split(/\s+/).filter(Boolean).length;
    p.textContent = n + (n===1?" palabra":" palabras");
  },

  /* ---------- guia de la tarea (panel de la izquierda) ---------- */
  clase(){
    if(typeof Alumno === "undefined" || !Alumno.aula) return null;
    const cl = Alumno.aula.clase;
    if(!cl) return null;
    const hay = cl.actividad_titulo || cl.actividad_objetivo || cl.guia_alumno || (cl.pasos && cl.pasos.length);
    return hay ? cl : null;
  },
  guia(){
    const cl = Oficina.clase();
    if(!cl) return "";
    const pasos = cl.pasos || [];
    return '<div id="ofi-guia" style="width:310px;min-width:260px;flex:0 0 auto;position:sticky;top:0;max-height:calc(100vh - 120px);overflow:auto;background:#fff;border:1px solid #E6E5E3;border-radius:12px;padding:16px">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px">' +
        '<span style="font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:#7D7A75">Tu tarea, paso a paso</span>' +
        '<button onclick="Oficina.guiaToggle()" style="' + Oficina.btn("#F0EFED","#2C2C2B") + 'padding:4px 8px;font-size:12px">Ocultar</button>' +
      '</div>' +
      '<h3 style="margin:6px 0 4px">' + Oficina.esc(cl.actividad_titulo || "Actividad") + '</h3>' +
      (cl.actividad_objetivo ? '<p style="margin:0 0 10px;font-size:14px;color:#7D7A75">' + Oficina.esc(cl.actividad_objetivo) + '</p>' : "") +
      (cl.guia_alumno ? '<div style="background:#F0EFED;border-radius:10px;padding:10px;margin-bottom:10px;font-size:14px">' +
        String(cl.guia_alumno).split("\n").filter(Boolean).map(l=>'<p style="margin:3px 0">' + Oficina.esc(l) + '</p>').join("") + '</div>' : "") +
      (pasos.length ? '<ol style="margin:0;padding-left:20px;font-size:14px">' +
        pasos.map(p=>'<li style="margin-bottom:8px">' + Oficina.esc(p) + '</li>').join("") + '</ol>' : "") +
      (cl.actividad_archivo ? '<div style="margin-top:10px;background:#E5F2FC;border-radius:10px;padding:10px;font-size:13px">Guard\u00e1 tu trabajo con el nombre <b>' + Oficina.esc(cl.actividad_archivo) + '</b></div>' : "") +
    '</div>';
  },
  guiaToggle(){
    const g = document.getElementById("ofi-guia"), b = document.getElementById("ofi-guia-ver");
    if(!g || !b) return;
    const oculta = g.style.display === "none";
    g.style.display = oculta ? "block" : "none";
    b.style.display = oculta ? "none" : "inline-block";
  },
  botonGuia(){
    if(!Oficina.clase()) return "";
    return '<button id="ofi-guia-ver" onclick="Oficina.guiaToggle()" style="' + Oficina.btn("#46A171","#fff") + 'display:none;margin-bottom:10px">Ver la tarea</button>';
  },

  /* ---------- planilla ---------- */
  verPlanilla(){
    const bs = Oficina.btn("#F0EFED","#2C2C2B") + "padding:6px 10px;";
    let h = '<div style="display:flex;gap:16px;align-items:flex-start">' + Oficina.guia() +
      '<div style="flex:1;min-width:0">' + Oficina.botonGuia() +
      '<div style="background:#fff;border:1px solid #E6E5E3;border-radius:12px;padding:10px;margin-bottom:10px">' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;font-size:13px">' +
          '<span style="color:#7D7A75">Aplicar a</span>' +
          '<input id="ofi-rango" value="' + (Oficina.sel||"A1") + '" placeholder="A1 o A1:D6" style="width:100px;padding:6px 8px;border:1px solid #E6E5E3;border-radius:8px;font:inherit;text-transform:uppercase">' +
          '<button onclick="Oficina.fmt(\'b\')" style="'+bs+'font-weight:800">N</button>' +
          '<button onclick="Oficina.fmt(\'i\')" style="'+bs+'font-style:italic">K</button>' +
          '<button onclick="Oficina.fmt(\'u\')" style="'+bs+'text-decoration:underline">S</button>' +
          '<button onclick="Oficina.fmt(\'al\',\'left\')" style="'+bs+'">Izquierda</button>' +
          '<button onclick="Oficina.fmt(\'al\',\'center\')" style="'+bs+'">Centrar</button>' +
          '<button onclick="Oficina.fmt(\'al\',\'right\')" style="'+bs+'">Derecha</button>' +
          '<button onclick="Oficina.fmt(\'bd\')" style="'+bs+'">Bordes</button>' +
          '<button onclick="Oficina.fmt(\'pc\')" title="Mostrar como porcentaje" style="'+bs+'">%</button>' +
          '<button onclick="Oficina.ordenar()" title="Ordenar las filas con datos de A a Z según la columna escrita en Aplicar a" style="'+bs+'">Ordenar A→Z</button>' +
          '<label style="display:flex;align-items:center;gap:4px;color:#7D7A75">Relleno <input type="color" value="#E5F2FC" onchange="Oficina.fmt(\'bg\',this.value)" style="width:34px;height:28px;padding:0;border:1px solid #E6E5E3;border-radius:6px"></label>' +
          '<label style="display:flex;align-items:center;gap:4px;color:#7D7A75">Letra <input type="color" value="#2C2C2B" onchange="Oficina.fmt(\'fg\',this.value)" style="width:34px;height:28px;padding:0;border:1px solid #E6E5E3;border-radius:6px"></label>' +
          '<select onchange="Oficina.fmt(\'ff\',this.value)" style="padding:6px;border:1px solid #E6E5E3;border-radius:8px;font:inherit">' +
            '<option value="">Tipo de letra</option><option>Arial</option><option>Verdana</option><option>Georgia</option><option>Courier New</option><option>Times New Roman</option></select>' +
          '<select onchange="Oficina.fmt(\'fs\',this.value)" style="padding:6px;border:1px solid #E6E5E3;border-radius:8px;font:inherit">' +
            '<option value="">Tama\u00f1o</option><option>10</option><option>12</option><option>14</option><option>16</option><option>18</option><option>22</option></select>' +
          '<button onclick="Oficina.ancho(20)" style="'+bs+'">Ancho +</button>' +
          '<button onclick="Oficina.ancho(-20)" style="'+bs+'">Ancho -</button>' +
          '<button onclick="Oficina.alto(6)" style="'+bs+'">Alto +</button>' +
          '<button onclick="Oficina.alto(-6)" style="'+bs+'">Alto -</button>' +
          '<button onclick="Oficina.fmt(\'limpiar\')" style="'+bs+'">Quitar formato</button>' +
        '</div>' +
        '<div style="margin-top:8px;font-size:12px;color:#7D7A75">' +
          'Escrib\u00ed la celda o el rango en <b>Aplicar a</b> (por ejemplo <code>A1</code> o <code>A1:J40</code>) y toc\u00e1 el bot\u00f3n de formato. ' +
          'Para calcular, empez\u00e1 la celda con <b>=</b> : <code>=A1+B1</code>, <code>=A1^2</code>, <code>=SUMA(A1:A40)</code>, <code>=PROMEDIO(B1:B30)</code>, <code>=MAX(C1:C20)</code>, <code>=MIN(C1:C20)</code>, <code>=CONTAR(A1:A40)</code>, <code>=CONTAR.SI(B1:B30;&quot;&gt;6&quot;)</code>, <code>=SI(B2&gt;=6;&quot;Aprobado&quot;;&quot;Debe mejorar&quot;)</code>, <code>=REDONDEAR(C4;2)</code>, <code>=POTENCIA(A2;3)</code>, <code>=RAIZ(B5)</code>.' +
          '<button onclick="Oficina.grafico()" style="'+bs+'margin-left:8px">Gr\u00e1fico de barras (A: nombres, B: n\u00fameros)</button>' +
        '</div>' +
      '</div>' +
      '<div id="ofi-graf"></div>' +
      '<div style="overflow:auto;background:#fff;border:1px solid #E6E5E3;border-radius:12px"><table style="border-collapse:collapse;font-size:14px"><tr>' +
      '<th style="'+Oficina.th()+'"></th>' + COLS.map(c=>'<th id="h-'+c+'" style="'+Oficina.th()+'min-width:110px">'+c+'</th>').join("") + '</tr>';
    for(let f=1; f<=FILAS; f++){
      h += '<tr id="r-'+f+'"><th style="'+Oficina.th()+'">'+f+'</th>';
      for(const c of COLS){
        const ref = c+f;
        h += '<td id="c-'+ref+'" data-ref="'+ref+'" contenteditable="true" ' +
             'onfocus="Oficina.foco(this)" onblur="Oficina.salir(this)" ' +
             'style="border:1px solid #E6E5E3;padding:6px 8px;min-width:110px;outline:none"></td>';
      }
      h += '</tr>';
    }
    h += '</table></div></div></div>';
    document.getElementById("ofi-cuerpo").innerHTML = h;
    Oficina.recalcular();
    Oficina.aplicar();
  },
  th(){ return "background:#F0EFED;border:1px solid #E6E5E3;padding:6px 8px;color:#7D7A75;font-weight:600;"; },
  celdas(){ return Oficina.datos.contenido.celdas || (Oficina.datos.contenido.celdas = {}); },
  formatos(){ return Oficina.datos.contenido.formatos || (Oficina.datos.contenido.formatos = {}); },
  anchos(){ return Oficina.datos.contenido.anchos || (Oficina.datos.contenido.anchos = {}); },
  altos(){ return Oficina.datos.contenido.altos || (Oficina.datos.contenido.altos = {}); },
  refs(txt){
    const t = String(txt||"").toUpperCase().replace(/\s/g,"");
    const m = t.match(/^([A-J])([0-9]{1,2})(?::([A-J])([0-9]{1,2}))?$/);
    if(!m) return [];
    const c1 = COLS.indexOf(m[1]), c2 = m[3] ? COLS.indexOf(m[3]) : c1;
    const f1 = parseInt(m[2],10), f2 = m[4] ? parseInt(m[4],10) : parseInt(m[2],10);
    const out = [];
    for(let c=Math.min(c1,c2); c<=Math.max(c1,c2); c++)
      for(let f=Math.min(f1,f2); f<=Math.max(f1,f2); f++) if(f>=1 && f<=FILAS) out.push(COLS[c]+f);
    return out;
  },
  seleccion(){
    const i = document.getElementById("ofi-rango");
    const rs = Oficina.refs(i ? i.value : Oficina.sel);
    if(rs.length) return rs;
    return Oficina.sel ? [Oficina.sel] : [];
  },
  fmt(prop, valor){
    const rs = Oficina.seleccion();
    if(!rs.length){ alert("Escrib\u00ed la celda o el rango en Aplicar a, por ejemplo A1 o A1:D6."); return; }
    const fs = Oficina.formatos();
    if(prop === "limpiar"){ rs.forEach(r=>{ delete fs[r]; }); }
    else if(prop==="b" || prop==="i" || prop==="u" || prop==="bd" || prop==="pc"){
      const encender = !rs.every(r=>fs[r] && fs[r][prop]);
      rs.forEach(r=>{
        const o = fs[r] || (fs[r] = {});
        if(encender) o[prop] = 1; else delete o[prop];
        if(!Object.keys(o).length) delete fs[r];
      });
    } else {
      rs.forEach(r=>{
        const o = fs[r] || (fs[r] = {});
        if(valor) o[prop] = valor; else delete o[prop];
        if(!Object.keys(o).length) delete fs[r];
      });
    }
    Oficina.aplicar();
    Oficina.marcar();
  },
  ancho(d){
    const rs = Oficina.seleccion(); if(!rs.length) return;
    const an = Oficina.anchos();
    const cols = [];
    rs.forEach(r=>{ const c = r[0]; if(cols.indexOf(c)<0) cols.push(c); });
    cols.forEach(c=>{ an[c] = Math.max(70, Math.min(360, (an[c]||110) + d)); });
    Oficina.aplicar(); Oficina.marcar();
  },
  alto(d){
    const rs = Oficina.seleccion(); if(!rs.length) return;
    const al = Oficina.altos();
    const filas = [];
    rs.forEach(r=>{ const f = r.slice(1); if(filas.indexOf(f)<0) filas.push(f); });
    filas.forEach(f=>{ al[f] = Math.max(28, Math.min(120, (al[f]||34) + d)); });
    Oficina.aplicar(); Oficina.marcar();
  },
  estilo(ref){
    const o = Oficina.formatos()[ref] || {};
    return (o.bd ? "border:2px solid #2C2C2B;" : "border:1px solid #E6E5E3;") +
      "padding:6px 8px;outline:none;" +
      (o.b ? "font-weight:700;" : "") +
      (o.i ? "font-style:italic;" : "") +
      (o.u ? "text-decoration:underline;" : "") +
      (o.al ? "text-align:" + o.al + ";" : "") +
      (o.bg ? "background:" + o.bg + ";" : "") +
      (o.fg ? "color:" + o.fg + ";" : "") +
      (o.fs ? "font-size:" + o.fs + "px;" : "") +
      (o.ff ? "font-family:" + o.ff + ";" : "");
  },
  aplicar(){
    const an = Oficina.anchos(), al = Oficina.altos();
    for(const c of COLS){
      const th = document.getElementById("h-" + c);
      if(th) th.style.minWidth = (an[c]||110) + "px";
    }
    for(let f=1; f<=FILAS; f++){
      const tr = document.getElementById("r-" + f);
      if(tr) tr.style.height = al[f] ? al[f] + "px" : "";
      for(const c of COLS){
        const td = document.getElementById("c-" + c + f);
        if(td) td.setAttribute("style", Oficina.estilo(c+f) + "min-width:" + (an[c]||110) + "px;");
      }
    }
  },
  foco(td){
    Oficina.sel = td.dataset.ref;
    const i = document.getElementById("ofi-rango");
    if(i) i.value = Oficina.sel;
    td.textContent = Oficina.celdas()[td.dataset.ref] || "";
  },
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
    const m1 = a.match(/^([A-J])(\d+)$/i), m2 = b.match(/^([A-J])(\d+)$/i);
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
    let e = formula.slice(1).replace(/,/g, ".");
    e = e.replace(/(SUMA|PROMEDIO|MAX|MIN|CONTAR)\(([A-J]\d+):([A-J]\d+)\)/gi, (t, fn, a, b)=>{
      fn = fn.toUpperCase(); a = a.toUpperCase(); b = b.toUpperCase();
      const v = Oficina.rango(a, b, visto);
      if(fn==="SUMA") return v.reduce((s,x)=>s+x, 0);
      if(fn==="PROMEDIO") return v.length ? (v.reduce((s,x)=>s+x, 0) / v.length) : 0;
      if(fn==="MAX") return v.length ? Math.max.apply(null, v) : 0;
      if(fn==="MIN") return v.length ? Math.min.apply(null, v) : 0;
      if(fn==="CONTAR") return v.filter(x=>x!==0).length;
      return 0;
    });
    e = Oficina.contarSi(e, visto);
    e = Oficina.sustituirSI(e, visto);
    e = Oficina.fnSimple(e, visto);
    e = e.replace(/([A-J]\d+)/gi, (t, ref)=>{
      ref = ref.toUpperCase();
      if(visto.indexOf(ref) >= 0) return 0;
      return Oficina.valor(ref, visto.concat([ref]));
    });
    e = e.replace(/(-?[\d.]+)\^(-?[\d.]+)/g, (t, a, b)=>Math.pow(Number(a), Number(b)));
    const solo = e.trim();
    if(solo.length > 1 && solo.charAt(0) === '"' && solo.charAt(solo.length-1) === '"') return solo.slice(1, -1);
    if(/[^0-9+\-*/(). ]/.test(e)) return "¡Error!";
    try{
      const r = Function('"use strict";return (' + (e || "0") + ')')();
      if(typeof r !== "number" || !isFinite(r)) return "¡Error!";
      return Math.round(r * 10000) / 10000;
    }catch(err){ return "¡Error!"; }
  },
  /* Divide argumentos de nivel superior separados por ; (respeta parentesis y comillas) */
  partirArgs(s){
    const out = []; let d = 0, q = false, cur = "";
    for(let i=0; i<s.length; i++){
      const ch = s[i];
      if(ch === '"') q = !q;
      else if(!q && ch === "(") d++;
      else if(!q && ch === ")") d--;
      if(!q && d === 0 && ch === ";"){ out.push(cur); cur = ""; continue; }
      cur += ch;
    }
    out.push(cur);
    return out.map(x=>x.trim());
  },
  /* Resuelve un operando: numero, "texto", referencia o expresion simple */
  operando(s, visto){
    s = String(s == null ? "" : s).trim();
    if(!s) return 0;
    if(s.charAt(0) === '"' && s.charAt(s.length-1) === '"' && s.length > 1){
      const adentro = s.slice(1, -1);
      if(adentro !== "" && !isNaN(Number(adentro))) return Number(adentro);
      return adentro;
    }
    if(/^[A-J]\d+$/i.test(s)){
      s = s.toUpperCase();
      if((visto || []).indexOf(s) >= 0) return 0;
      const cs = Oficina.celdas();
      if(!(s in cs)) return 0;
      const crudo = cs[s];
      if(typeof crudo === "string" && crudo.charAt(0) !== "="){
        const nn = Number(crudo.replace(",", "."));
        if(isNaN(nn)) return String(crudo);
      }
      return Oficina.valor(s, (visto || []).concat([s]));
    }
    const n = Number(s);
    if(!isNaN(n)) return n;
    const r = Oficina.evaluar("=" + s, visto || []);
    return (typeof r === "number" || typeof r === "string") ? r : 0;
  },
  /* Evalua condicion tipo A1>10, B2="SI", 5<=C3. Devuelve 1 o 0. */
  evalCond(cond, visto){
    const c = String(cond || "").trim();
    if(/^(SI|Y|O)\(/i.test(c)){
      const r = Oficina.sustituirSI(c, visto);
      if(r === c) return Oficina.operando(c, visto) ? 1 : 0;
      const t = String(r).trim();
      if(t.length > 1 && t.charAt(0) === '"' && t.charAt(t.length-1) === '"') return t.length > 2 ? 1 : 0;
      return Number(t) ? 1 : 0;
    }
    const m = c.match(/^(.*?)(>=|<=|<>|>|<|=)(.*)$/);
    if(!m) return Oficina.operando(cond, visto) ? 1 : 0;
    const iz = Oficina.operando(m[1], visto), de = Oficina.operando(m[3], visto), op = m[2];
    const ambosNum = typeof iz === "number" && typeof de === "number";
    if(!ambosNum){
      const a = String(iz).toUpperCase(), b = String(de).toUpperCase();
      if(op === "=") return a === b ? 1 : 0;
      if(op === "<>") return a !== b ? 1 : 0;
      return 0;
    }
    if(op === ">") return iz > de ? 1 : 0;
    if(op === "<") return iz < de ? 1 : 0;
    if(op === "=") return iz === de ? 1 : 0;
    if(op === ">=") return iz >= de ? 1 : 0;
    if(op === "<=") return iz <= de ? 1 : 0;
    if(op === "<>") return iz !== de ? 1 : 0;
    return 0;
  },
  /* Reemplaza SI(cond;vVerdadero;vFalso), Y(..;..) y O(..;..), incluso anidados */
  sustituirSI(e, visto){
    for(let vuelta=0; vuelta<20; vuelta++){
      const m0 = e.match(/\b(SI|Y|O)\(/i);
      if(!m0) return e;
      const i = m0.index, fn = m0[1].toUpperCase();
      let d = 0, j = -1;
      for(let k=i+fn.length; k<e.length; k++){
        if(e[k] === "(") d++;
        else if(e[k] === ")"){ d--; if(d === 0){ j = k; break; } }
      }
      if(j < 0) return e;
      const args = Oficina.partirArgs(e.slice(i + fn.length + 1, j));
      let val = 0;
      if(fn === "SI" && args.length === 3){
        val = Oficina.evalCond(args[0], visto)
          ? Oficina.operando(args[1], visto)
          : Oficina.operando(args[2], visto);
        if(typeof val === "string"){ e = e.slice(0, i) + '"' + val.replace(/"/g, "") + '"' + e.slice(j+1); continue; }
      } else if(fn === "Y" && args.length){
        val = args.every(a=>Oficina.evalCond(a, visto)) ? 1 : 0;
      } else if(fn === "O" && args.length){
        val = args.some(a=>Oficina.evalCond(a, visto)) ? 1 : 0;
      }
      e = e.slice(0, i) + val + e.slice(j+1);
    }
    return e;
  },
  /* REDONDEAR(x;dec), POTENCIA(x;y), RAIZ(x) */
  fnSimple(e, visto){
    e = e.replace(/REDONDEAR\(([^()]+)\)/gi, (t, ad)=>{
      const a = Oficina.partirArgs(ad);
      const x = Oficina.operando(a[0], visto), d = Math.max(0, Math.min(6, Math.round(Oficina.operando(a[1] || 0, visto))));
      const f = Math.pow(10, d);
      return Math.round(Number(x) * f) / f;
    });
    e = e.replace(/POTENCIA\(([^()]+)\)/gi, (t, ad)=>{
      const a = Oficina.partirArgs(ad);
      return Math.pow(Number(Oficina.operando(a[0], visto)) || 0, Number(Oficina.operando(a[1], visto)) || 0);
    });
    e = e.replace(/RAIZ\(([^()]+)\)/gi, (t, ad)=>{
      const x = Number(Oficina.operando(ad, visto)) || 0;
      return x < 0 ? 0 : Math.round(Math.sqrt(x) * 10000) / 10000;
    });
    return e;
  },
  /* CONTAR.SI(rango;criterio) con criterio ">10", 5 o "texto" */
  contarSi(e, visto){
    return e.replace(/CONTAR\.SI\(([A-J]\d+):([A-J]\d+);([^()]+)\)/gi, (t, a, b, crit)=>{
      a = a.toUpperCase(); b = b.toUpperCase();
      crit = crit.trim();
      let textoPlano = null;
      if(crit.length > 1 && crit.charAt(0) === '"' && crit.charAt(crit.length-1) === '"'){
        const dentro = crit.slice(1, -1);
        if(/^(>=|<=|<>|>|<|=)/.test(dentro)) crit = dentro;
        else textoPlano = dentro;
      }
      const m1 = a.match(/^([A-J])(\d+)$/), m2 = b.match(/^([A-J])(\d+)$/);
      const c1 = COLS.indexOf(m1[1]), c2 = COLS.indexOf(m2[1]);
      const f1 = Number(m1[2]), f2 = Number(m2[2]);
      let n = 0;
      const mc = crit.match(/^(>=|<=|<>|>|<|=)(.*)$/);
      for(let c=Math.min(c1,c2); c<=Math.max(c1,c2); c++)
        for(let f=Math.min(f1,f2); f<=Math.max(f1,f2); f++){
          const ref = COLS[c]+f, cs = Oficina.celdas();
          if(!(ref in cs)) continue;
          const crudo = String(cs[ref]);
          if(mc){
            const v = Oficina.valor(ref, visto), lim = Number(mc[2]);
            if(isNaN(lim)) continue;
            const op = mc[1];
            if(op === ">" && v > lim) n++;
            else if(op === "<" && v < lim) n++;
            else if(op === "=" && v === lim) n++;
            else if(op === ">=" && v >= lim) n++;
            else if(op === "<=" && v <= lim) n++;
            else if(op === "<>" && v !== lim) n++;
          } else if(textoPlano !== null){
            if(crudo.toUpperCase() === textoPlano.toUpperCase()) n++;
          } else {
            if(Oficina.valor(ref, visto) === Number(crit)) n++;
          }
        }
      return n;
    });
  },
  recalcular(){
    const cs = Oficina.celdas();
    const fmtNum = n=>{
      const r = Math.round(Number(n) * 100) / 100;
      return String(r).replace(".", ",");
    };
    for(const c of COLS) for(let f=1; f<=FILAS; f++){
      const ref = c+f, td = document.getElementById("c-"+ref);
      if(!td || td === document.activeElement) continue;
      const bruto = cs[ref], fo = Oficina.formatos()[ref] || {};
      if(bruto == null || bruto === ""){ td.textContent = ""; if(!fo.al) td.style.textAlign = "left"; if(!fo.bg) td.style.background = ""; continue; }
      if(String(bruto).charAt(0) === "="){
        const r = Oficina.evaluar(String(bruto), [ref]);
        td.textContent = (typeof r === "number" && fo.pc) ? fmtNum(r * 100) + " %" : r;
        if(!fo.al) td.style.textAlign = "right";
        if(!fo.bg) td.style.background = "#E5F2FC";
      } else if(fo.pc && !isNaN(Number(String(bruto).replace(",",".")))){
        td.textContent = fmtNum(Number(String(bruto).replace(",",".")) * 100) + " %";
        if(!fo.bg) td.style.background = "";
        if(!fo.al) td.style.textAlign = "right";
      } else {
        td.textContent = bruto;
        if(!fo.bg) td.style.background = "";
        if(!fo.al) td.style.textAlign = isNaN(Number(String(bruto).replace(",","."))) ? "left" : "right";
      }
    }
  },
  ordenar(){
    const i = document.getElementById("ofi-rango");
    const col = String((i && i.value) || Oficina.sel || "A").toUpperCase().charAt(0);
    if(COLS.indexOf(col) < 0){ alert("Elegí la columna en Aplicar a, por ejemplo B."); return; }
    const cs = Oficina.celdas();
    const filas = [];
    for(let f=1; f<=FILAS; f++){
      if(COLS.some(c=>(cs[c+f]||"") !== "")) filas.push(f);
    }
    if(filas.length < 2){ alert("No hay filas para ordenar."); return; }
    const clave = f=>{
      const v = cs[col+f];
      if(v == null || v === "") return "\uffff";
      const n = Number(String(v).replace(",","."));
      if(!isNaN(n)) return "\u0000" + (100000000 + n);
      return String(v).toUpperCase();
    };
    filas.sort((a,b)=>clave(a) < clave(b) ? -1 : clave(a) > clave(b) ? 1 : 0);
    const copia = {};
    Object.keys(cs).forEach(k=>{ copia[k] = cs[k]; });
    const todas = [];
    for(let f=1; f<=FILAS; f++) todas.push(f);
    const libres = todas.filter(f=>filas.indexOf(f) < 0);
    const destino = filas.concat(libres);
    const nueva = {};
    Object.keys(copia).forEach(ref=>{
      const m = ref.match(/^([A-J])(\d+)$/);
      if(!m){ nueva[ref] = copia[ref]; return; }
      const idx = filas.indexOf(Number(m[2]));
      nueva[m[1] + (idx >= 0 ? destino[idx] : m[2])] = copia[ref];
    });
    Object.keys(cs).forEach(k=>{ delete cs[k]; });
    Object.keys(nueva).forEach(k=>{ cs[k] = nueva[k]; });
    Oficina.recalcular();
    Oficina.marcar();
    alert("Filas ordenadas de A a Z según la columna " + col + ".");
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
          '<button onclick="Oficina.duplicarSlide()" style="'+Oficina.btn("#F0EFED","#2C2C2B")+'width:100%;margin-bottom:8px">Duplicar</button>' +
          '<div style="display:flex;gap:6px;margin-bottom:8px">' +
            '<button onclick="Oficina.moverSlide(-1)" title="Subir esta l\u00e1mina" style="'+Oficina.btn("#F0EFED","#2C2C2B")+'flex:1">\u2191</button>' +
            '<button onclick="Oficina.moverSlide(1)" title="Bajar esta l\u00e1mina" style="'+Oficina.btn("#F0EFED","#2C2C2B")+'flex:1">\u2193</button>' +
          '</div>' +
          (ss.length>1?'<button onclick="Oficina.borrarSlide()" style="'+Oficina.btn("#FCE9E7","#E56458")+'width:100%;margin-bottom:8px">Borrar esta l\u00e1mina</button>':"") +
          '<button onclick="Oficina.presentar()" style="'+Oficina.btn("#46A171","#fff")+'width:100%">Presentar</button>' +
        '</div>' +
        '<div style="flex:1;min-width:280px;background:#fff;border:1px solid #E6E5E3;border-radius:12px;padding:20px">' +
          '<label style="font-size:13px;color:#7D7A75">T\u00edtulo de la l\u00e1mina</label>' +
          '<input id="ofi-s-tit" value="'+Oficina.esc(s.titulo)+'" style="width:100%;padding:10px;border:1px solid #E6E5E3;border-radius:8px;font:inherit;font-size:20px;font-weight:700;margin-bottom:12px">' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">' +
            '<div style="flex:1;min-width:140px"><label style="font-size:13px;color:#7D7A75">Color de fondo</label>' +
            '<select id="ofi-s-fondo" style="width:100%;padding:8px;border:1px solid #E6E5E3;border-radius:8px;font:inherit">' +
              [["","Oscuro"],["blanco","Blanco"],["crema","Crema"],["azul","Celeste"],["verde","Verde"]].map(o=>'<option value="'+o[0]+'"'+(s.fondo===(o[0]||undefined)||(!s.fondo&&!o[0])?" selected":"")+'>'+o[1]+'</option>').join("") +
            '</select></div>' +
            '<div style="flex:1;min-width:140px"><label style="font-size:13px;color:#7D7A75">Texto</label>' +
            '<select id="ofi-s-al" style="width:100%;padding:8px;border:1px solid #E6E5E3;border-radius:8px;font:inherit">' +
              [["","A la izquierda"],["center","Centrado"]].map(o=>'<option value="'+o[0]+'"'+(s.al===o[0]?" selected":"")+'>'+o[1]+'</option>').join("") +
            '</select></div>' +
          '</div>' +
          '<label style="font-size:13px;color:#7D7A75">Imagen (direcci\u00f3n URL, opcional)</label>' +
          '<input id="ofi-s-img" value="'+Oficina.esc(s.img||"")+'" placeholder="https://..." style="width:100%;padding:8px;border:1px solid #E6E5E3;border-radius:8px;font:inherit;margin-bottom:12px">' +
          '<label style="font-size:13px;color:#7D7A75">Contenido (una idea por l\u00ednea)</label>' +
          '<textarea id="ofi-s-txt" style="width:100%;min-height:40vh;padding:12px;border:1px solid #E6E5E3;border-radius:8px;font:inherit">'+Oficina.esc(s.texto)+'</textarea>' +
        '</div>' +
      '</div>';
    const t = document.getElementById("ofi-s-tit"), x = document.getElementById("ofi-s-txt");
    t.oninput = ()=>{ s.titulo = t.value; Oficina.marcar(); };
    x.oninput = ()=>{ s.texto = x.value; Oficina.marcar(); };
    const im = document.getElementById("ofi-s-img"), fo = document.getElementById("ofi-s-fondo"),
          al = document.getElementById("ofi-s-al");
    if(im) im.oninput = ()=>{ s.img = im.value.trim(); Oficina.marcar(); };
    if(fo) fo.onchange = ()=>{ s.fondo = fo.value; Oficina.marcar(); };
    if(al) al.onchange = ()=>{ s.al = al.value; Oficina.marcar(); };
  },
  irSlide(i){ Oficina.recoger(); Oficina.slide = i; Oficina.verDiapositivas(); },
  duplicarSlide(){
    Oficina.recoger();
    const ss = Oficina.datos.contenido.slides, s = ss[Oficina.slide] || {};
    ss.splice(Oficina.slide + 1, 0, { titulo:s.titulo||"", texto:s.texto||"", img:s.img||"", fondo:s.fondo||"", al:s.al||"" });
    Oficina.slide = Oficina.slide + 1;
    Oficina.verDiapositivas(); Oficina.marcar();
  },
  moverSlide(d){
    Oficina.recoger();
    const ss = Oficina.datos.contenido.slides, j = Oficina.slide + d;
    if(j < 0 || j >= ss.length) return;
    const t = ss[Oficina.slide]; ss[Oficina.slide] = ss[j]; ss[j] = t;
    Oficina.slide = j;
    Oficina.verDiapositivas(); Oficina.marcar();
  },
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
    const temas = {
      "":        { bg:"#2C2C2B", fg:"#fff" },
      blanco:    { bg:"#FFFFFF", fg:"#2C2C2B" },
      crema:     { bg:"#FFF8E7", fg:"#2C2C2B" },
      azul:      { bg:"#E5F2FC", fg:"#2C2C2B" },
      verde:     { bg:"#E8F1EC", fg:"#2C2C2B" }
    };
    let i = 0;
    const caja = document.createElement("div");
    caja.setAttribute("style", "position:fixed;inset:0;z-index:70;display:flex;flex-direction:column;justify-content:center;padding:8vh 8vw;font:20px/1.6 system-ui,sans-serif");
    const pintar = ()=>{
      const s = ss[i], tm = temas[s.fondo] || temas[""];
      caja.style.background = tm.bg; caja.style.color = tm.fg;
      const ali = s.al === "center" ? "text-align:center;" : "";
      caja.innerHTML = '<div style="'+ali+'">' +
        '<h1 style="font-size:44px;margin:0 0 24px">' + (Oficina.esc(s.titulo)||"") + '</h1>' +
        (s.img ? '<div style="margin:0 0 20px"><img src="' + Oficina.esc(s.img) + '" alt="" style="max-width:100%;max-height:38vh;border-radius:12px"></div>' : "") +
        String(s.texto||"").split("\n").filter(Boolean).map(l=>'<p style="margin:8px 0">\u2022 ' + Oficina.esc(l) + '</p>').join("") +
        '</div>' +
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
    const teclas = (ev)=>{
      if(!document.body.contains(caja)){ document.removeEventListener("keydown", teclas); return; }
      if(ev.key === "ArrowRight" || ev.key === " "){ if(i<ss.length-1){ i++; pintar(); } ev.preventDefault(); }
      else if(ev.key === "ArrowLeft"){ if(i>0){ i--; pintar(); } ev.preventDefault(); }
      else if(ev.key === "Escape"){ caja.remove(); }
    };
    document.addEventListener("keydown", teclas);
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
