/* Revisión privada de juegos y diseños del Club por dirección y administración. */
Object.assign(Club, {
  async vCreaJuegos(){
    const v=document.getElementById('view');if(!v)return;
    v.innerHTML='<div class="card"><div class="spinner">Cargando creaciones del Club…</div></div>';
    const r=await db.rpc('club_crea_revision');
    if(r.error){v.innerHTML='<div class="alert err">'+esc(r.error.message)+'</div>';return;}
    const rows=(Array.isArray(r.data)?r.data:[]).filter(x=>
      (x.type==='game'&&x.content?.game)||(x.type==='design'&&x.content?.model)||(x.type==='web'&&x.content?.studio?.files));
    const estado={draft:'Borrador',review:'Para revisar',published:'Aprobado',archived:'Archivado'};
    v.innerHTML='<div class="card"><button class="btn sec sm" onclick="Club.vPanel()">← Club</button>'+
      '<h1>Creaciones de los alumnos</h1><p class="note">Revisá juegos y diseños 3D antes de aprobarlos. Solo dirección y administración pueden verlos aquí.</p></div>'+
      (rows.length?rows.map(x=>{
        let mapa='';
        if(x.type==='web'){
          mapa='<p class="note">Proyecto del Studio · '+Object.keys(x.content.studio.files).length+' archivos</p><button class="btn sm" type="button" data-studio-project="'+esc(x.id)+'">▶ Probar el juego y ver código</button>';
        }else if(x.type==='design'){
          mapa='<canvas id="crea-vista-'+esc(x.id)+'" width="540" height="400" style="display:block;width:100%;max-width:540px;border-radius:9px" aria-label="Vista del diseño 3D"></canvas>';
        }else try{
          const j=EstudioClub.validar(x.content.game),muros=new Set(j.muros.map(p=>p.join(','))),
            tesoros=new Set(j.tesoros.map(p=>p.join(',')));
          for(let y=0;y<8;y++)for(let col=0;col<12;col++){
            const k=col+','+y;
            mapa+='<span style="display:grid;place-items:center;background:'+esc(EstudioClub.colores[j.tema][0])+';border:1px solid #ccd;min-width:20px;height:25px" aria-label="casilla">'+
              (col===1&&y===1?'●':j.salida[0]===col&&j.salida[1]===y?'🏁':muros.has(k)?'■':tesoros.has(k)?'★':'')+'</span>';
          }
        }catch(_e){mapa='<span>El juego tiene datos inválidos.</span>';}
        return '<article class="card" style="margin:12px 0"><h2>'+(x.type==='design'?'🧊 Diseño 3D · ':x.type==='web'?'✦ Studio · ':'🎮 Juego · ')+esc(x.title)+'</h2><p class="note">'+esc(x.alumno)+' · '+esc(estado[x.status]||x.status)+' · '+esc(x.updated_at||'')+'</p>'+
          '<div style="'+(x.type==='game'?'display:grid;grid-template-columns:repeat(12,minmax(20px,1fr));max-width:540px':'max-width:540px')+'" aria-label="Vista del proyecto">'+mapa+'</div>'+
          (x.review_note?'<p>Observación: '+esc(x.review_note)+'</p>':'')+
          (x.status==='review'?'<div style="display:flex;gap:8px;margin-top:12px"><button class="btn ok sm" onclick="Club.revisarCreaJuego(\''+esc(x.id)+'\',true)">Aprobar</button><button class="btn sec sm" onclick="Club.revisarCreaJuego(\''+esc(x.id)+'\',false)">Pedir mejora</button></div>':'')+'</article>';
      }).join(''):'<div class="card">Todavía no hay creaciones enviadas para revisión.</div>');
    v.querySelectorAll('[data-studio-project]').forEach(b=>b.onclick=()=>this.probarStudioRevision(rows.find(x=>x.id===b.dataset.studioProject)));
    for(const x of rows.filter(p=>p.type==='design')){
      try{Taller3D.dibujarEn(document.getElementById('crea-vista-'+x.id),x.content.model);}
      catch(_e){const canvas=document.getElementById('crea-vista-'+x.id);if(canvas)canvas.replaceWith(document.createTextNode('Diseño inválido.'));}
    }
  },
  probarStudioRevision(project){
    if(!project||!window.StudioIA)return;
    let files;try{files=StudioIA.validFiles(project.content.studio.files)}catch(e){alert(e.message);return;}
    document.getElementById('studio-revision')?.remove();
    const panel=document.createElement('div');panel.id='studio-revision';panel.style.cssText='position:fixed;inset:0;z-index:190;background:var(--bg);padding:14px;display:grid;grid-template-rows:auto 1fr;gap:10px';
    panel.innerHTML='<header style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><b>'+esc(project.title)+'</b><select id="sr-page" aria-label="Página del proyecto" style="width:180px">'+Object.keys(files).filter(n=>/\.html$/i.test(n)).map(n=>'<option>'+esc(n)+'</option>').join('')+'</select><button class="btn sec sm" id="sr-code">Ver código</button><button class="btn sec sm" id="sr-chat">Ver conversación</button><button class="btn sec sm" id="sr-close">Cerrar</button></header><div style="min-height:0;position:relative"><iframe title="Proyecto enviado para revisión" sandbox="allow-scripts" style="width:100%;height:100%;border:0;background:#fff"></iframe><section id="sr-files" hidden style="height:100%;overflow:auto"><select id="sr-file" aria-label="Archivo para revisar" style="max-width:300px">'+Object.keys(files).map(n=>'<option>'+esc(n)+'</option>').join('')+'</select><pre style="white-space:pre-wrap;overflow-wrap:anywhere"></pre></section></div>';
    document.body.appendChild(panel);
    const iframe=panel.querySelector('iframe'),select=panel.querySelector('#sr-page');
    const render=()=>{iframe.srcdoc=StudioIA.buildPreview.call({files,dirname:StudioIA.dirname,resolve:StudioIA.resolve},select.value)};
    const nav=e=>{if(e.source!==iframe.contentWindow||e.data?.type!=='krueka-studio-nav')return;const next=StudioIA.resolve(StudioIA.dirname(select.value),String(e.data.href||'').split('#')[0]);if(files[next]&&/\.html$/i.test(next)){select.value=next;render()}};
    window.addEventListener('message',nav);select.onchange=render;
    panel.querySelector('#sr-close').onclick=()=>{window.removeEventListener('message',nav);panel.remove()};
    const code=panel.querySelector('#sr-files'),file=panel.querySelector('#sr-file'),showCode=()=>code.querySelector('pre').textContent=files[file.value];
    file.onchange=showCode;showCode();
    panel.querySelector('#sr-code').onclick=e=>{code.hidden=!code.hidden;iframe.hidden=!code.hidden;e.target.textContent=code.hidden?'Ver código':'Ver juego'};
    panel.querySelector('#sr-chat').onclick=()=>{const h=StudioIA.cleanHistory(project.content.studio.history);const box=document.createElement('section');box.id='sr-conversation';box.style.cssText='position:absolute;inset:0;background:var(--bg);padding:20px;overflow:auto';box.innerHTML='<button class="btn sec sm" id="sr-chat-back">Volver al juego</button><h2>Conversación del proyecto</h2>'+h.map(m=>'<article class="card"><b>'+esc(m.role==='user'?'Alumno':m.role==='ai'?'Asistente':'Krueka')+(m.pending?' · Idea pendiente':'')+'</b><p style="white-space:pre-wrap;overflow-wrap:anywhere">'+esc(m.text)+'</p></article>').join('');panel.lastElementChild.appendChild(box);box.querySelector('#sr-chat-back').onclick=()=>box.remove()};
    render();
  },
  async revisarCreaJuego(id,aprobar){
    const nota=prompt(aprobar?'Observación opcional para el alumno:':'¿Qué debe mejorar el alumno?');
    if(nota===null)return;
    if(!aprobar&&!nota.trim()){alert('Indicá una mejora concreta para el alumno.');return;}
    const r=await db.rpc('club_crea_revisar',{p_project:id,p_status:aprobar?'published':'draft',p_note:nota.trim().slice(0,500)});
    if(r.error){alert(r.error.message);return;}
    this.vCreaJuegos();
  }
});
