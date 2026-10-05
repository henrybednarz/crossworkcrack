import { useEffect, useState } from 'react';
import { readStorage, writeStorage } from '../utils/storage.js';

// useState that persists to localStorage. Setting null/undefined removes the key.
export function useLocalStorage(key, initialValue) {
    const [value, setValue] = useState(() => readStorage(key, initialValue));

    useEffect(() => {
        writeStorage(key, value);
    }, [key, value]);

    return [value, setValue];
}
