/* Krueka Hero Lab: biblioteca de personajes originales y equipamiento combinable. */
(function(){
'use strict';
if(window.StudioHeroes||!window.StudioKits)return;
const categories={
 base:{knight:'Caballero',ranger:'Arquera',mage:'Hechicero',rogue:'Asesino',guardian:'Guardián',tech:'Tecnoguerrero'},
 armor:{plate:'Placas metálicas',leather:'Cuero táctico',robe:'Túnica',tech:'Armadura tecnológica'},
 head:{hood:'Capucha',helmet:'Casco',hair:'Cabello',crown:'Corona'},
 cape:{long:'Capa larga',short:'Capa corta',none:'Sin capa'},
 weapon:{sword:'Espada',bow:'Arco',staff:'Bastón',axe:'Hacha',daggers:'Dagas',none:'Sin arma'},
 role:{tank:'Tanque',damage:'Atacante',support:'Apoyo',control:'Control'},
 element:{shadow:'Sombra',fire:'Fuego',ice:'Hielo',light:'Luz',nature:'Naturaleza',arcane:'Arcano'},
 rarity:{common:'Común',rare:'Raro',epic:'Épico',legendary:'Legendario'}
};
const molds=[
 {id:'knight',name:'Centinela Carmesí',base:'knight',armor:'plate',head:'hood',cape:'long',weapon:'sword',primary:'#831e34',secondary:'#c5cbd4',accent:'#e7b17c',role:'tank',element:'shadow',rarity:'epic',stats:[940,128,185,79],skills:['Corte del eclipse','Muralla ancestral','Pacto carmesí','Juicio nocturno']},
 {id:'ranger',name:'Arquera del Alba',base:'ranger',armor:'leather',head:'hair',cape:'short',weapon:'bow',primary:'#23605b',secondary:'#9faeac',accent:'#76dfbf',role:'damage',element:'nature',rarity:'rare',stats:[700,176,83,161],skills:['Flecha certera','Paso del bosque','Viento cortante','Alba del guardián']},
 {id:'mage',name:'Oráculo del Vacío',base:'mage',armor:'robe',head:'crown',cape:'long',weapon:'staff',primary:'#492869',secondary:'#a499c6',accent:'#bd86f2',role:'control',element:'arcane',rarity:'legendary',stats:[620,191,76,112],skills:['Pulso arcano','Sello temporal','Vórtice violeta','Eclipse astral']},
 {id:'guardian',name:'Guardián de Brasa',base:'guardian',armor:'plate',head:'helmet',cape:'short',weapon:'axe',primary:'#6d3229',secondary:'#c0ad93',accent:'#ffa45c',role:'tank',element:'fire',rarity:'epic',stats:[1150,154,177,61],skills:['Hachazo ígneo','Piel de roca','Furia de brasa','Ceniza eterna']},
 {id:'rogue',name:'Sombra Errante',base:'rogue',armor:'leather',head:'hood',cape:'long',weapon:'daggers',primary:'#273447',secondary:'#a3b4c4',accent:'#4cdddb',role:'damage',element:'ice',rarity:'rare',stats:[680,179,91,172],skills:['Golpe furtivo','Paso de niebla','Doble filo','Noche cristalina']},
 {id:'tech',name:'Vanguardia Nova',base:'tech',armor:'tech',head:'helmet',cape:'none',weapon:'sword',primary:'#235369',secondary:'#96aabc',accent:'#52eded',role:'support',element:'light',rarity:'legendary',stats:[850,137,149,114],skills:['Carga de pulso','Escudo orbital','Apoyo vital','Nova absoluta']}
];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const cl=(x,a,b,d)=>Number.isFinite(Number(x))?Math.max(a,Math.min(b,Math.round(Number(x)))):d;
const color=(x,d)=>/^#[a-f0-9]{6}$/i.test(String(x))?String(x):d;
const choice=(x,items,d)=>Object.prototype.hasOwnProperty.call(items,x)?x:d;
const tx=(x,n,d)=>String(x==null?'':x).trim().slice(0,n)||d;
function template(which,id){
 const t=molds.find(x=>x.id===which)||molds[0];
 return {id:id||('h-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6)),name:t.name,
 base:t.base,armor:t.armor,head:t.head,cape:t.cape,weapon:t.weapon,
 primary:t.primary,secondary:t.secondary,accent:t.accent,skin:'#ba937a',
 role:t.role,element:t.element,rarity:t.rarity,level:1,
 stats:{hp:t.stats[0],attack:t.stats[1],defense:t.stats[2],speed:t.stats[3]},
 skills:[...t.skills],story:'El viaje de este héroe está por comenzar.',renderModel:({knight:'warrior',ranger:'ranger',mage:'wizard',guardian:'warrior',rogue:'rogue',tech:'monk'})[t.id]||'warrior',portrait:'',anim:{idle:'breath',move:'run',attack:t.weapon==='bow'?'shot':t.weapon==='staff'?'cast':t.weapon==='axe'?'smash':'slash'},fx:t.element};
}
function cleanHero(raw,i=0){
 const x=raw&&typeof raw==='object'?raw:{},d=template('knight','hero-'+i),s=x.stats||{};
 return {id:/^[a-z0-9-]{1,32}$/.test(String(x.id))?String(x.id):d.id,
 name:tx(x.name,40,d.name),base:choice(x.base,categories.base,d.base),
 armor:choice(x.armor,categories.armor,d.armor),head:choice(x.head,categories.head,d.head),
 cape:choice(x.cape,categories.cape,d.cape),weapon:choice(x.weapon,categories.weapon,d.weapon),
 primary:color(x.primary,d.primary),secondary:color(x.secondary,d.secondary),
 accent:color(x.accent,d.accent),skin:color(x.skin,d.skin),
 role:choice(x.role,categories.role,d.role),element:choice(x.element,categories.element,d.element),
 rarity:choice(x.rarity,categories.rarity,d.rarity),level:cl(x.level,1,99,1),
 stats:{hp:cl(s.hp,100,3000,940),attack:cl(s.attack,10,500,128),
 defense:cl(s.defense,10,500,185),speed:cl(s.speed,10,500,79)},
 skills:Array.from({length:4},(_,n)=>tx(Array.isArray(x.skills)?x.skills[n]:'',38,'Habilidad '+(n+1))),
 story:tx(x.story,300,'Una historia por descubrir.'),
 renderModel:choice(x.renderModel,{warrior:1,ranger:1,wizard:1,rogue:1,cleric:1,monk:1},({knight:'warrior',ranger:'ranger',mage:'wizard',guardian:'warrior',rogue:'rogue',tech:'monk'})[x.base]||'warrior'),
 portrait:/^data:image\/webp;base64,[a-zA-Z0-9+/=]{1,40000}$/.test(String(x.portrait||''))?String(x.portrait):'',
 anim:{idle:choice(x.anim?.idle,{breath:1,guard:1,focus:1},'breath'),move:choice(x.anim?.move,{walk:1,run:1,dash:1},'run'),attack:choice(x.anim?.attack,{slash:1,shot:1,cast:1,smash:1},'slash')},
 fx:choice(x.fx,{none:1,glow:1,fire:1,ice:1,shadow:1,arcane:1},'glow')};
}
function clean(raw){
 const r=raw&&typeof raw==='object'?raw:{},ids=new Set();
 let heroes=(Array.isArray(r.heroes)?r.heroes:[]).slice(0,8).map((h,i)=>{
  const x=cleanHero(h,i);if(ids.has(x.id))x.id='hero-'+i+'-copy';ids.add(x.id);return x;
 });
 if(!heroes.length)heroes=[template('knight','hero-1')];
 return {...(r.world&&typeof r.world==='object'?{world:r.world}:{}),...(r.combat&&typeof r.combat==='object'?{combat:r.combat}:{}),kind:'hero-manager',title:tx(r.title,64,'Mi colección RPG'),
 active:heroes.some(x=>x.id===r.active)?r.active:heroes[0].id,heroes};
}
function art(raw){
 const h=cleanHero(raw),tag='hr'+h.id.replace(/[^a-z0-9]/g,''),a=h.accent,s=h.secondary,p=h.primary;
 if(h.portrait)return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 540" role="img" aria-label="Retrato importado del héroe"><image width="320" height="540" preserveAspectRatio="xMidYMid slice" href="'+h.portrait+'"/></svg>';
 const metal='url(#'+tag+'m)';
 const cape=h.cape==='none'?'':h.cape==='short'?
 '<path d="M113 154 L80 269 Q158 301 230 268 L198 151Z" fill="'+p+'" stroke="#121a2b" stroke-width="5"/>':
 '<path d="M119 139 Q80 150 67 236 L34 505 Q100 533 159 505 Q204 536 261 499 L235 229 Q210 145 188 143Z" fill="'+p+'" stroke="#101829" stroke-width="7"/><path d="M106 178 Q72 310 67 486 L112 509 L133 186Z" fill="#fff" opacity=".08"/>';
 const body=h.armor==='robe'?
 '<path d="M107 166 Q157 149 207 172 L235 391 L74 391Z" fill="'+p+'" stroke="'+s+'" stroke-width="6"/><path d="M158 187 L159 377 M118 235 L203 235" stroke="'+a+'" stroke-width="6"/>':
 h.armor==='tech'?
 '<path d="M111 166 L207 168 L216 253 L181 330 L122 315 L99 234Z" fill="'+metal+'" stroke="#16293b" stroke-width="6"/><path d="M133 200 L189 203 L191 263 L158 292 L125 260Z" fill="#0a2939" stroke="'+a+'" stroke-width="5"/><path d="M157 212 L158 281" stroke="'+a+'" stroke-width="4"/>':
 h.armor==='leather'?
 '<path d="M112 168 L207 176 L211 276 L180 331 L118 314 L100 244Z" fill="'+p+'" stroke="#13212e" stroke-width="7"/><path d="M127 181 L186 204 L187 290 L129 304Z" fill="#162735" opacity=".55"/><path d="M129 207 L200 250 M120 250 L190 284" stroke="'+s+'" stroke-width="6"/>':
 '<path d="M107 167 L211 168 L226 239 L193 330 L126 332 L92 237Z" fill="'+metal+'" stroke="#172131" stroke-width="7"/><path d="M128 190 L188 197 L197 250 L160 293 L124 251Z" fill="'+s+'" opacity=".43"/><path d="M104 248 L162 277 L215 243 M130 309 L181 309" stroke="'+a+'" stroke-width="5"/>';
 const head=h.head==='helmet'?
 '<path d="M131 102 L158 74 L185 101 L191 157 L160 186 L128 160Z" fill="'+metal+'" stroke="#0f1928" stroke-width="7"/><path d="M134 130 L186 129 L178 148 L159 156 L139 146Z" fill="#101823"/><path d="M141 134 L179 134" stroke="'+a+'" stroke-width="4"/>':
 h.head==='hood'?
 '<path d="M163 66 Q113 64 108 134 L124 171 L155 188 L190 173 L215 133 Q201 71 163 66Z" fill="'+p+'" stroke="#1c1a23" stroke-width="7"/><path d="M145 111 Q161 101 180 117 L182 154 L139 155Z" fill="#181922"/><path d="M134 137 L189 137 L176 164 L145 163Z" fill="'+metal+'" stroke="#10131e" stroke-width="5"/><path d="M146 144 L179 144" stroke="'+a+'" stroke-width="3"/>':
 '<ellipse cx="161" cy="132" rx="35" ry="46" fill="'+h.skin+'" stroke="#49342e" stroke-width="5"/><path d="M126 116 Q121 75 164 72 Q196 78 201 113 L175 100 L145 105Z" fill="'+p+'" stroke="#19202d" stroke-width="5"/><path d="M140 134 L149 132 M174 132 L185 134" stroke="#211e26" stroke-width="5"/>'+
 (h.head==='crown'?'<path d="M126 116 L119 76 L147 87 L162 62 L186 91 L202 75 L193 116Z" fill="'+metal+'" stroke="'+a+'" stroke-width="4"/>':'');
 const weapon=h.weapon==='sword'?
 '<path d="M265 133 L278 341 L264 364 L252 341Z" fill="'+metal+'" stroke="#12202d" stroke-width="5"/><path d="M234 350 L293 351" stroke="'+a+'" stroke-width="10"/><path d="M266 353 L269 430" stroke="#513b36" stroke-width="15"/>':
 h.weapon==='bow'?
 '<path d="M280 140 Q345 315 278 470" fill="none" stroke="'+s+'" stroke-width="13"/><path d="M280 140 L278 470" stroke="'+a+'" stroke-width="3"/><path d="M240 307 L302 309" stroke="'+a+'" stroke-width="5"/>':
 h.weapon==='staff'?
 '<path d="M274 137 L269 500" stroke="#493939" stroke-width="15"/><path d="M274 67 L306 102 L273 144 L239 105Z" fill="'+a+'" stroke="'+s+'" stroke-width="8"/>':
 h.weapon==='axe'?
 '<path d="M275 155 L272 499" stroke="#51372c" stroke-width="14"/><path d="M256 167 Q205 139 213 102 L258 128 L285 162 L312 102 Q329 167 285 206Z" fill="'+metal+'" stroke="#172234" stroke-width="6"/>':
 h.weapon==='daggers'?
 '<path d="M62 279 L85 431 L68 457 L51 431Z M256 279 L231 431 L249 457 L268 429Z" fill="'+metal+'" stroke="'+a+'" stroke-width="6"/>':'';
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 540" role="img" aria-label="Personaje ilustrado configurable">'+
 '<defs><linearGradient id="'+tag+'m" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#edf3fa"/><stop offset=".24" stop-color="'+s+'"/><stop offset=".56" stop-color="#546879"/><stop offset=".8" stop-color="'+s+'"/><stop offset="1" stop-color="#263342"/></linearGradient>'+
 '<radialGradient id="'+tag+'h"><stop stop-color="'+a+'" stop-opacity=".32"/><stop offset="1" stop-color="'+a+'" stop-opacity="0"/></radialGradient></defs>'+
 '<circle cx="160" cy="268" r="155" fill="url(#'+tag+'h)"/><ellipse cx="160" cy="513" rx="94" ry="13" fill="#050c15" opacity=".6"/>'+
 cape+
 '<path d="M113 302 L161 326 L206 307 L222 422 L198 484 L168 503 L121 483 L99 416Z" fill="'+p+'" stroke="#18202b" stroke-width="6"/>'+
 '<path d="M124 330 L153 344 L142 472 L109 482Z M171 345 L199 327 L212 480 L174 480Z" fill="'+s+'" opacity=".28"/>'+
 '<path d="M118 435 L149 442 L142 510 L98 515Z M172 443 L203 438 L220 514 L172 514Z" fill="'+metal+'" stroke="#142231" stroke-width="6"/>'+
 '<path d="M106 200 L82 235 L85 311 L101 352 L124 339 L117 304 L124 255Z M210 199 L238 234 L237 313 L218 352 L196 342 L204 303 L201 254Z" fill="'+p+'" stroke="#172132" stroke-width="6"/>'+
 '<path d="M80 275 L125 274 L121 347 L85 345Z M202 274 L246 274 L240 344 L201 345Z" fill="'+metal+'" stroke="#1a2a39" stroke-width="5"/>'+
 body+
 '<path d="M109 168 Q73 153 57 201 L87 246 L118 213Z M206 168 Q242 149 257 201 L226 248 L195 214Z" fill="'+metal+'" stroke="#142132" stroke-width="6"/>'+
 '<path d="M61 206 L95 220 M220 222 L254 204" stroke="'+a+'" stroke-width="5"/>'+
 '<path d="M111 304 L208 306 L216 337 L107 336Z" fill="#29313a" stroke="'+s+'" stroke-width="5"/><path d="M140 306 L179 306 L181 344 L161 363 L139 342Z" fill="'+metal+'" stroke="'+a+'" stroke-width="4"/>'+
 head+weapon+'</svg>';
}
function previewRuntime(){
 const cfg=window.KRUEKA_GAME,opts=window.HERO_CHOICES;
 let active=cfg.active;
 const $=id=>document.getElementById(id),safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 const put=(id,value)=>$(id).textContent=value;
 function draw(){
  const hero=cfg.heroes.find(h=>h.id===active)||cfg.heroes[0];active=hero.id;
  put('title',cfg.title);document.title=cfg.title;
  $('roster').innerHTML=cfg.heroes.map(h=>'<button data-id="'+safe(h.id)+'" class="hero-card'+(h.id===active?' selected':'')+'" aria-pressed="'+(h.id===active)+'">'+
  '<span class="thumb">'+window.HERO_ART(h)+'</span><span><b>'+safe(h.name)+'</b><small>'+safe(opts.base[h.base])+' · Nv. '+h.level+'</small></span></button>').join('');
  $('portrait').innerHTML=window.HERO_ART(hero);
  put('name',hero.name);put('type',opts.base[hero.base]+' · '+opts.role[hero.role]);
  put('rank',opts.rarity[hero.rarity]+' · '+opts.element[hero.element]);put('lore',hero.story);
  $('stats').innerHTML=Object.entries(hero.stats).map(([k,v])=>'<div class="stat"><span>'+({hp:'VIDA',attack:'ATAQUE',defense:'DEFENSA',speed:'VELOCIDAD'}[k])+'</span><b>'+v+'</b><i style="width:'+Math.min(100,v/(k==='hp'?30:5))+'%"></i></div>').join('');
  $('skills').innerHTML=hero.skills.map((name,i)=>'<li><span class="gem">'+['✦','◈','✧','⬡'][i]+'</span><span><b>'+safe(name)+'</b><small>Habilidad '+(i+1)+'</small></span></li>').join('');
  $('roster').querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{active=b.dataset.id;draw();});
 }
 draw();
}
const html='<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Gestor de Héroes</title><link rel="stylesheet" href="style.css"></head><body>'+
 '<div class="wrap"><header><div><small>KRUEKA STUDIO · BIBLIOTECA DE PERSONAJES</small><h1 id="title">Mi colección RPG</h1></div><span>HERO LAB · ORIGINAL</span></header>'+
 '<div class="pipeline"><b>01 PERSONAJES</b><span>02 ESCENARIOS · PRÓXIMAMENTE</span><span>03 HABILIDADES Y COMBATE · PRÓXIMAMENTE</span></div>'+
 '<div class="columns"><aside class="roster"><h3>MI COLECCIÓN</h3><div id="roster"></div><p>Para crear más héroes o modificar su equipamiento abrí <b>Bases y reglas</b> en Krueka Studio.</p></aside>'+
 '<main class="hero-spot"><div class="rings"></div><div id="portrait"></div><section><span>HÉROE SELECCIONADO</span><h2 id="name"></h2><p id="type"></p><strong id="rank"></strong></section></main>'+
 '<aside class="details"><h3>ATRIBUTOS</h3><div id="stats"></div><h3>HABILIDADES</h3><ul id="skills"></ul><h3>HISTORIA</h3><p id="lore"></p></aside></div>'+
 '<footer>Personajes originales diseñados con moldes combinables en Krueka</footer></div><script src="game-config.js"></script><script src="hero.js"></script></body></html>';
function create(){
 const cfg=clean({title:'Mi colección RPG',active:'hero-1',heroes:[template('knight','hero-1'),template('ranger','hero-2'),template('mage','hero-3')]});
 return {'index.html':html,'style.css':":root{color-scheme:dark;font-family:system-ui,-apple-system,Segoe UI,sans-serif}*{box-sizing:border-box}body{margin:0;color:#e3edf8;background:radial-gradient(ellipse at 55% 8%,#19354e,#071423 66%,#050b16)}.wrap{max-width:1420px;margin:auto;padding:14px}header{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 3px;border-bottom:1px solid #35516b}header small{font-size:10px;color:#71cbd9;letter-spacing:.18em}header h1{font-size:clamp(20px,3vw,33px);margin:5px 0}header span{font-size:10px;border:1px solid #58758d;padding:9px}.pipeline{display:flex;gap:18px;flex-wrap:wrap;padding:12px 2px;font-size:10px;color:#7796ad}.pipeline b{color:#85e6ea}.columns{display:grid;grid-template-columns:minmax(160px,23%) minmax(230px,1fr) minmax(210px,27%);gap:10px;min-height:600px}.roster,.details{background:#0a1d30e6;border:1px solid #2e5067;border-radius:9px;padding:14px}.roster h3,.details h3{color:#dec48d;font-size:11px;letter-spacing:.16em;border-bottom:1px solid #2d4b61;padding:7px 0 10px;margin:5px 0 13px}button{color:inherit;cursor:pointer;font:inherit}.hero-card{width:100%;display:flex;align-items:center;text-align:left;gap:9px;margin-bottom:8px;padding:6px;background:#10283d;border:1px solid #2d5369;border-radius:7px}.hero-card.selected{border-color:#7adced;box-shadow:inset 3px 0 #70d7ea;background:#1d3a4f}.hero-card b,.hero-card small{display:block}.hero-card b{font-size:12px}.hero-card small{font-size:10px;color:#9bb7c8;margin-top:4px}.thumb{height:65px;width:52px;overflow:hidden;background:#0b192c;border-radius:4px;flex:none}.thumb svg{width:100%;height:90px}.roster p,.details p{font-size:12px;line-height:1.6;color:#a1b5c6}.hero-spot{position:relative;overflow:hidden;min-height:600px;border:1px solid #496b84;border-radius:9px;background:radial-gradient(ellipse at center,#2d465d,#0d1b2d 65%,#08101c);display:flex;align-items:end;justify-content:center}.hero-spot:after{content:\"\";position:absolute;inset:0;background:linear-gradient(transparent 60%,#060e1afa 98%);pointer-events:none}.rings{position:absolute;width:65%;aspect-ratio:1;border:2px solid #65879c40;border-radius:50%;top:10%;box-shadow:0 0 0 35px #54768b13,0 0 0 75px #54768b11}#portrait{position:absolute;inset:0 0 14%;display:flex;justify-content:center}#portrait svg{max-width:400px;width:100%;height:100%;filter:drop-shadow(0 15px 12px #0009)}.hero-spot section{z-index:1;text-align:center;position:relative;padding:0 15px 22px}.hero-spot section span{font-size:10px;letter-spacing:.18em;color:#dbba83}.hero-spot h2{font-size:clamp(24px,3.7vw,39px);margin:4px 0;text-shadow:0 4px 12px #000}.hero-spot section p{margin:5px;color:#a6c4d5;font-size:13px}.hero-spot section strong{display:inline-block;color:#e6ca9c;border:1px solid #675e55;padding:5px 12px;margin-top:6px;border-radius:4px;font-size:10px}.stat{display:grid;grid-template-columns:1fr auto;gap:4px 10px;margin:12px 0;font-size:11px}.stat span{color:#acc1cf;font-weight:bold}.stat i{display:block;grid-column:span 2;background:#68c5ce;height:4px;border-radius:3px}ul{list-style:none;padding:0}li{display:flex;gap:9px;align-items:center;padding:8px 0;border-bottom:1px solid #26465d}.gem{display:grid;place-items:center;width:39px;height:39px;background:radial-gradient(#643547,#221c31);border:1px solid #8e5c6b;border-radius:6px;color:#ffaaa9;font-size:22px;flex:none}li b,li small{display:block;font-size:11px}li small{color:#819ba9;margin-top:4px;font-size:10px}footer{text-align:center;color:#8ba4b8;font-size:10px;padding:18px}@media(max-width:750px){.columns{grid-template-columns:1fr 1fr}.roster{grid-column:1/-1}.roster #roster{display:flex;overflow-x:auto;gap:8px}.hero-card{min-width:156px;width:156px}.hero-spot{min-height:520px}}@media(max-width:510px){.columns{grid-template-columns:1fr}.hero-spot{min-height:520px}.top span{display:none}}",'game-config.js':StudioKits.configFile(cfg),
 'hero.js':'/* Motor autónomo del gestor; editá las reglas en game-config.js. */\nconst categories='+JSON.stringify(categories)+',molds='+JSON.stringify(molds)+';\nconst tx='+tx.toString()+',cl='+cl.toString()+',color='+color.toString()+',choice='+choice.toString()+';\n'+template.toString()+'\n'+cleanHero.toString()+'\nwindow.HERO_ART='+art.toString()+';\nwindow.HERO_CHOICES='+JSON.stringify(categories)+';\n('+previewRuntime.toString()+')();',
 'LEEME.md':'# GESTOR DE HÉROES · KRUEKA\n\n1. Abrí Bases y reglas y elegí un molde (caballero, arquera, hechicero, guardián, asesino o tecnoguerrero).\n2. Creá un héroe y cambiá armadura, cabeza, capa, arma y colores.\n3. Escribí nombre, historia, estadísticas y cuatro habilidades.\n4. Presioná Guardar héroe y comprobá su ficha en la vista previa.\n5. Probá una mejora pequeña en el Chat; pedí que cambie solo game-config.js.\n6. Guardá tu proyecto, cerralo y volvé a abrirlo en Mis proyectos.\n\nCapacidad: diseñar personajes para un videojuego combinando moldes y equipamiento.\nIndicadores: crea dos personajes; personaliza cuatro piezas; registra cuatro habilidades; comprueba guardado.\n\nEl arte inicial es vectorial estilizado, no fotorrealista. Combinar moldes no consume pedidos de IA.\n'};
}

function renderEditor(studio,el,raw){
 const cfg=clean(raw),selected=cfg.heroes.find(x=>x.id===(studio.heroSelected||cfg.active))||cfg.heroes[0];
 studio.heroSelected=selected.id;
 const option=(type,value)=>Object.entries(categories[type]).map(([key,label])=>'<option value="'+key+'" '+(value===key?'selected':'')+'>'+esc(label)+'</option>').join('');
 const select=(label,type)=>'<label>'+label+'<select data-piece="'+type+'">'+option(type,selected[type])+'</select></label>';
 const input=(label,id,type='text',extra='')=>'<label>'+label+'<input data-piece="'+id+'" type="'+type+'" value="'+esc(selected[id])+'" '+extra+'></label>';
 const statNames={hp:'Vida',attack:'Ataque',defense:'Defensa',speed:'Velocidad'};
 el.innerHTML='<div class="ks-section-label">KRUEKA · HERO LAB / ETAPA 1: PERSONAJES</div>'+
 '<div class="kh-editor-toolbar"><button class="ks-btn" type="button" id="kh-back-world">← Volver al mundo</button><button class="ks-btn primary" type="button" id="kh-open-render">✦ Abrir Render Pro 3D</button></div><h2>Gestor de Héroes</h2><p>Elegí un molde, agregalo a tu colección y combiná piezas preparadas. No tenés que dibujar ni programar para empezar.</p>'+
 '<section class="ks-settings"><h3>Mi colección · '+cfg.heroes.length+' / 8</h3><div class="kh-collection">'+cfg.heroes.map(h=>'<button class="ks-btn" data-person="'+esc(h.id)+'" aria-pressed="'+(selected.id===h.id)+'">'+esc(h.name)+'</button>').join('')+'</div>'+
 '<div class="ks-scene-actions"><button class="ks-btn" id="kh-copy" '+(cfg.heroes.length>=8?'disabled':'')+'>Duplicar personaje</button><button class="ks-btn" id="kh-remove" '+(cfg.heroes.length<=1?'disabled':'')+'>Quitar personaje</button></div></section>'+
 '<section class="ks-settings"><h3>Moldes disponibles · '+molds.length+'</h3><p>Estos héroes ya incluyen apariencia, estadísticas y habilidades. Hacé clic en un molde para agregarlo.</p>'+
 '<div class="kh-molds">'+molds.map(m=>'<button class="kh-mold" data-mold="'+m.id+'" '+(cfg.heroes.length>=8?'disabled':'')+'><span>'+art(template(m.id,'thumbnail-'+m.id))+'</span><b>'+esc(m.name)+'</b><small>＋ Crear</small></button>').join('')+'</div></section>'+
 '<section class="ks-settings"><h3>Tu héroe · piezas intercambiables</h3><div class="kh-live" aria-label="Vista del personaje seleccionado">'+art(selected)+'</div>'+
 '<div class="ks-fields">'+input('Nombre','name','text','maxlength="40"')+select('Tipo de héroe','base')+select('Armadura / traje','armor')+
 select('Cabeza','head')+select('Capa','cape')+select('Arma principal','weapon')+
 input('Color principal','primary','color')+input('Metal secundario','secondary','color')+
 input('Detalles brillantes','accent','color')+input('Tono de piel','skin','color')+
 select('Rol','role')+select('Elemento','element')+select('Rareza','rarity')+
 input('Nivel','level','number','min="1" max="99"')+'</div>'+
 '<h3>Estadísticas</h3><div class="ks-fields">'+Object.entries(selected.stats).map(([key,value])=>'<label>'+statNames[key]+'<input data-stat="'+key+'" type="number" min="'+(key==='hp'?100:10)+'" max="'+(key==='hp'?3000:500)+'" value="'+value+'"></label>').join('')+'</div>'+
 '<h3>Cuatro habilidades originales</h3><div class="ks-fields">'+selected.skills.map((value,i)=>'<label>Habilidad '+(i+1)+'<input data-skill="'+i+'" maxlength="38" value="'+esc(value)+'"></label>').join('')+'</div>'+
 '<label>Historia del personaje<textarea id="kh-story" maxlength="300" rows="3">'+esc(selected.story)+'</textarea></label>'+
 '<button class="ks-btn primary" id="kh-apply">Guardar este héroe y ver resultado →</button>'+
 '<p class="ks-tip">Guardá también el proyecto desde el botón Guardar de arriba. Deshacer permite recuperar una versión anterior.</p></section>'+
 '<section class="ks-settings"><h3>Próximos espacios del estudio</h3><p>01 Personajes ✅ · 02 Escenarios · 03 Habilidades y efectos · 04 Combate · 05 Historia e inventario. Las fichas de hoy se conservarán dentro del proyecto.</p>'+
 '<button class="ks-btn" id="kh-chat">Preparar mejora con el Chat IA</button></section>';
 const apply=(next,id)=>{if(studio.busy||!studio.cloudReady)return;
  const cleanCfg=clean(next);studio.checkpoint();studio.files['game-config.js']=StudioKits.configFile(cleanCfg);
  studio.heroSelected=id||cleanCfg.active;studio.changed();studio.refreshAll();studio.lock(false);
 };
 el.querySelectorAll('[data-person]').forEach(btn=>btn.onclick=()=>{studio.heroSelected=btn.dataset.person;renderEditor(studio,el,cfg);});
 el.querySelectorAll('[data-mold]').forEach(btn=>btn.onclick=()=>{
  if(cfg.heroes.length>=8)return;
  const id='h-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6);
  apply({...cfg,active:id,heroes:[...cfg.heroes,template(btn.dataset.mold,id)]},id);
 });
 el.querySelector('#kh-copy').onclick=()=>{if(cfg.heroes.length>=8)return;
  const id='h-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6);
  apply({...cfg,active:id,heroes:[...cfg.heroes,{...selected,id,name:tx(selected.name+' copia',40,'Mi héroe'),stats:{...selected.stats},skills:[...selected.skills]}]},id);
 };
 el.querySelector('#kh-remove').onclick=()=>{
  if(cfg.heroes.length<=1||!confirm('¿Quitar a este héroe de la colección? Si te equivocás, podés usar Deshacer.'))return;
  const heroes=cfg.heroes.filter(x=>x.id!==selected.id);apply({...cfg,heroes,active:heroes[0].id},heroes[0].id);
 };
 const readChanges=()=>{
  const h={...selected,stats:{...selected.stats},skills:[...selected.skills]};
  el.querySelectorAll('[data-piece]').forEach(x=>h[x.dataset.piece]=x.value);
  el.querySelectorAll('[data-stat]').forEach(x=>h.stats[x.dataset.stat]=x.value);
  el.querySelectorAll('[data-skill]').forEach(x=>h.skills[Number(x.dataset.skill)]=x.value);
  h.story=el.querySelector('#kh-story').value;
  return cleanHero(h,cfg.heroes.findIndex(x=>x.id===selected.id));
 };
 el.querySelectorAll('[data-piece],[data-stat],[data-skill],#kh-story').forEach(node=>{
  node.addEventListener('input',()=>{el.querySelector('.kh-live').innerHTML=art(readChanges());});
  node.addEventListener('change',()=>{el.querySelector('.kh-live').innerHTML=art(readChanges());});
 });
 el.querySelector('#kh-apply').onclick=()=>{
  const h=readChanges(),heroes=cfg.heroes.map(x=>x.id===selected.id?h:x);
  apply({...cfg,active:selected.id,heroes},selected.id);
 };
 el.querySelector('#kh-chat').onclick=()=>{
  studio.showTab('ai');
  const prompt=document.getElementById('ks-prompt');
  studio.draft='Ayudame a mejorar el héroe '+selected.name+' en game-config.js. Cambiá SOLO el nombre de una de sus cuatro habilidades en su ficha, sin borrar ningún otro héroe. Conservá index.html, hero.js y style.css. Explicá cómo comprobar el cambio.';
  prompt.value=studio.draft;studio.changed();prompt.focus();
 };
 if(window.StudioRenderPro)window.StudioRenderPro.decorate(studio,el,cfg);
 el.querySelector('#kh-back-world').onclick=()=>{studio.builderView='world';studio.renderCreator();el.scrollTop=0;};
 el.querySelector('#kh-open-render').onclick=()=>{const panel=el.querySelector('.kr-render-pro');if(panel)panel.scrollIntoView({block:'start',behavior:'auto'});else alert('Render Pro no terminó de cargar. Actualizá Krueka con Ctrl + F5.');};
 el.scrollTop=0;
}
function renderLesson(el){
 el.innerHTML='<div class="ks-section-label">CLUB DE INFORMÁTICA · CLASE GUIADA DE 60 MINUTOS</div><h2>Diseño de héroes de videojuego RPG</h2>'+
 '<p><b>Capacidad:</b> diseñar héroes originales mediante moldes, equipamiento, atributos, historia e IA.</p>'+
 '<ol><li><b>5 min:</b> Abrí Gestor de Héroes y entrá en Bases y reglas.</li>'+
 '<li><b>10 min:</b> Mirá los seis moldes preparados y creá un personaje nuevo.</li>'+
 '<li><b>15 min:</b> Cambiá al menos cuatro piezas: cabeza, armadura, capa, arma o colores. Guardá el héroe.</li>'+
 '<li><b>10 min:</b> Escribí su historia y poné nombres a cuatro habilidades.</li>'+
 '<li><b>10 min:</b> Abrí Chat, seleccioná Planear y pedile ayuda para mejorar una habilidad. Luego Construir si querés aplicar un cambio pequeño.</li>'+
 '<li><b>10 min:</b> Probá la galería, presioná Guardar, cerrá y recuperá desde Mis proyectos. Enviá al profe.</li></ol>'+
 '<h3>Indicadores de logro</h3>'+
 ['Creo un héroe nuevo a partir de un molde.','Combino cuatro piezas o colores diferentes.','Completo nombre, atributos, historia y cuatro habilidades.','Formulo un pedido claro a la IA y verifico el resultado.','Guardo y recupero mi colección.'].map(v=>'<label class="ks-check"><input type="checkbox">'+v+'</label>').join('')+
 '<p class="ks-tip">Los moldes no gastan solicitudes de la API. El chat IA sí consume el cupo. En esta etapa las figuras son ilustraciones vectoriales intercambiables, no personajes 3D fotorrealistas.</p>';
}


const worldDefaults={biome:'ruins',weather:'mist',time:'sunset',mission:'Recuperá el cristal antiguo y regresá al portal.',enemy:'shadow',difficulty:'normal',inventory:['Poción de vida','Llave antigua'],story:'Una energía desconocida despierta bajo las ruinas.'};
function worldClean(raw){
 const x=raw&&typeof raw==='object'?raw:{},w=x.world&&typeof x.world==='object'?x.world:{};
 return {...clean(x),world:{
  biome:choice(w.biome,{ruins:1,forest:1,city:1,desert:1,ice:1,space:1},worldDefaults.biome),
  weather:choice(w.weather,{clear:1,mist:1,rain:1,storm:1,snow:1},worldDefaults.weather),
  time:choice(w.time,{day:1,sunset:1,night:1},worldDefaults.time),
  mission:tx(w.mission,150,worldDefaults.mission),enemy:choice(w.enemy,{shadow:1,robot:1,beast:1,bandit:1},worldDefaults.enemy),
  difficulty:choice(w.difficulty,{easy:1,normal:1,hard:1},worldDefaults.difficulty),
  inventory:(Array.isArray(w.inventory)?w.inventory:worldDefaults.inventory).slice(0,8).map(v=>tx(v,30,'Objeto')),
  story:tx(w.story,300,worldDefaults.story)}};
}
function renderWorld(studio,el,raw){
 const cfg=worldClean(raw),w=cfg.world;
 const opts=(values,current)=>Object.entries(values).map(([v,l])=>'<option value="'+v+'" '+(v===current?'selected':'')+'>'+l+'</option>').join('');
 el.innerHTML='<div class="ks-section-label">KRUEKA · RPG BUILDER / ETAPA 2: MUNDO</div><h2>Constructor de escenarios</h2><p>El héroe que creaste pasa a este mundo. Elegí ambiente, clima, misión y enemigos.</p>'+
 '<section class="ks-settings"><div class="ks-fields"><label>Escenario<select id="kw-biome">'+opts({ruins:'Ruinas antiguas',forest:'Bosque encantado',city:'Ciudad futurista',desert:'Desierto',ice:'Reino helado',space:'Estación espacial'},w.biome)+'</select></label>'+
 '<label>Clima<select id="kw-weather">'+opts({clear:'Despejado',mist:'Niebla',rain:'Lluvia',storm:'Tormenta',snow:'Nieve'},w.weather)+'</select></label>'+
 '<label>Momento<select id="kw-time">'+opts({day:'Día',sunset:'Atardecer',night:'Noche'},w.time)+'</select></label>'+
 '<label>Enemigos<select id="kw-enemy">'+opts({shadow:'Sombras',robot:'Robots',beast:'Bestias',bandit:'Bandidos'},w.enemy)+'</select></label>'+
 '<label>Dificultad<select id="kw-difficulty">'+opts({easy:'Fácil',normal:'Normal',hard:'Difícil'},w.difficulty)+'</select></label></div>'+
 '<label>Misión principal<textarea id="kw-mission" maxlength="150" rows="2">'+esc(w.mission)+'</textarea></label>'+
 '<label>Historia del mundo<textarea id="kw-story" maxlength="300" rows="3">'+esc(w.story)+'</textarea></label>'+
 '<h3>Inventario inicial · hasta 8 objetos</h3><div class="ks-fields">'+Array.from({length:8},(_,i)=>'<label>Objeto '+(i+1)+'<input data-item="'+i+'" maxlength="30" value="'+esc(w.inventory[i]||'')+'"></label>').join('')+'</div>'+
 '<button class="ks-btn primary" id="kw-save">Guardar mundo →</button></section>'+
 '<section class="ks-settings"><h3>Flujo del estudio</h3><p>01 Personajes ✅ · 02 Mundo 🟦 · 03 Movimiento/Efectos · 04 Combate · 05 Historia/Inventario · 06 Probar juego</p></section>';
 el.querySelector('#kw-save').onclick=()=>{if(studio.busy||!studio.cloudReady)return;const world={biome:el.querySelector('#kw-biome').value,weather:el.querySelector('#kw-weather').value,time:el.querySelector('#kw-time').value,enemy:el.querySelector('#kw-enemy').value,difficulty:el.querySelector('#kw-difficulty').value,mission:el.querySelector('#kw-mission').value,story:el.querySelector('#kw-story').value,inventory:[...el.querySelectorAll('[data-item]')].map(x=>x.value).filter(Boolean)};studio.checkpoint();studio.files['game-config.js']=StudioKits.configFile(worldClean({...cfg,world}));studio.changed();studio.refreshAll();studio.lock(false);};
}
function renderMotion(studio,el,raw){
 const cfg=worldClean(raw),h=cfg.heroes.find(x=>x.id===cfg.active)||cfg.heroes[0],a=h.anim||{},opt=(vals,cur)=>Object.entries(vals).map(([v,l])=>'<option value="'+v+'" '+(v===cur?'selected':'')+'>'+l+'</option>').join('');
 el.innerHTML='<div class="ks-section-label">KRUEKA · RPG BUILDER / ETAPA 3: VIDA Y MOVIMIENTO</div><h2>Animaciones y efectos</h2><p>Definí cómo se comporta <b>'+esc(h.name)+'</b> dentro del juego.</p><section class="ks-settings"><div class="kh-live">'+art(h)+'</div><div class="ks-fields">'+
 '<label>En reposo<select id="km-idle">'+opt({breath:'Respirar',guard:'Guardia',focus:'Concentración'},a.idle)+'</select></label>'+
 '<label>Movimiento<select id="km-move">'+opt({walk:'Caminar',run:'Correr',dash:'Impulso rápido'},a.move)+'</select></label>'+
 '<label>Ataque<select id="km-attack">'+opt({slash:'Espadazo',shot:'Disparo',cast:'Hechizo',smash:'Golpe fuerte'},a.attack)+'</select></label>'+
 '<label>Efecto<select id="km-fx">'+opt({none:'Sin efecto',glow:'Aura',fire:'Fuego',ice:'Hielo',shadow:'Sombra',arcane:'Arcano'},h.fx)+'</select></label></div><button class="ks-btn primary" id="km-save">Guardar movimientos →</button></section>';
 el.querySelector('#km-save').onclick=()=>{const hero=cleanHero({...h,anim:{idle:el.querySelector('#km-idle').value,move:el.querySelector('#km-move').value,attack:el.querySelector('#km-attack').value},fx:el.querySelector('#km-fx').value});studio.checkpoint();studio.files['game-config.js']=StudioKits.configFile(worldClean({...cfg,heroes:cfg.heroes.map(x=>x.id===h.id?hero:x)}));studio.changed();studio.refreshAll();studio.lock(false);};
}
function renderCombat(studio,el,raw){
 const cfg=worldClean(raw),c=cfg.combat||{mode:'action',enemies:5,boss:true,reward:'Cristal del portal'};
 el.innerHTML='<div class="ks-section-label">KRUEKA · RPG BUILDER / ETAPA 4: COMBATE</div><h2>Reglas de combate</h2><p>Elegí cómo se enfrentará el héroe a los enemigos del escenario.</p><section class="ks-settings"><div class="ks-fields"><label>Tipo<select id="kc-mode"><option value="action" '+(c.mode==='action'?'selected':'')+'>Acción en tiempo real</option><option value="turn" '+(c.mode==='turn'?'selected':'')+'>Por turnos</option></select></label><label>Cantidad de enemigos<input id="kc-count" type="number" min="1" max="20" value="'+cl(c.enemies,1,20,5)+'"></label><label>Jefe final<select id="kc-boss"><option value="yes" '+(c.boss!==false?'selected':'')+'>Sí</option><option value="no" '+(c.boss===false?'selected':'')+'>No</option></select></label><label>Recompensa<input id="kc-reward" maxlength="50" value="'+esc(c.reward||'Cristal del portal')+'"></label></div><button class="ks-btn primary" id="kc-save">Guardar combate →</button></section>';
 el.querySelector('#kc-save').onclick=()=>{const combat={mode:el.querySelector('#kc-mode').value,enemies:cl(el.querySelector('#kc-count').value,1,20,5),boss:el.querySelector('#kc-boss').value==='yes',reward:tx(el.querySelector('#kc-reward').value,50,'Recompensa')};studio.checkpoint();studio.files['game-config.js']=StudioKits.configFile({...cfg,combat});studio.changed();studio.refreshAll();studio.lock(false);};
}
function renderStory(studio,el,raw){
 const cfg=worldClean(raw),w=cfg.world;
 el.innerHTML='<div class="ks-section-label">KRUEKA · RPG BUILDER / ETAPA 5: HISTORIA E INVENTARIO</div><h2>Historia jugable</h2><p>Uní el mundo, la misión y los objetos que el jugador deberá encontrar.</p><section class="ks-settings"><h3>Misión actual</h3><p>'+esc(w.mission)+'</p><label>Introducción<textarea id="ks-intro" maxlength="300" rows="4">'+esc(w.story)+'</textarea></label><h3>Objetos</h3><div class="kh-collection">'+w.inventory.map(v=>'<span class="ks-btn">'+esc(v)+'</span>').join('')+'</div><button class="ks-btn primary" id="ks-story-save">Guardar historia →</button></section>';
 el.querySelector('#ks-story-save').onclick=()=>{studio.checkpoint();studio.files['game-config.js']=StudioKits.configFile(worldClean({...cfg,world:{...w,story:el.querySelector('#ks-intro').value}}));studio.changed();studio.refreshAll();studio.lock(false);};
}
function renderPlay(studio,el,raw){
 const cfg=worldClean(raw),h=cfg.heroes.find(x=>x.id===cfg.active)||cfg.heroes[0],c=cfg.combat||{mode:'action',enemies:5,boss:true,reward:'Cristal del portal'},w=cfg.world;
 el.innerHTML='<div class="ks-section-label">KRUEKA · RPG BUILDER / ETAPA 6: PROBAR JUEGO</div><h2>'+esc(cfg.title)+'</h2><p>Esta pantalla reúne todo lo construido hasta ahora. La vista de la derecha sigue mostrando la ficha RPG; acá comprobamos las reglas antes de pasar al motor jugable completo.</p><section class="ks-settings"><div class="kh-live">'+art(h)+'</div><h3>'+esc(h.name)+'</h3><p><b>Mundo:</b> '+esc(w.biome)+' · '+esc(w.weather)+' · '+esc(w.time)+'</p><p><b>Misión:</b> '+esc(w.mission)+'</p><p><b>Movimiento:</b> '+esc(h.anim.move)+' · <b>Ataque:</b> '+esc(h.anim.attack)+' · <b>Efecto:</b> '+esc(h.fx)+'</p><p><b>Combate:</b> '+esc(c.mode)+' · '+cl(c.enemies,1,20,5)+' enemigos · jefe '+(c.boss?'sí':'no')+'</p><p><b>Inventario:</b> '+w.inventory.map(esc).join(' · ')+'</p><p><b>Recompensa:</b> '+esc(c.reward||'Recompensa')+'</p><button class="ks-btn primary" id="kp-chat">Pedir a la IA una misión nueva</button></section>';
 el.querySelector('#kp-chat').onclick=()=>{studio.showTab('ai');const p=document.getElementById('ks-prompt');studio.draft='Mejorá solamente la misión y la historia del mundo en game-config.js. Conservá mis héroes, sus piezas, movimientos, combate e inventario. Hacé una misión breve y jugable para chicos.';p.value=studio.draft;studio.changed();p.focus();};
}
function renderBuilder(studio,el,raw){
 const step=studio.rpgStep||'hero';
 const nav='<div class="kh-pipeline">'+[['hero','1 · Héroes'],['world','2 · Mundo'],['motion','3 · Vida'],['combat','4 · Combate'],['story','5 · Historia'],['play','6 · Probar']].map(([id,l])=>'<button data-rpg-step="'+id+'" class="ks-btn '+(step===id?'primary':'')+'">'+l+'</button>').join('')+'</div><div id="kh-stage"></div>';
 el.innerHTML=nav;el.querySelectorAll('[data-rpg-step]').forEach(b=>b.onclick=()=>{studio.rpgStep=b.dataset.rpgStep;renderBuilder(studio,el,StudioKits.read(studio.files));});
 const stage=el.querySelector('#kh-stage');
 if(step==='world')renderWorld(studio,stage,raw);else if(step==='motion')renderMotion(studio,stage,raw);else if(step==='combat')renderCombat(studio,stage,raw);else if(step==='story')renderStory(studio,stage,raw);else if(step==='play')renderPlay(studio,stage,raw);else renderEditor(studio,stage,raw);
}

window.StudioHeroes={categories,molds,template,clean,cleanHero,art,create,renderEditor,renderLesson,renderBuilder,renderWorld,renderMotion,renderCombat,renderStory,renderPlay};
StudioKits.catalog.unshift({id:'hero-manager',icon:'⚔️',title:'Gestor de Héroes · RPG Studio',tag:'PERSONAJES · EQUIPO · COLECCIÓN',description:'Armá héroes originales con moldes, armaduras, capas, armas y habilidades.',challenge:'Creá dos héroes distintos con cuatro piezas personalizadas.'});
const oldCreate=StudioKits.create.bind(StudioKits),oldArt=StudioKits.art.bind(StudioKits);
StudioKits.create=id=>id==='hero-manager'?create():oldCreate(id);
StudioKits.art=id=>id==='hero-manager'?'<svg viewBox="0 0 190 65" role="img" aria-label="Héroe con armadura" xmlns="http://www.w3.org/2000/svg"><rect width="190" height="65" rx="9" fill="#112238"/><path d="M75 65 L75 26 L97 9 L122 26 L115 65Z" fill="#98adbd" stroke="#142538" stroke-width="5"/><path d="M82 26 L96 7 L110 28 L104 47 L86 47Z" fill="#903349"/><path d="M86 35h19" stroke="#f0bb85" stroke-width="3"/><path d="M137 6 L135 65" stroke="#e0b17e" stroke-width="7"/></svg>':oldArt(id);
})();