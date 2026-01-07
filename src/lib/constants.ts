/**
 * MTG Color Constants
 */
export const MTG_COLORS = {
  W: { name: 'White', symbol: 'W', hex: '#f8f6d8' },
  U: { name: 'Blue', symbol: 'U', hex: '#0e68ab' },
  B: { name: 'Black', symbol: 'B', hex: '#150b00' },
  R: { name: 'Red', symbol: 'R', hex: '#d3202a' },
  G: { name: 'Green', symbol: 'G', hex: '#00733e' },
  C: { name: 'Colorless', symbol: 'C', hex: '#8b8b8b' },
} as const;

export type MtgColor = keyof typeof MTG_COLORS;

/**
 * Color Identity Order (WUBRG)
 */
export const COLOR_ORDER: MtgColor[] = ['W', 'U', 'B', 'R', 'G'];

/**
 * Guild Names (two-color combinations)
 */
export const GUILDS = {
  WU: 'Azorius',
  UB: 'Dimir',
  BR: 'Rakdos',
  RG: 'Gruul',
  GW: 'Selesnya',
  WB: 'Orzhov',
  UR: 'Izzet',
  BG: 'Golgari',
  RW: 'Boros',
  GU: 'Simic',
} as const;

/**
 * Deck Format Constants
 */
export const DECK_FORMATS = {
  COMMANDER: {
    name: 'Commander',
    deckSize: 100,
    sideboardSize: 0,
    maxCopies: 1,
    requiresCommander: true,
  },
  BRAWL: {
    name: 'Brawl',
    deckSize: 60,
    sideboardSize: 0,
    maxCopies: 1,
    requiresCommander: true,
  },
  OATHBREAKER: {
    name: 'Oathbreaker',
    deckSize: 60,
    sideboardSize: 0,
    maxCopies: 1,
    requiresCommander: true,
  },
} as const;

export type DeckFormat = keyof typeof DECK_FORMATS;

/**
 * Card Rarity Order
 */
export const RARITY_ORDER = ['common', 'uncommon', 'rare', 'mythic', 'special', 'bonus'] as const;

export type CardRarity = (typeof RARITY_ORDER)[number];

/**
 * Scryfall API Constants
 */
export const SCRYFALL = {
  API_BASE: 'https://api.scryfall.com',
  RATE_LIMIT_MS: 100, // 10 requests per second
  IMAGE_CDN: 'https://cards.scryfall.io',
} as const;

/**
 * Pagination Constants
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

/**
 * App Metadata
 */
export const APP_CONFIG = {
  name: 'EDH Builder',
  description: 'Build, share, and discover Magic: The Gathering Commander (EDH) decks',
  url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
} as const;
