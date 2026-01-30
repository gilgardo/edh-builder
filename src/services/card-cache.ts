/**
 * Card Cache Service
 *
 * Provides cache-first access to card data, storing metadata in PostgreSQL
 * and falling back to Scryfall API when cache is missing or stale.
 */

import { prisma } from '@/lib/prisma';
import {
  getCard as fetchFromScryfall,
  getCardsByIds as fetchBatchFromScryfall,
  getCardByName as fetchByNameFromScryfall,
} from './scryfall';
import type { Card as PrismaCard, Prisma } from '@prisma/client';
import type { ScryfallCard } from '@/types/scryfall.types';

/**
 * Cache configuration
 */
export const CACHE_CONFIG = {
  /** Cards older than this are considered stale and will be refreshed */
  staleAfterDays: 30,
  /** Maximum cards per Scryfall batch request */
  maxBatchSize: 75,
} as const;

/**
 * Double-faced card layouts that have a back face with its own image
 */
const DFC_LAYOUTS = [
  'transform',
  'modal_dfc',
  'reversible_card',
  'double_faced_token',
] as const;

/**
 * Check if a cached card is stale and needs refreshing
 */
export function isCardStale(card: PrismaCard): boolean {
  const staleThresholdMs = CACHE_CONFIG.staleAfterDays * 24 * 60 * 60 * 1000;
  return Date.now() - card.cachedAt.getTime() > staleThresholdMs;
}

/**
 * Check if a timestamp is stale
 */
export function isTimestampStale(timestamp: Date | number): boolean {
  const staleThresholdMs = CACHE_CONFIG.staleAfterDays * 24 * 60 * 60 * 1000;
  const time = typeof timestamp === 'number' ? timestamp : timestamp.getTime();
  return Date.now() - time > staleThresholdMs;
}

/**
 * Map a Scryfall card response to Prisma card create/update data
 */
export function mapScryfallToCard(
  scryfall: ScryfallCard
): Omit<Prisma.CardCreateInput, 'deckCards' | 'commanderOf' | 'partnerOf'> {
  const isDfc = DFC_LAYOUTS.includes(scryfall.layout as (typeof DFC_LAYOUTS)[number]);
  const hasTwoFaces = isDfc && (scryfall.card_faces?.length ?? 0) > 1;

  // Get image URIs - either from top-level or from first card face
  const frontImageUris = scryfall.image_uris ?? scryfall.card_faces?.[0]?.image_uris ?? null;
  const backImageUris = hasTwoFaces ? scryfall.card_faces?.[1]?.image_uris ?? null : null;

  // Determine if card can be a commander
  const isLegalCommander =
    scryfall.legalities.commander === 'legal' &&
    scryfall.type_line.includes('Legendary') &&
    (scryfall.type_line.includes('Creature') ||
      (scryfall.type_line.includes('Planeswalker') &&
        (scryfall.oracle_text?.includes('can be your commander') ?? false)));

  return {
    scryfallId: scryfall.id,
    oracleId: scryfall.oracle_id,
    name: scryfall.name,
    manaCost: scryfall.mana_cost ?? scryfall.card_faces?.[0]?.mana_cost ?? null,
    cmc: scryfall.cmc,
    typeLine: scryfall.type_line,
    oracleText: scryfall.oracle_text ?? scryfall.card_faces?.[0]?.oracle_text ?? null,
    colors: scryfall.colors?.join(',') ?? scryfall.card_faces?.[0]?.colors?.join(',') ?? null,
    colorIdentity: scryfall.color_identity?.join(',') ?? null,
    power: scryfall.power ?? scryfall.card_faces?.[0]?.power ?? null,
    toughness: scryfall.toughness ?? scryfall.card_faces?.[0]?.toughness ?? null,
    loyalty: scryfall.loyalty ?? scryfall.card_faces?.[0]?.loyalty ?? null,
    isLegalCommander,
    imageUris: (frontImageUris ?? undefined) as Prisma.InputJsonValue | undefined,
    priceUsd: scryfall.prices.usd ? parseFloat(scryfall.prices.usd) : null,
    priceTix: scryfall.prices.tix ? parseFloat(scryfall.prices.tix) : null,
    setCode: scryfall.set,
    setName: scryfall.set_name,
    rarity: normalizeRarity(scryfall.rarity),
    cachedAt: new Date(),
    // DFC fields
    hasBackFace: hasTwoFaces,
    backFaceImageUris: (backImageUris ?? undefined) as Prisma.InputJsonValue | undefined,
  };
}

