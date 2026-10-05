import { useState } from 'react';

export default function NameForm({ onSubmit }) {
    const [name, setName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (trimmed) onSubmit(trimmed);
    };

    return (
        <>
            <h2>Welcome!</h2>
            <p>Enter your name to sign in for the leaderboard.</p>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Your Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={15}
                    autoFocus
                    required
                />
                <button type="submit">Sign In</button>
            </form>
        </>
    );
}
