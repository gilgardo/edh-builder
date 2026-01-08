import { NextRequest, NextResponse } from 'next/server';
import { getCard } from '@/services/scryfall';

interface RouteParams {
  params: Promise<{ scryfallId: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { scryfallId } = await params;

    if (!scryfallId) {
      return NextResponse.json({ error: 'Card ID is required' }, { status: 400 });
    }

    const card = await getCard(scryfallId);

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    return NextResponse.json({ card });
  } catch (error) {
    console.error('Get card error:', error);
    return NextResponse.json({ error: 'Failed to get card' }, { status: 500 });
  }
}
