import { useState } from 'react';
import './Avatar.css';

// size: 'sm' (leaderboard) | 'md' (podium) | 'lg' (profile)
export default function Avatar({ src, name = '', size = 'sm' }) {
    const [failedSrc, setFailedSrc] = useState(null);
    const showImage = src && failedSrc !== src;

    return (
        <span className={`avatar avatar-${size}`} aria-hidden="true">
            {showImage ? (
                <img src={src} alt="" loading="lazy" onError={() => setFailedSrc(src)} />
            ) : (
                name.trim().charAt(0).toUpperCase()
            )}
        </span>
    );
}
