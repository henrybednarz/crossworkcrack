document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    let puzzleData = null;
    let userGrid = [];
    let activeCell = { row: 0, col: 0 };
    let direction = 'across'; // 'across' or 'down'
    let timerInterval = null;
    let secondsElapsed = 0;
    let isGameStarted = false;
    let isGameFinished = false;
    const API_URL = 'test.com'

    // --- API DATA (Mocked) ---
    const puzzleJSON = {'grid': [[{'isBlack': false, 'answer': 'S', 'number': '1'}, {'isBlack': false, 'answer': 'C', 'number': '2'}, {'isBlack': false, 'answer': 'U', 'number': '3'}, {'isBlack': false, 'answer': 'M', 'number': '4'}, {'isBlack': true, 'answer': null, 'number': null}, {'isBlack': true, 'answer': null, 'number': null}], [{'isBlack': false, 'answer': 'A', 'number': '5'}, {'isBlack': false, 'answer': 'L', 'number': null}, {'isBlack': false, 'answer': 'L', 'number': null}, {'isBlack': false, 'answer': 'Y', 'number': null}, {'isBlack': false, 'answer': 'O', 'number': '6'}, {'isBlack': false, 'answer': 'U', 'number': '7'}], [{'isBlack': false, 'answer': 'C', 'number': '8'}, {'isBlack': false, 'answer': 'A', 'number': null}, {'isBlack': false, 'answer': 'N', 'number': null}, {'isBlack': false, 'answer': 'E', 'number': null}, {'isBlack': false, 'answer': 'A', 'number': null}, {'isBlack': false, 'answer': 'T', 'number': null}], [{'isBlack': false, 'answer': 'S', 'number': '9'}, {'isBlack': false, 'answer': 'P', 'number': null}, {'isBlack': false, 'answer': 'A', 'number': null}, {'isBlack': false, 'answer': 'R', 'number': null}, {'isBlack': false, 'answer': 'T', 'number': null}, {'isBlack': false, 'answer': 'A', 'number': null}], [{'isBlack': true, 'answer': null, 'number': null}, {'isBlack': true, 'answer': null, 'number': null}, {'isBlack': true, 'answer': null, 'number': null}, {'isBlack': false, 'answer': 'S', 'number': '10'}, {'isBlack': false, 'answer': 'H', 'number': null}, {'isBlack': false, 'answer': 'H', 'number': null}]], 'clues': {'across': [{'number': '1', 'clue': 'Pond gunk'}, {'number': '5', 'clue': 'With 8-Across, like an unlimited buffet'}, {'number': '8', 'clue': 'See 5-Across'}, {'number': '9', 'clue': 'Opponent of Athens in the Peloponnesian War'}, {'number': '10', 'clue': '"Keep it down!"'}], 'down': [{'number': '1', 'clue': 'Outs that advance the runner, in baseball lingo'}, {'number': '2', 'clue': 'Put your hands together'}, {'number': '3', 'clue': 'Bone on the same side of the arm as the pinky'}, {'number': '4', 'clue': 'Mike who voiced Shrek'}, {'number': '6', 'clue': "Hippocratic ___ (doctor's pledge)"}, {'number': '7', 'clue': 'State with license plates that read "Greatest Snow on Earth"'}]}}

    const leaderboardJSON = [
        { name: 'Alice', time: 45 },
        { name: 'Bob', time: 58 },
        { name: 'Charlie', time: 72 }
    ];

    // --- DOM ELEMENTS ---
    const gridContainer = document.getElementById('grid-container');
    const cluesContainer = document.getElementById('clues-container');
    const acrossCluesList = document.getElementById('across-clues');
    const downCluesList = document.getElementById('down-clues');
    const timerDisplay = document.getElementById('timer');
    const leaderboardList = document.getElementById('leaderboard-list');
    const activeClueBar = document.getElementById('active-clue-bar');

    const leaderboardWindow = document.getElementById('leaderboard-window');
    const closeLeaderboardWindowBtn = document.getElementById('close-leaderboard-window');
    const showLeaderboardBtn = document.getElementById('show-leaderboard-btn');

    closeLeaderboardWindowBtn.addEventListener('click', () => {
        leaderboardWindow.classList.remove('active');
    });
    showLeaderboardBtn.addEventListener('click', () => {
        if (leaderboardWindow.classList.contains('active')) {
            leaderboardWindow.classList.remove('active');
        } else {
            leaderboardWindow.classList.add('active');
            renderLeaderboard();
        }
    });

    // --- STATE CACHE KEYS ---
    const CACHE_KEY_GRID = 'crossword_user_grid';
    const CACHE_KEY_TIMER = 'crossword_timer';

    // --- INITIALIZATION ---
    async function init() {
        puzzleData = await fetch('/api/puzzle/2025-09-24').then(res => res.json());
        console.log(puzzleData)
        const gridRows = puzzleData.grid.length;
        const gridCols = puzzleData['grid'][0].length;
        document.documentElement.style.setProperty('--grid-rows', gridRows);
        document.documentElement.style.setProperty('--grid-cols', gridCols);

        const gridSize = puzzleData.grid.length;
        document.documentElement.style.setProperty('--grid-size', gridSize);
        document.getElementById('puzzle-date').textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        renderGrid();
        renderClues();
        renderLeaderboard();

        loadCachedState();

        // Find the first playable cell
        for(let r=0; r < gridSize; r++){
            for(let c=0; c < gridSize; c++){
                if(!puzzleData.grid[r][c].isBlack){
                    activeCell = { row: r, col: c };
                    updateActiveHighlights();
                    return;
                }
            }
        }
    }

    function loadCachedState() {
        // Load user grid
        const cachedGrid = localStorage.getItem(CACHE_KEY_GRID);
        if (cachedGrid) {
            try {
                const parsedGrid = JSON.parse(cachedGrid);
                if (Array.isArray(parsedGrid) && parsedGrid.length === puzzleData.grid.length) {
                    userGrid = parsedGrid;
                }
            } catch {}
        }
        // Load timer
        const cachedTimer = localStorage.getItem(CACHE_KEY_TIMER);
        if (cachedTimer && !isNaN(Number(cachedTimer))) {
            secondsElapsed = Number(cachedTimer);
            timerDisplay.textContent = formatTime(secondsElapsed);
        }
    }

    function saveCachedState() {
        localStorage.setItem(CACHE_KEY_GRID, JSON.stringify(userGrid));
        localStorage.setItem(CACHE_KEY_TIMER, secondsElapsed.toString());
    }

    // --- RENDER FUNCTIONS ---
    function renderGrid() {
        gridContainer.innerHTML = '';
        userGrid = puzzleData.grid.map(row => row.map(cell => (cell.isBlack ? null : '')));

        puzzleData.grid.forEach((row, r) => {
            row.forEach((cellData, c) => {
                const cell = document.createElement('div');
                cell.classList.add('grid-cell');
                cell.dataset.row = r;
                cell.dataset.col = c;

                if (cellData.isBlack) {
                    cell.classList.add('black');
                } else {
                    if (cellData.number) {
                        const numberSpan = document.createElement('span');
                        numberSpan.textContent = cellData.number;
                        numberSpan.classList.add('cell-number');
                        cell.appendChild(numberSpan);
                    }
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.maxLength = 1;
                    input.classList.add('cell-input');
                    input.dataset.row = r;
                    input.dataset.col = c;
                    // Restore cached value if available
                    if (userGrid[r] && userGrid[r][c]) {
                        input.value = userGrid[r][c];
                    }
                    // Save state on input
                    input.addEventListener('input', () => {
                        userGrid[r][c] = input.value.toUpperCase();
                        saveCachedState();
                    });
                    cell.appendChild(input);
                }
                gridContainer.appendChild(cell);
            });
        });
    }

    function renderClues() {
        acrossCluesList.innerHTML = '';
        downCluesList.innerHTML = '';
        puzzleData.clues.across.forEach(clue => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${clue.number}.</strong> ${clue.clue}`;
            li.dataset.number = clue.number;
            li.dataset.direction = 'across';
            acrossCluesList.appendChild(li);
        });
        puzzleData.clues.down.forEach(clue => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${clue.number}.</strong> ${clue.clue}`;
            li.dataset.number = clue.number;
            li.dataset.direction = 'down';
            downCluesList.appendChild(li);
        });
    }

    function renderLeaderboard() {
        leaderboardList.innerHTML = '';
        leaderboardJSON
            .sort((a, b) => a.time - b.time)
            .forEach((entry, idx) => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span class="rank">${idx + 1}</span>
                    <span class="name">${entry.name}</span>
                    <span class="time">${formatTime(entry.time)}</span>
                `;
                leaderboardList.appendChild(li);
            });
    }

    // --- GAME LOGIC & EVENT HANDLERS ---
    gridContainer.addEventListener('click', (e) => {
        const target = e.target.closest('.grid-cell');
        if (target && !target.classList.contains('black')) {
            const row = parseInt(target.dataset.row);
            const col = parseInt(target.dataset.col);

            if (activeCell.row === row && activeCell.col === col) {
                direction = (direction === 'across') ? 'down' : 'across';
            } else {
                activeCell = { row, col };
            }
            updateActiveHighlights();
        }
    });

    cluesContainer.addEventListener('click', (e) => {
        const target = e.target.closest('li');
        if (target) {
            const { number, direction: newDirection } = target.dataset;
            direction = newDirection;
            // Find the cell with this number
            puzzleData.grid.forEach((row, r) => {
                row.forEach((cell, c) => {
                    if (cell.number === number) {
                        activeCell = { row: r, col: c };
                        updateActiveHighlights();
                    }
                });
            });
        }
    });

    document.addEventListener('keydown', (e) => {
            if (isGameFinished) return;
            const { row, col } = activeCell;
            const inputEl = document.querySelector(`input[data-row='${row}'][data-col='${col}']`);

            // Letter input
            if (e.key.match(/^[a-zA-Z]$/)) {
                e.preventDefault();
                if (!isGameStarted) startGame();
                inputEl.value = e.key.toUpperCase();
                userGrid[row][col] = e.key.toUpperCase();
                moveFocus(1);
                checkWin();
            }
        // Backspace
        else if (e.key === 'Backspace') {
            e.preventDefault();
            if (inputEl.value === '') {
                moveFocus(-1);
                const prevInputEl = document.querySelector(`input[data-row='${activeCell.row}'][data-col='${activeCell.col}']`);
                prevInputEl.value = '';
                userGrid[activeCell.row][activeCell.col] = '';
            } else {
                inputEl.value = '';
                userGrid[row][col] = '';
            }
        }
        else if (e.key === 'Tab') {
            e.preventDefault();
            moveFocus(e.shiftKey ? -1 : 1);
        }

        // Arrow keys
        else if (e.key.startsWith('Arrow')) {
            e.preventDefault();
            let newRow = row, newCol = col;
            if (e.key === 'ArrowUp') newRow--;
            if (e.key === 'ArrowDown') newRow++;
            if (e.key === 'ArrowLeft') newCol--;
            if (e.key === 'ArrowRight') newCol++;

            if(isValidCell(newRow, newCol)) {
                activeCell = { row: newRow, col: newCol };
                updateActiveHighlights();
            }
        }
    });

    function renderActiveClue() {
        const wordCells = getWordCells(activeCell.row, activeCell.col, direction);
        const startOfWord = wordCells[0];
        const clueNumber = puzzleData.grid[startOfWord.r][startOfWord.c].number;
        let clueText = '';
        if (clueNumber) {
            const clueObj = puzzleData.clues[direction].find(clue => clue.number === clueNumber);
            if (clueObj) {
                clueText = `${clueNumber}: ${clueObj.clue}`;
            }
        }
        activeClueBar.innerHTML = clueText;
    }

    function moveFocus(delta) {
        let { row, col } = activeCell;
        if (delta < 0) {
            do {
                if (direction === 'across') col += delta;
                else row += delta;
            } while (isValidCell(row, col) && puzzleData.grid[row][col].isBlack);

            if (isValidCell(row, col)) {
                activeCell = { row, col };
                updateActiveHighlights();
            }
            return; // Exit function after moving backward
        }

        let nextPos = { row, col };
        if (direction === 'across') {
            nextPos.col++; // Try to move to the next cell on the right

            if (!isValidCell(nextPos.row, nextPos.col) || puzzleData.grid[nextPos.row][nextPos.col].isBlack) {
                nextPos.row++;    // Move down to the next row.
                nextPos.col = -1; // Will be set to the first valid index if found.

                while (isValidCell(nextPos.row, 0)) {
                    // Find the index of the leftmost non-black cell in the current row.
                    const firstValidIndex = puzzleData.grid[nextPos.row].findIndex(cell => !cell.isBlack);
                    if (firstValidIndex !== -1) {
                        nextPos.col = firstValidIndex; // Found it!
                        break;
                    }
                    nextPos.row++; // This row was empty, try the next one.
                }
            }
        } else {
            nextPos.row++;

            if (!isValidCell(nextPos.row, nextPos.col) || puzzleData.grid[nextPos.row][nextPos.col].isBlack) {
                nextPos.col++;    // Move to the next column.
                nextPos.row = -1; // Will be set to the first valid index if found.

                while(isValidCell(0, nextPos.col)) {
                    // Find the index of the topmost non-black cell by looping down the column.
                    for (let r = 0; r < puzzleData.grid.length; r++) {
                        if (!puzzleData.grid[r][nextPos.col].isBlack) {
                            nextPos.row = r; // Found it!
                            break;
                        }
                    }
                    if (nextPos.row !== -1) {
                        break;
                    }
                    nextPos.col++;
                }
            }
        }

        if (isValidCell(nextPos.row, nextPos.col)) {
            activeCell = { row: nextPos.row, col: nextPos.col }
        }
        updateActiveHighlights();
    }

    // --- UI/STATE UPDATES ---
    function updateActiveHighlights() {
        // Remove all previous highlights
        document.querySelectorAll('.grid-cell').forEach(c => c.classList.remove('active', 'active-word'));
        document.querySelectorAll('#clues-container li').forEach(c => c.classList.remove('active-clue'));

        const activeCellEl = document.querySelector(`.grid-cell[data-row='${activeCell.row}'][data-col='${activeCell.col}']`);
        if(activeCellEl) {
            activeCellEl.classList.add('active');
            activeCellEl.querySelector('input')?.focus();
        }

        // Highlight the entire word and the corresponding clue
        const wordCells = getWordCells(activeCell.row, activeCell.col, direction);
        wordCells.forEach(({r, c}) => {
            document.querySelector(`.grid-cell[data-row='${r}'][data-col='${c}']`)?.classList.add('active-word');
        });

        const startOfWord = wordCells[0];
        const clueNumber = puzzleData.grid[startOfWord.r][startOfWord.c].number;
        if(clueNumber) {
            const activeClueEl = document.querySelector(`li[data-number='${clueNumber}'][data-direction='${direction}']`);
            activeClueEl?.classList.add('active-clue');
        }
        renderActiveClue()
    }

    function getWordCells(startRow, startCol, dir) {
        const cells = [];
        let r = startRow, c = startCol;

        // Go to the start of the word
        if (dir === 'across') {
            while (c >= 0 && !puzzleData.grid[r][c].isBlack) c--;
            c++;
        } else {
            while (r >= 0 && !puzzleData.grid[r][c].isBlack) r--;
            r++;
        }

        while (isValidCell(r, c) && !puzzleData.grid[r][c].isBlack) {
            cells.push({r, c});
            if (dir === 'across') c++; else r++;
        }
        return cells;
    }

    // --- TIMER LOGIC ---
    function startGame() {
        isGameStarted = true;
        timerInterval = setInterval(() => {
            secondsElapsed++;
            timerDisplay.textContent = formatTime(secondsElapsed);
            saveCachedState();
        }, 1000);
    }

    function stopGame() {
        isGameFinished = true;
        clearInterval(timerInterval);
    }

    // --- WIN CONDITION & SUBMISSION ---
    function checkWin() {
        for (let r = 0; r < userGrid.length; r++) {
            for (let c = 0; c < userGrid[r].length; c++) {
                if (!puzzleData.grid[r][c].isBlack && userGrid[r][c] !== puzzleData.grid[r][c].answer) {
                    return;
                }
            }
        }

        stopGame();
        setTimeout(() => {
            // Remove alert, show leaderboard window instead
            // alert(`Congratulations! You solved the puzzle in ${formatTime(secondsElapsed)}!`);
            postScore('Player', secondsElapsed);
            // Clear cache on win
            localStorage.removeItem(CACHE_KEY_GRID);
            localStorage.removeItem(CACHE_KEY_TIMER);
            leaderboardWindow.classList.add('active');
            renderLeaderboard();
        }, 100);
    }

    async function postScore(name, time) {
        console.log(`Posting score: ${name} - ${time} seconds`);
        // In a real app:
        try {
            const response = await fetch('/api/leaderboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, time })
            });
            if (response.ok) {
                console.log('Score posted successfully!');
                // Optionally refresh leaderboard
            }
        } catch (error) {
            console.error('Failed to post score:', error);
        }
    }

    // --- UTILITY FUNCTIONS ---
    function isValidCell(r, c) {
        const rows = puzzleData.grid.length;
        const cols = puzzleData.grid[0].length
        return r >= 0 && r < rows && c >= 0 && c < cols;
    }

    function formatTime(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const seconds = (totalSeconds % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    }

    init();
});