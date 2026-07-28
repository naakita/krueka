/* ==================== TALLER: HERRAMIENTAS Y BUSCADOR ==================== */
const HERRAMIENTAS = {
  word:       { t:"Word",       d:"Documento de texto",        u:"https://www.office.com/launch/word?auth=2" },
  excel:      { t:"Excel",      d:"Planilla y gráficos",       u:"https://www.office.com/launch/excel?auth=2" },
  powerpoint: { t:"PowerPoint", d:"Presentación con diapositivas", u:"https://www.office.com/launch/powerpoint?auth=2" },
  canva:      { t:"Canva",      d:"Diseño gráfico",            u:"https://www.canva.com/design/play" }
};

const Taller = {
  abrir(k){
    const h = HERRAMIENTAS[k]; if(!h) return;
    window.open(h.u, "krueka-"+k, "noopener");
  },
  tarjeta(herr){
    const orden = herr && HERRAMIENTAS[herr] ? [herr].concat(Object.keys(HERRAMIENTAS).filter(k=>k!==herr)) : Object.keys(HERRAMIENTAS);
    return `<div class="card" style="margin:12px 0 0">
      <h3>Herramientas de trabajo</h3>
      <p class="note">${herr&&HERRAMIENTAS[herr]?"Para esta tarea vas a usar <b>"+HERRAMIENTAS[herr].t+"</b>.":"Elegí la herramienta que necesites."} Se abre al costado y Krueka queda abierta con la consigna a la vista.</p>
      <div class="pill-list" style="margin-top:8px">
        ${orden.map(k=>`<button class="pill" aria-pressed="${k===herr}" onclick="Taller.abrir('${k}')">${HERRAMIENTAS[k].t} · ${HERRAMIENTAS[k].d}</button>`).join("")}
      </div>
      <p class="note" style="margin-top:8px">Cuando termines, volvé a esta pestaña y enviá tu trabajo más abajo.</p>
    </div>`;
  },
  buscador(){
    return `<div class="card">
      <h2>Buscador de la plataforma</h2>
      <p class="sub">Buscá información e imágenes de uso libre sin salir de Krueka. Todo lo que aparece acá tiene la fuente a la vista, así la podés citar en tu trabajo.</p>
      <div class="row">
        <input id="t-q" placeholder="Ej.: energía renovable en Paraguay" style="flex:1;min-width:200px" onkeydown="if(event.key==='Enter')Taller.buscar('texto')">
        <button class="btn" onclick="Taller.buscar('texto')">Buscar</button>
        <button class="btn sec" onclick="Taller.buscar('imagenes')">Imágenes libres</button>
      </div>
      <div id="t-res"></div>
      <div id="t-lector"></div>
    </div>`;
  },
  async buscar(modo){
    const q = $("t-q").value.trim();
    if(!q) return;
    $("t-lector").innerHTML = "";
    $("t-res").innerHTML = '<div class="spinner">Buscando…</div>';
    try{
      if(modo==="imagenes"){
        const u = "https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch="+encodeURIComponent(q)+
                  "&gsrnamespace=6&gsrlimit=12&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=320&format=json&origin=*";
        const j = await (await fetch(u)).json();
        const pags = (j.query && j.query.pages) ? Object.values(j.query.pages) : [];
        $("t-res").innerHTML = pags.length ? `<div class="grid3" style="margin-top:12px">${pags.map(p=>{
          const i = (p.imageinfo||[])[0]||{}; const m = i.extmetadata||{};
          const lic = (m.LicenseShortName&&m.LicenseShortName.value)||"Uso libre";
          return `<div class="kpi"><img src="${esc(i.thumburl||"")}" alt="${esc(p.title)}" style="width:100%;border-radius:8px">
            <div class="note" style="margin-top:6px">${esc(p.title.replace(/^File:/,""))}</div>
            <div class="note"><b>Licencia:</b> ${esc(lic)}</div>
            <a class="note" href="${esc(i.descriptionurl||"#")}" target="_blank" rel="noopener">Ver fuente para citarla</a></div>`;
        }).join("")}</div>` : '<p class="note">No se encontraron imágenes libres con esa palabra.</p>';
        return;
      }
      const u = "https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch="+encodeURIComponent(q)+"&srlimit=8&format=json&origin=*";
      const j = await (await fetch(u)).json();
      const rs = (j.query && j.query.search) || [];
      $("t-res").innerHTML = rs.length ? `<div style="margin-top:12px">${rs.map(r=>`
        <div class="stage" style="display:block">
          <b>${esc(r.title)}</b>
          <div class="note">${r.snippet.replace(/<[^>]*>/g,"")}…</div>
          <div style="margin-top:6px"><button class="btn sec sm" onclick="Taller.leer('${esc(r.title).replace(/'/g,"\\'")}')">Leer acá</button></div>
        </div>`).join("")}</div>` : '<p class="note">No se encontraron resultados.</p>';
    }catch(e){
      $("t-res").innerHTML = '<div class="alert err">No se pudo buscar. Revisá la conexión a internet de la sala.</div>';
    }
  },
  async leer(titulo){
    $("t-lector").innerHTML = '<div class="spinner">Abriendo…</div>';
    try{
      const u = "https://es.wikipedia.org/api/rest_v1/page/summary/"+encodeURIComponent(titulo);
      const j = await (await fetch(u)).json();
      $("t-lector").innerHTML = `<div class="card" style="background:var(--soft);margin-top:12px">
        <h3>${esc(j.title||titulo)}</h3>
        ${j.thumbnail?`<img src="${esc(j.thumbnail.source)}" alt="" style="max-width:220px;border-radius:8px;float:right;margin:0 0 8px 12px">`:""}
        <p>${esc(j.extract||"Sin resumen disponible.")}</p>
        <p class="note"><b>Fuente para citar:</b> Wikipedia en español — ${esc(j.title||titulo)} · <a href="${esc((j.content_urls&&j.content_urls.desktop&&j.content_urls.desktop.page)||"#")}" target="_blank" rel="noopener">ver artículo completo</a></p>
      </div>`;
    }catch(e){
      $("t-lector").innerHTML = '<div class="alert err">No se pudo abrir el artículo.</div>';
    }
  }
};
