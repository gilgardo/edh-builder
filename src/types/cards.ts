import type { ScryfallCard } from './scryfall.types';

/**
 * Image URIs for a card (subset of Scryfall's format)
 * Using unknown for compatibility with Prisma's JsonValue
 */
export type CardImageUris = {
  small?: string;
  normal?: string;
  large?: string;
} | null;

/**
 * Unified card display type - use this for all UI components
 * Normalizes Scryfall snake_case to camelCase
 */
export interface DisplayCard {
  id: string;
  scryfallId?: string;
  name: string;
  typeLine: string;
  manaCost: string | null;
  cmc: number;
  imageUris: unknown;
  oracleId?: string | null;
  setCode?: string;
  setName?: string;
}

/**
 * Card stored in a deck with quantity and category
 */
export interface DeckCard {
  category: string;
  quantity: number;
  card: DisplayCard;
  cardId: string;
}

/**
 * Commander card data
 */
export interface Commander {
  name: string;
  typeLine: string;
  manaCost: string | null;
  oracleText?: string | null;
  imageUris: unknown;
}

/**
 * A card that can be previewed (has name and image)
 */
export interface PreviewableCard {
  name: string;
  imageUris: unknown;
}

/**
 * Get the image URL from a card's imageUris
 */
export function getDisplayCardImageUrl(
  card: PreviewableCard | null | undefined,
  size: 'small' | 'normal' | 'large' = 'normal'
): string | null {
  if (!card?.imageUris) return null;
  const uris = card.imageUris as CardImageUris;
  if (!uris) return null;
  return uris[size] ?? null;
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
    oracleId: card.oracle_id,
    setCode: card.set,
    setName: card.set_name,
  };
}
