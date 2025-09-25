const express = require('express');
const fs = require('fs'); // Node's built-in file system module
const cors = require('cors'); // To allow requests from your frontend

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Enable the express server to parse JSON in request bodies

const DB_FILE = './db.json';

// Helper function to read from our JSON database
const readDB = () => {
  const dbData = fs.readFileSync(DB_FILE, 'utf-8');
  return JSON.parse(dbData);
};

// Helper function to write to our JSON database
const writeDB = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

app.get('/puzzle/:date', (req, res) => {
  const { date } = req.params; // Get the date from the URL parameter
  console.log(`GET /puzzle request received for date: ${date}`);

  if (!/^\d{8}$/.test(date)) {
    return res.status(400).json({ message: 'Invalid date format. Please use mmddyyyy.' });
  }

  try {
    const db = readDB();
    const puzzle = db.puzzles[date]; // Look up the puzzle using the date as the key

    if (puzzle) {
      res.json(puzzle);
    } else {
      // If no puzzle is found for that date, send a 404 Not Found error
      res.status(404).json({ message: `Puzzle for date ${date} not found.` });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching puzzle' });
  }
});



app.get('/leaderboard', (req, res) => {
  console.log('GET /leaderboard request received');
  try {
    const db = readDB();
    const sortedLeaderboard = db.leaderboard.sort((a, b) => a.time - b.time);
    res.json(sortedLeaderboard);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leaderboard' });
  }
});


app.post('/leaderboard', (req, res) => {
  console.log('POST /leaderboard request received with body:', req.body);
  try {
    const { username, time } = req.body;

    if (!username || typeof time !== 'number') {
      return res.status(400).json({ message: 'Invalid input. "username" (string) and "time" (number) are required.' });
    }

    const db = readDB();
    db.leaderboard.push({ username, time });
    writeDB(db); // Save the updated data back to the file

    res.status(201).json({ message: 'Leaderboard score added successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Error saving score' });
  }
});


// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});