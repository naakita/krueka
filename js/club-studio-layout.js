/* Distribución del taller: cambia el espacio disponible sin reconstruir la obra ni su iframe. */
(function(){
 'use strict';
 if(window.ClubWorkspaceLayout||!window.StudioIA)return;
 const KEY='krueka.workspace.layout.v1';
 const defaults={main:44,program:50,blocks:62,live:50};
 let controller=null;

 function normalise(value,fallback=44){
  const number=Number(value?.ratio);
  return {ratio:Number.isFinite(number)?Math.max(20,Math.min(80,number)):fallback,reverse:value?.reverse===true};
 }
 function readPreferences(){
  let saved={};
  try{saved=JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch(_e){}
  return Object.fromEntries(Object.entries(defaults).map(([key,ratio])=>[key,normalise(saved[key],ratio)]));
 }
 function savePreferences(preferences){
  // Solamente porcentajes y orden visual. Nunca contenido, sesiones ni identificadores de alumnos.
  const safe=Object.fromEntries(Object.entries(defaults).map(([key,ratio])=>[key,normalise(preferences[key],ratio)]));
  try{localStorage.setItem(KEY,JSON.stringify(safe));}catch(_e){}
 }
 function pointerRatio(position,start,size,reverse){
  if(!Number.isFinite(size)||size<=14)return 50;
  const value=(position-start-7)/(size-14)*100;
  return Math.max(20,Math.min(80,reverse?100-value:value));
 }

 function installSpace(panel){
  if(controller?.panel===panel)return controller;
  controller?.destroy();
  const preferences=readPreferences(),surfaces=new Map();
  let resizing=null;
  const small=()=>window.innerWidth<=780;
  const isNormal=()=>!['ck-studio-home','kc-home-active','ks-chat-focus','ck-club-gallery-open','kp-program-mode','kb-mode','ks-play-only'].some(name=>panel.classList.contains(name));

  function eligible(surface){
   if(surface.key==='main')return isNormal();
   if(surface.key==='program')return !surface.shell.hidden&&!surface.shell.classList.contains('kp-preview-only');
   if(surface.key==='blocks')return !surface.shell.hidden;
   return isNormal()&&panel.classList.contains('ks-live-edit-mode')&&surface.node.classList.contains('ks-live-code');
  }
  function exitLegacyFocus(surface){
   if(surface.key==='main'&&panel.classList.contains('ks-play-only'))panel.querySelector('#ks-play-space')?.click();
   if(surface.key==='program'&&surface.shell.classList.contains('kp-preview-only')){
    const python=surface.shell.querySelector('#kp-program-python-tab');
    const button=python&&!python.hidden?python:surface.shell.querySelector('[data-kp-file="'+(surface.lastFile||'index.html')+'"]');
    button?.click();
   }
  }
  function actualRatio(surface){
   const rect=surface.node.getBoundingClientRect(),span=(small()?rect.height:rect.width)-14;
   if(span<=0)return surface.preference.ratio;
   const minimum=small()?145:surface.key==='blocks'?380:230;
   const low=Math.min(42,Math.max(20,minimum/span*100));
   const high=100-Math.min(40,Math.max(20,(small()?145:230)/span*100));
   return Math.max(low,Math.min(high,surface.preference.ratio));
  }
  function apply(surface){
   const enabled=eligible(surface),axis=small()?'rows':'columns',ratio=actualRatio(surface),reverse=surface.preference.reverse;
   surface.node.classList.toggle('kc-split-enabled',enabled);
   surface.node.dataset.kcAxis=axis;surface.node.dataset.kcFocus=surface.focus;surface.node.dataset.kcReversed=String(reverse);
   surface.node.style.setProperty('--kc-first',(reverse?100-ratio:ratio)+'fr');
   surface.node.style.setProperty('--kc-last',(reverse?ratio:100-ratio)+'fr');
   surface.separator.hidden=!enabled||surface.focus!=='split';
   surface.separator.setAttribute('aria-orientation',small()?'horizontal':'vertical');
   surface.separator.setAttribute('aria-valuenow',String(Math.round(ratio)));
   surface.separator.setAttribute('aria-valuetext','Edición '+Math.round(ratio)+' por ciento; vista previa '+Math.round(100-ratio)+' por ciento');
   if(surface.tools){
    const legacy=surface.key==='main'&&panel.classList.contains('ks-play-only')||surface.key==='program'&&surface.shell.classList.contains('kp-preview-only');
    const activeFocus=legacy?'preview':surface.focus;
    surface.range.value=String(Math.round(ratio));
    surface.output.textContent='Edición '+Math.round(ratio)+' % · Vista previa '+Math.round(100-ratio)+' %';
    surface.swap.textContent=small()?(reverse?'Editor arriba':'Editor abajo'):(reverse?'Editor a la izquierda':'Editor a la derecha');
    surface.tools.querySelectorAll('[data-kc-focus]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.kcFocus===activeFocus)));
    surface.restore.hidden=activeFocus==='split';
    if(surface.key==='main')surface.tools.hidden=!isNormal()&&!legacy;
    if(surface.key==='live')surface.tools.hidden=!enabled;
   }
  }
  function update(surface,changes,persist=true){
   exitLegacyFocus(surface);
   if('focus' in changes)surface.focus=changes.focus;
   if('ratio' in changes)surface.preference.ratio=normalise({ratio:changes.ratio},defaults[surface.key]).ratio;
   if('reverse' in changes)surface.preference.reverse=changes.reverse===true;
   apply(surface);
   if(persist)savePreferences(preferences);
  }
  function cancelDrag(){
   if(!resizing)return;
   const drag=resizing;resizing=null;
   drag.surface.preference.ratio=drag.startRatio;apply(drag.surface);
   panel.classList.remove('kc-layout-dragging');
   try{drag.surface.separator.releasePointerCapture(drag.pointer);}catch(_e){}
  }
  function makeTools(surface,header,before){
   const tools=document.createElement('div');tools.className='kc-layout-tools';tools.dataset.workspace=surface.key;
   const details=document.createElement('details');details.className='kc-workspace-layout';
   const summary=document.createElement('summary');summary.textContent=surface.key==='live'?'Espacio del código':'Espacio de trabajo';
   const menu=document.createElement('div');menu.className='kc-layout-options';
   const heading=document.createElement('strong');heading.textContent='Distribución del espacio';
   const label=document.createElement('label');label.textContent='Espacio para editar';
   const range=document.createElement('input');range.type='range';range.min='20';range.max='80';range.step='1';range.setAttribute('aria-label',surface.key==='live'?'Espacio para el código':'Espacio para editar');
   label.append(range);
   const output=document.createElement('output');output.className='kc-layout-value';
   const hint=document.createElement('p');hint.textContent='También podés arrastrar el separador. Con el teclado, usá las flechas.';
   menu.append(heading,label,output);
   const button=(text,action)=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=()=>{action();details.open=false;summary.focus();};menu.append(b);return b;};
   const swap=button('Editor a la derecha',()=>update(surface,{reverse:!surface.preference.reverse,focus:'split'}));
   for(const [mode,text] of [['editor','Ampliar edición'],['preview','Ampliar vista previa'],['split','Mostrar ambos']]){
    const b=button(text,()=>update(surface,{focus:mode},false));b.dataset.kcFocus=mode;
   }
   button('Restablecer distribución',()=>update(surface,{ratio:defaults[surface.key],reverse:false,focus:'split'}));
   menu.append(hint);details.append(summary,menu);
   const restore=document.createElement('button');restore.type='button';restore.className='kc-layout-restore';restore.textContent='Restaurar';restore.title='Mostrar edición y vista previa';restore.setAttribute('aria-label','Mostrar edición y vista previa');restore.hidden=true;restore.onclick=()=>update(surface,{focus:'split'},false);
   tools.append(details,restore);header.insertBefore(tools,before||null);
   Object.assign(surface,{tools,range,output,swap,restore});
   range.addEventListener('input',()=>update(surface,{ratio:Number(range.value),focus:'split'}));
   details.addEventListener('toggle',()=>{
    if(!details.open)return;
    panel.querySelectorAll('.kc-workspace-layout').forEach(other=>{if(other!==details)other.open=false;});
    const r=summary.getBoundingClientRect();
    menu.style.left=Math.max(8,Math.min(r.left,window.innerWidth-316))+'px';
    menu.style.top=Math.min(r.bottom+6,Math.max(8,window.innerHeight-340))+'px';
   });
   details.addEventListener('keydown',event=>{if(event.key==='Escape'){event.stopPropagation();details.open=false;summary.focus();}});
  }
  function attach(key,node,editor,preview,header,shell,before){
   if(!node||!editor||!preview||surfaces.has(key))return;
   const surface={key,node,editor,preview,shell,focus:'split',preference:preferences[key],lastFile:'index.html'};
   node.classList.add('kc-split-surface');editor.classList.add('kc-split-editor');preview.classList.add('kc-split-preview');
   if(!editor.id)editor.id='kc-space-'+key+'-editor';
   if(!preview.id)preview.id='kc-space-'+key+'-preview';
   const separator=document.createElement('div');separator.className='kc-splitter';separator.tabIndex=0;separator.setAttribute('role','separator');
   separator.setAttribute('aria-label',key==='live'?'Separar código y vista previa':'Ajustar espacio de edición y vista previa');
   separator.setAttribute('aria-controls',editor.id+' '+preview.id);separator.setAttribute('aria-valuemin','20');separator.setAttribute('aria-valuemax','80');
   separator.title='Arrastrá para ampliar. Flechas: ajustar. Mayús + flechas: mover más. Doble clic: equilibrar.';
   const grip=document.createElement('span');grip.setAttribute('aria-hidden','true');separator.append(grip);node.append(separator);surface.separator=separator;
   surfaces.set(key,surface);
   if(header)makeTools(surface,header,before);
   separator.addEventListener('pointerdown',event=>{
    if(event.button!==0||resizing)return;
    event.preventDefault();separator.focus();
    resizing={surface,pointer:event.pointerId,startRatio:surface.preference.ratio};
    panel.classList.add('kc-layout-dragging');separator.setPointerCapture(event.pointerId);
   });
   separator.addEventListener('pointermove',event=>{
    if(!resizing||resizing.surface!==surface||resizing.pointer!==event.pointerId)return;
    const rect=node.getBoundingClientRect();
    update(surface,{ratio:pointerRatio(small()?event.clientY:event.clientX,small()?rect.top:rect.left,small()?rect.height:rect.width,surface.preference.reverse)},false);
   });
   separator.addEventListener('pointerup',event=>{
    if(!resizing||resizing.surface!==surface||resizing.pointer!==event.pointerId)return;
    resizing=null;panel.classList.remove('kc-layout-dragging');savePreferences(preferences);
    try{separator.releasePointerCapture(event.pointerId);}catch(_e){}
   });
   separator.addEventListener('pointercancel',cancelDrag);
   separator.addEventListener('lostpointercapture',()=>{if(resizing?.surface===surface)cancelDrag();});
   separator.addEventListener('dblclick',()=>update(surface,{ratio:50,focus:'split'}));
   separator.addEventListener('keydown',event=>{
    if(event.key==='Escape'){if(resizing)cancelDrag();else update(surface,{focus:'split'},false);return;}
    let ratio=actualRatio(surface),step=event.shiftKey?10:2,sign=surface.preference.reverse?-1:1;
    if(event.key==='Home')ratio=20;
    else if(event.key==='End')ratio=80;
    else if(event.key===(small()?'ArrowUp':'ArrowLeft'))ratio-=step*sign;
    else if(event.key===(small()?'ArrowDown':'ArrowRight'))ratio+=step*sign;
    else return;
    event.preventDefault();update(surface,{ratio,focus:'split'});
   });
   if(typeof ResizeObserver!=='undefined'){surface.observer=new ResizeObserver(()=>apply(surface));surface.observer.observe(node);}
   apply(surface);
  }
  function sync(){
   const main=panel.querySelector('.ks-main'),top=panel.querySelector('.ks-top');
   attach('main',main,main?.querySelector(':scope > .ks-left'),main?.querySelector(':scope > .ks-right'),top,panel,top?.querySelector('.ks-spacer'));
   const program=panel.querySelector('.kp-program-shell');
   if(program)attach('program',program.querySelector('.kp-program-body'),program.querySelector('.kp-program-code'),program.querySelector('.kp-program-preview'),program.querySelector('.kp-program-header'),program);
   const blocks=panel.querySelector('.kb-shell'),blockBody=blocks?.querySelector('.kb-body');
   if(blockBody&&!surfaces.has('blocks')){
    const palette=blockBody.querySelector('.kb-palette'),workspace=blockBody.querySelector('.kb-workspace'),stage=blockBody.querySelector('.kb-stage');
    if(palette&&workspace&&stage){
     const editor=document.createElement('div');editor.className='kc-block-editor';blockBody.insertBefore(editor,palette);editor.append(palette,workspace);
     attach('blocks',blockBody,editor,stage,blocks.querySelector('.kb-top'),blocks);
    }
   }
   const live=panel.querySelector('.ks-preview');
   if(live)attach('live',live,live.querySelector(':scope > #ks-code'),live.querySelector(':scope > #ks-frame'),panel.querySelector('.ks-previewbar'),panel);
   for(const surface of surfaces.values())apply(surface);
  }
  function onClick(event){
   if(!event.target.closest('.kc-workspace-layout'))panel.querySelectorAll('.kc-workspace-layout').forEach(menu=>{menu.open=false;});
   if(event.target.closest('#ks-play-space')&&surfaces.has('main'))surfaces.get('main').focus='split';
   const file=event.target.closest('[data-kp-file],#kp-program-python-tab');
   if(file&&surfaces.has('program')){
    const program=surfaces.get('program');program.focus='split';
    if(file.dataset.kpFile&&file.dataset.kpFile!=='preview')program.lastFile=file.dataset.kpFile;
   }
   // Los controles originales actualizan sus clases antes de que este evento alcance el panel.
   sync();
  }
  panel.addEventListener('click',onClick);
  window.addEventListener('resize',sync);
  controller={panel,sync,destroy(){cancelDrag();panel.removeEventListener('click',onClick);window.removeEventListener('resize',sync);for(const s of surfaces.values())s.observer?.disconnect();}};
  sync();return controller;
 }

 function mount(){
  const panel=document.getElementById('krueka-studio');
  if(!panel)return false;
  if(panel.classList.contains('kc-layout-compact')){installSpace(panel).sync();return true;}
  const top=panel.querySelector('.ks-top'),bar=panel.querySelector('.ks-projectbar');
  const tabs=panel.querySelector('.ks-left > .ks-tabs'),spacer=top?.querySelector('.ks-spacer');
  if(!top||!bar||!tabs||!spacer)return false;

  // Conservamos los botones originales y sus eventos: solo cambia su posición.
  const projects=panel.querySelector('#ks-projects');
  if(projects)top.insertBefore(projects,spacer);
  const create=panel.querySelector('#ks-new');
  if(create){create.textContent='＋ Nuevo proyecto';top.insertBefore(create,spacer);}

  top.insertBefore(tabs,spacer);
  const resources=tabs.querySelector('.ck-resources');
  if(resources)top.insertBefore(resources,spacer);
  const title=panel.querySelector('#ks-title');
  if(title){title.classList.add('kc-top-title');top.insertBefore(title,spacer);}

  const actions=document.createElement('details');actions.className='kc-workspace-actions';
  const summary=document.createElement('summary');summary.textContent='Herramientas';
  summary.setAttribute('aria-label','Más herramientas del proyecto');
  const menu=document.createElement('div');menu.className='kc-workspace-actions-menu';
  for(const id of ['ks-undo','ks-import','ks-export','ks-submit']){
   const button=panel.querySelector('#'+id);
   if(button)menu.appendChild(button);
  }
  actions.append(summary,menu);
  actions.addEventListener('click',event=>{if(event.target.closest('button'))actions.open=false;});
  actions.addEventListener('keydown',event=>{if(event.key==='Escape'){actions.open=false;summary.focus();}});
  top.insertBefore(actions,spacer);
  panel.classList.add('kc-layout-compact');
  installSpace(panel);
  return true;
 }

 const originalOpen=StudioIA.open;
 StudioIA.open=async function(){
  const result=await originalOpen.apply(this,arguments);
  if(this.cloudReady)mount();
  return result;
 };
 const originalShow=StudioIA.showTab,originalToggle=StudioIA.toggleCode,originalClose=StudioIA.close;
 StudioIA.showTab=function(){const result=originalShow.apply(this,arguments);mount();return result;};
 StudioIA.toggleCode=function(){const result=originalToggle.apply(this,arguments);controller?.sync();return result;};
 StudioIA.close=async function(){const result=await originalClose.apply(this,arguments);if(controller&&!controller.panel.isConnected){controller.destroy();controller=null;}return result;};
 window.ClubWorkspaceLayout={mount,normalise,pointerRatio};
})();
