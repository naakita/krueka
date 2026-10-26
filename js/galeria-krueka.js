
/* Galería Krueka. Ilustraciones vectoriales ORIGINALES, descarga PNG local.
   Los archivos externos aportados son públicos SOLO cuando constan aprobados en Supabase. */
(()=>{
"use strict";
const CAT=["Medio ambiente","Tecnología","Paisajes","Historia","Geografía","Ciencias","Paraguay","Animales"];
const catalog=[
["Bosque y biodiversidad",0,"forest","arboles vida ecosistema"],["Reciclaje responsable",0,"recycle","separación residuos basura"],["Cuidemos el agua",0,"river","agua río naturaleza"],["Energía solar",0,"solar","energía renovable panel"],["Contaminación del aire",0,"city","humo fábrica ambiente"],["Energía eólica",0,"wind","molinos viento renovable"],["Protección del océano",0,"ocean","mar limpieza plástico"],["Deforestación",0,"forest","tala bosques árboles"],["Planeta saludable",0,"globe","ecología tierra protección"],
["Computadora y aprendizaje",1,"computer","informática tecnología monitor"],["Programación",1,"code","código software html"],["Robótica educativa",1,"robot","robot inteligencia tecnología"],["Microchips y circuitos",1,"chip","electrónica circuitos"],["Satélites",1,"satellite","espacio comunicaciones"],["Red de computadoras",1,"network","internet red dispositivos"],
["Montañas y valles",2,"mountain","montaña paisaje naturaleza"],["Atardecer en el campo",2,"sunset","paisaje sol cielo"],["Cataratas y río",2,"waterfall","cataratas cascada iguazú"],["Bosque tropical",2,"forest","selva verde"],["Lago tranquilo",2,"river","lago aguas"],["Llanuras",2,"sunset","llanura pradera"],
["Libros y conocimiento",3,"books","historia lectura biblioteca"],["Civilizaciones antiguas",3,"pyramid","historia arqueología"],["Línea del tiempo",3,"clock","épocas cronología"],["Monumentos históricos",3,"building","patrimonio arquitectura"],["Exploradores y mapas",3,"map","mapas descubrimientos"],["Documentos históricos",3,"scroll","documentos archivos"],
["Planisferio",4,"globe","planeta continentes"],["Rosa de los vientos",4,"compass","geografía puntos cardinales"],["Ciclo del agua",4,"rain","nubes lluvia evaporación"],["Relieve terrestre",4,"mountain","geografía montañas"],["Regiones del mundo",4,"map","mapas regiones"],["Volcanes",4,"volcano","geografía tierra magma"],
["Sistema solar",5,"solarSystem","ciencias planetas espacio"],["Átomo y materia",5,"atom","física química átomo"],["Laboratorio y experimentos",5,"microscope","ciencias microscopio"],["El ADN",5,"dna","biología genética"],["Células y vida",5,"cell","biología ciencias"],
["Bandera del Paraguay",6,"flag","paraguay bandera rojo blanco azul"],["Naturaleza paraguaya",6,"forest","bosque paraguay"],["Lapacho en flor",6,"lapacho","lapacho árboles paraguay"],["Ríos de Paraguay",6,"river","paraguay hidrografía"],["Paisajes del Chaco",6,"sunset","chaco paraguay paisaje"],
["Aves tropicales",7,"bird","aves pájaros tucán"],["Mariposas",7,"butterfly","insectos animales"],["Peces del río",7,"fish","peces agua"],["Felinos silvestres",7,"cat","jaguar yaguareté conservación"],["Ranas y anfibios",7,"frog","anfibios humedales"]
].map(([title,i,kind,tags],index)=>({id:index+1,title,cat:CAT[i],kind,tags}));
const palettes=[["#63cfd0","#0a746d","#268754"],["#7fa4ff","#3145a7","#5379f0"],["#a6cbe8","#30659e","#65a777"],["#f0c99e","#835f88","#bd8657"],["#73bbdd","#216daa","#70b4a1"],["#aab8f5","#4757a6","#6e78ca"],["#bed8fa","#2c6e9a","#e48c93"],["#9bd9a6","#337d60","#d8b65f"]];
const svgRect=(x,y,w,h,fill,rx=0)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+rx+'" fill="'+fill+'"/>';
function scene(k,i){
 const tree=(x,y,s=1)=>'<g transform="translate('+x+' '+y+') scale('+s+')"><rect x="-7" y="45" width="14" height="63" fill="#654831"/><path d="M0-60Q-73-15-48 26Q-90 65 0 72Q87 57 47 25Q70-12 0-60" fill="#27885e"/><path d="M0-44Q-48-2-23 21" fill="none" stroke="#b3efb2" stroke-width="8" opacity=".65"/></g>';
 const sun='<circle cx="420" cy="81" r="46" fill="#ffe7a2"/><circle cx="420" cy="81" r="61" fill="none" stroke="#fff5c0" stroke-width="3" opacity=".6"/>';
 const river='<path d="M0 310Q155 255 250 305T560 292V420H0Z" fill="#31afd1"/><path d="M22 340Q165 288 280 342T540 315" fill="none" stroke="#c4faff" stroke-width="6" opacity=".8"/>';
 const hills='<path d="M0 280Q110 166 248 265T560 235V420H0Z" fill="#75b69e"/><path d="M0 330Q180 225 350 320T560 260V420H0Z" fill="#2d917f"/>';
 const ring=(x,y,r,col)=>'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="none" stroke="'+col+'" stroke-width="7"/>';
 const molecule='<g stroke="#d7f6ff" stroke-width="8" fill="#3ac5d3"><path d="M198 172L274 124L366 182L328 268L226 278Z"/><circle cx="198" cy="172" r="18"/><circle cx="274" cy="124" r="18"/><circle cx="366" cy="182" r="18"/><circle cx="328" cy="268" r="18"/><circle cx="226" cy="278" r="18"/></g>';
 let v="";
 switch(k){
 case "forest":v=hills+tree(118,226,.72)+tree(258,232,1.05)+tree(406,236,.80);break;
 case "lapacho":v=hills+tree(265,220,1.15)+'<g fill="#f5a2bf" opacity=".88">'+[[-45,-10],[0,-52],[40,-16],[-60,42],[55,38]].map(([x,y])=>'<circle cx="'+(265+x)+'" cy="'+(220+y)+'" r="24"/>').join("")+'</g>';break;
 case "river":v=hills+river+tree(95,210,.68)+tree(470,220,.65);break;
 case "waterfall":v=hills+'<path d="M192 184H367L357 420H199Z" fill="#5bc8e6"/><path d="M218 190L232 400M299 190L308 402M336 190L329 405" stroke="#c8f8ff" stroke-width="13" opacity=".85"/>'+river;break;
 case "ocean":v=river+'<path d="M100 260Q195 170 290 260Q360 190 465 268" fill="none" stroke="#fff" stroke-width="11" opacity=".7"/><path d="M195 215q35-65 72-8" fill="none" stroke="#0a7891" stroke-width="11"/>';break;
 case "mountain":v='<path d="M0 335L170 102L296 281L378 139L560 335V420H0Z" fill="#406c9f"/><path d="M102 199L170 102L223 178L194 165L177 185L157 161Z M348 187L378 139L423 207L396 185L377 202Z" fill="#e2f5ff"/>'+river;break;
 case "sunset":v=sun+'<path d="M0 309Q170 216 296 288T560 249V420H0Z" fill="#e8b369"/><path d="M0 342Q180 284 342 328T560 298V420H0Z" fill="#a1ae77"/>'+tree(100,250,.45);break;
 case "recycle":v='<g transform="translate(280 221)" fill="#39ad7f" stroke="#ddfff1" stroke-width="5"><path d="M-6-116L61-10H16L-16-68L-54 4L-86-12Z"/><path d="M102 20L46 116L20 76L52 20L-28 21L-12-18Z"/><path d="M-100 25L-50-76L-23-43L-55 14L12 77L-18 107Z"/></g>';break;
 case "wind":v=hills+[125,275,425].map((x,j)=>'<g transform="translate('+x+' 220)"><path d="M0 0L-10 175H10Z" fill="#eefbff"/><circle r="12" fill="#fff"/><g transform="rotate('+(j*35)+')"><path d="M0 0L-20-125Q0-150 13-120Z M0 0L118 46Q145 55 126 72Z M0 0L-94 78Q-119 100-132 70Z" fill="#ecf9ff"/></g></g>').join("");break;
 case "solar":v=hills+'<path d="M165 230L415 230L455 345H122Z" fill="#182f71" stroke="#e1edff" stroke-width="10"/>'+[0,1,2].map(j=>'<path d="M'+(170+j*70)+' 234L'+(150+j*90)+' 339" stroke="#81bdf5" stroke-width="5"/>').join("")+'<path d="M145 286H434" stroke="#81bdf5" stroke-width="5"/>';break;
 case "city":v='<g fill="#557389">'+[40,125,210,314,404].map((x,j)=>svgRect(x,110+(j%3)*60,80,205-(j%3)*20,"#577c8f",4)).join("")+'</g>'+[56,145,235,331,423].map(x=>'<rect x="'+x+'" y="200" width="19" height="20" fill="#d7f5ff"/>').join("")+'<path d="M250 116Q230 82 252 54Q270 32 269 0" fill="none" stroke="#7a8c9f" stroke-width="22" opacity=".7"/>';break;
 case "computer":v=svgRect(116,116,330,212,"#1a355c",14)+svgRect(136,136,290,167,"#8dd6e4",8)+svgRect(262,328,35,49,"#254663")+svgRect(210,369,140,15,"#244460",7)+'<circle cx="282" cy="221" r="43" fill="#2c8fce"/><path d="M246 220l24 24l51-55" stroke="#fff" stroke-width="12" fill="none"/>';break;
 case "code":v=svgRect(84,87,392,286,"#203354",22)+svgRect(100,105,360,250,"#253e68",12)+'<path d="M204 174L146 225L204 275M351 174L410 225L351 275M310 153L247 295" fill="none" stroke="#91e8eb" stroke-width="16" stroke-linecap="round"/>';break;
 case "robot":v=svgRect(165,103,230,195,"#e4f8fc",30)+svgRect(197,145,65,46,"#2c5c91",14)+svgRect(300,145,65,46,"#2c5c91",14)+'<path d="M227 232Q282 273 338 232" fill="none" stroke="#248c9b" stroke-width="13"/>'+svgRect(200,307,160,61,"#a4cfd7",17)+'<path d="M280 105V56" stroke="#ecf9fd" stroke-width="12"/><circle cx="280" cy="47" r="17" fill="#ffe6a8"/>';break;
 case "chip":v=svgRect(169,100,229,238,"#15375f",18)+svgRect(210,139,147,163,"#49b6c9",10)+'<g stroke="#c4f0ff" stroke-width="11">'+[0,1,2,3].map(j=>'<path d="M'+(195+j*55)+' 100V58M'+(195+j*55)+' 339V382M170 '+(129+j*58)+'H122M398 '+(129+j*58)+'H442"/>').join("")+'</g><circle cx="280" cy="215" r="40" fill="#e8fafe"/>';break;
 case "network":v=molecule+'<path d="M112 340H449" stroke="#e5fbff" stroke-width="9"/>'+[165,286,403].map(x=>'<circle cx="'+x+'" cy="340" r="22" fill="#65e0c5" stroke="#fff" stroke-width="7"/>').join("");break;
 case "satellite":v='<g transform="rotate(-22 285 225)">'+svgRect(211,148,147,151,"#f2f9ff",17)+svgRect(86,172,115,99,"#2851a3")+svgRect(369,172,115,99,"#2851a3")+'<g stroke="#a6d8fc" stroke-width="5"><path d="M143 174V270M428 174V270M88 220H200M370 220H482"/></g><circle cx="284" cy="222" r="31" fill="#fed878"/></g>';break;
 case "books":v=[0,1,2,3].map((j)=>svgRect(146+j*62,126+(j%2)*26,65,215-(j%2)*26,["#e3c56a","#d8918f","#79bad5","#6e9e84"][j],5)+'<path d="M'+(172+j*62)+' 162V313" stroke="#f8f0cc" stroke-width="5"/>').join("");break;
 case "pyramid":v='<path d="M75 350L200 100L332 350Z" fill="#d9ba75"/><path d="M268 350L375 150L483 350Z" fill="#c89d60"/><path d="M200 100L332 350H200Z" fill="#ba965d"/>';break;
 case "building":v=svgRect(137,173,290,196,"#d5c9ad",3)+'<path d="M107 174L283 66L455 174Z" fill="#f5eddb"/>'+[180,247,314,382].map(x=>svgRect(x,196,27,138,"#fff3dc",4)).join("")+svgRect(127,348,315,27,"#e5dfc8",5);break;
 case "scroll":v='<path d="M137 114Q119 137 150 166V335Q160 375 198 347H413V119Z" fill="#fae6b1" stroke="#b88b60" stroke-width="8"/>'+[0,1,2,3].map(y=>'<path d="M205 '+(171+y*39)+'H373" stroke="#cda779" stroke-width="9"/>').join("");break;
 case "clock":v='<circle cx="280" cy="214" r="150" fill="#f8e5b1" stroke="#947a5c" stroke-width="18"/>'+[0,1,2,3].map(k=>'<path d="M280 '+(75+k*92)+'H280" stroke="#765c4e" stroke-width="8"/>').join("")+'<path d="M280 214V126M280 214L357 262" stroke="#76564d" stroke-width="16" stroke-linecap="round"/><circle cx="280" cy="214" r="14" fill="#76564d"/>';break;
 case "globe":v='<circle cx="280" cy="218" r="155" fill="#3fa8d7" stroke="#d9f8ff" stroke-width="14"/><path d="M211 81L249 105L237 151L286 179L277 242L216 262L195 326L163 262L140 181Z M314 92L392 127L423 198L367 239L352 310L310 331L291 261L333 205L298 147Z" fill="#6cc693"/><path d="M280 64V371M125 218H435" stroke="#dbf9ff" opacity=".35" stroke-width="8"/>';break;
 case "compass":v='<circle cx="280" cy="216" r="149" fill="#f6fbff" stroke="#23658d" stroke-width="16"/><path d="M280 83L316 217L280 355L244 217Z" fill="#2b9cab"/><path d="M280 83L244 217H280ZM280 355L316 217H280Z" fill="#eb9b7b"/><circle cx="280" cy="217" r="18" fill="#254665"/>';break;
 case "map":v='<path d="M75 122L201 80L346 130L480 78V321L346 374L201 329L75 370Z" fill="#f1eedc" stroke="#4d97af" stroke-width="9"/><path d="M201 80V329M346 130V374" stroke="#a5c5be" stroke-width="8"/><path d="M119 285Q197 168 262 227T432 156" fill="none" stroke="#4eac9c" stroke-width="12"/><circle cx="262" cy="227" r="20" fill="#e99b6b"/>';break;
 case "rain":v='<g fill="#f3fdff"><circle cx="196" cy="133" r="68"/><circle cx="278" cy="110" r="82"/><circle cx="357" cy="154" r="70"/><rect x="192" y="153" width="198" height="61"/></g>'+[148,230,305,390].map((x,j)=>'<path d="M'+x+' '+(248+(j%2)*24)+'l-22 65" stroke="#277fcb" stroke-width="13" stroke-linecap="round"/>').join("")+hills;break;
 case "volcano":v='<path d="M69 344L238 128H337L499 344Z" fill="#726d78"/><path d="M238 128H337L367 201L308 180L278 215L210 181Z" fill="#ef765b"/><path d="M276 94Q217 44 261 7M326 92Q367 40 320-4" fill="none" stroke="#e1d6df" stroke-width="18" opacity=".8"/>';break;
 case "solarSystem":v='<circle cx="280" cy="210" r="52" fill="#ffe68e"/>'+[93,152,202].map(r=>ring(280,210,r,"#bcd9f0")).join("")+'<circle cx="190" cy="210" r="21" fill="#78b8de"/><circle cx="397" cy="304" r="34" fill="#d99c81"/><circle cx="490" cy="218" r="18" fill="#a8a6d8"/>';break;
 case "atom":v='<circle cx="280" cy="213" r="31" fill="#f7e18f"/>'+[0,60,120].map(deg=>'<ellipse cx="280" cy="213" rx="170" ry="57" fill="none" stroke="#c9f8ff" stroke-width="11" transform="rotate('+deg+' 280 213)"/>').join("")+'<circle cx="447" cy="210" r="17" fill="#66e9ca"/>';break;
 case "microscope":v='<path d="M170 314H436M321 127L385 166L321 247L288 222Z" stroke="#dff6ff" stroke-width="26" fill="none" stroke-linecap="round"/><path d="M318 222Q426 279 337 342H216" stroke="#b2dee6" stroke-width="27" fill="none"/>'+svgRect(178,335,295,38,"#f2faff",14);break;
 case "dna":v='<path d="M209 72Q398 140 209 208T209 356M349 72Q159 140 349 208T349 356" stroke="#e3f9ff" stroke-width="17" fill="none"/>'+[99,142,181,225,270,311].map((y,j)=>'<path d="M'+(210+(j%2?33:0))+' '+y+'H'+(350-(j%2?33:0))+'" stroke="#fdd79b" stroke-width="10"/>').join("");break;
 case "cell":v='<ellipse cx="283" cy="220" rx="196" ry="133" fill="#85d5ae" stroke="#d3f4e1" stroke-width="12"/><ellipse cx="280" cy="218" rx="79" ry="69" fill="#6e93c7"/><circle cx="283" cy="220" r="30" fill="#f3b8ac"/>'+[0,1,2,3].map((j)=>'<ellipse cx="'+(150+j*85)+'" cy="'+(210+(j%2?56:-48))+'" rx="20" ry="12" fill="#369d85"/>').join("");break;
 case "flag":v='<path d="M153 81V369" stroke="#dee7f2" stroke-width="16"/>'+svgRect(163,91,255,80,"#cf404c")+svgRect(163,171,255,81,"#fff")+svgRect(163,252,255,81,"#325fbc")+'<circle cx="292" cy="210" r="24" fill="none" stroke="#6fbaa5" stroke-width="7"/>';break;
 case "bird":v='<path d="M116 305Q198 184 282 232Q329 160 420 167Q405 266 328 286L271 349Z" fill="#f6cf77"/><path d="M188 266Q220 173 311 258L274 335Z" fill="#4fb29c"/><circle cx="377" cy="190" r="12" fill="#1c4266"/><path d="M424 206L486 230L420 240Z" fill="#e79664"/>';break;
 case "butterfly":v='<g transform="translate(280 208)"><path d="M0 0Q-180-190-197-60Q-220 64-8 27Q-169 205-91 214Q-9 214 0 0Z M0 0Q180-190 197-60Q220 64 8 27Q169 205 91 214Q9 214 0 0Z" fill="#e2aa79" stroke="#f5e6d2" stroke-width="8"/><path d="M0-58V110" stroke="#284968" stroke-width="18"/><path d="M-3-47L-36-108M3-47L36-108" stroke="#284968" stroke-width="7"/></g>';break;
 case "fish":v=river+'<ellipse cx="270" cy="268" rx="133" ry="72" fill="#fbd687"/><path d="M390 265L472 190V340Z" fill="#f5bb78"/><circle cx="200" cy="247" r="13" fill="#2c627b"/><path d="M254 269L293 212L339 269Z" fill="#e1a870"/>';break;
 case "cat":v='<path d="M169 140L213 74L268 134L352 133L406 69L437 154L442 310Q282 408 121 306Z" fill="#e3b96a" stroke="#a77944" stroke-width="8"/><ellipse cx="228" cy="233" rx="21" ry="29" fill="#295b4c"/><ellipse cx="347" cy="233" rx="21" ry="29" fill="#295b4c"/><path d="M275 259L305 260L290 279Z" fill="#a56e58"/>'+[148,186,402,435].map(x=>'<circle cx="'+x+'" cy="194" r="13" fill="#855f42"/>').join("");break;
 case "frog":v='<ellipse cx="280" cy="275" rx="150" ry="93" fill="#60bc8a"/><circle cx="217" cy="196" r="47" fill="#7fd6a0"/><circle cx="356" cy="196" r="47" fill="#7fd6a0"/><circle cx="220" cy="196" r="20" fill="#1f4760"/><circle cx="353" cy="196" r="20" fill="#1f4760"/><path d="M217 299Q281 340 355 292" fill="none" stroke="#295c53" stroke-width="12"/>';break;
 default:v=globe;break;
 }
 return sun+v;
}
function image(item){
 const p=palettes[CAT.indexOf(item.cat)],gradient="g"+item.id;
 const escaped=item.title.replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
 return '<svg xmlns="http://www.w3.org/2000/svg" width="560" height="420" viewBox="0 0 560 420" role="img" aria-label="'+escaped+'"><defs><linearGradient id="'+gradient+'" x2="1" y2="1"><stop stop-color="'+p[0]+'"/><stop offset="1" stop-color="'+p[1]+'"/></linearGradient></defs>'+svgRect(0,0,560,420,'url(#'+gradient+')')+'<g opacity=".18"><circle cx="60" cy="65" r="80" fill="#fff"/><circle cx="535" cy="380" r="100" fill="#fff"/></g>'+scene(item.kind,item.id)+svgRect(0,375,560,45,"#102a46")+'<text x="24" y="402" font-family="Arial, sans-serif" font-weight="700" font-size="20" fill="#fff">'+escaped+'</text><text x="535" y="400" text-anchor="end" font-family="Arial" font-size="11" fill="#f0f9ff">KRUEKA</text></svg>';
}
function dataUri(item){return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(image(item));}
const $=id=>document.getElementById(id);
const catSel=$("gallery-category"), pills=$("gallery-categories"), grid=$("gallery-grid"), search=$("gallery-search");
let chosen="Todas",query="";
const safe=s=>String(s||"").replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
for(const cat of CAT){const option=document.createElement("option");option.textContent=cat;option.value=cat;catSel.appendChild(option);}
for(const cat of ["Todas",...CAT]){const b=document.createElement("button");b.className="pill";b.textContent=cat;b.type="button";b.dataset.category=cat;b.setAttribute("aria-pressed",String(cat==="Todas"));b.addEventListener("click",()=>{chosen=cat;catSel.value=cat;render();});pills.appendChild(b);}
function render(){
 const items=catalog.filter(x=>(chosen==="Todas"||x.cat===chosen)&&(x.title+" "+x.cat+" "+x.tags).toLocaleLowerCase("es").includes(query));
 $("gallery-count").textContent=items.length+" ilustraciones originales"+(chosen!=="Todas"?" en "+chosen:"");
 pills.querySelectorAll("button").forEach(x=>{const active=x.dataset.category===chosen;x.classList.toggle("active",active);x.setAttribute("aria-pressed",String(active));});
 grid.replaceChildren();
 if(!items.length){const msg=document.createElement("p");msg.textContent="No encontramos imágenes con ese filtro. Probá otra palabra o categoría.";grid.appendChild(msg);return;}
 for(const item of items){
  const card=document.createElement("article");card.className="tile";
  card.innerHTML='<img alt="'+safe(item.title)+'" loading="lazy"><div class="tile-content"><span class="tag">'+safe(item.cat)+'</span><h3>'+safe(item.title)+'</h3><p>Ilustración original Krueka · Libre para tareas educativas</p><div class="actions"><button class="btn" type="button">Descargar PNG</button><button class="btn secondary" type="button">Ver</button></div></div>';
  card.querySelector("img").src=dataUri(item);
  const [download,preview]=card.querySelectorAll("button");
  download.addEventListener("click",()=>savePng(item,download));
  preview.addEventListener("click",()=>{const win=window.open();if(win){win.document.title=item.title;const im=win.document.createElement("img");im.src=dataUri(item);im.alt=item.title;im.style.cssText="max-width:100%;height:auto";win.document.body.appendChild(im);}});
  grid.appendChild(card);
 }
}
async function savePng(item,button){
 const original=button.textContent;button.disabled=true;button.textContent="Preparando imagen…";
 try{
  const im=new Image();im.src=dataUri(item);await im.decode();
  const c=document.createElement("canvas");c.width=1120;c.height=840;const ctx=c.getContext("2d");if(!ctx)throw Error("Canvas no disponible");
  ctx.drawImage(im,0,0,c.width,c.height);
  const blob=await new Promise(resolve=>c.toBlob(resolve,"image/png"));
  if(!blob)throw Error("PNG no disponible");
  saveBlob(blob,'krueka-'+item.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-")+'.png');
 }catch(e){saveBlob(new Blob([image(item)],{type:"image/svg+xml"}),'krueka-ilustracion-'+item.id+'.svg');window.alert("Se descargó SVG compatible con Word moderno. Para PNG, probá Edge actualizado.");}
 finally{button.textContent=original;button.disabled=false;}
}
function saveBlob(blob,filename){const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);}
search.addEventListener("input",()=>{query=search.value.trim().toLocaleLowerCase("es");render();});
catSel.addEventListener("change",()=>{chosen=catSel.value;render();});
render();
// Community uploads are optional: built-in illustrations NEVER depend on Supabase.
const publicUrl="https://janebfpnknapvntfqolf.supabase.co";
const publicKey="sb_publishable_mSuSFqWycvm9dQQzjpeaRA_kAyZOJl0";
let client=null,role=null,user=null;
function note(s){$("community-status").textContent=s;}
function pictureUrl(path){if(!/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(png|jpg|webp)$/.test(path))return "";return client.storage.from("krueka-gallery").getPublicUrl(path).data.publicUrl;}
function tileCommunity(d){
 const url=pictureUrl(d.object_path);if(!url)return null;
 const tile=document.createElement("article");tile.className="tile";
 const img=document.createElement("img");img.src=url;img.loading="lazy";img.alt=d.description||d.title;tile.appendChild(img);
 const content=document.createElement("div");content.className="tile-content";
 const tag=document.createElement("span");tag.className="tag";tag.textContent=d.category;content.appendChild(tag);
 const h=document.createElement("h3");h.textContent=d.title;content.appendChild(h);
 const p=document.createElement("p");p.textContent=(d.description||"Imagen aportada a la comunidad educativa")+" · Usar solo con derechos o permiso";content.appendChild(p);
 const a=document.createElement("a");a.className="btn";a.href=url;a.target="_blank";a.rel="noopener noreferrer";a.download="";a.textContent="Abrir imagen";content.appendChild(a);tile.appendChild(content);return tile;
}
async function loadCommunity(){
 const {data,error}=await client.from("krueka_gallery_images").select("id,title,category,description,object_path,created_at").eq("published",true).order("created_at",{ascending:false}).limit(80);
 if(error)throw error;
 const root=$("community-grid");root.replaceChildren();
 for(const d of data||[]){const e=tileCommunity(d);if(e)root.appendChild(e);}
 note((data||[]).length?(data.length+" imágenes aprobadas de la comunidad educativa"):"La biblioteca pública de aportes comienza aquí. Ya podés usar las ilustraciones originales de arriba.");
}
async function initCommunity(){
 if(!window.supabase){note("Los aportes externos no están disponibles. Las ilustraciones originales siguen funcionando.");return;}
 client=window.supabase.createClient(publicUrl,publicKey,{auth:{persistSession:true}});
 try{await loadCommunity();}catch(e){note("La galería original está disponible. No se pudieron cargar los aportes.");}
 try{
  const {data:{user:who}}=await client.auth.getUser();user=who;
  if(!user)return;
  const {data:profile}=await client.from("profiles").select("role,activo").eq("id",user.id).maybeSingle();
  if(!profile?.activo||!["docente","admin"].includes(profile.role))return;
  role=profile.role;$("gallery-staff").hidden=false;
  const sel=$("gallery-upload-category");
  CAT.forEach(cat=>{const o=document.createElement("option");o.value=cat;o.textContent=cat;sel.appendChild(o);});
  $("gallery-upload-form").addEventListener("submit",upload);
  if(role==="admin"){$("gallery-admin").hidden=false;await pending();}
 }catch(e){/* Los recursos públicos no dependen de autenticación */ }
}
async function upload(e){
 e.preventDefault();const form=e.currentTarget, f=new FormData(form), file=f.get("photo"), status=$("gallery-upload-status");
 if(!(file instanceof File)||!["image/png","image/jpeg","image/webp"].includes(file.type)||file.size>2097152||file.size<100){status.textContent="Archivo no admitido. Elegí una imagen JPG, PNG o WebP de hasta 2 MB.";return;}
 const title=String(f.get("title")||"").trim(),category=String(f.get("category")||""),description=String(f.get("description")||"").trim();
 if(title.length<3||title.length>90||!CAT.includes(category)){status.textContent="Revisá el título y la categoría.";return;}
 const ext={"image/png":"png","image/jpeg":"jpg","image/webp":"webp"}[file.type];
 const path=user.id+"/"+crypto.randomUUID()+"."+ext;status.textContent="Subiendo imagen…";
 const submit=form.querySelector('button[type="submit"]');submit.disabled=true;
 try{
  const result=await client.storage.from("krueka-gallery").upload(path,file,{contentType:file.type,upsert:false});
  if(result.error)throw result.error;
  const record=await client.from("krueka_gallery_images").insert({title,category,description,object_path:path,submitted_by:user.id,published:false});
  if(record.error){await client.storage.from("krueka-gallery").remove([path]);throw record.error;}
  form.reset();status.textContent="Imagen recibida. Aparecerá públicamente después de la aprobación administrativa.";
  if(role==="admin")await pending();
 }catch(e){status.textContent="No se pudo subir: "+String(e.message||"Error de permisos").slice(0,150);}
 finally{submit.disabled=false;}
}
async function pending(){
 const {data,error}=await client.from("krueka_gallery_images").select("id,title,description,category,object_path,created_at").eq("published",false).order("created_at",{ascending:false}).limit(60);
 const root=$("gallery-pending");root.replaceChildren();
 if(error){root.textContent="No se pudieron consultar las propuestas.";return;}
 if(!data?.length){root.textContent="No hay propuestas pendientes.";return;}
 for(const d of data){
  const row=document.createElement("div");row.className="pending-item";
  const img=document.createElement("img");img.src=pictureUrl(d.object_path)||"";img.alt="Vista previa";row.appendChild(img);
  const span=document.createElement("span");span.textContent=d.title+" · "+d.category+" · "+(d.description||"Sin descripción");row.appendChild(span);
  for(const action of ["Aprobar","Rechazar"]){
   const button=document.createElement("button");button.className="btn "+(action==="Rechazar"?"secondary":"teal");button.textContent=action;button.addEventListener("click",async()=>{
    if(action==="Rechazar"&&!confirm("¿Rechazar y eliminar esta propuesta?"))return;
    button.disabled=true;let resp;
    if(action==="Aprobar")resp=await client.from("krueka_gallery_images").update({published:true}).eq("id",d.id);
    else resp=await client.from("krueka_gallery_images").delete().eq("id",d.id);
    if(resp.error){alert("No se pudo revisar: "+resp.error.message);button.disabled=false;return;}
    if(action==="Rechazar")await client.storage.from("krueka-gallery").remove([d.object_path]);
    await pending();await loadCommunity();
   });row.appendChild(button);
  }
  root.appendChild(row);
 }
}
initCommunity();
})();