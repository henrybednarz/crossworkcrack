const express = require('express');
const db = require('./db');
const router = express.Router();

// GET /leaderboard - Fetches all scores
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT name, time_taken, puzzle_date FROM leaderboard ORDER BY time_taken ASC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching scores' });
  }
});

// POST /leaderboard - Adds or updates a score
router.post('/', async (req, res) => {
  const { name, puzzle_date, time_taken } = req.body;

  if (typeof name !== 'string' || name.trim() === '' || !puzzle_date || typeof time_taken !== 'number') {
    return res.status(400).json({ error: 'Invalid name, puzzle_date, or time_taken provided.' });
  }

  try {
    const query = `
      INSERT INTO leaderboard (name, puzzle_date, time_taken)
      VALUES ($1, $2, $3)
      ON CONFLICT (name, puzzle_date)
      DO UPDATE SET time_taken = EXCLUDED.time_taken;
    `;
    const values = [name.trim(), puzzle_date, time_taken];
    await db.query(query, values);

    res.status(200).json({ message: 'Leaderboard score added successfully!' });
  } catch (err) {
    res.status(500).json({ error: 'Error posting score' });
  }
});

module.exports = router;