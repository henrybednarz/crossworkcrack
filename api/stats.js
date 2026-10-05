import db from "../db";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const name = typeof req.query.name === 'string' ? req.query.name.trim() : '';
    if (!name) {
        return res.status(400).json({ error: 'Missing name.' });
    }

    try {
        // A "win" is having the fastest time on a given day, matching the leaderboard's win count.
        const query = `
            WITH DailyMinTimes AS (
                SELECT puzzle_date, MIN(time_taken) AS min_time
                FROM leaderboard
                GROUP BY puzzle_date
            ),
                 PlayerSolves AS (
                     SELECT puzzle_date, time_taken
                     FROM leaderboard
                     WHERE name = $1
                 )
            SELECT
                COUNT(*)::int AS solves,
                COUNT(*) FILTER (WHERE ps.time_taken = dmt.min_time)::int AS wins,
                ROUND(AVG(ps.time_taken))::int AS average_time,
                MIN(ps.time_taken)::int AS fastest_time,
                (SELECT puzzle_date::text FROM PlayerSolves ORDER BY time_taken ASC, puzzle_date ASC LIMIT 1) AS fastest_date
            FROM PlayerSolves ps
                     JOIN DailyMinTimes dmt ON ps.puzzle_date = dmt.puzzle_date
        `;
        const { rows } = await db.query(query, [name]);
        res.status(200).json({ name, ...rows[0] });
    } catch (err) {
        console.error(`Error fetching stats for ${name}:`, err);
        res.status(500).json({ error: 'Error fetching player stats' });
    }
}
