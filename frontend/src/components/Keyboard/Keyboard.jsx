import ActiveClueBar from '../ActiveClueBar';
import './Keyboard.css';

const ROWS = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Backspace'],
];

export default function Keyboard({ activeClue, onKey, onPrevClue, onNextClue }) {
    return (
        <div className="keyboard-container">
            {/* Fixed-height slot: the bar grows upward into the gap above it, so the grid never resizes. */}
            <div className="clue-bar-slot">
                <div className="clue-bar-dock">
                    <ActiveClueBar clue={activeClue} onPrev={onPrevClue} onNext={onNextClue} />
                </div>
            </div>
            <div className="keyboard-keys">
                {ROWS.map((row, i) => (
                    <div className="keyboard-row" key={i}>
                        {row.map((key) => (
                            <button
                                key={key}
                                type="button"
                                className={key === 'Backspace' ? 'keyboard-key special-key' : 'keyboard-key'}
                                aria-label={key === 'Backspace' ? 'Backspace' : key}
                                // Keep focus off the button so it never steals key events or scrolls.
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => onKey(key)}
                            >
                                {key === 'Backspace' ? '⌫' : key}
                            </button>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
