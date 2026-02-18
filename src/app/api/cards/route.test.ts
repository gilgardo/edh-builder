import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { createGetRequest, parseJsonResponse } from '@/test/utils/api-test-utils';
import { prismaMock } from '@/test/mocks/prisma';

// Mock the Scryfall service
vi.mock('@/services/scryfall', () => ({
  searchCards: vi.fn(),
  autocompleteCardName: vi.fn(),
}));

// Mock the card-cache service (fire-and-forget upserts)
vi.mock('@/services/card-cache', () => ({
  mapScryfallToCard: vi.fn((card: { id: string; name: string }) => ({
    scryfallId: card.id,
    name: card.name,
  })),
}));

import { searchCards, autocompleteCardName } from '@/services/scryfall';

// ============================================================
// Shared fixtures
// ============================================================

const mockScryfallCard1 = {
  id: 'scryfall-id-1',
  name: 'Sol Ring',
  mana_cost: '{1}',
  cmc: 1,
  type_line: 'Artifact',
  oracle_text: '{T}: Add {C}{C}.',
  colors: [],
  color_identity: [],
  image_uris: {
    small: 'https://cards.scryfall.io/small/sol-ring.jpg',
    normal: 'https://cards.scryfall.io/normal/sol-ring.jpg',
    large: 'https://cards.scryfall.io/large/sol-ring.jpg',
  },
  set: 'c21',
  rarity: 'uncommon',
  legalities: { commander: 'legal' },
};

const mockScryfallCard2 = {
  id: 'scryfall-id-2',
  name: 'Lightning Bolt',
  mana_cost: '{R}',
  cmc: 1,
  type_line: 'Instant',
  colors: ['R'],
  color_identity: ['R'],
  image_uris: {
    small: 'https://cards.scryfall.io/small/lightning-bolt.jpg',
    normal: 'https://cards.scryfall.io/normal/lightning-bolt.jpg',
    large: 'https://cards.scryfall.io/large/lightning-bolt.jpg',
  },
  set: 'a25',
  rarity: 'uncommon',
  legalities: { commander: 'legal' },
};

// ============================================================
// Tests
// ============================================================

