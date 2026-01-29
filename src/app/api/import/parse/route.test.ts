import { describe, it, expect, beforeEach } from 'vitest';
import { POST } from './route';
import { createPostRequest, parseJsonResponse } from '@/test/utils/api-test-utils';
import { setAuthenticated, setUnauthenticated } from '@/test/mocks/auth';
import { testUsers } from '@/test/fixtures/decks';
import { sampleDeckListTexts } from '@/test/fixtures/cards';

describe('POST /api/import/parse', () => {
  beforeEach(() => {
    setAuthenticated({ id: testUsers.user1.id });
  });

  it('returns 401 when unauthenticated', async () => {
    setUnauthenticated();

    const request = createPostRequest('/api/import/parse', {
      text: sampleDeckListTexts.simple,
    });
    const response = await POST(request);
    const { status, data } = await parseJsonResponse(response);

    expect(status).toBe(401);
    expect(data).toHaveProperty('error', 'Unauthorized');
  });

  it('returns 400 for empty text', async () => {
    const request = createPostRequest('/api/import/parse', {
      text: '',
    });
    const response = await POST(request);
    const { status, data } = await parseJsonResponse(response);

    expect(status).toBe(400);
    expect(data).toHaveProperty('error', 'Invalid request');
  });

  it('returns 400 for text too short', async () => {
    const request = createPostRequest('/api/import/parse', {
      text: 'short',
    });
    const response = await POST(request);
    const { status, data } = await parseJsonResponse(response);

    expect(status).toBe(400);
    expect(data).toHaveProperty('error', 'Invalid request');
  });

  it('returns 400 for missing text field', async () => {
    const request = createPostRequest('/api/import/parse', {});
    const response = await POST(request);
    const { status, data } = await parseJsonResponse(response);

    expect(status).toBe(400);
    expect(data).toHaveProperty('error', 'Invalid request');
  });

  it('returns 200 with parsed cards for valid deck list', async () => {
    const request = createPostRequest('/api/import/parse', {
      text: sampleDeckListTexts.simple,
    });
    const response = await POST(request);
    const { status, data } = await parseJsonResponse<{
      cards: Array<{
        name: string;
        quantity: number;
        category: string;
        resolved: boolean;
      }>;
      source: string;
    }>(response);

    expect(status).toBe(200);
    expect(data.cards).toBeInstanceOf(Array);
    expect(data.cards.length).toBe(3);
    expect(data.source).toBe('text');
  });

  it('resolves known cards via Scryfall', async () => {
    const request = createPostRequest('/api/import/parse', {
      text: '1 Sol Ring\n1 Lightning Bolt',
    });
    const response = await POST(request);
    const { status, data } = await parseJsonResponse<{
      cards: Array<{
        name: string;
        resolved: boolean;
        scryfallId?: string;
        scryfallCard?: object;
      }>;
      resolvedCount: number;
    }>(response);

    expect(status).toBe(200);
    // Sol Ring and Lightning Bolt are in our mock fixtures
    const solRing = data.cards.find((c) => c.name === 'Sol Ring');
    expect(solRing?.resolved).toBe(true);
    expect(solRing?.scryfallId).toBeDefined();
    expect(solRing?.scryfallCard).toBeDefined();
    expect(data.resolvedCount).toBeGreaterThan(0);
  });

  it('reports unresolved cards with error', async () => {
    const request = createPostRequest('/api/import/parse', {
      text: '1 Sol Ring\n1 Made Up Card Name',
    });
    const response = await POST(request);
    const { status, data } = await parseJsonResponse<{
      cards: Array<{
        name: string;
        resolved: boolean;
        error?: string;
      }>;
      unresolvedCount: number;
    }>(response);

    expect(status).toBe(200);
    const unresolvedCard = data.cards.find((c) => c.name === 'Made Up Card Name');
    expect(unresolvedCard?.resolved).toBe(false);
    expect(unresolvedCard?.error).toBeDefined();
    expect(data.unresolvedCount).toBeGreaterThan(0);
  });

  it('parses commander section', async () => {
    const request = createPostRequest('/api/import/parse', {
      text: sampleDeckListTexts.withCommander,
    });
    const response = await POST(request);
    const { status, data } = await parseJsonResponse<{
      commander?: {
        name: string;
        category: string;
      };
    }>(response);

    expect(status).toBe(200);
    expect(data.commander).toBeDefined();
    expect(data.commander?.name).toContain('Kenrith');
    expect(data.commander?.category).toBe('COMMANDER');
  });

  it('includes validation warnings', async () => {
    // Deck list without commander should trigger warning
    const request = createPostRequest('/api/import/parse', {
      text: sampleDeckListTexts.simple,
    });
    const response = await POST(request);
    const { status, data } = await parseJsonResponse<{
      warnings: string[];
    }>(response);

    expect(status).toBe(200);
    expect(data.warnings).toBeInstanceOf(Array);
    // Should warn about no commander
    expect(data.warnings.some((w) => w.includes('commander'))).toBe(true);
  });

  it('includes parse errors in warnings', async () => {
    const request = createPostRequest('/api/import/parse', {
      text: sampleDeckListTexts.withErrors,
    });
    const response = await POST(request);
    const { status, data } = await parseJsonResponse<{
      warnings: string[];
    }>(response);

    expect(status).toBe(200);
    // Should include line-level parse errors
    expect(data.warnings.some((w) => w.includes('Line'))).toBe(true);
  });

  it('calculates total cards correctly', async () => {
    const request = createPostRequest('/api/import/parse', {
      text: '1 Sol Ring\n2 Lightning Bolt\n3 Counterspell',
    });
    const response = await POST(request);
    const { status, data } = await parseJsonResponse<{
      totalCards: number;
    }>(response);

    expect(status).toBe(200);
    expect(data.totalCards).toBe(6); // 1 + 2 + 3
  });

  it('handles Arena format', async () => {
    const request = createPostRequest('/api/import/parse', {
      text: sampleDeckListTexts.arenaFormat,
    });
    const response = await POST(request);
    const { status, data } = await parseJsonResponse<{
      cards: Array<{ name: string }>;
    }>(response);

    expect(status).toBe(200);
    // Should have stripped set codes
    expect(data.cards.some((c) => c.name === 'Sol Ring')).toBe(true);
  });

  it('handles "1x Card" format', async () => {
    const request = createPostRequest('/api/import/parse', {
      text: sampleDeckListTexts.withQuantityX,
    });
    const response = await POST(request);
    const { status, data } = await parseJsonResponse<{
      cards: Array<{ name: string; quantity: number }>;
    }>(response);

    expect(status).toBe(200);
    expect(data.cards[0]?.quantity).toBe(1);
    expect(data.cards[0]?.name).toBe('Sol Ring');
  });

  it('skips comment lines', async () => {
    const request = createPostRequest('/api/import/parse', {
      text: sampleDeckListTexts.withComments,
    });
    const response = await POST(request);
    const { status, data } = await parseJsonResponse<{
      cards: Array<{ name: string }>;
    }>(response);

    expect(status).toBe(200);
    // Comments should be skipped, only cards parsed
    expect(data.cards.length).toBe(2);
  });

  it('handles sideboard section', async () => {
    const request = createPostRequest('/api/import/parse', {
      text: sampleDeckListTexts.withSideboard,
    });
    const response = await POST(request);
    const { status, data } = await parseJsonResponse<{
      cards: Array<{ name: string; category: string }>;
    }>(response);

    expect(status).toBe(200);
    const sideboardCards = data.cards.filter((c) => c.category === 'SIDEBOARD');
    expect(sideboardCards.length).toBe(1);
    expect(sideboardCards[0]?.name).toBe('Counterspell');
  });
});
