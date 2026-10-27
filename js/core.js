const LOGO = (window.KRUEKA_BASE || "") + "logo.svg";
document.querySelectorAll("img.marca").forEach(i => i.src = LOGO);
const _favicon = document.getElementById("favicon");
if(_favicon) _favicon.href = LOGO;

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

/* Marca de la institucion (nombre y logo) */
const Marca = {
  data:null,
  async cargar(instId){
    try{
      const { data } = await db.rpc("marca_institucion", instId ? { p_inst: instId } : {});
      Marca.data = data || null;
      if(Marca.data && Marca.data.logo){
        document.querySelectorAll("img.logo-inst").forEach(el=>{
          el.src = Marca.data.logo;
          el.alt = Marca.data.nombre || "Escuela";
          el.classList.remove("hidden");
        });
      }
    }catch(e){}
  }
};

/* ==================== AUTENTICACIÓN ==================== */
const Auth = {
  async entrar(e){
    e.preventDefault();
    const err = $("err-doc"); err.classList.add("hidden");
    const captchaToken = (window.Captcha && Captcha.token()) || undefined;
    const { data, error } = await db.auth.signInWithPassword({
      email:$("email").value.trim(),
      password:$("pass").value,
      options: { captchaToken }
    });
    if(error){
      if(window.Captcha) Captcha.reiniciar();
      const m = String(error.message || "");
      err.textContent = /captcha/i.test(m)
        ? "No pudimos verificar que seas una persona. Esperá unos segundos y volvé a intentar."
        : "Correo o contraseña incorrectos.";
      err.classList.remove("hidden");
      return;
    }
    St.user = data.user;
    await Auth.cargarPerfil();
  },
  async cargarPerfil(){
    const { data:perfil } = await db.from("profiles").select("*").eq("id", St.user.id).single();
    if(!perfil){ alert("Tu usuario no tiene perfil asignado. Avisá al administrador."); return; }
    St.perfil = perfil;
    Marca.cargar(perfil.institution_id);
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
  /* Un mismo orden para todos los roles: primero el día a día, después la organización y al final los informes */
  menus(){
    const r = St.perfil.role;
    if(r==="docente") return [["clase","Clase de hoy"],["planificacion","Planificación"],["alumnos","Mis alumnos"],["entregas","Entregas"],["vigilancia","Centinela"],["aula","Control de PCs"],["conducta","Registro anecdótico"],["taller","Taller"],["miscursos","Mis cursos"]];
    if(r==="director") return [["control","Control docente"],["planes","Planificaciones"],["resumen","Resumen de alumnos"],["aula","Control de PCs"]];
    if(r==="admin")   return [["control","Control docente"],["clase","Clase de hoy"],["planificacion","Planificación y actividades"],["entregas","Entregas"],["estructura","Cursos y materias"],["usuarios","Usuarios y roles"],["gestalumnos","Gestion de alumnos"],["aula","Control de PCs"]];
    return [["control","Panel"]];
  },
  /* Mantener todos los accesos por rol, pero mostrar sólo las secciones frecuentes.
     Los módulos de otros equipos agregan pestañas a UI.menus(); no se pierde ninguna. */
  construirNav(){
    const m = UI.menus().filter(([k])=>/^[a-z0-9-]+$/.test(k));
    const rol = St.perfil?.role;
    const preferidos = rol==="admin"
      ? ["control","asistencia-grado","clase","entregas","aula"]
      : rol==="director"
      ? ["control","asistencia-grado","planes","aula"]
      : rol==="docente"
      ? ["clase","planificacion","alumnos","entregas","aula"]
      : ["control"];
    const principales = preferidos.filter(k=>m.some(([id])=>id===k)).slice(0,5);
    if(!principales.length&&m.length)principales.push(m[0][0]);
    const restantes=m.filter(([k])=>!principales.includes(k));
    const grupos=[
      ["Docencia y actividades",["planificacion","planeamiento","planilla","tareas","capacidades","taller","miscursos","clase","entregas","asistencia-grado"]],
      ["Gestión escolar",["usuarios","gestalumnos","alumnos","estructura","control","resumen","planes","planeamientos","conducta"]],
      ["Seguimiento e informes",["panel","auditoria","vigilancia","decisions","aula"]],
      ["Club de Informática",["club","audclub","club-alumnos","club-finanzas"]]
    ];
    const asignados=new Set();
    const categorias=grupos.map(([nombre,keys])=>{
      const items=restantes.filter(([k])=>keys.includes(k));
      items.forEach(([k])=>asignados.add(k));
      return {nombre,items};
    }).filter(g=>g.items.length);
    const otros=restantes.filter(([k])=>!asignados.has(k));
    if(otros.length)categorias.push({nombre:"Otras herramientas",items:otros});
    const boton=([k,t])=>`<button type="button" data-k="${k}" role="tab" aria-selected="false" title="${esc(t)}" onclick="UI.ir('${k}')">${esc(t)}</button>`;
    const nav=$("nav");
    nav.setAttribute("role","navigation");
    nav.setAttribute("aria-label","Secciones de la plataforma");
    nav.innerHTML='<div class="nav-main" role="tablist" aria-label="Secciones principales">'+
      m.filter(([k])=>principales.includes(k)).sort((a,b)=>principales.indexOf(a[0])-principales.indexOf(b[0])).map(boton).join("")+
      '</div>'+
      (restantes.length?'<details class="nav-more" id="nav-more">'+
        '<summary aria-label="Mostrar otras secciones">☰ Más opciones <span class="more-count">('+restantes.length+')</span></summary>'+
        '<div class="nav-more-panel">'+categorias.map(g=>'<section class="nav-group"><h3>'+esc(g.nombre)+'</h3>'+
        g.items.map(boton).join("")+'</section>').join("")+'</div></details>':'');
    if(!UI._navCompactListeners){
      UI._navCompactListeners=true;
      document.addEventListener("click",e=>{
        const more=$("nav-more");
        if(more?.open&&(!more.contains(e.target)||e.target.closest("button[data-k]")))more.open=false;
        const recursos=document.querySelector("#screen-app .app-resources");
        if(recursos?.open&&(!recursos.contains(e.target)||e.target.closest(".app-resources-menu a")))recursos.open=false;
      });
      document.addEventListener("keydown",e=>{
        if(e.key!=="Escape")return;
        for(const sel of ["#nav-more","#screen-app .app-resources"]){
          const details=document.querySelector(sel);
          if(details?.open){details.open=false;details.querySelector("summary")?.focus();}
        }
      });
    }
    if(m.length)UI.ir(m[0][0]);
  },
  ir(k){
    St.tab = k;
    document.querySelectorAll("#nav button").forEach(b=>b.setAttribute("aria-selected", b.dataset.k===k));
    $("view").innerHTML = '<div class="spinner">Cargando…</div>';
    const vistas = { clase:Docente.vClase, planificacion:Docente.vPlanificacion, alumnos:Docente.vAlumnos, miscursos:Docente.vMisCursos,
       entregas:Docente.vEntregas, conducta:Docente.vConducta, taller:Docente.vTaller, vigilancia:Docente.vVigilancia, aula:AulaControl.vista,
       control:Direccion.vControl, resumen:Direccion.vAlumnos, planes:Direccion.vPlanes,
       usuarios:Admin.vUsuarios, estructura:Admin.vEstructura,
       gestalumnos: (window.Alumnos && Alumnos.vGestion) };
    const vista = vistas[k];
    if(typeof vista !== "function"){
      $("view").innerHTML = '<div class="alert err">Esta sección no está disponible para tu rol.</div>';
      return;
    }
    vista();
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
