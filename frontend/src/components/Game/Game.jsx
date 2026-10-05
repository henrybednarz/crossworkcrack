import { useEffect, useRef } from 'react';
import { useCrossword } from '../../hooks/useCrossword.js';
import { useKeyboardInput } from '../../hooks/useKeyboardInput.js';
import { STORAGE_KEYS } from '../../utils/storage.js';
import { ACROSS, DOWN } from '../../utils/crossword.js';
import Grid from '../Grid';
import ClueList from '../ClueList';
import Keyboard from '../Keyboard';
import './Game.css';

const noop = () => {};

export default function Game({ puzzle, interactive, showKeyboard, onSolve }) {
    const { userGrid, active, wordCells, activeClue, solved, actions } = useCrossword(puzzle, STORAGE_KEYS.grid);

    useKeyboardInput(actions, interactive);

    const onSolveRef = useRef(onSolve);
    useEffect(() => {
        onSolveRef.current = onSolve;
    });

    useEffect(() => {
        if (interactive && solved) onSolveRef.current();
    }, [interactive, solved]);

    const handleVirtualKey = (key) => {
        if (!interactive) return;
        if (key === 'Backspace') actions.backspace();
        else actions.inputLetter(key);
    };

    return (
        <>
            <main className="game-container">
                <div className="main-panel">
                    <section className="crossword-section">
                        <Grid
                            puzzleGrid={puzzle.grid}
                            userGrid={userGrid}
                            active={active}
                            wordCells={wordCells}
                            highlight={interactive}
                            onCellClick={interactive ? actions.selectCell : noop}
                        />
                    </section>
                    <section className="clues-container">
                        <ClueList
                            title="Across"
                            direction={ACROSS}
                            clues={puzzle.clues.across ?? []}
                            activeClue={interactive ? activeClue : null}
                            onSelect={interactive ? actions.selectClue : noop}
                        />
                        <ClueList
                            title="Down"
                            direction={DOWN}
                            clues={puzzle.clues.down ?? []}
                            activeClue={interactive ? activeClue : null}
                            onSelect={interactive ? actions.selectClue : noop}
                        />
                    </section>
                </div>
            </main>
            {showKeyboard && (
                <Keyboard
                    activeClue={activeClue}
                    onKey={handleVirtualKey}
                    onPrevClue={() => interactive && actions.changeClue(-1)}
                    onNextClue={() => interactive && actions.changeClue(1)}
                />
            )}
        </>
    );
}
