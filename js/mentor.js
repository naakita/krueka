/* Mentor del Club: la clave de OpenAI y las reglas pedagógicas viven en el servidor. */
const Mentor = {
  mensajes:[], leccion:null, ocupado:false,
  iniciar(){
    if(typeof Club === 'undefined' || typeof Club.proyecto !== 'function') return;
    const original = Club.proyecto;
    Club.proyecto = function(){
      original.apply(this,arguments);
      if(!this.alumno || !this.lec || this.alumno.nivel !== 'mayores') return;
      const caja = document.getElementById('club-box');
      if(!caja) return;
      const zona = document.createElement('section');
      zona.className = 'club-panel';
      zona.style.marginTop = '16px';
      zona.innerHTML = '<h2>🤖 Mentor de programación</h2><p>Preguntá por tu HTML, CSS o JavaScript. Te dará pistas para que encuentres la solución.</p><button class="club-primary" type="button" onclick="Mentor.abrir()">Preguntar al mentor</button>';
      caja.appendChild(zona);
    };
  },
  abrir(){
    if(!Club.alumno || !Club.lec) return;
    if(this.leccion !== Club.lec.id){ this.mensajes=[]; this.leccion=Club.lec.id; }
    let panel = document.getElementById('mentor-panel');
    if(!panel){
      panel = document.createElement('div'); panel.id='mentor-panel';
      panel.style.cssText='position:fixed;inset:0;z-index:100;background:#F9F8F7;color:#2C2C2B;overflow:auto;padding:16px';
      panel.innerHTML = '<div style="max-width:760px;margin:auto"><div style="display:flex;justify-content:space-between;gap:12px;align-items:center"><h1>Mentor de programación</h1><button class="btn sec" type="button" onclick="Mentor.cerrar()">Volver</button></div><p class="note">La IA te orienta; vos construís y probás tu trabajo. No escribas nombres, teléfonos, correos ni otros datos personales.</p><div id="mentor-historial" role="log" aria-live="polite" style="background:#fff;border:1px solid #ddd;border-radius:12px;padding:16px;min-height:180px;margin:16px 0"></div><form id="mentor-form"><label for="mentor-pregunta">¿En qué paso necesitás ayuda?</label><textarea id="mentor-pregunta" maxlength="1200" rows="3" required placeholder="Por ejemplo: hice un botón, pero no sé dónde colocar su código"></textarea><label for="mentor-codigo">Fragmento de código (opcional, máximo 3000 caracteres)</label><textarea id="mentor-codigo" maxlength="3000" rows="6" spellcheck="false" placeholder="Pegá solo la parte en la que estás trabajando"></textarea><button class="btn" id="mentor-enviar" type="submit">Enviar pregunta</button><div id="mentor-estado" class="note" role="status"></div></form></div>';
      document.body.appendChild(panel);
      panel.querySelector('#mentor-form').onsubmit=e=>{e.preventDefault();Mentor.enviar();};
    }
    this.render();
    panel.querySelector('#mentor-pregunta').focus();
  },
  cerrar(){const p=document.getElementById('mentor-panel');if(p)p.remove();},
  render(){
    const lista=document.getElementById('mentor-historial'); if(!lista)return;
    lista.replaceChildren();
    if(!this.mensajes.length){const p=document.createElement('p');p.textContent='Contame qué querés hacer y qué intentaste. Vamos paso a paso.';lista.appendChild(p);}
    for(const m of this.mensajes){
      const p=document.createElement('p'); p.style.cssText='white-space:pre-wrap;padding:10px;border-radius:9px;background:'+(m.rol==='alumno'?'#E5F2FC':'#E8F1EC');
      const b=document.createElement('b');b.textContent=m.rol==='alumno'?'Vos: ':'Mentor: ';
      p.append(b,document.createTextNode(m.texto));lista.appendChild(p);
    }
    lista.scrollTop=lista.scrollHeight;
  },
  async enviar(){
    if(this.ocupado || !Club.alumno || !Club.lec)return;
    const q=document.getElementById('mentor-pregunta'), c=document.getElementById('mentor-codigo');
    const pregunta=q.value.trim(), codigo=c.value.trim();
    if(!pregunta)return;
    const cod=Club.alumno.codigo||Club.alumno.cod;
    const estado=document.getElementById('mentor-estado'), boton=document.getElementById('mentor-enviar');
    if(!cod){estado.textContent='Volvé a entrar al Club para validar tu código.';return;}
    this.ocupado=true;boton.disabled=true;estado.textContent='Pensando una pista…';
    const anteriores=this.mensajes.slice(-6).map(m=>({role:m.rol==='alumno'?'user':'assistant',content:m.texto}));
    try{
      const r=await fetch(SUPABASE_URL+'/functions/v1/mentor-krueka',{
        method:'POST',headers:{'Content-Type':'application/json','apikey':SUPABASE_KEY},
        body:JSON.stringify({codigo:cod,device:deviceId(),leccion:Club.lec.id,titulo:Club.lec.titulo,pregunta,codigo_fuente:codigo,historial:anteriores})
      });
      const data=await r.json();
      if(!r.ok)throw new Error(data.error||'El mentor no está disponible ahora.');
      this.mensajes.push({rol:'alumno',texto:pregunta},{rol:'mentor',texto:String(data.pista||'')});
      q.value='';this.render();estado.textContent='Probá la pista en tu proyecto y contame qué ocurrió.';
    }catch(e){estado.textContent=e.message||'No se pudo conectar con el mentor.';}
    finally{this.ocupado=false;boton.disabled=false;}
  }
};
Mentor.iniciar();
