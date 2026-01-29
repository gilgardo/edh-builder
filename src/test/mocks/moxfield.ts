/**
 * Moxfield API mock fixtures and utilities
 */

export interface MockMoxfieldApiResponse {
  id: string;
  publicId: string;
  name: string;
  description?: string;
  format: string;
  createdByUser?: {
    userName: string;
  };
  commanders?: Record<
    string,
    {
      quantity: number;
      card: { name: string; scryfall_id?: string };
    }
  >;
  mainboard?: Record<
    string,
    {
      quantity: number;
      card: { name: string; scryfall_id?: string };
    }
  >;
  sideboard?: Record<
    string,
    {
      quantity: number;
      card: { name: string; scryfall_id?: string };
    }
  >;
  maybeboard?: Record<
    string,
    {
      quantity: number;
      card: { name: string; scryfall_id?: string };
    }
  >;
}

// Sample Moxfield deck fixtures
export const moxfieldDecks: Record<string, MockMoxfieldApiResponse> = {
  'abc123': {
    id: 'internal-id-abc123',
    publicId: 'abc123',
    name: 'Kenrith WUBRG Goodstuff',
    description: 'A 5-color commander deck',
    format: 'commander',
    createdByUser: { userName: 'TestAuthor' },
    commanders: {
      'card-1': {
        quantity: 1,
        card: {
          name: 'Kenrith, the Returned King',
          scryfall_id: 'e3387c74-345e-6cde-0000-111133334444',
        },
      },
    },
    mainboard: {
      'card-2': {
        quantity: 1,
        card: {
          name: 'Sol Ring',
          scryfall_id: 'e1187a52-123c-4abc-8888-999911112222',
        },
      },
      'card-3': {
        quantity: 1,
        card: {
          name: 'Lightning Bolt',
          scryfall_id: 'e2287b63-234d-5bcd-9999-000022223333',
        },
      },
      'card-4': {
        quantity: 1,
        card: {
          name: 'Counterspell',
          scryfall_id: 'e4487d85-456f-7def-1111-222244445555',
        },
      },
    },
    sideboard: {},
    maybeboard: {},
  },
  'def456': {
    id: 'internal-id-def456',
    publicId: 'def456',
    name: 'Budget Mono-Red',
    format: 'commander',
    createdByUser: { userName: 'BudgetPlayer' },
    commanders: {},
    mainboard: {
      'card-1': {
        quantity: 1,
        card: {
          name: 'Lightning Bolt',
          scryfall_id: 'e2287b63-234d-5bcd-9999-000022223333',
        },
      },
    },
    sideboard: {},
    maybeboard: {},
  },
  'private-deck': {
    id: 'internal-private',
    publicId: 'private-deck',
    name: 'Private Deck',
    format: 'commander',
    commanders: {},
    mainboard: {},
    sideboard: {},
    maybeboard: {},
  },
};

// IDs that should return 404
export const nonExistentDeckIds = ['notfound123', 'doesnotexist'];

// IDs that should return 403 (private)
export const privateDeckIds = ['private-deck', 'secretdeck999'];
