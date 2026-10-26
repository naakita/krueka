
/* Krueka Play: 5 juegos propios y locales. Sin servicios externos, anuncios ni datos personales. */
(()=>{
"use strict";
const $=id=>document.getElementById(id);
const root=$("game-root"),help=$("game-help"),learn=$("game-learning");
const tabs=$("game-tabs");
let current="chess",state=null;
const info={
 chess:["Ajedrez de dos jugadores. Elegí una pieza y después una casilla marcada. Las piezas blancas comienzan abajo. Incluye jaque, jaque mate, enroque, captura al paso y promoción automática a dama.","Trabaja planificación, concentración y pensamiento lógico."],
 sudoku:["Completá los números del 1 al 9. En cada fila, columna y cuadro de 3×3 no se puede repetir un número. Tocá una casilla y después un número.","Practica patrones, análisis y razonamiento matemático."],
 memory:["Descubrí las parejas iguales. Solo dos tarjetas pueden estar visibles a la vez. Intentá resolverlo con la menor cantidad de movimientos.","Entrena atención, observación y memoria visual."],
 words:["Encontrá seis palabras relacionadas con el medio ambiente. Tocá la primera y la última letra; pueden estar en horizontal, vertical o diagonal.","Refuerza vocabulario, lectura y percepción visual."],
 quiz:["Respondé preguntas sobre ciencias, Paraguay, tecnología, historia y medio ambiente. Podés iniciar una ronda nueva cuando quieras.","Aprendé conceptos generales y revisá tus respuestas."]
};
const title={chess:"Ajedrez",sudoku:"Sudoku",memory:"Juego de memoria",words:"Sopa de letras",quiz:"Preguntas educativas"};
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function show(k){current=k;tabs.querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.game===k)));help.textContent=info[k][0];learn.textContent=info[k][1];reset();}
function reset(){
 if(current==="chess")state=chessNew();
 if(current==="sudoku")state=sudokuNew();
 if(current==="memory")state=memoryNew();
 if(current==="words")state=wordsNew();
 if(current==="quiz")state=quizNew();
 render();
}
function render(){root.innerHTML='<h2>'+title[current]+'</h2>';if(current==="chess")chessRender();if(current==="sudoku")sudokuRender();if(current==="memory")memoryRender();if(current==="words")wordsRender();if(current==="quiz")quizRender();}
function addMessage(txt){const d=document.createElement("p");d.className="game-status";d.setAttribute("role","status");d.textContent=txt;root.appendChild(d);}
function makeButton(text,cls,onClick,aria){
 const b=document.createElement("button");b.type="button";b.className=cls||"";b.textContent=text;if(aria)b.setAttribute("aria-label",aria);b.addEventListener("click",onClick);return b;
}
function rowActions(items){const row=document.createElement("div");row.className="actions";row.style.justifyContent="center";for(const [label,fn] of items)row.appendChild(makeButton(label,"btn secondary",fn));root.appendChild(row);}
tabs.addEventListener("click",e=>{const b=e.target.closest("button[data-game]");if(b)show(b.dataset.game);});
$("new-game").addEventListener("click",reset);
// ---- Ajedrez local para 2 alumnos ----
const symbols={K:"♔",Q:"♕",R:"♖",B:"♗",N:"♘",P:"♙",k:"♚",q:"♛",r:"♜",b:"♝",n:"♞",p:"♟"};
const inside=(r,c)=>r>=0&&r<8&&c>=0&&c<8;
const side=p=>!p?null:p===p.toUpperCase()?"w":"b";
function chessNew(){
 const rows=["rnbqkbnr","pppppppp","........","........","........","........","PPPPPPPP","RNBQKBNR"];
 return {board:rows.map(r=>r.split("").map(c=>c==="."?null:c)),turn:"w",chosen:null,ep:null,castle:{wK:true,wQ:true,bK:true,bQ:true},last:null,ended:false,message:"Turno de las blancas."};
}
function squareAttacked(b,r,c,by){
 // Peones atacan en diagonal hacia adelante.
 const dir=by==="w"?-1:1,pr=r-dir;
 for(const dc of [-1,1])if(inside(pr,c+dc)&&b[pr][c+dc]===(by==="w"?"P":"p"))return true;
 for(const [dr,dc] of [[1,2],[1,-2],[-1,2],[-1,-2],[2,1],[2,-1],[-2,1],[-2,-1]]){
  if(inside(r+dr,c+dc)&&b[r+dr][c+dc]===(by==="w"?"N":"n"))return true;
 }
 for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){
  if(dr===0&&dc===0)continue;
  const rr=r+dr,cc=c+dc;if(inside(rr,cc)&&b[rr][cc]===(by==="w"?"K":"k"))return true;
 }
 for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
  let rr=r+dr,cc=c+dc,steps=1;
  while(inside(rr,cc)){
   const p=b[rr][cc];if(p){
    const type=p.toUpperCase();if(side(p)===by&&(type==="Q"||(type==="R"&&(dr===0||dc===0))||(type==="B"&&dr!==0&&dc!==0)))return true;
    break;
   }
   rr+=dr;cc+=dc;steps++;
  }
 }
 return false;
}
function isCheck(board,color){for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(board[r][c]===(color==="w"?"K":"k"))return squareAttacked(board,r,c,color==="w"?"b":"w");return true;}
function moving(board,m){
 const b=board.map(row=>row.slice()),p=b[m.fr][m.fc];b[m.fr][m.fc]=null;
 if(m.enpassant)b[m.fr][m.tc]=null;
 if(m.castle){
  const rook=b[m.fr][m.castle.from];b[m.fr][m.castle.from]=null;b[m.fr][m.castle.to]=rook;
 }
 b[m.tr][m.tc]=(p.toUpperCase()==="P"&&(m.tr===0||m.tr===7))?(side(p)==="w"?"Q":"q"):p;
 return b;
}
function pseudo(st,r,c,castling=true){
 const b=st.board,p=b[r][c];if(!p)return [];
 const color=side(p),t=p.toUpperCase(),res=[];
 const push=(tr,tc,more={})=>{if(inside(tr,tc)&&side(b[tr][tc])!==color&&b[tr][tc]?.toUpperCase()!=="K")res.push({fr:r,fc:c,tr,tc,...more});};
 if(t==="P"){
  const dir=color==="w"?-1:1,one=r+dir;
  if(inside(one,c)&&!b[one][c]){push(one,c);const start=color==="w"?6:1;if(r===start&&!b[r+dir*2][c])push(r+dir*2,c,{double:true});}
  for(const dc of [-1,1]){const cc=c+dc;if(!inside(one,cc))continue;if(b[one][cc]&&side(b[one][cc])!==color)push(one,cc);if(st.ep&&st.ep.r===one&&st.ep.c===cc&&!b[one][cc]&&b[r][cc]?.toUpperCase()==="P"&&side(b[r][cc])!==color)push(one,cc,{enpassant:true});}
 }else if(t==="N"){
  for(const [dr,dc] of [[1,2],[1,-2],[-1,2],[-1,-2],[2,1],[2,-1],[-2,1],[-2,-1]])push(r+dr,c+dc);
 }else if(t==="K"){
  for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++)if(dr||dc)push(r+dr,c+dc);
  if(castling&&c===4&&r===(color==="w"?7:0)&&!isCheck(b,color)){
   for(const [code,rookCol,toCol,step] of [["K",7,6,1],["Q",0,2,-1]]){
    if(!st.castle[color+code]||b[r][rookCol]!== (color==="w"?"R":"r"))continue;
    const between=step===1?[5,6]:[1,2,3];
    if(between.some(col=>b[r][col]))continue;
    if(squareAttacked(b,r,4+step,color==="w"?"b":"w")||squareAttacked(b,r,toCol,color==="w"?"b":"w"))continue;
    push(r,toCol,{castle:{from:rookCol,to:code==="K"?5:3}});
   }
  }
 }else{
  const steps=[];
  if(["R","Q"].includes(t))steps.push([1,0],[-1,0],[0,1],[0,-1]);
  if(["B","Q"].includes(t))steps.push([1,1],[1,-1],[-1,1],[-1,-1]);
  for(const [dr,dc] of steps){let rr=r+dr,cc=c+dc;while(inside(rr,cc)){if(side(b[rr][cc])===color)break;push(rr,cc);if(b[rr][cc])break;rr+=dr;cc+=dc;}}
 }
 return res;
}
function legal(st,r,c){
 const p=st.board[r]?.[c];if(!p||side(p)!==st.turn)return [];
 return pseudo(st,r,c).filter(m=>!isCheck(moving(st.board,m),st.turn));
}
function anyLegal(st){
 for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(side(st.board[r][c])===st.turn&&legal(st,r,c).length)return true;
 return false;
}
function chessChoose(r,c){
 if(state.ended)return;
 if(state.chosen){
  const moves=legal(state,...state.chosen),found=moves.find(m=>m.tr===r&&m.tc===c);
  if(found){
   const old=state.board[found.tr][found.tc],p=state.board[found.fr][found.fc],color=state.turn;
   if(p.toUpperCase()==="K"){state.castle[color+"K"]=false;state.castle[color+"Q"]=false;}
   if(p.toUpperCase()==="R"){if(found.fr===(color==="w"?7:0)){if(found.fc===0)state.castle[color+"Q"]=false;if(found.fc===7)state.castle[color+"K"]=false;}}
   if(old?.toUpperCase()==="R"&&(found.tr===0||found.tr===7)&&(found.tc===0||found.tc===7)){const opponent=found.tr===0?"b":"w";state.castle[opponent+(found.tc===0?"Q":"K")]=false;}
   state.board=moving(state.board,found);
   state.ep=found.double?{r:(found.fr+found.tr)/2,c:found.tc}:null;
   state.last=found;state.chosen=null;state.turn=color==="w"?"b":"w";
   const checked=isCheck(state.board,state.turn);
   if(!anyLegal(state)){state.ended=true;state.message=checked?"¡Jaque mate! Ganaron las "+(color==="w"?"blancas.":"negras."):"Tablas: no quedan jugadas legales.";}
   else state.message=(checked?"¡Jaque! ":"")+"Turno de las "+(state.turn==="w"?"blancas.":"negras.");
   render();return;
  }
 }
 if(side(state.board[r][c])===state.turn)state.chosen=[r,c];else state.chosen=null;
 render();
}
function chessRender(){
 addMessage(state.message);
 const moves=state.chosen?legal(state,...state.chosen):[],b=document.createElement("div");b.className="board chess";b.setAttribute("role","group");b.setAttribute("aria-label","Tablero de ajedrez: dos jugadores");
 const files="abcdefgh";
 for(let r=0;r<8;r++)for(let c=0;c<8;c++){
  const piece=state.board[r][c],selected=state.chosen?.[0]===r&&state.chosen?.[1]===c;
  const move=moves.some(m=>m.tr===r&&m.tc===c);
  const last=state.last&&(state.last.fr===r&&state.last.fc===c||state.last.tr===r&&state.last.tc===c);
  b.appendChild(makeButton(symbols[piece]|| (move?"·":""),"chess-cell "+((r+c)%2?"dark":"light")+(selected?" picked":"")+(move?" hint":"")+(last?" last":""),()=>chessChoose(r,c),files[c]+(8-r)+" "+(piece?{"w":"Pieza blanca","b":"Pieza negra"}[side(piece)]+" "+piece:"vacía")));
 }
 root.appendChild(b);
 rowActions([["Reiniciar partida",reset]]);
}
// ---- Sudoku ----
const sudokuSolution="534678912672195348198342567859761423426853791713924856961537284287419635345286179";
const sudokuPuzzle="530070000600195000098000060800060003400803001700020006060000280000419005000080079";
let serial=0;
function sudokuNew(){
 const shift=(serial++*3)%9;
 const remap=(str)=>str.split("").map(n=>n==="0"?0:((Number(n)+shift-1)%9+1));
 return {values:remap(sudokuPuzzle),given:remap(sudokuPuzzle).map(Boolean),answer:remap(sudokuSolution),selected:-1,bad:[],message:"Elegí una casilla vacía para escribir un número."};
}
function sudokuFill(n){
 const s=state;if(s.selected<0||s.given[s.selected])return;s.values[s.selected]=n;s.bad=[];s.message=s.values.every((v,i)=>v===s.answer[i])?"¡Excelente! Completaste correctamente el sudoku.":"Seguí completando las filas y columnas.";render();
}
function sudokuRender(){
 addMessage(state.message);
 const b=document.createElement("div");b.className="sudoku-board";b.setAttribute("role","group");b.setAttribute("aria-label","Sudoku, nueve filas y nueve columnas");
 for(let i=0;i<81;i++){const val=state.values[i],t=makeButton(val||"", (state.given[i]?"given ":"")+(state.selected===i?"selected ":"")+(state.bad.includes(i)?"bad":""),()=>{state.selected=i;render();},"Fila "+(Math.floor(i/9)+1)+", columna "+(i%9+1)+(val?", número "+val:" vacía"));t.disabled=state.given[i];b.appendChild(t);}
 root.appendChild(b);
 const nums=document.createElement("div");nums.className="number-row";for(let n=1;n<=9;n++)nums.appendChild(makeButton(n,"btn secondary",()=>sudokuFill(n)));nums.appendChild(makeButton("Borrar","btn secondary",()=>sudokuFill(0)));root.appendChild(nums);
 rowActions([["Comprobar",()=>{state.bad=state.values.flatMap((v,i)=>v&&v!==state.answer[i]?[i]:[]);state.message=state.bad.length?"Hay "+state.bad.length+" casillas por corregir.":state.values.includes(0)?"Sin errores. Seguí completando.":"¡Sudoku resuelto!";render();}],
 ["Una pista",()=>{const i=state.selected>=0&&!state.given[state.selected]?state.selected:state.values.findIndex((v,j)=>v!==state.answer[j]);if(i<0)return;state.values[i]=state.answer[i];state.bad=[];state.message="Pista: se completó una casilla.";render();}]]);
}
document.addEventListener("keydown",e=>{if(current==="sudoku"&&state.selected>=0&&!["INPUT","TEXTAREA"].includes(document.activeElement?.tagName)){
 if(/^[1-9]$/.test(e.key))sudokuFill(Number(e.key));
 if(e.key==="Backspace"||e.key==="Delete")sudokuFill(0);
}});
// ---- Memoria ----
let memoryTimer=null;
function memoryNew(){if(memoryTimer)clearTimeout(memoryTimer);const icons=["🌿","🌎","💧","☀️","🐢","♻️","🌻","🌳"];return {cards:shuffle([...icons,...icons].map((v,i)=>({id:i,val:v,seen:false,match:false}))),open:[],moves:0,matches:0,locked:false,message:"Encontrá las parejas. ¡Empezamos!"};}
function memoryFlip(i){
 if(state.locked||state.cards[i].match||state.cards[i].seen)return;
 const s=state;s.cards[i].seen=true;s.open.push(i);
 if(s.open.length===2){
  s.moves++;
  if(s.cards[s.open[0]].val===s.cards[s.open[1]].val){
   s.cards[s.open[0]].match=s.cards[s.open[1]].match=true;s.matches++;s.open=[];
   s.message=s.matches===8?"¡Conseguiste las 8 parejas en "+s.moves+" intentos!":"¡Pareja encontrada! Seguí buscando.";
  }else{
   s.locked=true;s.message="No son iguales. Recordá dónde están.";
   memoryTimer=setTimeout(()=>{if(current!=="memory"||s!==state)return;for(const j of s.open)s.cards[j].seen=false;s.open=[];s.locked=false;render();},850);
  }
 }
 render();
}
function memoryRender(){
 addMessage(state.message+" · Parejas: "+state.matches+"/8 · Intentos: "+state.moves);
 const board=document.createElement("div");board.className="memory-board";
 state.cards.forEach((c,i)=>{const b=makeButton(c.seen||c.match?c.val:"?",c.match?"matched":c.seen?"open":"",()=>memoryFlip(i),"Tarjeta "+(i+1)+(c.match?", pareja encontrada":""));b.disabled=c.seen||c.match||state.locked;board.appendChild(b);});
 root.appendChild(board);rowActions([["Mezclar y empezar",reset]]);
}
// ---- Sopa de letras, posiciones horizontal, vertical o diagonal ----
const WORDS=["AGUA","BOSQUE","TIERRA","RECICLAR","PLANTA","ANIMAL"];
function wordsNew(){
 const n=12,g=Array.from({length:n},()=>Array(n).fill("")),positions=[],rng=()=>Math.floor(Math.random()*n);
 const directions=[[0,1],[1,0],[1,1],[1,-1],[0,-1],[-1,0],[-1,1]];
 for(const word of WORDS){
  let placed=false;
  for(let t=0;t<800&&!placed;t++){
   const r=rng(),c=rng(),[dr,dc]=directions[Math.floor(Math.random()*directions.length)];
   const endR=r+dr*(word.length-1),endC=c+dc*(word.length-1);
   if(endR<0||endR>=n||endC<0||endC>=n)continue;
   if([...word].some((l,i)=>g[r+i*dr][c+i*dc]&&g[r+i*dr][c+i*dc]!==l))continue;
   const squares=[];
   for(let i=0;i<word.length;i++){g[r+i*dr][c+i*dc]=word[i];squares.push((r+i*dr)*n+c+i*dc);}
   positions.push({word,squares});placed=true;
  }
  if(!placed)throw Error("No se pudo crear la sopa de letras");
 }
 const letters="AABCEGILMNOPRSTUV",arr=g.flat().map(v=>v||letters[Math.floor(Math.random()*letters.length)]);
 return {grid:arr,positions,found:[],marked:[],start:null,message:"Elegí la primera letra de una palabra."};
}
function wordsPick(i){
 const s=state;
 if(s.start===null){s.start=i;s.marked=[i];s.message="Ahora elegí la última letra de la palabra.";render();return;}
 const start=s.start,sr=Math.floor(start/12),sc=start%12,er=Math.floor(i/12),ec=i%12;
 const dr=Math.sign(er-sr),dc=Math.sign(ec-sc),dist=Math.max(Math.abs(er-sr),Math.abs(ec-sc));
 let path=[];
 if((sr===er||sc===ec||Math.abs(er-sr)===Math.abs(ec-sc))&&dist>0){
  for(let j=0;j<=dist;j++)path.push((sr+j*dr)*12+sc+j*dc);
 }
 const text=path.map(x=>s.grid[x]).join(""),word=s.positions.find(x=>!s.found.includes(x.word)&&(x.word===text||x.word===text.split("").reverse().join("")));
 if(word){s.found.push(word.word);s.marked=[...new Set([...s.marked,...word.squares])];s.message=s.found.length===WORDS.length?"¡Encontraste las seis palabras!":"¡Bien! Encontraste "+word.word+"."; }
 else s.message="No encontramos una palabra nueva en esa línea. Probá otra vez.";
 s.start=null;render();
}
function wordsRender(){
 addMessage(state.message);
 const words=document.createElement("div");words.className="word-list";
 for(const w of WORDS){const sp=document.createElement("span");sp.className=state.found.includes(w)?"done":"";sp.textContent=w;words.appendChild(sp);}root.appendChild(words);
 const grid=document.createElement("div");grid.className="word-board";grid.setAttribute("role","group");grid.setAttribute("aria-label","Sopa de letras, doce filas");
 const foundIdx=state.positions.filter(x=>state.found.includes(x.word)).flatMap(x=>x.squares);
 state.grid.forEach((letter,i)=>grid.appendChild(makeButton(letter,(foundIdx.includes(i)?"found ":"")+(state.start===i?"selected":""),()=>wordsPick(i),"Fila "+(Math.floor(i/12)+1)+", columna "+(i%12+1)+": "+letter)));
 root.appendChild(grid);rowActions([["Nueva sopa",reset]]);
}
// ---- Quiz educativo ----
const QUESTIONS=[
 ["¿Qué acción ayuda a cuidar el ambiente?",["Separar residuos","Quemar plásticos","Tirar basura al río"],0],
 ["¿Cuál es la capital de Paraguay?",["Concepción","Asunción","Encarnación"],1],
 ["¿Para qué sirve la fotosíntesis?",["Fabricar alimento en plantas","Producir plástico","Apagar luces"],0],
 ["¿Qué representa el símbolo ♻?",["Una señal de tránsito","Reciclaje","Una operación matemática"],1],
 ["¿Qué componente permite escribir en una computadora?",["Monitor","Teclado","Parlante"],1],
 ["¿Cuántos continentes suelen estudiarse en el modelo de seis continentes?",["4","6","9"],1],
 ["¿Qué estrella ilumina a la Tierra?",["El Sol","La Luna","Marte"],0],
 ["¿Qué recurso es renovable?",["Viento","Petróleo","Carbón"],0],
 ["¿Qué océano separa América de Europa y África?",["Índico","Atlántico","Ártico"],1],
 ["¿Qué órgano bombea la sangre?",["Corazón","Pulmón","Estómago"],0],
 ["¿Qué programa sirve para crear presentaciones?",["PowerPoint","Calculadora","Bloc de notas"],0],
 ["¿Cuál es la unidad principal para medir longitudes en el sistema métrico?",["Metro","Litro","Kilogramo"],0],
 ["¿Qué debemos hacer antes de compartir una foto de un compañero?",["Pedir permiso","Publicarla sin preguntar","Enviar a desconocidos"],0],
 ["¿Qué instrumento permite observar objetos diminutos?",["Microscopio","Brújula","Termómetro"],0],
 ["¿Qué acción protege mejor los cursos de agua?",["Reducir vertidos","Desechar pinturas en el río","Abandonar basura"],0]
];
function quizNew(){return {questions:shuffle(QUESTIONS.slice()).slice(0,10),index:0,selected:null,correct:0,message:"Leé la pregunta y elegí una respuesta."};}
function quizChoose(n){if(state.selected!==null)return;state.selected=n;if(n===state.questions[state.index][2])state.correct++;render();}
function quizNext(){if(state.index>=state.questions.length-1){state.index=state.questions.length;render();return;}state.index++;state.selected=null;render();}
function quizRender(){
 const s=state;
 if(s.index>=s.questions.length){addMessage("¡Terminaste! Respuestas correctas: "+s.correct+"/"+s.questions.length+".");rowActions([["Jugar otra ronda",reset]]);return;}
 const [text,opts,answer]=s.questions[s.index];addMessage("Pregunta "+(s.index+1)+" de "+s.questions.length+" · Aciertos: "+s.correct);
 const h=document.createElement("h3");h.textContent=text;root.appendChild(h);
 const options=document.createElement("div");options.className="quiz-options";
 opts.forEach((opt,i)=>{const b=makeButton(opt,s.selected!==null?(i===answer?"correct":i===s.selected?"wrong":""):"",()=>quizChoose(i));b.disabled=s.selected!==null;options.appendChild(b);});
 root.appendChild(options);
 if(s.selected!==null){addMessage(s.selected===answer?"¡Correcto!":"La respuesta correcta es: "+opts[answer]);rowActions([[s.index===s.questions.length-1?"Ver resultado":"Siguiente pregunta",quizNext]]);}
}
show("chess");
})();