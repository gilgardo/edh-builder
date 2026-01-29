/**
 * Deck and User test fixtures
 */

export interface UserFixture {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

export interface DeckFixture {
  id: string;
  name: string;
  description: string | null;
  format: 'COMMANDER' | 'BRAWL' | 'OATHBREAKER';
  isPublic: boolean;
  colorIdentity: string[];
  userId: string;
  commanderId: string | null;
  partnerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Test users (using CUID-format IDs for schema validation)
export const testUsers = {
  user1: {
    id: 'clh0000000000000user0001',
    name: 'Test User 1',
    email: 'user1@test.com',
    image: null,
  },
  user2: {
    id: 'clh0000000000000user0002',
    name: 'Test User 2',
    email: 'user2@test.com',
    image: null,
  },
  userNoDecks: {
    id: 'clh0000000000000user0003',
    name: 'User With No Decks',
    email: 'nodecks@test.com',
    image: null,
  },
} as const satisfies Record<string, UserFixture>;

// Test decks
export const testDecks: Record<string, DeckFixture> = {
  publicDeck1: {
    id: 'deck-public-1',
    name: 'Public Kenrith Deck',
    description: 'A public 5-color commander deck',
    format: 'COMMANDER',
    isPublic: true,
    colorIdentity: ['W', 'U', 'B', 'R', 'G'],
    userId: testUsers.user1.id,
    commanderId: 'card-kenrith',
    partnerId: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  },
  privateDeck1: {
    id: 'deck-private-1',
    name: 'Private Mono Red',
    description: 'A private mono-red deck',
    format: 'COMMANDER',
    isPublic: false,
    colorIdentity: ['R'],
    userId: testUsers.user1.id,
    commanderId: null,
    partnerId: null,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-10'),
  },
  publicDeck2: {
    id: 'deck-public-2',
    name: 'Azorius Control',
    description: null,
    format: 'COMMANDER',
    isPublic: true,
    colorIdentity: ['W', 'U'],
    userId: testUsers.user2.id,
    commanderId: null,
    partnerId: null,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-05'),
  },
};

// Helper to get deck with user relation
export function getDeckWithUser(deckKey: string) {
  const deck = testDecks[deckKey];
  if (!deck) return null;

  const user = Object.values(testUsers).find((u) => u.id === deck.userId);

  return {
    ...deck,
    user: user
      ? { id: user.id, name: user.name, image: user.image }
      : null,
    commander: deck.commanderId
      ? { id: deck.commanderId, name: 'Kenrith, the Returned King', scryfallId: 'scryfall-123', imageUris: null }
      : null,
    _count: { cards: 99 },
    favorites: [],
  };
}

// Create deck input fixtures
export const createDeckInputs = {
  valid: {
    name: 'My New Deck',
    description: 'A great deck',
    format: 'COMMANDER' as const,
    isPublic: false,
  },
  validMinimal: {
    name: 'Minimal Deck',
  },
  validPublic: {
    name: 'Public Deck',
    isPublic: true,
    format: 'COMMANDER' as const,
  },
  invalidEmptyName: {
    name: '',
  },
  invalidLongName: {
    name: 'A'.repeat(101),
  },
  invalidLongDescription: {
    name: 'Valid Name',
    description: 'A'.repeat(2001),
  },
};
