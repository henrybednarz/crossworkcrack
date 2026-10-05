import { memo } from 'react';

function Cell({ cell, row, col, value, isActive, inWord, onSelect }) {
    if (cell.isBlack) return <div className="grid-cell black" />;

    const className = ['grid-cell', inWord && 'active-word', isActive && 'active'].filter(Boolean).join(' ');

    return (
        <div className={className} onClick={() => onSelect(row, col)}>
            {cell.number != null && <span className="cell-number">{cell.number}</span>}
            <div className="cell-content">{value}</div>
        </div>
    );
}

export default memo(Cell);
