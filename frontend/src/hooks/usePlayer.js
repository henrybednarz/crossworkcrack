import { useCallback, useEffect } from 'react';
import { endpoints, uploadAvatar } from '../api/client.js';
import { playerCacheKeys } from '../utils/storage.js';
import { useFetch } from './useFetch.js';
import { useMutation } from './useMutation.js';

export function usePlayer(name) {
    const cacheKeys = name ? playerCacheKeys(name) : {};
    const { data, error, loading, refetch } = useFetch(name ? endpoints.player(name) : null, {
        enabled: Boolean(name),
        cacheKey: cacheKeys.player,
    });
    // Fetched up front (not when the stats panel opens) so they're ready when it does.
    const {
        data: statsData,
        error: statsError,
        loading: statsLoading,
        refetch: refetchStats,
    } = useFetch(name ? endpoints.stats(name) : null, { enabled: Boolean(name), cacheKey: cacheKeys.stats });
    const { mutate, data: saved, loading: saving, error: saveError } = useMutation(uploadAvatar);

    const saveAvatar = useCallback(
        async (image) => {
            const result = await mutate({ name, image });
            if (result) refetch();
            return result;
        },
        [mutate, refetch, name]
    );

    // Ignore data left over from a previous name while the new one loads.
    const current = data?.name === name ? data : null;
    const stats = statsData?.name === name ? statsData : null;
    // Use a just-uploaded photo right away rather than waiting on the refetch.
    const justSaved = saved?.name === name ? saved.avatar_url : null;
    const avatarUrl = justSaved ?? current?.avatar_url ?? null;

    // Warm the browser cache so the avatar is ready wherever it's shown. URLs are versioned and immutable.
    useEffect(() => {
        if (avatarUrl) new Image().src = avatarUrl;
    }, [avatarUrl]);

    return {
        avatarUrl,
        loaded: Boolean(current),
        error,
        loading,
        refetch,
        stats,
        statsError,
        statsLoading,
        refetchStats,
        saveAvatar,
        saving,
        saveError,
    };
}
