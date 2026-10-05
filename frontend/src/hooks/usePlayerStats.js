import { endpoints } from '../api/client.js';
import { useFetch } from './useFetch.js';

// Stats for a player other than the signed-in one. Not cached, so localStorage doesn't fill up with other players.
export function usePlayerStats(name) {
    const { data, error, loading } = useFetch(name ? endpoints.stats(name) : null, { enabled: Boolean(name) });
    // Ignore data left over from a previously viewed player while the new one loads.
    const stats = data?.name === name ? data : null;
    return { stats, error, loading };
}
