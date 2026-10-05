import { useCallback, useEffect, useState } from 'react';
import { request } from '../api/client.js';
import { readStorage, writeStorage } from '../utils/storage.js';

/**
 * Generic GET hook. Refetches when `path` changes, aborts stale requests,
 * and keeps previous data visible while a refetch is in flight.
 *
 * With `cacheKey`, the last response is persisted to localStorage and shown
 * immediately on the next load while a fresh copy is fetched (stale-while-revalidate).
 */
export function useFetch(path, { enabled = true, cacheKey = null } = {}) {
    const [state, setState] = useState(() => ({
        data: cacheKey ? readStorage(cacheKey) : null,
        error: null,
        loading: enabled,
    }));
    const [reloadToken, setReloadToken] = useState(0);

    useEffect(() => {
        if (!enabled || !path) {
            setState((s) => ({ ...s, loading: false }));
            return;
        }

        const controller = new AbortController();
        setState((s) => ({ ...s, data: (cacheKey && readStorage(cacheKey)) ?? s.data, loading: true, error: null }));

        request(path, { signal: controller.signal })
            .then((data) => {
                if (cacheKey) writeStorage(cacheKey, data);
                setState({ data, error: null, loading: false });
            })
            .catch((error) => {
                if (error.name === 'AbortError') return;
                setState((s) => ({ ...s, error, loading: false }));
            });

        return () => controller.abort();
    }, [path, enabled, cacheKey, reloadToken]);

    const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

    return { ...state, refetch };
}
