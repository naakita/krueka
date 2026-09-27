/* Revisión privada de juegos y diseños del Club por dirección y administración. */
Object.assign(Club, {
  async vCreaJuegos(){
    const v=document.getElementById('view');if(!v)return;
    v.innerHTML='<div class="card"><div class="spinner">Cargando creaciones del Club…</div></div>';
    const r=await db.rpc('club_crea_revision');
    if(r.error){v.innerHTML='<div class="alert err">'+esc(r.error.message)+'</div>';return;}
    const rows=(Array.isArray(r.data)?r.data:[]).filter(x=>
      (x.type==='game'&&x.content?.game)||(x.type==='design'&&x.content?.model));
    const estado={draft:'Borrador',review:'Para revisar',published:'Aprobado',archived:'Archivado'};
    v.innerHTML='<div class="card"><button class="btn sec sm" onclick="Club.vPanel()">← Club</button>'+
      '<h1>Creaciones de los alumnos</h1><p class="note">Revisá juegos y diseños 3D antes de aprobarlos. Solo dirección y administración pueden verlos aquí.</p></div>'+
      (rows.length?rows.map(x=>{
        let mapa='';
        if(x.type==='design'){
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
        return '<article class="card" style="margin:12px 0"><h2>'+(x.type==='design'?'🧊 Diseño 3D · ':'🎮 Juego · ')+esc(x.title)+'</h2><p class="note">'+esc(x.alumno)+' · '+esc(estado[x.status]||x.status)+' · '+esc(x.updated_at||'')+'</p>'+
          '<div style="'+(x.type==='game'?'display:grid;grid-template-columns:repeat(12,minmax(20px,1fr));max-width:540px':'max-width:540px')+'" aria-label="Vista del proyecto">'+mapa+'</div>'+
          (x.review_note?'<p>Observación: '+esc(x.review_note)+'</p>':'')+
          (x.status==='review'?'<div style="display:flex;gap:8px;margin-top:12px"><button class="btn ok sm" onclick="Club.revisarCreaJuego(\''+esc(x.id)+'\',true)">Aprobar</button><button class="btn sec sm" onclick="Club.revisarCreaJuego(\''+esc(x.id)+'\',false)">Pedir mejora</button></div>':'')+'</article>';
      }).join(''):'<div class="card">Todavía no hay creaciones enviadas para revisión.</div>');
    for(const x of rows.filter(p=>p.type==='design')){
      try{Taller3D.dibujarEn(document.getElementById('crea-vista-'+x.id),x.content.model);}
      catch(_e){const canvas=document.getElementById('crea-vista-'+x.id);if(canvas)canvas.replaceWith(document.createTextNode('Diseño inválido.'));}
    }
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
