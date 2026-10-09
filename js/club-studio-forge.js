/* HORIZON FORGE: construcción por etapas con el motor WebGL 3D existente. Sin CDN. */
(function(){
'use strict';
if(window.StudioForge||!window.StudioKits||!window.Studio3D)return;
const kind='cinematic3d';
const palette={
 city:{road:'#1c2638',building:'#293347',window:'#7ca5c7',sign:'#61c4dc'},
 industrial:{road:'#242c31',building:'#3c4650',window:'#ba9d77',sign:'#df9a67'},
 port:{road:'#293744',building:'#25465a',window:'#abd7e5',sign:'#8ab6cb'}
};
const actors={
 hero:{name:'Alex Vega',style:'tactical',skin:'#b98669',jacket:'#2c464f',pants:'#1a2834',hair:'#252024',height:1},
 guide:{name:'Mara Solís',style:'urban',skin:'#c18b70',jacket:'#714a47',pants:'#253141',hair:'#312426',height:.97},
 guard:{name:'Vigilante',style:'tactical',skin:'#9c725d',jacket:'#354457',pants:'#202c34',hair:'#212a31',height:1.08}
};
const defaults={
 kind,title:'HORIZON · Operación Umbral',theme:'station',lighting:'sunset',quality:'low',camera:'follow',
 speed:5,lives:4,seconds:240,avatarColor:'#8bb4b9',
 characters:actors,environment:{district:'city',weather:'mist',light:'sunset'},
 motions:{walk:1,run:1.55,patrol:1},
 story:{objective:'Recuperá los tres registros y llegá al punto de extracción.',dialogue:'La zona está vigilada. Recuperá los registros y evitá los drones. Te cubriré desde aquí.',reply:'Entendido. Voy a asegurar el perímetro.'}
};
function safeColor(v,def){return /^#[0-9a-f]{6}$/i.test(String(v))?String(v):def;}
function safeNumber(v,a,b,d){let n=Number(v);return Number.isFinite(n)?Math.max(a,Math.min(b,n)):d;}
function clean(raw){
 const c=raw&&typeof raw==='object'?raw:{};
 const result={...defaults,...c,kind};
 const chars=c.characters||{};
 result.characters={};
 for(const key of Object.keys(actors)){
  const rawChar=chars[key]||{},d=actors[key],person={...d,...rawChar};
  result.characters[key]={
    name:String(person.name||d.name).slice(0,36),
    style:['tactical','urban','explorer'].includes(person.style)?person.style:d.style,
    skin:safeColor(person.skin,d.skin),jacket:safeColor(person.jacket,d.jacket),pants:safeColor(person.pants,d.pants),
    hair:safeColor(person.hair,d.hair),height:safeNumber(person.height,.86,1.17,d.height)
  };
 }
 const env={...defaults.environment,...(c.environment||{})};
 result.environment={district:['city','industrial','port'].includes(env.district)?env.district:'city',weather:['clear','mist','rain'].includes(env.weather)?env.weather:'mist',light:['cryo','sunset','alert'].includes(env.light)?env.light:'sunset'};
 const mov={...defaults.motions,...(c.motions||{})};
 result.motions={walk:safeNumber(mov.walk,.6,1.6,1),run:safeNumber(mov.run,1,2.25,1.55),patrol:safeNumber(mov.patrol,0,2,1)};
 const st={...defaults.story,...(c.story||{})};
 result.story={objective:String(st.objective).slice(0,150),dialogue:String(st.dialogue).slice(0,240),reply:String(st.reply).slice(0,180)};
 result.title=String(result.title||defaults.title).slice(0,60);
 result.speed=safeNumber(result.speed,2,9,5);result.lives=Math.round(safeNumber(result.lives,1,9,4));
 result.seconds=Math.round(safeNumber(result.seconds,60,300,240));
 result.quality=result.quality==='high'?'high':'low';
 result.theme='station';result.lighting=result.environment.light;
 return result;
}
function humanoid(person,x,y,z,angle,walk,motion){
 const correct=safeColor,skin=correct(person.skin,'#ad8469'),coat=correct(person.jacket,'#384b51'),pants=correct(person.pants,'#263040'),hair=correct(person.hair,'#241f25');
 const s=safeNumber(person.height,.86,1.17,1),stride=Math.sin(motion*8.5)*.19*walk;
 const arm=stride*.55,legs=.21*s,shoe='#141b25',style=person.style||'tactical';
 const step=(Math.abs(walk)>0?.035:0),rise=step*Math.max(0,Math.sin(motion*17));
 // Articulación por segmentos de piernas, brazos, torso, cuello, rostro y pelo.
 box(x-.19*s,y+.03+Math.max(0,stride)*.27,z+stride*.18,.23*s,.75*s,.29*s,pants);
 box(x+.19*s,y+.03+Math.max(0,-stride)*.27,z-stride*.18,.23*s,.75*s,.29*s,pants);
 box(x-.19*s,y+.03+Math.max(0,stride)*.27,z+stride*.2,.24*s,.13*s,.39*s,shoe);
 box(x+.19*s,y+.03+Math.max(0,-stride)*.27,z-stride*.2,.24*s,.13*s,.39*s,shoe);
 box(x,y+.78*s+rise,z,.68*s,.82*s,.4*s,coat,angle);
 box(x,y+1.24*s+rise,z+.03,.53*s,.10*s,.42*s,style==='tactical'?'#202b32':coat,angle);
 box(x,y+1.53*s+rise,z,.17*s,.14*s,.16*s,skin);
 box(x-.45*s,y+.76*s+rise+Math.max(0,-arm),z-arm*.35,.19*s,.64*s,.24*s,coat);
 box(x+.45*s,y+.76*s+rise+Math.max(0,arm),z+arm*.35,.19*s,.64*s,.24*s,coat);
 box(x-.45*s,y+.73*s+rise+Math.max(0,-arm),z-arm*.35,.2*s,.15*s,.24*s,skin);
 box(x+.45*s,y+.73*s+rise+Math.max(0,arm),z+arm*.35,.2*s,.15*s,.24*s,skin);
 box(x,y+1.64*s+rise,z,.48*s,.39*s,.43*s,skin);
 box(x,y+1.95*s+rise,z-.06,.5*s,.12*s,.48*s,hair);
 box(x,y+1.75*s+rise,z+.218*s,.17*s,.075*s,.04*s,'#382a2b');
 box(x-.12*s,y+1.82*s+rise,z+.224*s,.06*s,.045*s,.04*s,'#182126');
 box(x+.12*s,y+1.82*s+rise,z+.224*s,.06*s,.045*s,.04*s,'#182126');
 if(style==='tactical'){
  box(x,y+1.04*s+rise,z+.23*s,.42*s,.43*s,.08*s,'#253640');
  box(x-.29*s,y+1.1*s+rise,z+.26*s,.12*s,.13*s,.08*s,'#526c70');
 }else if(style==='explorer'){
  box(x,y+1.02*s+rise,z-.27*s,.47*s,.6*s,.16*s,'#635b4d');
  box(x,y+1.19*s+rise,z+.22*s,.30*s,.04*s,.06*s,'#d2b88d');
 }else{
  box(x,y+1.31*s+rise,z+.21*s,.41*s,.07*s,.04*s,'#e0b596');
 }
}
function cinemaScene(){
 const env=cfg.environment||{},district=env.district||'city';
 const p=district==='industrial'?{wall:'#40464b',glass:'#b0a189',metal:'#242c31',neon:'#e1a36e'}:district==='port'?{wall:'#355267',glass:'#9ac9d0',metal:'#203548',neon:'#8bd6d8'}:{wall:'#334358',glass:'#9cb1bd',metal:'#1a283b',neon:'#73b6d6'};
 const mist=env.weather==='mist',rain=env.weather==='rain';
 // Estructura de ciudad: aceras, vías, edificios, ventanales, pórticos y faroles.
 drawLayer=1;
 box(0,-.035,0,13,.04,27,'#212d37');
 for(const side of [-1,1]){
  box(side*8.5,.04,0,5,.18,28,'#384553');
  for(let z=-10;z<=10;z+=6){
   const height=5+Math.abs(z%3)*1.2;
   box(side*13,0,z,4.6,height,5.3,p.wall);
   box(side*13,height-.3,z,4.9,.34,5.5,p.metal);
   for(let floor=1;floor<height-.5;floor+=1.5)for(const dz of [-1.45,0,1.45]){
    box(side*10.61,floor,z+dz,.065,.62,.72,p.glass,0,true);
   }
  }
  for(let z=-10;z<=10;z+=8){
    box(side*6.9,.0,z,.18,4.8,.18,'#4e5d66');
    box(side*6.9,4.7,z,.7,.14,.7,p.neon,0,true);
  }
 }
 for(let z=-12;z<13;z+=5){box(0,-.03,z,.12,.012,1.7,'#b3a594');}
 for(let z=-11;z<=11;z+=5)for(const x of [-5.9,5.9]){
  box(x,-.01,z,.45,.02,1.1,'#a5aab0');
 }
 if(rain){for(let i=0;i<30;i++){const z=((i*3.37+elapsed*7)%28)-14,x=Math.sin(i*13.3)*10.3;box(x,.2,z,.018,.37,.018,'#7ba8b8');}}
 if(mist){for(let i=0;i<5;i++)box(Math.sin(i*4.2)*5,.025,i*5-9,4,.02,.22,'#4c6774');}
 drawLayer=4;
 const hero=cfg.characters?.hero||{},guide=cfg.characters?.guide||{},guard=cfg.characters?.guard||{};
 const moving=!!(keys.ArrowLeft||keys.ArrowRight||keys.ArrowUp||keys.ArrowDown||keys.w||keys.a||keys.s||keys.d);
 const locomotion=moving?(keys.Shift?1.5:1):0;
 humanoid(hero,player.x,player.y,player.z,player.angle,locomotion,elapsed*(cfg.motions?.walk||1));
 const shift=Math.sin(elapsed*.7)*(cfg.motions?.patrol||1)*1.3;
 humanoid(guide,4.5,0,-7.5+shift,.25,Math.abs(shift)>.01?.45:0,elapsed*.7);
 humanoid(guard,-5,0,-3-Math.sin(elapsed*.4)*2,.4,.35,elapsed*.7);
 if(cinematicGesture>elapsed){
  const c=hero.jacket||'#2c464f';box(player.x+.55,player.y+1.65,player.z+.25,.17,.65,.17,c);
 }
}
function interact(){
 if(paused||ended||editing){status.textContent='Pulsá Jugar para conversar con los personajes.';return;}
 const d=Math.hypot(player.x-4.5,player.z-(-7.5+Math.sin(elapsed*.7)*(cfg.motions?.patrol||1)*1.3));
 const caption=document.getElementById('dialogue');
 if(d>3.8){caption.textContent='Acercate a Mara para conversar (tecla E o Hablar).';return;}
 const guide=cfg.characters?.guide?.name||'Mara',hero=cfg.characters?.hero?.name||'Alex';
 const answer=cinematicDialogueStep++%2===1;
 const message=String(answer?(cfg.story?.reply||'Entendido.'):(cfg.story?.dialogue||'La zona está vigilada.')).slice(0,240);
 caption.textContent=(answer?hero:guide)+': '+message;
 if(cinemaVoice&&typeof speechSynthesis!=='undefined'&&typeof SpeechSynthesisUtterance!=='undefined'){
  try{speechSynthesis.cancel();const speech=new SpeechSynthesisUtterance(message);speech.lang='es-ES';speech.rate=.93;speech.pitch=.9;speechSynthesis.speak(speech);}catch(_e){}
 }
}
function cinematicSetup(){
 const btn=document.getElementById('interact'),voice=document.getElementById('voice'),gesture=document.getElementById('gesture');
 document.getElementById('mission').textContent='MISIÓN · '+String(cfg.story?.objective||'Recuperá los registros.').slice(0,150);
 btn.onclick=interact;
 gesture.onclick=()=>{cinematicGesture=elapsed+1.6;document.getElementById('dialogue').textContent=(cfg.characters?.hero?.name||'Tu personaje')+' hace una señal al equipo.';};
 voice.onclick=()=>{cinemaVoice=!cinemaVoice;voice.textContent=cinemaVoice?'Voces: activadas':'Voces: apagadas';};
 addEventListener('keydown',e=>{if(e.repeat)return;const name=e.key.length===1?e.key.toLowerCase():e.key;if(name==='e')interact();if(name==='f')gesture.click();});
}
function inject(game){
 const insert='function geometry(){';
 const start=game.indexOf('const x=player.x,y=player.y,z=player.z,walk=');
 const end=game.indexOf('function project(',start);
 if(!game.includes(insert)||start<0||end<0)throw new Error('El motor 3D cambió: no se puede preparar la base sin verificarlo.');
 const helpers='   let cinemaVoice=false,cinematicGesture=0,cinematicDialogueStep=0;\n'+safeColor.toString()+'\n'+safeNumber.toString()+'\n'+
 humanoid.toString()+'\n'+cinemaScene.toString()+'\n'+interact.toString()+'\n'+cinematicSetup.toString()+'\n';
 game=game.replace(insert,helpers+insert);
 // Conservar colisiones, luces, WebGL y Canvas alternativo del motor existente.
 const a=game.indexOf('const x=player.x,y=player.y,z=player.z,walk=');
 const project=game.indexOf('function project(',a);
 const close=game.lastIndexOf('}',project);
 if(project<0||close<a)throw new Error('No se pudo ubicar el cuerpo del personaje original.');
 game=game.slice(0,a)+'cinemaScene();\n  '+game.slice(close);
 game=game.replace('dx=dx/length*cfg.speed*dt;dz=dz/length*cfg.speed*dt;',
 'dx=dx/length*cfg.speed*(keys.Shift?(cfg.motions?.run||1.55):1)*dt;dz=dz/length*cfg.speed*(keys.Shift?(cfg.motions?.run||1.55):1)*dt;');
 game=game.replace('reset();bindCanvas();function frame(now)', 'reset();bindCanvas();cinematicSetup();function frame(now)');
 game=game.replace("hud.textContent='Cristales '","hud.textContent='Registros '");
 game=game.replace("box(p.x,0,p.z,s,.15,s,palette.edge);crystal(p.x,1+Math.sin(elapsed*2+o.x)*.12,p.z,s*.45,o.color);",
 "box(p.x,0,p.z,s*.75,1.25,s*.65,'#344953');box(p.x,1.27,p.z+s*.34,s*.59,.42,.05,o.color,0,true);");
 game=game.replace("'¡Abriste el portal! Llegá al arco del fondo.'","'Acceso habilitado. Avanzá hacia el punto de extracción.'");
 game=game.replace("'¡Misión cumplida! Construiste, probaste y exploraste tu mundo 3D.'","'Operación completada: registros recuperados y extracción realizada.'");
 game=game.replace("'Cristal encontrado. Buscá el siguiente.'","'Registro recuperado. Continuá tu misión.'");
 return game;
}
function create(){
 const base=Studio3D.create();
 const objects=[
 {id:'intel-1',type:'crystal',label:'Registro · Plaza',x:-4.4,z:8,size:1.2,height:1.4,color:'#72c1ca'},
 {id:'intel-2',type:'crystal',label:'Registro · Terminal',x:4.4,z:1,size:1.2,height:1.4,color:'#72c1ca'},
 {id:'intel-3',type:'crystal',label:'Registro · Acceso',x:-3.8,z:-8,size:1.2,height:1.4,color:'#72c1ca'},
 {id:'barrier-1',type:'crate',label:'Barricada',x:-2,z:3,size:1.8,height:1.1,color:'#59616a'},
 {id:'barrier-2',type:'crate',label:'Barrera industrial',x:2,z:-4,size:1.8,height:1.1,color:'#59616a'},
 {id:'security-1',type:'drone',label:'Dron de vigilancia',x:0,z:-2,size:1,height:1,color:'#ce6970'}
 ];
 const c=clean({...defaults,objects});
 base['game-config.js']=StudioKits.configFile(c);
 base['game.js']=inject(base['game.js']);
 base['index.html']=base['index.html']
  .replace('MI MUNDO 3D','FORGE · PROTOTIPO CINEMÁTICO')
  .replace('CREÁ TU PROPIO RECORRIDO','HORIZON · DEMOSTRACIÓN EDITABLE')
  .replace('</div><p id="status"', '</div><div class="dialogbar"><button id="interact">E · Hablar</button><button id="gesture">F · Gesto</button><button id="voice">Voces: apagadas</button></div><p id="mission" role="status"></p><p id="dialogue" aria-live="polite">Acercate a Mara para conversar. Podés girar la cámara arrastrando la escena.</p><p id="status"');
 base['style.css']+='\n#mission{padding:9px 12px;border-left:3px solid #b9a17c;background:#132131;color:#d3ddde;font-size:12px;line-height:1.55;border-radius:4px}body{background:#111825;color:#dae3ee;font-family:system-ui,sans-serif}main{max-width:1120px}header h1{letter-spacing:.035em;font-weight:750} .stage{border:1px solid #7d99ad55;border-radius:10px;box-shadow:0 24px 60px #0008}.badge{background:#17202aaf;padding:7px;letter-spacing:.19em}.dialogbar{display:flex;justify-content:center;flex-wrap:wrap;gap:9px;margin:8px 0}.dialogbar button{background:#172935;border:1px solid #527080;color:#dcf5ee}#dialogue{padding:12px;border:1px solid #475f7090;background:#14212d;border-radius:9px;font-size:12px;color:#dbe8e7;line-height:1.5}';
 base['LEEME.md']='# HORIZON FORGE · Operación Umbral\n\nEtapa 1: PERSONAJES. Creá tres figuras adultas (protagonista, guía y vigilante), personalizá nombre, ropa, piel y proporciones.\nEtapa 2: ESCENARIO. Construí una ciudad, fábrica o puerto; cambiá iluminación y clima.\nEtapa 3: MOVIMIENTO. Probá caminar, correr (Shift), saltar (Espacio), gesto (F) y patrulla NPC.\nEtapa 4: DIÁLOGOS. Editá la frase de Mara. E para conversar; botón Voces para activar síntesis de voz cuando esté disponible.\nEtapa 5: INTEGRACIÓN. Recuperá tres registros, evitá drones y llegá al punto de extracción.\n\nSe trata de un prototipo 3D procedural de proporciones humanas, no de gráficos fotorrealistas ni captura de movimientos. WebGL con respaldo Canvas en navegadores sin aceleración. La voz es opcional, depende del navegador y puede no estar disponible.\n\n**Capacidad:** combinar personajes, entorno, animaciones y narrativa en un videojuego funcional. **Indicadores:** caracterizo un personaje; personalizo ambiente; compruebo acciones y diálogo; guardo y pruebo el proyecto.\n';
 return base;
}
function art(id){
 return '<svg viewBox="0 0 190 65" aria-label="Ciudad y personajes" role="img" xmlns="http://www.w3.org/2000/svg"><rect width="190" height="65" rx="8" fill="#101b2b"/><path d="M7 48V14h34v34M48 48V5h32v43M85 48V19h28v29M128 48V8h35v40" fill="#364857" stroke="#7796a6"/><path d="M8 48h174M50 13h25M132 17h27" stroke="#dba577" stroke-width="3"/><circle cx="97" cy="37" r="8" fill="#c09372"/><path d="M86 61V46q10-9 22 0v15z" fill="#45656a"/><path d="M98 0v10" stroke="#72afc1"/></svg>';
}
const stages=['Personajes','Ambiente','Movimiento','Acciones y voz','Integrar'];
function editor(studio,el,raw){
 const cfg=clean(raw),stage=safeNumber(studio.forgeStage,0,4,0),current=studio.forgeActor||'hero';
 const person=cfg.characters[current]||cfg.characters.hero;
 const options=(map,val)=>Object.entries(map).map(([k,v])=>'<option value="'+k+'" '+(k===val?'selected':'')+'>'+v+'</option>').join('');
 const field=(label,id,value,type='text',min='',max='')=>'<label>'+label+'<input id="'+id+'" type="'+type+'" value="'+(type==='text'?esc(String(value)):value)+'"'+(min!==''?' min="'+min+'"':'')+(max!==''?' max="'+max+'"':'')+'></label>';
 const save=change=>{
  if(studio.busy||!studio.cloudReady)return;
  studio.checkpoint();studio.files['game-config.js']=StudioKits.configFile(clean(change));studio.changed();studio.refreshAll();studio.lock(false);
 };
 let inner='';
 if(stage===0){
  inner='<h3>01 · Diseño de personajes</h3><p>Elegí una figura y construí su apariencia. Son personas articuladas con proporciones humanas, no emoticonos.</p>'+
  '<label>Personaje<select id="fg-actor">'+options({hero:'Protagonista',guide:'Mara · guía',guard:'Vigilante'},current)+'</select></label>'+
  '<div class="ks-fields">'+field('Nombre','fg-name',person.name)+
  '<label>Vestimenta<select id="fg-style">'+options({tactical:'Equipo táctico',urban:'Ropa urbana',explorer:'Explorador'},person.style)+'</select></label>'+
  field('Tono de piel','fg-skin',person.skin,'color')+
  field('Campera / armadura','fg-jacket',person.jacket,'color')+
  field('Pantalón','fg-pants',person.pants,'color')+
  field('Cabello','fg-hair',person.hair,'color')+
  field('Proporción corporal','fg-height',person.height,'number',.86,1.17)+'</div>'+
  '<button class="ks-btn primary" id="fg-apply">Guardar personaje</button>';
 }else if(stage===1){
  inner='<h3>02 · Construir el ambiente</h3><p>El entorno se genera con geometría 3D, calles, edificios, vidrieras, faroles y atmósfera.</p>'+
  '<div class="ks-fields"><label>Distrito<select id="fg-district">'+options({city:'Ciudad abandonada',industrial:'Zona industrial',port:'Puerto nocturno'},cfg.environment.district)+'</select></label>'+
  '<label>Iluminación<select id="fg-light">'+options({sunset:'Última luz del día',cryo:'Noche azulada',alert:'Alerta roja'},cfg.environment.light)+'</select></label>'+
  '<label>Clima<select id="fg-weather">'+options({clear:'Despejado',mist:'Niebla',rain:'Lluvia estilizada'},cfg.environment.weather)+'</select></label>'+
  '<label>Calidad<select id="fg-quality">'+options({low:'Liviana · para PCs antiguas',high:'Mayor nitidez'},cfg.quality)+'</select></label></div>'+
  '<button class="ks-btn primary" id="fg-apply">Guardar escenario</button>';
 }else if(stage===2){
  inner='<h3>03 · Movimiento y vida</h3><p>Probá WASD/flechas, Shift para correr, Espacio para saltar y la patrulla del personaje secundario.</p>'+
  '<div class="ks-fields">'+field('Velocidad de caminar','fg-speed',cfg.speed,'number',2,9)+
  field('Ritmo de pasos','fg-walk',cfg.motions.walk,'number',.6,1.6)+
  field('Multiplicador de carrera','fg-run',cfg.motions.run,'number',1,2.25)+
  field('Movimiento de patrulla','fg-patrol',cfg.motions.patrol,'number',0,2)+
  field('Vidas','fg-lives',cfg.lives,'number',1,9)+'</div>'+
  '<button class="ks-btn primary" id="fg-apply">Aplicar movimientos</button>';
 }else if(stage===3){
  inner='<h3>04 · Acciones, diálogo y voces</h3><p>El personaje conversa al acercarse a Mara. Las voces son opcionales mediante síntesis del navegador; los subtítulos siempre funcionan.</p>'+
  '<label>Objetivo de la misión<textarea id="fg-objective" maxlength="150" rows="2">'+esc(cfg.story.objective)+'</textarea></label>'+
  '<label>Diálogo de Mara<textarea id="fg-dialogue" maxlength="240" rows="4">'+esc(cfg.story.dialogue)+'</textarea></label>'+
  '<label>Respuesta del protagonista<textarea id="fg-reply" maxlength="180" rows="3">'+esc(cfg.story.reply)+'</textarea></label>'+
  '<button class="ks-btn primary" id="fg-apply">Guardar historia</button>';
 }else{
  inner='<h3>05 · Integración y pruebas</h3><p><b>'+esc(cfg.title)+'</b>: '+esc(cfg.story.objective)+'</p>'+
  '<p>La escena combina tus tres personajes, el distrito, controles, obstáculos, diálogos y un objetivo jugable. En la vista previa pulsá ▶ Jugar, explorá y recuperá los registros.</p>'+
  '<div class="ks-fields">'+field('Nombre de tu juego','fg-title',cfg.title)+field('Tiempo para la misión (segundos)','fg-time',cfg.seconds,'number',60,300)+'</div>'+
  '<button class="ks-btn primary" id="fg-apply">Guardar proyecto</button><button class="ks-btn" id="fg-play">▶ Probar ahora</button>';
 }
 el.innerHTML='<div class="ks-section-label">HORIZON FORGE · TALLER DE PRODUCCIÓN 3D</div>'+
 '<h2>Construí un juego, pieza por pieza</h2><p>Los cambios de cada etapa se guardan en <b>game-config.js</b> y se unen automáticamente en un mismo videojuego.</p>'+
 '<div class="ks-scene-list" aria-label="Etapas del proyecto">'+stages.map((s,i)=>'<button class="ks-btn" data-forge-stage="'+i+'" aria-pressed="'+(stage===i)+'">'+(i+1)+'. '+s+'</button>').join('')+'</div>'+
 '<section class="ks-settings">'+inner+'</section>'+
 '<p class="ks-tip">Ajustá una parte por vez, probá y usá Deshacer si lo necesitás. El motor 3D funciona sin gastar pedidos de IA.</p>';
 el.querySelectorAll('[data-forge-stage]').forEach(b=>b.onclick=()=>{studio.forgeStage=Number(b.dataset.forgeStage);editor(studio,el,cfg);});
 if(stage===0)el.querySelector('#fg-actor').onchange=e=>{studio.forgeActor=e.target.value;editor(studio,el,cfg);};
 const apply=el.querySelector('#fg-apply');
 apply.onclick=()=>{
  const next=clean(cfg),get=id=>el.querySelector('#'+id);
  if(stage===0){const p={...next.characters[current]};for(const k of ['name','style','skin','jacket','pants','hair','height'])p[k]=get('fg-'+k).value;next.characters[current]=p;}
  if(stage===1){next.environment={district:get('fg-district').value,light:get('fg-light').value,weather:get('fg-weather').value};next.quality=get('fg-quality').value;}
  if(stage===2){next.speed=get('fg-speed').value;next.motions={walk:get('fg-walk').value,run:get('fg-run').value,patrol:get('fg-patrol').value};next.lives=get('fg-lives').value;}
  if(stage===3){next.story={objective:get('fg-objective').value,dialogue:get('fg-dialogue').value,reply:get('fg-reply').value};}
  if(stage===4){next.title=get('fg-title').value;next.seconds=get('fg-time').value;}
  save(next);
 };
 if(stage===4)el.querySelector('#fg-play').onclick=()=>studio.playCurrent();
}
function lesson(el){
 el.innerHTML='<div class="ks-section-label">TALLER 3D · PROGRESO EN CINCO ETAPAS</div><h2>Un proyecto profesional se construye por partes</h2>'+
 '<p><b>Tema:</b> Diseño modular de videojuegos 3D, personajes y narrativa.</p><p><b>Capacidad:</b> Diseñar, integrar y evaluar los componentes de un videojuego interactivo.</p>'+
 '<ol><li>Personajes: editá protagonista y compañeros; reconocé proporciones, paleta y vestimenta.</li>'+
 '<li>Ambiente: elegí un distrito, iluminación y clima; probá la vista 3D.</li>'+
 '<li>Animaciones: caminá, corré, saltá, realizá un gesto y observá las patrullas.</li>'+
 '<li>Acciones y voz: escribí un diálogo y comprobá los subtítulos con E o Hablar.</li>'+
 '<li>Integración: recuperá registros, evitá los drones, completá la misión y guardá.</li></ol>'+
 '<h3>Indicadores</h3>'+[
 'Personalizo tres personajes distintos y compruebo cómo se ven.',
 'Modifico escenario e iluminación sin perder el proyecto.',
 'Pruebo movimiento y acciones sin errores.',
 'Escribo y reproduzco diálogos con subtítulos.',
 'Guardo y vuelvo a abrir una versión integrada.'
 ].map(t=>'<label class="ks-check"><input type="checkbox">'+t+'</label>').join('')+
 '<p>Esta primera base tiene modelos 3D procedurales estilizados. Realismo fotográfico, esqueletos de animación avanzados y voces grabadas requieren una etapa posterior de recursos 3D y audio.</p>';
}
window.StudioForge={create,clean,renderEditor:editor,renderLesson:lesson};
StudioKits.catalog.unshift({id:'cinematic3d',icon:'🎬',title:'HORIZON FORGE · Producción 3D',tag:'Personajes · Ciudad · Animación · Voces',description:'Construí un juego narrativo 3D por etapas y uní las piezas en una misión.',challenge:'Personalizá a Alex y Mara, cambiá el ambiente y comprobá la conversación y las acciones.'});
const prevCreate=StudioKits.create.bind(StudioKits),prevArt=StudioKits.art.bind(StudioKits);
StudioKits.create=id=>id==='cinematic3d'?create():prevCreate(id);
StudioKits.art=id=>id==='cinematic3d'?art(id):prevArt(id);
})();