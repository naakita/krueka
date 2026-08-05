/* Krueka - Club de Informatica
   Registro totalmente separado de la escuela: usa las tablas club_* y nunca
   toca students / enrollments / courses. */

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
function gs(n){ return Number(n||0).toLocaleString('es-PY') + " Gs"; }

const Club = {
  alumno:null, lec:null, i:0, aciertos:0, grupos:[], panel:null,
  anio:new Date().getFullYear(), mesNum:new Date().getMonth()+1,

  ov(){
    let o = document.getElementById('club-ov');
    if(!o){
      o = document.createElement('div');
      o.id = 'club-ov';
      o.style.cssText = 'position:fixed;inset:0;z-index:80;background:#F9F8F7;overflow:auto;display:none';
      o.innerHTML = '<div id="club-box" style="max-width:980px;margin:0 auto;padding:18px 16px 60px"></div>';
      document.body.appendChild(o);
    }
    return o;
  },
  cerrar(){
    if(/\/club\/?$/.test(location.pathname)){ this.abrir(); return; }
    this.ov().style.display='none';
  },
  pinta(html){
    const o = this.ov(); o.style.display='block';
    document.getElementById('club-box').innerHTML = html;
    o.scrollTop = 0;
  },
  barra(titulo, btnCerrar){
    return '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px">'
      + '<div><div style="font-size:20px;font-weight:700">' + titulo + '</div>'
      + '<div class="note">Club de informatica - ' + esc((this.marca && this.marca.nombre) || 'Escuela') + '. Registro aparte del sistema escolar.</div></div>'
      + (btnCerrar===false ? '' : '<button class="btn sec" onclick="Club.cerrar()">Cerrar</button>')
      + '</div>';
  },

  /* ============ PORTADA PUBLICA ============ */
  async abrir(){
    this.pinta(this.barra('Club de informatica', false) + '<div class="card"><div class="spinner">Cargando...</div></div>');
    const [{ data, error }, { data: marca }] = await Promise.all([
      db.rpc('club_grupos'),
      db.rpc('marca_institucion', {})
    ]);
    this.marca = marca || null;
    if(error){ this.pinta(this.barra('Club de informatica', false) + '<div class="alert err">No se pudo cargar: ' + esc(error.message) + '</div>'); return; }
    this.grupos = data || [];
    const cards = this.grupos.map(g =>
      '<div class="card" style="flex:1;min-width:240px">'
      + '<div style="font-size:34px">' + (g.nivel==='peques' ? '🧸' : '🚀') + '</div>'
      + '<div style="font-size:17px;font-weight:700">' + esc(g.nombre) + '</div>'
      + '<div class="note">' + (g.edad_min||'') + ' a ' + (g.edad_max||'') + ' anos</div>'
      + '<div style="margin-top:8px"><span class="tag blue">' + esc(g.dias||'') + '</span> <span class="tag green">' + esc(g.horario||'') + '</span></div>'
      + '<div style="margin-top:8px;font-weight:600">' + gs(g.cuota) + ' por mes</div>'
      + '<div class="note">Se puede abonar por semana (por ejemplo 20.000 Gs) y se descuenta del mes.</div>'
      + '</div>').join('');
    const m = this.marca;
    this.pinta(this.barra('Club de informatica', false)
      + '<div class="card" style="text-align:center">'
      + (m && m.logo ? '<img src="' + m.logo + '" alt="' + esc(m.nombre||'Escuela') + '" style="height:76px;object-fit:contain">' : '')
      + '<div style="font-size:20px;font-weight:700;margin-top:8px">Club de informatica</div>'
      + (m && m.nombre ? '<div class="note">' + esc(m.nombre) + '</div>' : '')
      + '<div class="note">Clases los sabados. Cada chico tiene su propio usuario y avanza a su ritmo.</div></div>'
      + '<div class="row">' + cards + '</div>'
      + '<div class="card" style="margin-top:12px;text-align:center">'
      + '<div style="font-size:17px;font-weight:700">🎮 Ya sos del club?</div>'
      + '<div class="note">Entra directo con tu codigo de 6 caracteres</div>'
      + '<div style="margin-top:10px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap">'
      + '<input id="cf-cod-directo" maxlength="6" style="text-transform:uppercase;letter-spacing:6px;font-size:22px;text-align:center;width:220px">'
      + '<button class="btn" onclick="Club.entrarCon(document.getElementById(\'cf-cod-directo\').value)">Entrar</button>'
      + '</div></div>'
      + '<div class="card" style="margin-top:12px;text-align:center">'
      + '<div class="note" style="margin-bottom:8px">Todavia no sos del club?</div>'
      + '<button class="btn" onclick="Club.vForm()">📝 Quiero inscribirme</button>'
      + '</div>');
  },

  /* ============ FORMULARIO DE INSCRIPCION ============ */
  vForm(){
    const ops = this.grupos.map(g => '<option value="' + g.id + '">' + esc(g.nombre) + ' (' + g.edad_min + '-' + g.edad_max + ' anos, ' + esc(g.dias||'') + ' ' + esc(g.horario||'') + ')</option>').join('');
    const f = (id,label,tipo,req) => '<div style="flex:1;min-width:220px"><label>' + label + (req?' *':'') + '</label>'
      + '<input id="' + id + '" type="' + (tipo||'text') + '"></div>';
    this.pinta(this.barra('Inscripcion al club')
      + '<div class="card">'
      + '<div class="note">Completa los datos. Solo la direccion y el administrador del club los pueden ver.</div>'
      + '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:10px">'
      + '<div style="flex:1;min-width:220px"><label>Grupo *</label><select id="cf-grupo">' + ops + '</select></div>'
      + f('cf-alumno','Nombre y apellido del alumno','text',true)
      + f('cf-nac','Fecha de nacimiento','date')
      + f('cf-edad','Edad','number')
      + f('cf-escuela','Escuela a la que asiste')
      + f('cf-grado','Grado o curso')
      + f('cf-tutor','Nombre del padre, madre o tutor','text',true)
      + f('cf-par','Parentesco')
      + f('cf-tel','Telefono de contacto','text',true)
      + f('cf-mail','Correo electronico','email')
      + f('cf-dir','Direccion')
      + f('cf-salud','Alguna condicion de salud o alergia')
      + '</div>'
      + '<div style="margin-top:10px"><label>Comentario</label><textarea id="cf-com" rows="3"></textarea></div>'
      + '<div style="margin-top:10px"><label style="display:inline"><input type="checkbox" id="cf-fotos" checked style="width:auto"> Autorizo el uso de fotos de las clases</label></div>'
      + '<div id="cf-msg" style="margin-top:10px"></div>'
      + '<div style="margin-top:12px;display:flex;gap:10px"><button class="btn" onclick="Club.enviar()">Enviar inscripcion</button>'
      + '<button class="btn sec" onclick="Club.abrir()">Volver</button></div>'
      + '</div>');
  },

  async enviar(){
    const v = id => (document.getElementById(id) ? (document.getElementById(id).value||'').trim() : '');
    const msg = document.getElementById('cf-msg');
    if(!v('cf-alumno') || !v('cf-tutor') || !v('cf-tel')){
      msg.innerHTML = '<div class="alert err">Falta el nombre del alumno, el tutor o el telefono.</div>'; return;
    }
    msg.innerHTML = '<div class="note">Enviando...</div>';
    const p = {
      group_id: v('cf-grupo'), alumno: v('cf-alumno'), fecha_nacimiento: v('cf-nac') || null,
      edad: v('cf-edad') || null, escuela: v('cf-escuela'), grado: v('cf-grado'),
      tutor: v('cf-tutor'), parentesco: v('cf-par'), telefono: v('cf-tel'), email: v('cf-mail'),
      direccion: v('cf-dir'), salud: v('cf-salud'), comentario: v('cf-com'),
      autoriza_fotos: document.getElementById('cf-fotos').checked
    };
    const { error } = await db.rpc('club_inscribir', { p });
    if(error){ msg.innerHTML = '<div class="alert err">' + esc(error.message) + '</div>'; return; }
    this.pinta(this.barra('Inscripcion enviada')
      + '<div class="card"><div style="font-size:40px">✅</div>'
      + '<div style="font-size:18px;font-weight:700">Listo, recibimos la inscripcion</div>'
      + '<div class="note">La direccion la va a revisar y te vamos a pasar el codigo personal del alumno para entrar a jugar.</div>'
      + '<div style="margin-top:12px"><button class="btn sec" onclick="Club.abrir()">Volver al inicio</button></div></div>');
  },

};
