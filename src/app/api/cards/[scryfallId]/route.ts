import { NextRequest, NextResponse } from 'next/server';
import { getCard as getScryfallCard } from '@/services/scryfall';
import { getCard as getCachedCard } from '@/services/card-cache';

interface RouteParams {
  params: Promise<{ scryfallId: string }>;
}

/**
 * Get a single card by Scryfall ID
 *
 * Uses cached data from PostgreSQL by default, falling back to Scryfall API.
 *
 * Query params:
 * - format: 'cached' (default) | 'scryfall' - Response format
 *   - 'cached': Returns cached format (camelCase, stored in DB)
 *   - 'scryfall': Returns Scryfall API format (snake_case, more fields)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { scryfallId } = await params;
    const format = request.nextUrl.searchParams.get('format') || 'cached';

    if (!scryfallId) {
      return NextResponse.json({ error: 'Card ID is required' }, { status: 400 });
    }

    // Default: try cache first
    if (format !== 'scryfall') {
      const cached = await getCachedCard(scryfallId);
      if (cached) {
        return NextResponse.json({ card: cached });
      }
    }

    // Fallback to Scryfall direct
    const card = await getScryfallCard(scryfallId);

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    return NextResponse.json({ card });
  } catch (error) {
    console.error('Get card error:', error);
    return NextResponse.json({ error: 'Failed to get card' }, { status: 500 });
  }
}
