/**
 * Scryfall API mock fixtures and utilities
 */

export interface MockScryfallCard {
  id: string;
  oracle_id: string;
  name: string;
  mana_cost?: string;
  cmc: number;
  type_line: string;
  oracle_text?: string;
  colors?: string[];
  color_identity: string[];
  power?: string;
  toughness?: string;
  loyalty?: string;
  legalities: {
    commander: string;
  };
  image_uris?: {
    small: string;
    normal: string;
    large: string;
    png: string;
    art_crop: string;
    border_crop: string;
  };
  set: string;
  set_name: string;
  rarity: string;
  prices: {
    usd: string | null;
  };
  uri: string;
  scryfall_uri: string;
  layout: string;
  keywords?: string[];
  artist?: string;
  released_at?: string;
}

// Sample card fixtures
export const scryfallCards: Record<string, MockScryfallCard> = {
  'sol-ring': {
    id: 'e1187a52-123c-4abc-8888-999911112222',
    oracle_id: 'aaaaaa-bbbb-cccc-dddd-eeeeeeeeee01',
    name: 'Sol Ring',
    mana_cost: '{1}',
    cmc: 1,
    type_line: 'Artifact',
    oracle_text: '{T}: Add {C}{C}.',
    colors: [],
    color_identity: [],
    legalities: { commander: 'legal' },
    image_uris: {
      small: 'https://cards.scryfall.io/small/sol-ring.jpg',
      normal: 'https://cards.scryfall.io/normal/sol-ring.jpg',
      large: 'https://cards.scryfall.io/large/sol-ring.jpg',
      png: 'https://cards.scryfall.io/png/sol-ring.png',
      art_crop: 'https://cards.scryfall.io/art_crop/sol-ring.jpg',
      border_crop: 'https://cards.scryfall.io/border_crop/sol-ring.jpg',
    },
    set: 'c21',
    set_name: 'Commander 2021',
    rarity: 'uncommon',
    prices: { usd: '3.00' },
    uri: 'https://api.scryfall.com/cards/e1187a52-123c-4abc-8888-999911112222',
    scryfall_uri: 'https://scryfall.com/card/c21/266/sol-ring',
    layout: 'normal',
    keywords: [],
  },
  'lightning-bolt': {
    id: 'e2287b63-234d-5bcd-9999-000022223333',
    oracle_id: 'aaaaaa-bbbb-cccc-dddd-eeeeeeeeee02',
    name: 'Lightning Bolt',
    mana_cost: '{R}',
    cmc: 1,
    type_line: 'Instant',
    oracle_text: 'Lightning Bolt deals 3 damage to any target.',
    colors: ['R'],
    color_identity: ['R'],
    legalities: { commander: 'legal' },
    image_uris: {
      small: 'https://cards.scryfall.io/small/lightning-bolt.jpg',
      normal: 'https://cards.scryfall.io/normal/lightning-bolt.jpg',
      large: 'https://cards.scryfall.io/large/lightning-bolt.jpg',
      png: 'https://cards.scryfall.io/png/lightning-bolt.png',
      art_crop: 'https://cards.scryfall.io/art_crop/lightning-bolt.jpg',
      border_crop: 'https://cards.scryfall.io/border_crop/lightning-bolt.jpg',
    },
    set: 'a25',
    set_name: 'Masters 25',
    rarity: 'uncommon',
    prices: { usd: '2.50' },
    uri: 'https://api.scryfall.com/cards/e2287b63-234d-5bcd-9999-000022223333',
    scryfall_uri: 'https://scryfall.com/card/a25/141/lightning-bolt',
    layout: 'normal',
    keywords: [],
  },
  'kenrith': {
    id: 'e3387c74-345e-6cde-0000-111133334444',
    oracle_id: 'aaaaaa-bbbb-cccc-dddd-eeeeeeeeee03',
    name: 'Kenrith, the Returned King',
    mana_cost: '{4}{W}',
    cmc: 5,
    type_line: 'Legendary Creature — Human Noble',
    oracle_text:
      '{R}: All creatures gain trample and haste until end of turn.\n{1}{G}: Put a +1/+1 counter on target creature.\n{2}{W}: Target player gains 5 life.\n{3}{U}: Target player draws a card.\n{4}{B}: Put target creature card from a graveyard onto the battlefield under its owner\'s control.',
    colors: ['W'],
    color_identity: ['W', 'U', 'B', 'R', 'G'],
    power: '5',
    toughness: '5',
    legalities: { commander: 'legal' },
    image_uris: {
      small: 'https://cards.scryfall.io/small/kenrith.jpg',
      normal: 'https://cards.scryfall.io/normal/kenrith.jpg',
      large: 'https://cards.scryfall.io/large/kenrith.jpg',
      png: 'https://cards.scryfall.io/png/kenrith.png',
      art_crop: 'https://cards.scryfall.io/art_crop/kenrith.jpg',
      border_crop: 'https://cards.scryfall.io/border_crop/kenrith.jpg',
    },
    set: 'eld',
    set_name: 'Throne of Eldraine',
    rarity: 'mythic',
    prices: { usd: '8.00' },
    uri: 'https://api.scryfall.com/cards/e3387c74-345e-6cde-0000-111133334444',
    scryfall_uri: 'https://scryfall.com/card/eld/303/kenrith-the-returned-king',
    layout: 'normal',
    keywords: [],
  },
  'counterspell': {
    id: 'e4487d85-456f-7def-1111-222244445555',
    oracle_id: 'aaaaaa-bbbb-cccc-dddd-eeeeeeeeee04',
    name: 'Counterspell',
    mana_cost: '{U}{U}',
    cmc: 2,
    type_line: 'Instant',
    oracle_text: 'Counter target spell.',
    colors: ['U'],
    color_identity: ['U'],
    legalities: { commander: 'legal' },
    image_uris: {
      small: 'https://cards.scryfall.io/small/counterspell.jpg',
      normal: 'https://cards.scryfall.io/normal/counterspell.jpg',
      large: 'https://cards.scryfall.io/large/counterspell.jpg',
      png: 'https://cards.scryfall.io/png/counterspell.png',
      art_crop: 'https://cards.scryfall.io/art_crop/counterspell.jpg',
      border_crop: 'https://cards.scryfall.io/border_crop/counterspell.jpg',
    },
    set: 'mh2',
    set_name: 'Modern Horizons 2',
    rarity: 'uncommon',
    prices: { usd: '1.50' },
    uri: 'https://api.scryfall.com/cards/e4487d85-456f-7def-1111-222244445555',
    scryfall_uri: 'https://scryfall.com/card/mh2/267/counterspell',
    layout: 'normal',
    keywords: [],
  },
  'island': {
    id: 'e5587e96-567g-8ef0-2222-333355556666',
    oracle_id: 'aaaaaa-bbbb-cccc-dddd-eeeeeeeeee05',
    name: 'Island',
    cmc: 0,
    type_line: 'Basic Land — Island',
    colors: [],
    color_identity: [],
    legalities: { commander: 'legal' },
    image_uris: {
      small: 'https://cards.scryfall.io/small/island.jpg',
      normal: 'https://cards.scryfall.io/normal/island.jpg',
      large: 'https://cards.scryfall.io/large/island.jpg',
      png: 'https://cards.scryfall.io/png/island.png',
      art_crop: 'https://cards.scryfall.io/art_crop/island.jpg',
      border_crop: 'https://cards.scryfall.io/border_crop/island.jpg',
    },
    set: 'znr',
    set_name: 'Zendikar Rising',
    rarity: 'common',
    prices: { usd: '0.10' },
    uri: 'https://api.scryfall.com/cards/e5587e96-567g-8ef0-2222-333355556666',
    scryfall_uri: 'https://scryfall.com/card/znr/381/island',
    layout: 'normal',
    keywords: [],
  },
};

