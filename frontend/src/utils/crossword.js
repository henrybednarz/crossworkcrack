// Pure grid logic shared by the crossword reducer. Positions are { row, col }.

export const ACROSS = 'across';
export const DOWN = 'down';

export const toggleDirection = (direction) => (direction === ACROSS ? DOWN : ACROSS);

export function isInBounds(puzzleGrid, row, col) {
    return row >= 0 && row < puzzleGrid.length && col >= 0 && col < puzzleGrid[0].length;
}

export function isOpen(puzzleGrid, row, col) {
    return isInBounds(puzzleGrid, row, col) && !puzzleGrid[row][col].isBlack;
}

export function createEmptyGrid(puzzleGrid) {
    return puzzleGrid.map((row) => row.map((cell) => (cell.isBlack ? null : '')));
}

export function createSolvedGrid(puzzleGrid) {
    return puzzleGrid.map((row) => row.map((cell) => (cell.isBlack ? null : cell.answer)));
}

export function isValidSavedGrid(saved, puzzleGrid) {
    return (
        Array.isArray(saved) &&
        saved.length === puzzleGrid.length &&
        saved.every((row, r) => Array.isArray(row) && row.length === puzzleGrid[r].length)
    );
}

export function setCell(userGrid, { row, col }, value) {
    return userGrid.map((cells, r) => (r === row ? cells.map((v, c) => (c === col ? value : v)) : cells));
}

export function firstOpenCell(puzzleGrid) {
    for (let row = 0; row < puzzleGrid.length; row++) {
        for (let col = 0; col < puzzleGrid[row].length; col++) {
            if (!puzzleGrid[row][col].isBlack) return { row, col };
        }
    }
    return { row: 0, col: 0 };
}

export function findNumberedCell(puzzleGrid, number) {
    for (let row = 0; row < puzzleGrid.length; row++) {
        for (let col = 0; col < puzzleGrid[row].length; col++) {
            const cell = puzzleGrid[row][col];
            if (cell.number != null && String(cell.number) === String(number)) return { row, col };
        }
    }
    return null;
}

export function getWordCells(puzzleGrid, { row, col }, direction) {
    if (!isOpen(puzzleGrid, row, col)) return [];

    const [dr, dc] = direction === ACROSS ? [0, 1] : [1, 0];
    let r = row;
    let c = col;
    while (isOpen(puzzleGrid, r - dr, c - dc)) {
        r -= dr;
        c -= dc;
    }

    const cells = [];
    while (isOpen(puzzleGrid, r, c)) {
        cells.push({ row: r, col: c });
        r += dr;
        c += dc;
    }
    return cells;
}

/**
 * Port of the original moveFocus(): walks the grid in reading order for the
 * current direction, wrapping rows/columns and flipping direction when it runs
 * off the board. Moving forward stops on the next empty cell; moving backward
 * stops on any open cell. Returns { row, col, direction } or null.
 */
export function findNextCell(puzzleGrid, userGrid, start, direction, delta) {
    const rows = puzzleGrid.length;
    const cols = puzzleGrid[0].length;
    let { row, col } = start;
    let dir = direction;

    for (let i = 0; i < rows * cols * 2; i++) {
        if (dir === ACROSS) {
            col += delta;
            if (col >= cols) {
                col = 0;
                row++;
            } else if (col < 0) {
                col = cols - 1;
                row--;
            }
        } else {
            row += delta;
            if (row >= rows) {
                row = 0;
                col++;
            } else if (row < 0) {
                row = rows - 1;
                col--;
            }
        }

        if (!isInBounds(puzzleGrid, row, col)) {
            dir = toggleDirection(dir);
            [row, col] = delta === 1 ? [0, 0] : [rows - 1, cols - 1];
        }

        if (!puzzleGrid[row][col].isBlack && (delta === -1 || userGrid[row][col] === '')) {
            return { row, col, direction: dir };
        }
    }
    return null;
}

const ARROW_DELTAS = {
    ArrowUp: [-1, 0],
    ArrowDown: [1, 0],
    ArrowLeft: [0, -1],
    ArrowRight: [0, 1],
};

// Moves to the nearest open cell in the arrow's direction, skipping black squares.
export function findArrowTarget(puzzleGrid, { row, col }, key) {
    const delta = ARROW_DELTAS[key];
    if (!delta) return null;
    let r = row + delta[0];
    let c = col + delta[1];
    while (isInBounds(puzzleGrid, r, c)) {
        if (!puzzleGrid[r][c].isBlack) return { row: r, col: c };
        r += delta[0];
        c += delta[1];
    }
    return null;
}

export function getActiveClue(puzzle, wordCells, direction) {
    if (!wordCells.length) return null;
    const { row, col } = wordCells[0];
    const number = puzzle.grid[row][col].number;
    if (number == null) return null;
    const clue = puzzle.clues[direction]?.find((c) => String(c.number) === String(number));
    return clue ? { number: String(number), direction, text: clue.clue } : null;
}

export function getClueSequence(clues) {
    return [
        ...(clues.across ?? []).map((c) => ({ number: String(c.number), direction: ACROSS })),
        ...(clues.down ?? []).map((c) => ({ number: String(c.number), direction: DOWN })),
    ];
}

/**
 * Steps to the previous/next clue (Across then Down, wrapping) and returns the
 * first empty cell of that word, or its first cell if the word is full.
 */
export function findAdjacentClue(puzzle, userGrid, activeClue, delta) {
    const sequence = getClueSequence(puzzle.clues);
    if (!sequence.length) return null;

    const current = activeClue
        ? sequence.findIndex((c) => c.number === activeClue.number && c.direction === activeClue.direction)
        : -1;
    const index =
        current === -1
            ? delta > 0 ? 0 : sequence.length - 1
            : (current + delta + sequence.length) % sequence.length;
    const target = sequence[index];

    const start = findNumberedCell(puzzle.grid, target.number);
    if (!start) return null;
    const cells = getWordCells(puzzle.grid, start, target.direction);
    const landing = cells.find(({ row, col }) => userGrid[row][col] === '') ?? cells[0] ?? start;
    return { row: landing.row, col: landing.col, direction: target.direction };
}

export function isSolved(puzzleGrid, userGrid) {
    return puzzleGrid.every((cells, r) =>
        cells.every((cell, c) => cell.isBlack || userGrid[r][c] === cell.answer)
    );
}
