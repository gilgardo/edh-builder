import { describe, it, expect } from 'vitest';
import {
  CreateDeckSchema,
  DeckFormatSchema,
  CardCategorySchema,
  ColorIdentitySchema,
  DeckFiltersSchema,
} from './deck.schema';

describe('deck.schema', () => {
  describe('CreateDeckSchema', () => {
    it('accepts valid deck with all fields', () => {
      const result = CreateDeckSchema.safeParse({
        name: 'My Commander Deck',
        description: 'A great deck',
        format: 'COMMANDER',
        isPublic: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('My Commander Deck');
        expect(result.data.description).toBe('A great deck');
        expect(result.data.format).toBe('COMMANDER');
        expect(result.data.isPublic).toBe(true);
      }
    });

    it('accepts minimal deck with only name', () => {
      const result = CreateDeckSchema.safeParse({
        name: 'Minimal Deck',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Minimal Deck');
        // Check defaults
        expect(result.data.format).toBe('COMMANDER');
        expect(result.data.isPublic).toBe(false);
      }
    });

    it('applies default format COMMANDER', () => {
      const result = CreateDeckSchema.safeParse({ name: 'Test' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.format).toBe('COMMANDER');
      }
    });

    it('applies default isPublic false', () => {
      const result = CreateDeckSchema.safeParse({ name: 'Test' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isPublic).toBe(false);
      }
    });

    it('rejects empty name', () => {
      const result = CreateDeckSchema.safeParse({
        name: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('required');
      }
    });

    it('rejects name over 100 characters', () => {
      const result = CreateDeckSchema.safeParse({
        name: 'A'.repeat(101),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('100 characters');
      }
    });

    it('accepts name exactly 100 characters', () => {
      const result = CreateDeckSchema.safeParse({
        name: 'A'.repeat(100),
      });
      expect(result.success).toBe(true);
    });

    it('rejects description over 2000 characters', () => {
      const result = CreateDeckSchema.safeParse({
        name: 'Valid Name',
        description: 'A'.repeat(2001),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('2000 characters');
      }
    });

    it('accepts description exactly 2000 characters', () => {
      const result = CreateDeckSchema.safeParse({
        name: 'Valid Name',
        description: 'A'.repeat(2000),
      });
      expect(result.success).toBe(true);
    });

    it('accepts BRAWL format', () => {
      const result = CreateDeckSchema.safeParse({
        name: 'Brawl Deck',
        format: 'BRAWL',
      });
      expect(result.success).toBe(true);
    });

    it('accepts OATHBREAKER format', () => {
      const result = CreateDeckSchema.safeParse({
        name: 'Oathbreaker Deck',
        format: 'OATHBREAKER',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid format', () => {
      const result = CreateDeckSchema.safeParse({
        name: 'Invalid Format Deck',
        format: 'STANDARD',
      });
      expect(result.success).toBe(false);
    });

    it('accepts optional commanderId', () => {
      const result = CreateDeckSchema.safeParse({
        name: 'With Commander',
        commanderId: 'clh1234567890123456789012',
      });
      expect(result.success).toBe(true);
    });

    it('accepts optional partnerId', () => {
      const result = CreateDeckSchema.safeParse({
        name: 'With Partner',
        partnerId: 'clh1234567890123456789012',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('DeckFormatSchema', () => {
    it('accepts COMMANDER', () => {
      expect(DeckFormatSchema.safeParse('COMMANDER').success).toBe(true);
    });

    it('accepts BRAWL', () => {
      expect(DeckFormatSchema.safeParse('BRAWL').success).toBe(true);
    });

    it('accepts OATHBREAKER', () => {
      expect(DeckFormatSchema.safeParse('OATHBREAKER').success).toBe(true);
    });

    it('rejects invalid format', () => {
      expect(DeckFormatSchema.safeParse('STANDARD').success).toBe(false);
    });

    it('rejects lowercase', () => {
      expect(DeckFormatSchema.safeParse('commander').success).toBe(false);
    });
  });

  describe('CardCategorySchema', () => {
    it('accepts MAIN', () => {
      expect(CardCategorySchema.safeParse('MAIN').success).toBe(true);
    });

    it('accepts COMMANDER', () => {
      expect(CardCategorySchema.safeParse('COMMANDER').success).toBe(true);
    });

    it('accepts SIDEBOARD', () => {
      expect(CardCategorySchema.safeParse('SIDEBOARD').success).toBe(true);
    });

    it('accepts CONSIDERING', () => {
      expect(CardCategorySchema.safeParse('CONSIDERING').success).toBe(true);
    });

    it('rejects invalid category', () => {
      expect(CardCategorySchema.safeParse('INVALID').success).toBe(false);
    });
  });

  describe('ColorIdentitySchema', () => {
    it('accepts W', () => {
      expect(ColorIdentitySchema.safeParse('W').success).toBe(true);
    });

    it('accepts U', () => {
      expect(ColorIdentitySchema.safeParse('U').success).toBe(true);
    });

    it('accepts B', () => {
      expect(ColorIdentitySchema.safeParse('B').success).toBe(true);
    });

    it('accepts R', () => {
      expect(ColorIdentitySchema.safeParse('R').success).toBe(true);
    });

    it('accepts G', () => {
      expect(ColorIdentitySchema.safeParse('G').success).toBe(true);
    });

    it('rejects invalid color', () => {
      expect(ColorIdentitySchema.safeParse('X').success).toBe(false);
    });

    it('rejects lowercase', () => {
      expect(ColorIdentitySchema.safeParse('w').success).toBe(false);
    });
  });

  describe('DeckFiltersSchema', () => {
    it('accepts empty filters with defaults', () => {
      const result = DeckFiltersSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it('accepts search filter', () => {
      const result = DeckFiltersSchema.safeParse({ search: 'Kenrith' });
      expect(result.success).toBe(true);
    });

    it('accepts colorIdentity filter', () => {
      const result = DeckFiltersSchema.safeParse({ colorIdentity: ['W', 'U'] });
      expect(result.success).toBe(true);
    });

    it('accepts format filter', () => {
      const result = DeckFiltersSchema.safeParse({ format: 'COMMANDER' });
      expect(result.success).toBe(true);
    });

    it('accepts isPublic filter', () => {
      const result = DeckFiltersSchema.safeParse({ isPublic: true });
      expect(result.success).toBe(true);
    });

    it('accepts page filter', () => {
      const result = DeckFiltersSchema.safeParse({ page: 5 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(5);
      }
    });

    it('rejects page below 1', () => {
      const result = DeckFiltersSchema.safeParse({ page: 0 });
      expect(result.success).toBe(false);
    });

    it('accepts limit filter', () => {
      const result = DeckFiltersSchema.safeParse({ limit: 50 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
      }
    });

    it('rejects limit over 100', () => {
      const result = DeckFiltersSchema.safeParse({ limit: 101 });
      expect(result.success).toBe(false);
    });

    it('rejects limit below 1', () => {
      const result = DeckFiltersSchema.safeParse({ limit: 0 });
      expect(result.success).toBe(false);
    });

    it('accepts userId filter', () => {
      const result = DeckFiltersSchema.safeParse({ userId: 'clh1234567890123456789012' });
      expect(result.success).toBe(true);
    });
  });
});
