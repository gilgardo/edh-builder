import { describe, it, expect } from 'vitest';
import {
  MoxfieldUrlSchema,
  TextImportSchema,
  CardResolutionSchema,
  ParseImportRequestSchema,
  MoxfieldImportRequestSchema,
  MoxfieldCategoryEnum,
} from './import.schema';

describe('import.schema', () => {
  describe('MoxfieldUrlSchema', () => {
    it('accepts valid moxfield URL', () => {
      const result = MoxfieldUrlSchema.safeParse('https://www.moxfield.com/decks/abc123');
      expect(result.success).toBe(true);
    });

    it('accepts URL without www', () => {
      const result = MoxfieldUrlSchema.safeParse('https://moxfield.com/decks/abc123');
      expect(result.success).toBe(true);
    });

    it('accepts bare deck ID (6+ chars)', () => {
      const result = MoxfieldUrlSchema.safeParse('abc123def');
      expect(result.success).toBe(true);
    });

    it('accepts deck ID with underscores and dashes', () => {
      const result = MoxfieldUrlSchema.safeParse('abc_123-def');
      expect(result.success).toBe(true);
    });

    it('rejects empty string', () => {
      const result = MoxfieldUrlSchema.safeParse('');
      expect(result.success).toBe(false);
    });

    it('rejects short deck ID (< 6 chars)', () => {
      const result = MoxfieldUrlSchema.safeParse('abc12');
      expect(result.success).toBe(false);
    });

    it('rejects invalid URL domain', () => {
      const result = MoxfieldUrlSchema.safeParse('https://example.com/decks/abc123');
      expect(result.success).toBe(false);
    });

    it('rejects moxfield URL without decks path', () => {
      const result = MoxfieldUrlSchema.safeParse('https://moxfield.com/users/abc123');
      expect(result.success).toBe(false);
    });

    it('provides helpful error message', () => {
      // Use a short string that will fail the 6+ character deck ID check
      const result = MoxfieldUrlSchema.safeParse('abc');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('valid Moxfield URL');
      }
    });
  });

  describe('TextImportSchema', () => {
    it('accepts valid deck list with cards', () => {
      const deckList = `1 Sol Ring
1 Lightning Bolt
1 Counterspell`;
      const result = TextImportSchema.safeParse(deckList);
      expect(result.success).toBe(true);
    });

    it('accepts deck list with comments and headers', () => {
      const deckList = `// My deck
Commander:
1 Kenrith

Deck:
1 Sol Ring`;
      const result = TextImportSchema.safeParse(deckList);
      expect(result.success).toBe(true);
    });

    it('rejects too short text', () => {
      const result = TextImportSchema.safeParse('short');
      expect(result.success).toBe(false);
    });

    it('rejects text over max length', () => {
      const longText = 'a'.repeat(50001);
      const result = TextImportSchema.safeParse(longText);
      expect(result.success).toBe(false);
    });

    it('rejects text with only comments', () => {
      const result = TextImportSchema.safeParse('// comment\n# another comment');
      expect(result.success).toBe(false);
    });

    it('rejects text with only headers', () => {
      const result = TextImportSchema.safeParse('Commander:\nSideboard:');
      expect(result.success).toBe(false);
    });

    it('accepts text with at least one card line', () => {
      const result = TextImportSchema.safeParse('// Comment\n1 Sol Ring');
      expect(result.success).toBe(true);
    });
  });

  describe('MoxfieldCategoryEnum', () => {
    it('accepts COMMANDER', () => {
      const result = MoxfieldCategoryEnum.safeParse('COMMANDER');
      expect(result.success).toBe(true);
    });

    it('accepts MAIN', () => {
      const result = MoxfieldCategoryEnum.safeParse('MAIN');
      expect(result.success).toBe(true);
    });

    it('accepts SIDEBOARD', () => {
      const result = MoxfieldCategoryEnum.safeParse('SIDEBOARD');
      expect(result.success).toBe(true);
    });

    it('accepts CONSIDERING', () => {
      const result = MoxfieldCategoryEnum.safeParse('CONSIDERING');
      expect(result.success).toBe(true);
    });

    it('rejects invalid category', () => {
      const result = MoxfieldCategoryEnum.safeParse('INVALID');
      expect(result.success).toBe(false);
    });

    it('rejects lowercase category', () => {
      const result = MoxfieldCategoryEnum.safeParse('main');
      expect(result.success).toBe(false);
    });
  });

  describe('CardResolutionSchema', () => {
    it('accepts valid resolved card', () => {
      const result = CardResolutionSchema.safeParse({
        name: 'Sol Ring',
        quantity: 1,
        category: 'MAIN',
        resolved: true,
        scryfallId: 'abc-123',
      });
      expect(result.success).toBe(true);
    });

    it('accepts unresolved card with error', () => {
      const result = CardResolutionSchema.safeParse({
        name: 'Unknown Card',
        quantity: 1,
        category: 'MAIN',
        resolved: false,
        error: 'Card not found',
      });
      expect(result.success).toBe(true);
    });

    it('accepts card with suggestions', () => {
      const result = CardResolutionSchema.safeParse({
        name: 'Sol Rng',
        quantity: 1,
        category: 'MAIN',
        resolved: false,
        suggestions: ['Sol Ring', 'Solar Blaze'],
      });
      expect(result.success).toBe(true);
    });

    it('rejects quantity below 1', () => {
      const result = CardResolutionSchema.safeParse({
        name: 'Sol Ring',
        quantity: 0,
        category: 'MAIN',
        resolved: true,
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid category', () => {
      const result = CardResolutionSchema.safeParse({
        name: 'Sol Ring',
        quantity: 1,
        category: 'INVALID',
        resolved: true,
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing required fields', () => {
      const result = CardResolutionSchema.safeParse({
        name: 'Sol Ring',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('ParseImportRequestSchema', () => {
    it('accepts valid parse request', () => {
      const result = ParseImportRequestSchema.safeParse({
        text: '1 Sol Ring\n1 Lightning Bolt',
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing text field', () => {
      const result = ParseImportRequestSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('rejects invalid text', () => {
      const result = ParseImportRequestSchema.safeParse({
        text: 'too short',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('MoxfieldImportRequestSchema', () => {
    it('accepts valid moxfield request with URL', () => {
      const result = MoxfieldImportRequestSchema.safeParse({
        url: 'https://moxfield.com/decks/abc123',
      });
      expect(result.success).toBe(true);
    });

    it('accepts valid moxfield request with deck ID', () => {
      const result = MoxfieldImportRequestSchema.safeParse({
        url: 'abc123def',
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing url field', () => {
      const result = MoxfieldImportRequestSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('rejects invalid url (too short)', () => {
      // Use a short string that will fail the 6+ character deck ID check
      const result = MoxfieldImportRequestSchema.safeParse({
        url: 'abc',
      });
      expect(result.success).toBe(false);
    });
  });
});
