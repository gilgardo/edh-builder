'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { BasicLands } from '@/schemas/import.schema';
import type { ScryfallCard } from '@/types/scryfall.types';
import type { CardCategory } from '@/schemas/deck.schema';

// ============================================
// Constants
// ============================================

/**
 * Basic land definitions with color mapping
 */
export const BASIC_LANDS = {
  W: { name: 'Plains', key: 'plains' as const },
  U: { name: 'Island', key: 'island' as const },
  B: { name: 'Swamp', key: 'swamp' as const },
  R: { name: 'Mountain', key: 'mountain' as const },
  G: { name: 'Forest', key: 'forest' as const },
} as const;

/**
 * Wastes (colorless basic land)
 */
export const WASTES = { name: 'Wastes', key: 'wastes' as const };

type ColorIdentity = 'W' | 'U' | 'B' | 'R' | 'G';
type BasicLandKey = (typeof BASIC_LANDS)[ColorIdentity]['key'] | typeof WASTES.key;

// ============================================
// Types
// ============================================

interface BasicLandCard {
  name: string;
  key: BasicLandKey;
  color?: ColorIdentity;
  scryfallCard?: ScryfallCard;
}

interface AddBasicLandsData {
  deckId: string;
  lands: BasicLands;
  landCards: Map<BasicLandKey, ScryfallCard>;
}

// ============================================
// API Functions
// ============================================

/**
 * Fetch basic land cards from Scryfall
 */
async function fetchBasicLands(colorIdentity: ColorIdentity[]): Promise<BasicLandCard[]> {
  const lands: BasicLandCard[] = [];

  // Get lands for the commander's color identity
  for (const color of colorIdentity) {
    const landInfo = BASIC_LANDS[color];
    if (landInfo) {
      lands.push({
        name: landInfo.name,
        key: landInfo.key,
        color,
      });
    }
  }

  // Always include Wastes as an option (for colorless mana)
  lands.push({
    name: WASTES.name,
    key: WASTES.key,
  });

  // Fetch actual card data from Scryfall
  const landNames = lands.map((l) => l.name);
  const uniqueNames = [...new Set(landNames)];

  try {
    const response = await fetch('https://api.scryfall.com/cards/collection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'EDH-Builder/1.0',
      },
      body: JSON.stringify({
        identifiers: uniqueNames.map((name) => ({ name })),
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const cardMap = new Map<string, ScryfallCard>();

      for (const card of data.data) {
        cardMap.set(card.name.toLowerCase(), card);
      }

      // Attach Scryfall card data
      return lands.map((land) => ({
        ...land,
        scryfallCard: cardMap.get(land.name.toLowerCase()),
      }));
    }
  } catch {
    // Return lands without Scryfall data on error
  }

  return lands;
}

/**
 * Add basic lands to a deck
 */
async function addBasicLandsToDeck({ deckId, lands, landCards }: AddBasicLandsData) {
  const errors: Array<{ name: string; error: string }> = [];
  let added = 0;

  const entries = Object.entries(lands) as Array<[BasicLandKey, number]>;

  for (const [key, quantity] of entries) {
    if (quantity <= 0) continue;

    const scryfallCard = landCards.get(key);
    if (!scryfallCard) {
      errors.push({ name: key, error: 'Card data not available' });
      continue;
    }

    try {
      const response = await fetch(`/api/decks/${deckId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scryfallCard,
          quantity,
          category: 'MAIN' as CardCategory,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        errors.push({ name: scryfallCard.name, error: error.error ?? 'Failed to add' });
      } else {
        added++;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      errors.push({ name: scryfallCard.name, error: message });
    }

    // Rate limit
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return { added, errors };
}

// ============================================
// Hooks
// ============================================

/**
 * Hook to fetch basic land cards for a given color identity
 */
export function useBasicLands(colorIdentity: ColorIdentity[]) {
  return useQuery({
    queryKey: ['basic-lands', colorIdentity.sort().join('')],
    queryFn: () => fetchBasicLands(colorIdentity),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - basic lands don't change
    enabled: colorIdentity.length > 0 || true, // Always enable for Wastes
  });
}

/**
 * Hook to add basic lands to a deck
 */
export function useAddBasicLands() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addBasicLandsToDeck,
    onSuccess: (_, { deckId }) => {
      queryClient.invalidateQueries({ queryKey: ['deck', deckId] });
      queryClient.invalidateQueries({ queryKey: ['decks'] });
    },
  });
}

// ============================================
// Utility Functions
// ============================================

/**
 * Get default basic land quantities based on color identity
 * Distributes evenly among available colors
 */
export function getDefaultLandQuantities(
  colorIdentity: ColorIdentity[],
  totalLands: number = 36
): BasicLands {
  const defaults: BasicLands = {
    plains: 0,
    island: 0,
    swamp: 0,
    mountain: 0,
    forest: 0,
    wastes: 0,
  };

  if (colorIdentity.length === 0) {
    // Colorless commander - use Wastes
    defaults.wastes = totalLands;
    return defaults;
  }

  // Distribute evenly among colors
  const perColor = Math.floor(totalLands / colorIdentity.length);
  const remainder = totalLands % colorIdentity.length;

  colorIdentity.forEach((color, index) => {
    const landInfo = BASIC_LANDS[color];
    if (landInfo) {
      defaults[landInfo.key] = perColor + (index < remainder ? 1 : 0);
    }
  });

  return defaults;
}

/**
 * Get total land count from quantities
 */
export function getTotalLandCount(lands: BasicLands): number {
  return (
    lands.plains + lands.island + lands.swamp + lands.mountain + lands.forest + lands.wastes
  );
}

/**
 * Get available basic lands for a color identity
 */
export function getAvailableLands(colorIdentity: ColorIdentity[]): BasicLandKey[] {
  const available: BasicLandKey[] = [];

  for (const color of colorIdentity) {
    const landInfo = BASIC_LANDS[color];
    if (landInfo) {
      available.push(landInfo.key);
    }
  }

  // Always include Wastes
  available.push('wastes');

  return available;
}
