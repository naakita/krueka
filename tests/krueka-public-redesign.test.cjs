const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const index=read('index.html'),access=read('accesos.html'),info=read('informacion.html'),
  siwc=read('chatgpt-integracion.html'),app=read('app.html'),css=read('css/krueka-edu.css'),
  authCss=read('css/krueka-acceso-escolar.css'),homeJs=read('js/home.js');
for(const [name,html] of [['index',index],['accesos',access],['informacion',info],['siwc',siwc]]){
 assert.match(html,/<body class="kx-site/,name+' usa identidad nueva');
 assert.match(html,/css\/krueka-edu\.css\?v=20261017a/,name+' tiene CSS nueva');
 assert.match(html,/href="index\.html"/,name+' tiene acceso de retorno');
 assert.match(html,/id="nav-links"/,name+' permite menú móvil');
 assert.match(html,/class="menu-button"/,name+' tiene botón de menú');
 assert.match(html,/aria-expanded="false"/,name+' tiene estado de menú accesible');
 assert.match(html,/href="accesos\.html|href="app\.html/,name+' tiene acceso de rol');
 assert.match(html,/href="informacion\.html/,name+' enlaza información');
 assert.match(html,/js\/home\.js\?v=20261017a/,name+' comparte navegación');
}
const ids=[...index.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
for(const anchor of ['contenido','plataforma','espacios','inteligencia-artificial','como-funciona','contacto'])assert.ok(ids.includes(anchor),'faltó sección '+anchor);
for(const link of ['studio.html','personajes.html','app.html','entregas-word.html','entregas-excel.html','entregas-presentaciones.html','chatgpt-integracion.html'])
 assert.ok(index.includes('href="'+link+'"'),'enlace faltante a '+link);
assert.match(index,/Vista ilustrativa.*No muestra datos de alumnos/i);
assert.match(index,/todavía no está activa/);
assert.match(index,/Ayuda local/);
assert.match(index,/no comparten la cuenta/);
assert.doesNotMatch(index,/27\s*\/\s*29|93%\s*presentes|Clase activa EN VIVO|GPT-6[^<]{0,30}ilimitado/i);
assert.match(access,/id="entregas"/);
assert.match(access,/código personal de seis caracteres/i);
assert.match(access,/código exclusivo/i);
assert.match(info,/Servicios que intervienen/);
assert.match(info,/Qué información se utiliza/);
assert.match(siwc,/Estado: pendiente de autorización/);
assert.doesNotMatch(siwc,/Estado:\s*conectado/i);
assert.match(app,/css\/krueka-acceso-escolar\.css\?v=20261017a/);
for(const id of ['form-doc','form-alu','screen-login','screen-nueva','screen-app','screen-alu'])
 assert.ok(app.includes('id="'+id+'"'),'app conserva '+id);
assert.match(authCss,/#screen-login/);
assert.match(authCss,/#screen-nueva/);
assert.doesNotMatch(authCss,/#screen-app|#screen-alu/,'nunca intervenir vistas internas');
assert.match(css,/@media\(max-width:550px\)/);
assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
assert.match(css,/:focus-visible/);
assert.doesNotMatch(css,/@import|fonts\.googleapis|https:\/\/|url\((?:["']?)http/);
assert.match(homeJs,/menu\.addEventListener\('click'/);
for(const page of [index,access,info,siwc]){
 for(const m of page.matchAll(/\b(?:href|src)="([^"]+)"/g)){
  const url=m[1];
  if(/^(https?:|mailto:|#|data:)/.test(url))continue;
  const local=url.split('#')[0].split('?')[0];
  if(!local||local==='/')continue;
  assert.ok(!local.startsWith('/'),'usar rutas relativas verificables: '+local);
  assert.ok(fs.existsSync(path.join(root,local)),'Falta ruta local '+local);
  if(url.includes('#')&&!url.startsWith('mailto:')){
   const fragment=url.split('#')[1].split('?')[0];
   if(fragment&&local==='index.html')assert.ok(ids.includes(fragment),'Falta ancla '+fragment+' de '+url);
  }
 }
}
console.log('PASS: nueva identidad, accesibilidad básica, rutas reales, IA honesta y login intacto.');
