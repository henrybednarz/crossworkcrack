import db from "../db";

export default async function handler(req, res) {
    if (req.headers['authorization'] !== `Bearer balls1fortnite`) {
        return res.status(401).end('Unauthorized');
    }
    const todayDate = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    try {
        const crossword_request = await fetch(`https://www.nytimes.com/svc/crosswords/v6/puzzle/mini/${todayDate}.json`);

        if (!crossword_request.ok) {
            console.log('Failed to fetch puzzle from NYT API');
            return res.status(500).json({ message: 'Error fetching daily puzzle' });
        }

        const puzzleData = await crossword_request.json();
        const query = `
            INSERT INTO puzzles (puzzle_date, puzzle_data)
            VALUES ($1, $2)
            ON CONFLICT (puzzle_date) DO NOTHING;
        `;
        const values = [todayDate, puzzleData];
        const dbResult = await db.query(query, values);

        if (dbResult.rowCount > 0) {
            console.log(`Successfully inserted puzzle for ${todayDate}`);
            res.status(200).json({ message: 'Daily puzzle fetched and saved' });
        } else {
            console.log(`Puzzle for ${todayDate} already exists.`);
            res.status(200).json({ message: 'Puzzle already exists' });
        }

    } catch (error) {
        console.error('An error occurred:', error);
        res.status(500).json({ message: 'An internal server error occurred.' });
    }
}