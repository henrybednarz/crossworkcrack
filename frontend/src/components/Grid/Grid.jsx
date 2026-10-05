import { useMemo } from 'react';
import Cell from './Cell.jsx';
import './Grid.css';

export default function Grid({ puzzleGrid, userGrid, active, wordCells, highlight, onCellClick }) {
    const wordKeys = useMemo(() => new Set(wordCells.map(({ row, col }) => `${row}-${col}`)), [wordCells]);

    return (
        <div className="grid-container">
            {puzzleGrid.map((cells, r) =>
                cells.map((cell, c) => (
                    <Cell
                        key={`${r}-${c}`}
                        cell={cell}
                        row={r}
                        col={c}
                        value={userGrid[r]?.[c] ?? ''}
                        isActive={highlight && active.row === r && active.col === c}
                        inWord={highlight && wordKeys.has(`${r}-${c}`)}
                        onSelect={onCellClick}
                    />
                ))
            )}
        </div>
    );
}
