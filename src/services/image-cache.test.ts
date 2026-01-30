import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before importing the module
vi.mock('@/lib/prisma', () => ({
  prisma: {
    card: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/r2-client', () => ({
  uploadToR2: vi.fn(),
  getCardImageKey: vi.fn((id, size, face) => `cards${face === 'back' ? '-back' : ''}/${size}/${id}.jpg`),
  isR2Configured: vi.fn(() => false),
}));

vi.mock('./card-cache', () => ({
  getCard: vi.fn(),
}));

// Import after mocks are set up
import { prisma } from '@/lib/prisma';
import { uploadToR2, isR2Configured, getCardImageKey } from '@/lib/r2-client';
import { getCard } from './card-cache';
import {
  getCardImageUrl,
  getCardImageUrlFast,
  areImagesCached,
} from './image-cache';
import type { Card as PrismaCard } from '@prisma/client';

describe('image-cache service', () => {
  const mockCard: Partial<PrismaCard> = {
    id: 'test-id',
    scryfallId: 'scryfall-123',
    name: 'Test Card',
    imageUris: {
      small: 'https://scryfall.com/small.jpg',
      normal: 'https://scryfall.com/normal.jpg',
      large: 'https://scryfall.com/large.jpg',
    },
    hasBackFace: false,
    backFaceImageUris: null,
    cachedImageSmall: null,
    cachedImageNormal: null,
    cachedImageLarge: null,
    cachedBackImageSmall: null,
    cachedBackImageNormal: null,
    cachedBackImageLarge: null,
  };

  const mockDfcCard: Partial<PrismaCard> = {
    ...mockCard,
    name: 'Transform Card // Back Side',
    hasBackFace: true,
    backFaceImageUris: {
      small: 'https://scryfall.com/back-small.jpg',
      normal: 'https://scryfall.com/back-normal.jpg',
      large: 'https://scryfall.com/back-large.jpg',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCardImageUrl', () => {
    it('returns null when card is not found', async () => {
      vi.mocked(getCard).mockResolvedValue(null);

      const result = await getCardImageUrl('nonexistent-id');

      expect(result).toBeNull();
      expect(getCard).toHaveBeenCalledWith('nonexistent-id');
    });

    it('returns cached URL when available', async () => {
      const cardWithCache = {
        ...mockCard,
        cachedImageNormal: 'https://r2.example.com/cached.jpg',
      } as PrismaCard;
      vi.mocked(getCard).mockResolvedValue(cardWithCache);

      const result = await getCardImageUrl('scryfall-123', 'normal');

      expect(result).toBe('https://r2.example.com/cached.jpg');
    });

    it('returns Scryfall URL when R2 is not configured', async () => {
      vi.mocked(getCard).mockResolvedValue(mockCard as PrismaCard);
      vi.mocked(isR2Configured).mockReturnValue(false);

      const result = await getCardImageUrl('scryfall-123', 'normal');

      expect(result).toBe('https://scryfall.com/normal.jpg');
      expect(uploadToR2).not.toHaveBeenCalled();
    });

    it('returns small image URL when size is small', async () => {
      vi.mocked(getCard).mockResolvedValue(mockCard as PrismaCard);
      vi.mocked(isR2Configured).mockReturnValue(false);

      const result = await getCardImageUrl('scryfall-123', 'small');

      expect(result).toBe('https://scryfall.com/small.jpg');
    });

    it('returns large image URL when size is large', async () => {
      vi.mocked(getCard).mockResolvedValue(mockCard as PrismaCard);
      vi.mocked(isR2Configured).mockReturnValue(false);

      const result = await getCardImageUrl('scryfall-123', 'large');

      expect(result).toBe('https://scryfall.com/large.jpg');
    });

    it('returns back face URL for DFC when face is back', async () => {
      vi.mocked(getCard).mockResolvedValue(mockDfcCard as PrismaCard);
      vi.mocked(isR2Configured).mockReturnValue(false);

      const result = await getCardImageUrl('scryfall-123', 'normal', 'back');

      expect(result).toBe('https://scryfall.com/back-normal.jpg');
    });

    it('returns null when back face requested but card has no back face', async () => {
      vi.mocked(getCard).mockResolvedValue(mockCard as PrismaCard);
      vi.mocked(isR2Configured).mockReturnValue(false);

      const result = await getCardImageUrl('scryfall-123', 'normal', 'back');

      expect(result).toBeNull();
    });

    it('returns null when imageUris is null', async () => {
      const cardWithNoImages = {
        ...mockCard,
        imageUris: null,
      } as PrismaCard;
      vi.mocked(getCard).mockResolvedValue(cardWithNoImages);
      vi.mocked(isR2Configured).mockReturnValue(false);

      const result = await getCardImageUrl('scryfall-123', 'normal');

      expect(result).toBeNull();
    });
  });

  describe('getCardImageUrlFast', () => {
    it('returns cached URL without triggering caching', async () => {
      const cardWithCache = {
        ...mockCard,
        cachedImageNormal: 'https://r2.example.com/cached.jpg',
      } as PrismaCard;
      vi.mocked(getCard).mockResolvedValue(cardWithCache);

      const result = await getCardImageUrlFast('scryfall-123', 'normal');

      expect(result).toBe('https://r2.example.com/cached.jpg');
      expect(uploadToR2).not.toHaveBeenCalled();
    });

    it('returns Scryfall URL when not cached', async () => {
      vi.mocked(getCard).mockResolvedValue(mockCard as PrismaCard);

      const result = await getCardImageUrlFast('scryfall-123', 'normal');

      expect(result).toBe('https://scryfall.com/normal.jpg');
      expect(uploadToR2).not.toHaveBeenCalled();
    });

    it('returns null when card not found', async () => {
      vi.mocked(getCard).mockResolvedValue(null);

      const result = await getCardImageUrlFast('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('areImagesCached', () => {
    it('returns map with cache status for each card', async () => {
      vi.mocked(prisma.card.findMany).mockResolvedValue([
        { scryfallId: 'id-1', cachedImageSmall: null, cachedImageNormal: 'cached', cachedImageLarge: null },
        { scryfallId: 'id-2', cachedImageSmall: null, cachedImageNormal: null, cachedImageLarge: null },
      ] as any);

      const result = await areImagesCached(['id-1', 'id-2', 'id-3'], 'normal');

      expect(result.get('id-1')).toBe(true);
      expect(result.get('id-2')).toBe(false);
      expect(result.get('id-3')).toBe(false); // Not in DB
    });

    it('checks correct size field', async () => {
      vi.mocked(prisma.card.findMany).mockResolvedValue([
        { scryfallId: 'id-1', cachedImageSmall: 'cached', cachedImageNormal: null, cachedImageLarge: null },
      ] as any);

      const smallResult = await areImagesCached(['id-1'], 'small');
      expect(smallResult.get('id-1')).toBe(true);

      vi.mocked(prisma.card.findMany).mockResolvedValue([
        { scryfallId: 'id-1', cachedImageSmall: 'cached', cachedImageNormal: null, cachedImageLarge: null },
      ] as any);

      const normalResult = await areImagesCached(['id-1'], 'normal');
      expect(normalResult.get('id-1')).toBe(false);
    });

    it('returns empty map for empty input', async () => {
      vi.mocked(prisma.card.findMany).mockResolvedValue([]);
      const result = await areImagesCached([], 'normal');
      expect(result.size).toBe(0);
    });
  });

  describe('getCardImageKey', () => {
    it('generates correct key for front face', () => {
      const key = getCardImageKey('abc123', 'normal', 'front');
      expect(key).toBe('cards/normal/abc123.jpg');
    });

    it('generates correct key for back face', () => {
      const key = getCardImageKey('abc123', 'normal', 'back');
      expect(key).toBe('cards-back/normal/abc123.jpg');
    });

    it('handles different sizes', () => {
      expect(getCardImageKey('id', 'small', 'front')).toBe('cards/small/id.jpg');
      expect(getCardImageKey('id', 'normal', 'front')).toBe('cards/normal/id.jpg');
      expect(getCardImageKey('id', 'large', 'front')).toBe('cards/large/id.jpg');
    });
  });
});
