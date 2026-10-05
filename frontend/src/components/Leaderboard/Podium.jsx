import Avatar from '../Avatar';
import { formatTime } from '../../utils/time.js';

// Visual order puts first place in the middle: 2nd, 1st, 3rd.
const DISPLAY_ORDER = [1, 0, 2];

export default function Podium({ entries, playerName }) {
    return (
        <ol className="podium">
            {DISPLAY_ORDER.map((idx) => {
                const entry = entries[idx];
                if (!entry) return null;
                const rank = idx + 1;
                const wins = Number(entry.wins) || 0;
                const isCurrentPlayer = Boolean(playerName) && entry.name === playerName;
                const classes = ['podium-spot', `podium-${rank}`, isCurrentPlayer && 'current-player'];
                return (
                    <li key={entry.name} className={classes.filter(Boolean).join(' ')}>
                        <div className="podium-avatar">
                            {rank === 1 && (
                                <span className="podium-crown" aria-hidden="true">
                                    👑
                                </span>
                            )}
                            <Avatar src={entry.avatar_url} name={entry.name} size="md" />
                        </div>
                        <span className="podium-name">{entry.name}</span>
                        <span className="podium-time">{formatTime(entry.time_taken)}</span>
                        {wins > 0 && <span className="podium-wins">👑 x {wins}</span>}
                        <div className="podium-step">
                            <span className="podium-rank">{rank}</span>
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}
