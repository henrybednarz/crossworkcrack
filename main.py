import requests
import json
from dotenv import load_dotenv
import os

API = "https://www.nytimes.com/svc/crosswords/v6/puzzle/mini/2025-09-22.json"
load_dotenv()
cookie = os.getenv("NYT_COOKIE")

def fetch_puzzle(api_url):
    headers = {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15',
        'Referer': 'https://www.nytimes.com/crosswords/game/mini',  # Still good practice to keep this
        'Cookie': cookie
    }
    req = requests.get(api_url, headers=headers)
    data = req.json()
    return data


import json


def process_puzzle_data(api_data):
    """
    Processes raw crossword API data into a structured format for a frontend.

    Args:
        api_data (dict): The raw JSON data fetched from the crossword API.

    Returns:
        dict: A dictionary containing the structured grid and clues.
    """
    # The main puzzle data is nested inside the 'body' list
    puzzle = api_data['body'][0]

    # --- 1. Process the Grid ---
    width = puzzle['dimensions']['width']
    height = puzzle['dimensions']['height']
    flat_cells = puzzle['cells']

    grid = []
    for i in range(height):
        row = []
        for j in range(width):
            # Calculate the index in the flat list
            index = i * width + j
            cell_data = flat_cells[index]

            # An empty dictionary {} signifies a black (unplayable) cell
            if not cell_data:
                formatted_cell = {
                    "isBlack": True,
                    "answer": None,
                    "number": None
                }
            else:
                formatted_cell = {
                    "isBlack": False,
                    # Use .get() to safely access keys that might be missing
                    "answer": cell_data.get("answer"),
                    "number": cell_data.get("label")
                }
            row.append(formatted_cell)
        grid.append(row)

    # --- 2. Process the Clues ---
    clues = {
        "across": [],
        "down": []
    }

    for clue_data in puzzle['clues']:
        formatted_clue = {
            "number": clue_data.get("label"),
            # The clue text is nested; we extract the plain string
            "clue": clue_data['text'][0].get("plain")
        }

        direction = clue_data.get("direction", "").lower()
        if direction in clues:
            clues[direction].append(formatted_clue)

    return {
        "grid": grid,
        "clues": clues
    }


if __name__ == "__main__":
    raw_data = fetch_puzzle(API)
    processed_data = process_puzzle_data(raw_data)
    print(json.dumps(processed_data, indent=2))

