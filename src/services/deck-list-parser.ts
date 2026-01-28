/**
 * Deck List Parser
 *
 * Parses text-based deck lists from various formats (MTGO, Arena, plain text)
 * into a structured format for import.
 */

export interface ParsedCard {
  name: string;
  quantity: number;
  category?: string;
}

export interface ParseResult {
  cards: ParsedCard[];
  commander?: ParsedCard;
  errors: ParseError[];
}

export interface ParseError {
  line: number;
  content: string;
  message: string;
}

// Category header patterns
const CATEGORY_PATTERNS: { pattern: RegExp; category: string }[] = [
  { pattern: /^commander:?$/i, category: 'COMMANDER' },
  { pattern: /^creatures?\s*(\(\d+\))?:?$/i, category: 'CREATURE' },
  { pattern: /^instants?\s*(\(\d+\))?:?$/i, category: 'INSTANT' },
  { pattern: /^sorcery|sorceries\s*(\(\d+\))?:?$/i, category: 'SORCERY' },
  { pattern: /^artifacts?\s*(\(\d+\))?:?$/i, category: 'ARTIFACT' },
  { pattern: /^enchantments?\s*(\(\d+\))?:?$/i, category: 'ENCHANTMENT' },
  { pattern: /^planeswalkers?\s*(\(\d+\))?:?$/i, category: 'PLANESWALKER' },
  { pattern: /^lands?\s*(\(\d+\))?:?$/i, category: 'LAND' },
  { pattern: /^sideboard:?$/i, category: 'SIDEBOARD' },
  { pattern: /^considering:?$/i, category: 'CONSIDERING' },
  { pattern: /^maybeboard:?$/i, category: 'CONSIDERING' },
  { pattern: /^main\s*deck:?$/i, category: 'MAIN' },
  { pattern: /^deck:?$/i, category: 'MAIN' },
];

// Comment patterns
const COMMENT_PATTERNS = [
  /^\/\//, // Double slash comments
  /^#/, // Hash comments
];

// Card line patterns - matches quantity and card name
// Supports: "1 Card Name", "1x Card Name", "Card Name", "Card Name x1"
const CARD_LINE_PATTERN = /^(\d+)?\s*x?\s*(.+?)(?:\s+x?(\d+))?$/i;

// Arena format: "1 Card Name (SET) 123" or "1 Card Name (SET)"
const ARENA_PATTERN = /^(\d+)\s+(.+?)\s+\([A-Z0-9]+\)(?:\s+\d+)?$/i;

/**
 * Check if a line is a comment or should be skipped
 */
function isComment(line: string): boolean {
  return COMMENT_PATTERNS.some((pattern) => pattern.test(line));
}

/**
 * Check if a line is a category header and return the category
 */
function getCategoryFromHeader(line: string): string | null {
  // Also check for "// Category" format
  const cleanLine = line.replace(/^\/\/\s*/, '').trim();

  for (const { pattern, category } of CATEGORY_PATTERNS) {
    if (pattern.test(cleanLine)) {
      return category;
    }
  }

  return null;
}

// Maximum line length to prevent ReDoS attacks
const MAX_LINE_LENGTH = 200;

/**
 * Parse a single card line and extract name and quantity
 */
function parseCardLine(line: string): { name: string; quantity: number } | null {
  // Prevent ReDoS with length limit
  if (line.length > MAX_LINE_LENGTH) {
    return null;
  }

  // Try Arena format first
  const arenaMatch = line.match(ARENA_PATTERN);
  if (arenaMatch && arenaMatch[1] && arenaMatch[2]) {
    return {
      quantity: parseInt(arenaMatch[1], 10),
      name: arenaMatch[2].trim(),
    };
  }

  // Try standard format
  const match = line.match(CARD_LINE_PATTERN);
  if (!match) {
    return null;
  }

  const [, quantityBefore, cardName, quantityAfter] = match;

  // Ensure card name was captured
  if (!cardName) {
    return null;
  }

  // Get quantity from either position, default to 1
  const quantity = parseInt(quantityBefore || quantityAfter || '1', 10);

  // Validate quantity
  if (quantity < 1 || quantity > 99) {
    return null;
  }

  const name = cardName.trim();

  // Card name should be at least 2 characters and not be all numbers
  if (name.length < 2 || /^\d+$/.test(name)) {
    return null;
  }

  return { name, quantity };
}

/**
 * Clean up card name for better matching
 */
