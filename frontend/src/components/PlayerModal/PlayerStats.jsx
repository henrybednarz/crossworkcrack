import Avatar from '../Avatar';
import { formatTime } from '../../utils/time.js';

function formatShortDate(isoDate) {
    if (!isoDate) return null;
    const [year, month, day] = isoDate.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function StatTile({ label, value, detail, icon }) {
    return (
        <div className="stat-tile">
            <span className="stat-icon">{icon}</span>
            <span className="stat-value">{value}</span>
            <span className="stat-label">{label}</span>
            {detail && <span className="stat-detail">{detail}</span>}
        </div>
    );
}

// Without `onSignOut` / `onChangePhoto` this is a read-only card for viewing another player.
export default function PlayerStats({ playerName, avatarUrl, stats, loading, error, onSignOut, onChangePhoto }) {
    const isOwnProfile = Boolean(onSignOut);
    let body;
    if (error && !stats) {
        body = <p className="player-stats-message">Couldn&apos;t load {isOwnProfile ? 'your' : 'their'} stats.</p>;
    } else if (loading && !stats) {
        body = <p className="player-stats-message">Loading...</p>;
    } else if (!stats?.solves) {
        body = (
            <p className="player-stats-message">
                {isOwnProfile ? 'No solves yet. Finish today\'s puzzle to get on the board!' : 'No solves yet.'}
            </p>
        );
    } else {
        body = (
            <div className="stat-grid">
                <StatTile label="Wins" value={stats.wins} icon="👑" />
                <StatTile label="Solved" value={stats.solves} icon="🧩" />
                <StatTile label="Average" value={formatTime(stats.average_time)} icon="📊" />
                <StatTile
                    label="Fastest"
                    value={formatTime(stats.fastest_time)}
                    detail={formatShortDate(stats.fastest_date)}
                    icon="🏎️💨"
                />
            </div>
        );
    }

    return (
        <>
            <div className="player-avatar">
                <span className="player-avatar-frame">
                    <Avatar src={avatarUrl} name={playerName} size="lg" />
                    {onChangePhoto && (
                        <button type="button" className="edit-photo-btn" onClick={onChangePhoto} title="Change photo" aria-label="Change photo">
                            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                                <path
                                    d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                    )}
                </span>
            </div>
            <h2 className="player-name">
                <span className="player-name-text">
                    {playerName}
                    {onSignOut && (
                        <button type="button" className="sign-out-btn" onClick={onSignOut} title="Sign out" aria-label="Sign out">
                            &times;
                        </button>
                    )}
                </span>
            </h2>
            {body}
        </>
    );
}
