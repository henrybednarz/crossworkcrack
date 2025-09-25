const express = require('express');
const db = require('./db');
const router = express.Router();

// GET /puzzle/:date - Fetches a puzzle for a specific date
router.get('/:date', async (req, res) => {
  const { date } = req.params; // Get date from URL parameter

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Invalid date format. Please use YYYY-MM-DD.' });
  }

  try {
    const query = 'SELECT puzzle_data FROM puzzles WHERE puzzle_date = $1';
    const { rows } = await db.query(query, [date]);

    if (rows.length === 0) {
      // Mimic the Python backend's 404 response
      return res.status(404).json({ detail: `Puzzle for date ${date} not found.` });
    }

    res.json(rows[0].puzzle_data);
  } catch (err) {
    console.error(`Error fetching puzzle for date ${date}:`, err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;