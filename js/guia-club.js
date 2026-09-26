/* Guía local del Club: pistas breves, sin servicio externo ni respuestas completas. */
const GuiaClub = {
  leccion: null, mensajes: [],
  iniciar(){
    const original = Club.proyecto;
    Club.proyecto = function(){
      original.apply(this, arguments);
      if(!this.alumno || this.alumno.nivel !== 'mayores' || !this.lec) return;
      const caja = document.getElementById('club-box');
      if(!caja) return;
      const zona = document.createElement('section');
      zona.className = 'club-panel';
      zona.style.marginTop = '16px';
      zona.innerHTML = '<h2>💡 Guía de programación</h2><p>Preguntá por tu HTML, CSS o JavaScript. Te orientará con pistas para que avances por tu cuenta.</p><button class="club-primary" type="button" onclick="GuiaClub.abrir()">Preguntar a la guía</button>';
      caja.appendChild(zona);
    };
  },
  abrir(){
    if(!Club.alumno || Club.alumno.nivel !== 'mayores' || !Club.lec) return;
    if(this.leccion !== Club.lec.id){ this.mensajes = []; this.leccion = Club.lec.id; }
    let panel = document.getElementById('guia-panel');
    if(!panel){
      panel = document.createElement('div'); panel.id = 'guia-panel';
      panel.style.cssText = 'position:fixed;inset:0;z-index:100;background:var(--bg);color:var(--tx);overflow:auto;padding:16px';
      panel.innerHTML = '<div style="max-width:760px;margin:auto"><div style="display:flex;justify-content:space-between;gap:12px;align-items:center"><h1>Guía de programación</h1><button class="btn sec" type="button" onclick="GuiaClub.cerrar()">Volver</button></div><p class="note">Esta guía responde con pistas preparadas; no es una IA. Tu conversación queda en esta página y se borra al cerrarla. No escribas datos personales.</p><div id="guia-historial" role="log" aria-live="polite" style="background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:16px;min-height:180px;margin:16px 0;max-height:45vh;overflow:auto"></div><form id="guia-form"><label for="guia-pregunta">¿Qué querés hacer o qué no funciona?</label><textarea id="guia-pregunta" maxlength="600" rows="3" required placeholder="Por ejemplo: mi botón no cambia de color, ¿dónde va el CSS?"></textarea><label for="guia-codigo">Fragmento de tu código (opcional)</label><textarea id="guia-codigo" maxlength="3000" rows="6" spellcheck="false" placeholder="Pegá solo la parte que estás revisando"></textarea><button class="btn" type="submit">Pedir una pista</button></form></div>';
      document.body.appendChild(panel);
      panel.querySelector('#guia-form').addEventListener('submit', e => { e.preventDefault(); this.enviar(); });
    }
    this.render(); panel.querySelector('#guia-pregunta').focus();
  },
  cerrar(){
    const panel = document.getElementById('guia-panel');
    if(panel) panel.remove();
    this.mensajes = []; this.leccion = null;
  },
  render(){
    const lista = document.getElementById('guia-historial'); if(!lista) return;
    lista.replaceChildren();
    if(!this.mensajes.length){ const p = document.createElement('p'); p.textContent = 'Contame qué intentaste. Empezaremos con una pista corta.'; lista.appendChild(p); }
    for(const m of this.mensajes){
      const p = document.createElement('p');
      p.style.cssText = 'white-space:pre-wrap;padding:10px;border-radius:9px;background:' + (m.rol === 'alumno' ? 'var(--blue-bg)' : 'var(--green-bg)');
      const b = document.createElement('b'); b.textContent = m.rol === 'alumno' ? 'Vos: ' : 'Guía: ';
      p.append(b, document.createTextNode(m.texto)); lista.appendChild(p);
    }
    lista.scrollTop = lista.scrollHeight;
  },
  enviar(){
    if(!Club.alumno || Club.alumno.nivel !== 'mayores' || !Club.lec) return;
    const q = document.getElementById('guia-pregunta'), c = document.getElementById('guia-codigo');
    if(!q || !c) return;
    const pregunta = q.value.trim(), codigo = c.value.trim(); if(!pregunta) return;
    const pista = this.pista(pregunta, codigo, Club.lec.proyecto || {});
    this.mensajes.push({rol:'alumno', texto:pregunta}, {rol:'guia', texto:pista});
    q.value = ''; this.render(); q.focus();
  },
  pista(pregunta, codigo, proyecto){
    const normal = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const texto = normal(pregunta), fuente = normal(codigo);
    const donde = /donde|pego|coloco|archivo|va el|poner/.test(texto);
    const falta = /no funciona|no aparece|error|falla|no cambia|no se ve/.test(texto);
    const idea = (paso, prueba) => 'Pista: ' + paso + '\nProbá: ' + prueba;
    if(/<script|javascript|funcion|function|onclick|evento|boton.*clic|click/.test(texto + ' ' + fuente)){
      if(donde) return idea('Buscá el archivo JavaScript de tu proyecto. Si usás una etiqueta <script>, va antes de cerrar </body>; conectá el botón con un evento.', '¿Qué mensaje aparece en la consola al hacer clic?');
      if(falta) return idea('Abrí la consola del navegador y hacé clic en el botón; leé el primer error y revisá si el nombre del elemento coincide exactamente.', '¿Se ejecuta el evento o falla antes?');
      return idea('Elegí un solo elemento y una sola acción. Primero comprobá que el clic se detecta; después cambiá su comportamiento.', '¿Qué tendría que pasar al primer clic?');
    }
    if(/css|style|color|fondo|margen|centr|tamano|fuente|diseno|estilo/.test(texto + ' ' + fuente)){
      if(donde) return idea('Poné la regla en tu archivo CSS; si trabajás en un único HTML, dentro de <style> en <head>. Revisá que el selector coincida con la clase o etiqueta.', '¿Qué selector identifica al elemento que querés cambiar?');
      if(falta) return idea('Inspeccioná el elemento en el navegador y buscá si tu regla aparece tachada o si el archivo CSS no carga.', '¿Cuál de esas dos cosas observás?');
      return idea('Elegí un elemento, escribí un selector específico y cambiá una sola propiedad para ver el efecto.', '¿Qué propiedad querés probar primero?');
    }
    if(/html|etiqueta|titulo|imagen|enlace|parrafo|body|pagina|web/.test(texto + ' ' + fuente)){
      if(donde) return idea('El contenido visible va entre <body> y </body>. Ubicá la sección a la que pertenece y agregá ahí una etiqueta semántica.', '¿Dónde se muestra ese contenido al recargar la página?');
      if(/imagen|foto/.test(texto)) return idea('Revisá la ruta del archivo de imagen desde la ubicación del HTML y comprobá que el nombre incluya la extensión correcta.', '¿Se abre la imagen si pegás su ruta en otra pestaña?');
      if(falta) return idea('Abrí la página, inspeccioná el elemento y revisá si la etiqueta está bien cerrada y dentro de <body>.', '¿El navegador muestra el elemento en el inspector?');
      return idea('Empezá con la estructura de una sola sección y mirá el resultado en el navegador antes de sumar otra.', '¿Qué parte de la página querés construir primero?');
    }
    if(codigo){
      const etiquetas = (codigo.match(/<([a-z][\w-]*)\b/gi) || []).length;
      if(etiquetas) return idea('Identificá una etiqueta de tu fragmento y comprobá en el navegador dónde aparece. Revisá luego su cierre y ubicación.', '¿Qué elemento se ve distinto de lo que esperabas?');
      return idea('Probá un cambio pequeño en tu fragmento y observá el resultado o el primer error de la consola.', '¿Qué cambió después de probarlo?');
    }
    const pasos = Array.isArray(proyecto.pasos) ? proyecto.pasos : [];
    const primerPaso = typeof pasos[0] === 'string' ? pasos[0].slice(0,180) : 'elegir una parte pequeña de tu proyecto';
    return idea('Volvé al plan de acción de esta misión y empezá por ' + primerPaso + '. Contame qué parte intentaste y qué ocurrió.', '¿Trabajás en HTML, CSS o JavaScript?');
  }
};
GuiaClub.iniciar();
