/* Club Krueka: imágenes comprimidas, enlaces, videos y objetos 3D escolares. */
(function(){
'use strict';
const T=window.ClubTalleres,S=window.StudioIA;
if(window.ClubMedios||!T||!S)return;
const baseN=T.normalize,baseE=T.enhance,baseR=T.render;
const kinds=['historietas','animes','cuentos','dramas'],views=['Personaje','Imagen','Figura 3D'],shapes=['Cubo','Esfera','Pirámide'];
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const color=s=>/^#[0-9a-f]{6}$/i.test(s||'')?s:'#4b90df';
const image=s=>typeof s==='string'&&s.length<=12000&&/^data:image\/webp;base64,[A-Za-z0-9+/=]+$/.test(s)?s:'';
function link(s){try{const x=new URL(String(s||'').trim());return ['https:','http:'].includes(x.protocol)&&!x.username&&!x.password?x.href.slice(0,450):''}catch(e){return ''}}
function video(s){
 try{
  const u=new URL(String(s||'').trim());if(u.protocol!=='https:')return '';
  const host=u.hostname.toLowerCase().replace(/^www\./,'');
  if(['youtube.com','m.youtube.com','youtube-nocookie.com','youtu.be'].includes(host)){
   const v=host==='youtu.be'?u.pathname.split('/')[1]:(u.searchParams.get('v')||u.pathname.match(/\/(?:embed|shorts|live)\/([\w-]{11})/)?.[1]);
   return /^[\w-]{11}$/.test(v||'')?'https://www.youtube-nocookie.com/embed/'+v:'';
  }
  if(['vimeo.com','player.vimeo.com'].includes(host)){
   const v=u.pathname.match(/(\d{5,12})/)?.[1];return v?'https://player.vimeo.com/video/'+v:'';
  }
 }catch(e){}
 return '';
}
function normalize(raw){
 const b=baseN(raw),t=raw?.tools||{},images=t.images||{};
 return {...b,tools:{...b.tools,
  images:Object.fromEntries(['cover','0','1','2'].map(k=>[k,image(images[k])])),
  links:Array.from({length:3},(_,i)=>({label:String(t.links?.[i]?.label||'').slice(0,65),url:link(t.links?.[i]?.url)})),
  video:video(t.video),
  perScene:b.tools.perScene.map((p,i)=>{const x=t.perScene?.[i]||{};return {...p,
   visual:views.includes(x.visual)?x.visual:'Personaje',shape:shapes.includes(x.shape)?x.shape:'Cubo',
   hue:color(x.hue),angle:Math.max(-180,Math.min(180,Math.round(Number(x.angle)||0))),
   scale:Math.max(60,Math.min(145,Math.round(Number(x.scale)||100)))
  }})
 }};
}
function model(p){
 const shape=p.shape==='Esfera'?'ball':p.shape==='Pirámide'?'pyramid':'cube';
 let parts=shape==='ball'?'<span class="cm-ball"></span>':shape==='pyramid'?
 '<span class="cm-triangle a"></span><span class="cm-triangle b"></span><span class="cm-triangle c"></span><span class="cm-triangle d"></span>':
 '<span class="cm-face front"></span><span class="cm-face back"></span><span class="cm-face left"></span><span class="cm-face right"></span><span class="cm-face top"></span><span class="cm-face bottom"></span>';
 return '<div class="cm-model-stage"><div role="img" aria-label="Figura 3D giratoria" class="cm-model cm-'+shape+'" style="--cm-color:'+color(p.hue)+';--cm-angle:'+p.angle+'deg;--cm-size:'+p.scale/100+'">'+parts+'</div></div>';
}
const cssExtra='.cm-cover-img{max-width:220px;max-height:170px;object-fit:contain;border-radius:12px}.cm-panel-img{display:block;max-height:280px;max-width:100%;object-fit:contain;margin:10px auto;border-radius:10px}.cm-links{display:flex;gap:10px;flex-wrap:wrap;margin:18px 0}.cm-links a{background:var(--accent);color:#fff;padding:9px 13px;border-radius:9px;font-weight:bold}.cm-video{max-width:760px;margin:22px auto}.cm-video iframe{display:block;width:100%;aspect-ratio:16/9;border:0;border-radius:12px}.cm-model-stage{height:170px;perspective:650px;display:flex;align-items:center;justify-content:center;overflow:hidden}.cm-model{width:92px;height:92px;position:relative;transform-style:preserve-3d;animation:cm-orbit 8s linear infinite}.cm-face{position:absolute;inset:0;background:var(--cm-color);opacity:.88;border:2px solid #fff8;box-shadow:inset -15px -15px 20px #0003}.cm-cube .front{transform:translateZ(46px)}.cm-cube .back{transform:rotateY(180deg) translateZ(46px)}.cm-cube .left{transform:rotateY(-90deg) translateZ(46px)}.cm-cube .right{transform:rotateY(90deg) translateZ(46px)}.cm-cube .top{transform:rotateX(90deg) translateZ(46px)}.cm-cube .bottom{transform:rotateX(-90deg) translateZ(46px)}.cm-ball{display:block;width:92px;height:92px;border-radius:50%;background:radial-gradient(circle at 31% 24%,#fff9,var(--cm-color) 43%,#1c2a44 96%)}.cm-triangle{position:absolute;inset:0;clip-path:polygon(50% 0,0 100%,100% 100%);background:var(--cm-color);opacity:.9;transform-origin:center bottom}.cm-pyramid .a{transform:translateZ(27px) rotateX(16deg)}.cm-pyramid .b{transform:rotateY(90deg) translateZ(27px) rotateX(16deg)}.cm-pyramid .c{transform:rotateY(180deg) translateZ(27px) rotateX(16deg)}.cm-pyramid .d{transform:rotateY(270deg) translateZ(27px) rotateX(16deg)}.ck-public.paused .cm-model{animation-play-state:paused}@keyframes cm-orbit{from{transform:rotateX(-16deg) rotateY(var(--cm-angle)) scale(var(--cm-size))}to{transform:rotateX(-16deg) rotateY(calc(var(--cm-angle) + 360deg)) scale(var(--cm-size))}}';
function enhance(raw,files){
 const d=normalize(raw),t=d.tools,output=baseE(d,files),kind=d.kind;
 let html=output['index.html'];
 if(t.images.cover)html=html.replace('<div class="ck-cover">','<div class="ck-cover"><img class="cm-cover-img" alt="Imagen de portada" src="'+t.images.cover+'">');
 let index=0;
 html=html.replace(/(<article class="ck-panel\b[\s\S]*?)(<\/article>)/g,(match,start,end)=>{
  if(index>=3)return match;
  const i=index++,scene=t.perScene[i],src=t.images[String(i)];
  let element='';
  if(scene.visual==='Imagen'&&src)element='<img class="cm-panel-img" alt="Ilustración de la escena '+(i+1)+'" src="'+src+'">';
  else if(scene.visual==='Figura 3D'&&kinds.includes(kind))element=model(scene);
  else if(kind==='blogs'&&src)element='<img class="cm-panel-img" alt="Imagen del artículo '+(i+1)+'" src="'+src+'">';
  return start+element+end;
 });
 if(kind==='blogs'){
  const list=t.links.filter(l=>l.label&&l.url).map(l=>'<a href="'+esc(l.url)+'" rel="noopener noreferrer" target="_blank">'+esc(l.label)+' ↗</a>').join('');
  if(list)html=html.replace('</section>','</section><nav class="cm-links" aria-label="Enlaces del blog">'+list+'</nav>');
  if(t.video)html=html.replace('</section>','</section><section class="cm-video"><h2>Video del blog</h2><iframe loading="lazy" title="Video enlazado" src="'+esc(t.video)+'" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" allow="encrypted-media; picture-in-picture"></iframe></section>');
 }
 return {...output,'index.html':html,'style.css':output['style.css']+'\n'+cssExtra,'obra.json':JSON.stringify(d)};
}
function field(label,value,fn,type='text'){
 const l=document.createElement('label');l.className='ct-field',span=document.createElement('span');span.textContent=label;l.append(span);
 const input=document.createElement('input');input.type=type;input.maxLength=450;input.value=value||'';
 input.addEventListener('change',()=>fn(input.value));l.append(input);return l;
}
function selector(label,arr,value,fn){
 const l=document.createElement('label');l.className='ct-field',span=document.createElement('span');span.textContent=label;l.append(span);
 const e=document.createElement('select');arr.forEach(v=>{const option=document.createElement('option');option.value=v;option.textContent=v;e.append(option)});
 e.value=value;e.onchange=()=>fn(e.value);l.append(e);return l;
}
async function compact(file){
 if(!file||!/^image\/(png|jpeg|webp)$/.test(file.type)||file.size>7000000)throw Error('Elegí una imagen JPG, PNG o WebP menor de 7 MB.');
 const blob=URL.createObjectURL(file),picture=new Image();
 try{
  await new Promise((ok,bad)=>{picture.onload=ok;picture.onerror=()=>bad(Error('No se pudo abrir la imagen.'));picture.src=blob});
  const canvas=document.createElement('canvas');
  for(const width of [440,350,260,200,150]){
   const ratio=Math.min(1,width/picture.naturalWidth,270/picture.naturalHeight);
   canvas.width=Math.max(1,Math.round(picture.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(picture.naturalHeight*ratio));
   canvas.getContext('2d').drawImage(picture,0,0,canvas.width,canvas.height);
   for(const q of [.65,.45,.3,.2]){const data=canvas.toDataURL('image/webp',q);if(image(data))return data;}
  }
  throw Error('La imagen es demasiado grande. Probá otra más sencilla.');
 }finally{URL.revokeObjectURL(blob)}
}
function render(work,s,raw,onChange){
 baseR(work,s,raw,onChange);
 const d=normalize(raw),t=d.tools,host=work.querySelector('#ck-specific-tools');if(!host)return;
 const current=()=>{try{return normalize(JSON.parse(s.files['obra.json']))}catch(e){return d}};
 const change=fn=>{const v=current();fn(v);onChange(v)};
 const panel=document.createElement('section');panel.className='cm-assets';
 const h=document.createElement('strong');h.textContent='🖼️ Imágenes para tu obra';panel.append(h);
 const hint=document.createElement('p');hint.textContent='Imágenes propias en JPG, PNG o WebP. Se comprimen y guardan en tu proyecto. Evitá fotografías y datos personales.';panel.append(hint);
 function uploader(name,key){
  const line=document.createElement('div');line.className='cm-upload';
  const l=document.createElement('span');l.textContent=name;
  const input=document.createElement('input');input.type='file';input.accept='image/png,image/jpeg,image/webp';input.setAttribute('aria-label',name);
  const message=document.createElement('small');message.textContent=t.images[key]?'✓ Guardada':'Sin imagen';
  input.onchange=async()=>{
   if(!input.files?.[0])return;input.disabled=true;message.textContent='Comprimiendo…';
   try{const data=await compact(input.files[0]);if(!s.cloudReady||s.busy)throw Error('El proyecto no está disponible.');
    change(d=>{d.tools.images[key]=data;if(key!=='cover'&&kinds.includes(d.kind))d.tools.perScene[Number(key)].visual='Imagen'});
    message.textContent='✓ Imagen incorporada';
   }catch(e){message.textContent='⚠ '+e.message}finally{input.disabled=false;input.value=''}
  };
  const remove=document.createElement('button');remove.type='button';remove.textContent='Quitar';remove.onclick=()=>{change(d=>d.tools.images[key]='');message.textContent='Imagen quitada'};
  line.append(l,input,remove,message);panel.append(line);
 }
 uploader('Imagen de portada','cover');
 if(d.kind==='blogs'||kinds.includes(d.kind))for(let i=0;i<3;i++)uploader('Imagen parte '+(i+1),String(i));
 host.append(panel);
 if(d.kind==='blogs'){
  const box=document.createElement('section');box.className='cm-assets';
  const title=document.createElement('strong');title.textContent='🎬 Video y enlaces del blog';box.append(title);
  const help=document.createElement('p');help.textContent='Podés usar videos públicos de YouTube o Vimeo mediante enlace. Los MP4 grandes no se suben todavía.';box.append(help);
  box.append(field('URL de YouTube o Vimeo',t.video,v=>{
   const result=video(v);if(v.trim()&&!result){help.textContent='⚠ Enlace no compatible';return}
   change(d=>d.tools.video=result);help.textContent='✓ Video vinculado';
  },'url'));
  for(let i=0;i<3;i++){
   const row=document.createElement('div');row.className='cm-link';
   row.append(field('Texto del enlace '+(i+1),t.links[i].label,v=>change(d=>d.tools.links[i].label=v.slice(0,65))));
   row.append(field('Dirección web',t.links[i].url,v=>{
    if(v.trim()&&!link(v)){help.textContent='⚠ Dirección inválida';return}
    change(d=>d.tools.links[i].url=link(v));
   },'url'));
   box.append(row);
  }
  host.append(box);
 }
 if(kinds.includes(d.kind)){
  const box=document.createElement('section');box.className='cm-assets';
  const title=document.createElement('strong');title.textContent='🧊 Personajes, dibujos y figuras 3D por escena';box.append(title);
  const note=document.createElement('p');note.textContent='Elegí personaje, imagen o figura 3D básica; modificá forma, giro y color.';box.append(note);
  for(let i=0;i<3;i++){
   const scene=t.perScene[i],group=document.createElement('fieldset');group.className='cm-scene';
   const legend=document.createElement('legend');legend.textContent='Escena '+(i+1);group.append(legend);
   const update=(key,value)=>change(d=>d.tools.perScene[i][key]=value);
   group.append(selector('Mostrar',views,scene.visual,v=>update('visual',v)));
   group.append(selector('Figura 3D',shapes,scene.shape,v=>update('shape',v)));
   group.append(field('Color',scene.hue,v=>update('hue',v),'color'));
   for(const [label,key,min,max] of [['Giro','angle',-180,180],['Tamaño','scale',60,145]]){
    const l=document.createElement('label');l.className='ct-field';
    const sp=document.createElement('span');sp.textContent=label+': '+scene[key];l.append(sp);
    const e=document.createElement('input');e.type='range';e.min=String(min);e.max=String(max);e.value=String(scene[key]);
    e.oninput=()=>sp.textContent=label+': '+e.value;e.onchange=()=>update(key,Number(e.value));l.append(e);group.append(l);
   }
   box.append(group);
  }
  host.append(box);
 }
}
const prior=S.buildPreview;
S.buildPreview=function(path){
 const html=prior.apply(this,arguments);
 if(this.files?.['tipo-club.txt']!=='blogs')return html;
 return html.replace("base-uri 'none';","frame-src https://www.youtube-nocookie.com https://player.vimeo.com; base-uri 'none';");
};
T.normalize=normalize;T.enhance=enhance;T.render=render;
window.ClubMedios={normalize,enhance,render,video,link,compact};
})();