describe('GET /api/cards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: upserts succeed silently
    prismaMock.card.upsert.mockResolvedValue({} as never);
  });

  // ----------------------------------------------------------
  // R2 image enrichment (new behavior from last commit)
  // ----------------------------------------------------------

  describe('R2 image enrichment', () => {
    it('enriches all cards with null cached URLs when none are in DB', async () => {
      vi.mocked(searchCards).mockResolvedValue({
        cards: [mockScryfallCard1, mockScryfallCard2] as never,
        total: 2,
        hasMore: false,
      });
      prismaMock.card.findMany.mockResolvedValue([]);

      const request = createGetRequest('/api/cards', { q: 'sol ring' });
      const response = await GET(request);
      const { status, data } = await parseJsonResponse<{ cards: Record<string, unknown>[] }>(
        response
      );

      expect(status).toBe(200);
      expect(data.cards).toHaveLength(2);

      expect(data.cards[0]).toMatchObject({
        id: 'scryfall-id-1',
        cachedImageSmall: null,
        cachedImageNormal: null,
        cachedImageLarge: null,
      });
      expect(data.cards[1]).toMatchObject({
        id: 'scryfall-id-2',
        cachedImageSmall: null,
        cachedImageNormal: null,
        cachedImageLarge: null,
      });
    });

    it('enriches cards with cached R2 URLs when found in DB', async () => {
      vi.mocked(searchCards).mockResolvedValue({
        cards: [mockScryfallCard1] as never,
        total: 1,
        hasMore: false,
      });
      prismaMock.card.findMany.mockResolvedValue([
        {
          scryfallId: 'scryfall-id-1',
          cachedImageSmall: 'https://r2.example.com/small/sol-ring.jpg',
          cachedImageNormal: 'https://r2.example.com/normal/sol-ring.jpg',
          cachedImageLarge: 'https://r2.example.com/large/sol-ring.jpg',
        } as never,
      ]);

      const request = createGetRequest('/api/cards', { q: 'sol ring' });
      const response = await GET(request);
      const { status, data } = await parseJsonResponse<{ cards: Record<string, unknown>[] }>(
        response
      );

      expect(status).toBe(200);
      expect(data.cards[0]).toMatchObject({
        id: 'scryfall-id-1',
        cachedImageSmall: 'https://r2.example.com/small/sol-ring.jpg',
        cachedImageNormal: 'https://r2.example.com/normal/sol-ring.jpg',
        cachedImageLarge: 'https://r2.example.com/large/sol-ring.jpg',
      });
    });

    it('enriches only matching cards when DB has partial cache hits', async () => {
      vi.mocked(searchCards).mockResolvedValue({
        cards: [mockScryfallCard1, mockScryfallCard2] as never,
        total: 2,
        hasMore: false,
      });
      // Only mockScryfallCard1 is in DB cache
      prismaMock.card.findMany.mockResolvedValue([
        {
          scryfallId: 'scryfall-id-1',
          cachedImageSmall: 'https://r2.example.com/small/sol-ring.jpg',
          cachedImageNormal: 'https://r2.example.com/normal/sol-ring.jpg',
          cachedImageLarge: null,
        } as never,
      ]);

      const request = createGetRequest('/api/cards', { q: 'test' });
      const response = await GET(request);
      const { status, data } = await parseJsonResponse<{ cards: Record<string, unknown>[] }>(
        response
      );

      expect(status).toBe(200);
      // Card 1: enriched with cached URLs
      expect(data.cards[0].cachedImageSmall).toBe('https://r2.example.com/small/sol-ring.jpg');
      expect(data.cards[0].cachedImageNormal).toBe('https://r2.example.com/normal/sol-ring.jpg');
      expect(data.cards[0].cachedImageLarge).toBeNull();
      // Card 2: no DB cache, gets null
      expect(data.cards[1].cachedImageSmall).toBeNull();
      expect(data.cards[1].cachedImageNormal).toBeNull();
      expect(data.cards[1].cachedImageLarge).toBeNull();
    });

    it('queries DB with the correct scryfallId list', async () => {
      vi.mocked(searchCards).mockResolvedValue({
        cards: [mockScryfallCard1, mockScryfallCard2] as never,
        total: 2,
        hasMore: false,
      });
      prismaMock.card.findMany.mockResolvedValue([]);

      const request = createGetRequest('/api/cards', { q: 'test' });
      await GET(request);

      expect(prismaMock.card.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { scryfallId: { in: ['scryfall-id-1', 'scryfall-id-2'] } },
          select: expect.objectContaining({
            scryfallId: true,
            cachedImageSmall: true,
            cachedImageNormal: true,
            cachedImageLarge: true,
          }),
        })
      );
    });

    it('preserves original Scryfall card fields after enrichment', async () => {
      vi.mocked(searchCards).mockResolvedValue({
        cards: [mockScryfallCard1] as never,
        total: 1,
        hasMore: false,
      });
      prismaMock.card.findMany.mockResolvedValue([
        {
          scryfallId: 'scryfall-id-1',
          cachedImageSmall: 'https://r2.example.com/small/sol-ring.jpg',
          cachedImageNormal: null,
          cachedImageLarge: null,
        } as never,
      ]);

      const request = createGetRequest('/api/cards', { q: 'sol' });
      const response = await GET(request);
      const { data } = await parseJsonResponse<{ cards: Record<string, unknown>[] }>(response);

      const card = data.cards[0];
      expect(card.name).toBe('Sol Ring');
      expect(card.mana_cost).toBe('{1}');
      expect(card.type_line).toBe('Artifact');
    });
  });

  // ----------------------------------------------------------
  // Autocomplete path
  // ----------------------------------------------------------

  describe('autocomplete', () => {
    it('returns suggestions list for autocomplete requests', async () => {
      vi.mocked(autocompleteCardName).mockResolvedValue(['Sol Ring', 'Sol Talisman']);

      const request = createGetRequest('/api/cards', { q: 'sol', autocomplete: 'true' });
      const response = await GET(request);
      const { status, data } = await parseJsonResponse<{ suggestions: string[] }>(response);

      expect(status).toBe(200);
      expect(data.suggestions).toEqual(['Sol Ring', 'Sol Talisman']);
    });

    it('does not call searchCards for autocomplete requests', async () => {
      vi.mocked(autocompleteCardName).mockResolvedValue(['Counterspell']);

      const request = createGetRequest('/api/cards', { q: 'count', autocomplete: 'true' });
      await GET(request);

      expect(searchCards).not.toHaveBeenCalled();
    });
  });

  // ----------------------------------------------------------
  // Error handling
  // ----------------------------------------------------------

  describe('error handling', () => {
    it('returns 400 when query params fail Zod validation', async () => {
      const request = createGetRequest('/api/cards', { cmc: 'not-a-number' });
      const response = await GET(request);
      const { status, data } = await parseJsonResponse<{ error: string }>(response);

      expect(status).toBe(400);
      expect(data.error).toBe('Invalid search parameters');
    });

    it('returns 500 with Scryfall error message when searchCards returns an error', async () => {
      vi.mocked(searchCards).mockResolvedValue({
        cards: [],
        total: 0,
        hasMore: false,
        error: 'Too Many Requests',
      });

      const request = createGetRequest('/api/cards', { q: 'test' });
      const response = await GET(request);
      const { status, data } = await parseJsonResponse<{ error: string }>(response);

      expect(status).toBe(500);
      expect(data.error).toBe('Too Many Requests');
    });

    it('returns 500 with generic message when an unexpected error is thrown', async () => {
      vi.mocked(searchCards).mockRejectedValue(new Error('Network failure'));

      const request = createGetRequest('/api/cards', { q: 'test' });
      const response = await GET(request);
      const { status, data } = await parseJsonResponse<{ error: string }>(response);

      expect(status).toBe(500);
      expect(data.error).toBe('Failed to search cards');
    });
  });

  // ----------------------------------------------------------
  // Response structure / pagination
  // ----------------------------------------------------------

  describe('response structure', () => {
    it('includes total, hasMore, and page in response', async () => {
      vi.mocked(searchCards).mockResolvedValue({
        cards: [mockScryfallCard1] as never,
        total: 150,
        hasMore: true,
      });
      prismaMock.card.findMany.mockResolvedValue([]);

      const request = createGetRequest('/api/cards', { q: 'test', page: '3' });
      const response = await GET(request);
      const { status, data } = await parseJsonResponse<{
        total: number;
        hasMore: boolean;
        page: number;
      }>(response);

      expect(status).toBe(200);
      expect(data.total).toBe(150);
      expect(data.hasMore).toBe(true);
      expect(data.page).toBe(3);
    });

    it('defaults page to 1 when not specified', async () => {
      vi.mocked(searchCards).mockResolvedValue({
        cards: [],
        total: 0,
        hasMore: false,
      });
      prismaMock.card.findMany.mockResolvedValue([]);

      const request = createGetRequest('/api/cards', { q: 'test' });
      const response = await GET(request);
      const { data } = await parseJsonResponse<{ page: number }>(response);

      expect(data.page).toBe(1);
    });

    it('returns empty cards array when no results', async () => {
      vi.mocked(searchCards).mockResolvedValue({
        cards: [],
        total: 0,
        hasMore: false,
      });
      prismaMock.card.findMany.mockResolvedValue([]);

      const request = createGetRequest('/api/cards', { q: 'zzznomatch' });
      const response = await GET(request);
      const { status, data } = await parseJsonResponse<{ cards: unknown[] }>(response);

      expect(status).toBe(200);
      expect(data.cards).toEqual([]);
    });
  });
});
