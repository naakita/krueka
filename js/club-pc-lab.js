/* Laboratorio interactivo de armado de PC · Juniors B.E.I. · 20260807c */
(function(){
'use strict';
if(typeof Club==='undefined') return;
const style=document.createElement('link');style.rel='stylesheet';style.href=(window.KRUEKA_BASE||'')+'club/club-pc-lab.css?v=20260807c';style.dataset.pcLab='1';document.head.appendChild(style);

const KEYS=['case','psu','motherboard','cpu','cooler','ram','ssd','atx24','cpu8','sataData','sataPower','powerSwitch','monitor','monitorVideo','monitorPower','keyboard','mouse','psuCord','psuOn'];
const LABELS={case:'gabinete',psu:'fuente de alimentación',motherboard:'placa madre',cpu:'procesador',cooler:'disipador',ram:'memoria RAM',ssd:'SSD',atx24:'conector ATX de 24 pines',cpu8:'conector CPU de 8 pines',sataData:'cable SATA de datos',sataPower:'cable SATA de energía',powerSwitch:'conector PWR SW',monitor:'monitor',monitorVideo:'cable de video',monitorPower:'alimentación del monitor',keyboard:'teclado',mouse:'mouse',psuCord:'cable de corriente de la fuente',psuOn:'interruptor de la fuente'};
const PARTS=[
 {id:'p-case',key:'case',name:'Gabinete',icon:'🗄️',target:'bench',area:'base',pre:[],tip:'Es la estructura donde se fijan los componentes.'},
 {id:'p-psu',key:'psu',name:'Fuente de alimentación',icon:'🔌',target:'case-psu',area:'base',pre:['case'],tip:'Convierte la corriente y alimenta todos los componentes.'},
 {id:'p-mobo',key:'motherboard',name:'Placa madre',icon:'🟩',target:'case-mobo',area:'base',pre:['case'],tip:'Conecta y coordina procesador, RAM, almacenamiento y puertos.'},
 {id:'p-cpu',key:'cpu',name:'Procesador (CPU)',icon:'🧠',target:'cpu-socket',area:'board',pre:['motherboard'],tip:'Debe coincidir con el zócalo y quedar bien asentado.'},
 {id:'p-cooler',key:'cooler',name:'Disipador y ventilador',icon:'🌀',target:'cpu-cooler',area:'board',pre:['cpu'],tip:'Enfría el procesador. Nunca se enciende una PC real sin él.'},
 {id:'p-ram',key:'ram',name:'Memoria RAM',icon:'🟦',target:'ram-slot',area:'board',pre:['motherboard'],tip:'Se inserta en la ranura DIMM hasta cerrar las trabas.'},
 {id:'p-ssd',key:'ssd',name:'Unidad SSD',icon:'💾',target:'drive-bay',area:'base',pre:['case'],tip:'Guarda el sistema operativo y los archivos.'},
 {id:'p-atx24',key:'atx24',name:'Cable ATX 24 pines',icon:'🧵',target:'atx24',area:'cables',pre:['psu','motherboard'],tip:'Es la alimentación principal de la placa madre.'},
 {id:'p-cpu8',key:'cpu8',name:'Cable CPU 8 pines',icon:'⚡',target:'cpu8',area:'cables',pre:['psu','motherboard'],tip:'Alimenta la zona del procesador.'},
 {id:'p-sata-data',key:'sataData',name:'Cable SATA de datos',icon:'〰️',target:'sata-data',area:'cables',pre:['ssd','motherboard'],tip:'Une el SSD con la placa madre.'},
 {id:'p-sata-power',key:'sataPower',name:'Cable SATA de energía',icon:'🔋',target:'sata-power',area:'cables',pre:['ssd','psu'],tip:'Lleva energía desde la fuente hasta el SSD.'},
 {id:'p-power-switch',key:'powerSwitch',name:'Conector PWR SW',icon:'⏻',target:'front-panel',area:'cables',pre:['case','motherboard'],tip:'Une el botón frontal con los pines correctos de la placa.'},
 {id:'p-monitor',key:'monitor',name:'Monitor',icon:'🖥️',target:'desk-monitor',area:'external',pre:[],tip:'Muestra la señal de video que entrega la computadora.'},
 {id:'p-video',key:'monitorVideo',name:'Cable HDMI / DisplayPort',icon:'🔗',target:'video-port',area:'external',pre:['monitor','motherboard'],tip:'Transporta la imagen desde la PC hasta el monitor.'},
 {id:'p-monitor-power',key:'monitorPower',name:'Cable de energía del monitor',icon:'🔌',target:'monitor-power',area:'external',pre:['monitor'],tip:'El monitor necesita su propia alimentación.'},
 {id:'p-keyboard',key:'keyboard',name:'Teclado USB',icon:'⌨️',target:'usb-keyboard',area:'external',pre:['motherboard'],tip:'Se conecta a un puerto USB trasero.'},
 {id:'p-mouse',key:'mouse',name:'Mouse USB',icon:'🖱️',target:'usb-mouse',area:'external',pre:['motherboard'],tip:'Se conecta a otro puerto USB.'},
 {id:'p-psu-cord',key:'psuCord',name:'Cable de corriente de la fuente',icon:'🔌',target:'wall-psu',area:'cables',pre:['psu'],tip:'Conecta la fuente a la toma eléctrica. En la vida real, se conecta al final.'}
];
const TARGETS=[
 {id:'bench',name:'Base del gabinete',area:'case'},
 {id:'case-psu',name:'Bahía de la fuente',area:'case'},
 {id:'case-mobo',name:'Separadores de placa madre',area:'case'},
 {id:'drive-bay',name:'Bahía de almacenamiento',area:'case'},
 {id:'cpu-socket',name:'Zócalo CPU',area:'board'},
 {id:'cpu-cooler',name:'Anclaje del disipador',area:'board'},
 {id:'ram-slot',name:'Ranura DIMM RAM',area:'board'},
 {id:'atx24',name:'Puerto ATX 24 pines',area:'board'},
 {id:'cpu8',name:'Puerto CPU 8 pines',area:'board'},
 {id:'sata-data',name:'Puerto SATA de datos',area:'board'},
 {id:'front-panel',name:'Pines PANEL1 / PWR SW',area:'board'},
 {id:'sata-power',name:'Alimentación SATA',area:'power'},
 {id:'wall-psu',name:'Entrada AC de la fuente',area:'power'},
 {id:'desk-monitor',name:'Puesto del monitor',area:'external'},
 {id:'video-port',name:'Salida de video',area:'external'},
 {id:'monitor-power',name:'Entrada de energía del monitor',area:'external'},
 {id:'usb-keyboard',name:'USB para teclado',area:'external'},
 {id:'usb-mouse',name:'USB para mouse',area:'external'}
];

const ClubPcLab={
 state:null,selected:null,message:'',result:null,attempts:0,completed:false,mistakes:0,dragId:null,
 empty(){const s={};KEYS.forEach(k=>s[k]=false);return s;},
 sid(){return Club.alumno&&(Club.alumno.student_id||Club.alumno.id);},
 sanitize(raw){const s=this.empty();KEYS.forEach(k=>s[k]=raw&&raw[k]===true);return s;},
 localKey(){return 'krueka_pc_lab_'+(this.sid()||'anon');},
 loadLocal(){try{const raw=localStorage.getItem(this.localKey());return raw===null?null:this.sanitize(JSON.parse(raw))}catch(e){return null}},
 saveLocal(){try{localStorage.setItem(this.localKey(),JSON.stringify(this.state))}catch(e){}},

 async insertarAcceso(){
  if(!Club.alumno||Club.alumno.nivel!=='mayores'||document.getElementById('pc-lab-entry'))return;
  const hero=document.querySelector('#club-box .club-dashboard-hero');if(!hero)return;
  const card=document.createElement('section');card.id='pc-lab-entry';card.className='pc-lab-entry';
  card.innerHTML='<div class="pc-entry-icon">🖥️</div><div><span class="club-kicker">LABORATORIO DE HARDWARE</span><h2>Armá una computadora y hacela arrancar</h2><p>Instalá las piezas, conectá energía y periféricos, diagnosticá fallas y conseguí un encendido completo.</p><span id="pc-entry-status" class="pc-entry-status">Cargando progreso…</span></div><button class="club-primary" onclick="ClubPcLab.abrir()">Entrar al taller →</button>';
  hero.insertAdjacentElement('afterend',card);
  const r=await db.rpc('club_pc_lab_estado',{p_student:this.sid()});
  const status=document.getElementById('pc-entry-status');
  if(status&&!r.error){const d=r.data||{};status.textContent=d.completed?'✓ Laboratorio superado · '+(d.attempts||0)+' intento(s)':(d.attempts?d.attempts+' intento(s) realizados':'Listo para comenzar');status.classList.toggle('done',!!d.completed)}
 },

 async abrir(){
  if(!Club.alumno||Club.alumno.nivel!=='mayores')return alert('Este laboratorio es exclusivo para Juniors.');
  Club.aplicarNivel('mayores');
  Club.pinta(Club.cabecera('Laboratorio de hardware','ClubPcLab.salir()')+'<div class="club-loading"><i></i><p>Preparando las piezas…</p></div>');
  const {data,error}=await db.rpc('club_pc_lab_estado',{p_student:this.sid()});
  if(error){Club.pinta(Club.cabecera('Laboratorio de hardware','ClubPcLab.salir()')+'<div class="club-empty"><span>🛠️</span><h2>No se pudo abrir el taller</h2><p>'+esc(error.message)+'</p><button class="club-primary" onclick="ClubPcLab.salir()">Volver</button></div>');return}
  const remote=this.sanitize((data&&data.state)||{}),local=this.loadLocal();
  this.state=local||remote;this.attempts=(data&&data.attempts)||0;this.completed=!!(data&&data.completed);this.selected=null;this.result=null;this.message='Elegí una pieza y después su lugar correcto. También podés arrastrarla.';this.mistakes=0;
  this.render(true);
 },
 salir(){Club.volverMapa();},

 installedCount(){return KEYS.filter(k=>this.state&&this.state[k]).length;},
 partById(id){return PARTS.find(p=>p.id===id);},
 partByTarget(id){return PARTS.find(p=>p.target===id);},
 select(id){const p=this.partById(id);if(!p||this.state[p.key])return;this.selected=id;this.message='Seleccionaste '+p.name+'. Buscá el conector o espacio correcto.';this.render(false);},
 drag(ev,id){this.dragId=id;try{ev.dataTransfer.setData('text/plain',id);ev.dataTransfer.effectAllowed='move'}catch(e){}},
 drop(ev,target){ev.preventDefault();let id=this.dragId;try{id=ev.dataTransfer.getData('text/plain')||id}catch(e){}this.dragId=null;this.install(id,target);},
 target(target){if(this.selected)this.install(this.selected,target);else{this.message='Primero seleccioná una pieza de la bandeja.';this.render(false)}},

 install(id,target){
  const p=this.partById(id),t=TARGETS.find(x=>x.id===target);if(!p||!t)return;
  if(this.state[p.key])return;
  if(p.target!==target){this.mistakes++;this.message='Ese lugar no corresponde a '+p.name+'. Compará la forma, el tamaño y la etiqueta del conector.';this.render(false);return}
  const missing=p.pre.filter(k=>!this.state[k]);
  if(missing.length){this.message='Todavía no podés colocar '+p.name+'. Primero instalá: '+missing.map(k=>LABELS[k]).join(', ')+'.';this.render(false);return}
  this.state[p.key]=true;this.selected=null;this.result=null;this.message='✓ '+p.name+' quedó conectado en '+t.name+'.';this.saveLocal();this.render(false);
 },

 remove(key){
  const p=PARTS.find(x=>x.key===key);if(!p||!this.state[key])return;
  this.state[key]=false;
  let changed=true;
  while(changed){changed=false;PARTS.forEach(x=>{if(this.state[x.key]&&x.pre.some(k=>!this.state[k])){this.state[x.key]=false;changed=true}})}
  if(!this.state.psu||!this.state.psuCord)this.state.psuOn=false;
  this.result=null;this.message='Desconectaste '+p.name+'. Las piezas que dependían de ella también volvieron a la bandeja.';this.saveLocal();this.render(false);
 },
 togglePsu(){
  if(!this.state.psu||!this.state.psuCord){this.message='Para activar la fuente primero instalala y conectá su cable de corriente.';this.render(false);return}
  this.state.psuOn=!this.state.psuOn;this.result=null;this.message=this.state.psuOn?'Interruptor de la fuente en posición I (encendido).':'Interruptor de la fuente en posición O (apagado).';this.saveLocal();this.render(false);
 },
 reset(){if(!confirm('¿Desarmar toda la computadora y empezar de nuevo?'))return;this.state=this.empty();this.selected=null;this.result=null;this.message='Todas las piezas volvieron a la bandeja. Probá otro orden de armado.';this.saveLocal();this.render(false);},

 async power(){
  this.message='Comprobando energía, POST, video, disco y periféricos…';this.render(false,true);
  const {data,error}=await db.rpc('club_pc_lab_probar',{p_student:this.sid(),p_state:this.state});
  if(error){this.message='No se pudo probar el encendido: '+error.message;this.render(false);return}
  this.result=data||{};this.attempts=data.attempts||this.attempts;this.completed=this.completed||!!data.encendio;this.state=this.sanitize(data.state||this.state);this.saveLocal();
  this.message=data.encendio?'¡Encendido correcto! La computadora completó el POST y cargó el sistema.':'La computadora todavía no completa el arranque. Usá el síntoma para diagnosticarla.';
  this.render(false);if(data.encendio)this.sound();setTimeout(()=>{const el=document.getElementById('pc-result');if(el)el.scrollIntoView({behavior:'smooth',block:'center'})},80);
 },
 sound(){try{const C=window.AudioContext||window.webkitAudioContext,ctx=new C();[392,523,659].forEach((f,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=f;g.gain.setValueAtTime(.0001,ctx.currentTime+i*.12);g.gain.exponentialRampToValueAtTime(.08,ctx.currentTime+i*.12+.02);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+i*.12+.18);o.connect(g);g.connect(ctx.destination);o.start(ctx.currentTime+i*.12);o.stop(ctx.currentTime+i*.12+.2)})}catch(e){}},

 targetHtml(t){
  const p=this.partByTarget(t.id),on=p&&this.state[p.key],blocked=p&&p.pre.some(k=>!this.state[k]);
  return '<button type="button" class="pc-target '+(on?'installed ':'')+(blocked&&!on?'blocked ':'')+(this.selected&&p&&this.selected===p.id?'expected ':'')+'" data-target="'+t.id+'" onclick="ClubPcLab.target(\''+t.id+'\')" ondragover="event.preventDefault()" ondrop="ClubPcLab.drop(event,\''+t.id+'\')">'
    +(on?'<span class="pc-target-icon">'+p.icon+'</span><span><b>'+esc(p.name)+'</b><small>'+esc(t.name)+'</small></span><i onclick="event.stopPropagation();ClubPcLab.remove(\''+p.key+'\')" title="Desconectar">×</i>':'<span class="pc-target-socket">＋</span><span><b>'+esc(t.name)+'</b><small>'+(blocked?'Bloqueado por una pieza anterior':'Soltá aquí la pieza correcta')+'</small></span>')+'</button>';
 },
 areaHtml(area,title,sub){return '<section class="pc-area pc-area-'+area+'"><div class="pc-area-title"><div><b>'+title+'</b><small>'+sub+'</small></div></div><div class="pc-target-grid">'+TARGETS.filter(t=>t.area===area).map(t=>this.targetHtml(t)).join('')+'</div>'+(area==='power'?'<button type="button" class="pc-psu-switch '+(this.state.psuOn?'on':'off')+'" onclick="ClubPcLab.togglePsu()"><span>'+(this.state.psuOn?'I':'O')+'</span><b>Interruptor trasero de la fuente</b><small>'+(this.state.psuOn?'Activado':'Apagado')+'</small></button>':'')+'</section>';},
 partsHtml(){
  const pending=PARTS.filter(p=>!this.state[p.key]);
  return pending.length?pending.map(p=>'<button type="button" draggable="true" class="pc-part '+(this.selected===p.id?'selected':'')+'" onclick="ClubPcLab.select(\''+p.id+'\')" ondragstart="ClubPcLab.drag(event,\''+p.id+'\')"><span>'+p.icon+'</span><div><b>'+esc(p.name)+'</b><small>'+esc(p.tip)+'</small></div><i>⋮⋮</i></button>').join(''):'<div class="pc-all-used">✓ Todas las piezas están colocadas. Ahora probá encender.</div>';
 },
 monitorHtml(){
  const symptom=this.result&&this.result.symptom;
  let text='MONITOR APAGADO',cls='off';
  if(symptom==='sin_imagen'){text='SIN SEÑAL';cls='no-signal'}
  if(symptom==='sin_sistema'){text='UEFI · NO BOOT DEVICE';cls='bios'}
  if(symptom==='sin_control'){text='KRUEKA OS · SIN ENTRADA USB';cls='boot'}
  if(symptom==='encendido'){text='KRUEKA OS · EQUIPO LISTO';cls='ready'}
  return '<div class="pc-visual"><div class="pc-case-visual '+(symptom&&symptom!=='sin_energia'?'powered':'')+'"><i></i><span>POWER</span><div class="pc-fan">✦</div></div><div class="pc-monitor-visual '+cls+'"><div>'+text+'</div><i></i></div></div>';
 },
 resultHtml(){
  if(!this.result)return '<div id="pc-result" class="pc-result neutral"><b>Banco de diagnóstico</b><p>Podés intentar encender en cualquier momento. El síntoma te indicará qué subsistema revisar.</p></div>';
  const ok=!!this.result.encendio;
  return '<div id="pc-result" class="pc-result '+(ok?'success':'failure')+'"><span>'+(ok?'✅':'🧰')+'</span><div><b>'+(ok?'¡La computadora encendió correctamente!':'Intento '+esc(this.result.attempts||this.attempts)+': todavía no inicia')+'</b><p>'+esc(this.result.diagnostic||'Revisá el armado y volvé a probar.')+'</p>'+(ok?'<small>Superaste el laboratorio. Podés desarmarla y repetir para practicar.</small>':'<small>No se muestra la pieza exacta: interpretá el síntoma, desconectá lo necesario y probá de nuevo.</small>')+'</div></div>';
 },

 render(first,loading){
  const count=this.installedCount(),total=KEYS.length,name=Club.alumno?Club.alumno.nombre:'';
  const html=Club.cabecera('Armado y diagnóstico de PC','ClubPcLab.salir()')
   +'<main class="pc-lab"><section class="pc-lab-hero"><div><span class="club-kicker">JUNIORS · LABORATORIO DE HARDWARE</span><h1>Armá la PC, diagnosticá y conseguí encenderla</h1><p>'+esc(name)+', empezá con todas las piezas separadas. Instalalas, conectá los cables y presioná encender. Si falla, interpretá el síntoma, desarmá lo necesario y volvé a probar.</p></div><div class="pc-lab-stats"><div><b>'+count+'/'+total+'</b><span>conexiones</span></div><div><b>'+this.attempts+'</b><span>intentos</span></div><div><b>'+this.mistakes+'</b><span>ajustes</span></div></div></section>'
   +'<div class="pc-safety">⚠️ <b>Seguridad real:</b> una computadora física se arma siempre desenchufada, con la fuente apagada y con supervisión docente.</div>'
   +'<div class="pc-message">'+esc(this.message)+'</div>'
   +'<div class="pc-workspace"><aside class="pc-parts"><div class="pc-col-title"><span>01</span><div><b>Piezas desarmadas</b><small>Arrastrá o tocá para seleccionar</small></div></div><div class="pc-parts-list">'+this.partsHtml()+'</div></aside>'
   +'<section class="pc-bench"><div class="pc-col-title"><span>02</span><div><b>Mesa de ensamblaje</b><small>Uní cada componente con su lugar</small></div></div>'
   +this.areaHtml('case','Interior del gabinete','Estructura, fuente, placa y almacenamiento')
   +this.areaHtml('board','Placa madre y conectores','CPU, refrigeración, RAM y puertos internos')
   +this.areaHtml('power','Energía','Cables de alimentación e interruptor')
   +this.areaHtml('external','Puesto externo','Monitor, video, teclado y mouse')+'</section>'
   +'<aside class="pc-diagnostic"><div class="pc-col-title"><span>03</span><div><b>Prueba de encendido</b><small>Observá el síntoma</small></div></div>'+this.monitorHtml()+this.resultHtml()+'<button class="pc-power-button" '+(loading?'disabled':'')+' onclick="ClubPcLab.power()"><span>⏻</span>'+(loading?'PROBANDO…':'ENCENDER PC')+'</button><button class="pc-reset-button" onclick="ClubPcLab.reset()">↺ Desarmar todo</button><button class="pc-map-button" onclick="ClubPcLab.salir()">← Volver al mapa</button></aside></div></main>';
  if(first){Club.pinta(html)}else{const o=Club.ov(),y=o.scrollTop;document.getElementById('club-box').innerHTML=html;requestAnimationFrame(()=>{o.scrollTop=y})}
 }
};
window.ClubPcLab=ClubPcLab;
const oldMap=Club.mapa;
Club.mapa=function(){const r=oldMap.apply(this,arguments);setTimeout(()=>ClubPcLab.insertarAcceso(),0);return r;};
})();
