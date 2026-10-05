import { GetObjectCommand } from '@aws-sdk/client-s3';
import db from "../db";
import { BUCKET, s3 } from "../s3";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const name = typeof req.query.name === 'string' ? req.query.name.trim() : '';
    if (!name) {
        return res.status(400).json({ error: 'Missing name.' });
    }

    try {
        const { rows: [player] } = await db.query('SELECT avatar_key FROM players WHERE name = $1', [name]);
        if (!player?.avatar_key) {
            return res.status(404).json({ error: 'No avatar.' });
        }
        const object = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: player.avatar_key }));
        const bytes = Buffer.from(await object.Body.transformToByteArray());
        res.setHeader('Content-Type', object.ContentType || 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
        res.status(200).send(bytes);
    } catch (err) {
        console.error(`Error fetching avatar for ${name}:`, err);
        res.status(500).json({ error: 'Error fetching avatar' });
    }
}
