const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=x=>fs.readFileSync(path.join(root,x),'utf8');
const home=read('index.html'), access=read('accesos.html'),info=read('informacion.html'),
 siwc=read('chatgpt-integracion.html'),app=read('app.html'),css=read('css/krueka-edu.css'),
 authCSS=read('css/krueka-acceso-escolar.css'),world=read('assets/krueka-world-2026.svg');
const pages=[home,access,info,siwc];
for(const [i,html] of pages.entries()){
 assert.match(html,/<body class="kx-site/, 'Páginas públicas comparten diseño '+i);
 assert.match(html,/css\/krueka-edu\.css\?v=20261017b/,'CSS versionada '+i);
 assert.match(html,/class="nav-inner"/,'navegación flotante '+i);
 assert.match(html,/id="nav-links"/);
 assert.match(html,/aria-expanded="false"/,'menú accesible '+i);
 assert.match(html,/href="accesos\.html"/,'acceso principal '+i);
 assert.match(html,/href="informacion\.html"/,'información '+i);
 assert.match(html,/js\/home\.js\?v=20261017a/);
}
for(const id of ['contenido','plataforma','creatividad','inteligencia-artificial','para-quien','como-funciona','contacto'])assert.match(home,new RegExp('id="'+id+'"'));
for(const dest of ['app.html','studio.html','accesos.html','personajes.html','entregas-word.html','entregas-excel.html','entregas-presentaciones.html','chatgpt-integracion.html'])
 assert.ok(home.includes('href="'+dest+'"'),'Acceso '+dest);
assert.match(home,/assets\/krueka-world-2026\.svg/);
assert.match(world,/<svg/);
assert.match(world,/Ilustración original/);
assert.match(home,/Ilustración conceptual/);
assert.match(home,/no generada ni transmitida en tiempo real/i);
assert.match(home,/ChatGPT: integración solicitada/i);
assert.match(home,/pendiente de autorización de OpenAI/i);
assert.match(home,/Ayuda local disponible/i);
assert.doesNotMatch(home,/Clase activa EN VIVO|93% presentes|27\s*\/\s*29|27 alumnos conectados/i);
assert.match(access,/id="entregas"/);
assert.match(access,/código personal de seis caracteres/i);
assert.match(info,/Qué información se utiliza/);
assert.match(siwc,/pendiente de autorización/i);
assert.match(app,/css\/krueka-acceso-escolar\.css\?v=20261017b/);
for(const id of ['form-doc','form-alu','screen-login','screen-nueva','screen-app','screen-alu'])assert.ok(app.includes('id="'+id+'"'),'Se conserva '+id);
assert.match(authCSS,/#screen-login/);assert.match(authCSS,/#screen-nueva/);
assert.doesNotMatch(authCSS,/#screen-app|#screen-alu/,'No se alteran vistas internas');
assert.match(css,/@media\(max-width:560px\)/);
assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
assert.match(css,/:focus-visible/);
assert.match(css,/#dff5ff/i);
assert.match(css,/#ff9b76/i);
assert.doesNotMatch(css,/@import|fonts\.googleapis|https:\/\/|url\((?:["']?)http/);
const links=[...pages.flatMap(p=>[...p.matchAll(/\b(?:href|src)="([^"]+)"/g)].map(m=>m[1]))];
for(const src of links){
 if(/^(https?:|mailto:|#|data:)/.test(src))continue;
 const target=src.split('#')[0].split('?')[0];
 if(!target)continue;
 assert.ok(!target.startsWith('/'),'Prefer relative paths '+target);
 assert.ok(fs.existsSync(path.join(root,target)),'Falta recurso '+target);
 if(src.includes('#')&&target==='index.html'){
  const hash=src.split('#')[1];
  assert.ok(home.includes('id="'+hash+'"'),'Falta ancla '+hash);
 }
}
console.log('PASS: Krueka pastel futurista: enlaces, mundo original, móvil, docentes, IA transparente, autenticación intacta.');
