document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    let puzzleData = null;
    let leaderboardData = null;
    let todayDate = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    let userGrid = [];
    let playerName = null;
    let activeCell = { row: 0, col: 0 };
    let direction = 'across'; // 'across' or 'down'
    let timerInterval = null;
    let secondsElapsed = 0;
    let isGameStarted = false;
    let isGameFinished = false;

    // --- DOM ELEMENTS ---
    const gridContainer = document.getElementById('grid-container');
    const mainPanel = document.getElementById('main-panel');
    const cluesContainer = document.getElementById('clues-container');
    const acrossCluesList = document.getElementById('across-clues');
    const downCluesList = document.getElementById('down-clues');
    const timerDisplay = document.getElementById('timer');
    const leaderboardList = document.getElementById('leaderboard-list');
    const activeClueBar = document.getElementById('active-clue-bar');

    const leaderboardWindow = document.getElementById('leaderboard-window');
    const closeLeaderboardWindowBtn = document.getElementById('close-leaderboard-window');
    const showLeaderboardBtn = document.getElementById('show-leaderboard-btn');

    // New Elements
    const nameModal = document.getElementById('name-modal');
    const nameForm = document.getElementById('name-form');
    const nameInput = document.getElementById('name-input');
    const preGameOverlay = document.getElementById('pre-game-overlay');
    const startGameBtn = document.getElementById('start-game-btn');

    // --- CACHE KEYS ---
    const CACHE_KEY_GRID = 'crossword_user_grid';
    const CACHE_KEY_PUZZLE = 'crossword_puzzle_data'
    const CACHE_KEY_TIMER = 'crossword_timer';
    const CACHE_KEY_DATE = 'crossword_date';
    const CACHE_KEY_NAME = 'player_name';
    const CACHE_KEY_WON = 'crossword_won'

    // --- EVENT LISTENERS ---
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

    // New: Handle name submission
    nameForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const enteredName = nameInput.value.trim();
        if (enteredName) {
            playerName = enteredName;
            localStorage.setItem(CACHE_KEY_NAME, playerName);
            nameModal.classList.remove('active');
            preGameOverlay.classList.add('active'); // Show pre-game screen after name is entered
        }
    });

    startGameBtn.addEventListener('click', () => {
        preGameOverlay.classList.remove('active');
        mainPanel.classList.add('active'); // Show the puzzle
        if (localStorage.getItem(CACHE_KEY_WON) !== "true"){
            startGame();
        }

    });


    async function init() {
        loadCachedState()
        if (!puzzleData) {
            const puzzleData = await fetch(`/api/puzzle/${todayDate}`).then(res => res.json());
            userGrid = puzzleData.grid.map(row => row.map(cell => (cell.isBlack ? null : '')));
            localStorage.setItem(CACHE_KEY_PUZZLE, JSON.stringify(puzzleData))
        }
        leaderboardData = await fetch(`/api/leaderboard/${todayDate}`).then(res => res.json());

        startGameBtn.disabled = false;
        startGameBtn.textContent = localStorage.getItem(CACHE_KEY_WON) === "true" ? 'View Puzzle' : 'Start Puzzle';

        const gridRows = puzzleData.grid.length;
        const gridCols = puzzleData.grid[0].length;
        document.documentElement.style.setProperty('--grid-rows', gridRows);
        document.documentElement.style.setProperty('--grid-cols', gridCols);
        document.getElementById('puzzle-date').textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        if (playerName) {
            preGameOverlay.classList.add('active');
        } else {
            nameModal.classList.add('active');
        }

        renderGrid();
        renderClues();
        renderLeaderboard();

        // Set initial active cell
        for (let r = 0; r < gridRows; r++) {
            for (let c = 0; c < gridCols; c++) {
                if (!puzzleData.grid[r][c].isBlack) {
                    activeCell = { row: r, col: c };
                    return;
                }
            }
        }
    }

    function loadCachedState() {
        if (localStorage.getItem(CACHE_KEY_DATE) !== todayDate) {
            localStorage.removeItem(CACHE_KEY_GRID);
            localStorage.removeItem(CACHE_KEY_TIMER);
            localStorage.removeItem(CACHE_KEY_WON)
            localStorage.removeItem(CACHE_KEY_PUZZLE)
            localStorage.setItem(CACHE_KEY_DATE, todayDate)
            return;
        }

        playerName = localStorage.getItem(CACHE_KEY_NAME);

        const cachedPuzzle = localStorage.getItem(CACHE_KEY_PUZZLE);
        if (cachedPuzzle) {
            puzzleData = JSON.parse(cachedPuzzle);
        }

        const cachedGrid = localStorage.getItem(CACHE_KEY_GRID);
        if (cachedGrid) {
            try {
                const parsedGrid = JSON.parse(cachedGrid);
                if (Array.isArray(parsedGrid) && parsedGrid.length === puzzleData.grid.length) {
                    userGrid = parsedGrid;
                }
            } catch {}
        }

        const cachedTimer = localStorage.getItem(CACHE_KEY_TIMER);
        if (cachedTimer && !isNaN(Number(cachedTimer))) {
            secondsElapsed = Number(cachedTimer);
            timerDisplay.textContent = formatTime(secondsElapsed);
        }
    }

    function saveCachedState() {
        localStorage.setItem(CACHE_KEY_DATE, todayDate)
        localStorage.setItem(CACHE_KEY_GRID, JSON.stringify(userGrid));
        localStorage.setItem(CACHE_KEY_TIMER, secondsElapsed.toString());
    }

    // --- RENDER FUNCTIONS ---
    function renderGrid() {
        gridContainer.innerHTML = '';
        if (puzzleData == null) {
            const loading = document.createElement('p');
            loading.innerHTML = 'Loading puzzle...';
            gridContainer.appendChild(loading);
            return;
        }

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

                    if (userGrid[r] && userGrid[r][c]) {
                        input.value = userGrid[r][c];
                    }

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

        if (puzzleData == null) {
            const loading = document.createElement('p');
            loading.innerHTML = 'Loading puzzle...';
            acrossCluesList.appendChild(loading);
            downCluesList.appendChild(loading);
            return;
        }

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
        if (leaderboardData === null || leaderboardData.length === 0) {
            const empty = document.createElement('p');
            empty.innerHTML = `No scores yet. Be the first!`
            leaderboardList.appendChild(empty)
        } else {
            leaderboardData
            .forEach((entry, idx) => {
                const li = document.createElement('li');
                if (playerName && entry.name === playerName) {
                    li.classList.add('current-player');
                }
                li.innerHTML = `
                    <span class="rank">${idx + 1}</span>
                    <span class="name">${entry.name}</span>
                    <span class="time">${formatTime(entry.time_taken)}</span>
                `;
                leaderboardList.appendChild(li);
            });
        }

    }

    // --- GAME LOGIC & EVENT HANDLERS ---
    gridContainer.addEventListener('click', (e) => {
        if (!isGameStarted) return;
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
        if (!isGameStarted) return;
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
            if (isGameFinished || !isGameStarted) return;
            const { row, col } = activeCell;
            const inputEl = document.querySelector(`input[data-row='${row}'][data-col='${col}']`);

            // Letter input
            if (e.key.match(/^[a-zA-Z]$/)) {
                e.preventDefault();
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
        if (!wordCells.length) return;
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
        const gridRows = puzzleData.grid.length;
        const gridCols = puzzleData.grid[0].length;

        let currentDirection = direction;

        const maxAttempts = gridRows * gridCols * 2;

        for (let i = 0; i < maxAttempts; i++) {
            if (currentDirection === 'across') {
                col += delta;
                if (col >= gridCols) {
                    col = 0;
                    row++;
                } else if (col < 0) {
                    col = gridCols - 1;
                    row--;
                }
            } else {
                row += delta;
                if (row >= gridRows) {
                    row = 0;
                    col++;
                } else if (row < 0) {
                    row = gridRows - 1;
                    col--;
                }
            }

            if (row < 0 || row >= gridRows || col < 0 || col >= gridCols) {
                currentDirection = (currentDirection === 'across' ? 'down' : 'across');
                if (delta === 1) { // Moving forward, wrap to the top-left.
                    row = 0;
                    col = 0;
                } else { // Moving backward, wrap to the bottom-right.
                    row = gridRows - 1;
                    col = gridCols - 1;
                }
            }

            if (!puzzleData.grid[row][col].isBlack && (delta === -1 || userGrid[row][col] === '')) {
                direction = currentDirection;
                activeCell = { row, col };
                updateActiveHighlights();
                return;
            }
        }
    }

    // --- UI/STATE UPDATES ---
    function updateActiveHighlights() {
        // Remove all previous highlights
        document.querySelectorAll('.grid-cell').forEach(c => c.classList.remove('active', 'active-word'));
        document.querySelectorAll('#clues-container li').forEach(c => c.classList.remove('active-clue'));

        const activeCellEl = document.querySelector(`.grid-cell[data-row='${activeCell.row}'][data-col='${activeCell.col}']`);
        if(activeCellEl) {
            activeCellEl.classList.add('active');
            // CHANGE: Add { preventScroll: true } to stop the page from jumping on mobile
            activeCellEl.querySelector('input')?.focus({ preventScroll: true });
        }

        // Highlight the entire word and the corresponding clue
        const wordCells = getWordCells(activeCell.row, activeCell.col, direction);
        wordCells.forEach(({r, c}) => {
            document.querySelector(`.grid-cell[data-row='${r}'][data-col='${c}']`)?.classList.add('active-word');
        });

        if (!wordCells.length) return;
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
        if (!isValidCell(startRow, startCol) || puzzleData.grid[startRow][startCol].isBlack) {
            return [];
        }

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
        if (isGameStarted) return;
        isGameStarted = true;
        updateActiveHighlights();
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
        if (!isGameStarted) {
            return
        }
        for (let r = 0; r < puzzleData.grid.length; r++) {
            for (let c = 0; c < puzzleData.grid[r].length; c++) {
                if (!puzzleData.grid[r][c].isBlack && userGrid[r][c] !== puzzleData.grid[r][c].answer) {
                    return;
                }
            }
        }

        stopGame();
        setTimeout(() => {
            postScore(playerName, secondsElapsed); // Use playerName variable
            localStorage.setItem(CACHE_KEY_WON, "true")
            saveCachedState()
            leaderboardWindow.classList.add('active');
            renderLeaderboard();
        }, 100);
    }

    async function postScore(name, time) {
        console.log(`Posting score: ${name} - ${time} seconds`);
        try {
            const response = await fetch(`/api/leaderboard/${todayDate}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name,
                    puzzle_date: todayDate,
                    time_taken: time
                })
            });
            if (response.ok) {
                leaderboardData = await fetch(`/api/leaderboard/${todayDate}`).then(res => res.json());
                renderLeaderboard()
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