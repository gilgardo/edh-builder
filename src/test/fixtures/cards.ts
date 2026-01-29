/**
 * Card test fixtures
 */

import type { MoxfieldCategory } from '@/services/moxfield';

export interface CardFixture {
  name: string;
  quantity: number;
  category: MoxfieldCategory;
  scryfallId?: string;
}

// Basic cards for testing
export const basicCards: CardFixture[] = [
  { name: 'Sol Ring', quantity: 1, category: 'MAIN', scryfallId: 'e1187a52-123c-4abc-8888-999911112222' },
  { name: 'Lightning Bolt', quantity: 1, category: 'MAIN', scryfallId: 'e2287b63-234d-5bcd-9999-000022223333' },
  { name: 'Counterspell', quantity: 1, category: 'MAIN', scryfallId: 'e4487d85-456f-7def-1111-222244445555' },
];

// Commander cards for testing
export const commanderCards: CardFixture[] = [
  {
    name: 'Kenrith, the Returned King',
    quantity: 1,
    category: 'COMMANDER',
    scryfallId: 'e3387c74-345e-6cde-0000-111133334444',
  },
];

// Basic lands
export const basicLands: CardFixture[] = [
  { name: 'Island', quantity: 10, category: 'MAIN' },
  { name: 'Plains', quantity: 10, category: 'MAIN' },
  { name: 'Swamp', quantity: 10, category: 'MAIN' },
  { name: 'Mountain', quantity: 10, category: 'MAIN' },
  { name: 'Forest', quantity: 10, category: 'MAIN' },
];

// Sample deck list texts for parsing tests
export const sampleDeckListTexts = {
  simple: `1 Sol Ring
1 Lightning Bolt
1 Counterspell`,

  withQuantityX: `1x Sol Ring
1x Lightning Bolt
1x Counterspell`,

  withCommander: `Commander:
1 Kenrith, the Returned King

Deck:
1 Sol Ring
1 Lightning Bolt`,

  withSideboard: `1 Sol Ring
1 Lightning Bolt

Sideboard:
1 Counterspell`,

  arenaFormat: `1 Sol Ring (C21) 266
1 Lightning Bolt (A25) 141
1 Counterspell (MH2) 267`,

  withComments: `// This is my deck
# Another comment
1 Sol Ring
1 Lightning Bolt`,

  withCardTypeHeaders: `Creatures (10):
1 Sol Ring

Instants:
1 Lightning Bolt
1 Counterspell`,

  withErrors: `1 Sol Ring
1
1 Lightning Bolt
0 Invalid Quantity Card`,

  longLineForReDoS: `1 ${'a'.repeat(250)}`,
};
