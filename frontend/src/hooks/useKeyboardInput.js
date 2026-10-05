import { useEffect, useRef } from 'react';

/**
 * Maps physical keyboard events to crossword actions while `enabled`.
 * Handlers are read from a ref so the listener is attached once.
 */
export function useKeyboardInput(handlers, enabled) {
    const handlersRef = useRef(handlers);

    useEffect(() => {
        handlersRef.current = handlers;
    });

    useEffect(() => {
        if (!enabled) return;

        const onKeyDown = (e) => {
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            const h = handlersRef.current;

            if (/^[a-zA-Z]$/.test(e.key)) {
                e.preventDefault();
                h.inputLetter(e.key.toUpperCase());
            } else if (e.key === 'Backspace') {
                e.preventDefault();
                h.backspace();
            } else if (e.key === 'Tab') {
                e.preventDefault();
                h.changeClue(e.shiftKey ? -1 : 1);
            } else if (e.key.startsWith('Arrow')) {
                e.preventDefault();
                h.arrow(e.key);
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [enabled]);
}
