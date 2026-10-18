const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const home=read('index.html'),access=read('accesos.html'),css=read('css/krueka-platform-2026.css'),js=read('js/krueka-platform-2026.js');
const auth=read('app.html'),siwc=read('chatgpt-integracion.html');
for(const page of [home,access]){
 assert.match(page,/class="kp-site"/);assert.match(page,/css\/krueka-platform-2026\.css\?v=[12]/);
 assert.match(page,/id="nav-links"/);assert.match(page,/class="menu-button kp-menu-button"/);
 assert.match(page,/aria-expanded="false"/);assert.match(page,/href="informacion\.html/);
 for(const m of page.matchAll(/\b(?:href|src)="([^"]+)"/g)){
  const u=m[1];if(/^(https?:|mailto:|#|data:)/.test(u))continue;
  const filename=u.split('#')[0].split('?')[0];if(!filename)continue;
  assert.ok(fs.existsSync(path.join(root,filename)),'Falta enlace/recurso '+filename);
 }
}
for(const id of ['contenido','plataforma','capacidades','inteligencia-artificial','para-quien','como-funciona','contacto','kp-app','kp-mode-studio','kp-mode-teacher','kp-mode-uploads','kp-lab-board','kp-progress-track'])assert.ok(home.includes('id="'+id+'"'),'Falta '+id);
for(const route of ['studio.html','app.html','accesos.html','personajes.html','entregas-word.html','entregas-excel.html','entregas-presentaciones.html','chatgpt-integracion.html'])assert.ok(home.includes('href="'+route+'"'),'Falta acceso a '+route);
assert.match(home,/No guarda notas ni datos personales/);
assert.match(home,/css\/krueka-premium-2026\.css\?v=1/);
assert.match(home,/Una nueva forma/);
assert.match(home,/Entrá al espacio de trabajo/);
assert.match(home,/Ejemplo interactivo, sin alumnos ni calificaciones reales/);
assert.match(home,/está solicitada, pero todavía no está activa/);
assert.match(siwc,/pendiente de autorización/);
assert.match(home,/data-kp-mode="studio"/);assert.match(home,/data-kp-mode="teacher"/);
assert.match(home,/data-kp-mode="uploads"/);assert.match(home,/data-kp-move="up"/);
assert.match(home,/data-kp-indicator/);
assert.doesNotMatch(home,/kx-character|kx-demo-world|kx-ai-stage|robot|my\.spline\.design/i);
new vm.Script(js);
assert.match(js,/kp-lab-board/);assert.match(js,/walls\.has/);assert.match(js,/setMode/);
assert.match(js,/aria-pressed/);assert.match(js,/aria-valuenow/);
assert.doesNotMatch(js,/localStorage|sessionStorage|fetch\(/);
assert.match(css,/@media\(max-width:580px\)/);assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
assert.match(css,/:focus-visible/);assert.doesNotMatch(css,/@import|fonts\.googleapis|url\((?:["']?)http/);
assert.match(auth,/id="screen-login"/);assert.match(auth,/id="screen-alu"/);
assert.match(access,/id="entregas"/);
console.log('PASS: Krueka product-first, navegación, privacidad, mini actividad y roles.');