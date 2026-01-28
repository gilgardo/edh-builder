/**
 * Moxfield API Service
 *
 * Fetches deck data from Moxfield's public API and transforms it
 * into our internal format.
 */

export interface MoxfieldCard {
  name: string;
  quantity: number;
  scryfallId?: string;
}

export interface MoxfieldDeck {
  id: string;
  name: string;
  description?: string;
  format: string;
  commander?: MoxfieldCard;
  cards: MoxfieldCard[];
  authorUsername?: string;
}

export interface MoxfieldError {
  code: 'INVALID_URL' | 'DECK_NOT_FOUND' | 'PRIVATE_DECK' | 'RATE_LIMITED' | 'API_ERROR';
  message: string;
}

// Moxfield API base URL
const MOXFIELD_API_BASE = 'https://api2.moxfield.com/v2';

/**
 * Extract deck ID from various Moxfield URL formats
 *
 * Supported formats:
 * - https://www.moxfield.com/decks/{id}
 * - https://moxfield.com/decks/{id}
 * - https://www.moxfield.com/decks/{id}/primer
 * - Just the ID itself
 */
export function extractDeckId(input: string): string | null {
  const trimmed = input.trim();

  // If it looks like a URL
  if (trimmed.includes('moxfield.com')) {
    // Match deck ID from URL path
    const match = trimmed.match(/moxfield\.com\/decks\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return match[1];
    }
    return null;
  }

  // If it's just an ID (alphanumeric with underscores/dashes)
  if (/^[a-zA-Z0-9_-]+$/.test(trimmed) && trimmed.length >= 6) {
    return trimmed;
  }

  return null;
}

/**
 * Moxfield API response types (partial, only what we need)
 */
interface MoxfieldApiCard {
  quantity: number;
  card: {
    name: string;
    scryfall_id?: string;
  };
}

interface MoxfieldApiBoard {
  [cardId: string]: MoxfieldApiCard;
}

interface MoxfieldApiResponse {
  id: string;
  name: string;
  description?: string;
  format: string;
  publicId: string;
  createdByUser?: {
    userName: string;
  };
  commanders?: MoxfieldApiBoard;
  mainboard?: MoxfieldApiBoard;
  sideboard?: MoxfieldApiBoard;
  maybeboard?: MoxfieldApiBoard;
}

/**
 * Transform Moxfield API board to our card format
 */
function transformBoard(board: MoxfieldApiBoard | undefined): MoxfieldCard[] {
  if (!board) return [];

  return Object.values(board).map((entry) => ({
    name: entry.card.name,
    quantity: entry.quantity,
    scryfallId: entry.card.scryfall_id,
  }));
}

/**
 * Fetch a deck from Moxfield's public API
 */
export async function fetchMoxfieldDeck(
  deckIdOrUrl: string
): Promise<{ deck: MoxfieldDeck } | { error: MoxfieldError }> {
  const deckId = extractDeckId(deckIdOrUrl);

  if (!deckId) {
    return {
      error: {
        code: 'INVALID_URL',
        message: 'Invalid Moxfield URL or deck ID. Please provide a valid Moxfield deck URL.',
      },
    };
  }

  try {
    const response = await fetch(`${MOXFIELD_API_BASE}/decks/all/${deckId}`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'EDH-Builder/1.0',
      },
      // Cache for 5 minutes
      next: { revalidate: 300 },
    });

    if (response.status === 404) {
      return {
        error: {
          code: 'DECK_NOT_FOUND',
          message: 'Deck not found. Make sure the deck exists and is public.',
        },
      };
    }

    if (response.status === 403) {
      return {
        error: {
          code: 'PRIVATE_DECK',
          message: 'This deck is private. Only public decks can be imported.',
        },
      };
    }

    if (response.status === 429) {
      return {
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests to Moxfield. Please try again in a few seconds.',
        },
      };
    }

    if (!response.ok) {
      return {
        error: {
          code: 'API_ERROR',
          message: `Moxfield API error: ${response.status} ${response.statusText}`,
        },
      };
    }

    const data: MoxfieldApiResponse = await response.json();

    // Transform commanders
    const commanders = transformBoard(data.commanders);
    const commander = commanders.length > 0 ? commanders[0] : undefined;

    // Combine all cards
    const cards: MoxfieldCard[] = [
      ...commanders,
      ...transformBoard(data.mainboard),
      ...transformBoard(data.sideboard),
      ...transformBoard(data.maybeboard),
    ];

    const deck: MoxfieldDeck = {
      id: data.publicId || data.id,
      name: data.name,
      description: data.description,
      format: data.format,
      commander,
      cards,
      authorUsername: data.createdByUser?.userName,
    };

    return { deck };
  } catch {
    return {
      error: {
        code: 'API_ERROR',
        message: 'Failed to fetch deck from Moxfield. Please try again.',
      },
    };
  }
}

/**
 * Validate that a Moxfield URL is well-formed without fetching
 */
export function isValidMoxfieldUrl(input: string): boolean {
  return extractDeckId(input) !== null;
}
