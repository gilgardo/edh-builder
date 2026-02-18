import { describe, it, expect, vi, afterEach } from 'vitest';
import { getCardImageKey } from '@/lib/r2-client';

// Mock the AWS SDK so tests don't make real S3 calls
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(() => ({ send: vi.fn() })),
  PutObjectCommand: vi.fn((p: unknown) => p),
  HeadObjectCommand: vi.fn((p: unknown) => p),
  DeleteObjectCommand: vi.fn((p: unknown) => p),
}));

// ============================================================
// Pure function tests — no env vars required
// ============================================================

describe('getCardImageKey', () => {
  it('returns front face key for normal size (default face)', () => {
    expect(getCardImageKey('abc123', 'normal')).toBe('cards/normal/abc123.jpg');
  });

  it('returns front face key when face is explicitly front', () => {
    expect(getCardImageKey('abc123', 'normal', 'front')).toBe('cards/normal/abc123.jpg');
  });

  it('returns back face key when face is back', () => {
    expect(getCardImageKey('abc123', 'normal', 'back')).toBe('cards-back/normal/abc123.jpg');
  });

  it('handles small size', () => {
    expect(getCardImageKey('id1', 'small')).toBe('cards/small/id1.jpg');
  });

  it('handles large size', () => {
    expect(getCardImageKey('id1', 'large')).toBe('cards/large/id1.jpg');
  });

  it('handles back face with small size', () => {
    expect(getCardImageKey('dfc-card', 'small', 'back')).toBe('cards-back/small/dfc-card.jpg');
  });
});

// ============================================================
// Env-dependent tests — use vi.stubEnv + dynamic imports
// ============================================================

const BASE_REQUIRED_VARS: Record<string, string> = {
  R2_ACCESS_KEY_ID: 'test-access-key',
  R2_SECRET_ACCESS_KEY: 'test-secret-key',
  R2_BUCKET_NAME: 'test-bucket',
  R2_PUBLIC_URL: 'https://cdn.example.com',
};

function stubEnvVars(vars: Record<string, string>) {
  for (const [k, v] of Object.entries(vars)) {
    vi.stubEnv(k, v);
  }
}

describe('isR2Configured', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('returns true when R2_ENDPOINT is set without R2_ACCOUNT_ID (MinIO local dev)', async () => {
    vi.stubEnv('R2_ENDPOINT', 'http://minio:9000');
    stubEnvVars(BASE_REQUIRED_VARS);

    const { isR2Configured } = await import('@/lib/r2-client');
    expect(isR2Configured()).toBe(true);
  });

  it('returns true when R2_ACCOUNT_ID is set without R2_ENDPOINT (Cloudflare R2)', async () => {
    vi.stubEnv('R2_ACCOUNT_ID', 'my-cloudflare-account-id');
    stubEnvVars(BASE_REQUIRED_VARS);

    const { isR2Configured } = await import('@/lib/r2-client');
    expect(isR2Configured()).toBe(true);
  });

  it('returns true when both R2_ACCOUNT_ID and R2_ENDPOINT are set', async () => {
    vi.stubEnv('R2_ACCOUNT_ID', 'my-cloudflare-account-id');
    vi.stubEnv('R2_ENDPOINT', 'http://minio:9000');
    stubEnvVars(BASE_REQUIRED_VARS);

    const { isR2Configured } = await import('@/lib/r2-client');
    expect(isR2Configured()).toBe(true);
  });

  it('returns false when neither R2_ACCOUNT_ID nor R2_ENDPOINT is set', async () => {
    stubEnvVars(BASE_REQUIRED_VARS);
    // R2_ACCOUNT_ID and R2_ENDPOINT are both absent

    const { isR2Configured } = await import('@/lib/r2-client');
    expect(isR2Configured()).toBe(false);
  });

  it('returns false when R2_ACCESS_KEY_ID is missing', async () => {
    vi.stubEnv('R2_ACCOUNT_ID', 'my-account');
    vi.stubEnv('R2_SECRET_ACCESS_KEY', 'test-secret');
    vi.stubEnv('R2_BUCKET_NAME', 'test-bucket');
    vi.stubEnv('R2_PUBLIC_URL', 'https://cdn.example.com');
    // R2_ACCESS_KEY_ID intentionally not set

    const { isR2Configured } = await import('@/lib/r2-client');
    expect(isR2Configured()).toBe(false);
  });

  it('returns false when R2_BUCKET_NAME is missing', async () => {
    vi.stubEnv('R2_ACCOUNT_ID', 'my-account');
    vi.stubEnv('R2_ACCESS_KEY_ID', 'test-key');
    vi.stubEnv('R2_SECRET_ACCESS_KEY', 'test-secret');
    vi.stubEnv('R2_PUBLIC_URL', 'https://cdn.example.com');
    // R2_BUCKET_NAME intentionally not set

    const { isR2Configured } = await import('@/lib/r2-client');
    expect(isR2Configured()).toBe(false);
  });

  it('returns false when R2_PUBLIC_URL is missing', async () => {
    vi.stubEnv('R2_ACCOUNT_ID', 'my-account');
    vi.stubEnv('R2_ACCESS_KEY_ID', 'test-key');
    vi.stubEnv('R2_SECRET_ACCESS_KEY', 'test-secret');
    vi.stubEnv('R2_BUCKET_NAME', 'test-bucket');
    // R2_PUBLIC_URL intentionally not set

    const { isR2Configured } = await import('@/lib/r2-client');
    expect(isR2Configured()).toBe(false);
  });
});

