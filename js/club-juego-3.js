/* Club Krueka 3/4 */
Object.assign(Club,{proyecto(){
    const l=this.lec, p=l.proyecto||{}, e=l.entrega||null;
    const pasos=(p.pasos||[]).map((x,idx)=>'<label class="club-build-step"><input class="club-step-check" type="checkbox" ' + (e?'checked':'') + '><span><b>' + (idx+1) + '</b>' + esc(x) + '</span></label>').join('');
    const criterios=(p.criterios||[]).map(x=>'<li>' + esc(x) + '</li>').join('');
    const link=p.url ? '<a class="club-tool-link" href="' + esc(p.url) + '" target="_blank" rel="noopener">Abrir ' + esc(p.herramienta||'herramienta') + ' ↗</a>' : '<span class="club-tool-static">🧰 ' + esc(p.herramienta||'Herramientas del aula') + '</span>';
    const bitacora=e ? (e.bitacora||'') : '';
    const evidencia=e ? (e.evidencia_url||'') : '';
    const junior=this.alumno.nivel==='mayores';
    this.pinta(this.cabecera(l.titulo)
      + '<section class="club-section-head"><div><span class="club-kicker">FASE 2 · CONSTRUIR</span><h1>' + esc(p.titulo||'Misión práctica') + '</h1><p>' + esc(p.consigna||'Construí una solución y registrá qué aprendiste.') + '</p></div>' + link + '</section>'
      + '<div class="club-build-layout"><section class="club-panel club-build-card"><span class="club-panel-label">PLAN DE ACCIÓN</span><div class="club-build-list">' + pasos + '</div>'
      + (p.extra ? '<div class="club-extra"><b>⚡ Desafío extra</b><p>' + esc(p.extra) + '</p></div>' : '') + '</section>'
      + '<aside class="club-panel club-rubric"><span class="club-panel-label">LISTO CUANDO…</span><ul>' + criterios + '</ul><div class="club-deliverable"><b>Entregable</b><p>' + esc(p.entregable||'Una evidencia y una reflexión breve.') + '</p></div></aside></div>'
      + '<section class="club-panel club-log"><span class="club-panel-label">BITÁCORA DE MISIÓN</span>'
      + (e ? '<div class="club-msg success">✓ Ya registraste esta misión. Podés mejorar la bitácora o ir al checkpoint.</div>' : '')
      + '<label for="cj-bitacora">' + (junior?'Explicá qué construiste, una decisión y un problema que resolviste.':'Contá qué construiste o descubriste.') + '</label>'
      + '<textarea id="cj-bitacora" rows="4" placeholder="' + (junior?'Construí… Elegí… Tuve que resolver…':'Hoy construí… y descubrí que…') + '">' + esc(bitacora) + '</textarea>'
      + '<label for="cj-evidencia">Enlace al proyecto o evidencia <span>(opcional)</span></label><input id="cj-evidencia" type="url" placeholder="https://…" value="' + esc(evidencia) + '">'
      + '<div id="cj-entrega-msg" aria-live="polite"></div><div class="club-log-actions"><button class="club-primary" onclick="Club.entregarProyecto()">' + (e?'Actualizar bitácora':'Registrar misión') + '</button>'
      + (e?'<button class="club-secondary" onclick="Club.jugar(0)">Ir al checkpoint →</button>':'') + '</div></section>'
      + '<div class="club-actions"><button class="club-ghost" onclick="Club.lectura()">← Volver al briefing</button></div>');
  },
async entregarProyecto(){
    const checks=[...document.querySelectorAll('.club-step-check')];
    const msg=document.getElementById('cj-entrega-msg');
    if(checks.length && checks.some(x=>!x.checked)){
      msg.innerHTML='<div class="club-msg error">Completá y marcá cada paso antes de registrar la misión.</div>'; return;
    }
    const bitacora=(document.getElementById('cj-bitacora').value||'').trim();
    const url=(document.getElementById('cj-evidencia').value||'').trim();
    const minimo=this.alumno.nivel==='mayores'?30:3;
    if(bitacora.length<minimo){
      msg.innerHTML='<div class="club-msg error">' + (minimo===30?'Contá un poco más: qué construiste, una decisión y un desafío.':'Contá brevemente qué hiciste.') + '</div>'; return;
    }
    msg.innerHTML='<div class="club-msg loading">Guardando la bitácora…</div>';
    const {data,error}=await db.rpc('club_entregar_proyecto',{
      p_student:this.alumno.student_id||this.alumno.id,
      p_lesson:this.lec.id,
      p_bitacora:bitacora,
      p_evidencia_url:url||null
    });
    if(error || !data || data.error){
      msg.innerHTML='<div class="club-msg error">' + esc((error&&error.message)||(data&&data.error)||'No se pudo guardar.') + '</div>'; return;
    }
    this.lec.entrega={bitacora:bitacora,evidencia_url:url,estado:'entregado'};
    msg.innerHTML='<div class="club-msg success">✓ Misión registrada. Ahora demostrá lo que aprendiste.</div><button class="club-primary" style="margin-top:10px" onclick="Club.jugar(0)">Comenzar checkpoint →</button>';
  },
jugar(i){
    const acts=this.lec.actividades||[];
    if(this.lec.proyecto && Object.keys(this.lec.proyecto).length && !this.lec.entrega){ this.proyecto(); return; }
    if(i>=acts.length){ this.fin(); return; }
    this.i=i; this.respondiendo=false;
    const a=acts[i];
    const codigo=a.contenido&&a.contenido.codigo ? '<pre class="club-code challenge"><code>' + esc(a.contenido.codigo) + '</code></pre>' : '';
    const letras='ABCD';
    const ops=(a.opciones||[]).map((o,idx)=>'<button class="club-option ' + (a.tipo==='codigo'?'code-option':'') + '" type="button" onclick="Club.responder(\'' + o.id + '\')">'
      + '<span class="club-option-key">' + letras[idx] + '</span>'
      + (o.emoji?'<span class="club-option-emoji">'+o.emoji+'</span>':'')
      + '<span>' + esc(o.texto||'') + '</span></button>').join('');
    const pct=Math.round(i/Math.max(acts.length,1)*100);
    this.pinta(this.cabecera(this.lec.titulo)
      + '<section class="club-quiz-head"><div><span class="club-kicker">FASE 3 · CHECKPOINT</span><h1>Desafío ' + (i+1) + ' de ' + acts.length + '</h1></div><div class="club-quiz-progress"><i style="width:' + pct + '%"></i></div></section>'
      + '<section class="club-question"><span class="club-type">' + esc((a.tipo||'reto').toUpperCase()) + '</span><h2>' + esc(a.pregunta||'') + '</h2>' + codigo
      + (a.pista?'<details class="club-hint"><summary>Necesito una pista</summary><p>💡 ' + esc(a.pista) + '</p></details>':'') + '</section>'
      + '<div class="club-options">' + ops + '</div><div id="cj-msg" class="club-feedback" aria-live="polite"></div>');
  }});
