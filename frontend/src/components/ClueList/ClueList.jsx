import { useEffect, useRef } from 'react';
import './ClueList.css';

export default function ClueList({ title, direction, clues, activeClue, onSelect }) {
    const activeRef = useRef(null);
    const activeNumber = activeClue?.direction === direction ? activeClue.number : null;

    useEffect(() => {
        activeRef.current?.scrollIntoView({ block: 'nearest' });
    }, [activeNumber]);

    return (
        <div className="clue-list">
            <h3>{title}</h3>
            <ul>
                {clues.map((clue) => {
                    const isActive = String(clue.number) === activeNumber;
                    return (
                        <li
                            key={clue.number}
                            ref={isActive ? activeRef : undefined}
                            className={isActive ? 'active-clue' : undefined}
                            onClick={() => onSelect(clue.number, direction)}
                        >
                            <strong>{clue.number}.</strong> {clue.clue}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
