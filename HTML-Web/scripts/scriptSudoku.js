// Sudoku engine: generador, solucionador (backtracking), y UI

// Utils
function clone(board){ return board.map(r=>r.slice()); }
function range(n){ return [...Array(n).keys()]; }

// Solver: backtracking
function solveBacktrack(board, limit=1){
  let solutions = 0;
  const b = clone(board);

  function valid(b,row,col,val){
    for(let i=0;i<9;i++) if(b[row][i]===val) return false;
    for(let i=0;i<9;i++) if(b[i][col]===val) return false;
    const sr=Math.floor(row/3)*3, sc=Math.floor(col/3)*3;
    for(let r=sr;r<sr+3;r++) for(let c=sc;c<sc+3;c++) if(b[r][c]===val) return false;
    return true;
  }

  function findEmpty(){
    for(let r=0;r<9;r++) for(let c=0;c<9;c++) if(b[r][c]===0) return [r,c];
    return null;
  }

  function backtrack(){
    if(solutions>=limit) return;
    const pos=findEmpty();
    if(!pos){ solutions++; return; }
    const [r,c]=pos;
    for(let v=1;v<=9;v++){
      if(valid(b,r,c,v)){
        b[r][c]=v;
        backtrack();
        b[r][c]=0;
        if(solutions>=limit) return;
      }
    }
  }
  backtrack();
  return solutions;
}

// Generar tablero completo
function generateFull(){
  const board=Array.from({length:9},()=>Array(9).fill(0));
  function valid(board,row,col,val){
    for(let i=0;i<9;i++) if(board[row][i]===val) return false;
    for(let i=0;i<9;i++) if(board[i][col]===val) return false;
    const sr=Math.floor(row/3)*3, sc=Math.floor(col/3)*3;
    for(let r=sr;r<sr+3;r++) for(let c=sc;c<sc+3;c++) if(board[r][c]===val) return false;
    return true;
  }
  function backtrack(pos=0){
    if(pos===81) return true;
    const r=Math.floor(pos/9), c=pos%9;
    let nums=[1,2,3,4,5,6,7,8,9].sort(()=>Math.random()-0.5);
    for(const n of nums){
      if(valid(board,r,c,n)){
        board[r][c]=n;
        if(backtrack(pos+1)) return true;
        board[r][c]=0;
      }
    }
    return false;
  }
  backtrack();
  return board;
}

// Crear puzzle con huecos
function makePuzzle(fullBoard, holesTarget){
  const puzzle=clone(fullBoard);
  let cells=range(81).sort(()=>Math.random()-0.5);
  let removed=0;
  for(const idx of cells){
    if(removed>=holesTarget) break;
    const r=Math.floor(idx/9), c=idx%9;
    const backup=puzzle[r][c];
    puzzle[r][c]=0;
    const sols=solveBacktrack(puzzle,2);
    if(sols!==1){ puzzle[r][c]=backup; }
    else { removed++; }
  }
  return puzzle;
}

// --- UI ---
const gridEl=document.getElementById('grid');
const status=document.getElementById('status');
let full=null, puzzle=null, givenMask=null;

function buildGrid(){
  gridEl.innerHTML='';
  for(let r=0;r<9;r++){
    for(let c=0;c<9;c++){
      const cell=document.createElement('div');
      cell.className='cell';
      if((r+1)%3===0 && r!==8) cell.style.borderBottom='3px solid #cbd5e1';
      if((c+1)%3===0 && c!==8) cell.style.borderRight='3px solid #cbd5e1';
      const input=document.createElement('input');
      input.type='text';
      input.maxLength=1;
      input.inputMode='numeric'; // ✅ móvil: teclado numérico
      input.pattern='[1-9]*';    // ✅ móvil
      input.dataset.r=r;
      input.dataset.c=c;
      input.addEventListener('input', onInput);
      input.addEventListener('keydown', onKeyDown);
      cell.appendChild(input);
      gridEl.appendChild(cell);
    }
  }
}

function onKeyDown(e){
  const inpt=e.target;
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){
    e.preventDefault();
    moveFocus(e.key,inpt);
  }
}
function moveFocus(dir,input){
  const r=+input.dataset.r, c=+input.dataset.c;
  let nr=r,nc=c;
  if(dir==='ArrowUp') nr=(r+8)%9;
  if(dir==='ArrowDown') nr=(r+1)%9;
  if(dir==='ArrowLeft') nc=(c+8)%9;
  if(dir==='ArrowRight') nc=(c+1)%9;
  const next=document.querySelector(`input[data-r="${nr}"][data-c="${nc}"]`);
  if(next) next.focus();
}

