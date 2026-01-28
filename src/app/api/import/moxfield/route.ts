import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { MoxfieldImportRequestSchema } from '@/schemas/import.schema';
import { fetchMoxfieldDeck } from '@/services/moxfield';
import { getCardsByIds } from '@/services/scryfall';

/**
 * POST /api/import/moxfield
 *
 * Fetch a deck from Moxfield's public API and return it in our format.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = MoxfieldImportRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await fetchMoxfieldDeck(parsed.data.url);

    if ('error' in result) {
      const statusMap: Record<string, number> = {
        INVALID_URL: 400,
        DECK_NOT_FOUND: 404,
        PRIVATE_DECK: 403,
        RATE_LIMITED: 429,
        API_ERROR: 502,
      };

      return NextResponse.json(
        { error: result.error.message, code: result.error.code },
        { status: statusMap[result.error.code] || 500 }
      );
    }

    // Transform to import preview format
    const { deck } = result;

    // Collect all Scryfall IDs to fetch
    const scryfallIds: string[] = [];
    if (deck.commander?.scryfallId) {
      scryfallIds.push(deck.commander.scryfallId);
    }
    for (const card of deck.cards) {
      if (card.scryfallId) {
        scryfallIds.push(card.scryfallId);
      }
    }

    // Fetch all Scryfall card data in batch
    const scryfallCards = await getCardsByIds(scryfallIds);

    // Build cards list with full Scryfall card data
    const cards = deck.cards.map((card) => {
      const scryfallCard = card.scryfallId ? scryfallCards.get(card.scryfallId) : undefined;
      return {
        name: card.name,
        quantity: card.quantity,
        resolved: !!scryfallCard,
        scryfallId: card.scryfallId,
        scryfallCard,
      };
    });

    // Build commander with full Scryfall data
    const commanderCard = deck.commander
      ? {
          name: deck.commander.name,
          quantity: 1,
          category: 'COMMANDER' as const,
          resolved: !!deck.commander.scryfallId && scryfallCards.has(deck.commander.scryfallId),
          scryfallId: deck.commander.scryfallId,
          scryfallCard: deck.commander.scryfallId
            ? scryfallCards.get(deck.commander.scryfallId)
            : undefined,
        }
      : undefined;

    return NextResponse.json({
      deckName: deck.name,
      description: deck.description,
      commander: commanderCard,
      cards,
      totalCards: cards.reduce((sum, c) => sum + c.quantity, 0),
      resolvedCount: cards.filter((c) => c.resolved).length,
      unresolvedCount: cards.filter((c) => !c.resolved).length,
      warnings: [],
      source: 'moxfield',
      authorUsername: deck.authorUsername,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to import from Moxfield' }, { status: 500 });
  }
}
