import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Optional depending on your DB
});

export default {
  query: (text, params) => pool.query(text, params),
};
