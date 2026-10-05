// Puzzles are keyed by the New York calendar day.
export function getTodayDate() {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
}

export function formatDisplayDate(date = new Date()) {
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}
