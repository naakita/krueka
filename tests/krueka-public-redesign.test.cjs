const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const home=read('index.html'),access=read('accesos.html'),info=read('informacion.html'),
  siwc=read('chatgpt-integracion.html'),app=read('app.html'),css=read('css/krueka-hero-showcase.css'),
  js=read('js/krueka-hero-showcase.js');
for(const [i,h] of [home,access,info,siwc].entries()){
 assert.match(h,/<body class="kx-site/,'Identidad pública '+i);
 assert.match(h,/class="nav-inner"/,'Navegación '+i);
 assert.match(h,/id="nav-links"/);assert.match(h,/aria-expanded="false"/);
 assert.match(h,/href="accesos\.html"/);assert.match(h,/href="informacion\.html"/);
}
for(const id of ['contenido','plataforma','creatividad','inteligencia-artificial','para-quien','como-funciona','contacto'])assert.ok(home.includes('id="'+id+'"'),'Sección '+id);
for(const url of ['app.html','studio.html','accesos.html','personajes.html','entregas-word.html','entregas-excel.html','entregas-presentaciones.html','chatgpt-integracion.html'])
 assert.ok(home.includes('href="'+url+'"'),'Enlace '+url);
assert.match(home,/id="kx-main-title"/);assert.match(home,/kx-hero-centered-layout/);
assert.match(home,/id="kx-demo-stage"|class="kx-demo-stage"/);
assert.match(home,/kx-demo-shell/);assert.match(home,/data-demo="create"/);
assert.match(home,/data-demo="ai"/);assert.match(home,/data-demo="deliver"/);
assert.match(home,/css\/krueka-hero-showcase\.css\?v=20261017d/);
assert.match(home,/js\/krueka-hero-showcase\.js\?v=20261017d/);
assert.match(home,/VISTA ILUSTRATIVA/);assert.match(home,/No muestra alumnos, sesiones ni resultados reales/);
assert.doesNotMatch(home,/id="kx-ai-canvas"|kx-hero-3d|krueka-hero-3d\.js|kx-fallback-ring/);
new vm.Script(js);assert.match(js,/aria-pressed/);assert.match(js,/selectTab/);assert.match(js,/keydown/);
assert.match(css,/@media\(max-width:740px\)/);assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
assert.match(home,/pendiente de autorización de OpenAI/i);
assert.match(home,/Ayuda local disponible/i);
assert.match(app,/id="screen-login"/);assert.match(app,/id="screen-alu"/);
assert.match(access,/id="entregas"/);assert.match(info,/Qué información se utiliza/);
assert.match(siwc,/pendiente de autorización/i);
for(const src of [...[home,access,info,siwc].flatMap(p=>[...p.matchAll(/\b(?:href|src)="([^"]+)"/g)].map(m=>m[1]))]){
 if(/^(https?:|mailto:|#|data:)/.test(src))continue;
 const target=src.split('#')[0].split('?')[0];if(!target)continue;
 assert.ok(fs.existsSync(path.join(root,target)),'Falta ruta '+target);
}
console.log('PASS: sin geometría abstracta, demostraciones educativas, enlaces y controles intactos.');