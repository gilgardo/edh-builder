import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ParseImportRequestSchema, type CardResolution } from '@/schemas/import.schema';
import {
  parseDeckList,
  validateCommanderDeck,
  getUniqueCardNames,
} from '@/services/deck-list-parser';

// Scryfall rate limit: 10 requests/second, we'll be conservative
const SCRYFALL_DELAY_MS = 150;
const SCRYFALL_BATCH_SIZE = 75; // Max cards per /cards/collection request
const MAX_CARD_NAME_LENGTH = 150;

/**
 * Sanitize card name for safe API usage
 */
function sanitizeCardName(name: string): string {
  return name
    .replace(/[<>'"\\]/g, '') // Remove potentially dangerous chars
    .substring(0, MAX_CARD_NAME_LENGTH)
    .trim();
}

interface ScryfallCardResult {
  id: string;
  oracle_id: string;
  name: string;
  type_line: string;
  mana_cost?: string;
  cmc: number;
  colors?: string[];
  color_identity: string[];
  image_uris?: {
    small: string;
    normal: string;
    large: string;
    png: string;
    art_crop: string;
    border_crop: string;
  };
  card_faces?: Array<{
    image_uris?: {
      small: string;
      normal: string;
      large: string;
      png: string;
      art_crop: string;
      border_crop: string;
    };
  }>;
  legalities: { commander: string };
  set: string;
  set_name: string;
  rarity: string;
  prices: { usd?: string | null };
  uri: string;
  scryfall_uri: string;
  layout: string;
  keywords?: string[];
  artist?: string;
  released_at?: string;
  power?: string;
  toughness?: string;
  loyalty?: string;
  oracle_text?: string;
}

interface ScryfallCollectionResponse {
  data: ScryfallCardResult[];
  not_found: Array<{ name: string }>;
}

/**
 * Resolve card names via Scryfall's /cards/collection endpoint
 */
async function resolveCardsViaScryfallCollection(
  names: string[]
): Promise<Map<string, ScryfallCardResult | null>> {
  const results = new Map<string, ScryfallCardResult | null>();

  // Initialize all as null (not found)
  for (const name of names) {
    results.set(name.toLowerCase(), null);
  }

  // Process in batches
  for (let i = 0; i < names.length; i += SCRYFALL_BATCH_SIZE) {
    const batch = names.slice(i, i + SCRYFALL_BATCH_SIZE);

    try {
      const response = await fetch('https://api.scryfall.com/cards/collection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'EDH-Builder/1.0',
        },
        body: JSON.stringify({
          identifiers: batch.map((name) => ({ name })),
        }),
      });

      if (!response.ok) {
        continue;
      }

      const data: ScryfallCollectionResponse = await response.json();

      // Map found cards
      for (const card of data.data) {
        results.set(card.name.toLowerCase(), card);
      }

      // Rate limit delay between batches
      if (i + SCRYFALL_BATCH_SIZE < names.length) {
        await new Promise((resolve) => setTimeout(resolve, SCRYFALL_DELAY_MS));
      }
    } catch {
      // Continue with remaining batches on error
    }
  }

  return results;
}

/**
 * Try to get fuzzy suggestions for unresolved card names
 */
async function getSuggestions(name: string): Promise<string[]> {
  try {
    const sanitized = sanitizeCardName(name);
    if (!sanitized) return [];

    const response = await fetch(
      `https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(sanitized)}`,
      {
        headers: { 'User-Agent': 'EDH-Builder/1.0' },
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    return (data.data || []).slice(0, 3);
  } catch {
    return [];
  }
}

/**
 * POST /api/import/parse
 *
 * Parse a text deck list and resolve cards via Scryfall.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = ParseImportRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Parse the deck list text
    const parseResult = parseDeckList(parsed.data.text);

    // Get unique card names for resolution
    const uniqueNames = getUniqueCardNames(parseResult);

    // Resolve cards via Scryfall
    const resolvedCards = await resolveCardsViaScryfallCollection(uniqueNames);

    // Build resolution results
    const cards: CardResolution[] = [];
    const unresolvedNames: string[] = [];

    for (const parsedCard of parseResult.cards) {
      const scryfallCard = resolvedCards.get(parsedCard.name.toLowerCase());

      if (scryfallCard) {
        cards.push({
          name: scryfallCard.name, // Use canonical name from Scryfall
          quantity: parsedCard.quantity,
          category: parsedCard.category,
          resolved: true,
          scryfallId: scryfallCard.id,
          scryfallCard,
        });
      } else {
        unresolvedNames.push(parsedCard.name);
        cards.push({
          name: parsedCard.name,
          quantity: parsedCard.quantity,
          category: parsedCard.category,
          resolved: false,
          error: 'Card not found',
        });
      }
    }

    // Get suggestions for unresolved cards (limit to first 5 to avoid rate limits)
    const uniqueUnresolved = [...new Set(unresolvedNames)].slice(0, 5);
    for (const name of uniqueUnresolved) {
      const suggestions = await getSuggestions(name);
      if (suggestions.length > 0) {
        // Find cards with this name and add suggestions
        for (const card of cards) {
          if (!card.resolved && card.name.toLowerCase() === name.toLowerCase()) {
            card.suggestions = suggestions;
          }
        }
      }
      // Small delay for rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Find commander
    let commander: CardResolution | undefined;
    if (parseResult.commander) {
      const scryfallCard = resolvedCards.get(parseResult.commander.name.toLowerCase());
      commander = {
        name: scryfallCard?.name || parseResult.commander.name,
        quantity: 1,
        category: 'COMMANDER',
        resolved: !!scryfallCard,
        scryfallId: scryfallCard?.id,
        scryfallCard,
        error: scryfallCard ? undefined : 'Commander card not found',
      };
    }

    // Get validation warnings
    const warnings = validateCommanderDeck(parseResult);

    // Add parse errors as warnings
    for (const error of parseResult.errors) {
      warnings.push(`Line ${error.line}: ${error.message} - "${error.content}"`);
    }

    const resolvedCount = cards.filter((c) => c.resolved).length;
    const unresolvedCount = cards.filter((c) => !c.resolved).length;

    return NextResponse.json({
      commander,
      cards,
      totalCards: cards.reduce((sum, c) => sum + c.quantity, 0),
      resolvedCount,
      unresolvedCount,
      warnings,
      source: 'text',
    });
  } catch {
    return NextResponse.json({ error: 'Failed to parse deck list' }, { status: 500 });
  }
}
