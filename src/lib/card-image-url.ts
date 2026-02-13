/**
 * Unified card image URL resolver
 *
 * Single source of truth for resolving card image URLs.
 * Checks R2 cached URLs first, falls back to Scryfall imageUris.
 *
 * Works with any card shape: Prisma Card, DisplayCard, ScryfallCard,
 * Commander, PreviewableCard, or DeckListItem commander.
 */

import type { ScryfallCard } from '@/types/scryfall.types';

type ImageSize = 'small' | 'normal' | 'large' | 'art_crop' | 'png';

/**
 * Minimal shape that any card-like object satisfies.
 * Uses `unknown` for image URI fields and casts at access time,
 * since ScryfallImageUris and Prisma's JsonValue have incompatible index signatures.
 */
interface CardLike {
  // Scryfall raw fields (snake_case) - typed as unknown to accept ScryfallImageUris
  image_uris?: unknown;
  card_faces?: Array<{ image_uris?: unknown }> | null;

  // DisplayCard / Prisma fields (camelCase)
  imageUris?: unknown;

  // R2 cached URLs (Prisma Card fields)
  cachedImageSmall?: string | null;
  cachedImageNormal?: string | null;
  cachedImageLarge?: string | null;
}

/**
 * Resolve the best available image URL for a card.
 *
 * Priority:
 * 1. R2 cached URL (cachedImageSmall/Normal/Large)
 * 2. imageUris (camelCase - DisplayCard / Prisma)
 * 3. image_uris (snake_case - ScryfallCard)
 * 4. card_faces[0].image_uris (double-faced ScryfallCard)
 * 5. null
 */
export function getCardImageUrl(
  card: CardLike | null | undefined,
  size: ImageSize = 'normal'
): string | null {
  if (!card) return null;

  // 1. Check R2 cached URLs (only for small/normal/large)
  const cachedUrl = getCachedUrl(card, size);
  if (cachedUrl) return cachedUrl;

  // 2. Check camelCase imageUris (DisplayCard / Prisma Card)
  if (card.imageUris) {
    const uris = card.imageUris as Record<string, string> | null;
    if (uris) {
      const url = uris[size] ?? uris.normal;
      if (url) return url;
    }
  }

  // 3. Check snake_case image_uris (ScryfallCard)
  if (card.image_uris) {
    const uris = card.image_uris as Record<string, string>;
    const url = uris[size] ?? uris.normal;
    if (url) return url;
  }

  // 4. Check card_faces for DFCs (ScryfallCard)
  if (card.card_faces?.[0]?.image_uris) {
    const faceUris = card.card_faces[0].image_uris as Record<string, string>;
    const url = faceUris[size] ?? faceUris.normal;
    if (url) return url;
  }

  return null;
}

/**
 * Get R2 cached URL for a given size.
 * Maps art_crop and png to their closest cached equivalent.
 */
function getCachedUrl(card: CardLike, size: ImageSize): string | null {
  switch (size) {
    case 'small':
      return card.cachedImageSmall ?? null;
    case 'normal':
      return card.cachedImageNormal ?? null;
    case 'large':
    case 'png':
      return card.cachedImageLarge ?? null;
    case 'art_crop':
      // art_crop is never cached in R2
      return null;
    default:
      return null;
  }
}

/**
 * Resolve image URL from a ScryfallCard specifically.
 * Convenience wrapper with the correct type signature for components
 * that only deal with raw Scryfall data.
 */
export function getScryfallCardImageUrl(
  card: ScryfallCard,
  size: ImageSize = 'normal'
): string {
  return getCardImageUrl(card, size) ?? 'https://cards.scryfall.io/normal/back.jpg';
}