/**
 * Normalize Scryfall rarity to our enum values
 */
function normalizeRarity(
  rarity: string
): 'common' | 'uncommon' | 'rare' | 'mythic' | 'special' | 'bonus' {
  const rarityMap: Record<string, 'common' | 'uncommon' | 'rare' | 'mythic' | 'special' | 'bonus'> =
    {
      common: 'common',
      uncommon: 'uncommon',
      rare: 'rare',
      mythic: 'mythic',
      special: 'special',
      bonus: 'bonus',
    };
  return rarityMap[rarity] ?? 'common';
}

/**
 * Get a card by Scryfall ID, using cache when available
 *
 * @param scryfallId - The Scryfall card ID
 * @param forceRefresh - If true, always fetch from Scryfall even if cached
 * @returns The card data, or null if not found
 */
export async function getCard(
  scryfallId: string,
  forceRefresh = false
): Promise<PrismaCard | null> {
  // 1. Check PostgreSQL cache (unless forcing refresh)
  if (!forceRefresh) {
    const cached = await prisma.card.findUnique({
      where: { scryfallId },
    });

    // If exists and fresh, return cached
    if (cached && !isCardStale(cached)) {
      return cached;
    }

    // If stale, try to refresh but fall back to stale data on failure
    if (cached) {
      const refreshed = await refreshCardFromScryfall(scryfallId, cached);
      return refreshed ?? cached;
    }
  }

  // 2. Not in cache or forcing refresh - fetch from Scryfall
  return refreshCardFromScryfall(scryfallId, null);
}

/**
 * Get a card by name, using cache when available
 *
 * @param name - The card name (exact or fuzzy match)
 * @param fuzzy - If true, use fuzzy matching
 * @returns The card data, or null if not found
 */
export async function getCardByName(name: string, fuzzy = false): Promise<PrismaCard | null> {
  // 1. Try exact match in cache first (only for exact searches)
  if (!fuzzy) {
    const cached = await prisma.card.findFirst({
      where: { name },
    });

    if (cached && !isCardStale(cached)) {
      return cached;
    }
  }

  // 2. Fetch from Scryfall
  const scryfallCard = await fetchByNameFromScryfall(name, fuzzy);
  if (!scryfallCard) {
    return null;
  }

  // 3. Upsert to cache
  return upsertCardFromScryfall(scryfallCard);
}

/**
 * Get multiple cards by Scryfall IDs, using cache when available
 *
 * @param scryfallIds - Array of Scryfall card IDs
 * @returns Array of card data (order not guaranteed to match input)
 */
export async function getCardsByIds(scryfallIds: string[]): Promise<PrismaCard[]> {
  if (scryfallIds.length === 0) return [];

  // 1. Check PostgreSQL cache for all IDs
  const cached = await prisma.card.findMany({
    where: { scryfallId: { in: scryfallIds } },
  });

  // 2. Separate fresh and stale/missing
  const cachedMap = new Map(cached.map((c) => [c.scryfallId, c]));
  const freshCards: PrismaCard[] = [];
  const staleOrMissingIds: string[] = [];
  const staleCards = new Map<string, PrismaCard>();

  for (const id of scryfallIds) {
    const card = cachedMap.get(id);
    if (card && !isCardStale(card)) {
      freshCards.push(card);
    } else {
      staleOrMissingIds.push(id);
      if (card) {
        staleCards.set(id, card);
      }
    }
  }

  // 3. If all fresh, return
  if (staleOrMissingIds.length === 0) {
    return freshCards;
  }

  // 4. Fetch missing/stale from Scryfall in batches
  const scryfallCards = await fetchBatchFromScryfall(staleOrMissingIds);

  // 5. Upsert fetched cards
  const upsertedCards: PrismaCard[] = [];
  for (const [, scryfallCard] of scryfallCards) {
    const upserted = await upsertCardFromScryfall(scryfallCard);
    upsertedCards.push(upserted);
  }

  // 6. For IDs that Scryfall didn't return, use stale cache if available
  const fetchedIds = new Set(Array.from(scryfallCards.keys()));
  for (const id of staleOrMissingIds) {
    if (!fetchedIds.has(id)) {
      const stale = staleCards.get(id);
      if (stale) {
        freshCards.push(stale); // Use stale data as fallback
      }
    }
  }

  return [...freshCards, ...upsertedCards];
}

