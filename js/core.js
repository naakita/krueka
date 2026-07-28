const LOGO = "logo.svg";
document.querySelectorAll("img.marca").forEach(i => i.src = LOGO);
document.getElementById("favicon").href = LOGO;

const SUPABASE_URL = "https://janebfpnknapvntfqolf.supabase.co";
const SUPABASE_KEY = "sb_publishable_mSuSFqWycvm9dQQzjpeaRA_kAyZOJl0";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const ETAPAS = [
  {k:"tema",     t:"Tema y capacidad",       d:"El alumno ve de qué trata la clase"},
  {k:"actividad",t:"Actividad práctica",     d:"Se muestran los pasos, la guía y las herramientas"},
  {k:"entrega",  t:"Entrega del trabajo",    d:"El alumno puede enviar su trabajo"},
  {k:"resultado",t:"Resultados y devolución",d:"El alumno ve su nota y el comentario"}
];

const esc = s => String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const $ = id => document.getElementById(id);
const hoy = () => new Date().toISOString().slice(0,10);
function aviso(msg, tipo){ const v=$("view"); const d=document.createElement("div"); d.className="alert "+(tipo||"ok"); d.textContent=msg; v.prepend(d); setTimeout(()=>d.remove(), 4000); }

/* estado global */
const St = { user:null, perfil:null, asignaciones:[], csActual:null, planes:[], sesion:null, alumnos:[], asis:{}, tab:null };

/* ==================== AUTENTICACIÓN ==================== */
const Auth = {
  async entrar(e){
    e.preventDefault();
    const err = $("err-doc"); err.classList.add("hidden");
    const { data, error } = await db.auth.signInWithPassword({ email:$("email").value.trim(), password:$("pass").value });
    if(error){ err.textContent = "Correo o contraseña incorrectos."; err.classList.remove("hidden"); return; }
    St.user = data.user;
    await Auth.cargarPerfil();
  },
  async cargarPerfil(){
    const { data:perfil } = await db.from("profiles").select("*").eq("id", St.user.id).single();
    if(!perfil){ alert("Tu usuario no tiene perfil asignado. Avisá al administrador."); return; }
    St.perfil = perfil;
    db.from("profiles").update({ ultimo_acceso:new Date().toISOString() }).eq("id", St.user.id).then(()=>{});
    $("screen-login").classList.add("hidden");
    $("screen-app").classList.remove("hidden");
    const rol = {admin:"Administrador", director:"Dirección", docente:"Docente", alumno:"Alumno"}[perfil.role];
    $("who").textContent = perfil.nombre + " · " + rol;
    UI.construirNav();
  },
  async salir(){ await db.auth.signOut(); location.reload(); }
};

/* ==================== NAVEGACIÓN ==================== */
const UI = {
  loginTab(w){
    $("tab-doc").setAttribute("aria-selected", w==="doc");
    $("tab-alu").setAttribute("aria-selected", w==="alu");
    $("form-doc").classList.toggle("hidden", w!=="doc");
    $("form-alu").classList.toggle("hidden", w!=="alu");
  },
  menus(){
    const r = St.perfil.role;
    if(r==="docente") return [["clase","Clase de hoy"],["planificacion","Planificación"],["alumnos","Alumnos"],["vigilancia","Centinela"],["entregas","Entregas"],["conducta","Registro anecdótico"],["taller","Taller"],["miscursos","Mis cursos"]];
    if(r==="director") return [["control","Control docente"],["resumen","Alumnos"],["planes","Planificaciones"]];
    if(r==="admin")   return [["control","Control docente"],["usuarios","Usuarios y roles"],["estructura","Cursos y materias"]];
    return [["control","Panel"]];
  },
  construirNav(){
    const m = UI.menus();
    $("nav").innerHTML = m.map(([k,t])=>`<button data-k="${k}" onclick="UI.ir('${k}')">${t}</button>`).join("");
    UI.ir(m[0][0]);
  },
  ir(k){
    St.tab = k;
    document.querySelectorAll("#nav button").forEach(b=>b.setAttribute("aria-selected", b.dataset.k===k));
    $("view").innerHTML = '<div class="spinner">Cargando…</div>';
    ({ clase:Docente.vClase, planificacion:Docente.vPlanificacion, alumnos:Docente.vAlumnos, miscursos:Docente.vMisCursos,
       entregas:Docente.vEntregas, conducta:Docente.vConducta, taller:Docente.vTaller, vigilancia:Docente.vVigilancia,
       control:Direccion.vControl, resumen:Direccion.vAlumnos, planes:Direccion.vPlanes,
       usuarios:Admin.vUsuarios, estructura:Admin.vEstructura })[k]();
  }
};

