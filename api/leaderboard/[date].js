import db from "../../db";

export default async function handler(req, res) {
    const {query: {date}, method} = req;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: 'Invalid date format. Please use YYYY-MM-DD.' });
    }
    if (method === "GET") {
        try {
            const query = `
                WITH DailyMinTimes AS (
                    SELECT puzzle_date, MIN(time_taken) as min_time
                    FROM leaderboard
                    GROUP BY puzzle_date
                ),
                     DailyWinners AS (
                         SELECT l.name
                         FROM leaderboard l
                                  JOIN DailyMinTimes dmt
                                       ON l.puzzle_date = dmt.puzzle_date
                                           AND l.time_taken = dmt.min_time
                     ),
                     UserWins AS (
                         SELECT name, COUNT(*) as win_count
                         FROM DailyWinners
                         GROUP BY name
                     )
                SELECT
                    l.name,
                    l.time_taken,
                    COALESCE(uw.win_count, 0) as wins
                FROM leaderboard l
                         LEFT JOIN UserWins uw ON l.name = uw.name
                WHERE l.puzzle_date = $1
                ORDER BY l.time_taken ASC
            `;
            const { rows } = await db.query(query, [date]);
            res.status(200).json(rows);
        } catch (err) {
            console.error(`Error fetching leaderboard for date ${date}:`, err);
            res.status(500).json({ error: 'Error fetching from leaderboard database' });
        }
    } else if (method === "POST") {
        const { name, puzzle_date, time_taken } = req.body;
        if (!name || typeof name !== 'string' || name.trim() === '' || !puzzle_date || typeof time_taken !== 'number') {
            return res.status(400).json({ error: 'Invalid or missing name, puzzle_date, or time_taken.' });
        }

        try {
            const query = `
                INSERT INTO leaderboard (name, puzzle_date, time_taken)
                VALUES ($1, $2, $3)
                ON CONFLICT (name, puzzle_date)
                DO UPDATE SET time_taken = EXCLUDED.time_taken
                WHERE leaderboard.time_taken > EXCLUDED.time_taken;
            `;
            const values = [name.trim(), puzzle_date, time_taken];
            const result = await db.query(query, values);
            if (result.rowCount > 0) {
                res.status(201).json({ message: 'Score saved successfully!' });
            } else {
                res.status(200).json({ message: 'A better score already exists.' });
            }
        } catch (err) {
            console.error('Error posting score:', err);
            res.status(500).json({ error: 'Error posting score' });
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}