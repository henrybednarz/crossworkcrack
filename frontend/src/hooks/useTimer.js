import { useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage.js';

// Ticks once per second while `running`; the count survives reloads.
export function useTimer({ running, storageKey }) {
    const [seconds, setSeconds] = useLocalStorage(storageKey, 0);

    useEffect(() => {
        if (!running) return;
        const id = setInterval(() => setSeconds((s) => (Number(s) || 0) + 1), 1000);
        return () => clearInterval(id);
    }, [running, setSeconds]);

    return Number(seconds) || 0;
}