/* ==================== DATOS COMPARTIDOS ==================== */
async function cargarAsignaciones(){
  let q = db.from("course_subjects").select("id, horas_semanales, teacher_id, courses(id,nombre), subjects(id,nombre)");
  if(St.perfil.role === "docente") q = q.eq("teacher_id", St.perfil.id);
  const { data } = await q;
  St.asignaciones = data || [];
  if(!St.csActual && St.asignaciones.length) St.csActual = St.asignaciones[0].id;
  return St.asignaciones;
}
function selectorCurso(onchange){
  return `<label>Curso y materia</label><select onchange="${onchange}">` +
    St.asignaciones.map(a=>`<option value="${a.id}" ${a.id===St.csActual?"selected":""}>${esc(a.courses.nombre)} · ${esc(a.subjects.nombre)}</option>`).join("") +
    `</select>`;
}
async function cargarAlumnos(courseId){
  const { data } = await db.from("enrollments").select("id, numero_lista, students(id,nombre)").eq("course_id", courseId).eq("activo", true);
  St.alumnos = (data||[]).map(e=>({ id:e.students.id, nombre:e.students.nombre })).sort((a,b)=>a.nombre.localeCompare(b.nombre));
  return St.alumnos;
}
function asignacionActual(){ return St.asignaciones.find(a=>a.id===St.csActual); }

/* ==================== CENTINELA: vigilancia de pantalla ==================== */
function deviceId(){
  let d = localStorage.getItem("krueka_device");
  if(!d){ d = "pc-" + Math.random().toString(36).slice(2,8).toUpperCase(); localStorage.setItem("krueka_device", d); }
  return d;
}

const Centinela = {
  on:false, codigo:"", alumno:null, salida:null, ultimaAct:Date.now(),
  iniciar(codigo, alumnoId){
    if(Centinela.on) return;
    Centinela.on = true; Centinela.codigo = codigo; Centinela.alumno = alumnoId;
    document.addEventListener("visibilitychange", ()=>{
      if(document.hidden) Centinela.salio("minimiz\u00f3 la ventana o cambi\u00f3 de pesta\u00f1a");
      else Centinela.volvio();
    });
    window.addEventListener("blur",  ()=>Centinela.salio("abri\u00f3 otro programa o ventana"));
    window.addEventListener("focus", ()=>Centinela.volvio());
    window.addEventListener("beforeunload", ()=>Centinela.enviar("cerro","cerr\u00f3 la p\u00e1gina antes de terminar", null, true));
    document.addEventListener("paste", ()=>Centinela.enviar("pego_texto","peg\u00f3 texto copiado de otro lado"));
    ["click","keydown","mousemove","touchstart"].forEach(ev=>
      document.addEventListener(ev, ()=>{ Centinela.ultimaAct = Date.now(); }, {passive:true}));
    setInterval(Centinela.control, 30000);
  },
  salio(detalle){
    if(!Centinela.on || Centinela.salida) return;
    Centinela.salida = Date.now();
    Centinela.enviar("salio", detalle);
  },
  volvio(){
    if(!Centinela.on || !Centinela.salida) return;
    const seg = Math.round((Date.now() - Centinela.salida)/1000);
    Centinela.salida = null;
    Centinela.enviar("volvio", "volvi\u00f3 a la actividad", seg);
    if(seg > 20) Centinela.cartel("Estuviste " + seg + " segundos fuera de la actividad. El profesor lo ve en su panel.");
  },
  control(){
    if(!Centinela.on || Centinela.salida) return;
    if(Date.now() - Centinela.ultimaAct > 300000){
      Centinela.ultimaAct = Date.now();
      Centinela.enviar("inactivo", "5 minutos sin trabajar en la pantalla");
    }
  },
  cartel(msg){
    let d = $("cent-cartel");
    if(!d){
      d = document.createElement("div"); d.id = "cent-cartel";
      d.style.cssText = "position:fixed;left:16px;right:16px;bottom:16px;z-index:99;max-width:520px;margin:auto;" +
        "background:var(--nar-b,#FBEBDE);color:#7a4517;border:1px solid #D5803B;border-radius:12px;padding:12px 14px;font-size:14px";
      document.body.appendChild(d);
    }
    d.textContent = msg;
    clearTimeout(Centinela._t);
    Centinela._t = setTimeout(()=>{ d.remove(); }, 6000);
  },
  enviar(tipo, detalle, seg, urgente){
    if(!Centinela.on || !Centinela.alumno) return;
    const body = { p_codigo:Centinela.codigo, p_student_id:Centinela.alumno, p_tipo:tipo,
                   p_detalle:detalle||null, p_segundos:seg==null?null:seg };
    if(urgente){
      try{
        fetch(SUPABASE_URL + "/rest/v1/rpc/registrar_evento_foco", {
          method:"POST", keepalive:true,
          headers:{ "Content-Type":"application/json", apikey:SUPABASE_KEY, Authorization:"Bearer "+SUPABASE_KEY },
          body:JSON.stringify(body)
        });
      }catch(e){}
      return;
    }
    db.rpc("registrar_evento_foco", body).then(()=>{});
  }
};
