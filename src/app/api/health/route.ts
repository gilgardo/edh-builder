import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isR2Configured, getBucketName, getPublicBaseUrl } from '@/lib/r2-client';
import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';

async function checkR2(): Promise<{ status: string; bucket?: string; publicUrl?: string; error?: string }> {
  if (!isR2Configured()) {
    return { status: 'not_configured' };
  }

  const bucket = getBucketName();
  const publicUrl = getPublicBaseUrl();

  try {
    const endpoint = process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    const client = new S3Client({
      region: 'auto',
      endpoint,
      forcePathStyle: !!process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
    await client.send(new HeadBucketCommand({ Bucket: bucket! }));
    return { status: 'connected', bucket, publicUrl };
  } catch (error) {
    return {
      status: 'error',
      bucket,
      publicUrl,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function GET() {
  const [dbResult, r2Result] = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`,
    checkR2(),
  ]);

  const database = dbResult.status === 'fulfilled' ? 'connected' : 'disconnected';
  const r2 = r2Result.status === 'fulfilled' ? r2Result.value : { status: 'error', error: String(r2Result.reason) };
  const healthy = database === 'connected';

  return NextResponse.json(
    {
      status: healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: { database, r2 },
    },
    { status: healthy ? 200 : 503 }
  );
}
