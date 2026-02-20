/**
 * Image Cache Service
 *
 * Handles caching of card images to Cloudflare R2.
 * Falls back to Scryfall URLs when R2 is not configured.
 */

import { after } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadToR2, getCardImageKey } from '@/lib/r2-client';
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
function getScryfallImageUrl(card: PrismaCard, size: ImageSize, face: ImageFace): string | null {
  const imageUris =
    face === 'back'
      ? (card.backFaceImageUris as Record<string, string> | null)
      : (card.imageUris as Record<string, string> | null);

  if (!imageUris) {
    return null;
  }

  return imageUris[size] ?? null;
}

async function cacheToR2(
  scryfallUrl: string,
  scryfallId: string,
  cacheField: string | symbol | number,
  face: ImageFace,
  size: ImageSize
): Promise<string | null> {
  try {
    const imageBuffer = await fetchImageWithTimeout(scryfallUrl);
    const r2Key = getCardImageKey(scryfallId, size, face);
    const publicUrl = await uploadToR2(r2Key, imageBuffer, 'image/jpeg');

    if (!publicUrl) return null;

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
    return null;
  }
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

  after(() => cacheToR2(scryfallUrl, scryfallId, cacheField, face, size));

  return scryfallUrl;
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
          const card = await getCard(id);
          if (!card) return;

          const cacheField = getCachedImageField(size, 'front');
          const cachedUrl = card[cacheField] as string | null;

          if (cachedUrl) {
            results.set(id, cachedUrl);
            return;
          }

          const scryfallUrl = getScryfallImageUrl(card, size, 'front');
          if (!scryfallUrl) return;

          const r2Url = await cacheToR2(scryfallUrl, id, cacheField, 'front', size);
          results.set(id, r2Url ?? scryfallUrl);
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
          const card = await getCard(id);
          if (!card) return;

          const frontField = getCachedImageField(size, 'front');
          const cachedFront = card[frontField] as string | null;
          const frontScryfallUrl = getScryfallImageUrl(card, size, 'front');
          if (!frontScryfallUrl) return;

          const frontUrl = cachedFront
            ?? await cacheToR2(frontScryfallUrl, id, frontField, 'front', size)
            ?? frontScryfallUrl;

          const result: { front: string; back?: string } = { front: frontUrl };

          const cardMeta = cardMap.get(id);
          if (cardMeta?.hasBackFace) {
            const backField = getCachedImageField(size, 'back');
            const cachedBack = card[backField] as string | null;
            const backScryfallUrl = getScryfallImageUrl(card, size, 'back');

            if (backScryfallUrl) {
              result.back = cachedBack
                ?? await cacheToR2(backScryfallUrl, id, backField, 'back', size)
                ?? backScryfallUrl;
            }
          }

          results.set(id, result);
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
    results.set(card.scryfallId, !!card[field as keyof typeof card]);
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
