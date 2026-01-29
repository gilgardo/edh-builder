import { describe, it, expect } from 'vitest';
import { extractDeckId, isValidMoxfieldUrl, fetchMoxfieldDeck } from './moxfield';

describe('moxfield service', () => {
  describe('extractDeckId', () => {
    it('extracts deck ID from full moxfield.com URL', () => {
      expect(extractDeckId('https://www.moxfield.com/decks/abc123')).toBe('abc123');
    });

    it('extracts deck ID from URL without www', () => {
      expect(extractDeckId('https://moxfield.com/decks/abc123')).toBe('abc123');
    });

    it('extracts deck ID from URL with primer suffix', () => {
      expect(extractDeckId('https://www.moxfield.com/decks/abc123/primer')).toBe('abc123');
    });

    it('extracts deck ID from URL with trailing slash', () => {
      expect(extractDeckId('https://moxfield.com/decks/abc123/')).toBe('abc123');
    });

    it('accepts bare deck ID (alphanumeric)', () => {
      expect(extractDeckId('abc123def')).toBe('abc123def');
    });

    it('accepts deck ID with underscores and dashes', () => {
      expect(extractDeckId('abc_123-def')).toBe('abc_123-def');
    });

    it('trims whitespace from input', () => {
      expect(extractDeckId('  abc123  ')).toBe('abc123');
    });

    it('returns null for invalid URL (wrong domain)', () => {
      expect(extractDeckId('https://example.com/decks/abc123')).toBeNull();
    });

    it('returns null for moxfield URL without deck path', () => {
      expect(extractDeckId('https://moxfield.com/users/someone')).toBeNull();
    });

    it('returns null for too short deck ID', () => {
      expect(extractDeckId('abc')).toBeNull();
    });

    it('returns null for invalid characters', () => {
      expect(extractDeckId('abc@123')).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(extractDeckId('')).toBeNull();
    });

    it('returns null for only whitespace', () => {
      expect(extractDeckId('   ')).toBeNull();
    });
  });

  describe('isValidMoxfieldUrl', () => {
    it('returns true for valid moxfield URL', () => {
      expect(isValidMoxfieldUrl('https://www.moxfield.com/decks/abc123')).toBe(true);
    });

    it('returns true for valid deck ID', () => {
      expect(isValidMoxfieldUrl('abc123def')).toBe(true);
    });

    it('returns false for invalid URL', () => {
      expect(isValidMoxfieldUrl('https://example.com/decks/abc123')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isValidMoxfieldUrl('')).toBe(false);
    });

    it('returns false for short ID', () => {
      expect(isValidMoxfieldUrl('abc')).toBe(false);
    });
  });

  describe('fetchMoxfieldDeck', () => {
    it('returns deck data for valid public deck', async () => {
      const result = await fetchMoxfieldDeck('abc123');

      expect('deck' in result).toBe(true);
      if ('deck' in result) {
        expect(result.deck.name).toBe('Kenrith WUBRG Goodstuff');
        expect(result.deck.format).toBe('commander');
        expect(result.deck.authorUsername).toBe('TestAuthor');
        expect(result.deck.commander).toBeDefined();
        expect(result.deck.commander?.name).toBe('Kenrith, the Returned King');
        expect(result.deck.cards.length).toBeGreaterThan(0);
      }
    });

    it('returns deck data when given full URL', async () => {
      const result = await fetchMoxfieldDeck('https://www.moxfield.com/decks/abc123');

      expect('deck' in result).toBe(true);
      if ('deck' in result) {
        expect(result.deck.name).toBe('Kenrith WUBRG Goodstuff');
      }
    });

    it('returns INVALID_URL error for malformed input', async () => {
      const result = await fetchMoxfieldDeck('invalid@url');

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error.code).toBe('INVALID_URL');
        expect(result.error.message).toContain('Invalid Moxfield URL');
      }
    });

    it('returns DECK_NOT_FOUND error for non-existent deck', async () => {
      const result = await fetchMoxfieldDeck('notfound123');

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error.code).toBe('DECK_NOT_FOUND');
        expect(result.error.message).toContain('not found');
      }
    });

    it('returns PRIVATE_DECK error for private deck', async () => {
      const result = await fetchMoxfieldDeck('private-deck');

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error.code).toBe('PRIVATE_DECK');
        expect(result.error.message).toContain('private');
      }
    });

    it('transforms mainboard cards to MAIN category', async () => {
      const result = await fetchMoxfieldDeck('abc123');

      expect('deck' in result).toBe(true);
      if ('deck' in result) {
        const mainCards = result.deck.cards.filter((c) => c.category === 'MAIN');
        expect(mainCards.length).toBeGreaterThan(0);
      }
    });

    it('includes scryfall IDs when available', async () => {
      const result = await fetchMoxfieldDeck('abc123');

      expect('deck' in result).toBe(true);
      if ('deck' in result) {
        const cardsWithScryfallId = result.deck.cards.filter((c) => c.scryfallId);
        expect(cardsWithScryfallId.length).toBeGreaterThan(0);
      }
    });
  });
});