function normalizeCardName(name: string): string {
  return (
    name
      // Remove set codes in parentheses: "Card Name (SET)" -> "Card Name"
      .replace(/\s*\([A-Z0-9]+\)\s*$/i, '')
      // Remove collector numbers: "Card Name 123" -> "Card Name"
      .replace(/\s+\d+$/, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/**
 * Parse a complete deck list text into structured data
 */
export function parseDeckList(text: string): ParseResult {
  const lines = text.split(/\r?\n/);
  const cards: ParsedCard[] = [];
  const errors: ParseError[] = [];
  let commander: ParsedCard | undefined;
  let currentCategory: string | undefined;

  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    const rawLine = lines[i] ?? '';
    const line = rawLine.trim();

    // Skip empty lines
    if (!line) {
      continue;
    }

    // Check for category headers (including "// Category" format)
    const category = getCategoryFromHeader(line);
    if (category) {
      currentCategory = category;
      continue;
    }

    // Skip pure comments that aren't category headers
    if (isComment(line)) {
      continue;
    }

    // Try to parse as a card line
    const parsedCard = parseCardLine(line);
    if (!parsedCard) {
      errors.push({
        line: lineNumber,
        content: rawLine,
        message: 'Could not parse card line',
      });
      continue;
    }

    const normalizedName = normalizeCardName(parsedCard.name);

    const card: ParsedCard = {
      name: normalizedName,
      quantity: parsedCard.quantity,
      category: currentCategory,
    };

    // If this is in the commander category, set it as commander
    if (currentCategory === 'COMMANDER') {
      if (!commander) {
        commander = card;
      }
      // Also add to cards list for completeness
      cards.push(card);
    } else {
      cards.push(card);
    }
  }

  return { cards, commander, errors };
}

/**
 * Validate a parsed deck list for Commander format
 */
export function validateCommanderDeck(result: ParseResult): string[] {
  const warnings: string[] = [];

  // Check for commander
  if (!result.commander) {
    warnings.push('No commander detected. Please select a commander.');
  }

  // Count total cards (excluding commander)
  const nonCommanderCards = result.cards.filter((c) => c.category !== 'COMMANDER');
  const totalCards = nonCommanderCards.reduce((sum, c) => sum + c.quantity, 0);

  if (totalCards > 99) {
    warnings.push(`Deck has ${totalCards} cards (should be 99 + commander = 100 total)`);
  }

  // Check for duplicates (excluding basic lands)
  const BASIC_LANDS = ['Plains', 'Island', 'Swamp', 'Mountain', 'Forest', 'Wastes'];
  const cardCounts = new Map<string, number>();

  for (const card of nonCommanderCards) {
    const lowerName = card.name.toLowerCase();
    const isBasicLand = BASIC_LANDS.some((land) => lowerName === land.toLowerCase());

    if (!isBasicLand && card.quantity > 1) {
      warnings.push(`"${card.name}" appears ${card.quantity} times (Commander allows only 1 copy)`);
    }

    const existing = cardCounts.get(lowerName) || 0;
    cardCounts.set(lowerName, existing + card.quantity);

    if (!isBasicLand && cardCounts.get(lowerName)! > 1) {
      warnings.push(`"${card.name}" appears multiple times in the list`);
    }
  }

  return warnings;
}

/**
 * Get unique card names from parsed result for Scryfall lookup
 */
export function getUniqueCardNames(result: ParseResult): string[] {
  const names = new Set<string>();

  for (const card of result.cards) {
    names.add(card.name);
  }

  return Array.from(names);
}

/**
 * Generate a deck list text from parsed cards
 */
export function generateDeckListText(cards: ParsedCard[], commander?: ParsedCard): string {
  const lines: string[] = [];

  if (commander) {
    lines.push('Commander:');
    lines.push(`1 ${commander.name}`);
    lines.push('');
  }

  // Group cards by category
  const byCategory = new Map<string, ParsedCard[]>();

  for (const card of cards) {
    if (card.category === 'COMMANDER') continue;

    const category = card.category || 'MAIN';
    const existing = byCategory.get(category) || [];
    byCategory.set(category, [...existing, card]);
  }

  // Output each category
  for (const [category, categoryCards] of byCategory) {
    if (categoryCards.length === 0) continue;

    const totalCount = categoryCards.reduce((sum, c) => sum + c.quantity, 0);
    lines.push(`${category} (${totalCount}):`);

    for (const card of categoryCards) {
      lines.push(`${card.quantity} ${card.name}`);
    }

    lines.push('');
  }

  return lines.join('\n').trim();
}