/**
 * Get cards by IDs, returning a Map for easy lookup
 */
export async function getCardsByIdsMap(scryfallIds: string[]): Promise<Map<string, PrismaCard>> {
  const cards = await getCardsByIds(scryfallIds);
  return new Map(cards.map((c) => [c.scryfallId, c]));
}

/**
 * Force refresh a card from Scryfall
 */
export async function refreshCard(scryfallId: string): Promise<PrismaCard | null> {
  return refreshCardFromScryfall(scryfallId, null);
}

/**
 * Internal: Refresh a card from Scryfall and update cache
 */
async function refreshCardFromScryfall(
  scryfallId: string,
  fallback: PrismaCard | null
): Promise<PrismaCard | null> {
  try {
    const scryfallCard = await fetchFromScryfall(scryfallId);
    if (!scryfallCard) {
      return fallback;
    }
    return upsertCardFromScryfall(scryfallCard);
  } catch (error) {
    console.error(`Failed to refresh card ${scryfallId}:`, error);
    return fallback;
  }
}

/**
 * Internal: Upsert a Scryfall card to the database
 */
async function upsertCardFromScryfall(scryfallCard: ScryfallCard): Promise<PrismaCard> {
  const cardData = mapScryfallToCard(scryfallCard);

  return prisma.card.upsert({
    where: { scryfallId: scryfallCard.id },
    create: cardData,
    update: {
      ...cardData,
      cachedAt: new Date(),
      // Preserve existing cached image URLs
      cachedImageSmall: undefined,
      cachedImageNormal: undefined,
      cachedImageLarge: undefined,
      cachedBackImageSmall: undefined,
      cachedBackImageNormal: undefined,
      cachedBackImageLarge: undefined,
      imageCachedAt: undefined,
    },
  });
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalCards: number;
  freshCards: number;
  staleCards: number;
  cardsWithCachedImages: number;
}> {
  const staleThreshold = new Date(
    Date.now() - CACHE_CONFIG.staleAfterDays * 24 * 60 * 60 * 1000
  );

  const [totalCards, freshCards, cardsWithCachedImages] = await Promise.all([
    prisma.card.count(),
    prisma.card.count({ where: { cachedAt: { gte: staleThreshold } } }),
    prisma.card.count({ where: { imageCachedAt: { not: null } } }),
  ]);

  return {
    totalCards,
    freshCards,
    staleCards: totalCards - freshCards,
    cardsWithCachedImages,
  };
}

/**
 * Find stale cards that need refreshing
 */
export async function findStaleCards(limit = 100): Promise<PrismaCard[]> {
  const staleThreshold = new Date(
    Date.now() - CACHE_CONFIG.staleAfterDays * 24 * 60 * 60 * 1000
  );

  return prisma.card.findMany({
    where: { cachedAt: { lt: staleThreshold } },
    orderBy: { cachedAt: 'asc' },
    take: limit,
  });
}

/**
 * Batch refresh stale cards
 * Useful for background jobs
 */
export async function refreshStaleCards(limit = 100): Promise<number> {
  const staleCards = await findStaleCards(limit);
  if (staleCards.length === 0) return 0;

  const scryfallIds = staleCards.map((c) => c.scryfallId);
  const refreshed = await fetchBatchFromScryfall(scryfallIds);

  let updatedCount = 0;
  for (const [, scryfallCard] of refreshed) {
    await upsertCardFromScryfall(scryfallCard);
    updatedCount++;
  }

  return updatedCount;
}
