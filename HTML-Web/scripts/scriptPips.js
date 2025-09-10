document.addEventListener('DOMContentLoaded', () => {
    // --- Selección de Elementos del DOM ---
    const dominoes = document.querySelectorAll('.dominoes .domino');
    const cells = document.querySelectorAll('.cell');
    const board = document.getElementById('board');
    const checkBtn = document.getElementById('checkBtn');
    const statusEl = document.getElementById('status');
    const regionSumsEl = document.getElementById('regionSums');

    // --- Variables de Estado del Juego ---
    let draggedDomino = null;
    let placedDominoes = {}; // Almacena info de fichas en el tablero
    let cellStates = {};     // Almacena el valor de cada celda

    // --- Lógica de rotación en la BANDEJA con un clic ---
    dominoes.forEach(domino => {
        domino.addEventListener('click', (e) => {
            // Evita que el click interfiera con el inicio del arrastre
            if (domino.classList.contains('dragging')) return;
            
            // 1. Alternar la clase visual
            domino.classList.toggle('vertical');

            // 2. Intercambiar los valores en el atributo data-value
            const values = domino.dataset.value.split(',');
            domino.dataset.value = `${values[1]},${values[0]}`;

            //3. Intercambia fisicamente las dos mitades (.half) para que lo visual coincida
            const half1 = domino.children[0];
            const half2 = domino.children[1];
            domino.insertBefore(half2, half1);
        });

        // Asignar IDs y eventos de arrastre
        domino.id = `domino-tray-${Array.from(dominoes).indexOf(domino)}`;
        domino.addEventListener('dragstart', handleDragStart);
        domino.addEventListener('dragend', handleDragEnd);
    });

    // --- Lógica de Arrastrar y Soltar (Drag & Drop) ---
    function handleDragStart(e) {
        // Usamos e.currentTarget para asegurarnos de que es el elemento con el listener
        draggedDomino = e.currentTarget; 
        e.dataTransfer.setData('text/plain', draggedDomino.id);
        setTimeout(() => {
            draggedDomino.classList.add('dragging');
        }, 0);
    }

    function handleDragEnd() {
        if (draggedDomino) {
            draggedDomino.classList.remove('dragging');
        }
        draggedDomino = null;
    }

    cells.forEach(cell => {
        cell.addEventListener('dragover', e => e.preventDefault());
        cell.addEventListener('dragenter', e => {
            e.preventDefault();
            if (!e.target.classList.contains('has-domino')) e.target.classList.add('over');
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

        // --- MODIFICADO: La rotación ahora depende de la clase de la ficha ---
        const isVertical = originalDomino.classList.contains('vertical');
        const cellIndex = Array.from(cells).indexOf(targetCell);
        let adjacentCellIndex;
        let canPlace = false;

        if (isVertical) { // Colocación VERTICAL
            adjacentCellIndex = cellIndex + 3;
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
            placeDominoOnBoard(originalDomino, cellIndex, adjacentCellIndex, isVertical);
        }
    }

    function placeDominoOnBoard(originalDomino, index1, index2, isVertical) {
        const placedDomino = originalDomino.cloneNode(true);
        placedDomino.id = `placed-${originalDomino.id}`;
        placedDomino.classList.remove('dragging');
        placedDomino.classList.add('placed');
        if (isVertical) placedDomino.classList.add('vertical');
        else placedDomino.classList.add('horizontal');
        placedDomino.draggable = false;
        
        const gridColumn = (index1 % 3) + 1;
        const gridRow = Math.floor(index1 / 3) + 1;
        placedDomino.style.gridColumnStart = gridColumn;
        placedDomino.style.gridRowStart = gridRow;

        if (isVertical) {
            placedDomino.style.gridRowEnd = 'span 2';
        } else {
            placedDomino.style.gridColumnEnd = 'span 2';
        }
        board.appendChild(placedDomino);

        const [val1, val2] = originalDomino.dataset.value.split(',').map(Number);
        cellStates[index1] = { value: val1, dominoId: originalDomino.id };
        cellStates[index2] = { value: val2, dominoId: originalDomino.id };
        cells[index1].classList.add('has-domino');
        cells[index2].classList.add('has-domino');
        
        placedDominoes[originalDomino.id] = {
            visualElement: placedDomino,
            cells: [index1, index2]
        };

        originalDomino.style.display = 'none';

        // --- MODIFICADO: Click para rotar, Clic Derecho para devolver ---
        placedDomino.addEventListener('click', () => rotatePlacedDomino(originalDomino.id));
        placedDomino.addEventListener('contextmenu', (e) => {
            e.preventDefault(); // Evita que aparezca el menú contextual del navegador
            returnDominoToTray(originalDomino.id);
        });
        
        updateSums();
    }
    
    // Función para rotar una ficha YA COLOCADA (sin cambios)
    function rotatePlacedDomino(originalDominoId) {
        const dominoInfo = placedDominoes[originalDominoId];
        if (!dominoInfo) return;
        const [index1, index2] = dominoInfo.cells;
        const tempValue = cellStates[index1].value;
        cellStates[index1].value = cellStates[index2].value;
        cellStates[index2].value = tempValue;
        const visualElement = dominoInfo.visualElement;
        visualElement.insertBefore(visualElement.children[1], visualElement.children[0]);
        updateSums();
    }

    // Función para devolver la ficha (ahora con clic derecho)
    function returnDominoToTray(originalDominoId) {
        const dominoInfo = placedDominoes[originalDominoId];
        if (!dominoInfo) return;
        dominoInfo.cells.forEach(index => {
            cells[index].classList.remove('has-domino');
            delete cellStates[index];
        });
        dominoInfo.visualElement.remove();
        delete placedDominoes[originalDominoId];
        const originalDomino = document.getElementById(originalDominoId);
        if (originalDomino) {
            originalDomino.style.display = 'flex';
        }
        updateSums();
    }

    // --- Lógica de Suma y Comprobación (Sin cambios) ---
    const goals = { 0: 0, 1: 5, 2: 10, 3: 9 };

    function updateSums() {
        let currentSums = {};
        Object.keys(goals).forEach(region => currentSums[region] = 0);
        for (const cellIndex in cellStates) {
            const region = cells[cellIndex].dataset.region;
            currentSums[region] += cellStates[cellIndex].value;
        }
        let txt = "Sumas actuales: ";
        for (const r in goals) {
            txt += `Región ${r}: ${currentSums[r] || 0} / ${goals[r]} &nbsp; `;
        }
        regionSumsEl.innerHTML = txt;
    }

    function checkSolution() {
        updateSums();
        let isCorrect = Object.keys(goals).every(region => (currentSums[region] || 0) === goals[region]);
        statusEl.textContent = isCorrect ? "✅ ¡Correcto! Solución encontrada." : "❌ Sigue intentando, revisa las sumas.";
    }

    checkBtn.addEventListener('click', checkSolution);
    updateSums();
});