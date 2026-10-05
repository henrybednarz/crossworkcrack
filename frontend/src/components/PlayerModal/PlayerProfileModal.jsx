import { useEffect } from 'react';
import Modal from '../Modal';
import PlayerStats from './PlayerStats.jsx';
import { usePlayerStats } from '../../hooks/usePlayerStats.js';
import './PlayerModal.css';

// Read-only profile card for another player, opened from the leaderboard.
export default function PlayerProfileModal({ name, avatarUrl, onClose }) {
    const { stats, loading, error } = usePlayerStats(name);

    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose]);

    return (
        <Modal className="player-modal player-profile-modal">
            <button type="button" className="player-modal-close" onClick={onClose} title="Close">
                &times;
            </button>
            <PlayerStats playerName={name} avatarUrl={avatarUrl} stats={stats} loading={loading} error={error} />
        </Modal>
    );
}
