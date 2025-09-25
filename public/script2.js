document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION & CONSTANTS ---
    const CONFIG = {
        API_URL: 'http://localhost:3000',
        CACHE_KEY_GRID: 'crossword_user_grid',
        CACHE_KEY_TIMER: 'crossword_timer',
        DIRECTION_ACROSS: 'across',
        DIRECTION_DOWN: 'down',
    };

    // --- STATE MANAGEMENT ---
    const gameState = {
        puzzleData: null,
        userGrid: [],
        activeCell: { row: 0, col: 0 },
        direction: CONFIG.DIRECTION_ACROSS,
        timerInterval: null,
        secondsElapsed: 0,
        isGameStarted: false,
        isGameFinished: false,
    };

    // --- MOCK API DATA (for fallback/testing) ---
    const MOCK_PUZZLE_JSON = {'grid': [[{'isBlack': false, 'answer': 'S', 'number': '1'}, {'isBlack': false, 'answer': 'C', 'number': '2'}, {'isBlack': false, 'answer': 'U', 'number': '3'}, {'isBlack': false, 'answer': 'M', 'number': '4'}, {'isBlack': true, 'answer': null, 'number': null}, {'isBlack': true, 'answer': null, 'number': null}], [{'isBlack': false, 'answer': 'A', 'number': '5'}, {'isBlack': false, 'answer': 'L', 'number': null}, {'isBlack': false, 'answer': 'L', 'number': null}, {'isBlack': false, 'answer': 'Y', 'number': null}, {'isBlack': false, 'answer': 'O', 'number': '6'}, {'isBlack': false, 'answer': 'U', 'number': '7'}], [{'isBlack': false, 'answer': 'C', 'number': '8'}, {'isBlack': false, 'answer': 'A', 'number': null}, {'isBlack': false, 'answer': 'N', 'number': null}, {'isBlack': false, 'answer': 'E', 'number': null}, {'isBlack': false, 'answer': 'A', 'number': null}, {'isBlack': false, 'answer': 'T', 'number': null}], [{'isBlack': false, 'answer': 'S', 'number': '9'}, {'isBlack': false, 'answer': 'P', 'number': null}, {'isBlack': false, 'answer': 'A', 'number': null}, {'isBlack': false, 'answer': 'R', 'number': null}, {'isBlack': false, 'answer': 'T', 'number': null}, {'isBlack': false, 'answer': 'A', 'number': null}], [{'isBlack': true, 'answer': null, 'number': null}, {'isBlack': true, 'answer': null, 'number': null}, {'isBlack': true, 'answer': null, 'number': null}, {'isBlack': false, 'answer': 'S', 'number': '10'}, {'isBlack': false, 'answer': 'H', 'number': null}, {'isBlack': false, 'answer': 'H', 'number': null}]], 'clues': {'across': [{'number': '1', 'clue': 'Pond gunk'}, {'number': '5', 'clue': 'With 8-Across, like an unlimited buffet'}, {'number': '8', 'clue': 'See 5-Across'}, {'number': '9', 'clue': 'Opponent of Athens in the Peloponnesian War'}, {'number': '10', 'clue': '"Keep it down!"'}], 'down': [{'number': '1', 'clue': 'Outs that advance the runner, in baseball lingo'}, {'number': '2', 'clue': 'Put your hands together'}, {'number': '3', 'clue': 'Bone on the same side of the arm as the pinky'}, {'number': '4', 'clue': 'Mike who voiced Shrek'}, {'number': '6', 'clue': "Hippocratic ___ (doctor's pledge)"}, {'number': '7', 'clue': 'State with license plates that read "Greatest Snow on Earth"'}]}}
    const MOCK_LEADERBOARD_JSON = [{ name: 'Alice', time: 45 }, { name: 'Bob', time: 58 }, { name: 'Charlie', time: 72 }];

    // --- DOM ELEMENT CACHE ---
    const dom = {
        gridContainer: document.getElementById('grid-container'),
        acrossCluesList: document.getElementById('across-clues'),
        downCluesList: document.getElementById('down-clues'),
        timerDisplay: document.getElementById('timer'),
        leaderboardList: document.getElementById('leaderboard-list'),
        activeClueBar: document.getElementById('active-clue-bar'),
        leaderboardWindow: document.getElementById('leaderboard-window'),
        puzzleDate: document.getElementById('puzzle-date'),
    };

    // --- INITIALIZATION ---
    async function init() {
        try {
            gameState.puzzleData = await fetchPuzzleData();
        } catch (error) {
            console.error('Failed to initialize game:', error);
            dom.gridContainer.textContent = 'Sorry, the puzzle could not be loaded. Please try again later.';
            // Fallback to mock data for development purposes if needed
            // gameState.puzzleData = MOCK_PUZZLE_JSON;
        }

        if (gameState.puzzleData) {
            setupUI();
            loadState();
            renderGrid();
            renderClues();
            findAndSetStartingCell();
            setupEventListeners();
        }
    }

    async function fetchPuzzleData() {
        // In a real scenario, you might pass a date or ID
        const response = await fetch(`${CONFIG.API_URL}/puzzle/2025-09-24`);
        if (!response.ok) {
            throw new Error(`Network error: ${response.statusText}`);
        }
        return response.json();
    }

    function setupUI() {
        const { grid } = gameState.puzzleData;
        const gridRows = grid.length;
        const gridCols = grid[0].length;
        document.documentElement.style.setProperty('--grid-rows', gridRows);
        document.documentElement.style.setProperty('--grid-cols', gridCols);
        dom.puzzleDate.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }

    function findAndSetStartingCell() {
        const { grid } = gameState.puzzleData;
        for (let r = 0; r < grid.length; r++) {
            for (let c = 0; c < grid[r].length; c++) {
                if (!grid[r][c].isBlack) {
                    gameState.activeCell = { row: r, col: c };
                    updateActiveHighlights();
                    return;
                }
            }
        }
    }

    // --- STATE PERSISTENCE ---
    function loadState() {
        const cachedGrid = localStorage.getItem(CONFIG.CACHE_KEY_GRID);
        if (cachedGrid) {
            try {
                const parsedGrid = JSON.parse(cachedGrid);
                if (Array.isArray(parsedGrid) && parsedGrid.length === gameState.puzzleData.grid.length) {
                    gameState.userGrid = parsedGrid;
                }
            } catch (error) {
                console.error("Failed to parse cached grid:", error);
                localStorage.removeItem(CONFIG.CACHE_KEY_GRID);
            }
        }

        const cachedTimer = localStorage.getItem(CONFIG.CACHE_KEY_TIMER);
        if (cachedTimer && !isNaN(Number(cachedTimer))) {
            gameState.secondsElapsed = Number(cachedTimer);
            dom.timerDisplay.textContent = formatTime(gameState.secondsElapsed);
        }
    }

    function saveState() {
        localStorage.setItem(CONFIG.CACHE_KEY_GRID, JSON.stringify(gameState.userGrid));
        localStorage.setItem(CONFIG.CACHE_KEY_TIMER, gameState.secondsElapsed.toString());
    }

    function clearState() {
        localStorage.removeItem(CONFIG.CACHE_KEY_GRID);
        localStorage.removeItem(CONFIG.CACHE_KEY_TIMER);
    }

    // --- RENDER FUNCTIONS ---
    function renderGrid() {
        dom.gridContainer.innerHTML = '';
        const { grid } = gameState.puzzleData;

        // Initialize userGrid if it's empty
        if (gameState.userGrid.length === 0) {
            gameState.userGrid = grid.map(row => row.map(cell => (cell.isBlack ? null : '')));
        }

        grid.forEach((row, r) => {
            row.forEach((cellData, c) => {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.row = r;
                cell.dataset.col = c;

                if (cellData.isBlack) {
                    cell.classList.add('black');
                } else {
                    if (cellData.number) {
                        const numberSpan = document.createElement('span');
                        numberSpan.textContent = cellData.number;
                        numberSpan.className = 'cell-number';
                        cell.appendChild(numberSpan);
                    }
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.maxLength = 1;
                    input.className = 'cell-input';
                    input.dataset.row = r;
                    input.dataset.col = c;
                    input.value = gameState.userGrid[r][c] || '';
                    cell.appendChild(input);
                }
                dom.gridContainer.appendChild(cell);
            });
        });
    }

    function renderClues() {
        const { clues } = gameState.puzzleData;
        dom.acrossCluesList.innerHTML = '';
        dom.downCluesList.innerHTML = '';

        clues.across.forEach(clue => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${clue.number}.</strong> ${clue.clue}`;
            li.dataset.number = clue.number;
            li.dataset.direction = CONFIG.DIRECTION_ACROSS;
            dom.acrossCluesList.appendChild(li);
        });

        clues.down.forEach(clue => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${clue.number}.</strong> ${clue.clue}`;
            li.dataset.number = clue.number;
            li.dataset.direction = CONFIG.DIRECTION_DOWN;
            dom.downCluesList.appendChild(li);
        });
    }

    function renderLeaderboard() {
        dom.leaderboardList.innerHTML = '';
        // Using mock data; in a real app, this would be fetched
        MOCK_LEADERBOARD_JSON
            .sort((a, b) => a.time - b.time)
            .forEach((entry, idx) => {
                const li = document.createElement('li');
                li.innerHTML = `<span class="rank">${idx + 1}</span><span class="name">${entry.name}</span><span class="time">${formatTime(entry.time)}</span>`;
                dom.leaderboardList.appendChild(li);
            });
    }

    function renderActiveClue() {
        const { row, col } = gameState.activeCell;
        const wordCells = getWordCells(row, col, gameState.direction);
        if (!wordCells.length) {
            dom.activeClueBar.textContent = '';
            return;
        }
        const startOfWord = wordCells[0];
        const clueNumber = gameState.puzzleData.grid[startOfWord.r][startOfWord.c].number;

        let clueText = '';
        if (clueNumber) {
            const clueObj = gameState.puzzleData.clues[gameState.direction].find(c => c.number === clueNumber);
            if (clueObj) {
                clueText = `${clueNumber}: ${clueObj.clue}`;
            }
        }
        dom.activeClueBar.textContent = clueText;
    }

    // --- EVENT HANDLERS ---
    function setupEventListeners() {
        dom.gridContainer.addEventListener('click', handleGridClick);
        document.getElementById('clues-container').addEventListener('click', handleClueClick);
        document.addEventListener('keydown', handleKeyDown);
        document.getElementById('grid-container').addEventListener('input', handleGridInput);

        // Leaderboard modal listeners
        document.getElementById('close-leaderboard-window').addEventListener('click', () => dom.leaderboardWindow.classList.remove('active'));
        document.getElementById('show-leaderboard-btn').addEventListener('click', () => {
            dom.leaderboardWindow.classList.toggle('active');
            if (dom.leaderboardWindow.classList.contains('active')) {
                renderLeaderboard();
            }
        });
    }

    function handleGridClick(e) {
        const target = e.target.closest('.grid-cell:not(.black)');
        if (!target) return;

        const row = parseInt(target.dataset.row);
        const col = parseInt(target.dataset.col);

        if (gameState.activeCell.row === row && gameState.activeCell.col === col) {
            gameState.direction = (gameState.direction === CONFIG.DIRECTION_ACROSS) ? CONFIG.DIRECTION_DOWN : CONFIG.DIRECTION_ACROSS;
        } else {
            gameState.activeCell = { row, col };
        }
        updateActiveHighlights();
    }

    function handleGridInput(e) {
        const input = e.target;
        if (!input.classList.contains('cell-input')) return;

        const row = parseInt(input.dataset.row);
        const col = parseInt(input.dataset.col);
        gameState.userGrid[row][col] = input.value.toUpperCase();
        saveState();
    }

    function handleClueClick(e) {
        const target = e.target.closest('li');
        if (!target) return;

        const { number, direction } = target.dataset;
        gameState.direction = direction;

        const { grid } = gameState.puzzleData;
        for (let r = 0; r < grid.length; r++) {
            for (let c = 0; c < grid[r].length; c++) {
                if (grid[r][c].number === number) {
                    gameState.activeCell = { row: r, col: c };
                    updateActiveHighlights();
                    return;
                }
            }
        }
    }

    function handleKeyDown(e) {
        if (gameState.isGameFinished) return;

        if (e.key.match(/^[a-zA-Z]$/)) {
            handleLetterInput(e);
        } else if (e.key === 'Backspace') {
            handleBackspace(e);
        } else if (e.key.startsWith('Arrow')) {
            handleArrowNavigation(e);
        } else if (e.key === 'Tab') {
            e.preventDefault();
            // This could be a future enhancement to jump between clues
        }
    }

    function handleLetterInput(e) {
        e.preventDefault();
        if (!gameState.isGameStarted) startGame();

        const { row, col } = gameState.activeCell;
        const inputEl = document.querySelector(`input[data-row='${row}'][data-col='${col}']`);
        if (inputEl) {
            inputEl.value = e.key.toUpperCase();
            gameState.userGrid[row][col] = e.key.toUpperCase();
            moveFocus(1);
            checkWin();
        }
    }

    function handleBackspace(e) {
        e.preventDefault();
        const { row, col } = gameState.activeCell;
        const inputEl = document.querySelector(`input[data-row='${row}'][data-col='${col}']`);

        if (inputEl) {
            if (inputEl.value === '') {
                moveFocus(-1);
                // After moving, clear the new active cell's input
                const { row: newRow, col: newCol } = gameState.activeCell;
                const prevInputEl = document.querySelector(`input[data-row='${newRow}'][data-col='${newCol}']`);
                if (prevInputEl) {
                    prevInputEl.value = '';
                    gameState.userGrid[newRow][newCol] = '';
                }
            } else {
                inputEl.value = '';
                gameState.userGrid[row][col] = '';
            }
        }
    }

    function handleArrowNavigation(e) {
        e.preventDefault();
        let { row, col } = gameState.activeCell;
        if (e.key === 'ArrowUp') row--;
        if (e.key === 'ArrowDown') row++;
        if (e.key === 'ArrowLeft') col--;
        if (e.key === 'ArrowRight') col++;

        if (isValidCell(row, col) && !gameState.puzzleData.grid[row][col].isBlack) {
            gameState.activeCell = { row, col };
            updateActiveHighlights();
        }
    }

    // --- GAME LOGIC ---
    function moveFocus(delta) {
        let { row, col } = gameState.activeCell;
        const { grid } = gameState.puzzleData;

        do {
            if (gameState.direction === CONFIG.DIRECTION_ACROSS) {
                col += delta;
                if (col < 0 || col >= grid[0].length) { // End of word, find next
                    return; // For simplicity, stop at word boundaries. Advanced logic can be added here.
                }
            } else {
                row += delta;
                if (row < 0 || row >= grid.length) { // End of word, find next
                    return;
                }
            }
        } while (isValidCell(row, col) && grid[row][col].isBlack);

        if (isValidCell(row, col)) {
            gameState.activeCell = { row, col };
            updateActiveHighlights();
        }
    }

    function checkWin() {
        const { grid } = gameState.puzzleData;
        for (let r = 0; r < gameState.userGrid.length; r++) {
            for (let c = 0; c < gameState.userGrid[r].length; c++) {
                if (!grid[r][c].isBlack && gameState.userGrid[r][c] !== grid[r][c].answer) {
                    return false; // Not a win yet
                }
            }
        }

        // It's a win!
        stopGame();
        setTimeout(() => {
            alert(`Congratulations! You solved the puzzle in ${formatTime(gameState.secondsElapsed)}!`);
            postScore('Player', gameState.secondsElapsed);
            clearState();
            dom.leaderboardWindow.classList.add('active');
            renderLeaderboard();
        }, 100);
    }

    async function postScore(name, time) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/leaderboard`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, time })
            });
            if (response.ok) {
                console.log('Score posted successfully!');
            }
        } catch (error) {
            console.error('Failed to post score:', error);
        }
    }

    // --- UI/STATE UPDATES ---
    function updateActiveHighlights() {
        document.querySelectorAll('.grid-cell.active, .grid-cell.active-word').forEach(c => c.classList.remove('active', 'active-word'));
        document.querySelectorAll('#clues-container li.active-clue').forEach(c => c.classList.remove('active-clue'));

        const { row, col } = gameState.activeCell;
        const activeCellEl = document.querySelector(`.grid-cell[data-row='${row}'][data-col='${col}']`);
        if(activeCellEl) {
            activeCellEl.classList.add('active');
            activeCellEl.querySelector('input')?.focus();
        }

        const wordCells = getWordCells(row, col, gameState.direction);
        wordCells.forEach(({r, c}) => {
            document.querySelector(`.grid-cell[data-row='${r}'][data-col='${c}']`)?.classList.add('active-word');
        });

        const startOfWord = wordCells[0];
        if (startOfWord) {
            const clueNumber = gameState.puzzleData.grid[startOfWord.r][startOfWord.c].number;
            if(clueNumber) {
                const activeClueEl = document.querySelector(`li[data-number='${clueNumber}'][data-direction='${gameState.direction}']`);
                activeClueEl?.classList.add('active-clue');
                activeClueEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
        renderActiveClue();
    }

    // --- TIMER LOGIC ---
    function startGame() {
        if (gameState.isGameStarted) return;
        gameState.isGameStarted = true;
        gameState.timerInterval = setInterval(() => {
            gameState.secondsElapsed++;
            dom.timerDisplay.textContent = formatTime(gameState.secondsElapsed);
            saveState(); // Save timer progress
        }, 1000);
    }

    function stopGame() {
        gameState.isGameFinished = true;
        clearInterval(gameState.timerInterval);
    }

    // --- UTILITY FUNCTIONS ---
    function getWordCells(startRow, startCol, dir) {
        const cells = [];
        const { grid } = gameState.puzzleData;
        let r = startRow, c = startCol;

        // Find the start of the word
        if (dir === CONFIG.DIRECTION_ACROSS) {
            while (c > 0 && !grid[r][c - 1].isBlack) c--;
        } else {
            while (r > 0 && !grid[r - 1][c].isBlack) r--;
        }

        // Collect all cells in the word
        while (isValidCell(r, c) && !grid[r][c].isBlack) {
            cells.push({ r, c });
            if (dir === CONFIG.DIRECTION_ACROSS) c++; else r++;
        }
        return cells;
    }

    function isValidCell(r, c) {
        const rows = gameState.puzzleData.grid.length;
        const cols = gameState.puzzleData.grid[0].length;
        return r >= 0 && r < rows && c >= 0 && c < cols;
    }

    function formatTime(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const seconds = (totalSeconds % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    }

    // --- START THE APP ---
    init();
});