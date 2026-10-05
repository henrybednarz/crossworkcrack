import './ActiveClueBar.css';

const Chevron = ({ flip }) => (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" style={flip ? { transform: 'scaleX(-1)' } : undefined}>
        <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const preventFocus = (e) => e.preventDefault();

export default function ActiveClueBar({ clue, onPrev, onNext }) {
    return (
        <div className="active-clue-bar">
            {onPrev && (
                <button type="button" className="clue-nav-btn" aria-label="Previous clue" onMouseDown={preventFocus} onClick={onPrev}>
                    <Chevron flip />
                </button>
            )}
            <span className="active-clue-text" aria-live="polite">
                {clue ? `${clue.number}: ${clue.text}` : ' '}
            </span>
            {onNext && (
                <button type="button" className="clue-nav-btn" aria-label="Next clue" onMouseDown={preventFocus} onClick={onNext}>
                    <Chevron />
                </button>
            )}
        </div>
    );
}
