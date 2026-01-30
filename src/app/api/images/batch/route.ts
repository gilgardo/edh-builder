/**
 * Batch Image Caching API Route
 *
 * Batch cache images for multiple cards and return URLs.
 * Used by PDF generation to cache images server-side.
 *
 * POST body:
 * - scryfallIds: string[] - Array of Scryfall card IDs
 * - size: 'small' | 'normal' | 'large' (default: 'large')
 * - includeBackFaces: boolean (default: true)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  batchCacheImages,
  batchCacheImagesWithBackFaces,
  type ImageSize,
} from '@/services/image-cache';
import { z } from 'zod';

const VALID_SIZES: ImageSize[] = ['small', 'normal', 'large'];

const BatchRequestSchema = z.object({
  scryfallIds: z.array(z.string()).min(1).max(500),
  size: z.enum(['small', 'normal', 'large']).default('large'),
  includeBackFaces: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = BatchRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: parsed.error.issues,
          validSizes: VALID_SIZES,
        },
        { status: 400 }
      );
    }

    const { scryfallIds, size, includeBackFaces } = parsed.data;

    if (includeBackFaces) {
      // Get front and back faces
      const results = await batchCacheImagesWithBackFaces(scryfallIds, size);

      // Convert Map to serializable object
      const images: Record<string, { front: string; back?: string }> = {};
      for (const [id, urls] of results) {
        images[id] = urls;
      }

      return NextResponse.json({ images });
    } else {
      // Get front faces only
      const results = await batchCacheImages(scryfallIds, size);

      // Convert Map to serializable object
      const images: Record<string, string> = {};
      for (const [id, url] of results) {
        images[id] = url;
      }

      return NextResponse.json({ images });
    }
  } catch (error) {
    console.error('Batch image caching error:', error);
    return NextResponse.json(
      { error: 'Failed to cache images' },
      { status: 500 }
    );
  }
}
