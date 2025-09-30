import db from "../db";

export default async function handler(req, res) {
    // const authHeader = req.headers['authorization'];
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //     return res.status(401).end('Unauthorized');
    // }
    const dateString = new Date().toLocaleDateString('en-CA');
    try {

        const crossword_request = await fetch(`https://www.nytimes.com/svc/crosswords/v6/puzzle/mini/${dateString}.json`, {
            method: "GET",
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15',
                'Referer': 'https://www.nytimes.com/crosswords/game/mini',
                'Cookie': 'NYT-S=0^CB0SMQi6p7q8BhDotM3GBhoSMS0aaZRb5EXXDJPM3frt7ptEIIjWiWwqAh5DOI-95qwGQgAaQIQhnarSerGUdMIgPUmRmMoc3uaBTI5EsPWT2rY-Y6h3ojv6rbLDm63Y023_Pzl3PUXEGN75B3BbfljXpDj3SAI'
            }
        });

        if (!crossword_request.ok) {
            return res.status(500).json({ message: 'Error fetching daily puzzle' });
        }

        const rawPuzzleData = await crossword_request.json();
        const puzzleData = JSON.stringify(processPuzzleData(rawPuzzleData));
        console.log(puzzleData)
        const query = `
            INSERT INTO puzzles (puzzle_date, puzzle_data)
            VALUES ($1, $2)
            ON CONFLICT (puzzle_date) DO NOTHING;
        `;
        const values = [dateString, puzzleData];
        const dbResult = await db.query(query, values);

        if (dbResult.rowCount > 0) {
            console.log(`Successfully inserted puzzle for ${dateString}`);
            res.status(200).json({ message: 'Daily puzzle fetched and saved' });
        } else {
            console.log(`Puzzle for ${dateString} already exists.`);
            res.status(200).json({ message: 'Puzzle already exists' });
        }

    } catch (error) {
        console.error('An error occurred:', error);
        res.status(500).json({ message: 'An internal server error occurred.' });
    }
}

const processPuzzleData = (apiData) => {
  const puzzle = apiData.body[0];
  const { width, height } = puzzle.dimensions;
  const flatCells = puzzle.cells;

  const grid = Array.from({ length: height }, (_, i) =>
    Array.from({ length: width }, (_, j) => {
      const cellData = flatCells[i * width + j];
      console.log(Object.keys(cellData).length)
      if (Object.keys(cellData).length !== 0) {
        return {
          'isBlack': false,
          'answer': cellData.answer || null,
          'number': cellData.label || null,
        };
      } else {
        return {
          'isBlack': true,
          'answer': null,
          'number': null,
        };
      }
    })
  );

  const clues = { across: [], down: [] };

  for (const clueData of puzzle.clues) {
    const direction = (clueData.direction || "").toLowerCase();

    if (direction in clues) {
      clues[direction].push({
        number: clueData.label || null,
        clue: clueData?.text?.[0]?.plain || null,
      });
    }
  }

  return { grid, clues };
};