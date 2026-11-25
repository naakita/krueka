const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('el taller compacto carga en ambas entradas por código y después de los módulos creativos',()=>{
 const loader=read('js/club-studio-access.js');
 assert.match(loader,/['"]club-prompts-3d\.js['"],['"]club-studio-layout\.js['"]/);
 assert.match(loader,/club-studio-layout\.js'\?'\d{8}[a-z0-9]*'/);
 for(const page of ['studio.html','club-krueka.html']){
  const html=read(page);
  assert.match(html,/club\/club-studio-layout\.css\?v=\d{8}[a-z0-9]*/);
  assert.match(html,/js\/club-studio-access\.js\?v=\d{8}[a-z0-9]*"/);
  assert.ok(html.indexOf('club/club-studio-layout.css')>html.indexOf('club/club-studio-club.css'));
 }
});

test('los controles originales se reubican sin reemplazar su funcionalidad',()=>{
 const js=read('js/club-studio-layout.js'),css=read('club/club-studio-layout.css');
 for(const id of ['ks-projects','ks-title','ks-undo','ks-import','ks-export','ks-submit'])assert.ok(js.includes(id),id);
 assert.match(js,/if\(this\.cloudReady\)mount\(\)/);
 assert.match(js,/top\.insertBefore\(tabs,spacer\)/);
 assert.match(css,/grid-template-rows:auto minmax\(0,1fr\)/);
 assert.match(css,/grid-template-columns:minmax\(0,var\(--kc-first\)\) 14px minmax\(0,var\(--kc-last\)\)/);
 assert.match(css,/\.ks-previewbar\{[\s\S]*?flex-wrap:nowrap/);
 assert.match(css,/\.ks-preview,\s*#krueka-studio[\s\S]*?iframe\{min-height:0;height:100%\}/);
 assert.doesNotMatch(js,/fetch\(|XMLHttpRequest|\.rpc\(|sessionStorage/);
});

function engine(){
 const context={window:{StudioIA:{}},StudioIA:{}};
 vm.createContext(context);vm.runInContext(read('js/club-studio-layout.js'),context);
 return context.window.ClubWorkspaceLayout;
}

test('una preferencia corrupta no puede ocultar un panel ni introducir estado de proyectos',()=>{
 const api=engine();
 assert.deepEqual(JSON.parse(JSON.stringify(api.normalise({ratio:Infinity,reverse:'true',token:'secret',files:{}}))),{ratio:44,reverse:false});
 assert.equal(api.normalise({ratio:0,reverse:true}).ratio,20);
 assert.equal(api.normalise({ratio:900}).ratio,80);
 assert.equal(api.normalise(undefined,62).ratio,62);
});

test('el separador sigue el puntero en ambos órdenes sin cambiar el porcentaje del editor',()=>{
 const api=engine();
 assert.equal(api.pointerRatio(607,100,1014,false),50);
 assert.equal(api.pointerRatio(407,100,1014,false),30);
 assert.equal(api.pointerRatio(407,100,1014,true),70);
 assert.equal(api.pointerRatio(0,100,1014,false),20);
 assert.equal(api.pointerRatio(1400,100,1014,false),80);
 assert.equal(api.pointerRatio(0,0,0,false),50);
});

test('la distribución respeta teclados, móviles y los editores especializados',()=>{
 const js=read('js/club-studio-layout.js'),css=read('club/club-studio-layout.css');
 for(const name of ['program','blocks','live'])assert.ok(js.includes("attach('"+name+"'"),name);
 for(const name of ['aria-controls','aria-valuenow','pointercancel','lostpointercapture','ArrowLeft','ArrowUp'])assert.ok(js.includes(name),name);
 assert.match(css,/data-kc-axis=rows/);
 assert.match(css,/data-kc-reversed=true/);
 assert.match(css,/data-kc-focus=editor/);
 assert.match(css,/data-kc-focus=preview/);
 assert.match(js,/observer\?\.disconnect\(\)/);
});