function onInput(e){
  const val=e.target.value.replace(/[^1-9]/g,'');
  e.target.value=val;
}

function renderBoard(board){
  const inputs=gridEl.querySelectorAll('input');
  inputs.forEach(inp=>{
    const r=+inp.dataset.r,c=+inp.dataset.c;
    inp.value=board[r][c]||'';
    inp.disabled=!!givenMask[r][c];
    inp.classList.toggle('givencell',!!givenMask[r][c]);
  });
}

function setPuzzle(newPuzzle,solution){
  puzzle=clone(newPuzzle);
  full=clone(solution);
  givenMask=Array.from({length:9},(_,r)=>Array.from({length:9},(_,c)=> newPuzzle[r][c]!==0));
  renderBoard(puzzle);
  status.textContent='Juego cargado';
}

// Botones
document.getElementById('newGame').addEventListener('click', ()=>{
  const holes=parseInt(document.getElementById('difficulty').value,10);
  startNew(holes);
});
document.getElementById('solve').addEventListener('click', ()=>{
  if(!full) return;
  fillBoard(full);
  status.textContent='Resuelto';
});
document.getElementById('check').addEventListener('click', ()=>{
  const current=readBoard();
  if(!current) return;
  const ok=validateBoard(current);
  status.textContent=ok? '¡Correcto (parcial/completo)!':'Hay errores en tu solución';
});
document.getElementById('clear').addEventListener('click', ()=>{
  if(!puzzle) return;
  const inputs=gridEl.querySelectorAll('input');
  inputs.forEach(inp=>{
    const r=+inp.dataset.r,c=+inp.dataset.c;
    if(!givenMask[r][c]) inp.value='';
  });
  status.textContent='Limpio';
});

// ✅ NUEVO: Botón Borrar para móviles
const eraseBtn=document.createElement('button');
eraseBtn.textContent='Borrar';
eraseBtn.className='primary';
eraseBtn.style.marginTop='6px';
eraseBtn.addEventListener('click', ()=>{
  const active=document.activeElement;
  if(active.tagName==='INPUT') active.value='';
});
document.querySelector('.controls').appendChild(eraseBtn);

function fillBoard(board){
  const inputs=gridEl.querySelectorAll('input');
  inputs.forEach(inp=>{
    const r=+inp.dataset.r,c=+inp.dataset.c;
    inp.value=board[r][c]||'';
  });
}
function readBoard(){
  if(!puzzle) return null;
  const board=Array.from({length:9},()=>Array(9).fill(0));
  const inputs=gridEl.querySelectorAll('input');
  for(const inp of inputs){
    const r=+inp.dataset.r,c=+inp.dataset.c;
    const v=inp.value.trim();
    board[r][c]=v===''?0:parseInt(v,10);
  }
  return board;
}
function validateBoard(board){
  for(let r=0;r<9;r++){
    const seen=new Set();
    for(let c=0;c<9;c++){const v=board[r][c]; if(v===0) continue; if(seen.has(v)) return false; seen.add(v);}
  }
  for(let c=0;c<9;c++){
    const seen=new Set();
    for(let r=0;r<9;r++){const v=board[r][c]; if(v===0) continue; if(seen.has(v)) return false; seen.add(v);}
  }
  for(let br=0;br<3;br++) for(let bc=0;bc<3;bc++){
    const seen=new Set();
    for(let r=br*3;r<br*3+3;r++) for(let c=bc*3;c<bc*3+3;c++){
      const v=board[r][c]; if(v===0) continue; if(seen.has(v)) return false; seen.add(v);
    }
  }
  let fullFlag=true;
  for(let r=0;r<9;r++) for(let c=0;c<9;c++) if(board[r][c]===0) fullFlag=false;
  if(fullFlag && full){
    for(let r=0;r<9;r++) for(let c=0;c<9;c++) if(board[r][c]!==full[r][c]) return false;
  }
  return true;
}

function startNew(holes){
  status.textContent='Generando... espera';
  setTimeout(()=>{
    const fullBoard=generateFull();
    const puzzleBoard=makePuzzle(fullBoard,holes);
    setPuzzle(puzzleBoard,fullBoard);
    status.textContent='Listo — buena suerte!';
  },50);
}

// init
buildGrid();
startNew(46);
