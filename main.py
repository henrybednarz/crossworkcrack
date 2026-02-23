import requests
import json
from dotenv import load_dotenv
import os
import psycopg2

API_URL = "https://www.nytimes.com/svc/crosswords/v6/puzzle/mini/2026-02-23.json"
load_dotenv()
NYT_COOKIE = os.getenv("NYT_COOKIE_2")
DATABASE_URL = os.getenv("DATABASE_URL")


def fetch_puzzle(api_url):
    """Fetches raw puzzle data from the NYT API."""
    if not NYT_COOKIE:
        raise ValueError("NYT_COOKIE not found in environment variables.")

    headers = {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15',
        'Referer': 'https://www.nytimes.com/crosswords/game/mini',
        'Cookie': NYT_COOKIE
    }

    try:
        req = requests.get(api_url, headers=headers, timeout=10)
        req.raise_for_status()  # Raises an HTTPError for bad responses (4xx or 5xx)
        return req.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data: {e}")
        return None


def process_puzzle_data(api_data):
    """Processes the raw API data into a structured format."""
    puzzle = api_data['body'][0]
    width = puzzle['dimensions']['width']
    height = puzzle['dimensions']['height']
    flat_cells = puzzle['cells']

    grid = [
        [
            {
                "isBlack": False,
                "answer": flat_cells[i * width + j].get("answer"),
                "number": flat_cells[i * width + j].get("label")
            } if flat_cells[i * width + j] else {
                "isBlack": True, "answer": None, "number": None
            }
            for j in range(width)
        ]
        for i in range(height)
    ]

    clues = {"across": [], "down": []}
    for clue_data in puzzle['clues']:
        direction = clue_data.get("direction", "").lower()
        if direction in clues:
            clues[direction].append({
                "number": clue_data.get("label"),
                "clue": clue_data['text'][0].get("plain")
            })

    return {"grid": grid, "clues": clues}


# --- Database Functions ---

def create_puzzles_table(conn):
    """Creates the 'puzzles' table if it does not already exist."""
    with conn.cursor() as cur:
        cur.execute("""
        CREATE TABLE IF NOT EXISTS puzzles(
                id SERIAL PRIMARY KEY,
                puzzle_date TEXT NOT NULL UNIQUE,
                puzzle_data JSONB NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );""")
        conn.commit()
        print("Table 'puzzles' is ready.")

def create_leaderboard_table(conn):
    """Creates the 'leaderboard' table if it does not already exist."""
    with conn.cursor() as cur:
        cur.execute("""
        CREATE TABLE IF NOT EXISTS leaderboard(
                id SERIAL PRIMARY KEY,
                name VARCHAR(50) NOT NULL,
                puzzle_date TEXT NOT NULL,
                time_taken INTEGER NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(name, puzzle_date)
        );""")
        conn.commit()
        print("Table 'leaderboard' is ready.")

def insert_puzzle_data(conn, puzzle_date, data):
    """Inserts puzzle data for a specific date, avoiding duplicates."""
    # Convert the Python dictionary to a JSON string for insertion
    json_data = json.dumps(data)

    with conn.cursor() as cur:
        # Check if a puzzle for this date already exists
        cur.execute("SELECT id FROM puzzles WHERE puzzle_date = %s;", (puzzle_date,))
        if cur.fetchone():
            print(f"Puzzle for {puzzle_date} already exists in the database. Skipping.")
            return

        # If it doesn't exist, insert the new puzzle
        cur.execute(
            "INSERT INTO puzzles (puzzle_date, puzzle_data) VALUES (%s, %s);",
            (puzzle_date, json_data)
        )
        conn.commit()
        print(f"Successfully inserted puzzle for {puzzle_date}.")


# --- Main Execution ---

if __name__ == "__main__":
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL not found in environment variables.")

    conn = None
    try:
        # --- 1. Connect to the database ---
        print("Connecting to the database...")
        conn = psycopg2.connect(DATABASE_URL)

        # --- 2. Ensure table exists ---
        create_puzzles_table(conn)
        create_leaderboard_table(conn)

        # --- 3. Fetch and process puzzle ---
        print(f"Fetching puzzle from {API_URL}...")
        raw_data = fetch_puzzle(API_URL)

        if raw_data:
            processed_data = process_puzzle_data(raw_data)
            print(processed_data)

            # Extract date from the API URL string
            puzzle_date = API_URL.split('/')[-1].split('.')[0]

            # --- 4. Insert data into the database ---
            insert_puzzle_data(conn, puzzle_date, processed_data)

    except psycopg2.Error as e:
        print(f"Database error: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
    finally:
        # --- 5. Close the database connection ---
        if conn:
            conn.close()
            print("Database connection closed.")