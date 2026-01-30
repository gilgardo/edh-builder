import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isCardStale,
  isTimestampStale,
  mapScryfallToCard,
  CACHE_CONFIG,
} from './card-cache';
import type { Card as PrismaCard } from '@prisma/client';
import type { ScryfallCard } from '@/types/scryfall.types';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    card: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
      count: vi.fn(),
    },
  },
}));

// Mock scryfall service
vi.mock('./scryfall', () => ({
  getCard: vi.fn(),
  getCardsByIds: vi.fn(),
  getCardByName: vi.fn(),
}));

describe('card-cache service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isCardStale', () => {
    it('returns false for a freshly cached card', () => {
      const card = {
        cachedAt: new Date(),
      } as PrismaCard;

      expect(isCardStale(card)).toBe(false);
    });

    it('returns false for a card cached within threshold', () => {
      const daysAgo = CACHE_CONFIG.staleAfterDays - 1;
      const card = {
        cachedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      } as PrismaCard;

      expect(isCardStale(card)).toBe(false);
    });

    it('returns true for a card older than threshold', () => {
      const daysAgo = CACHE_CONFIG.staleAfterDays + 1;
      const card = {
        cachedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      } as PrismaCard;

      expect(isCardStale(card)).toBe(true);
    });

    it('returns true for a card exactly at threshold', () => {
      const daysAgo = CACHE_CONFIG.staleAfterDays;
      const card = {
        cachedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000 - 1),
      } as PrismaCard;

      expect(isCardStale(card)).toBe(true);
    });
  });

  describe('isTimestampStale', () => {
    it('returns false for current timestamp', () => {
      expect(isTimestampStale(new Date())).toBe(false);
    });

    it('returns false for timestamp within threshold', () => {
      const daysAgo = CACHE_CONFIG.staleAfterDays - 1;
      const timestamp = Date.now() - daysAgo * 24 * 60 * 60 * 1000;
      expect(isTimestampStale(timestamp)).toBe(false);
    });

    it('returns true for old timestamp', () => {
      const daysAgo = CACHE_CONFIG.staleAfterDays + 1;
      const timestamp = Date.now() - daysAgo * 24 * 60 * 60 * 1000;
      expect(isTimestampStale(timestamp)).toBe(true);
    });

    it('handles Date objects', () => {
      const daysAgo = CACHE_CONFIG.staleAfterDays + 1;
      const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      expect(isTimestampStale(date)).toBe(true);
    });
  });

  describe('mapScryfallToCard', () => {
    const baseScryfallCard: ScryfallCard = {
      id: 'test-id-123',
      oracle_id: 'oracle-123',
      name: 'Test Card',
      mana_cost: '{2}{W}{W}',
      cmc: 4,
      type_line: 'Creature — Angel',
      oracle_text: 'Flying',
      colors: ['W'],
      color_identity: ['W'],
      power: '4',
      toughness: '4',
      legalities: {
        commander: 'legal',
        standard: 'legal',
        future: 'legal',
        historic: 'legal',
        gladiator: 'legal',
        pioneer: 'legal',
        explorer: 'legal',
        modern: 'legal',
        legacy: 'legal',
        pauper: 'not_legal',
        vintage: 'legal',
        penny: 'legal',
        oathbreaker: 'legal',
        brawl: 'legal',
        alchemy: 'legal',
        paupercommander: 'not_legal',
        duel: 'legal',
        oldschool: 'not_legal',
        premodern: 'not_legal',
        predh: 'legal',
      },
      image_uris: {
        small: 'https://example.com/small.jpg',
        normal: 'https://example.com/normal.jpg',
        large: 'https://example.com/large.jpg',
        png: 'https://example.com/png.png',
        art_crop: 'https://example.com/art.jpg',
        border_crop: 'https://example.com/border.jpg',
      },
      set: 'test',
      set_name: 'Test Set',
      rarity: 'rare',
      prices: {
        usd: '10.00',
        tix: '2.50',
      },
      uri: 'https://scryfall.com/card/test/1',
      scryfall_uri: 'https://scryfall.com/card/test/1',
      layout: 'normal',
    };

    it('maps basic card fields correctly', () => {
      const result = mapScryfallToCard(baseScryfallCard);

      expect(result.scryfallId).toBe('test-id-123');
      expect(result.oracleId).toBe('oracle-123');
      expect(result.name).toBe('Test Card');
      expect(result.manaCost).toBe('{2}{W}{W}');
      expect(result.cmc).toBe(4);
      expect(result.typeLine).toBe('Creature — Angel');
      expect(result.oracleText).toBe('Flying');
    });

    it('maps colors as comma-separated string', () => {
      const result = mapScryfallToCard(baseScryfallCard);
      expect(result.colors).toBe('W');
      expect(result.colorIdentity).toBe('W');
    });

    it('maps multi-color cards correctly', () => {
      const multiColorCard = {
        ...baseScryfallCard,
        colors: ['W', 'U', 'B'],
        color_identity: ['W', 'U', 'B'],
      };
      const result = mapScryfallToCard(multiColorCard);
      expect(result.colors).toBe('W,U,B');
      expect(result.colorIdentity).toBe('W,U,B');
    });

    it('maps creature stats correctly', () => {
      const result = mapScryfallToCard(baseScryfallCard);
      expect(result.power).toBe('4');
      expect(result.toughness).toBe('4');
      expect(result.loyalty).toBeNull();
    });

    it('maps planeswalker loyalty correctly', () => {
      const planeswalker = {
        ...baseScryfallCard,
        type_line: 'Legendary Planeswalker — Test',
        power: undefined,
        toughness: undefined,
        loyalty: '5',
        oracle_text: 'Can be your commander.',
      };
      const result = mapScryfallToCard(planeswalker);
      expect(result.loyalty).toBe('5');
      expect(result.power).toBeNull();
      expect(result.toughness).toBeNull();
    });

    it('correctly identifies legal commanders (legendary creature)', () => {
      const legendaryCreature = {
        ...baseScryfallCard,
        type_line: 'Legendary Creature — Angel',
      };
      const result = mapScryfallToCard(legendaryCreature);
      expect(result.isLegalCommander).toBe(true);
    });

    it('correctly identifies legal commanders (planeswalker with ability)', () => {
      const planeswalkerCommander = {
        ...baseScryfallCard,
        type_line: 'Legendary Planeswalker — Test',
        oracle_text: '+1: Do something.\nThis card can be your commander.',
      };
      const result = mapScryfallToCard(planeswalkerCommander);
      expect(result.isLegalCommander).toBe(true);
    });

    it('non-legendary creatures are not commanders', () => {
      const nonLegendary = {
        ...baseScryfallCard,
        type_line: 'Creature — Angel',
      };
      const result = mapScryfallToCard(nonLegendary);
      expect(result.isLegalCommander).toBe(false);
    });

    it('maps prices correctly', () => {
      const result = mapScryfallToCard(baseScryfallCard);
      expect(result.priceUsd).toBe(10.0);
      expect(result.priceTix).toBe(2.5);
    });

    it('handles missing prices', () => {
      const noPrices = {
        ...baseScryfallCard,
        prices: {},
      };
      const result = mapScryfallToCard(noPrices);
      expect(result.priceUsd).toBeNull();
      expect(result.priceTix).toBeNull();
    });

    it('maps set info correctly', () => {
      const result = mapScryfallToCard(baseScryfallCard);
      expect(result.setCode).toBe('test');
      expect(result.setName).toBe('Test Set');
      expect(result.rarity).toBe('rare');
    });

    it('normalizes rarity values', () => {
      const mythicCard = { ...baseScryfallCard, rarity: 'mythic' };
      expect(mapScryfallToCard(mythicCard).rarity).toBe('mythic');

      const commonCard = { ...baseScryfallCard, rarity: 'common' };
      expect(mapScryfallToCard(commonCard).rarity).toBe('common');

      const unknownRarity = { ...baseScryfallCard, rarity: 'unknown' };
      expect(mapScryfallToCard(unknownRarity).rarity).toBe('common');
    });

    it('handles double-faced cards (transform)', () => {
      const transformCard: ScryfallCard = {
        ...baseScryfallCard,
        name: 'Front Face // Back Face',
        layout: 'transform',
        mana_cost: undefined, // DFCs don't have top-level mana_cost
        image_uris: undefined,
        card_faces: [
          {
            name: 'Front Face',
            mana_cost: '{1}{W}',
            type_line: 'Creature — Human',
            oracle_text: 'Transform ability',
            image_uris: {
              small: 'https://example.com/front-small.jpg',
              normal: 'https://example.com/front-normal.jpg',
              large: 'https://example.com/front-large.jpg',
              png: 'https://example.com/front.png',
              art_crop: 'https://example.com/front-art.jpg',
              border_crop: 'https://example.com/front-border.jpg',
            },
          },
          {
            name: 'Back Face',
            type_line: 'Creature — Werewolf',
            oracle_text: 'Back side abilities',
            image_uris: {
              small: 'https://example.com/back-small.jpg',
              normal: 'https://example.com/back-normal.jpg',
              large: 'https://example.com/back-large.jpg',
              png: 'https://example.com/back.png',
              art_crop: 'https://example.com/back-art.jpg',
              border_crop: 'https://example.com/back-border.jpg',
            },
          },
        ],
      };

      const result = mapScryfallToCard(transformCard);

      expect(result.hasBackFace).toBe(true);
      expect(result.imageUris).toEqual(transformCard.card_faces?.[0]?.image_uris);
      expect(result.backFaceImageUris).toEqual(transformCard.card_faces?.[1]?.image_uris);
      expect(result.manaCost).toBe('{1}{W}');
    });

    it('handles modal DFC cards', () => {
      const modalDfcCard: ScryfallCard = {
        ...baseScryfallCard,
        name: 'Side A // Side B',
        layout: 'modal_dfc',
        image_uris: undefined,
        card_faces: [
          {
            name: 'Side A',
            mana_cost: '{2}{U}',
            type_line: 'Instant',
            image_uris: {
              small: 'https://example.com/a-small.jpg',
              normal: 'https://example.com/a-normal.jpg',
              large: 'https://example.com/a-large.jpg',
              png: 'https://example.com/a.png',
              art_crop: 'https://example.com/a-art.jpg',
              border_crop: 'https://example.com/a-border.jpg',
            },
          },
          {
            name: 'Side B',
            mana_cost: '{1}{U}',
            type_line: 'Sorcery',
            image_uris: {
              small: 'https://example.com/b-small.jpg',
              normal: 'https://example.com/b-normal.jpg',
              large: 'https://example.com/b-large.jpg',
              png: 'https://example.com/b.png',
              art_crop: 'https://example.com/b-art.jpg',
              border_crop: 'https://example.com/b-border.jpg',
            },
          },
        ],
      };

      const result = mapScryfallToCard(modalDfcCard);

      expect(result.hasBackFace).toBe(true);
      expect(result.backFaceImageUris).toBeDefined();
    });

    it('single-faced cards have no back face', () => {
      const result = mapScryfallToCard(baseScryfallCard);
      expect(result.hasBackFace).toBe(false);
      expect(result.backFaceImageUris).toBeUndefined();
    });

    it('sets cachedAt to current time', () => {
      const before = Date.now();
      const result = mapScryfallToCard(baseScryfallCard);
      const after = Date.now();

      expect(result.cachedAt).toBeInstanceOf(Date);
      const cachedAtTime = (result.cachedAt as Date).getTime();
      expect(cachedAtTime).toBeGreaterThanOrEqual(before);
      expect(cachedAtTime).toBeLessThanOrEqual(after);
    });
  });

  describe('CACHE_CONFIG', () => {
    it('has staleAfterDays set to 30', () => {
      expect(CACHE_CONFIG.staleAfterDays).toBe(30);
    });

    it('has maxBatchSize set to 75 (Scryfall limit)', () => {
      expect(CACHE_CONFIG.maxBatchSize).toBe(75);
    });
  });
});
