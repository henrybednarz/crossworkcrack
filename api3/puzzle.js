const express = require('express');
const db = require('./db');
const router = express.Router();

/**
 * GET /api3/puzzle/{date}
 * Fetches puzzle data for a specific date.
 */
router.get('/:date', (req, res) => {
  const { date } = req.params;

  // Validate the date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Invalid date format. Please use YYYY-MM-DD.' });
  }

  try {
    const query = 'SELECT puzzle_data FROM puzzles WHERE puzzle_date = $1';
    const { rows } = db.query(query, [date]);

    if (rows.length === 0) {
      return res.status(404).json({ detail: `Puzzle for date ${date} not found.` });
    }

    res.status(200).json(rows[0].puzzle_data);
  } catch (err) {
    console.error(`Database error fetching puzzle for date ${date}:`, err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;