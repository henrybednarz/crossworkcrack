import { useEffect, useMemo, useReducer } from 'react';
import { readStorage, writeStorage } from '../utils/storage.js';
import {
    ACROSS,
    createEmptyGrid,
    findAdjacentClue,
    findArrowTarget,
    findNextCell,
    findNumberedCell,
    firstOpenCell,
    getActiveClue,
    getWordCells,
    isOpen,
    isSolved,
    isValidSavedGrid,
    setCell,
    toggleDirection,
} from '../utils/crossword.js';

function init({ puzzle, storageKey }) {
    const puzzleGrid = puzzle.grid;
    const saved = readStorage(storageKey);
    return {
        puzzle,
        puzzleGrid,
        userGrid: isValidSavedGrid(saved, puzzleGrid) ? saved : createEmptyGrid(puzzleGrid),
        active: firstOpenCell(puzzleGrid),
        direction: ACROSS,
    };
}

function moveTo(state, target) {
    if (!target) return state;
    return { ...state, active: { row: target.row, col: target.col }, direction: target.direction };
}

function reducer(state, action) {
    const { puzzleGrid, userGrid, active, direction } = state;

    switch (action.type) {
        case 'selectCell': {
            const { row, col } = action;
            if (!isOpen(puzzleGrid, row, col)) return state;
            if (row === active.row && col === active.col) {
                return { ...state, direction: toggleDirection(direction) };
            }
            return { ...state, active: { row, col } };
        }
        case 'selectClue': {
            const start = findNumberedCell(puzzleGrid, action.number);
            return start ? { ...state, active: start, direction: action.direction } : state;
        }
        case 'inputLetter': {
            const nextGrid = setCell(userGrid, active, action.letter);
            const target = findNextCell(puzzleGrid, nextGrid, active, direction, 1);
            return moveTo({ ...state, userGrid: nextGrid }, target);
        }
        case 'backspace': {
            if (userGrid[active.row][active.col] !== '') {
                return { ...state, userGrid: setCell(userGrid, active, '') };
            }
            const prev = findNextCell(puzzleGrid, userGrid, active, direction, -1);
            if (!prev) return state;
            return { ...moveTo(state, prev), userGrid: setCell(userGrid, prev, '') };
        }
        case 'changeClue': {
            const activeClue = getActiveClue(state.puzzle, getWordCells(puzzleGrid, active, direction), direction);
            return moveTo(state, findAdjacentClue(state.puzzle, userGrid, activeClue, action.delta));
        }
        case 'arrow': {
            const target = findArrowTarget(puzzleGrid, active, action.key);
            return target ? { ...state, active: target } : state;
        }
        default:
            return state;
    }
}

export function useCrossword(puzzle, storageKey) {
    const [state, dispatch] = useReducer(reducer, { puzzle, storageKey }, init);
    const { userGrid, active, direction } = state;

    useEffect(() => {
        writeStorage(storageKey, userGrid);
    }, [storageKey, userGrid]);

    const wordCells = useMemo(
        () => getWordCells(puzzle.grid, active, direction),
        [puzzle.grid, active, direction]
    );
    const activeClue = useMemo(
        () => getActiveClue(puzzle, wordCells, direction),
        [puzzle, wordCells, direction]
    );
    const solved = useMemo(() => isSolved(puzzle.grid, userGrid), [puzzle.grid, userGrid]);

    const actions = useMemo(
        () => ({
            selectCell: (row, col) => dispatch({ type: 'selectCell', row, col }),
            selectClue: (number, dir) => dispatch({ type: 'selectClue', number, direction: dir }),
            inputLetter: (letter) => dispatch({ type: 'inputLetter', letter }),
            backspace: () => dispatch({ type: 'backspace' }),
            changeClue: (delta) => dispatch({ type: 'changeClue', delta }),
            arrow: (key) => dispatch({ type: 'arrow', key }),
        }),
        []
    );

    return { userGrid, active, direction, wordCells, activeClue, solved, actions };
}
