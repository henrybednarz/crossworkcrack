import { useEffect, useState } from 'react';
import Modal from '../Modal';
import AvatarCapture from '../AvatarCapture';
import NameForm from './NameForm.jsx';
import PlayerStats from './PlayerStats.jsx';
import './PlayerModal.css';

// Signed out: name entry. Signed in without a photo: photo capture. Neither can be dismissed.
// Signed in: stats, with options to sign out or change photo.
export default function PlayerModal({ playerName, avatarUrl, stats, statsLoading, statsError, requireAvatar, savingAvatar, avatarError, onSubmitName, onSaveAvatar, onSignOut, onClose }) {
    // null | 'photo'
    const [editing, setEditing] = useState(null);
    const signedIn = Boolean(playerName);
    const dismissable = signedIn && !requireAvatar;

    useEffect(() => {
        if (!dismissable) return;
        const handleKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [dismissable, onClose]);

    const handleSaveAvatar = async (image) => {
        const result = await onSaveAvatar(image);
        if (result) setEditing(null);
        return result;
    };

    let body;
    if (!signedIn) {
        body = <NameForm onSubmit={onSubmitName} />;
    } else if (requireAvatar || editing === 'photo') {
        body = (
            <>
                <h2>{requireAvatar ? 'Add a Profile Photo' : 'Change Photo'}</h2>
                <p>It&apos;ll show next to your name on the leaderboard.</p>
                <AvatarCapture
                    name={playerName}
                    currentSrc={avatarUrl}
                    saving={savingAvatar}
                    error={avatarError}
                    onSave={handleSaveAvatar}
                    onCancel={requireAvatar ? undefined : () => setEditing(null)}
                />
            </>
        );
    } else {
        body = (
            <PlayerStats
                playerName={playerName}
                avatarUrl={avatarUrl}
                stats={stats}
                loading={statsLoading}
                error={statsError}
                onSignOut={onSignOut}
                onChangePhoto={() => setEditing('photo')}
            />
        );
    }

    return (
        <Modal className="player-modal">
            {dismissable && (
                <button type="button" className="player-modal-close" onClick={onClose} title="Close">
                    &times;
                </button>
            )}
            {body}
        </Modal>
    );
}
