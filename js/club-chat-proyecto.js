/* Contexto del chat del alumno. Sólo lee el proyecto que está abierto. */
(function(){
'use strict';
let selection=null,scope='',owner='',root=null;
function identity(s){return s.sid()+'|'+s.projectId;}
function reset(s){if(owner!==identity(s)){owner=identity(s);selection=null;scope='';}}
function recordSelection(e){
 const s=window.StudioIA,el=e.target;
 if(!s||el.tagName!=='TEXTAREA'||!el.closest('#krueka-studio'))return;
 const panel=/^panel-text-(\d+)$/.exec(el.name);
 if(!panel&&!['ks-editor','kp-program-editor','kp-python-editor'].includes(el.id))return;
 reset(s);
 const start=el.selectionStart,end=el.selectionEnd;
 if(end<=start)return;
 const key=panel?'part:'+panel[1]:el.id==='kp-python-editor'?'codigo-python.txt':el.id==='kp-program-editor'?document.getElementById('kp-program-filename')?.textContent:s.current;
 if(!key)return;
 selection={key,start,end,text:el.value.slice(start,end)};
 scope='selection';
}
function work(s){try{const d=JSON.parse(s.files['obra.json']);return Array.isArray(d?.panels)&&d.panels.length&&typeof d.kind==='string'?d:null;}catch(e){return null;}}
function source(s,d,key){return key.startsWith('part:')?d?.panels[Number(key.slice(5))]?.text:s.files[key];}
function readable(k,v){return /\.(html|css|js|json|txt|md|svg)$/i.test(k)&&!(/(?:data:[\w/+.-]+;base64,|blob:)/i.test(v));}
function selectScope(s,d){
 reset(s);
 if(scope==='selection'&&selection&&source(s,d,selection.key)?.slice(selection.start,selection.end)===selection.text)return selection.key;
 if(scope==='selection'){selection=null;scope='';}
 return scope;
}
function inspect(s){
 const d=work(s),key=selectScope(s,d),sel=scope==='selection'?selection:null;
 const model=window.StudioKits?.read(s.files),names=Object.keys(s.files);
 const files=Object.create(null);
 const title=String(d?.title||s.title||'Mi proyecto');
 let description=title,info='',evidence='',apply;
 if(d){
  const part=key.startsWith('part:')?Number(key.slice(5)):null;
  const indexes=part===null?d.panels.map((_,i)=>i):[part];
  const data={kind:d.kind,title:d.title,subtitle:d.subtitle,color:d.color,art:d.art,panels:indexes.map(i=>({...d.panels[i]}))};
  if(sel)data.panels[0].text=sel.text;
  const toolKeys=['layout','backdrop','ink','brush','coloringPage','templateColors','stamps','perScene'];
  data.tools=Object.fromEntries(toolKeys.filter(k=>d.tools?.[k]!==undefined).map(k=>[k,d.tools[k]]));
  if(part!==null&&data.tools.perScene)data.tools.perScene=[data.tools.perScene[part]];
  const first=data.panels.find(p=>p.text.trim());
  evidence=first?'Texto de la obra: «'+first.text.trim().slice(0,160)+'».':'Esta parte todavía está vacía.';
  if(d.kind==='dibujos')evidence='Fondo '+d.tools?.backdrop+' y tinta '+d.tools?.ink+'.';
  const path='obra.json';files[path]=JSON.stringify(data,null,2);
  description=d.kind+' · '+title+(sel?' · fragmento seleccionado':part===null?' · obra completa':' · parte '+(part+1));
  info=d.panels.length+' partes · '+d.panels.reduce((n,p)=>n+(p.text.trim()?p.text.trim().split(/\s+/).length:0),0)+' palabras';
  if(d.kind==='dibujos')info+=' · '+(d.tools?.strokes?.length||0)+' trazos · '+(d.tools?.stamps?.length||0)+' objetos';
  apply=edits=>{
   if(Object.keys(edits).some(k=>k!==path))throw Error('El cambio debe corresponder a tu obra.');
   const next=JSON.parse(edits[path]);
   if(next.kind!==data.kind||!Array.isArray(next.panels)||next.panels.length!==indexes.length||!next.tools)throw Error('El cambio alteraría la estructura de tu obra.');
   const updated=JSON.parse(JSON.stringify(d));
   for(const k of ['title','subtitle','color','art']){if(typeof next[k]!=='string')throw Error('La respuesta de la obra está incompleta.');if(!sel&&part===null)updated[k]=next[k];}
   indexes.forEach((idx,j)=>{const p=next.panels[j];if(typeof p?.title!=='string'||typeof p.text!=='string')throw Error('La IA devolvió una parte incompleta.');
    updated.panels[idx]=sel?{...d.panels[idx],text:d.panels[idx].text.slice(0,sel.start)+p.text+d.panels[idx].text.slice(sel.end)}:{title:p.title,text:p.text};});
   if(!sel)for(const k of Object.keys(data.tools).filter(k=>part===null||k==='perScene')){if(!Object.hasOwn(next.tools,k))throw Error('La IA quitó una herramienta de la obra.');
    if(k==='perScene'&&part!==null)updated.tools[k][part]=next.tools[k][0];else updated.tools[k]=next.tools[k];}
   const built=window.ClubKrueka.build(updated);
   return {...s.files,...built};
  };
 }else if(model&&['animation','video-edit'].includes(model.kind)){
  const field=model.kind==='animation'?'actors':'clips';
  const media=JSON.parse(JSON.stringify(model));
  const items=model[field],index=key.startsWith('scene:')?Number(key.slice(6)):null;
  const selected=index===null?items:[items[index]];
  media[field]=selected.map(({image,source,...item})=>item);
  files['escenas.json']=JSON.stringify(media,null,2);
  const first=selected[0];if(first)evidence=field==='clips'?'Escena «'+first.title+'», duración '+first.duration+' s.':'Personaje «'+first.name+'», '+first.frames.length+' poses.';
  description=model.kind+' · '+title+(index===null?' · proyecto':' · '+(selected[0].title||selected[0].name));
  info=items.length+(field==='clips'?' escenas':' personajes')+' · '+(model.duration||items.reduce((n,c)=>n+(c.duration||0),0))+' segundos';
  apply=edits=>{
   if(Object.keys(edits).some(k=>k!=='escenas.json'))throw Error('Elegí un cambio sobre las escenas.');
   const next=JSON.parse(edits['escenas.json']);
   if(next.kind!==model.kind||!Array.isArray(next[field])||next[field].length!==selected.length||new Set(next[field].map(c=>c.id)).size!==selected.length)throw Error('La respuesta alteraría los recursos del montaje.');
   const restored=next[field].map(item=>{
    const old=selected.find(c=>c.id===item.id);if(!old)throw Error('La respuesta cambió un recurso del proyecto.');
    return field==='clips'?{...item,type:old.type,image:old.image,source:old.source}:item;
   });
   const updated=index===null?{...next,[field]:restored}:{...model,[field]:items.map((it,i)=>i===index?restored[0]:it)};
   return {...s.files,'game-config.js':window.StudioKits.configFile(window.StudioMedia.clean(updated))};
  };
 }else{
  const python=window.StudioPython?.isPython(s);
  const available=names.filter(k=>readable(k,s.files[k])&&(!python||k==='codigo-python.txt'));
  const ordered=[...new Set([key,'game-config.js','ficha-programacion-3d.json',s.current,'index.html',...available])].filter(k=>available.includes(k));
  let total=0;
  for(const k of ordered){
   const v=s.files[k];if(k===key&&sel){files[k]=sel.text;total+=sel.text.length;continue;}
   if(total+v.length<=59000){files[k]=v;total+=v.length;}
  }
  if(key&&!Object.hasOwn(files,key))throw Error('Ese archivo es grande. Seleccioná el fragmento que querés revisar en el editor.');
  description=(model?.kind||'Programación web')+' · '+title+(sel?' · fragmento de '+key:key?' · '+key:' · proyecto');
  info=Object.keys(files).join(', ');
  const sample=sel?.text||files[key]||files['codigo-python.txt']||files['game-config.js']||files['index.html'];
  if(sample)evidence='Fragmento: '+sample.trim().slice(0,160);
  apply=edits=>{
   if(Object.keys(edits).some(k=>(key&&k!==key)||(Object.hasOwn(s.files,k)&&!Object.hasOwn(files,k))))throw Error('La respuesta modificaba un archivo fuera de la consulta.');
   if(sel)edits={...edits,[key]:s.files[key].slice(0,sel.start)+edits[key]+s.files[key].slice(sel.end)};
   const merged={...s.files,...edits};
   if(python){if(Object.keys(edits).some(k=>k!=='codigo-python.txt'))throw Error('El cambio debe pertenecer al código Python.');merged['script.js']=window.StudioPython.bootstrap(merged['codigo-python.txt']);}
   return merged;
  };
 }
 const constrained=model&&['animation','video-edit'].includes(model.kind)?'escenas.json':window.StudioPython?.isPython(s)?'codigo-python.txt':key;
 return {files,description,info,evidence,apply,key:constrained,creative:!!d,selection:!!sel};
}
function mount(s){
 const section=document.getElementById('ks-ai');if(!section)return;
 reset(s);
 if(root?.parentNode!==section){
  root=document.createElement('div');root.className='ks-class-tools';root.id='ks-project-context';
  const label=document.createElement('label');label.textContent='Leer ';const select=document.createElement('select');select.setAttribute('aria-label','Parte del proyecto que lee el chat');label.append(select);
  const review=document.createElement('button');review.className='ks-btn';review.type='button';review.textContent='Revisar mi trabajo';
  root.append(label,review);section.insertBefore(root,section.querySelector('.ks-modes'));
  select.onchange=()=>{scope=select.value;};
  review.onclick=async()=>{
   if(s.busy||!s.cloudReady)return;
   try{const ctx=inspect(s);
    if(!s.aiReady){s.say('sys','Revisión local de '+ctx.description+'\n'+ctx.info+'\n'+ctx.evidence+'\nLa evaluación con IA estará disponible al conectar el proveedor.');s.changed();await s.save();return;}
    const help=document.getElementById('ks-help-mode');if(help&&help.value!=='ai'){help.value='ai';help.dispatchEvent(new Event('change'));}
    s.setMode('plan');const q=document.getElementById('ks-prompt');
    if(!q.value.trim())q.value='Revisá esta parte de mi proyecto. Citá algo concreto que ya funciona y proponé una mejora que pueda probar.';
    await s.send();
   }catch(e){s.say('sys',e.message);}
  };
  document.addEventListener('select',recordSelection,true);
 }
 const d=work(s),select=root.querySelector('select');selectScope(s,d);
 const options=[['','Proyecto completo']];
 if(selection)options.push(['selection','Mi selección']);
 if(d)d.panels.forEach((p,i)=>options.push(['part:'+i,(p.title||'Parte '+(i+1)).slice(0,50)]));
 else if(['animation','video-edit'].includes(window.StudioKits?.read(s.files)?.kind)){
  const m=window.StudioKits.read(s.files);(m.actors||m.clips).forEach((item,i)=>options.push(['scene:'+i,item.title||item.name]));
 }else if(window.StudioPython?.isPython(s))options.push(['codigo-python.txt','Código Python']);
 else Object.keys(s.files).filter(k=>readable(k,s.files[k])).forEach(k=>options.push([k,k]));
 if(!options.some(x=>x[0]===scope))scope='';
 select.replaceChildren(...options.map(([v,t])=>new Option(t,v)));select.value=scope;
 select.disabled=root.querySelector('button').disabled=s.busy||!s.cloudReady;
 const intro=section.querySelector('.ks-onboard');
 if(intro&&(d||['animation','video-edit'].includes(window.StudioKits?.read(s.files)?.kind))){
  intro.replaceChildren();const b=document.createElement('b');b.textContent=s.title;intro.append(b,document.createTextNode('Elegí una parte o seleccioná texto en el editor. Pedí una revisión o explicá qué querés cambiar.'));
 }
}
window.ClubProjectChat={inspect,mount,resetSelection(){selection=null;scope='';owner='';}};
})();
