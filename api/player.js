import { DeleteObjectCommand, ListObjectsV2Command, PutObjectCommand } from '@aws-sdk/client-s3';
import db from "../db";
import { BUCKET, avatarUrl, s3 } from "../s3";

const MAX_AVATAR_BYTES = 1024 * 1024;
const DATA_URL_PREFIX = 'data:image/jpeg;base64,';

const avatarPrefix = (name) => `avatars/${encodeURIComponent(name)}/`;

// Removes every stored avatar for `name` except `keepKey`, including any orphaned by earlier failed deletes.
async function deleteOtherAvatars(name, keepKey) {
    let ContinuationToken;
    do {
        const page = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: avatarPrefix(name), ContinuationToken }));
        const stale = (page.Contents ?? []).map((obj) => obj.Key).filter((key) => key !== keepKey);
        await Promise.all(stale.map((Key) => s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key }))));
        ContinuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
    } while (ContinuationToken);
}

export default async function handler(req, res) {
    if (req.method === "GET") {
        const name = typeof req.query.name === 'string' ? req.query.name.trim() : '';
        if (!name) {
            return res.status(400).json({ error: 'Missing name.' });
        }
        try {
            const { rows } = await db.query('SELECT avatar_updated_at FROM players WHERE name = $1', [name]);
            res.status(200).json({ name, avatar_url: avatarUrl(name, rows[0]?.avatar_updated_at) });
        } catch (err) {
            console.error(`Error fetching player ${name}:`, err);
            res.status(500).json({ error: 'Error fetching player' });
        }
    } else if (req.method === "POST") {
        const { name: rawName, image } = req.body ?? {};
        const name = typeof rawName === 'string' ? rawName.trim() : '';
        if (!name || typeof image !== 'string' || !image.startsWith(DATA_URL_PREFIX)) {
            return res.status(400).json({ error: 'Invalid or missing name or JPEG image.' });
        }
        const body = Buffer.from(image.slice(DATA_URL_PREFIX.length), 'base64');
        if (body.length === 0 || body.length > MAX_AVATAR_BYTES) {
            return res.status(400).json({ error: 'Image must be under 1 MB.' });
        }

        try {
            const key = `${avatarPrefix(name)}${Date.now()}.jpg`;
            await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: 'image/jpeg' }));

            const { rows: [player] } = await db.query(`
                INSERT INTO players (name, avatar_key, avatar_updated_at)
                VALUES ($1, $2, NOW())
                ON CONFLICT (name)
                DO UPDATE SET avatar_key = EXCLUDED.avatar_key, avatar_updated_at = EXCLUDED.avatar_updated_at
                RETURNING avatar_updated_at
            `, [name, key]);

            // Only after the DB points at the new key, so a failure here never leaves a player without a photo.
            // Awaited because serverless functions may be frozen once the response is sent.
            await deleteOtherAvatars(name, key)
                .catch((err) => console.error(`Error deleting old avatars for ${name}:`, err));
            res.status(201).json({ name, avatar_url: avatarUrl(name, player.avatar_updated_at) });
        } catch (err) {
            console.error(`Error saving avatar for ${name}:`, err);
            res.status(500).json({ error: 'Error saving avatar' });
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
