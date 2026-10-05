import Avatar from '../Avatar';
import { formatTime } from '../../utils/time.js';

export default function LeaderboardRow({ rank, entry, isCurrentPlayer, onSelect }) {
    const wins = Number(entry.wins) || 0;
    return (
        <li className={isCurrentPlayer ? 'current-player' : undefined}>
            <span className="rank">{rank}.</span>
            <button type="button" className="name" onClick={() => onSelect(entry)} title={`View ${entry.name}'s profile`}>
                <Avatar src={entry.avatar_url} name={entry.name} size="sm" />
                <span>
                    {entry.name}
                    {wins > 0 && ` (👑 x ${wins})`}
                </span>
            </button>
            <span className="time">{formatTime(entry.time_taken)}</span>
        </li>
    );
}
