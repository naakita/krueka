const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const ctx={window:{},console};vm.createContext(ctx);
vm.runInContext(read('js/club-studio-talleres.js'),ctx);
const {normalize,enhance}=ctx.window.ClubTalleres;

test('el libro es un manuscrito continuo, con páginas reales sin capítulos forzados',()=>{
 const manuscript='La historia comienza. '.repeat(160)+'\n\nLa historia sigue y termina.';
 const raw={kind:'libros',title:'El libro de la clase',subtitle:'Mi primera historia',art:'📚',color:'#237fc3',panels:[{title:'',text:manuscript}]};
 const files=enhance(raw,{}),html=files['index.html'];
 assert.match(html,/class="ck-public ck-libros ck-reader/);
 assert.match(html,/class="ck-pages ck-viewer-pages ck-spread"/);
 assert.match(html,/id="ck-prev"/);assert.match(html,/id="ck-next"/);
 assert.match(html,/id="ck-paper-sound"/);
 assert.doesNotMatch(html,/<header>/,'el título y la descripción no se duplican arriba del libro');
 assert.match(html,/<h2>El libro de la clase<\/h2>/,'el título permanece en la portada');
 assert.match(html,/<p class="ck-cover-subtitle">Mi primera historia<\/p>/,'el subtítulo se mantiene en la portada');
 assert.match(html,/class="ck-cover-byline"/,'la firma artística se mantiene en la portada');
 assert.match(files['style.css'],/\.ck-libros\.ck-reader main\{max-width:1400px/,'el libro aprovecha el espacio de lectura');
 assert.ok((html.match(/class="ck-panel ck-book ck-manuscript-leaf"/g)||[]).length>2,'obra larga paginada');
 assert.match(html,/La historia sigue y termina/);
 assert.doesNotMatch(html,/CAPÍTULO 1|ACTO 1/);
 assert.equal(JSON.parse(files['obra.json']).panels[0].text,manuscript);
 assert.match(files['style.css'],/\.ck-libros \.ck-manuscript-leaf p/);
});

test('la ilustración aparece entre el texto anterior y posterior, sin aceptar HTML malicioso',()=>{
 const src='data:image/webp;base64,UklGRgAAAAA=',id='imgabcdef12';
 const raw={kind:'libros',title:'Historia',panels:[{text:'Antes de la imagen <script>alert(1)</script>.\n\n[[imagen:'+id+']]\n\nDespués de la imagen.'}],tools:{bookImages:{[id]:src,imgevil:'https://otro-sitio/img.svg'}}};
 const clean=normalize(raw),html=enhance(raw,{})['index.html'];
 assert.equal(clean.tools.bookImages[id],src);
 assert.equal(Object.keys(clean.tools.bookImages).length,1);
 assert.ok(html.indexOf('Antes de la imagen')<html.indexOf('<figure class="ck-inline-figure">'));
 assert.ok(html.indexOf('<figure class="ck-inline-figure">')<html.indexOf('Después de la imagen'));
 assert.match(html,/src="data:image\/webp;base64,UklGRgAAAAA="/);
 assert.match(html,/&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
 assert.doesNotMatch(html,/<script>alert\(1\)<\/script>/);
 assert.equal(JSON.parse(enhance(raw,{})['obra.json']).tools.bookImages[id],src);
});

test('el encabezado tradicional de cuentos y dramas sigue disponible',()=>{
 for(const kind of ['cuentos','dramas']){
  const html=enhance({kind,title:'Obra de prueba',subtitle:'Descripción original',panels:[{title:'Parte uno',text:'Texto'}]}, {})['index.html'];
  assert.match(html,/<header><small>CLUB KRUEKA/);
  assert.match(html,/<h1>Obra de prueba<\/h1>/);
 }
});

test('Libros está en Escribir, con versión de caché y categoría de galería autorizada',()=>{
 assert.match(read('js/club-studio-club.js'),/id:'libros'.*name:'Libros'/);
 assert.match(read('js/club-studio-creative.js'),/label:'Escribir',ids:\['libros'/);
 for(const p of ['club-krueka.html','studio.html'])assert.match(read(p),/club-studio-access\.js\?v=20261125/);
 assert.match(read('js/club-studio-access.js'),/club-studio-talleres\.js'.*20261125/);
 assert.match(read('app.html'),/club-studio-talleres\.js\?v=20261125/);
 assert.match(read('supabase/migrations/20261121113000_club_krueka_libros_galeria.sql'),/'cuentos','libros','dramas'/);
});

test('el libro se entrega para revisión y aparece en la galería pública solo cuando fue aprobado',()=>{
 const editor=read('js/club-studio-club.js'),publicJs=read('js/club-krueka-public.js');
 assert.match(editor,/id="ck-book-submit"/);
 assert.match(editor,/s\.submit\(\{stayInWorkshop:true\}\)/);
 assert.match(read('js/club-studio-bloques.js'),/return submitted/);
 assert.match(read('js/club-studio-programacion.js'),/return submitted/);
 assert.match(read('js/club-studio-ai.js'),/return true;\s*\}catch\(e\)/);
 assert.match(publicJs,/\['libros','Libros','#[0-9a-f]{6}'\]/);
 const query=read('supabase/migrations/20261121191500_club_krueka_public_libros.sql');
 assert.match(query,/'cuentos','libros','dramas'/);
 assert.match(query,/p\.status='published'/);
 assert.match(query,/p\.institution_id=/);
 assert.match(read('club-krueka-galeria.html'),/club-krueka-public\.js\?v=20261125tinta1/);
});
