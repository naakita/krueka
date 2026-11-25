/* Visor privado de materiales: los archivos permanecen en memoria y nunca se envían a terceros.
 * PDF.js y JSZip se sirven desde Krueka; esta página no crea URLs públicas de los documentos.
 */
(function(){
'use strict';
let pdfModule=null,active=null;
const ext=name=>(String(name||'').match(/\.([a-z0-9]+)$/i)?.[1]||'').toLowerCase();
const node=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
const action=(label,cb)=>{const b=node('button','btn secondary',label);b.type='button';b.addEventListener('click',cb);return b;};
function xml(text){
 if(/<!DOCTYPE|<!ENTITY/i.test(text))throw Error('El documento tiene contenido XML no permitido.');
 const parsed=new DOMParser().parseFromString(text,'application/xml');
 if(parsed.querySelector('parsererror'))throw Error('No se pudo interpretar el documento.');
 return parsed;
}
const tags=(root,name)=>Array.from(root.getElementsByTagName('*')).filter(e=>e.localName===name);
const inlineText=(root,name)=>tags(root,name).map(e=>e.textContent||'').join('');
function notice(parent,text){parent.append(node('p','preview-hint',text));}
function appendText(parent,text){
 const p=node('p','preview-paragraph',text);
 if(text.trim())parent.append(p);
}
function open(host,blob,name){
 if(active)active.destroy();
 let alive=true,renderTask=null,pdfTask=null,pdfDocument=null,pdfResize=null,pdfFrame=0,imgUrl=null,expanded=false;
 const surface=node('div','preview-surface'),tools=node('div','preview-controls');
 const body=node('div','preview-body');
 const title=node('strong','preview-name',name||'Material de la clase');
 const exit=action('Cerrar vista',()=>view.destroy());
 const expand=action('Ampliar',()=>view.expand());
 tools.append(title,expand,exit);surface.append(tools,body);
 host.replaceChildren(surface);host.hidden=false;
 notice(body,'Preparando vista previa…');
 const onKey=e=>{if(e.key==='Escape'&&expanded)view.expand();};
 document.addEventListener('keydown',onKey);
 const view={
  destroy(){
   if(!alive)return;
   alive=false;pdfResize?.disconnect();if(pdfFrame)cancelAnimationFrame(pdfFrame);document.removeEventListener('keydown',onKey);
   if(renderTask)renderTask.cancel();
   if(pdfTask)pdfTask.destroy().catch(()=>{});
   if(imgUrl)URL.revokeObjectURL(imgUrl);
   if(expanded)document.body.classList.remove('material-fullscreen');
   host.replaceChildren();host.hidden=true;if(active===view)active=null;
  },
  expand(){
   if(!alive)return;
   expanded=!expanded;surface.classList.toggle('is-expanded',expanded);
   document.body.classList.toggle('material-fullscreen',expanded);
   expand.textContent=expanded?'Reducir':'Ampliar';surface.focus();
  }
 };
 surface.tabIndex=-1;active=view;
 (async()=>{
  try{
   const type=ext(name);
   if(type==='pdf')await showPdf();
   else if(['jpg','jpeg','png','webp','gif'].includes(type))showImage();
   else if(['txt','csv','rtf'].includes(type))await showText();
   else if(['docx','xlsx','pptx','odt','ods','odp','zip'].includes(type))await showArchive(type);
   else{body.replaceChildren();notice(body,'Este formato antiguo no se puede leer de forma segura aquí. Pedile al docente una copia PDF para consultarlo sin descargar.');}
  }catch(e){if(alive){body.replaceChildren();notice(body,'No se pudo preparar la vista previa: '+(e?.message||'error inesperado')+'. Pedile al docente una copia PDF si el problema continúa.');}}
 })();
 async function showPdf(){
  const lib=await (pdfModule ||= import(new URL('assets/vendor/pdfjs/pdf.min.mjs',document.baseURI).href));
  if(!alive)return;
  lib.GlobalWorkerOptions.workerSrc=new URL('assets/vendor/pdfjs/pdf.worker.min.mjs',document.baseURI).href;
  const bytes=new Uint8Array(await blob.arrayBuffer());if(!alive)return;
  pdfTask=lib.getDocument({data:bytes});
  pdfDocument=await pdfTask.promise;if(!alive)return;
  body.replaceChildren();
  let pageNumber=1,zoom=1,drawNumber=0;
  const nav=node('div','preview-page-nav'),prev=action('Anterior',()=>{if(pageNumber>1){pageNumber--;requestDraw();}}),
   next=action('Siguiente',()=>{if(pageNumber<pdfDocument.numPages){pageNumber++;requestDraw();}}),
   less=action('−',()=>{zoom=Math.max(.6,zoom-.2);requestDraw();}),more=action('+',()=>{zoom=Math.min(2.4,zoom+.2);requestDraw();}),
   count=node('span','preview-page-count');
  const scroller=node('div','preview-pdf-scroll'),canvas=node('canvas','preview-pdf-canvas');
  canvas.setAttribute('aria-label','Página del documento PDF');
  scroller.tabIndex=0;scroller.setAttribute('aria-label','Área del PDF');
  scroller.append(canvas);nav.append(prev,count,next,less,more);body.append(nav,scroller);
  let lastWidth=scroller.clientWidth;
  const requestDraw=()=>draw().catch(e=>{if(alive)notice(body,'No se pudo preparar la página del PDF: '+e.message);});
  if(typeof ResizeObserver==='function'){
   pdfResize=new ResizeObserver(()=>{
    const width=scroller.clientWidth;
    if(alive&&width>0&&width!==lastWidth){
     lastWidth=width;if(pdfFrame)cancelAnimationFrame(pdfFrame);
     pdfFrame=requestAnimationFrame(()=>{pdfFrame=0;requestDraw();});
    }
   });
   pdfResize.observe(scroller);
  }
  async function draw(){
   const ticket=++drawNumber;
   if(renderTask){renderTask.cancel();try{await renderTask.promise;}catch(_){/* cancelado */}}
   if(!alive||ticket!==drawNumber)return;
   const page=await pdfDocument.getPage(pageNumber);
   if(!alive||ticket!==drawNumber)return;
   const original=page.getViewport({scale:1});
   const fit=Math.min(1.4,Math.max(1,scroller.clientWidth)/original.width);
   const viewport=page.getViewport({scale:fit*zoom});
   const ratio=Math.min(window.devicePixelRatio||1,2),ctx=canvas.getContext('2d');
   canvas.width=Math.floor(viewport.width*ratio);canvas.height=Math.floor(viewport.height*ratio);
   canvas.style.width=Math.floor(viewport.width)+'px';canvas.style.height=Math.floor(viewport.height)+'px';
   count.textContent='Página '+pageNumber+' de '+pdfDocument.numPages;
   prev.disabled=pageNumber<=1;next.disabled=pageNumber>=pdfDocument.numPages;
   renderTask=page.render({canvasContext:ctx,viewport,transform:ratio!==1?[ratio,0,0,ratio,0,0]:null});
   try{await renderTask.promise;}catch(err){if(err?.name!=='RenderingCancelledException'&&alive)throw err;}
  }
  await draw();
 }
 function showImage(){
  body.replaceChildren();imgUrl=URL.createObjectURL(blob);
  const img=node('img','preview-image');img.alt='Imagen: '+name;img.src=imgUrl;
  img.onerror=()=>{if(alive){body.replaceChildren();notice(body,'La imagen no puede mostrarse en este navegador.');}};
  body.append(img);
 }
 async function showText(){
  const content=await blob.text();if(!alive)return;
  body.replaceChildren();const pre=node('pre','preview-plain',content.slice(0,100000));body.append(pre);
  if(content.length>100000)notice(body,'Se muestra el comienzo del documento para no sobrecargar la computadora.');
 }
 async function showArchive(type){
  if(!window.JSZip)throw Error('No se cargó el lector local de documentos');
  const archive=await window.JSZip.loadAsync(blob);if(!alive)return;
  const file=async path=>{
   const entry=archive.file(path);if(!entry)return null;
   if(entry._data?.uncompressedSize>4*1024*1024)
    throw Error('La vista de este documento es demasiado grande para mostrarla aquí');
   return xml(await entry.async('string'));
  };
  body.replaceChildren();
  if(type==='docx'){
   const doc=await file('word/document.xml');if(!doc)throw Error('No se encontró el texto de Word');
   let total=0;
   for(const p of tags(doc,'p')){
    if(!p.namespaceURI?.includes('wordprocessingml'))continue;
    const content=inlineText(p,'t').trim();if(!content)continue;
    appendText(body,content);if(++total>=400)break;
   }
   if(!total)notice(body,'El documento no contiene texto visible en esta vista simplificada.');
  }else if(type==='pptx'){
   const slides=Object.keys(archive.files).filter(p=>/^ppt\/slides\/slide\d+\.xml$/.test(p))
    .sort((a,b)=>Number(a.match(/\d+/)[0])-Number(b.match(/\d+/)[0])).slice(0,60);
   for(let i=0;i<slides.length;i++){
    const doc=await file(slides[i]);if(!alive)return;
    const card=node('section','preview-slide'),h=node('h4','', 'Diapositiva '+(i+1));card.append(h);
    for(const p of tags(doc,'p').slice(0,100))appendText(card,inlineText(p,'t'));
    body.append(card);
   }
   if(!slides.length)notice(body,'No se encontraron diapositivas legibles.');
  }else if(type==='xlsx'){
   const shared=await file('xl/sharedStrings.xml');
   const strings=shared?tags(shared,'si').slice(0,20000).map(e=>inlineText(e,'t')):[];
   const sheets=Object.keys(archive.files).filter(p=>/^xl\/worksheets\/sheet\d+\.xml$/.test(p))
    .sort((a,b)=>Number(a.match(/\d+/)[0])-Number(b.match(/\d+/)[0])).slice(0,8);
   for(let i=0;i<sheets.length;i++){
    const doc=await file(sheets[i]);if(!alive)return;
    const h=node('h4','preview-sheet-title','Hoja '+(i+1)),scroller=node('div','preview-sheet-scroll'),table=node('table','preview-table');
    let rowCount=0;
    for(const row of tags(doc,'row')){
     if(rowCount++>=100)break;
     const tr=node('tr');let used=0;
     for(const cell of tags(row,'c')){
      if(++used>30)break;
      const td=node('td');const value=tags(cell,'v')[0]?.textContent||'';
      td.textContent=cell.getAttribute('t')==='s'?strings[Number(value)]||'':
       cell.getAttribute('t')==='inlineStr'?inlineText(cell,'t'):value;
      tr.append(td);
     }
     table.append(tr);
    }
    scroller.append(table);body.append(h,scroller);
   }
   if(!sheets.length)notice(body,'No se encontraron hojas legibles.');
  }else if(['odt','ods','odp'].includes(type)){
   const doc=await file('content.xml');if(!doc)throw Error('No se encontró el contenido del documento');
   let total=0;
   for(const p of tags(doc,'p')){
    if(!p.namespaceURI?.includes('opendocument:xmlns:text'))continue;
    appendText(body,p.textContent||'');if(++total>=400)break;
   }
   if(!total)notice(body,'No hay texto visible en esta vista simplificada.');
  }else{
   notice(body,'Contenido del archivo comprimido (solo nombres, sin abrir ni ejecutar archivos):');
   const list=node('ul','preview-zip-list');
   Object.keys(archive.files).filter(p=>!archive.files[p].dir).slice(0,100)
    .forEach(path=>list.append(node('li','',path)));
   body.append(list);
  }
  if(alive&&type!=='zip')notice(body,'Vista de lectura simplificada: el diseño, las fórmulas o las animaciones pueden verse distintos al archivo original.');
 }
 return view;
}
window.KruekaMaterialPreview={open};
})();
