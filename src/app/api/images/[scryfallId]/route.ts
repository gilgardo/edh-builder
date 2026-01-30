/**
 * Image Proxy API Route
 *
 * Returns card image URLs with caching to R2.
 * Redirects to cached R2 URL or Scryfall fallback.
 *
 * Query parameters:
 * - size: 'small' | 'normal' | 'large' (default: 'normal')
 * - face: 'front' | 'back' (default: 'front')
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getCardImageUrl,
  type ImageSize,
  type ImageFace,
} from '@/services/image-cache';

interface RouteParams {
  params: Promise<{ scryfallId: string }>;
}

const VALID_SIZES: ImageSize[] = ['small', 'normal', 'large'];
const VALID_FACES: ImageFace[] = ['front', 'back'];

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { scryfallId } = await params;
    const searchParams = request.nextUrl.searchParams;

    // Parse and validate query parameters
    const sizeParam = searchParams.get('size') || 'normal';
    const faceParam = searchParams.get('face') || 'front';

    // Validate size parameter
    if (!VALID_SIZES.includes(sizeParam as ImageSize)) {
      return NextResponse.json(
        {
          error: 'Invalid size parameter',
          validSizes: VALID_SIZES,
        },
        { status: 400 }
      );
    }

    // Validate face parameter
    if (!VALID_FACES.includes(faceParam as ImageFace)) {
      return NextResponse.json(
        {
          error: 'Invalid face parameter',
          validFaces: VALID_FACES,
        },
        { status: 400 }
      );
    }

    const size = sizeParam as ImageSize;
    const face = faceParam as ImageFace;

    // Get image URL (cached or from Scryfall)
    const imageUrl = await getCardImageUrl(scryfallId, size, face);

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Card or image not found' },
        { status: 404 }
      );
    }

    // Redirect to the image URL
    // Using 302 (temporary) redirect so clients can benefit from any future URL changes
    return NextResponse.redirect(imageUrl, 302);
  } catch (error) {
    console.error('Image proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to get image' },
      { status: 500 }
    );
  }
}

/**
 * HEAD request - check if image exists without fetching
 */
export async function HEAD(request: NextRequest, { params }: RouteParams) {
  try {
    const { scryfallId } = await params;
    const searchParams = request.nextUrl.searchParams;

    const sizeParam = (searchParams.get('size') || 'normal') as ImageSize;
    const faceParam = (searchParams.get('face') || 'front') as ImageFace;

    if (!VALID_SIZES.includes(sizeParam) || !VALID_FACES.includes(faceParam)) {
      return new NextResponse(null, { status: 400 });
    }

    const imageUrl = await getCardImageUrl(scryfallId, sizeParam, faceParam);

    if (!imageUrl) {
      return new NextResponse(null, { status: 404 });
    }

    return new NextResponse(null, {
      status: 200,
      headers: {
        'X-Image-URL': imageUrl,
      },
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
