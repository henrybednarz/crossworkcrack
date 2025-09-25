const express = require('express');
const leaderboardRouter = require('./leaderboard');
// const puzzleRouter = require('./puzzle'); // Keep for future use

const app = express();
app.use(express.json());

// Handle the root /api3 request
app.get('/api', (req, res) => {
  res.status(200).send('API is running successfully.');
});

// Use the leaderboard router for requests to /api3/leaderboard
app.use('/api3/leaderboard', leaderboardRouter);

// app.use('/api3/puzzle', puzzleRouter);

// Export the main app handler for Vercel
module.exports = app;