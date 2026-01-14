import type { ScryfallCard } from './scryfall.types';

/**
 * Unified card display type - use this for all UI components
 * Normalizes Scryfall snake_case to camelCase
 */
export interface DisplayCard {
  id: string;
  name: string;
  typeLine: string;
  manaCost: string | null;
  cmc: number;
  imageUris: unknown;
}

/**
 * Card stored in a deck with quantity and category
 */
export interface DeckCard {
  category: string;
  quantity: number;
  card: DisplayCard;
}

/**
 * Commander card data
 */
export interface Commander {
  name: string;
  typeLine: string;
  manaCost: string | null;
  imageUris: unknown;
}

/**
 * Normalize a Scryfall card to the unified DisplayCard format
 */
export function toDisplayCard(card: ScryfallCard): DisplayCard {
  return {
    id: card.id,
    name: card.name,
    typeLine: card.type_line,
    manaCost: card.mana_cost ?? null,
    cmc: card.cmc,
    imageUris: card.image_uris ?? card.card_faces?.[0]?.image_uris ?? null,
  };
}
