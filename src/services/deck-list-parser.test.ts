import { describe, it, expect } from 'vitest';
import {
  parseDeckList,
  validateCommanderDeck,
  getUniqueCardNames,
  generateDeckListText,
} from './deck-list-parser';
import { sampleDeckListTexts } from '@/test/fixtures/cards';

describe('deck-list-parser service', () => {
  describe('parseDeckList', () => {
    it('parses simple card list with quantities', () => {
      const result = parseDeckList(sampleDeckListTexts.simple);

      expect(result.cards).toHaveLength(3);
      expect(result.cards[0]).toEqual({
        name: 'Sol Ring',
        quantity: 1,
        category: 'MAIN',
      });
      expect(result.errors).toHaveLength(0);
    });

    it('parses "1x Card Name" format', () => {
      const result = parseDeckList(sampleDeckListTexts.withQuantityX);

      expect(result.cards).toHaveLength(3);
      expect(result.cards[0]?.name).toBe('Sol Ring');
      expect(result.cards[0]?.quantity).toBe(1);
    });

    it('parses Arena format with set codes', () => {
      const result = parseDeckList(sampleDeckListTexts.arenaFormat);

      expect(result.cards).toHaveLength(3);
      // Should strip set code and collector number
      expect(result.cards[0]?.name).toBe('Sol Ring');
    });

    it('parses Commander section', () => {
      const result = parseDeckList(sampleDeckListTexts.withCommander);

      expect(result.commander).toBeDefined();
      expect(result.commander?.name).toBe('Kenrith, the Returned King');
      expect(result.commander?.category).toBe('COMMANDER');
    });

    it('parses Sideboard section', () => {
      const result = parseDeckList(sampleDeckListTexts.withSideboard);

      const sideboardCards = result.cards.filter((c) => c.category === 'SIDEBOARD');
      expect(sideboardCards).toHaveLength(1);
      expect(sideboardCards[0]?.name).toBe('Counterspell');
    });

    it('handles card type headers without changing category', () => {
      const result = parseDeckList(sampleDeckListTexts.withCardTypeHeaders);

      // Card type headers like "Creatures:" should not change category
      // All cards should stay MAIN (the default)
      const mainCards = result.cards.filter((c) => c.category === 'MAIN');
      expect(mainCards.length).toBe(3); // Sol Ring, Lightning Bolt, Counterspell
    });

    it('skips comment lines starting with //', () => {
      const result = parseDeckList(sampleDeckListTexts.withComments);

      expect(result.cards).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
    });

    it('skips comment lines starting with #', () => {
      const result = parseDeckList('# Comment\n1 Sol Ring');

      expect(result.cards).toHaveLength(1);
    });

    it('records errors for unparseable lines', () => {
      const result = parseDeckList(sampleDeckListTexts.withErrors);

      // Should have errors for: "1" (no card name) and "0 Invalid Quantity Card" (invalid quantity)
      expect(result.errors.length).toBe(2);
      expect(result.errors.some((e) => e.message.includes('Could not parse'))).toBe(true);
    });

    it('protects against ReDoS with long lines', () => {
      const startTime = Date.now();
      const result = parseDeckList(sampleDeckListTexts.longLineForReDoS);
      const elapsed = Date.now() - startTime;

      // Should complete quickly (under 1 second) due to length limit
      expect(elapsed).toBeLessThan(1000);
      // Long line should be rejected
      expect(result.cards).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
    });

    it('skips empty lines', () => {
      const result = parseDeckList('1 Sol Ring\n\n\n1 Lightning Bolt');

      expect(result.cards).toHaveLength(2);
    });

    it('handles Windows line endings', () => {
      const result = parseDeckList('1 Sol Ring\r\n1 Lightning Bolt');

      expect(result.cards).toHaveLength(2);
    });

    it('handles card name with only number in quantity', () => {
      const result = parseDeckList('Sol Ring');

      expect(result.cards).toHaveLength(1);
      expect(result.cards[0]?.quantity).toBe(1);
    });

    it('rejects quantity over 99', () => {
      const result = parseDeckList('100 Sol Ring');

      expect(result.cards).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
    });

    it('rejects quantity of 0', () => {
      const result = parseDeckList('0 Sol Ring');

      expect(result.cards).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
    });

    it('parses category with colon', () => {
      const result = parseDeckList('Sideboard:\n1 Counterspell');

      expect(result.cards[0]?.category).toBe('SIDEBOARD');
    });

    it('parses category without colon', () => {
      const result = parseDeckList('Sideboard\n1 Counterspell');

      expect(result.cards[0]?.category).toBe('SIDEBOARD');
    });

    it('handles "// Commander" format header', () => {
      const result = parseDeckList('// Commander\n1 Kenrith, the Returned King\n// Deck\n1 Sol Ring');

      expect(result.commander?.name).toBe('Kenrith, the Returned King');
      const mainCards = result.cards.filter((c) => c.category === 'MAIN');
      expect(mainCards).toHaveLength(1);
    });

    it('parses maybeboard as CONSIDERING', () => {
      const result = parseDeckList('Maybeboard:\n1 Sol Ring');

      expect(result.cards[0]?.category).toBe('CONSIDERING');
    });

    it('parses considering section', () => {
      const result = parseDeckList('Considering:\n1 Sol Ring');

      expect(result.cards[0]?.category).toBe('CONSIDERING');
    });
  });

  describe('validateCommanderDeck', () => {
    it('warns when no commander is detected', () => {
      const result = parseDeckList('1 Sol Ring\n1 Lightning Bolt');
      const warnings = validateCommanderDeck(result);

      expect(warnings.some((w) => w.includes('No commander detected'))).toBe(true);
    });

    it('warns when deck has more than 99 cards', () => {
      // Create a deck list with 100 cards (excluding commander)
      const cards = Array.from({ length: 100 }, (_, i) => `1 Card ${i}`).join('\n');
      const deckList = `Commander:\n1 Kenrith\n\nDeck:\n${cards}`;
      const result = parseDeckList(deckList);
      const warnings = validateCommanderDeck(result);

      expect(warnings.some((w) => w.includes('100 cards'))).toBe(true);
    });

    it('does not warn when deck has exactly 99 cards', () => {
      const cards = Array.from({ length: 99 }, (_, i) => `1 Card ${i}`).join('\n');
      const deckList = `Commander:\n1 Kenrith\n\nDeck:\n${cards}`;
      const result = parseDeckList(deckList);
      const warnings = validateCommanderDeck(result);

      expect(warnings.some((w) => w.includes('cards'))).toBe(false);
    });

    it('warns about duplicate non-basic-land cards with quantity > 1', () => {
      const result = parseDeckList('Commander:\n1 Kenrith\n\nDeck:\n2 Sol Ring');
      const warnings = validateCommanderDeck(result);

      expect(warnings.some((w) => w.includes('Sol Ring') && w.includes('2 times'))).toBe(true);
    });

    it('allows multiple basic lands', () => {
      const result = parseDeckList('Commander:\n1 Kenrith\n\nDeck:\n10 Island\n10 Plains');
      const warnings = validateCommanderDeck(result);

      // Should not warn about basic lands
      expect(warnings.some((w) => w.includes('Island'))).toBe(false);
      expect(warnings.some((w) => w.includes('Plains'))).toBe(false);
    });

    it('allows Wastes as basic land', () => {
      const result = parseDeckList('Commander:\n1 Kenrith\n\nDeck:\n5 Wastes');
      const warnings = validateCommanderDeck(result);

      expect(warnings.some((w) => w.includes('Wastes'))).toBe(false);
    });

    it('warns about same card appearing multiple times in list', () => {
      const result = parseDeckList('Commander:\n1 Kenrith\n\nDeck:\n1 Sol Ring\n1 Sol Ring');
      const warnings = validateCommanderDeck(result);

      expect(warnings.some((w) => w.includes('Sol Ring') && w.includes('multiple times'))).toBe(
        true
      );
    });
  });

  describe('getUniqueCardNames', () => {
    it('returns unique card names', () => {
      const result = parseDeckList('1 Sol Ring\n1 Lightning Bolt\n1 Sol Ring');
      const names = getUniqueCardNames(result);

      expect(names).toHaveLength(2);
      expect(names).toContain('Sol Ring');
      expect(names).toContain('Lightning Bolt');
    });

    it('includes commander in unique names', () => {
      const result = parseDeckList('Commander:\n1 Kenrith\n\nDeck:\n1 Sol Ring');
      const names = getUniqueCardNames(result);

      expect(names).toContain('Kenrith');
    });

    it('returns empty array for empty deck list', () => {
      const result = parseDeckList('');
      const names = getUniqueCardNames(result);

      expect(names).toHaveLength(0);
    });
  });

  describe('generateDeckListText', () => {
    it('generates text with commander section', () => {
      const commander = { name: 'Kenrith', quantity: 1, category: 'COMMANDER' as const };
      const cards = [{ name: 'Sol Ring', quantity: 1, category: 'MAIN' as const }];
      const text = generateDeckListText(cards, commander);

      expect(text).toContain('Commander:');
      expect(text).toContain('1 Kenrith');
      expect(text).toContain('1 Sol Ring');
    });

    it('groups cards by category', () => {
      const cards = [
        { name: 'Sol Ring', quantity: 1, category: 'MAIN' as const },
        { name: 'Counterspell', quantity: 1, category: 'SIDEBOARD' as const },
      ];
      const text = generateDeckListText(cards);

      expect(text).toContain('MAIN');
      expect(text).toContain('SIDEBOARD');
    });

    it('includes card count in category header', () => {
      const cards = [
        { name: 'Sol Ring', quantity: 1, category: 'MAIN' as const },
        { name: 'Lightning Bolt', quantity: 2, category: 'MAIN' as const },
      ];
      const text = generateDeckListText(cards);

      expect(text).toContain('MAIN (3):');
    });

    it('excludes commander category cards from main list', () => {
      const cards = [
        { name: 'Kenrith', quantity: 1, category: 'COMMANDER' as const },
        { name: 'Sol Ring', quantity: 1, category: 'MAIN' as const },
      ];
      const text = generateDeckListText(cards);

      // Should not have commander in MAIN section
      const lines = text.split('\n');
      const mainSection = lines.findIndex((l) => l.startsWith('MAIN'));
      expect(lines[mainSection + 1]).not.toContain('Kenrith');
    });

    it('handles empty cards array', () => {
      const text = generateDeckListText([]);

      expect(text).toBe('');
    });

    it('handles commander only', () => {
      const commander = { name: 'Kenrith', quantity: 1, category: 'COMMANDER' as const };
      const text = generateDeckListText([], commander);

      expect(text).toContain('Commander:');
      expect(text).toContain('1 Kenrith');
    });

    it('preserves card information in generated text', () => {
      // Note: generateDeckListText outputs a format with "MAIN (N):" headers
      // which aren't recognized by the parser as category headers.
      // This test verifies the generated text contains all the right information.
      const commander = { name: 'Kenrith, the Returned King', quantity: 1, category: 'COMMANDER' as const };
      const cards = [
        { name: 'Sol Ring', quantity: 1, category: 'MAIN' as const },
        { name: 'Lightning Bolt', quantity: 2, category: 'MAIN' as const },
      ];

      const text = generateDeckListText(cards, commander);

      // Verify the text contains all the card names and quantities
      expect(text).toContain('Commander:');
      expect(text).toContain('1 Kenrith, the Returned King');
      expect(text).toContain('1 Sol Ring');
      expect(text).toContain('2 Lightning Bolt');
      expect(text).toContain('MAIN (3):'); // 1 + 2 = 3
    });
  });
});
