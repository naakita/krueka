/* Krueka: lista por grado/curso y fecha. Sin sesiones de materia. */
const AsistenciaGrado={
 curso:"",fecha:"",cursos:[],datos:null,pendientes:new Set(),
 hoy(){return new Date().toLocaleDateString("sv-SE",{timeZone:"America/Asuncion"});},
 async vista(){
  $("view").innerHTML='<div class="card"><div class="spinner">Cargando listas por grado…</div></div>';
  if(!this.fecha)this.fecha=this.hoy();
  const {data,error}=await db.rpc("asistencia_grado_cursos");
  if(error){$("view").innerHTML='<div class="alert err">'+esc(error.message)+'</div>';return;}
  this.cursos=data||[];
  if(!this.cursos.some(c=>c.id===this.curso))this.curso=this.cursos[0]?.id||"";
  if(!this.curso){$("view").innerHTML='<div class="card"><h2>Asistencia por grado</h2><p class="sub">No hay grados asignados a tu cuenta docente.</p></div>';return;}
  await this.cargar();
 },
 async cargar(){
  const {data,error}=await db.rpc("asistencia_grado_lista",{p_course:this.curso,p_fecha:this.fecha});
  if(error){$("view").innerHTML='<div class="alert err">'+esc(error.message)+'</div>';return;}
  this.datos=data||{alumnos:[]};
  this.datos.alumnos=this.datos.alumnos||[];
  this.pendientes.clear();this.pintar();
 },
 confirmar(){return !this.pendientes.size||confirm("Hay asistencias sin guardar. ¿Descartar esos cambios?");},
 async cursoElegido(id){if(!this.confirmar()){this.pintar();return;}this.curso=id;await this.cargar();},
 async fechaElegida(fecha){if(!this.confirmar()){this.pintar();return;}this.fecha=fecha;await this.cargar();},
 etiqueta(e){return {presente:"Presente",ausente:"Ausente",tarde:"Tarde",justificado:"Justificado"}[e]||"Sin registrar";},
 fechaEs(d){if(!/^\d{4}-\d{2}-\d{2}$/.test(d||""))return d||"—";return d.slice(8,10)+"/"+d.slice(5,7)+"/"+d.slice(0,4);},
 buscar(id){return (this.datos?.alumnos||[]).find(a=>a.id===id);},
 cambiarEstado(id,estado){const a=this.buscar(id);if(!a)return;a.estado=estado||null;this.pendientes.add(id);this.pintar();},
 cambiarNota(id,valor){const a=this.buscar(id);if(!a)return;a.observacion=valor;this.pendientes.add(id);
  const m=$("ag-mensaje");if(m)m.textContent="Hay cambios sin guardar.";},
 todos(){
  (this.datos?.alumnos||[]).forEach(a=>{if(!a.estado){a.estado="presente";this.pendientes.add(a.id);}});
  this.pintar();
 },
 conteos(){
  const l=this.datos?.alumnos||[];
  return {total:l.length,registrados:l.filter(a=>a.estado).length,
   presente:l.filter(a=>a.estado==="presente").length,
   ausente:l.filter(a=>a.estado==="ausente").length,
   tarde:l.filter(a=>a.estado==="tarde").length,
   justificado:l.filter(a=>a.estado==="justificado").length};
 },
 pintar(){
  const d=this.datos||{alumnos:[]},c=this.conteos(),l=d.alumnos;
  $("view").innerHTML=`
   <div class="card no-print">
    <h1>Asistencia por grado o curso</h1>
    <p class="sub">Seleccioná el grado y la fecha. Cada registro conserva el docente que lo realizó y la hora.</p>
    <div class="row" style="align-items:end">
     <div style="flex:2;min-width:170px"><label for="ag-curso">Grado o curso</label>
      <select id="ag-curso" onchange="AsistenciaGrado.cursoElegido(this.value)">
       ${this.cursos.map(x=>'<option value="'+esc(x.id)+'"'+(x.id===this.curso?' selected':'')+'>'+esc(x.nombre)+'</option>').join("")}
      </select></div>
     <div style="flex:1;min-width:150px"><label for="ag-fecha">Fecha</label>
      <input type="date" id="ag-fecha" value="${esc(this.fecha)}" max="${esc(this.hoy())}" onchange="AsistenciaGrado.fechaElegida(this.value)"></div>
    </div>
   </div>
   <div class="card" id="ag-hoja">
    <div class="row" style="justify-content:space-between;align-items:start">
     <div><h2>Planilla de asistencia</h2><p class="sub"><b>${esc(d.curso||"")}</b> · ${esc(this.fechaEs(d.fecha||this.fecha))}</p>
     <p class="note">Docente que consulta: ${esc(St.perfil?.nombre||"")}</p></div>
     <span class="tag blue">${c.registrados}/${c.total} registrados</span>
    </div>
    <div class="row no-print" style="gap:8px;margin:14px 0">
     <button class="btn sec sm" onclick="AsistenciaGrado.todos()">Marcar sin registrar como presentes</button>
     <button class="btn sm" id="ag-guardar" onclick="AsistenciaGrado.guardar()">Guardar asistencia</button>
     <button class="btn sec sm" onclick="AsistenciaGrado.exportar()">Descargar Excel (.xlsx)</button>
     <button class="btn sec sm" onclick="AsistenciaGrado.imprimir()">Imprimir lista</button>
    </div>
    <div class="row" style="gap:9px;margin-bottom:13px">
     <span class="tag green">Presentes: ${c.presente}</span>
     <span class="tag red">Ausentes: ${c.ausente}</span>
     <span class="tag orange">Tardes: ${c.tarde}</span>
     <span class="tag blue">Justificados: ${c.justificado}</span>
    </div>
    <div id="ag-mensaje" class="note no-print" role="status" aria-live="polite">${this.pendientes.size?'Hay cambios sin guardar.':''}</div>
    <div style="overflow-x:auto"><table id="ag-tabla">
     <thead><tr><th>N.º</th><th>Alumno</th><th>Asistencia</th><th>Observación</th><th>Registrado por / fecha</th></tr></thead>
     <tbody>${l.map((a,i)=>`<tr>
      <td>${a.numero||i+1}</td><td style="min-width:160px"><b>${esc(a.nombre)}</b></td>
      <td style="min-width:160px">
       <span class="solo-impresion">${esc(this.etiqueta(a.estado))}</span>
       <select class="no-print" aria-label="Estado de ${esc(a.nombre)}" onchange="AsistenciaGrado.cambiarEstado('${a.id}',this.value)">
        <option value="">Sin registrar</option>
        ${[["presente","Presente"],["ausente","Ausente"],["tarde","Tarde"],["justificado","Justificado"]].map(([v,t])=>
         '<option value="'+v+'"'+(a.estado===v?' selected':'')+'>'+t+'</option>').join("")}
       </select></td>
      <td style="min-width:180px"><span class="solo-impresion">${esc(a.observacion||"")}</span>
       <input class="no-print" maxlength="500" value="${esc(a.observacion||"")}" aria-label="Observación de ${esc(a.nombre)}" placeholder="Opcional" onchange="AsistenciaGrado.cambiarNota('${a.id}',this.value)"></td>
      <td class="note" style="min-width:190px">${esc(a.registrado_por||"Sin guardar")}
       ${a.registrado_at?'<div>'+esc(new Date(a.registrado_at).toLocaleString("es-PY",{dateStyle:"short",timeStyle:"short"}))+'</div>':""}</td>
     </tr>`).join("")||'<tr><td colspan="5">No hay alumnos activos en este grado.</td></tr>'}
     </tbody></table></div>
    <p class="note no-print">Podés volver a cualquier fecha para consultar los registros guardados. Los alumnos que ya salieron del grado conservan las asistencias de fechas anteriores.</p>
   </div>`;
  if(!$("ag-print-style")){
   const style=document.createElement("style");style.id="ag-print-style";
   style.textContent='@media screen{#ag-hoja .solo-impresion{display:none}}'+
   '@media print{@page{size:A4 landscape;margin:12mm}body *{visibility:hidden!important}'+
   '#view,#view *{visibility:visible!important}#view{position:absolute;top:0;left:0;width:100%;padding:0!important}'+
   '.no-print,#nav,.topbar{display:none!important}#ag-hoja{border:0;box-shadow:none}'+
   '#ag-hoja .solo-impresion{display:inline}#ag-hoja table{font-size:10pt}'+
   '#ag-hoja td,#ag-hoja th{border:1px solid #bbb;padding:6px}#ag-hoja tr{break-inside:avoid}}';
   document.head.appendChild(style);
  }
 },
 async guardar(){
  const changed=(this.datos?.alumnos||[]).filter(a=>this.pendientes.has(a.id));
  if(changed.some(a=>!a.estado)){alert("Seleccioná un estado para los alumnos modificados.");return;}
  if(!changed.length){aviso("No hay cambios para guardar.");return;}
  const b=$("ag-guardar");if(b)b.disabled=true;
  const {data,error}=await db.rpc("asistencia_grado_guardar",{p_course:this.curso,p_fecha:this.fecha,
   p_entries:changed.map(a=>({student_id:a.id,estado:a.estado,observacion:a.observacion||""}))});
  if(error){if(b)b.disabled=false;alert("Error al guardar: "+error.message);return;}
  await this.cargar();aviso((data?.guardados||changed.length)+" asistencias guardadas correctamente.");
 },
 estaGuardado(){if(this.pendientes.size){alert("Guardá los cambios antes de imprimir o descargar Excel.");return false;}return true;},
 imprimir(){if(this.estaGuardado())window.print();},
 exportar(){
  if(!this.estaGuardado())return;
  const d=this.datos||{},l=d.alumnos||[],c=this.conteos();
  const filas=[["PLANILLA DE ASISTENCIA POR GRADO"],["Grado o curso",d.curso||""],
   ["Fecha",this.fechaEs(d.fecha||this.fecha)],["Docente",St.perfil?.nombre||""],[],
   ["N.º","Alumno","Estado","Observación","Registrado por","Fecha y hora"]];
  l.forEach((a,i)=>filas.push([a.numero||i+1,a.nombre,this.etiqueta(a.estado),a.observacion||"",
   a.registrado_por||"",a.registrado_at?new Date(a.registrado_at).toLocaleString("es-PY"):""]));
  filas.push([],["Total",c.total],["Presentes",c.presente],["Ausentes",c.ausente],
   ["Tardes",c.tarde],["Justificados",c.justificado]);
  const bytes=this.xlsx(filas),url=URL.createObjectURL(new Blob([bytes],
   {type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}));
  const a=document.createElement("a");a.href=url;
  a.download="Asistencia_"+KG.slug(d.curso||"grado")+"_"+this.fecha+".xlsx";
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);
 },
 xml(v){return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;")
  .replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;")
  .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,"");},
 xlsx(rows){
  const names="ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const cells=rows.map((r,i)=>'<row r="'+(i+1)+'">'+r.map((v,j)=>{
   const ref=names[j]+(i+1),style=i===0?1:i===5?2:0;
   if(typeof v==="number"&&Number.isFinite(v))
    return '<c r="'+ref+'" s="'+style+'"><v>'+v+'</v></c>';
   return '<c r="'+ref+'" s="'+style+'" t="inlineStr"><is><t xml:space="preserve">'+this.xml(v)+'</t></is></c>';
  }).join("")+'</row>').join("");
  const ns='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  const ct='<?xml version="1.0" encoding="UTF-8"?>';
  const rel='http://schemas.openxmlformats.org/package/2006/relationships';
  const office='http://schemas.openxmlformats.org/officeDocument/2006/relationships/';
  const files={
   "[Content_Types].xml":ct+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'+
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'+
    '<Default Extension="xml" ContentType="application/xml"/>'+
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'+
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+
    '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
   "_rels/.rels":ct+'<Relationships xmlns="'+rel+'"><Relationship Id="rId1" Type="'+office+
    'officeDocument" Target="xl/workbook.xml"/></Relationships>',
   "xl/workbook.xml":ct+'<workbook xmlns="'+ns+'" xmlns:r="'+office.slice(0,-1)+'">'+
    '<sheets><sheet name="Asistencia" sheetId="1" r:id="rId1"/></sheets></workbook>',
   "xl/_rels/workbook.xml.rels":ct+'<Relationships xmlns="'+rel+'">'+
    '<Relationship Id="rId1" Type="'+office+'worksheet" Target="worksheets/sheet1.xml"/>'+
    '<Relationship Id="rId2" Type="'+office+'styles" Target="styles.xml"/></Relationships>',
   "xl/styles.xml":ct+'<styleSheet xmlns="'+ns+'">'+
    '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>'+
    '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>'+
    '<fill><patternFill patternType="solid"><fgColor rgb="FFDDEBF7"/><bgColor indexed="64"/></patternFill></fill></fills>'+
    '<borders count="2"><border><left/><right/><top/><bottom/></border>'+
    '<border><left style="thin"/><right style="thin"/><top style="thin"/><bottom style="thin"/></border></borders>'+
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'+
    '<cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'+
    '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0"/>'+
    '<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0"/></cellXfs></styleSheet>',
   "xl/worksheets/sheet1.xml":ct+'<worksheet xmlns="'+ns+'"><sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>'+
    '<cols><col min="1" max="1" width="7" customWidth="1"/><col min="2" max="2" width="34" customWidth="1"/>'+
    '<col min="3" max="3" width="17" customWidth="1"/><col min="4" max="4" width="35" customWidth="1"/>'+
    '<col min="5" max="5" width="30" customWidth="1"/><col min="6" max="6" width="23" customWidth="1"/></cols>'+
    '<sheetData>'+cells+'</sheetData>'+
    '<pageMargins left="0.3" right="0.3" top="0.5" bottom="0.5" header="0.2" footer="0.2"/>'+
    '<pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/></worksheet>'
  };
  return this.zip(files);
 },
 zip(files){
  const enc=new TextEncoder(),chunks=[],central=[],u16=n=>[n&255,(n>>>8)&255],
   u32=n=>[n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255];
  let pos=0;
  const crc=bytes=>{let c=0xffffffff;for(const b of bytes){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;};
  for(const [name,contents] of Object.entries(files)){
   const filename=enc.encode(name),data=enc.encode(contents),hash=crc(data),start=pos;
   const h=new Uint8Array([...u32(0x04034b50),...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),
    ...u32(hash),...u32(data.length),...u32(data.length),...u16(filename.length),...u16(0)]);
   chunks.push(h,filename,data);pos+=h.length+filename.length+data.length;
   const c=new Uint8Array([...u32(0x02014b50),...u16(20),...u16(20),...u16(0),...u16(0),...u16(0),
    ...u16(0),...u32(hash),...u32(data.length),...u32(data.length),...u16(filename.length),
    ...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(start)]);
   central.push(c,filename);
  }
  const size=central.reduce((n,x)=>n+x.length,0),end=new Uint8Array([...u32(0x06054b50),
   ...u16(0),...u16(0),...u16(Object.keys(files).length),...u16(Object.keys(files).length),
   ...u32(size),...u32(pos),...u16(0)]);
  const out=new Uint8Array(pos+size+end.length);let offset=0;
  for(const b of [...chunks,...central,end]){out.set(b,offset);offset+=b.length;}return out;
 }
};
(function(){
 if(typeof UI==="undefined")return;
 const prevMenu=UI.menus.bind(UI);
 UI.menus=function(){
  const m=prevMenu(),rol=St.perfil?.role;
  if(["docente","director","admin"].includes(rol)&&!m.some(x=>x[0]==="asistencia-grado")){
   const n=m.findIndex(x=>x[0]==="alumnos"||x[0]==="control");
   m.splice(n<0?m.length:n+1,0,["asistencia-grado","Asistencia por grado"]);
  }
  return m;
 };
 const prevIr=UI.ir.bind(UI);
 UI.ir=function(k){
  if(k==="asistencia-grado"){
   St.tab=k;
   document.querySelectorAll("#nav button").forEach(b=>b.setAttribute("aria-selected",b.dataset.k===k));
   return AsistenciaGrado.vista();
  }
  return prevIr(k);
 };
})();
