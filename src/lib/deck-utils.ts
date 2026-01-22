/**
 * Deck utility functions for card grouping, mana curve calculation, and filtering.
 * Centralizes logic that was duplicated across page components.
 */

import type { DeckCard, DisplayCard } from '@/types/cards';

/**
 * Card type display order - controls how card groups are sorted
 */
export const CARD_TYPE_ORDER = [
  'Creatures',
  'Instants',
  'Sorceries',
  'Artifacts',
  'Enchantments',
  'Planeswalkers',
  'Lands',
  'Other',
] as const;

export type CardType = (typeof CARD_TYPE_ORDER)[number];

/**
 * Determines the display type for a card based on its type line
 */
export function getCardType(typeLine: string): CardType {
  const lowerTypeLine = typeLine.toLowerCase();

  if (lowerTypeLine.includes('creature')) return 'Creatures';
  if (lowerTypeLine.includes('instant')) return 'Instants';
  if (lowerTypeLine.includes('sorcery')) return 'Sorceries';
  if (lowerTypeLine.includes('artifact')) return 'Artifacts';
  if (lowerTypeLine.includes('enchantment')) return 'Enchantments';
  if (lowerTypeLine.includes('planeswalker')) return 'Planeswalkers';
  if (lowerTypeLine.includes('land')) return 'Lands';

  return 'Other';
}

interface GroupableCard {
  category: string;
  quantity: number;
  card: {
    typeLine: string;
    name: string;
    manaCost?: string | null;
    cmc: number;
  };
}

interface GroupCardsByTypeOptions {
  excludeCategory?: string;
  sortBy?: 'name' | 'cmc';
}

/**
 * Groups cards by their MTG type (Creatures, Instants, etc.)
 * Optionally excludes cards from a specific category (e.g., CONSIDERING)
 */
export function groupCardsByType<T extends GroupableCard>(
  cards: T[] | undefined,
  options: GroupCardsByTypeOptions = {}
): Record<CardType, T[]> {
  const { excludeCategory, sortBy = 'cmc' } = options;
  const groups: Partial<Record<CardType, T[]>> = {};

  if (!cards) return {} as Record<CardType, T[]>;

  for (const deckCard of cards) {
    if (excludeCategory && deckCard.category === excludeCategory) continue;

    const type = getCardType(deckCard.card.typeLine);
    (groups[type] ??= []).push(deckCard);
  }

  const sortedGroups: Record<CardType, T[]> = {} as Record<CardType, T[]>;

  for (const type of CARD_TYPE_ORDER) {
    const group = groups[type];
    if (group && group.length > 0) {
      sortedGroups[type] = group.sort((a, b) =>
        sortBy === 'name'
          ? a.card.name.localeCompare(b.card.name)
          : a.card.cmc - b.card.cmc
      );
    }
  }

  return sortedGroups;
}

/**
 * Filters cards to get only those in the CONSIDERING category
 */
export function getConsideringCards(cards: DeckCard[] | undefined): DeckCard[] {
  if (!cards) return [];
  return cards
    .filter((card) => card.category === 'CONSIDERING')
    .sort((a, b) => a.card.name.localeCompare(b.card.name));
}

interface ManaCurveCard {
  quantity: number;
  card: {
    cmc: number;
    typeLine: string;
  };
}

/**
 * Calculates mana curve data from a list of cards
 * Excludes lands from the calculation
 */
export function calculateManaCurve(
  cards: ManaCurveCard[] | undefined
): Record<string, number> {
  const curve: Record<string, number> = {};

  if (!cards) return curve;

  for (const deckCard of cards) {
    // Skip lands for mana curve
    if (deckCard.card.typeLine.toLowerCase().includes('land')) continue;

    const cmc = Math.min(Math.floor(deckCard.card.cmc), 7);
    const key = cmc === 7 ? '7+' : String(cmc);
    curve[key] = (curve[key] || 0) + deckCard.quantity;
  }

  return curve;
}

/**
 * Calculates total card count, optionally excluding a category
 */
export function calculateTotalCards(
  cards: Array<{ quantity: number; category?: string }> | undefined,
  excludeCategory?: string
): number {
  if (!cards) return 0;

  return cards
    .filter((c) => !excludeCategory || c.category !== excludeCategory)
    .reduce((acc, c) => acc + c.quantity, 0);
}

/**
 * Gets the image URIs for a card, handling various formats
 */
export function getDisplayCardImageUrl(
  card: DisplayCard | null,
  size: 'small' | 'normal' | 'large' | 'art_crop' = 'normal'
): string | null {
  if (!card) return null;

  const imageUris = card.imageUris as Record<string, string> | null;
  return imageUris?.[size] ?? imageUris?.normal ?? null;
}
