const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('el taller compacto carga en ambas entradas por código y después de los módulos creativos',()=>{
 const loader=read('js/club-studio-access.js');
 assert.match(loader,/['"]club-prompts-3d\.js['"],['"]club-studio-layout\.js['"]/);
 assert.match(loader,/club-studio-layout\.js'\?'20261121layout1'/);
 for(const page of ['studio.html','club-krueka.html']){
  const html=read(page);
  assert.match(html,/club\/club-studio-layout\.css\?v=20261121layout1/);
  assert.match(html,/js\/club-studio-access\.js\?v=20261121[a-z0-9]+/);
  assert.ok(html.indexOf('club/club-studio-layout.css')>html.indexOf('club/club-studio-club.css'));
 }
});

test('los controles originales se reubican sin reemplazar su funcionalidad',()=>{
 const js=read('js/club-studio-layout.js'),css=read('club/club-studio-layout.css');
 for(const id of ['ks-projects','ks-title','ks-undo','ks-import','ks-export','ks-submit'])assert.ok(js.includes(id),id);
 assert.match(js,/if\(this\.cloudReady\)mount\(\)/);
 assert.match(js,/top\.insertBefore\(tabs,spacer\)/);
 assert.match(css,/grid-template-rows:auto minmax\(0,1fr\)/);
 assert.match(css,/grid-template-columns:minmax\(295px,32%\) minmax\(0,1fr\)/);
 assert.match(css,/\.ks-previewbar\{[\s\S]*?flex-wrap:nowrap/);
 assert.match(css,/\.ks-preview,\s*body\.studio-access[\s\S]*?iframe\{min-height:0;height:100%\}/);
 assert.doesNotMatch(js,/fetch\(|XMLHttpRequest|\.rpc\(|localStorage|sessionStorage/);
});
