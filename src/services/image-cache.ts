/**
 * Image Cache Service
 *
 * Handles caching of card images to Cloudflare R2.
 * Falls back to Scryfall URLs when R2 is not configured.
 */

import { prisma } from '@/lib/prisma';
import {
  uploadToR2,
  getCardImageKey,
  isR2Configured,
} from '@/lib/r2-client';
import { getCard } from './card-cache';
import type { Card as PrismaCard } from '@prisma/client';
import pLimit from 'p-limit';

export type ImageSize = 'small' | 'normal' | 'large';
export type ImageFace = 'front' | 'back';

/** Timeout for fetching images from Scryfall */
const IMAGE_FETCH_TIMEOUT_MS = 15000;

/** Maximum concurrent image uploads to R2 */
const MAX_CONCURRENT_UPLOADS = 3;

/**
 * Get the database field name for a cached image URL
 */
function getCachedImageField(size: ImageSize, face: ImageFace): keyof PrismaCard {
  const sizeCapitalized = size.charAt(0).toUpperCase() + size.slice(1);
  return (
    face === 'back' ? `cachedBackImage${sizeCapitalized}` : `cachedImage${sizeCapitalized}`
  ) as keyof PrismaCard;
}

/**
 * Fetch an image with timeout
 */
async function fetchImageWithTimeout(url: string): Promise<ArrayBuffer> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), IMAGE_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    return response.arrayBuffer();
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

/**
 * Get Scryfall image URL from card data
 */
function getScryfallImageUrl(
  card: PrismaCard,
  size: ImageSize,
  face: ImageFace
): string | null {
  const imageUris =
    face === 'back'
      ? (card.backFaceImageUris as Record<string, string> | null)
      : (card.imageUris as Record<string, string> | null);

  if (!imageUris) {
    return null;
  }

  return imageUris[size] ?? null;
}

/**
 * Get a card image URL, caching to R2 if configured
 *
 * @param scryfallId - The Scryfall card ID
 * @param size - Image size (small, normal, large)
 * @param face - Image face (front, back for DFCs)
 * @returns The image URL (R2 cached or Scryfall fallback), or null if not found
 */
export async function getCardImageUrl(
  scryfallId: string,
  size: ImageSize = 'normal',
  face: ImageFace = 'front'
): Promise<string | null> {
  // 1. Get card from cache
  const card = await getCard(scryfallId);
  if (!card) return null;

  // 2. Check if already cached in R2
  const cacheField = getCachedImageField(size, face);
  const cachedUrl = card[cacheField] as string | null;

  if (cachedUrl) {
    return cachedUrl;
  }

  // 3. Get Scryfall image URL
  const scryfallUrl = getScryfallImageUrl(card, size, face);
  if (!scryfallUrl) {
    return null;
  }

  // 4. If R2 not configured, return Scryfall URL directly
  if (!isR2Configured()) {
    return scryfallUrl;
  }

  // 5. Fetch from Scryfall and upload to R2
  try {
    const imageBuffer = await fetchImageWithTimeout(scryfallUrl);
    const r2Key = getCardImageKey(scryfallId, size, face);
    const publicUrl = await uploadToR2(r2Key, imageBuffer, 'image/jpeg');

    if (!publicUrl) {
      // R2 upload failed, return Scryfall URL
      return scryfallUrl;
    }

    // 6. Update database with cached URL
    await prisma.card.update({
      where: { scryfallId },
      data: {
        [cacheField]: publicUrl,
        imageCachedAt: new Date(),
      },
    });

    return publicUrl;
  } catch (error) {
    console.error(`Failed to cache image for ${scryfallId}:`, error);
    // Return Scryfall URL as fallback
    return scryfallUrl;
  }
}

/**
 * Get a card image URL without caching (direct Scryfall or existing cache)
 * Useful for quick lookups that shouldn't trigger background caching
 */
export async function getCardImageUrlFast(
  scryfallId: string,
  size: ImageSize = 'normal',
  face: ImageFace = 'front'
): Promise<string | null> {
  const card = await getCard(scryfallId);
  if (!card) return null;

  // Check for cached URL first
  const cacheField = getCachedImageField(size, face);
  const cachedUrl = card[cacheField] as string | null;
  if (cachedUrl) {
    return cachedUrl;
  }

  // Return Scryfall URL
  return getScryfallImageUrl(card, size, face);
}

/**
 * Progress callback for batch operations
 */
export type BatchProgressCallback = (current: number, total: number) => void;

/**
 * Batch cache images for multiple cards
 * Useful for PDF generation or preloading
 *
 * @param scryfallIds - Array of Scryfall card IDs
 * @param size - Image size to cache
 * @param onProgress - Optional progress callback
 * @returns Map of scryfallId to image URL
 */
