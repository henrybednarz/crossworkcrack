import { formatTime } from '../../utils/time.js';
import './Header.css';

export default function Header({ date, seconds, onToggleLeaderboard, onTogglePlayer }) {
    return (
        <header className="header-bar">
            <div className="header-title">
                <h1>Who (tf) paywalled the mini?</h1>
                <p className="puzzle-date">{date}</p>
            </div>
            <div className="header-controls">
                <span className="timer" aria-label="Elapsed time">{formatTime(seconds)}</span>
                <button type="button" className="header-icon-btn" onClick={onToggleLeaderboard} title="Leaderboard">
                    🏆
                </button>
                <button type="button" className="header-icon-btn" onClick={onTogglePlayer} title="Player stats">
                    👤
                </button>
            </div>
        </header>
    );
}
