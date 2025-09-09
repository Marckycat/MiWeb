document.addEventListener('DOMContentLoaded', () => {
    // --- Selección de Elementos del DOM ---
    const dominoes = document.querySelectorAll('.domino:not(.placed)');
    const cells = document.querySelectorAll('.cell');
    const board = document.getElementById('board');
    const checkBtn = document.getElementById('checkBtn');
    const statusEl = document.getElementById('status');
    const regionSumsEl = document.getElementById('regionSums');

    // --- Variables de Estado del Juego ---
    let draggedDomino = null;
    let isRotated = false;
    let placedDominoes = {}; // Almacena información de las fichas en el tablero
    let cellStates = {};     // Almacena el valor de la mitad de la ficha en cada celda

    // --- Lógica de Rotación ---
    document.addEventListener('keydown', (e) => {
        if ((e.key === 'r' || e.key === 'R') && draggedDomino) {
            isRotated = !isRotated;
            document.body.classList.toggle('rotate-cursor', isRotated);
        }
    });

    // --- Eventos de las Fichas de Dominó (Arrastrar) ---
    dominoes.forEach((domino, i) => {
        domino.id = `domino-tray-${i}`; // ID único para cada ficha en la bandeja
        domino.addEventListener('dragstart', handleDragStart);
        domino.addEventListener('dragend', handleDragEnd);
    });

    function handleDragStart(e) {
        draggedDomino = e.target;
        e.dataTransfer.setData('text/plain', draggedDomino.id);
        setTimeout(() => {
            draggedDomino.classList.add('dragging');
            document.body.classList.toggle('rotate-cursor', isRotated);
        }, 0);
    }

    function handleDragEnd() {
        if (draggedDomino) {
            draggedDomino.classList.remove('dragging');
        }
        document.body.classList.remove('rotate-cursor');
        draggedDomino = null;
        isRotated = false;
    }

    // --- Eventos de las Celdas del Tablero (Soltar) ---
    cells.forEach(cell => {
        cell.addEventListener('dragover', e => e.preventDefault());
        cell.addEventListener('dragenter', e => {
            e.preventDefault();
            if (!e.target.classList.contains('has-domino')) {
                e.target.classList.add('over');
            }
        });
        cell.addEventListener('dragleave', e => e.target.classList.remove('over'));
        cell.addEventListener('drop', handleDrop);
    });

    function handleDrop(e) {
        e.preventDefault();
        const targetCell = e.target;
        targetCell.classList.remove('over');

        const originalDominoId = e.dataTransfer.getData('text/plain');
        const originalDomino = document.getElementById(originalDominoId);
        if (!originalDomino) return;

        const cellIndex = Array.from(cells).indexOf(targetCell);
        let adjacentCellIndex;
        let canPlace = false;

        if (isRotated) { // Colocación VERTICAL
            adjacentCellIndex = cellIndex + 3; // Celda de abajo
            if (adjacentCellIndex < cells.length && !cells[cellIndex].classList.contains('has-domino') && !cells[adjacentCellIndex].classList.contains('has-domino')) {
                canPlace = true;
            }
        } else { // Colocación HORIZONTAL
            adjacentCellIndex = cellIndex + 1;
            const row = Math.floor(cellIndex / 3);
            const newRow = Math.floor(adjacentCellIndex / 3);
            if (row === newRow && !cells[cellIndex].classList.contains('has-domino') && !cells[adjacentCellIndex].classList.contains('has-domino')) {
                canPlace = true;
            }
        }

        if (canPlace) {
            placeDominoOnBoard(originalDomino, cellIndex, adjacentCellIndex);
        }
    }

    function placeDominoOnBoard(originalDomino, index1, index2) {
        // --- 1. Crear y posicionar la ficha visual ---
        const placedDomino = originalDomino.cloneNode(true);
        placedDomino.id = `placed-${originalDomino.id}`;
        placedDomino.classList.remove('dragging');
        placedDomino.classList.add('placed');
        placedDomino.draggable = false;
        
        const gridColumn = (index1 % 3) + 1;
        const gridRow = Math.floor(index1 / 3) + 1;
        placedDomino.style.gridColumnStart = gridColumn;
        placedDomino.style.gridRowStart = gridRow;

        if (isRotated) {
            placedDomino.classList.add('vertical');
            placedDomino.style.gridRowEnd = 'span 2';
        } else {
            placedDomino.classList.add('horizontal');
            placedDomino.style.gridColumnEnd = 'span 2';
        }
        board.appendChild(placedDomino);

        // --- 2. Actualizar el estado del juego ---
        const [val1, val2] = originalDomino.dataset.value.split(',').map(Number);
        cellStates[index1] = { value: val1, dominoId: originalDomino.id };
        cellStates[index2] = { value: val2, dominoId: originalDomino.id };
        cells[index1].classList.add('has-domino');
        cells[index2].classList.add('has-domino');
        placedDominoes[originalDomino.id] = {
            visualElement: placedDomino,
            cells: [index1, index2]
        };

        // --- 3. Ocultar ficha original y añadir evento para devolverla ---
        originalDomino.style.display = 'none';
        placedDomino.addEventListener('click', () => returnDominoToTray(originalDomino.id));
        
        updateSums();
    }

    function returnDominoToTray(originalDominoId) {
        const dominoInfo = placedDominoes[originalDominoId];
        if (!dominoInfo) return;

        // Limpiar celdas y estado
        dominoInfo.cells.forEach(index => {
            cells[index].classList.remove('has-domino');
            delete cellStates[index];
        });

        // Eliminar elemento visual y registro
        dominoInfo.visualElement.remove();
        delete placedDominoes[originalDominoId];

        // Mostrar ficha en la bandeja
        const originalDomino = document.getElementById(originalDominoId);
        originalDomino.style.display = 'flex';

        updateSums();
    }

    // --- Lógica de Suma y Comprobación ---
    let currentSums = {};
    const goals = { 0: 0, 1: 5, 2: 10, 3: 9 };

    function updateSums() {
        currentSums = {};
        // Inicializar todas las regiones a 0
        Object.keys(goals).forEach(region => currentSums[region] = 0);
        
        // Calcular sumas basadas en el estado de las celdas
        for (const cellIndex in cellStates) {
            const region = cells[cellIndex].dataset.region;
            const { value } = cellStates[cellIndex];
            if (currentSums[region] !== undefined) {
                currentSums[region] += value;
            }
        }

        // Mostrar las sumas en la página
        let txt = "Sumas actuales: ";
        for (const r in goals) {
            txt += `Región ${r}: ${currentSums[r] || 0} / ${goals[r]} &nbsp; `;
        }
        regionSumsEl.innerHTML = txt;
    }

    function checkSolution() {
        updateSums(); // Asegurarse de que las sumas estén al día
        let isCorrect = true;
        for (const region in goals) {
            if ((currentSums[region] || 0) !== goals[region]) {
                isCorrect = false;
                break;
            }
        }
        statusEl.textContent = isCorrect ? "✅ ¡Correcto!" : "❌ Revisa tu solución";
    }

    checkBtn.addEventListener('click', checkSolution);

    // Inicializar sumas al cargar la página
    updateSums();
});