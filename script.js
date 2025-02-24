const boardSize = 9;
const attemptsLeftElement = document.getElementById('attempts-left');
const boardElement = document.getElementById('board');
const shipsListElement = document.getElementById('ships-list');
let attempts = 6;
let ships = [
    { name: 'Porta-aviões', size: 5, positions: [], count: 1 },
    { name: 'Navio de guerra', size: 4, positions: [], count: 1 },
    { name: 'Contratorpedeiro', size: 3, positions: [], count: 3 },
    { name: 'Barco de patrulha', size: 2, positions: [], count: 2 }
];
let board = Array.from({ length: boardSize }, () => Array(boardSize).fill(0));

function createBoard() {
    // Adiciona números nas colunas (topo)
    for (let i = 0; i <= boardSize; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        if (i === 0) {
            cell.textContent = '';
        } else {
            cell.textContent = i;
            cell.classList.add('col-label');
        }
        boardElement.appendChild(cell);
    }

    // Adiciona números nas linhas e células do tabuleiro
    for (let i = 0; i < boardSize; i++) {
        // Adiciona número na linha (lado esquerdo)
        const rowNumber = document.createElement('div');
        rowNumber.classList.add('cell', 'row-label');
        rowNumber.textContent = i + 1;
        boardElement.appendChild(rowNumber);

        for (let j = 0; j < boardSize; j++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.addEventListener('click', handleCellClick);
            cell.addEventListener('mouseover', () => cell.style.border = '2px solid green');
            cell.addEventListener('mouseout', () => cell.style.border = '1px solid black');
            boardElement.appendChild(cell);
        }
    }

    // Adiciona números nas bordas indicando a quantidade de navios em cada linha e coluna
    updateShipCounts();
}

function updateShipCounts() {
    // Conta navios nas linhas
    for (let i = 0; i < boardSize; i++) {
        const count = board[i].filter(cell => cell === 1).length;
        const rowLabel = document.querySelector(`.row-label:nth-child(${i * 10 + 11})`);
        rowLabel.textContent = `${i + 1} (${count})`;
    }

    // Conta navios nas colunas
    for (let j = 0; j < boardSize; j++) {
        let count = 0;
        for (let i = 0; i < boardSize; i++) {
            if (board[i][j] === 1) count++;
        }
        const colLabel = document.querySelector(`.col-label:nth-child(${j + 2})`);
        colLabel.textContent = `${j + 1} (${count})`;
    }
}

function placeShips() {
    ships.forEach(ship => {
        for (let k = 0; k < ship.count; k++) {
            let placed = false;
            while (!placed) {
                const direction = Math.random() < 0.5 ? 'horizontal' : 'vertical';
                const row = Math.floor(Math.random() * boardSize);
                const col = Math.floor(Math.random() * boardSize);

                if (canPlaceShip(ship, row, col, direction)) {
                    for (let i = 0; i < ship.size; i++) {
                        if (direction === 'horizontal') {
                            board[row][col + i] = 1;
                            ship.positions.push({ row, col: col + i });
                        } else {
                            board[row + i][col] = 1;
                            ship.positions.push({ row: row + i, col });
                        }
                    }
                    placed = true;
                }
            }
        }
    });
    updateShipCounts(); // Atualiza os contadores após posicionar os navios
    updateShipsRemaining(); // Atualiza a lista de navios restantes
}

function canPlaceShip(ship, row, col, direction) {
    // Verifica se o navio cabe no tabuleiro
    if (direction === 'horizontal' && col + ship.size > boardSize) return false;
    if (direction === 'vertical' && row + ship.size > boardSize) return false;

    // Verifica se as células estão livres e não são adjacentes a outros navios
    for (let i = -1; i <= ship.size; i++) {
        for (let j = -1; j <= 1; j++) {
            let checkRow, checkCol;

            if (direction === 'horizontal') {
                checkRow = row + j;
                checkCol = col + i;
            } else {
                checkRow = row + i;
                checkCol = col + j;
            }

            // Verifica se a célula está dentro dos limites do tabuleiro
            if (checkRow >= 0 && checkRow < boardSize && checkCol >= 0 && checkCol < boardSize) {
                // Verifica se a célula está ocupada ou adjacente a outro navio
                if (board[checkRow][checkCol] === 1) {
                    return false;
                }
            }
        }
    }

    return true;
}

function handleCellClick(event) {
    if (attempts <= 0) return;

    const cell = event.target;
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    if (board[row][col] === 1) {
        cell.classList.add('hit');
        board[row][col] = 2; // Mark as hit
        checkShipSunk(row, col);
    } else {
        cell.classList.add('miss');
        attempts--;
        attemptsLeftElement.textContent = attempts;
        attemptsLeftElement.classList.add('red'); // Muda a cor para vermelho
        if (attempts === 0) {
            endGame(false);
        }
    }

    cell.removeEventListener('click', handleCellClick);
}

function checkShipSunk(row, col) {
    const ship = ships.find(ship => ship.positions.some(pos => pos.row === row && pos.col === col));
    if (ship && ship.positions.every(pos => board[pos.row][pos.col] === 2)) {
        ship.count--; // Diminui a quantidade de navios desse tipo
        updateShipsRemaining(); // Atualiza a lista de navios restantes
        ship.positions.forEach(pos => {
            const cell = document.querySelector(`.cell[data-row="${pos.row}"][data-col="${pos.col}"]`);
            cell.classList.add('hit');
        });
        markAroundShip(ship); // Marca as células ao redor do navio
        if (ships.every(ship => ship.count === 0)) {
            endGame(true);
        }
    }
}

function markAroundShip(ship) {
    const positionsToMark = new Set(); // Usamos um Set para evitar duplicatas

    ship.positions.forEach(pos => {
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const newRow = pos.row + i;
                const newCol = pos.col + j;
                // Verifica se a célula está dentro dos limites do tabuleiro
                if (newRow >= 0 && newRow < boardSize && newCol >= 0 && newCol < boardSize) {
                    // Marca apenas células que não fazem parte do navio e não foram marcadas antes
                    if (board[newRow][newCol] === 0) {
                        positionsToMark.add(`${newRow},${newCol}`);
                    }
                }
            }
        }
    });

    // Marca as células ao redor do navio
    positionsToMark.forEach(pos => {
        const [row, col] = pos.split(',').map(Number);
        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        cell.classList.add('miss');
        board[row][col] = 3; // Marca como "miss" ao redor do navio
    });
}

function updateShipsRemaining() {
    shipsListElement.innerHTML = ''; // Limpa a lista atual
    ships.forEach(ship => {
        if (ship.count > 0) {
            const li = document.createElement('li');
            li.textContent = `${ship.name}: ${ship.count}`;
            shipsListElement.appendChild(li);
        }
    });
}

function endGame(win) {
    if (win) {
        alert('Parabéns! Você afundou todos os navios!');
    } else {
        alert('Game Over! Você não conseguiu afundar todos os navios.');
        ships.forEach(ship => {
            ship.positions.forEach(pos => {
                if (board[pos.row][pos.col] !== 2) {
                    const cell = document.querySelector(`.cell[data-row="${pos.row}"][data-col="${pos.col}"]`);
                    cell.classList.add('hit'); // Mostra as posições dos navios restantes
                }
            });
        });
    }
    document.querySelectorAll('.cell').forEach(cell => cell.classList.add('disabled'));
}

createBoard();
placeShips();