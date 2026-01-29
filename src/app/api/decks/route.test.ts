import { describe, it, expect, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { createGetRequest, createPostRequest, parseJsonResponse } from '@/test/utils/api-test-utils';
import { prismaMock } from '@/test/mocks/prisma';
import { setAuthenticated, setUnauthenticated } from '@/test/mocks/auth';
import { testUsers, getDeckWithUser, createDeckInputs } from '@/test/fixtures/decks';

describe('POST /api/decks', () => {
  beforeEach(() => {
    setAuthenticated({ id: testUsers.user1.id });
  });

  it('returns 401 when unauthenticated', async () => {
    setUnauthenticated();

    const request = createPostRequest('/api/decks', createDeckInputs.valid);
    const response = await POST(request);
    const { status, data } = await parseJsonResponse(response);

    expect(status).toBe(401);
    expect(data).toHaveProperty('error', 'Unauthorized');
  });

  it('returns 400 for empty deck name', async () => {
    const request = createPostRequest('/api/decks', createDeckInputs.invalidEmptyName);
    const response = await POST(request);
    const { status, data } = await parseJsonResponse(response);

    expect(status).toBe(400);
    expect(data).toHaveProperty('error', 'Invalid deck data');
  });

  it('returns 400 for name over 100 characters', async () => {
    const request = createPostRequest('/api/decks', createDeckInputs.invalidLongName);
    const response = await POST(request);
    const { status, data } = await parseJsonResponse(response);

    expect(status).toBe(400);
    expect(data).toHaveProperty('error', 'Invalid deck data');
  });

  it('returns 400 for description over 2000 characters', async () => {
    const request = createPostRequest('/api/decks', createDeckInputs.invalidLongDescription);
    const response = await POST(request);
    const { status, data } = await parseJsonResponse(response);

    expect(status).toBe(400);
    expect(data).toHaveProperty('error', 'Invalid deck data');
  });

  it('creates deck successfully with 201 status', async () => {
    const createdDeck = {
      id: 'new-deck-id',
      name: createDeckInputs.valid.name,
      description: createDeckInputs.valid.description,
      format: createDeckInputs.valid.format,
      isPublic: createDeckInputs.valid.isPublic,
      colorIdentity: [],
      userId: testUsers.user1.id,
      commanderId: null,
      partnerId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: { id: testUsers.user1.id, name: testUsers.user1.name, image: testUsers.user1.image },
      commander: null,
      partner: null,
    };

    prismaMock.user.upsert.mockResolvedValue(testUsers.user1 as never);
    prismaMock.deck.create.mockResolvedValue(createdDeck as never);

    const request = createPostRequest('/api/decks', createDeckInputs.valid);
    const response = await POST(request);
    const { status, data } = await parseJsonResponse<{ deck: typeof createdDeck }>(response);

    expect(status).toBe(201);
    expect(data.deck.name).toBe(createDeckInputs.valid.name);
    expect(data.deck.format).toBe('COMMANDER');
  });

  it('creates deck with minimal input (name only)', async () => {
    const createdDeck = {
      id: 'minimal-deck-id',
      name: createDeckInputs.validMinimal.name,
      description: null,
      format: 'COMMANDER',
      isPublic: false,
      colorIdentity: [],
      userId: testUsers.user1.id,
      commanderId: null,
      partnerId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: { id: testUsers.user1.id, name: testUsers.user1.name, image: testUsers.user1.image },
      commander: null,
      partner: null,
    };

    prismaMock.user.upsert.mockResolvedValue(testUsers.user1 as never);
    prismaMock.deck.create.mockResolvedValue(createdDeck as never);

    const request = createPostRequest('/api/decks', createDeckInputs.validMinimal);
    const response = await POST(request);
    const { status, data } = await parseJsonResponse<{ deck: typeof createdDeck }>(response);

    expect(status).toBe(201);
    expect(data.deck.name).toBe(createDeckInputs.validMinimal.name);
    expect(data.deck.isPublic).toBe(false);
    expect(data.deck.format).toBe('COMMANDER');
  });

  it('returns 500 on database error', async () => {
    prismaMock.user.upsert.mockResolvedValue(testUsers.user1 as never);
    prismaMock.deck.create.mockRejectedValue(new Error('Database connection failed'));

    const request = createPostRequest('/api/decks', createDeckInputs.valid);
    const response = await POST(request);
    const { status, data } = await parseJsonResponse(response);

    expect(status).toBe(500);
    expect(data).toHaveProperty('error', 'Failed to create deck');
  });
});

describe('GET /api/decks', () => {
  beforeEach(() => {
    setAuthenticated({ id: testUsers.user1.id });
  });

  it('returns public decks for unauthenticated users', async () => {
    setUnauthenticated();

    const publicDecks = [getDeckWithUser('publicDeck1'), getDeckWithUser('publicDeck2')];
    prismaMock.deck.findMany.mockResolvedValue(publicDecks as never);
    prismaMock.deck.count.mockResolvedValue(2);

    const request = createGetRequest('/api/decks');
    const response = await GET(request);
    const { status, data } = await parseJsonResponse<{ decks: unknown[]; total: number }>(response);

    expect(status).toBe(200);
    expect(data.decks).toHaveLength(2);
    expect(data.total).toBe(2);
  });

  it('filters by colorIdentity', async () => {
    const azoriusDecks = [getDeckWithUser('publicDeck2')];
    prismaMock.deck.findMany.mockResolvedValue(azoriusDecks as never);
    prismaMock.deck.count.mockResolvedValue(1);

    const request = createGetRequest('/api/decks', { colorIdentity: 'W,U' });
    const response = await GET(request);
    const { status, data } = await parseJsonResponse<{ decks: unknown[] }>(response);

    expect(status).toBe(200);
    expect(prismaMock.deck.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          colorIdentity: { hasEvery: ['W', 'U'] },
        }),
      })
    );
  });

  it('filters by format', async () => {
    prismaMock.deck.findMany.mockResolvedValue([]);
    prismaMock.deck.count.mockResolvedValue(0);

    const request = createGetRequest('/api/decks', { format: 'COMMANDER' });
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(prismaMock.deck.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          format: 'COMMANDER',
        }),
      })
    );
  });

  it('filters by search', async () => {
    prismaMock.deck.findMany.mockResolvedValue([]);
    prismaMock.deck.count.mockResolvedValue(0);

    const request = createGetRequest('/api/decks', { search: 'Kenrith' });
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(prismaMock.deck.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          name: { contains: 'Kenrith', mode: 'insensitive' },
        }),
      })
    );
  });

  it('shows private decks for owner', async () => {
    const allUserDecks = [getDeckWithUser('publicDeck1'), getDeckWithUser('privateDeck1')];
    prismaMock.deck.findMany.mockResolvedValue(allUserDecks as never);
    prismaMock.deck.count.mockResolvedValue(2);

    const request = createGetRequest('/api/decks', { userId: testUsers.user1.id });
    const response = await GET(request);
    const { status, data } = await parseJsonResponse<{ decks: unknown[] }>(response);

    expect(status).toBe(200);
    // Should not filter by isPublic for the owner - verify the call was made
    expect(prismaMock.deck.findMany).toHaveBeenCalled();
    const whereClause = prismaMock.deck.findMany.mock.calls[0]?.[0]?.where;
    expect(whereClause?.userId).toBe(testUsers.user1.id);
    // isPublic should NOT be in the where clause for owner viewing their own decks
    expect(whereClause?.isPublic).toBeUndefined();
  });

  it('only shows public decks for other users', async () => {
    // User1 is authenticated but looking at user2's decks
    prismaMock.deck.findMany.mockResolvedValue([getDeckWithUser('publicDeck2')] as never);
    prismaMock.deck.count.mockResolvedValue(1);

    const request = createGetRequest('/api/decks', { userId: testUsers.user2.id });
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(prismaMock.deck.findMany).toHaveBeenCalled();
    const whereClause = prismaMock.deck.findMany.mock.calls[0]?.[0]?.where;
    expect(whereClause?.userId).toBe(testUsers.user2.id);
    // isPublic should be true when viewing another user's decks
    expect(whereClause?.isPublic).toBe(true);
  });

  it('handles pagination with page and limit', async () => {
    prismaMock.deck.findMany.mockResolvedValue([]);
    prismaMock.deck.count.mockResolvedValue(100);

    const request = createGetRequest('/api/decks', { page: '2', limit: '10' });
    const response = await GET(request);
    const { status, data } = await parseJsonResponse<{
      page: number;
      limit: number;
      totalPages: number;
    }>(response);

    expect(status).toBe(200);
    expect(data.page).toBe(2);
    expect(data.limit).toBe(10);
    expect(data.totalPages).toBe(10);

    expect(prismaMock.deck.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10, // (page - 1) * limit = (2 - 1) * 10 = 10
        take: 10,
      })
    );
  });

  it('returns 400 for invalid filter parameters', async () => {
    const request = createGetRequest('/api/decks', { page: 'invalid' });
    const response = await GET(request);
    const { status, data } = await parseJsonResponse(response);

    expect(status).toBe(400);
    expect(data).toHaveProperty('error', 'Invalid filter parameters');
  });

  it('returns 500 on database error', async () => {
    prismaMock.deck.findMany.mockRejectedValue(new Error('Database error'));

    const request = createGetRequest('/api/decks');
    const response = await GET(request);
    const { status, data } = await parseJsonResponse(response);

    expect(status).toBe(500);
    expect(data).toHaveProperty('error', 'Failed to list decks');
  });
});
