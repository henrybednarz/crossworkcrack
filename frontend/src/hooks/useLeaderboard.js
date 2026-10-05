import { useCallback, useEffect, useMemo } from 'react';
import { endpoints, postScore } from '../api/client.js';
import { STORAGE_KEYS } from '../utils/storage.js';
import { useFetch } from './useFetch.js';
import { useMutation } from './useMutation.js';

// Fetched on page load (not when the overlay opens) and cached for the day, so it's ready when shown.
export function useLeaderboard(date) {
    const { data, error, loading, refetch } = useFetch(endpoints.leaderboard(date), {
        cacheKey: STORAGE_KEYS.leaderboard,
    });
    const { mutate, loading: submitting, error: submitError } = useMutation(postScore);

    const submitScore = useCallback(
        async (name, seconds) => {
            const result = await mutate({ name, puzzle_date: date, time_taken: seconds });
            if (result) refetch();
            return result;
        },
        [mutate, refetch, date]
    );

    const entries = useMemo(() => (Array.isArray(data) ? data : []), [data]);

    // Warm the browser cache so avatars are ready when the leaderboard opens. URLs are versioned and immutable.
    useEffect(() => {
        entries.forEach((entry) => {
            if (entry.avatar_url) new Image().src = entry.avatar_url;
        });
    }, [entries]);

    return {
        entries,
        error,
        loading,
        refetch,
        submitScore,
        submitting,
        submitError,
    };
}
