import { useEffect, useMemo } from 'react';
import { endpoints } from '../api/client.js';
import { STORAGE_KEYS } from '../utils/storage.js';
import { useFetch } from './useFetch.js';
import { useLocalStorage } from './useLocalStorage.js';

const isPuzzle = (data) => Array.isArray(data?.grid) && data.grid.length > 0 && data.clues != null;

// Cache-first: today's puzzle is served from localStorage when present.
export function usePuzzle(date) {
    const [cached, setCached] = useLocalStorage(STORAGE_KEYS.puzzle, null);
    const hasCache = isPuzzle(cached);

    const { data, error, loading, refetch } = useFetch(endpoints.puzzle(date), { enabled: !hasCache });

    const shapeError = useMemo(
        () => (data && !isPuzzle(data) ? new Error('Puzzle response was malformed.') : null),
        [data]
    );

    useEffect(() => {
        if (isPuzzle(data)) setCached(data);
    }, [data, setCached]);

    return {
        puzzle: hasCache ? cached : isPuzzle(data) ? data : null,
        error: hasCache ? null : error || shapeError,
        loading: !hasCache && loading,
        retry: refetch,
    };
}
