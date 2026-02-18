/**
 * Scryfall API Response Types
 * Based on: https://scryfall.com/docs/api
 */

export interface ScryfallCard {
  id: string;
  oracle_id: string;
  name: string;
  mana_cost?: string;
  cmc: number;
  type_line: string;
  oracle_text?: string;
  colors?: string[];
  color_identity: string[];
  power?: string;
  toughness?: string;
  loyalty?: string;
  legalities: ScryfallLegalities;
  image_uris?: ScryfallImageUris;
  card_faces?: ScryfallCardFace[];
  set: string;
  set_name: string;
  rarity: string;
  prices: ScryfallPrices;
  keywords?: string[];
  artist?: string;
  released_at?: string;
  uri: string;
  scryfall_uri: string;
  layout: string;
}

export interface ScryfallCardFace {
  name: string;
  mana_cost?: string;
  type_line: string;
  oracle_text?: string;
  colors?: string[];
  power?: string;
  toughness?: string;
  loyalty?: string;
  image_uris?: ScryfallImageUris;
}

export interface ScryfallImageUris {
  small: string;
  normal: string;
  large: string;
  png: string;
  art_crop: string;
  border_crop: string;
}

export interface ScryfallLegalities {
  standard: string;
  future: string;
  historic: string;
  gladiator: string;
  pioneer: string;
  explorer: string;
  modern: string;
  legacy: string;
  pauper: string;
  vintage: string;
  penny: string;
  commander: string;
  oathbreaker: string;
  brawl: string;
  alchemy: string;
  paupercommander: string;
  duel: string;
  oldschool: string;
  premodern: string;
  predh: string;
}

export interface ScryfallPrices {
  usd?: string;
  usd_foil?: string;
  usd_etched?: string;
  eur?: string;
  eur_foil?: string;
  tix?: string;
}

/**
 * ScryfallCard enriched with R2 cached image URLs from the database.
 * The extra fields are optional so it's a strict superset of ScryfallCard.
 */
export type EnrichedScryfallCard = ScryfallCard & {
  cachedImageSmall: string | null;
  cachedImageNormal: string | null;
  cachedImageLarge: string | null;
};

export interface ScryfallSearchResponse {
  object: 'list';
  total_cards: number;
  has_more: boolean;
  next_page?: string;
  data: ScryfallCard[];
}

export interface ScryfallAutocompleteResponse {
  object: 'catalog';
  total_values: number;
  data: string[];
}

export interface ScryfallError {
  object: 'error';
  code: string;
  status: number;
  details: string;
}

export type ScryfallResponse<T> = T | ScryfallError;

/**
 * Check if a Scryfall response is an error
 */
export function isScryfallError(response: unknown): response is ScryfallError {
  return (
    typeof response === 'object' &&
    response !== null &&
    'object' in response &&
    (response as ScryfallError).object === 'error'
  );
}

/**
 * Check if a card is legal in Commander format
 */
export function isLegalCommander(card: ScryfallCard): boolean {
  return (
    card.legalities.commander === 'legal' &&
    card.type_line.includes('Legendary') &&
    (card.type_line.includes('Creature') ||
      (card.type_line.includes('Planeswalker') &&
        (card.oracle_text?.includes('can be your commander') ?? false)))
  );
}

/**
 * Basic land names that can have unlimited copies in Commander
 */
const BASIC_LAND_NAMES = [
  'Plains',
  'Island',
  'Swamp',
  'Mountain',
  'Forest',
  'Wastes', // Colorless basic land
];

/**
 * Check if a card is a basic land (can have unlimited copies in Commander)
 */
export function isBasicLand(card: { name: string; typeLine: string } | ScryfallCard): boolean {
  // Handle both our internal Card type (typeLine) and ScryfallCard (type_line)
  const typeLine = 'type_line' in card ? card.type_line : card.typeLine;

  // Check if it's a Basic Land type
  if (!typeLine.toLowerCase().includes('basic') || !typeLine.toLowerCase().includes('land')) {
    return false;
  }

  // Also verify it's one of the standard basic lands
  return BASIC_LAND_NAMES.some((basicName) => card.name.includes(basicName));
}
