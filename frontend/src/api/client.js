const API_BASE = import.meta.env.VITE_API_BASE ?? '';

export class ApiError extends Error {
    constructor(message, status) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

export async function request(path, { method = 'GET', body, signal } = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
        method,
        signal,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
        const message = data?.error || data?.detail || `Request failed (${response.status})`;
        throw new ApiError(message, response.status);
    }
    return data;
}

export const endpoints = {
    puzzle: (date) => `/api/puzzle/${date}`,
    leaderboard: (date) => `/api/leaderboard/${date}`,
    stats: (name) => `/api/stats?name=${encodeURIComponent(name)}`,
    player: (name) => `/api/player?name=${encodeURIComponent(name)}`,
};

export function postScore({ name, puzzle_date, time_taken }) {
    return request(endpoints.leaderboard(puzzle_date), {
        method: 'POST',
        body: { name, puzzle_date, time_taken },
    });
}

export function uploadAvatar({ name, image }) {
    return request('/api/player', {
        method: 'POST',
        body: { name, image },
    });
}
