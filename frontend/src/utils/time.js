export function formatTime(totalSeconds) {
    const total = Number(totalSeconds) || 0;
    const minutes = Math.floor(total / 60).toString().padStart(2, '0');
    const seconds = (total % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
}
