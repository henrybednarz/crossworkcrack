import { useEffect, useState } from 'react';
import Header from './components/Header';
import PlayerModal from './components/PlayerModal';
import PreGameOverlay from './components/PreGameOverlay';
import Game from './components/Game';
import Leaderboard from './components/Leaderboard';
import { usePuzzle } from './hooks/usePuzzle.js';
import { useLeaderboard } from './hooks/useLeaderboard.js';
import { usePlayer } from './hooks/usePlayer.js';
import { useLocalStorage } from './hooks/useLocalStorage.js';
import { useTimer } from './hooks/useTimer.js';
import { useMediaQuery } from './hooks/useMediaQuery.js';
import { STORAGE_KEYS, clearPlayerCache } from './utils/storage.js';
import { formatDisplayDate, getTodayDate } from './utils/date.js';
import './App.css';

// Phones, plus any touch-first device that has no physical keyboard.
const ON_SCREEN_KEYBOARD_QUERY = '(max-width: 600px), (pointer: coarse)';

export default function App() {
    const [today] = useState(getTodayDate);
    const [displayDate] = useState(() => formatDisplayDate());

    const { puzzle, loading: puzzleLoading, error: puzzleError, retry } = usePuzzle(today);
    const leaderboard = useLeaderboard(today);

    const [playerName, setPlayerName] = useLocalStorage(STORAGE_KEYS.name, null);
    const [hasWon, setHasWon] = useLocalStorage(STORAGE_KEYS.won, false);
    const player = usePlayer(playerName);

    // 'idle' → 'playing' → 'finished'
    const [status, setStatus] = useState('idle');
    const [showPreGame, setShowPreGame] = useState(true);
    const [panelVisible, setPanelVisible] = useState(false);
    const [leaderboardOpen, setLeaderboardOpen] = useState(false);
    const [playerPanelOpen, setPlayerPanelOpen] = useState(false);

    const useOnScreenKeyboard = useMediaQuery(ON_SCREEN_KEYBOARD_QUERY);
    const seconds = useTimer({ running: status === 'playing', storageKey: STORAGE_KEYS.timer });

    const signedIn = Boolean(playerName);
    // A failed lookup shouldn't lock anyone out, so only gate once we know there's no photo.
    const needsAvatar = signedIn && player.loaded && !player.avatarUrl;
    const playerModalOpen = !signedIn || needsAvatar || playerPanelOpen;
    const preGameOpen = signedIn && !needsAvatar && showPreGame;
    const overlayOpen = playerModalOpen || preGameOpen || leaderboardOpen;
    const won = hasWon === true || hasWon === 'true';

    useEffect(() => {
        if (!puzzle) return;
        const root = document.documentElement.style;
        root.setProperty('--grid-rows', puzzle.grid.length);
        root.setProperty('--grid-cols', puzzle.grid[0].length);
    }, [puzzle]);

    const playerPending = !player.loaded && player.loading;
    const preGameStatus = puzzle && !playerPending ? 'ready' : puzzleError && !puzzleLoading ? 'error' : 'loading';

    const handleStart = () => {
        setShowPreGame(false);
        setPanelVisible(true);
        if (!won && status === 'idle') {
            setStatus('playing');
            window.scrollTo(0, 0);
        }
    };

    const handleSignOut = () => {
        setPlayerPanelOpen(false);
        clearPlayerCache(playerName);
        setPlayerName(null);
    };

    const handleNameSubmit = (name) => {
        setPlayerName(name);
    };

    const handleSaveAvatar = async (image) => {
        const result = await player.saveAvatar(image);
        if (result) leaderboard.refetch();
        return result;
    };

    const handleTogglePlayerPanel = () => {
        if (!signedIn || needsAvatar) return;
        setLeaderboardOpen(false);
        setPlayerPanelOpen((open) => !open);
    };

    const handleToggleLeaderboard = () => {
        if (leaderboardOpen) {
            setLeaderboardOpen(false);
        } else if (signedIn && !needsAvatar) {
            setPlayerPanelOpen(false);
            leaderboard.refetch();
            setLeaderboardOpen(true);
        }
    };

    const handleSolve = () => {
        setStatus('finished');
        setHasWon(true);
        setPlayerPanelOpen(false);
        setLeaderboardOpen(true);
        leaderboard.submitScore(playerName, seconds).then((result) => {
            if (result) player.refetchStats();
        });
    };

    const isPlaying = status === 'playing';
    const showKeyboard = useOnScreenKeyboard && isPlaying && !overlayOpen;

    return (
        <div className={`app${showKeyboard ? ' has-keyboard' : ''}`}>
            <Header
                date={displayDate}
                seconds={seconds}
                onToggleLeaderboard={handleToggleLeaderboard}
                onTogglePlayer={handleTogglePlayerPanel}
            />

            {playerModalOpen && (
                <PlayerModal
                    playerName={playerName}
                    avatarUrl={player.avatarUrl}
                    stats={player.stats}
                    statsLoading={player.statsLoading}
                    statsError={player.statsError}
                    requireAvatar={needsAvatar}
                    savingAvatar={player.saving}
                    avatarError={player.saveError}
                    onSubmitName={handleNameSubmit}
                    onSignOut={handleSignOut}
                    onSaveAvatar={handleSaveAvatar}
                    onClose={() => setPlayerPanelOpen(false)}
                />
            )}

            {preGameOpen && (
                <PreGameOverlay status={preGameStatus} hasWon={won} onStart={handleStart} onRetry={retry} />
            )}

            {puzzle && panelVisible && (
                <Game
                    puzzle={puzzle}
                    interactive={isPlaying && !overlayOpen}
                    showKeyboard={showKeyboard}
                    onSolve={handleSolve}
                />
            )}

            {leaderboardOpen && (
                <Leaderboard
                    entries={leaderboard.entries}
                    playerName={playerName}
                    loading={leaderboard.loading || leaderboard.submitting}
                    error={leaderboard.error}
                    onClose={() => setLeaderboardOpen(false)}
                />
            )}
        </div>
    );
}
