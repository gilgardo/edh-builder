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
