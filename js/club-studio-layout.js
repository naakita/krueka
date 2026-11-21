/* Más lugar para crear: pestañas y acciones arriba, vista previa alta y siempre visible. */
(function(){
 'use strict';
 if(window.ClubWorkspaceLayout||!window.StudioIA)return;

 function mount(){
  if(!document.body.classList.contains('studio-access'))return false;
  const panel=document.getElementById('krueka-studio');
  if(!panel)return false;
  if(panel.classList.contains('kc-layout-compact'))return true;
  const top=panel.querySelector('.ks-top'),bar=panel.querySelector('.ks-projectbar');
  const tabs=panel.querySelector('.ks-left > .ks-tabs'),spacer=top?.querySelector('.ks-spacer');
  if(!top||!bar||!tabs||!spacer)return false;

  // Conservamos los botones originales y sus eventos: solo cambia su posición.
  const projects=panel.querySelector('#ks-projects');
  if(projects)top.insertBefore(projects,spacer);
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
  return true;
 }

 const originalOpen=StudioIA.open;
 StudioIA.open=async function(){
  const result=await originalOpen.apply(this,arguments);
  if(this.cloudReady)mount();
  return result;
 };
 window.ClubWorkspaceLayout={mount};
})();