export async function batchCacheImages(
  scryfallIds: string[],
  size: ImageSize = 'large',
  onProgress?: BatchProgressCallback
): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  if (scryfallIds.length === 0) return results;

  const limit = pLimit(MAX_CONCURRENT_UPLOADS);
  let completed = 0;
  const total = scryfallIds.length;

  await Promise.all(
    scryfallIds.map((id) =>
      limit(async () => {
        try {
          const url = await getCardImageUrl(id, size, 'front');
          if (url) {
            results.set(id, url);
          }
        } catch (error) {
          console.error(`Failed to cache image for ${id}:`, error);
        }
        completed++;
        onProgress?.(completed, total);
      })
    )
  );

  return results;
}

/**
 * Batch cache images including back faces for DFCs
 */
export async function batchCacheImagesWithBackFaces(
  scryfallIds: string[],
  size: ImageSize = 'large',
  onProgress?: BatchProgressCallback
): Promise<Map<string, { front: string; back?: string }>> {
  const results = new Map<string, { front: string; back?: string }>();
  if (scryfallIds.length === 0) return results;

  // First get all cards to check which have back faces
  const cards = await prisma.card.findMany({
    where: { scryfallId: { in: scryfallIds } },
    select: { scryfallId: true, hasBackFace: true },
  });

  const cardMap = new Map(cards.map((c) => [c.scryfallId, c]));
  const limit = pLimit(MAX_CONCURRENT_UPLOADS);
  let completed = 0;
  const total = scryfallIds.length;

  await Promise.all(
    scryfallIds.map((id) =>
      limit(async () => {
        try {
          const frontUrl = await getCardImageUrl(id, size, 'front');
          if (frontUrl) {
            const card = cardMap.get(id);
            const result: { front: string; back?: string } = { front: frontUrl };

            if (card?.hasBackFace) {
              const backUrl = await getCardImageUrl(id, size, 'back');
              if (backUrl) {
                result.back = backUrl;
              }
            }

            results.set(id, result);
          }
        } catch (error) {
          console.error(`Failed to cache images for ${id}:`, error);
        }
        completed++;
        onProgress?.(completed, total);
      })
    )
  );

  return results;
}

/**
 * Check if images are cached for given cards
 *
 * @param scryfallIds - Array of Scryfall card IDs
 * @param size - Image size to check
 * @returns Map of scryfallId to cache status
 */
export async function areImagesCached(
  scryfallIds: string[],
  size: ImageSize = 'normal'
): Promise<Map<string, boolean>> {
  const field = getCachedImageField(size, 'front');

  const cards = await prisma.card.findMany({
    where: { scryfallId: { in: scryfallIds } },
    select: {
      scryfallId: true,
      cachedImageSmall: true,
      cachedImageNormal: true,
      cachedImageLarge: true,
    },
  });

  const results = new Map<string, boolean>();

  for (const card of cards) {
    results.set(card.scryfallId, !!(card[field as keyof typeof card]));
  }

  // Mark missing cards as not cached
  for (const id of scryfallIds) {
    if (!results.has(id)) {
      results.set(id, false);
    }
  }

  return results;
}

/**
 * Get image cache statistics
 */
export async function getImageCacheStats(): Promise<{
  totalCards: number;
  cardsWithSmallCached: number;
  cardsWithNormalCached: number;
  cardsWithLargeCached: number;
  cardsWithAnyCached: number;
}> {
  const [
    totalCards,
    cardsWithSmallCached,
    cardsWithNormalCached,
    cardsWithLargeCached,
    cardsWithAnyCached,
  ] = await Promise.all([
    prisma.card.count(),
    prisma.card.count({ where: { cachedImageSmall: { not: null } } }),
    prisma.card.count({ where: { cachedImageNormal: { not: null } } }),
    prisma.card.count({ where: { cachedImageLarge: { not: null } } }),
    prisma.card.count({ where: { imageCachedAt: { not: null } } }),
  ]);

  return {
    totalCards,
    cardsWithSmallCached,
    cardsWithNormalCached,
    cardsWithLargeCached,
    cardsWithAnyCached,
  };
}

/**
 * Clear cached image URLs for a card (doesn't delete from R2)
 * Useful if images need to be re-cached
 */
export async function clearCachedImageUrls(scryfallId: string): Promise<void> {
  await prisma.card.update({
    where: { scryfallId },
    data: {
      cachedImageSmall: null,
      cachedImageNormal: null,
      cachedImageLarge: null,
      cachedBackImageSmall: null,
      cachedBackImageNormal: null,
      cachedBackImageLarge: null,
      imageCachedAt: null,
    },
  });
}

/**
 * Pre-cache images for cards that don't have cached images yet
 * Useful for background jobs
 */
export async function preCacheImages(
  limit: number = 100,
  size: ImageSize = 'normal'
): Promise<number> {
  const field = getCachedImageField(size, 'front');

  // Find cards without cached images
  const cards = await prisma.card.findMany({
    where: { [field]: null },
    take: limit,
    select: { scryfallId: true },
  });

  if (cards.length === 0) return 0;

  const cached = await batchCacheImages(
    cards.map((c) => c.scryfallId),
    size
  );

  return cached.size;
}
