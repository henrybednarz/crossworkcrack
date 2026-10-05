// Same keys as the original vanilla frontend so in-progress games carry over.
export const STORAGE_KEYS = {
    grid: 'crossword_user_grid',
    puzzle: 'crossword_puzzle_data',
    timer: 'crossword_timer',
    date: 'crossword_date',
    name: 'player_name',
    won: 'crossword_won',
    leaderboard: 'crossword_leaderboard',
};

// Per-player response caches, so profile data renders instantly on reload.
export const playerCacheKeys = (name) => ({
    player: `player_profile:${name}`,
    stats: `player_stats:${name}`,
});

export function clearPlayerCache(name) {
    if (!name) return;
    Object.values(playerCacheKeys(name)).forEach((key) => writeStorage(key, null));
}

const DAILY_KEYS = [STORAGE_KEYS.grid, STORAGE_KEYS.timer, STORAGE_KEYS.won, STORAGE_KEYS.puzzle, STORAGE_KEYS.leaderboard];

export function readStorage(key, fallback = null) {
    try {
        const raw = localStorage.getItem(key);
        if (raw === null) return fallback;
        try {
            return JSON.parse(raw);
        } catch {
            return raw; // legacy plain-string values (e.g. player_name)
        }
    } catch {
        return fallback;
    }
}

export function writeStorage(key, value) {
    try {
        if (value === null || value === undefined) {
            localStorage.removeItem(key);
        } else {
            localStorage.setItem(key, JSON.stringify(value));
        }
    } catch {
        // Storage unavailable (private mode, quota) — the game still works in memory.
    }
}

export function resetIfNewDay(today) {
    if (readStorage(STORAGE_KEYS.date) === today) return;
    DAILY_KEYS.forEach((key) => writeStorage(key, null));
    writeStorage(STORAGE_KEYS.date, today);
}