// Helper to look up card by name (case-insensitive)
export function getScryfallCardByName(name: string): MockScryfallCard | undefined {
  const lowerName = name.toLowerCase();
  return Object.values(scryfallCards).find((card) => card.name.toLowerCase() === lowerName);
}

// Helper to look up card by Scryfall ID
export function getScryfallCardById(id: string): MockScryfallCard | undefined {
  return Object.values(scryfallCards).find((card) => card.id === id);
}

// Helper to create a collection response (supports both name and id identifiers)
export function createCollectionResponse(
  identifiers: Array<{ name?: string; id?: string }>
) {
  const data: MockScryfallCard[] = [];
  const notFound: Array<{ name?: string; id?: string }> = [];

  for (const identifier of identifiers) {
    let card: MockScryfallCard | undefined;

    if (identifier.id) {
      card = getScryfallCardById(identifier.id);
    } else if (identifier.name) {
      card = getScryfallCardByName(identifier.name);
    }

    if (card) {
      data.push(card);
    } else {
      notFound.push(identifier);
    }
  }

  return { object: 'list' as const, data, not_found: notFound };
}

// Helper to create autocomplete response
export function createAutocompleteResponse(_query: string, suggestions: string[]) {
  return {
    object: 'catalog',
    total_values: suggestions.length,
    data: suggestions,
  };
}
