import { NextRequest, NextResponse } from 'next/server';
import { getCard as getScryfallCard } from '@/services/scryfall';
import { getCard as getCachedCard } from '@/services/card-cache';

interface RouteParams {
  params: Promise<{ scryfallId: string }>;
}

/**
 * Get a single card by Scryfall ID
 *
 * Query params:
 * - format: 'scryfall' (default) | 'cached' - Response format
 *   - 'scryfall': Returns Scryfall API format (snake_case, more fields)
 *   - 'cached': Returns cached format (camelCase, stored in DB)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { scryfallId } = await params;
    const format = request.nextUrl.searchParams.get('format') || 'scryfall';

    if (!scryfallId) {
      return NextResponse.json({ error: 'Card ID is required' }, { status: 400 });
    }

    let card;
    if (format === 'cached') card = await getCachedCard(scryfallId);

    // Default: Scryfall format (backward compatible)
    card = card ? card : await getScryfallCard(scryfallId);

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    return NextResponse.json({ card });
  } catch (error) {
    console.error('Get card error:', error);
    return NextResponse.json({ error: 'Failed to get card' }, { status: 500 });
  }
}
