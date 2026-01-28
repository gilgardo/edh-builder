import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { MoxfieldImportRequestSchema } from '@/schemas/import.schema';
import { fetchMoxfieldDeck } from '@/services/moxfield';

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

    // Build cards list with resolution info
    const cards = deck.cards.map((card) => ({
      name: card.name,
      quantity: card.quantity,
      resolved: !!card.scryfallId,
      scryfallId: card.scryfallId,
    }));

    const commanderCard = deck.commander
      ? {
          name: deck.commander.name,
          quantity: 1,
          category: 'COMMANDER',
          resolved: !!deck.commander.scryfallId,
          scryfallId: deck.commander.scryfallId,
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
