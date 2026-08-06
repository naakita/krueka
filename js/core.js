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
    const { data, error } = await db.auth.signInWithPassword({ email:$("email").value.trim(), password:$("pass").value });
    if(error){ err.textContent = "Correo o contraseña incorrectos."; err.classList.remove("hidden"); return; }
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
  /* Mismo orden para todos los roles: primero el día a día, después la organización y al final los informes */
  menus(){
    const r = St.perfil.role;
    if(r==="docente") return [["clase","Clase de hoy"],["planificacion","Planificación"],["alumnos","Mis alumnos"],["entregas","Entregas"],["vigilancia","Centinela"],["conducta","Registro anecdótico"],["taller","Taller"],["miscursos","Mis cursos"]];
    if(r==="director") return [["control","Control docente"],["planes","Planificaciones"],["resumen","Resumen de alumnos"]];
    if(r==="admin")   return [["control","Control docente"],["estructura","Cursos y materias"],["usuarios","Usuarios y roles"]];
    return [["control","Panel"]];
  },
  construirNav(){
    const m = UI.menus();
    const nav = $("nav");
    nav.setAttribute("role", "tablist");
    nav.setAttribute("aria-label", "Secciones de la plataforma");
    nav.innerHTML = m.map(([k,t])=>`<button data-k="${k}" role="tab" aria-selected="false" title="${t}" onclick="UI.ir('${k}')">${t}</button>`).join("");
    UI.ir(m[0][0]);
  },
  ir(k){
    St.tab = k;
    document.querySelectorAll("#nav button").forEach(b=>b.setAttribute("aria-selected", b.dataset.k===k));
    $("view").innerHTML = '<div class="spinner">Cargando…</div>';
    const vistas = { clase:Docente.vClase, planificacion:Docente.vPlanificacion, alumnos:Docente.vAlumnos, miscursos:Docente.vMisCursos,
       entregas:Docente.vEntregas, conducta:Docente.vConducta, taller:Docente.vTaller, vigilancia:Docente.vVigilancia,
       control:Direccion.vControl, resumen:Direccion.vAlumnos, planes:Direccion.vPlanes,
       usuarios:Admin.vUsuarios, estructura:Admin.vEstructura };
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