describe('getR2PublicUrl', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('returns null when R2_PUBLIC_URL is not configured', async () => {
    const { getR2PublicUrl } = await import('@/lib/r2-client');
    expect(getR2PublicUrl('cards/normal/abc123.jpg')).toBeNull();
  });

  it('returns full URL with key appended', async () => {
    vi.stubEnv('R2_PUBLIC_URL', 'https://cdn.example.com');
    const { getR2PublicUrl } = await import('@/lib/r2-client');
    expect(getR2PublicUrl('cards/normal/abc123.jpg')).toBe(
      'https://cdn.example.com/cards/normal/abc123.jpg'
    );
  });

  it('strips trailing slash from base URL before appending key', async () => {
    vi.stubEnv('R2_PUBLIC_URL', 'https://cdn.example.com/');
    const { getR2PublicUrl } = await import('@/lib/r2-client');
    expect(getR2PublicUrl('cards/normal/abc123.jpg')).toBe(
      'https://cdn.example.com/cards/normal/abc123.jpg'
    );
  });
});

describe('uploadToR2', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('returns null and warns when R2 is not configured', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { uploadToR2 } = await import('@/lib/r2-client');
    const result = await uploadToR2('test/key.jpg', Buffer.from('img-data'), 'image/jpeg');

    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('not configured'));
    consoleSpy.mockRestore();
  });
});

describe('existsInR2', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('returns false when R2 is not configured', async () => {
    const { existsInR2 } = await import('@/lib/r2-client');
    expect(await existsInR2('cards/normal/abc123.jpg')).toBe(false);
  });
});

describe('deleteFromR2', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('resolves without error when R2 is not configured', async () => {
    const { deleteFromR2 } = await import('@/lib/r2-client');
    await expect(deleteFromR2('cards/normal/abc123.jpg')).resolves.toBeUndefined();
  });
});

// ============================================================
// Getter helpers
// ============================================================

describe('getBucketName', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('returns the bucket name when R2_BUCKET_NAME is set', async () => {
    vi.stubEnv('R2_BUCKET_NAME', 'my-images-bucket');
    const { getBucketName } = await import('@/lib/r2-client');
    expect(getBucketName()).toBe('my-images-bucket');
  });

  it('returns undefined when R2_BUCKET_NAME is not set', async () => {
    const { getBucketName } = await import('@/lib/r2-client');
    expect(getBucketName()).toBeUndefined();
  });
});

describe('getPublicBaseUrl', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('returns the public base URL when R2_PUBLIC_URL is set', async () => {
    vi.stubEnv('R2_PUBLIC_URL', 'https://cdn.mysite.com');
    const { getPublicBaseUrl } = await import('@/lib/r2-client');
    expect(getPublicBaseUrl()).toBe('https://cdn.mysite.com');
  });

  it('returns undefined when R2_PUBLIC_URL is not set', async () => {
    const { getPublicBaseUrl } = await import('@/lib/r2-client');
    expect(getPublicBaseUrl()).toBeUndefined();
  });
});
