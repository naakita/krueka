/* Krueka Crea · resolución local/remota sin pérdida de borradores · 20260828a */
(function(){
'use strict';
if(!window.KruekaCrea) return;
var K=window.KruekaCrea;
K.list=async function(){
  var local=this.localProjects(),remote=[];
  try{
    var data=await this.rpc('club_crea_listar',{p_student:this.sid(),p_device:this.device()});
    remote=Array.isArray(data)?data:[];
  }catch(e){}
  var map=Object.create(null);
  remote.concat(local).forEach(function(p){
    if(!p||!p.id)return;
    var current=map[p.id];
    if(!current){map[p.id]=p;return;}
    var incomingTime=Date.parse(p.updated_at||'')||0;
    var currentTime=Date.parse(current.updated_at||'')||0;
    if(incomingTime>currentTime||(incomingTime===currentTime&&p.content&&!current.content))map[p.id]=p;
  });
  this.projects=Object.keys(map).map(function(id){return map[id]}).sort(function(a,b){return String(b.updated_at||'').localeCompare(String(a.updated_at||''))});
  return this.projects;
};
})();
