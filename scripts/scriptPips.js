const dominoes = document.querySelectorAll('.domino');
const cells = document.querySelectorAll('.cell');
const dominoesTray = document.getElementById('dominoes');
const checkBtn = document.getElementById('checkBtn');

let placed = {};
let cellDomino = {};

dominoes.forEach((domino, index) => {
    domino.addEventListener('dragstart', e => {
        e.dataTransfer.setData("text/plain", domino.dataset.value);
        e.dataTransfer.setData("dominoIndex", index);
    });
});

cells.forEach((cell, idx) => {
    cell.addEventListener('dragover', e => {
        if(!cell.classList.contains('has-domino')&& cell.querySelector('.region-label') === null){
            e.preventDefault();
        }
    });

    cell.addEventListener('drop', e => {
        e.preventDefault();
        if(cell.classList.contains('has-domino'))return;
        const value = e.dataTransfer.getData("text/plain");
        const dominoIndex = e.dataTransfer.getData("dominoIndex");

        //Mostrar ficha en la celda
        cell.textContent = value;
        cell.classList.add('has-domino');

        //Guardar el registro
        cellDomino[idx] = value;

        //Oculatar ficha de la bandeja
        dominoes[dominoIndex].style.visibility = "hidden";

        UpdateSums();
    });

    //Quitar ficha al hacer click
    cell.addEventListener('click', () => {
        if(cell.classList.contains('has-domino')){
            const value = cellDomino[idx];
            const dominoIndex = Array.from(dominoes).findIndex(
                d => d.dataset.value === value && d.style.visibility === "hidden"
            );
            if(dominoIndex >= 0) {
                dominoes[dominoIndex].style.visibility = "visible";
                dominoesTray.appendChild(dominoes[dominoIndex]);
            }
            cell.textContent = "";
            cell.classList.remove('has-domino');
            delete cellDomino[idx];
            UpdateSums();
        }
    });
});

//Actualizar las sumas de cada region
function UpdateSums(){
    placed = {};
    cell.forEach((cell, idx) => {
        if(cell.classList.contains('has-domino')){
            const region = cell.dataset.region;
            const value = cellDomino[idx].split(",").map(Number).reduce((a,b) => a+b, 0);
            placed[region] = (placed[region] || 0) + value;
        }
    });

    const goals = {0:0, 1:5, 2:10, 3:9};
    let txt = "Sumas actuales: ";
    for(const r in goals){
        txt += `Región ${r}: ${placed[r] || 0} / Objetivo: ${goals[r]} &nbsp; `;
    }
    document.getElementById("regionSums").innerHTML = txt;
}

//Comprobar la solucion
function checkSolution(){
    const goals = { 0:0, 1:5, 2:10, 3:9};
    let ok = true;
    for(const r in goals){
        if((placed[r] || 0) !== goals[r]) ok = false;
    }
    document.getElementById("status").textContent = ok ? "✅ ¡Correcto!" : "❌ Revisa tu solución";
}
checkBtn.addEventListener('click', checkSolution);