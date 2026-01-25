import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names using clsx and tailwind-merge for proper Tailwind CSS class merging
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date to a human-readable string
 */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

/**
 * Format a number as currency (USD)
 */
export function formatPrice(price: number | string | null | undefined): string {
  if (price === null || price === undefined) {
    return 'N/A';
  }
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(numPrice);
}

/**
 * Parse MTG mana cost string to individual symbols
 * Example: "{2}{W}{U}" -> ["2", "W", "U"]
 */
export function parseManaSymbols(manaCost: string | null | undefined): string[] {
  if (!manaCost) return [];
  const matches = manaCost.match(/\{([^}]+)\}/g);
  if (!matches) return [];
  return matches.map((m) => m.slice(1, -1));
}

/**
 * Get color identity from mana symbols
 */
export function getColorIdentity(colors: string[] | null | undefined): string[] {
  if (!colors) return [];
  const validColors = ['W', 'U', 'B', 'R', 'G'];
  return colors.filter((c) => validColors.includes(c.toUpperCase())).map((c) => c.toUpperCase());
}

/**
 * Check if a deck is complete (has 100 cards for Commander)
 */
export function isDeckComplete(cardCount: number, format: string = 'COMMANDER'): boolean {
  switch (format) {
    case 'COMMANDER':
      return cardCount === 100;
    case 'BRAWL':
      return cardCount === 60;
    case 'OATHBREAKER':
      return cardCount === 60;
    default:
      return false;
  }
}

/**
 * Generate a slug from a string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * MTG Guild/Color combination names and gradient mappings
 */
const GUILD_MAP: Record<string, { name: string; gradient: string }> = {
  // Two-color guilds (sorted alphabetically by colors)
  'BG': { name: 'Golgari', gradient: 'golgari' },
  'BR': { name: 'Rakdos', gradient: 'rakdos' },
  'BU': { name: 'Dimir', gradient: 'dimir' },
  'BW': { name: 'Orzhov', gradient: 'orzhov' },
  'GR': { name: 'Gruul', gradient: 'gruul' },
  'GU': { name: 'Simic', gradient: 'simic' },
  'GW': { name: 'Selesnya', gradient: 'selesnya' },
  'RU': { name: 'Izzet', gradient: 'izzet' },
  'RW': { name: 'Boros', gradient: 'boros' },
  'UW': { name: 'Azorius', gradient: 'azorius' },
};

// Three-color shards/wedges
const TRICOLOR_MAP: Record<string, { name: string; gradient: string }> = {
  'BGW': { name: 'Abzan', gradient: 'selesnya' },
  'BRU': { name: 'Grixis', gradient: 'dimir' },
  'BRW': { name: 'Mardu', gradient: 'rakdos' },
  'BGR': { name: 'Jund', gradient: 'golgari' },
  'GRU': { name: 'Temur', gradient: 'simic' },
  'GRW': { name: 'Naya', gradient: 'gruul' },
  'GUW': { name: 'Bant', gradient: 'azorius' },
  'BGU': { name: 'Sultai', gradient: 'dimir' },
  'RUW': { name: 'Jeskai', gradient: 'izzet' },
  'BUW': { name: 'Esper', gradient: 'azorius' },
};

export type GuildGradient =
  | 'azorius' | 'dimir' | 'rakdos' | 'gruul' | 'selesnya'
  | 'orzhov' | 'izzet' | 'golgari' | 'boros' | 'simic'
  | 'primary' | 'none';

export interface ColorIdentityInfo {
  name: string;
  gradient: GuildGradient;
  colors: string[];
}

/**
 * Get guild/color combination info from color identity
 * Returns gradient name for Card component and display name
 */
export function getColorIdentityInfo(colors: string[] | null | undefined): ColorIdentityInfo {
  if (!colors || colors.length === 0) {
    return { name: 'Colorless', gradient: 'none', colors: [] };
  }

  const sorted = [...colors].sort().join('');

  // Single color
  if (colors.length === 1) {
    const color = colors[0];
    const colorNames: Record<string, string> = {
      'W': 'White',
      'U': 'Blue',
      'B': 'Black',
      'R': 'Red',
      'G': 'Green',
    };
    const gradientMap: Record<string, GuildGradient> = {
      'W': 'selesnya',
      'U': 'dimir',
      'B': 'rakdos',
      'R': 'boros',
      'G': 'simic',
    };
    return {
      name: color ? colorNames[color] ?? 'Unknown' : 'Unknown',
      gradient: color ? gradientMap[color] ?? 'primary' : 'primary',
      colors,
    };
  }

  // Two colors - exact guild match
  if (colors.length === 2) {
    const guild = GUILD_MAP[sorted];
    if (guild) {
      return { name: guild.name, gradient: guild.gradient as GuildGradient, colors };
    }
  }

  // Three colors
  if (colors.length === 3) {
    const tricolor = TRICOLOR_MAP[sorted];
    if (tricolor) {
      return { name: tricolor.name, gradient: tricolor.gradient as GuildGradient, colors };
    }
  }

  // Four colors (Nephilim) - use dominant pair
  if (colors.length === 4) {
    const missing = ['W', 'U', 'B', 'R', 'G'].find(c => !colors.includes(c));
    const nephilimNames: Record<string, string> = {
      'W': 'Glint-Eye',
      'U': 'Dune-Brood',
      'B': 'Ink-Treader',
      'R': 'Witch-Maw',
      'G': 'Yore-Tiller',
    };
    return {
      name: nephilimNames[missing ?? ''] ?? '4-Color',
      gradient: 'primary',
      colors,
    };
  }

  // Five colors
  if (colors.length === 5) {
    return { name: 'WUBRG', gradient: 'primary', colors };
  }

  return { name: 'Multicolor', gradient: 'primary', colors };
}
