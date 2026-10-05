import LeaderboardRow from './LeaderboardRow.jsx';
import Podium from './Podium.jsx';
import './Leaderboard.css';

const PODIUM_SIZE = 3;

export default function Leaderboard({ entries, playerName, loading, error, onClose }) {
    let body;
    if (error && entries.length === 0) {
        body = <p className="leaderboard-message">Couldn&apos;t load the leaderboard.</p>;
    } else if (loading && entries.length === 0) {
        body = <p className="leaderboard-message">Loading...</p>;
    } else if (entries.length === 0) {
        body = <p className="leaderboard-message">No scores yet. Be the first!</p>;
    } else {
        const rest = entries.slice(PODIUM_SIZE);
        body = (
            <>
                <Podium entries={entries.slice(0, PODIUM_SIZE)} playerName={playerName} />
                {rest.length > 0 && (
                    <>
                        <div className="leaderboard-header">
                            <span className="rank-col">Rank</span>
                            <span className="name-col">Name</span>
                            <span className="time-col">Time</span>
                        </div>
                        <ol className="leaderboard-list" start={PODIUM_SIZE + 1}>
                            {rest.map((entry, idx) => (
                                <LeaderboardRow
                                    key={entry.name}
                                    rank={idx + PODIUM_SIZE + 1}
                                    entry={entry}
                                    isCurrentPlayer={Boolean(playerName) && entry.name === playerName}
                                />
                            ))}
                        </ol>
                    </>
                )}
            </>
        );
    }

    return (
        <div className="leaderboard-window">
            <div className="leaderboard-content">
                <div className="leaderboard-title">
                    <h2>Leaderboard 🏆</h2>
                    <button type="button" className="leaderboard-close" onClick={onClose} title="Close">
                        ✕
                    </button>
                </div>
                {body}
            </div>
        </div>
    );
}
