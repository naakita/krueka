/* Controles nuevos sobre los editores reales, con persistencia simulada y sin datos de alumnos. */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),cp=require('node:child_process'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const prior=fs.readFileSync(path.join(__dirname,'studio-classroom-browser.test.cjs'),'utf8');
const setup=vm.runInNewContext(prior.match(/const setup=(`[^]*?`);\nconst smoke=/)[1]);
const smoke=`<script>
const checks=[];function check(ok,name){if(!ok)checks.push(name)}
async function until(fn){const deadline=Date.now()+20000;while(!fn()){if(Date.now()>deadline)throw Error('Espera agotada: '+checks.join(' | '));await new Promise(r=>setTimeout(r,30));}}
const set=(element,value,event='change')=>{element.value=value;element.dispatchEvent(new Event(event,{bubbles:true}));};
const press=(host,label)=>{const b=[...host.querySelectorAll('button')].find(x=>x.textContent===label);if(!b)throw Error('Botón ausente '+label);b.click();};
const data=()=>JSON.parse(StudioIA.files['obra.json']);
(async()=>{
 await until(()=>window.KruekaStudioAccess?.ready);await KruekaStudioAccess.login('TEST01');
 document.querySelector('[data-creative-start="libros"]').click();await until(()=>ClubKrueka.isCreative(StudioIA)&&!StudioIA.busy);
 let work=document.getElementById('ks-club-work');
 let area=work.querySelector('[name="panel-text-0"]');area.focus();set(area,'El lapacho crece. El lapacho florece.','input');
 check(work.querySelector('.su-word-count').textContent.includes('6 palabras'),'contador de palabras');
 const search=work.querySelector('#ck-format .su-search');search.open=true;
 set(search.querySelector('[aria-label="Buscar texto"]'),'lapacho');set(search.querySelector('[aria-label="Reemplazar por"]'),'árbol');press(search,'Reemplazar todos');
 check(data().panels[0].text==='El árbol crece. El árbol florece.','reemplazo literal de todas las coincidencias');
 StudioIA.restore();check(data().panels[0].text==='El lapacho crece. El lapacho florece.','deshacer reemplazo');
 ClubWorkshopSuite.redo();check(data().panels[0].text==='El árbol crece. El árbol florece.','rehacer reemplazo');
 work=document.getElementById('ks-club-work');work.querySelector('[data-section="design"]').click();
 set(work.querySelector('[aria-label="Tamaño del texto"]'),'21');set(work.querySelector('[aria-label="Interlineado"]'),'1.9');set(work.querySelector('[aria-label="Formato al imprimir"]'),'oficio');
 check(data().tools.editorial.bodySize===21&&StudioIA.files['style.css'].includes('line-height:1.9'),'tipografía aplicada a la obra');
 const print=ClubWorkshopSuite.printMarkup(data());check(print.includes('210mm 333.3mm')&&print.includes('El árbol crece.'),'impresión incluye contenido y papel elegido');
 await StudioIA.save();const book=StudioIA.projectId;
 await StudioIA.createKit('animes');work=document.getElementById('ks-club-work');
 set(work.querySelector('[aria-label="Duración de esta escena"]'),'8');set(work.querySelector('[aria-label="Movimiento de este personaje"]'),'still');set(work.querySelector('[aria-label="Color del globo"]'),'#ffeeaa');
 check(data().tools.perScene[0].editor.seconds===8&&StudioIA.files['index.html'].includes('data-duration="8"'),'tiempo de escena persistente');
 check(StudioIA.files['script.js'].includes('pages[page].dataset.duration')&&StudioIA.files['style.css'].includes('animation-name:none'),'motor usa duración y movimiento de cada escena');
 await StudioIA.createKit('pagina-web');
 const code=document.getElementById('kp-program-editor'),bar=code.previousElementSibling,select=bar.querySelector('[aria-label="Archivo del proyecto"]');
 check(select.options.length===Object.keys(StudioIA.files).length,'acceso a todos los archivos del proyecto');
 set(select,'style.css');check(document.getElementById('kp-program-filename').textContent==='style.css','selector abre archivo');
 code.focus();set(code,'h1 { color: red; }','input');code.setSelectionRange(0,0);press(bar,'Duplicar línea');
 check(StudioIA.files['style.css']==='h1 { color: red; }\\nh1 { color: red; }','duplicar línea actual');
 code.setSelectionRange(0,code.value.length);press(bar,'Sangrar');check(StudioIA.files['style.css'].startsWith('  h1'),'sangría de selección');
 press(bar,'Quitar sangría');check(StudioIA.files['style.css'].startsWith('h1'),'quitar sangría');
 const searchCode=bar.querySelector('.su-search');set(searchCode.querySelector('[aria-label="Buscar texto"]'),'red');set(searchCode.querySelector('[aria-label="Reemplazar por"]'),'blue');press(searchCode,'Reemplazar todos');
 check((StudioIA.files['style.css'].match(/blue/g)||[]).length===2,'reemplazar código y conservar archivo');
 await StudioIA.createKit('visual-blocks');
 const event=()=>JSON.parse(StudioIA.files['bloques.json']).events;
 const shell=document.getElementById('kb-shell');document.querySelector('[data-lane="flechas"]').click();
 await until(()=>shell.querySelector('[data-suite-duplicate]'));
 const before=event().flechas.length;shell.querySelector('[data-suite-duplicate]').click();
 check(event().flechas.length===before+1&&event().flechas[0].id!==event().flechas[1].id,'duplicar bloque con identidad nueva');
 press(shell,'Copiar evento');document.querySelector('[data-lane="funcion"]').click();const target=event().funcion.length;press(shell,'Pegar en este evento');
 check(event().funcion.length===target+before+1,'pegar los bloques en otro evento');
 await StudioIA.save();const blocks=StudioIA.projectId;
 await StudioIA.switchProject(book);check(data().tools.editorial.bodySize===21&&data().tools.editorial.format==='oficio'&&data().panels[0].text.includes('árbol'),'recuperar composición y contenido');
 await StudioIA.switchProject(blocks);check(event().funcion.length===target+before+1,'recuperar programa por bloques');
 await StudioIA.close();await KruekaStudioAccess.login('TEST02');
 check(!StudioIA.files['bloques.json']&&!StudioIA.files['obra.json'],'datos aislados por alumno');
 check(__errors.length===0,__errors.join(' | '));await StudioIA.close();
 document.body.dataset.suiteSmoke=checks.length?'FAIL '+checks.join(' | '):'PASS';
})().catch(e=>{document.body.dataset.suiteSmoke='FAIL '+e.stack});
</script>`;
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'krueka-suite-')),file=path.join(directory,'index.html');
try{
 const html=fs.readFileSync(path.join(root,'club-krueka.html'),'utf8').replace('<head>','<head><base href="file://'+root+'/">'+setup).replace('</body>',smoke+'</body>');
 fs.writeFileSync(file,html);
 const binary=process.env.STUDIO_CHROMIUM||['google-chrome','google-chrome-stable','chromium','chromium-browser'].find(name=>cp.spawnSync(name,['--version'],{timeout:3000}).status===0);
 assert.ok(binary,'Chromium no instalado');
 const run=cp.spawnSync(binary,['--headless=new','--no-sandbox','--no-zygote','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--window-size=1363,936','--virtual-time-budget=45000','--dump-dom','file://'+file],{encoding:'utf8',timeout:65000,maxBuffer:8e6});
 assert.equal(run.status,0,(run.stderr||'').slice(-1000));
 const result=run.stdout.match(/data-suite-smoke="([^"]+)"/)?.[1];assert.equal(result,'PASS',result||'El recorrido no terminó');
 console.log('PASS: composición, texto, búsqueda, historial, anime, código, bloques, guardado y aislamiento.');
}finally{fs.rmSync(directory,{recursive:true,force:true});}
