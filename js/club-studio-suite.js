/* Herramientas de edición compartidas del Club. Sin servicios externos ni permisos nuevos. */
(function(){
'use strict';
if(window.ClubWorkshopSuite)return;
const T=window.ClubTalleres,S=window.StudioIA;
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=(v,lo,hi,fallback)=>Number.isFinite(Number(v))?Math.max(lo,Math.min(hi,Number(v))):fallback;
const hex=(v,fallback)=>/^#[0-9a-f]{6}$/i.test(v||'')?v:fallback;
const formats={auto:['Adaptable','auto'],a4:['A4 vertical','210mm 297mm'],oficio:['Oficio 21 × 33,33 cm','210mm 333.3mm'],horizontal:['A4 horizontal','297mm 210mm'],cuadrado:['Cuadrado','210mm 210mm']};
function editorial(raw){
 const e=raw&&typeof raw==='object'?raw:{};
 return {bodySize:number(e.bodySize,12,36,17),titleSize:number(e.titleSize,22,80,36),lineHeight:number(e.lineHeight,1.1,2.3,1.6),
  align:['left','center','right','justify'].includes(e.align)?e.align:'left',format:Object.hasOwn(formats,e.format)?e.format:'auto',
  columns:Math.round(number(e.columns,1,3,2)),gap:number(e.gap,4,40,12)};
}
function sceneStyle(raw){
 const e=raw&&typeof raw==='object'?raw:{};
 return {side:e.side==='left'?'left':'right',bubbleColor:hex(e.bubbleColor,'#ffffff'),textColor:hex(e.textColor,'#193959'),
  actorSize:number(e.actorSize,35,140,77),border:number(e.border,0,10,3),seconds:e.seconds==null||e.seconds===''?null:number(e.seconds,1,30,5),
  motion:['inherit','float','slide','zoom','still'].includes(e.motion)?e.motion:'inherit'};
}
function findText(text,query,start=0,matchCase=false){
 const q=String(query);if(!q)return -1;
 const pattern=literalPattern(q,matchCase);pattern.lastIndex=Math.max(0,start);
 let match=pattern.exec(String(text));if(!match){pattern.lastIndex=0;match=pattern.exec(String(text));}return match?match.index:-1;
}
function literalPattern(query,matchCase){return new RegExp(String(query).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),matchCase?'gu':'giu');}
function replaceText(text,query,replacement,matchCase=false){
 const original=String(text),q=String(query);if(!q)return {text:original,count:0};
 let count=0;const result=original.replace(literalPattern(q,matchCase),()=>{count++;return String(replacement);});
 return {text:result,count};
}
function words(value){return (String(value).match(/[\p{L}\p{N}]+(?:['’’-][\p{L}\p{N}]+)*/gu)||[]).length;}
function inline(value){return safe(value).replace(/\*\*([^*\n]+)\*\*/g,'<strong>$1</strong>').replace(/\*([^*\n]+)\*/g,'<em>$1</em>');}
function plainText(d){return [d.title,d.subtitle,...d.panels.flatMap(p=>[p.title,p.text])].filter(Boolean).join('\n\n');}
function printMarkup(raw){
 const d=T.normalize(raw),e=editorial(d.tools.editorial),images=d.tools.bookImages||{};
 let contents=d.panels.map((p,i)=>{
  const body=String(p.text).split(/\n\s*\n/).map(text=>{
   const marker=text.trim().match(/^\[\[imagen:(img[a-z0-9]{6,20})\]\]$/);
   if(marker&&images[marker[1]])return '<figure><img alt="Ilustración" src="'+safe(images[marker[1]])+'"></figure>';
   return '<p>'+inline(text).replace(/\n/g,'<br>')+'</p>';
  }).join('');
  const img=d.tools.images?.[i];
  return '<section>'+ (p.title?'<h2>'+safe(p.title)+'</h2>':'')+(img?'<img alt="Ilustración de la parte" src="'+safe(img)+'">':'')+body+'</section>';
 }).join('');
 if(d.kind==='dibujos'||d.tools.strokes.length||d.tools.stamps.length||d.tools.coloringPage!=='blanco')contents='<figure>'+T.sketchMarkup(d.tools.strokes,d.tools.backdrop,d.tools)+'</figure>'+contents;
 const font=d.tools.font==='Clásica'?'Georgia,serif':d.tools.font==='Cómic'?'"Trebuchet MS",sans-serif':'system-ui,sans-serif';
 const cover=d.tools.images?.cover?'<figure><img alt="Portada" src="'+safe(d.tools.images.cover)+'"></figure>':'';
 const author=d.tools.author?'<p>'+safe(d.tools.author)+'</p>':'';
 const closing=d.tools.action?'<footer><p>'+inline(d.tools.action)+'</p></footer>':'';
 return '<!doctype html><html lang="es"><head><meta charset="utf-8"><title>'+safe(d.title)+'</title><style>@page{size:'+formats[e.format][1]+';margin:16mm}*{box-sizing:border-box}body{color:#192c40;background:white;font:'+e.bodySize+'px/'+e.lineHeight+' '+font+';margin:auto;max-width:900px;padding:20px}h1{font-size:'+e.titleSize+'px;line-height:1.15}h1,h2{break-after:avoid}header{text-align:center}section,p{text-align:'+e.align+'}section{margin:1.4em 0}p{white-space:normal;overflow-wrap:anywhere}figure{margin:20px 0;break-inside:avoid}img,svg{max-width:100%;max-height:75vh;display:block;margin:auto}img{object-fit:contain}button{font:inherit;padding:10px 20px}nav{text-align:center}@media print{nav{display:none}body{padding:0}section{break-inside:auto}}</style></head><body><nav><button id="print">Imprimir / guardar PDF</button></nav><header><h1>'+safe(d.title)+'</h1><p>'+safe(d.subtitle)+'</p>'+author+cover+'</header>'+contents+closing+'<script>document.getElementById("print").onclick=function(){window.print()};<\/script></body></html>';
}
function outputCSS(d){
 const e=editorial(d.tools.editorial);
 let css='\n/* Tipografía y composición del Club */\n.ck-public .ck-panel p,.ck-public .ck-leaf p{font-size:'+e.bodySize+'px;line-height:'+e.lineHeight+';text-align:'+e.align+'}.ck-public header h1,.ck-public .ck-front>h2{font-size:clamp(22px,5vw,'+e.titleSize+'px)}.ck-public .ck-panel h2{line-height:1.25}.ck-public.ck-historietas .ck-pages{gap:'+e.gap+'px;grid-template-columns:repeat('+e.columns+',minmax(0,1fr))}@media(max-width:560px){.ck-public.ck-historietas .ck-pages{grid-template-columns:1fr}}';
 if(d.kind==='flyers'&&e.format!=='auto'){
  const ratio={a4:'210/297',oficio:'210/333.3',horizontal:'297/210',cuadrado:'1'}[e.format];
  css+=' .ck-public.ck-flyers main{width:min(100%,900px);aspect-ratio:'+ratio+';padding:clamp(15px,4vw,42px)}';
 }
 d.tools.perScene.forEach((s,i)=>{
  const x=sceneStyle(s.editor),key='.ck-public [data-suite-scene="'+i+'"]';
  css+=' '+key+'{border-width:'+x.border+'px}'+key+' .ck-face,'+key+' .ck-anim-char{font-size:'+x.actorSize+'px}'+key+' .ck-speech,'+key+' .ck-anime-bubble{background:'+x.bubbleColor+';color:'+x.textColor+'}'+key+' .ck-speech p,'+key+' .ck-anime-bubble p{color:'+x.textColor+'}';
  if(x.side==='left')css+=key+' .ck-panel-art,'+key+' .ck-anime-scene{flex-direction:row-reverse}';
  if(x.motion!=='inherit')css+=key+' .ck-anim-char{animation-name:'+(x.motion==='still'?'none':x.motion)+';animation-duration:'+Math.max(1,(x.seconds??d.tools.sceneSeconds)/2)+'s}';
 });
 css+=' @media print{@page{size:'+formats[e.format][1]+';margin:15mm}.ck-public .ck-pagination,.ck-public .ck-book-reader button{display:none!important}.ck-public .ck-leaf[hidden]{display:block!important}}';
 return css;
}
const API={editorial,sceneStyle,findText,replaceText,words,plainText,printMarkup,outputCSS};
window.ClubWorkshopSuite=API;
if(!T)return;
const baseNormalize=T.normalize,baseEnhance=T.enhance,baseRender=T.render;
T.normalize=function(raw){const d=baseNormalize(raw);d.tools.editorial=editorial(raw?.tools?.editorial);d.tools.perScene=d.tools.perScene.map((p,i)=>({...p,editor:sceneStyle(raw?.tools?.perScene?.[i]?.editor)}));return d;};
T.enhance=function(raw,files){
 const d=T.normalize(raw),out=baseEnhance(d,files);
 if(['historietas','animes'].includes(d.kind)){
  let index=0;
  out['index.html']=out['index.html'].replace(/<article class="ck-panel (ck-comic|ck-anime)"/g,(all)=>{const i=index++;return all+' data-suite-scene="'+i+'" data-duration="'+(d.tools.perScene[i].editor.seconds??d.tools.sceneSeconds)+'"';});
  if(d.kind==='animes')out['script.js']=out['script.js'].replace('timer=window.setTimeout(()=>{turn(1);queue()},delay);','timer=window.setTimeout(()=>{turn(1);queue()},Number(pages[page].dataset.duration||delay/1000)*1000);');
 }
 out['style.css']+=outputCSS(d);out['obra.json']=JSON.stringify(d);return out;
};
if(!S||typeof document==='undefined')return;
const button=(label,fn)=>{const b=document.createElement('button');b.type='button';b.className='su-button';b.textContent=label;b.onclick=fn;return b;};
function field(label,value,options,onChange){
 const wrap=document.createElement('label');wrap.className='su-field';const name=document.createElement('span');name.textContent=label;
 const input=document.createElement(options.values?'select':'input');input.setAttribute('aria-label',label);
 if(options.values)for(const [v,t] of options.values)input.add(new Option(t,v));
 else{input.type=options.type||'number';for(const prop of ['min','max','step'])if(options[prop]!=null)input[prop]=String(options[prop]);}
 input.value=String(value??'');if(options.placeholder)input.placeholder=options.placeholder;input.onchange=()=>onChange(input.value);wrap.append(name,input);return wrap;
}
function download(name,value,type){const url=URL.createObjectURL(new Blob([value],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function fileName(s){return String(s.title||'mi-obra').replace(/[^\p{L}\p{N} -]/gu,'').trim().replace(/\s+/g,'-').slice(0,65)||'mi-obra';}
function liveWork(s){return T.normalize(JSON.parse(s.files['obra.json']));}
function textArea(work){return work.querySelector('#ck-scenes .ck-scene:not([hidden]) textarea');}
function searchControls(getArea,s){
 const details=document.createElement('details');details.className='su-search';
 const summary=document.createElement('summary');summary.textContent='Buscar y reemplazar';details.append(summary);
 const body=document.createElement('div');body.className='su-search-fields';
 const query=document.createElement('input');query.placeholder='Texto que buscás';query.setAttribute('aria-label','Buscar texto');
 const replacement=document.createElement('input');replacement.placeholder='Texto nuevo';replacement.setAttribute('aria-label','Reemplazar por');
 const match=document.createElement('label'),caseBox=document.createElement('input');caseBox.type='checkbox';match.append(caseBox,document.createTextNode('Distinguir mayúsculas'));
 const status=document.createElement('span');status.setAttribute('role','status');
 const find=()=>{
  const area=getArea();if(!area||!query.value)return;
  const p=findText(area.value,query.value,area.selectionEnd,caseBox.checked);
  if(p<0){status.textContent='No se encontró ese texto.';return;}
  area.focus();area.setSelectionRange(p,p+query.value.length);status.textContent='Coincidencia seleccionada.';
 };
 const replace=all=>{
  const area=getArea();if(!area||area.readOnly||s.busy||!s.cloudReady||!query.value)return;
  const before=area.value;s.checkpoint();
  if(all){const result=replaceText(before,query.value,replacement.value,caseBox.checked);area.value=result.text;status.textContent=result.count+' reemplazos.';}
  else{
   const selected=area.value.slice(area.selectionStart,area.selectionEnd);
   if((caseBox.checked?selected:selected.toLocaleLowerCase('es'))!==(caseBox.checked?query.value:query.value.toLocaleLowerCase('es'))){find();return;}
   area.setRangeText(replacement.value,area.selectionStart,area.selectionEnd,'end');status.textContent='Coincidencia reemplazada.';
  }
  if(area.maxLength>0&&area.value.length>area.maxLength){area.value=before;status.textContent='El texto nuevo supera el espacio de esta parte.';return;}
  area.dispatchEvent(new Event('input',{bubbles:true}));
 };
 body.append(query,replacement,match,button('Buscar siguiente',find),button('Reemplazar',()=>replace(false)),button('Reemplazar todos',()=>replace(true)),status);details.append(body);
 query.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();find();}};return details;
}
T.render=function(work,s,raw,onChange){
 const apply=updated=>{if(s.busy||!s.cloudReady)return false;s.checkpoint();return onChange(updated);};
 baseRender(work,s,raw,apply);
 const d=T.normalize(raw),host=work.querySelector('#ck-specific-tools');if(!host)return;
 if(!work.dataset.suiteFocus){work.dataset.suiteFocus='true';work.addEventListener('focusin',e=>{if(e.target.matches('textarea[name],input[name]')&&!s.busy&&s.cloudReady)s.checkpoint();});}
 if(d.kind==='dibujos')return;
 const box=document.createElement('section');box.className='su-editorial';box.setAttribute('aria-label','Composición y tipografía');
 const heading=document.createElement('h3');heading.textContent='Composición y tipografía';box.append(heading);
 const change=(key,value)=>{const next=liveWork(s);next.tools.editorial[key]=value;apply(next);};
 const e=d.tools.editorial;
 box.append(field('Tamaño del texto',e.bodySize,{min:12,max:36,step:1},v=>change('bodySize',Number(v))),
  field('Tamaño del título',e.titleSize,{min:22,max:80,step:1},v=>change('titleSize',Number(v))),
  field('Interlineado',e.lineHeight,{min:1.1,max:2.3,step:.1},v=>change('lineHeight',Number(v))),
  field('Alineación del texto',e.align,{values:[['left','Izquierda'],['center','Centrado'],['right','Derecha'],['justify','Justificado']]},v=>change('align',v)),
  field('Formato al imprimir',e.format,{values:Object.entries(formats).map(([k,v])=>[k,v[0]])},v=>change('format',v)));
 if(d.kind==='historietas')box.append(field('Viñetas por fila',e.columns,{min:1,max:3,step:1},v=>change('columns',Number(v))),field('Separación de viñetas',e.gap,{min:4,max:40,step:1},v=>change('gap',Number(v))));
 host.append(box);
 const format=host.querySelector('.ct-format');
 if(format){
  const count=document.createElement('span');count.className='su-word-count';count.setAttribute('role','status');
  const update=()=>{const area=textArea(work);if(area)count.textContent=words(area.value)+' palabras · '+area.value.length+' caracteres · lectura aprox. '+Math.max(1,Math.ceil(words(area.value)/180))+' min';};
  for(const a of work.querySelectorAll('#ck-scenes textarea'))a.addEventListener('input',update);
  work.querySelector('#ck-part')?.addEventListener('change',update);
  format.append(count,searchControls(()=>textArea(work),s));queueMicrotask(update);
  const exports=document.createElement('div');exports.className='su-export';
  exports.append(button('Descargar texto',()=>download(fileName(s)+'.txt',plainText(liveWork(s)),'text/plain;charset=utf-8')),
   button('Imprimir / PDF',()=>{const tab=window.open('about:blank','_blank');if(!tab){alert('Permití abrir la vista de impresión para guardar el PDF.');return;}tab.opener=null;tab.document.open();tab.document.write(printMarkup(liveWork(s)));tab.document.close();}));
  format.append(exports);
 }
 if(['historietas','animes'].includes(d.kind))work.querySelectorAll('.ck-scene').forEach((section,i)=>{
  const x=d.tools.perScene[i].editor,fields=document.createElement('div');fields.className='ct-scene-tools su-scene';
  const set=(key,value)=>{const next=liveWork(s);next.tools.perScene[i].editor[key]=value;apply(next);};
  fields.append(field('Globo a la',x.side,{values:[['right','Derecha'],['left','Izquierda']]},v=>set('side',v)),field('Color del globo',x.bubbleColor,{type:'color'},v=>set('bubbleColor',v)),field('Color del diálogo',x.textColor,{type:'color'},v=>set('textColor',v)),field('Tamaño del personaje',x.actorSize,{min:35,max:140,step:1},v=>set('actorSize',Number(v))),field('Grosor del marco',x.border,{min:0,max:10,step:1},v=>set('border',Number(v))));
  if(d.kind==='animes'){
   fields.append(field('Duración de esta escena',x.seconds,{min:1,max:30,step:.5,placeholder:'General: '+d.tools.sceneSeconds+' s'},v=>set('seconds',v===''?null:Number(v))),field('Movimiento de este personaje',x.motion,{values:[['inherit','Usar el movimiento general'],['float','Flotar'],['slide','Deslizar'],['zoom','Zoom suave'],['still','Quieto']]},v=>set('motion',v)));
   const hint=document.createElement('small');hint.textContent='Dejá la duración vacía para usar el tiempo general.';fields.append(hint);
  }
  section.append(fields);
 });
};

// Historial en memoria: aislado por alumno/proyecto y acotado para las PC del Club.
let redo=[],historyOwner='',movingHistory=false,blockClipboard=null;
const sameFiles=(a,b)=>!!a&&!!b&&Object.keys(a).length===Object.keys(b).length&&Object.keys(a).every(k=>a[k]===b[k]);
function identity(s){return (typeof s.sid==='function'?s.sid():'')+'|'+s.projectId;}
function historyScope(s){const id=identity(s);if(historyOwner!==id){historyOwner=id;redo=[];blockClipboard=null;}}
function trimHistory(list){let total=0;return list.slice(-30).reverse().filter(entry=>{total+=Object.values(entry).reduce((n,v)=>n+String(v).length,0);return total<=5000000;}).reverse();}
function updateHistory(s){
 if(typeof document==='undefined')return;
 document.querySelectorAll('[data-suite-undo]').forEach(b=>b.disabled=s.busy||!s.cloudReady||!s.undo?.some(f=>!sameFiles(f,s.files)));
 document.querySelectorAll('[data-suite-redo]').forEach(b=>b.disabled=s.busy||!s.cloudReady||!redo.length);
}
S.checkpoint=function(){historyScope(this);this.undo=this.undo||[];if(!sameFiles(this.undo[this.undo.length-1],this.files))this.undo=trimHistory([...this.undo,{...this.files}]);updateHistory(this);const b=document.getElementById('ks-undo');if(b)b.disabled=false;};
const priorChanged=S.changed,priorRestore=S.restore;
S.changed=function(){historyScope(this);if(!movingHistory)redo=[];const out=priorChanged.apply(this,arguments);updateHistory(this);return out;};
S.restore=function(){
 historyScope(this);if(this.busy||!this.cloudReady)return;
 while(this.undo?.length&&sameFiles(this.undo[this.undo.length-1],this.files))this.undo.pop();
 if(!this.undo?.length){updateHistory(this);return;}
 redo=trimHistory([...redo,{...this.files}]);movingHistory=true;
 try{return priorRestore.apply(this,arguments);}finally{movingHistory=false;updateHistory(this);}
};
function redoAction(s){
 historyScope(s);if(s.busy||!s.cloudReady||!redo.length)return;
 const files=redo.pop();s.undo=trimHistory([...(s.undo||[]),{...s.files}]);movingHistory=true;
 try{s.files=files;if(window.ClubKrueka?.isCreative(s))s.title=liveWork(s).title;s.changed();s.refreshAll();if(s.tab==='club-work')s.showTab('club-work');s.lock(false);}
 finally{movingHistory=false;updateHistory(s);}
}
function historyBar(target,s){
 if(!target||target.querySelector('.su-history'))return;
 const details=document.createElement('details');details.className='su-history';const title=document.createElement('summary');title.textContent='Historial';details.append(title);
 const menu=document.createElement('div');const undo=button('Deshacer',()=>s.restore()),next=button('Rehacer',()=>redoAction(s));undo.dataset.suiteUndo='true';next.dataset.suiteRedo='true';
 const tip=document.createElement('small');tip.textContent='Hasta 30 pasos durante esta sesión.';menu.append(undo,next,tip);details.append(menu);target.append(details);updateHistory(s);
}
function codeToolbar(area,s){
 if(!area||area.dataset.suiteCode)return;area.dataset.suiteCode='true';
 const bar=document.createElement('div');bar.className='su-code-tools';
 const row=document.createElement('div');row.className='su-code-actions';
 const mutate=fn=>{if(s.busy||!s.cloudReady||area.readOnly)return;s.checkpoint();fn();area.dispatchEvent(new Event('input',{bubbles:true}));area.focus();};
 const lineStart=()=>area.selectionStart>0?area.value.lastIndexOf('\n',area.selectionStart-1)+1:0;
 row.append(button('Duplicar línea',()=>mutate(()=>{const a=lineStart(),next=area.value.indexOf('\n',area.selectionEnd),b=next<0?area.value.length:next;area.setRangeText('\n'+area.value.slice(a,b),b,b,'end');})),
  button('Sangrar',()=>mutate(()=>{const a=lineStart(),b=area.selectionEnd;area.setRangeText(area.value.slice(a,b).split('\n').map(line=>'  '+line).join('\n'),a,b,'select');})),
  button('Quitar sangría',()=>mutate(()=>{const a=lineStart(),b=area.selectionEnd;area.setRangeText(area.value.slice(a,b).replace(/^(?: {1,2}|\t)/gm,''),a,b,'select');})));
 const size=field('Letra del código',15,{values:[[13,'13 px'],[15,'15 px'],[18,'18 px'],[21,'21 px']]},v=>area.style.fontSize=v+'px');
 const wrap=button('Ajustar líneas',()=>{const soft=area.wrap==='off'||getComputedStyle(area).whiteSpace==='pre';area.wrap=soft?'soft':'off';area.style.whiteSpace=soft?'pre-wrap':'pre';area.style.overflowWrap=soft?'anywhere':'normal';wrap.setAttribute('aria-pressed',String(soft));});wrap.setAttribute('aria-pressed',String(getComputedStyle(area).whiteSpace!=='pre'));
 const position=document.createElement('span');position.className='su-code-position';
 const showPosition=()=>{const before=area.value.slice(0,area.selectionStart),lines=before.split('\n');position.textContent='Línea '+lines.length+' · Columna '+(lines.at(-1).length+1)+' · '+area.value.split('\n').length+' líneas';};
 area.addEventListener('keyup',showPosition);area.addEventListener('click',showPosition);area.addEventListener('input',showPosition);showPosition();
 row.append(size,wrap,position);bar.append(row,searchControls(()=>area,s));area.before(bar);
 if(area.id==='kp-program-editor'){
  const selector=document.createElement('select');selector.setAttribute('aria-label','Archivo del proyecto');
  const reloadFiles=()=>{const current=document.getElementById('kp-program-filename')?.textContent;selector.replaceChildren(...Object.keys(s.files).map(name=>new Option(name,name)));selector.value=current||'index.html';};
  reloadFiles();selector.onfocus=reloadFiles;selector.onchange=()=>{window.StudioProgramacion?.choose(s,selector.value);showPosition();};row.prepend(selector);
 }
}
function blockTools(s){
 const host=document.getElementById('kb-shell'),steps=host?.querySelector('#kb-steps');if(!steps||!window.StudioBloques?.isBlocks(s))return;
 const lane=()=>host.querySelector('#kb-lanes [aria-selected="true"]')?.dataset.lane;
 const message=t=>{host.querySelector('#kb-status').textContent=t;};
 const change=fn=>{if(s.busy||!s.cloudReady)return;const data=StudioBloques.clean(JSON.parse(s.files['bloques.json']));try{if(fn(data)===false)return;const files=s.validFiles({...s.files,...StudioBloques.filesFor(data)});s.checkpoint();s.files=files;s.changed();s.refreshAll();message('Cambios pendientes de guardar…');}catch(e){message(e.message);}};
 if(!host.querySelector('.su-block-actions')){
  const bar=document.createElement('div');bar.className='su-block-actions';
  bar.append(button('Copiar evento',()=>{historyScope(s);const data=StudioBloques.clean(JSON.parse(s.files['bloques.json']));blockClipboard=JSON.parse(JSON.stringify(data.events[lane()]||[]));message(blockClipboard.length+' bloques copiados. Elegí el evento de destino y pegá.');}),
   button('Pegar en este evento',()=>change(data=>{const list=data.events[lane()];if(!blockClipboard?.length){message('Primero copiá un evento.');return false;}if(list.length+blockClipboard.length>35){message('Este evento no tiene espacio para todos los bloques.');return false;}list.push(...blockClipboard.map((item,i)=>({...item,id:'copia-'+Date.now().toString(36)+'-'+i})));})));steps.before(bar);
 }
 for(const item of steps.querySelectorAll('.kb-step'))if(!item.querySelector('[data-suite-duplicate]')){
  const duplicate=button('Duplicar',()=>change(data=>{const list=data.events[lane()],index=Number(item.dataset.index);if(list.length>=35){message('Este evento ya tiene 35 bloques.');return false;}list.splice(index+1,0,{...list[index],id:'copia-'+Date.now().toString(36)});}));duplicate.dataset.suiteDuplicate='true';item.querySelector('.kb-step-actions').append(duplicate);
 }
 if(!steps.dataset.suiteObserved){steps.dataset.suiteObserved='true';new MutationObserver(()=>{if(steps.isConnected&&StudioBloques.isBlocks(s))blockTools(s);}).observe(steps,{childList:true,subtree:true});}
}
function mount(s){
 historyScope(s);
 const root=document.getElementById('krueka-studio');if(!root)return;
 for(const selector of ['.ks-top','.kp-program-actions','.kb-actions'])historyBar(root.querySelector(selector),s);
 for(const id of ['ks-editor','kp-program-editor','kp-python-editor'])codeToolbar(document.getElementById(id),s);
 blockTools(s);updateHistory(s);
}
for(const name of ['showTab','refreshAll','renderCreator','toggleCode']){
 const prior=S[name];if(typeof prior!=='function')continue;
 S[name]=function(){const result=prior.apply(this,arguments);mount(this);return result;};
}
const priorClose=S.close;
S.close=async function(){const result=await priorClose.apply(this,arguments);if(!document.getElementById('krueka-studio')){redo=[];blockClipboard=null;historyOwner='';}return result;};
document.addEventListener('keydown',e=>{
 if(!(e.ctrlKey||e.metaKey)||e.altKey||!document.getElementById('krueka-studio')||e.target.closest('input,textarea,[contenteditable="true"],canvas'))return;
 if(e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redoAction(S):S.restore();}
 else if(e.key.toLowerCase()==='y'){e.preventDefault();redoAction(S);}
});
Object.assign(API,{mount,redo:()=>redoAction(S)});
})();
