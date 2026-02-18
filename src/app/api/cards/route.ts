import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { searchCards, autocompleteCardName, type SearchFilters } from '@/services/scryfall';
import { mapScryfallToCard } from '@/services/card-cache';
import { prisma } from '@/lib/prisma';
import type { EnrichedScryfallCard } from '@/types/scryfall.types';

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

    // Look up any already-cached R2 image URLs from DB to enrich the response
    const scryfallIds = result.cards.map((c) => c.id);
    const cachedInDb = await prisma.card.findMany({
      where: { scryfallId: { in: scryfallIds } },
      select: {
        scryfallId: true,
        cachedImageSmall: true,
        cachedImageNormal: true,
        cachedImageLarge: true,
      },
    });
    const cacheMap = new Map(
      cachedInDb.map((c) => [
        c.scryfallId as string,
        c as { cachedImageSmall: string | null; cachedImageNormal: string | null; cachedImageLarge: string | null },
      ])
    );

    const enrichedCards: EnrichedScryfallCard[] = result.cards.map((card) => {
      const cached = cacheMap.get(card.id);
      return {
        ...card,
        cachedImageSmall: cached?.cachedImageSmall ?? null,
        cachedImageNormal: cached?.cachedImageNormal ?? null,
        cachedImageLarge: cached?.cachedImageLarge ?? null,
      };
    });

    // Async-cache search results to PostgreSQL (fire-and-forget, no latency hit)
    if (result.cards.length > 0) {
      Promise.allSettled(
        result.cards.map((card) => {
          const data = mapScryfallToCard(card);
          return prisma.card.upsert({
            where: { scryfallId: card.id },
            create: data,
            update: {
              ...data,
              // Preserve existing cached image URLs
              cachedImageSmall: undefined,
              cachedImageNormal: undefined,
              cachedImageLarge: undefined,
              cachedBackImageSmall: undefined,
              cachedBackImageNormal: undefined,
              cachedBackImageLarge: undefined,
              imageCachedAt: undefined,
            },
          });
        })
      ).catch((err) => console.error('Background card cache error:', err));
    }

    return NextResponse.json({
      cards: enrichedCards,
      total: result.total,
      hasMore: result.hasMore,
      page: data.page ?? 1,
    });
  } catch (error) {
    console.error('Card search error:', error);
    return NextResponse.json({ error: 'Failed to search cards' }, { status: 500 });
  }
}
