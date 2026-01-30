/**
 * Cloudflare R2 Client
 *
 * R2 is S3-compatible, so we use the AWS SDK with R2 endpoint configuration.
 * Used for caching card images to avoid Scryfall rate limits.
 */

import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

// Environment variables (required for R2 functionality)
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

/**
 * Check if R2 is configured
 */
export function isR2Configured(): boolean {
  return !!(
    R2_ACCOUNT_ID &&
    R2_ACCESS_KEY_ID &&
    R2_SECRET_ACCESS_KEY &&
    R2_BUCKET_NAME &&
    R2_PUBLIC_URL
  );
}

/**
 * Get the R2 client instance
 * Returns null if R2 is not configured
 */
function getR2Client(): S3Client | null {
  if (!isR2Configured()) {
    return null;
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID!,
      secretAccessKey: R2_SECRET_ACCESS_KEY!,
    },
  });
}

// Lazy-initialized client
let r2Client: S3Client | null | undefined;

function getClient(): S3Client | null {
  if (r2Client === undefined) {
    r2Client = getR2Client();
  }
  return r2Client;
}

/**
 * Upload a file to R2
 *
 * @param key - The object key (path) in the bucket
 * @param body - The file content as Buffer or ArrayBuffer
 * @param contentType - MIME type of the content
 * @returns The public URL of the uploaded file, or null if R2 is not configured
 */
export async function uploadToR2(
  key: string,
  body: Buffer | ArrayBuffer | Uint8Array,
  contentType: string
): Promise<string | null> {
  const client = getClient();
  if (!client) {
    console.warn('R2 is not configured, skipping upload');
    return null;
  }

  // Convert to Uint8Array for consistent handling
  const bodyBuffer =
    body instanceof Buffer
      ? body
      : body instanceof Uint8Array
        ? body
        : new Uint8Array(body);

  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME!,
      Key: key,
      Body: bodyBuffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable', // 1 year cache
    })
  );

  return getR2PublicUrl(key);
}

/**
 * Check if an object exists in R2
 *
 * @param key - The object key to check
 * @returns true if exists, false otherwise
 */
export async function existsInR2(key: string): Promise<boolean> {
  const client = getClient();
  if (!client) {
    return false;
  }

  try {
    await client.send(
      new HeadObjectCommand({
        Bucket: R2_BUCKET_NAME!,
        Key: key,
      })
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Delete an object from R2
 *
 * @param key - The object key to delete
 */
export async function deleteFromR2(key: string): Promise<void> {
  const client = getClient();
  if (!client) {
    return;
  }

  await client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME!,
      Key: key,
    })
  );
}

/**
 * Get the public URL for an R2 object
 *
 * @param key - The object key
 * @returns The public URL, or null if R2 is not configured
 */
export function getR2PublicUrl(key: string): string | null {
  if (!R2_PUBLIC_URL) {
    return null;
  }
  // Ensure no double slashes
  const baseUrl = R2_PUBLIC_URL.endsWith('/') ? R2_PUBLIC_URL.slice(0, -1) : R2_PUBLIC_URL;
  return `${baseUrl}/${key}`;
}

/**
 * Get the R2 key for a card image
 *
 * @param scryfallId - The Scryfall card ID
 * @param size - Image size (small, normal, large)
 * @param face - Image face (front, back for DFCs)
 * @returns The R2 object key
 */
export function getCardImageKey(
  scryfallId: string,
  size: 'small' | 'normal' | 'large',
  face: 'front' | 'back' = 'front'
): string {
  const folder = face === 'back' ? 'cards-back' : 'cards';
  return `${folder}/${size}/${scryfallId}.jpg`;
}

/**
 * Bucket name getter (for external use if needed)
 */
export function getBucketName(): string | undefined {
  return R2_BUCKET_NAME;
}

/**
 * Public URL getter (for external use if needed)
 */
export function getPublicBaseUrl(): string | undefined {
  return R2_PUBLIC_URL;
}
