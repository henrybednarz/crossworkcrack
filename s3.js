import { S3Client } from '@aws-sdk/client-s3';

export const BUCKET = process.env.S3_BUCKET ?? 'users';

export const s3 = new S3Client({
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  region: process.env.AWS_REGION,
  forcePathStyle: true,
});

// `v` changes on every upload, so each URL can be cached forever.
export function avatarUrl(name, updatedAt) {
  if (!updatedAt) return null;
  const version = new Date(updatedAt).getTime();
  return `/api/avatar?name=${encodeURIComponent(name)}&v=${version}`;
}
