const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DB_URL,
});

// Export a single query function to be used throughout the application.
module.exports = {
  query: (text, params) => pool.query(text, params),
};