const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('actividades-clase.html');
const client=read('js/krueka-clase-temporal.js');
const viewer=read('js/krueka-material-preview.js');

new vm.Script(client);new vm.Script(viewer);
assert.match(html,/id="student-materials-list"/);
assert.match(html,/id="student-pdf-frame"[^>]*><\/div>/);
assert.doesNotMatch(html,/<iframe id="student-pdf-frame"/);
assert.match(html,/krueka-material-preview\.js\?v=/);
assert.match(html,/assets\/vendor\/jszip\.min\.js/);
assert.match(client,/KruekaMaterialPreview\.open\(previewHost,blob,m\.file_name\)/);
assert.match(client,/KruekaMaterialPreview\.open\(\$\('student-pdf-frame'\),pdf/);
assert.match(client,/Descargar para editar \(opcional\)/);
assert.doesNotMatch(client,/window\.open\('about:blank'/);
assert.match(viewer,/pdfDocument\.getPage\(pageNumber\)/);
assert.match(viewer,/page\.render\(/);
assert.match(viewer,/document\.body\.classList\.toggle\('material-fullscreen'/);
assert.match(viewer,/JSZip\.loadAsync\(blob\)/);
assert.match(viewer,/\.textContent=text/);
assert.match(viewer,/No se pudo preparar la vista previa/);
for(const file of ['assets/vendor/pdfjs/pdf.min.mjs','assets/vendor/pdfjs/pdf.worker.min.mjs',
 'assets/vendor/pdfjs/LICENSE','assets/vendor/jszip.min.js','assets/vendor/JSZIP_LICENSE']){
 assert.ok(fs.statSync(path.join(root,file)).size>1000,file+' no encontrado');
}
assert.match(read('ARQUITECTURA.md'),/Vista previa sin descargas involuntarias/);
console.log('PASS: visor en página, PDF por canvas, Office/ZIP locales y descarga opcional.');
