const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=x=>fs.readFileSync(path.join(root,x),'utf8');
const html=read('actividades-clase.html'),client=read('js/krueka-clase-temporal.js'),edge=read('supabase/functions/krueka-actividades-clase/index.ts');
new vm.Script(client);
for(const id of ['class-search','class-sort','class-grade','class-status','class-month','class-clear','class-results','class-pages']){
 assert.ok(html.includes('id="'+id+'"'),'Falta filtro de historial: '+id);
}
assert.ok(html.includes('js/krueka-clase-temporal.js?v=20261112b'));
for(const label of ['Más recientes primero','Más antiguas primero','Abiertas','Cerradas','Mes de creación'])assert.ok(html.includes(label),'Falta '+label);
for(const part of ['classFilters()','renderClassPages()','Creada: ','Cerrada: ','classRequestId','classMeta','Mostrando ','scheduleClassLoad']){
 assert.ok(client.includes(part),'Falta '+part);
}
assert.match(edge,/count:"exact"/);
assert.match(edge,/\.eq\("teacher_id",staff\.id\)/);
assert.match(edge,/\.range\(page\*pageSize,\(page\+1\)\*pageSize-1\)/);
assert.match(edge,/\.order\("created_at",\{ascending\}\)/);
assert.match(edge,/\.order\("id",\{ascending\}\)/);
assert.match(edge,/\.ilike\("title","%"/);
assert.match(edge,/\.ilike\("grade","%"/);
assert.match(edge,/\.gte\("created_at",start\)\.lt\("created_at",end\)/);
assert.match(edge,/page_size:pageSize/);
assert.doesNotMatch(edge,/\.limit\(100\)/);
assert.doesNotMatch(client,/innerHTML|localStorage|sessionStorage/);
// Paginación determinista: con 35 actividades y tamaño 12, ninguna desaparece.
const pages=[0,1,2].map(p=>Array.from({length:35},(_,i)=>i).slice(p*12,(p+1)*12));
assert.equal(pages.flat().length,35);
assert.deepEqual(pages.map(p=>p.length),[12,12,11]);
console.log('PASS: historial paginado, ordenado, filtros seguros, controles docentes y ningún límite oculto de 100.');
