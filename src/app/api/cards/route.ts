import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { searchCards, autocompleteCardName, type SearchFilters } from '@/services/scryfall';

const searchParamsSchema = z.object({
  q: z.string().optional(),
  colors: z.string().optional(),
  colorIdentity: z.string().optional(),
  type: z.string().optional(),
  cmc: z.coerce.number().optional(),
  cmcOp: z.enum(['eq', 'lt', 'lte', 'gt', 'gte']).optional(),
  rarity: z.string().optional(),
  set: z.string().optional(),
  isCommander: z.coerce.boolean().optional(),
  page: z.coerce.number().optional(),
  autocomplete: z.coerce.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const parsed = searchParamsSchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid search parameters', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Handle autocomplete requests
    if (data.autocomplete && data.q) {
      const suggestions = await autocompleteCardName(data.q);
      return NextResponse.json({ suggestions });
    }

    // Build search filters
    const filters: SearchFilters = {
      query: data.q,
      colors: data.colors?.split('').filter(Boolean),
      colorIdentity: data.colorIdentity?.split('').filter(Boolean),
      type: data.type,
      cmc: data.cmc,
      cmcOperator: data.cmcOp,
      rarity: data.rarity,
      set: data.set,
      isCommander: data.isCommander,
      page: data.page,
    };

    const result = await searchCards(filters);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      cards: result.cards,
      total: result.total,
      hasMore: result.hasMore,
      page: data.page ?? 1,
    });
  } catch (error) {
    console.error('Card search error:', error);
    return NextResponse.json({ error: 'Failed to search cards' }, { status: 500 });
  }
}
