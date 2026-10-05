import { useCallback, useState } from 'react';

/**
 * Generic hook for write requests. `mutate` resolves to the result, or null
 * on failure (the error is exposed in state), so callers don't need try/catch.
 */
export function useMutation(mutationFn) {
    const [state, setState] = useState({ data: null, error: null, loading: false });

    const mutate = useCallback(
        async (...args) => {
            setState({ data: null, error: null, loading: true });
            try {
                const data = await mutationFn(...args);
                setState({ data, error: null, loading: false });
                return data;
            } catch (error) {
                console.error('Mutation failed:', error);
                setState({ data: null, error, loading: false });
                return null;
            }
        },
        [mutationFn]
    );

    return { ...state, mutate };
}
