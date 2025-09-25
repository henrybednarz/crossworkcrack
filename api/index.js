require('dotenv').config();
const express = require('express');
const cors = require('cors');
const puzzleRoutes = require('./routes/puzzle.routes');
const leaderboardRoutes = require('./routes/leaderboard.routes');
const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- API Routes ---
app.use('/puzzle', puzzleRoutes);
app.use('/leaderboard', leaderboardRoutes);

// Basic root route for health checks
app.get('/', (req, res) => {
  res.send('Crossword API is running! 🚀');
});

// --- ADD: Export the Express app for Vercel ---
module.exports = app;