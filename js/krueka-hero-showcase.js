/* Krueka: tabs accesibles de la demostración ilustrativa.
 * No simula IA activa, no accede a cuentas ni almacena datos.
 */
(function(){
  'use strict';
  var shell=document.querySelector('.kx-demo-shell');
  if(!shell)return;
  var tabs=Array.prototype.slice.call(shell.querySelectorAll('.kx-demo-tab'));
  var panels=Array.prototype.slice.call(shell.querySelectorAll('.kx-demo-view'));
  var stage=shell.querySelector('.kx-demo-stage');
  function selectTab(name,focus){
    var target=panels.find(function(p){return p.dataset.panel===name;});
    var active=tabs.find(function(t){return t.dataset.demo===name;});
    if(!target||!active)return;
    tabs.forEach(function(button){
      var chosen=button===active;
      button.classList.toggle('is-selected',chosen);
      button.setAttribute('aria-pressed',chosen?'true':'false');
    });
    panels.forEach(function(panel){
      var chosen=panel===target;
      panel.hidden=!chosen;panel.classList.toggle('is-active',chosen);
    });
    stage.dataset.activeDemo=name;
    if(focus)active.focus();
  }
  tabs.forEach(function(tab,index){
    tab.addEventListener('click',function(){selectTab(tab.dataset.demo,false);});
    tab.addEventListener('keydown',function(e){
      if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight'&&e.key!=='Home'&&e.key!=='End')return;
      e.preventDefault();
      var n=(e.key==='Home')?0:(e.key==='End')?tabs.length-1:
        (index+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
      selectTab(tabs[n].dataset.demo,true);
    });
  });
  selectTab('create',false);
})();