/* Titanteo Decisions: primer piloto con clasificacion basada en reglas. */
const DecisionEngine = {
  terms: {
    comercio: {
      facturacion:["factura","facturacion","cobro","cobraron","cobrado","pago","pagado","tarjeta","recibo","transferencia","reembolso","devolucion","duplicado","dos veces","saldo"],
      soporte:["error","falla","problema tecnico","no funciona","no abre","no puedo ingresar","no carga","contrasena","acceso","sistema","internet","conexion","bloqueado"],
      ventas:["compra","comprar","precio","cotizacion","presupuesto","pedido","oferta","descuento","stock","entrega","envio","producto","cajas","unidades"],
      legal:["contrato","demanda","abogado","judicial","reclamo legal","clausula","denuncia"],
      administracion:["proveedor","documentacion","certificado","tramite","autorizacion","permiso","reunion","informe"]
    },
    educacion: {
      academico:["calificacion","nota","examen","evaluacion","materia","clase","tarea","alumno","aprendizaje","docente","profesor","planificacion","indicador"],
      administracion:["inscripcion","matricula","constancia","certificado","cuota","recibo","pago","legajo","horario","asistencia","ausencia","permiso","secretaria"],
      soporte:["computadora","error","no funciona","no ingresa","no puedo ingresar","contrasena","plataforma","conexion","internet","pantalla"],
      legal:["denuncia","abogado","demanda","reclamo legal","contrato","judicial"]
    }
  },
  clean(s) {
    return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim().replace(/\s+/g," ");
  },
  run(message, context) {
    const text=" "+this.clean(message)+" ";
    const groups=this.terms[context] || this.terms.comercio;
    const scores=Object.keys(groups).map(id=>{
      const hits=groups[id].filter(t=>text.includes(" "+this.clean(t)+" "));
      return {id:id,hits:hits,score:hits.reduce((n,t)=>n+(t.includes(" ")?3:2),0)};
    }).sort((a,b)=>b.score-a.score);
    const top=scores[0], second=scores[1];
    const uncertain=!top.score || (second && second.score===top.score);
    const category=uncertain?"revision":top.id;
    const includesAny=words=>words.some(s=>text.includes(" "+this.clean(s)+" "));
    const priority=includesAny(["urgente","inmediato","emergencia","riesgo","demanda","dos veces","cobro duplicado"])?"alta":
      includesAny(["hoy","manana","vencimiento","retraso","demora","sin respuesta"])?"media":"normal";
    const evidence=uncertain?[]:top.hits.slice(0,6);
    const rule_score=uncertain?0:Math.min(95,50+top.score*5+(top.score-(second?second.score:0))*3);
    const explanation=uncertain?"Se necesita una persona para decidir el área.":"Sugerencia basada en términos reconocidos: "+evidence.join(", ")+".";
    return {category:category,priority:priority,evidence:evidence,rule_score:rule_score,explanation:explanation};
  }
};
const Decisions = {
  categories:{ventas:"Ventas",soporte:"Soporte técnico",facturacion:"Facturación",legal:"Legal",academico:"Académico",administracion:"Administración",revision:"Revisión manual"},
  draft:null, rows:[],
  allowed(){return !!(St.user && St.perfil && St.perfil.institution_id && ["docente","director","admin"].includes(St.perfil.role));},
  alert(msg,bad){
    const el=$("td-alert");
    if(!el)return;
    el.className="alert "+(bad?"err":"ok");
    el.textContent=msg;
    el.classList.remove("hidden");
  },
  async vista(){
    if(!this.allowed()){
      $("view").innerHTML='<div class="alert err">Solo disponible para personal institucional autorizado.</div>';
      return;
    }
    this.draft=null;
    $("view").innerHTML=
      '<h1>Titanteo Decisions <span class="tag blue">Piloto</span></h1>'+
      '<p class="sub">Clasificación por reglas, sin tokens ni costos de IA. Las sugerencias no ejecutan acciones y requieren revisión humana. El puntaje de reglas no es una probabilidad.</p>'+
      '<div class="grid2"><div class="card"><h2>Analizar un mensaje</h2>'+
      '<label for="td-context">Proceso</label><select id="td-context"><option value="comercio">Pedidos y atención comercial</option><option value="educacion">Gestión educativa</option></select>'+
      '<label for="td-message">Mensaje (para el piloto, sin datos personales)</label><textarea id="td-message" maxlength="1600" style="min-height:130px"></textarea>'+
      '<div class="row" style="margin-top:10px"><button class="btn" id="td-analyze">Analizar</button><button class="btn sec" id="td-demo">Ver ejemplo</button></div>'+
      '<div id="td-preview" style="margin-top:12px"></div><div id="td-alert" class="alert info hidden" role="status"></div></div>'+
      '<div class="card"><h2>Importar CSV</h2><p class="sub">Hasta 25 mensajes por archivo. Columna obligatoria: mensaje. Columna opcional: contexto (comercio o educacion). Separador coma o punto y coma.</p>'+
      '<input id="td-csv" type="file" accept=".csv,text/csv" aria-label="Archivo CSV"><div style="height:10px"></div>'+
      '<button class="btn sec" id="td-import">Importar y clasificar</button><div class="hr"></div>'+
      '<p class="note">No se modifican notas, asistencias ni registros de alumnos. No envíes datos sensibles en esta fase experimental.</p></div></div>'+
      '<div class="card"><div class="row" style="align-items:center;justify-content:space-between"><h2>Historial y revisión</h2><button class="btn sec sm" id="td-refresh">Actualizar</button></div>'+
      '<p class="note">Se muestran hasta 50 resultados según los permisos de tu institución.</p><div id="td-list">Cargando…</div></div>';
    $("td-analyze").addEventListener("click",()=>this.analyze());
    $("td-demo").addEventListener("click",()=>this.example());
    $("td-import").addEventListener("click",()=>this.importCSV());
    $("td-refresh").addEventListener("click",()=>this.refresh());
    await this.refresh();
  },
  example(){
    $("td-context").value="comercio";
    $("td-message").value="Urgente: me cobraron dos veces el pago y necesito corregir la factura.";
    this.analyze();
  },
  analyze(){
    const message=$("td-message").value.trim();
    const context=$("td-context").value;
    if(message.length<3){this.alert("Escribí al menos tres caracteres.",true);return;}
    const result=DecisionEngine.run(message,context);
    this.draft={message:message,context:context,result:result};
    const v=$("td-preview");
    v.textContent="";
    const card=document.createElement("div");card.className="stage on";card.style.display="block";
    const heading=document.createElement("strong");
    heading.textContent="Área sugerida: "+this.categories[result.category];
    const detail=document.createElement("p");
    detail.textContent="Prioridad: "+result.priority+" · Puntaje de reglas: "+result.rule_score+"/100 (no mide precisión)";
    const explanation=document.createElement("p");explanation.textContent=result.explanation;
    const btn=document.createElement("button");btn.className="btn ok sm";btn.textContent="Guardar propuesta para revisión";
    btn.addEventListener("click",()=>this.save());
    card.append(heading,detail,explanation,btn);v.append(card);
    $("td-alert").classList.add("hidden");
  },
  async save(){
    if(!this.allowed() || !this.draft)return;
    const d=this.draft;
    if(d.message!==$("td-message").value.trim() || d.context!==$("td-context").value){
      this.alert("Volvé a analizar el texto actual antes de guardarlo.",true);return;
    }
    const r=d.result;
    const {error}=await db.from("titanteo_decisions").insert({
      institution_id:St.perfil.institution_id,created_by:St.user.id,
      context:d.context,message:d.message,category:r.category,priority:r.priority,
      explanation:r.explanation,rule_score:r.rule_score,evidence:r.evidence,
      engine_version:"rules-v1",origin:"manual"
    });
    if(error){this.alert("No se pudo guardar: "+error.message,true);return;}
    this.draft=null;
    $("td-message").value="";
    $("td-preview").textContent="";
    this.alert("Guardado para revisión.",false);
    await this.refresh();
  },
  parseCSV(raw){
    const rows=[];let row=[],field="",quoted=false;
    const sep=(raw.split(/\r?\n/)[0]||"").includes(";")?";":",";
    for(let i=0;i<raw.length;i++){
      const c=raw[i];
      if(c==='"' && quoted && raw[i+1]==='"'){field+='"';i++;continue;}
      if(c==='"'){quoted=!quoted;continue;}
      if(!quoted && c===sep){row.push(field);field="";continue;}
      if(!quoted && (c==="\n" || c==="\r")){
        if(c==="\r"&&raw[i+1]==="\n")i++;
        row.push(field);if(row.some(x=>x.trim()))rows.push(row);
        row=[];field="";continue;
      }
      field+=c;
    }
    if(quoted)throw new Error("Comillas sin cerrar.");
    row.push(field);if(row.some(x=>x.trim()))rows.push(row);
    return rows;
  },
  async importCSV(){
    if(!this.allowed())return;
    const file=$("td-csv").files[0];
    if(!file){this.alert("Elegí un CSV.",true);return;}
    if(file.size>150000){this.alert("El archivo es demasiado grande (máximo 150 KB).",true);return;}
    try{
      const lines=this.parseCSV((await file.text()).replace(/^\uFEFF/,""));
      const headers=(lines.shift()||[]).map(h=>DecisionEngine.clean(h));
      const ix=headers.indexOf("mensaje"),cx=headers.indexOf("contexto");
      if(ix<0)throw Error("Debe existir una columna mensaje.");
      if(lines.length<1||lines.length>25)throw Error("Permitimos de 1 a 25 registros por archivo.");
      const records=lines.map((row,i)=>{
        const message=String(row[ix]||"").trim();
        const context=cx<0?"comercio":DecisionEngine.clean(row[cx]||"comercio");
        if(message.length<3||message.length>1600||!["comercio","educacion"].includes(context))
          throw Error("Datos incorrectos en la fila "+(i+2)+".");
        const r=DecisionEngine.run(message,context);
        return {institution_id:St.perfil.institution_id,created_by:St.user.id,
          context:context,message:message,category:r.category,priority:r.priority,
          explanation:r.explanation,rule_score:r.rule_score,evidence:r.evidence,
          origin:"csv",engine_version:"rules-v1"};
      });
      if(!confirm("¿Guardar "+records.length+" mensajes? No se envían a IA externa."))return;
      const {error}=await db.from("titanteo_decisions").insert(records);
      if(error)throw error;
      $("td-csv").value="";
      this.alert("CSV importado: "+records.length+" propuestas.",false);
      await this.refresh();
    }catch(e){this.alert("No se importó el CSV: "+e.message,true);}
  },
  async refresh(){
    if(!this.allowed())return;
    const box=$("td-list");if(!box)return;
    const result=await db.from("titanteo_decisions")
      .select("id,context,message,category,priority,explanation,rule_score,created_at,origin")
      .order("created_at",{ascending:false}).limit(50);
    if(result.error){box.textContent="No se pudo leer el historial: "+result.error.message;return;}
    const rows=result.data||[];this.rows=rows;
    if(!rows.length){box.textContent="Aún no hay análisis guardados.";return;}
    const response=await db.from("titanteo_decision_reviews")
      .select("decision_id,verdict,correction_category,created_at")
      .in("decision_id",rows.map(r=>r.id)).order("created_at",{ascending:false});
    if(response.error){box.textContent="No se pudieron leer las revisiones: "+response.error.message;return;}
    const latest={};
    (response.data||[]).forEach(r=>{if(!latest[r.decision_id])latest[r.decision_id]=r;});
    box.textContent="";
    const table=document.createElement("table");
    const head=document.createElement("thead");
    const hr=document.createElement("tr");
    ["Fecha","Mensaje","Sugerencia","Revisión humana"].forEach(name=>{
      const th=document.createElement("th");th.textContent=name;hr.append(th);
    });head.append(hr);table.append(head);
    const tbody=document.createElement("tbody");
    rows.forEach(item=>{
      const tr=document.createElement("tr");
      const td1=document.createElement("td");
      td1.textContent=new Date(item.created_at).toLocaleString("es-PY")+" · "+item.origin;
      const td2=document.createElement("td");td2.textContent=item.message;td2.style.overflowWrap="anywhere";
      const td3=document.createElement("td");
      td3.textContent=(this.categories[item.category]||item.category)+" · "+item.priority+" · "+item.rule_score+"/100. "+item.explanation;
      const td4=document.createElement("td");
      const latestReview=latest[item.id];
      const status=document.createElement("p");
      status.textContent=latestReview?(latestReview.verdict==="confirmado"?"Confirmado":"Corregido: "+(this.categories[latestReview.correction_category]||"Revisión")):"Pendiente";
      const select=document.createElement("select");select.setAttribute("aria-label","Área correcta");
      Object.keys(this.categories).forEach(k=>{
        const option=document.createElement("option");option.value=k;option.textContent=this.categories[k];
        select.append(option);
      });
      const yes=document.createElement("button");yes.className="btn ok sm";yes.textContent="Confirmar";
      yes.addEventListener("click",()=>this.review(item.id,"confirmado",null));
      const no=document.createElement("button");no.className="btn sec sm";no.textContent="Corregir";
      no.addEventListener("click",()=>this.review(item.id,"corregir",select.value));
      td4.append(status,select,yes,document.createTextNode(" "),no);
      tr.append(td1,td2,td3,td4);tbody.append(tr);
    });
    table.append(tbody);
    const scroll=document.createElement("div");scroll.style.overflowX="auto";scroll.append(table);box.append(scroll);
  },
  async review(id,verdict,correction){
    if(!this.allowed()||!this.rows.some(r=>r.id===id))return;
    const {error}=await db.from("titanteo_decision_reviews").insert({
      decision_id:id,reviewer_id:St.user.id,verdict:verdict,correction_category:correction
    });
    if(error){this.alert("No se guardó la revisión: "+error.message,true);return;}
    this.alert("Revisión registrada.",false);await this.refresh();
  }
};
window.Decisions=Decisions;
(function(){
  if(typeof UI==="undefined")return;
  const previousMenus=UI.menus.bind(UI);
  const previousGo=UI.ir.bind(UI);
  UI.menus=function(){
    const list=previousMenus();
    if(St.perfil && ["docente","director","admin"].includes(St.perfil.role))
      list.push(["decisions","Decisiones (piloto)"]);
    return list;
  };
  UI.ir=function(key){
    if(key!=="decisions")return previousGo(key);
    St.tab=key;
    document.querySelectorAll("#nav button").forEach(btn=>btn.setAttribute("aria-selected",btn.dataset.k===key));
    $("view").innerHTML='<div class="spinner">Cargando…</div>';
    Decisions.vista();
  };
})();
