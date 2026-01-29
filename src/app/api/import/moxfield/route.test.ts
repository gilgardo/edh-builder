import { describe, it, expect, beforeEach } from 'vitest';
import { POST } from './route';
import { createPostRequest, parseJsonResponse } from '@/test/utils/api-test-utils';
import { setAuthenticated, setUnauthenticated } from '@/test/mocks/auth';
import { testUsers } from '@/test/fixtures/decks';

describe('POST /api/import/moxfield', () => {
  beforeEach(() => {
    setAuthenticated({ id: testUsers.user1.id });
  });

  it('returns 401 when unauthenticated', async () => {
    setUnauthenticated();

    const request = createPostRequest('/api/import/moxfield', {
      url: 'https://moxfield.com/decks/abc123',
    });
    const response = await POST(request);
    const { status, data } = await parseJsonResponse(response);

    expect(status).toBe(401);
    expect(data).toHaveProperty('error', 'Unauthorized');
  });

  it('returns 400 for invalid URL (too short)', async () => {
    // Use a string shorter than 6 characters to trigger validation failure
    const request = createPostRequest('/api/import/moxfield', {
      url: 'abc',
    });
    const response = await POST(request);
    const { status, data } = await parseJsonResponse(response);

    expect(status).toBe(400);
    expect(data).toHaveProperty('error', 'Invalid request');
  });

  it('returns 400 for empty URL', async () => {
    const request = createPostRequest('/api/import/moxfield', {
      url: '',
    });
    const response = await POST(request);
    const { status, data } = await parseJsonResponse(response);

    expect(status).toBe(400);
    expect(data).toHaveProperty('error', 'Invalid request');
  });

  it('returns 400 for missing URL field', async () => {
    const request = createPostRequest('/api/import/moxfield', {});
    const response = await POST(request);
    const { status, data } = await parseJsonResponse(response);

    expect(status).toBe(400);
    expect(data).toHaveProperty('error', 'Invalid request');
  });

  it('returns 200 with deck data for valid public deck', async () => {
    const request = createPostRequest('/api/import/moxfield', {
      url: 'https://moxfield.com/decks/abc123',
    });
    const response = await POST(request);
    const { status, data } = await parseJsonResponse<{
      deckName: string;
      commander: object;
      cards: unknown[];
      source: string;
      authorUsername: string;
    }>(response);

    expect(status).toBe(200);
    expect(data.deckName).toBe('Kenrith WUBRG Goodstuff');
    expect(data.commander).toBeDefined();
    expect(data.cards).toBeInstanceOf(Array);
    expect(data.cards.length).toBeGreaterThan(0);
    expect(data.source).toBe('moxfield');
    expect(data.authorUsername).toBe('TestAuthor');
  });

  it('returns 200 with deck data for bare deck ID', async () => {
    const request = createPostRequest('/api/import/moxfield', {
      url: 'abc123',
    });
    const response = await POST(request);
    const { status, data } = await parseJsonResponse<{ deckName: string }>(response);

    expect(status).toBe(200);
    expect(data.deckName).toBe('Kenrith WUBRG Goodstuff');
  });

  it('returns 404 for non-existent deck', async () => {
    const request = createPostRequest('/api/import/moxfield', {
      url: 'notfound123',
    });
    const response = await POST(request);
    const { status, data } = await parseJsonResponse<{ error: string; code: string }>(response);

    expect(status).toBe(404);
    expect(data.code).toBe('DECK_NOT_FOUND');
    expect(data.error).toContain('not found');
  });

  it('returns 403 for private deck', async () => {
    const request = createPostRequest('/api/import/moxfield', {
      url: 'private-deck',
    });
    const response = await POST(request);
    const { status, data } = await parseJsonResponse<{ error: string; code: string }>(response);

    expect(status).toBe(403);
    expect(data.code).toBe('PRIVATE_DECK');
    expect(data.error).toContain('private');
  });

  it('returns card resolution data with scryfall IDs', async () => {
    const request = createPostRequest('/api/import/moxfield', {
      url: 'abc123',
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
      unresolvedCount: number;
    }>(response);

    expect(status).toBe(200);
    // Cards with Scryfall IDs should be resolved
    const resolvedCards = data.cards.filter((c) => c.resolved);
    expect(resolvedCards.length).toBeGreaterThan(0);
    expect(data.resolvedCount).toBeGreaterThan(0);
  });

  it('includes total card count', async () => {
    const request = createPostRequest('/api/import/moxfield', {
      url: 'abc123',
    });
    const response = await POST(request);
    const { status, data } = await parseJsonResponse<{ totalCards: number }>(response);

    expect(status).toBe(200);
    expect(data.totalCards).toBeGreaterThan(0);
  });

  it('includes commander data with resolution', async () => {
    const request = createPostRequest('/api/import/moxfield', {
      url: 'abc123',
    });
    const response = await POST(request);
    const { status, data } = await parseJsonResponse<{
      commander: {
        name: string;
        category: string;
        resolved: boolean;
        scryfallId?: string;
      };
    }>(response);

    expect(status).toBe(200);
    expect(data.commander).toBeDefined();
    expect(data.commander.name).toBe('Kenrith, the Returned King');
    expect(data.commander.category).toBe('COMMANDER');
    expect(data.commander.scryfallId).toBeDefined();
  });
});
