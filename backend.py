import os
import asyncpg
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import uvicorn

load_dotenv()
DATABASE_URL = os.getenv("DB_URL")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LeaderboardEntry(BaseModel):
    name: str
    puzzle_date: str  # ISO date string
    time_taken: int


class LeaderboardPost(BaseModel):
    name: str
    time_taken: int
    puzzle_date: str


async def get_db():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        yield conn
    finally:
        await conn.close()


@app.get("/puzzle/{date}")
async def get_puzzle(date: str, db=Depends(get_db)):
    try:
        result = await db.fetchrow(
            "SELECT puzzle_data FROM puzzles WHERE puzzle_date = $1", date
        )
        if not result:
            raise HTTPException(status_code=404, detail=f"Puzzle for date {date} not found.")
        return result["puzzle_data"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/leaderboard")
async def get_leaderboard(db=Depends(get_db)):
    try:
        rows = await db.fetch(
            "SELECT name, time_taken, puzzle_date FROM leaderboard ORDER BY time_taken ASC"
        )
        return [dict(row) for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/leaderboard")
async def post_leaderboard(entry: LeaderboardPost, db=Depends(get_db)):
    try:
        await db.execute(
            """
            INSERT INTO leaderboard (name, puzzle_date, time_taken)
            VALUES ($1, $2, $3)
            ON CONFLICT (name, puzzle_date) DO UPDATE SET time_taken = EXCLUDED.time_taken
            """,
            entry.name, entry.puzzle_date, entry.time_taken
        )
        return {"message": "Leaderboard score added successfully!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)