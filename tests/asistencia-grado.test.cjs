const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const js=read('js/asistencia-grado.js'),club=read('js/club-gestion.js');
const app=read('app.html'),sql=read('supabase/migrations/20261021090200_asistencia_por_grado_fecha.sql');
const sqlClub=read('supabase/migrations/20261021090100_club_salida_compatibilidad.sql');
new vm.Script(js);
new vm.Script(club);
assert.match(app,/js\/asistencia-grado\.js\?v=20261021a/);
assert.match(app,/js\/club-gestion\.js\?v=20261021a/);
assert.match(js,/asistencia_grado_cursos/);
assert.match(js,/asistencia_grado_lista/);
assert.match(js,/asistencia_grado_guardar/);
assert.match(js,/Imprimir lista/);
assert.match(js,/Descargar Excel \(\.xlsx\)/);
assert.match(js,/America\/Asuncion/);
assert.match(club,/club_alumno_salida/);
assert.match(club,/Salió/);
assert.match(club,/Reincorporar/);
assert.match(sqlClub,/p_nombre text default null/);
assert.match(sqlClub,/alter table public\.club_students add column if not exists salio_at/);
assert.match(sqlClub,/club_alumno_salida\(p_student uuid,p_salio boolean\)/);
assert.match(sqlClub,/grant execute on function public\.club_alumno_guardar/);
assert.match(sql,/enable row level security/);
assert.match(sql,/revoke all on public\.asistencia_grado from public,anon,authenticated/);
assert.match(sql,/where cs.course_id=p_course and cs.teacher_id=auth\.uid\(\)/);
assert.match(sql,/auth\.uid\(\),now\(\)/);
assert.match(sql,/unique\(course_id,fecha,student_id\)/);
assert.doesNotMatch(sql,/grant (select|insert|update|delete) on public\.asistencia_grado to anon/i);
const sandbox={
 console,TextEncoder,Uint8Array,Blob,
 UI:{menus:()=>[['clase','Clase de hoy']],ir:()=>{}},
 St:{perfil:{role:'docente',nombre:'Docente de prueba'}},
 $:()=>({}),db:{rpc:()=>{}},esc:x=>String(x),KG:{slug:x=>x}
};
vm.createContext(sandbox);
vm.runInContext(js,sandbox);
const ui=vm.runInContext('AsistenciaGrado',sandbox);
assert.ok(sandbox.UI.menus().some(x=>x[0]==='asistencia-grado'));
const workbook=Buffer.from(ui.xlsx([
 ['PLANILLA DE ASISTENCIA POR GRADO'],
 ['Curso','Sexto grado'],
 ['Fecha','21/10/2026'],
 ['Docente','Docente de prueba'],
 [],
 ['N.º','Alumno','Estado','Observación','Registrado por','Fecha y hora'],
 [1,'Alumno de prueba','Presente','Sin observación','Docente de prueba','21/10/2026 08:00']
]));
assert.equal(workbook.toString('latin1',0,4),'PK\x03\x04');
let pos=0;const files={};
while(pos<workbook.length&&workbook.readUInt32LE(pos)===0x04034b50){
 const size=workbook.readUInt32LE(pos+18),nameLen=workbook.readUInt16LE(pos+26),extraLen=workbook.readUInt16LE(pos+28);
 const name=workbook.toString('utf8',pos+30,pos+30+nameLen),begin=pos+30+nameLen+extraLen;
 files[name]=workbook.toString('utf8',begin,begin+size);
 pos=begin+size;
}
assert.ok(files['[Content_Types].xml']);
assert.ok(files['xl/workbook.xml'].includes('Asistencia'));
assert.ok(files['xl/worksheets/sheet1.xml'].includes('Sexto grado'));
assert.ok(files['xl/worksheets/sheet1.xml'].includes('Docente de prueba'));
assert.ok(files['xl/worksheets/sheet1.xml'].includes('Presente'));
assert.ok(files['xl/_rels/workbook.xml.rels'].includes('worksheet'));
assert.equal(workbook.readUInt32LE(workbook.length-22),0x06054b50);
console.log('PASS: Club Salió, RPC de asistencia por curso y Excel XLSX legible.');
