# Hybrid Card Caching System - Implementation Plan

> **Status**: Planned
> **Created**: 2026-01-29
> **Goal**: Eliminate Scryfall rate limiting by caching card metadata in PostgreSQL and images in Cloudflare R2

---

## Problem Statement

Current architecture fetches from Scryfall API on every request:
- Rate limited to 10 requests/second
- PDF generation for 100-card deck makes 100+ API calls
- No persistence of card images
- Slow user experience for repeated queries

## Solution: Hybrid Cache-First Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Request                              │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              [Optional] Redis Quick Lookup                       │
│         card:{scryfallId} → {exists, imageCached, cachedAt}     │
└───────────────────────────┬─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  Card Search  │   │  Card Detail  │   │  Card Image   │
│  /api/cards   │   │  /api/cards/  │   │  /api/images/ │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Card Cache Service                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Check PostgreSQL│  │ Check Staleness │  │ Check R2 Cache  │  │
│  │   (metadata)    │  │   (30 days)     │  │   (images)      │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
└───────────┼────────────────────┼────────────────────┼───────────┘
            │                    │                    │
    ┌───────┴───────┐    ┌───────┴───────┐    ┌───────┴───────┐
    │ Cache HIT     │    │ Cache MISS/   │    │ Cache HIT     │
    │ Return data   │    │ STALE         │    │ Return R2 URL │
    └───────────────┘    └───────┬───────┘    └───────────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
           ┌───────────────┐         ┌───────────────┐
           │ Fetch Scryfall│         │ Fetch Image   │
           │ Persist to DB │         │ Upload to R2  │
           └───────────────┘         └───────────────┘
```

---

## Phase 1: Database Schema Updates

### Migration: Add Caching Fields to Card Model

```prisma
model Card {
  // Existing fields...
  id                String    @id @default(cuid())
  scryfallId        String    @unique @map("scryfall_id")
  name              String
  manaCost          String?   @map("mana_cost")
  cmc               Float
  typeLine          String    @map("type_line")
  oracleText        String?   @map("oracle_text") @db.Text
  colors            String?
  colorIdentity     String?   @map("color_identity")
  power             String?
  toughness         String?
  loyalty           String?
  isLegalCommander  Boolean   @map("is_legal_commander")
  imageUris         Json?     @map("image_uris")
  priceUsd          Decimal?  @map("price_usd") @db.Decimal(10, 2)
  priceTix          Decimal?  @map("price_tix") @db.Decimal(10, 2)
  setCode           String    @map("set_code")
  setName           String    @map("set_name")
  rarity            CardRarity

  // NEW: Caching metadata
  cachedAt          DateTime  @default(now()) @map("cached_at")
  imageCachedAt     DateTime? @map("image_cached_at")

  // NEW: Cached image URLs (Cloudflare R2)
  cachedImageSmall  String?   @map("cached_image_small")
  cachedImageNormal String?   @map("cached_image_normal")
  cachedImageLarge  String?   @map("cached_image_large")

  // NEW: Double-faced card support
  hasBackFace       Boolean   @default(false) @map("has_back_face")
  backFaceImageUris Json?     @map("back_face_image_uris")
  cachedBackImageSmall  String? @map("cached_back_image_small")
  cachedBackImageNormal String? @map("cached_back_image_normal")
  cachedBackImageLarge  String? @map("cached_back_image_large")

  // Timestamps
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")

  // Relations (existing)
  deckCards         DeckCard[]
  commanderOf       Deck[]    @relation("Commander")
  partnerOf         Deck[]    @relation("Partner")

  @@index([name])
  @@index([scryfallId])
  @@index([isLegalCommander])
  @@index([cachedAt])  // NEW: For finding stale cards
  @@map("cards")
}
```

### Migration File

```bash
# Generate migration
docker exec edh-builder-app pnpm prisma migrate dev --name add_card_caching_fields
```

---

## Phase 2: Cloudflare R2 Setup

### Prerequisites
- Cloudflare account (free): https://dash.cloudflare.com/sign-up
- Create R2 bucket in Cloudflare dashboard

### Environment Variables

```env
# Add to .env.local and .env.example

# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=edh-builder-images
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev  # Or custom domain
```

### R2 Bucket Structure

```
edh-builder-images/
├── cards/
│   ├── small/
│   │   └── {scryfallId}.jpg
│   ├── normal/
│   │   └── {scryfallId}.jpg
│   └── large/
│       └── {scryfallId}.jpg
└── cards-back/           # For DFC back faces
    ├── small/
    ├── normal/
    └── large/
```

### New File: `src/lib/r2-client.ts`

```typescript
import { S3Client, PutObjectCommand, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;
export const BUCKET_NAME = R2_BUCKET_NAME;

export async function uploadToR2(
  key: string,
  body: Buffer | ArrayBuffer,
  contentType: string
): Promise<string> {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: Buffer.from(body),
      ContentType: contentType,
    })
  );
  return `${R2_PUBLIC_URL}/${key}`;
}

export async function existsInR2(key: string): Promise<boolean> {
  try {
    await r2Client.send(
      new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
    );
    return true;
  } catch {
    return false;
  }
}

export function getR2PublicUrl(key: string): string {
  return `${R2_PUBLIC_URL}/${key}`;
}
```

### Dependencies

```bash
docker exec edh-builder-app pnpm add @aws-sdk/client-s3 p-limit
```

---

## Phase 3: Card Cache Service

### New File: `src/services/card-cache.ts`

```typescript
import { prisma } from '@/lib/prisma';
import { getCard as fetchFromScryfall, getCardsByIds as fetchBatchFromScryfall } from './scryfall';
import type { Card as PrismaCard } from '@prisma/client';
import type { ScryfallCard } from '@/types/scryfall.types';

/**
 * Cache configuration
 */
const CACHE_CONFIG = {
  staleAfterDays: 30,
  maxBatchSize: 75, // Scryfall limit
};

/**
 * Double-faced card layouts that need back face handling
 */
const DFC_LAYOUTS = ['transform', 'modal_dfc', 'reversible_card', 'double_faced_token'];

/**
 * Check if a cached card is stale
 */
export function isCardStale(card: PrismaCard): boolean {
  const staleThreshold = CACHE_CONFIG.staleAfterDays * 24 * 60 * 60 * 1000;
  return Date.now() - card.cachedAt.getTime() > staleThreshold;
}

/**
 * Map Scryfall card to Prisma card data
 */
function mapScryfallToCard(scryfall: ScryfallCard): Omit<PrismaCard, 'id' | 'createdAt' | 'updatedAt'> {
  const isDfc = DFC_LAYOUTS.includes(scryfall.layout);

  return {
    scryfallId: scryfall.id,
    name: scryfall.name,
    manaCost: scryfall.mana_cost ?? null,
    cmc: scryfall.cmc,
    typeLine: scryfall.type_line,
    oracleText: scryfall.oracle_text ?? null,
    colors: scryfall.colors?.join(',') ?? null,
    colorIdentity: scryfall.color_identity?.join(',') ?? null,
    power: scryfall.power ?? null,
    toughness: scryfall.toughness ?? null,
    loyalty: scryfall.loyalty ?? null,
    isLegalCommander: scryfall.legalities.commander === 'legal' &&
      scryfall.type_line.includes('Legendary') &&
      (scryfall.type_line.includes('Creature') ||
        scryfall.oracle_text?.includes('can be your commander')),
    imageUris: scryfall.image_uris ?? scryfall.card_faces?.[0]?.image_uris ?? null,
    priceUsd: scryfall.prices.usd ? parseFloat(scryfall.prices.usd) : null,
    priceTix: scryfall.prices.tix ? parseFloat(scryfall.prices.tix) : null,
    setCode: scryfall.set,
    setName: scryfall.set_name,
    rarity: scryfall.rarity as any,
    cachedAt: new Date(),
    imageCachedAt: null,
    cachedImageSmall: null,
    cachedImageNormal: null,
    cachedImageLarge: null,
    hasBackFace: isDfc && (scryfall.card_faces?.length ?? 0) > 1,
    backFaceImageUris: isDfc ? scryfall.card_faces?.[1]?.image_uris ?? null : null,
    cachedBackImageSmall: null,
    cachedBackImageNormal: null,
    cachedBackImageLarge: null,
  };
}

/**
 * Get a card by Scryfall ID, using cache when available
 */
export async function getCard(scryfallId: string): Promise<PrismaCard | null> {
  // 1. Check PostgreSQL cache
  const cached = await prisma.card.findUnique({
    where: { scryfallId },
  });

  // 2. If exists and fresh, return cached
  if (cached && !isCardStale(cached)) {
    return cached;
  }

  // 3. Fetch from Scryfall
  const scryfallCard = await fetchFromScryfall(scryfallId);

  // 4. If Scryfall fails, return stale cache (better than nothing)
  if (!scryfallCard) {
    return cached;
  }

  // 5. Upsert to database
  const cardData = mapScryfallToCard(scryfallCard);
  return prisma.card.upsert({
    where: { scryfallId },
    create: cardData as any,
    update: { ...cardData, cachedAt: new Date() },
  });
}

/**
 * Get multiple cards by Scryfall IDs, using cache when available
 */
export async function getCardsByIds(scryfallIds: string[]): Promise<PrismaCard[]> {
  if (scryfallIds.length === 0) return [];

  // 1. Check PostgreSQL cache for all IDs
  const cached = await prisma.card.findMany({
    where: { scryfallId: { in: scryfallIds } },
  });

  // 2. Separate fresh and stale/missing
  const cachedMap = new Map(cached.map(c => [c.scryfallId, c]));
  const freshCards: PrismaCard[] = [];
  const staleOrMissingIds: string[] = [];

  for (const id of scryfallIds) {
    const card = cachedMap.get(id);
    if (card && !isCardStale(card)) {
      freshCards.push(card);
    } else {
      staleOrMissingIds.push(id);
    }
  }

  // 3. If all fresh, return
  if (staleOrMissingIds.length === 0) {
    return freshCards;
  }

  // 4. Fetch missing/stale from Scryfall in batches
  const scryfallCards = await fetchBatchFromScryfall(staleOrMissingIds);

  // 5. Upsert fetched cards
  const upsertedCards: PrismaCard[] = [];
  for (const scryfallCard of scryfallCards) {
    const cardData = mapScryfallToCard(scryfallCard);
    const upserted = await prisma.card.upsert({
      where: { scryfallId: scryfallCard.id },
      create: cardData as any,
      update: { ...cardData, cachedAt: new Date() },
    });
    upsertedCards.push(upserted);
  }

  // 6. For IDs that Scryfall didn't return, use stale cache
  const fetchedIds = new Set(scryfallCards.map(c => c.id));
  for (const id of staleOrMissingIds) {
    if (!fetchedIds.has(id)) {
      const stale = cachedMap.get(id);
      if (stale) {
        freshCards.push(stale); // Use stale data
      }
    }
  }

  return [...freshCards, ...upsertedCards];
}

/**
 * Force refresh a card from Scryfall
 */
export async function refreshCard(scryfallId: string): Promise<PrismaCard | null> {
  const scryfallCard = await fetchFromScryfall(scryfallId);
  if (!scryfallCard) return null;

  const cardData = mapScryfallToCard(scryfallCard);
  return prisma.card.upsert({
    where: { scryfallId },
    create: cardData as any,
    update: { ...cardData, cachedAt: new Date() },
  });
}

/**
 * Get count of cached cards
 */
export async function getCacheStats(): Promise<{
  totalCards: number;
  freshCards: number;
  staleCards: number;
  cardsWithCachedImages: number;
}> {
  const staleThreshold = new Date(Date.now() - CACHE_CONFIG.staleAfterDays * 24 * 60 * 60 * 1000);

  const [totalCards, freshCards, cardsWithCachedImages] = await Promise.all([
    prisma.card.count(),
    prisma.card.count({ where: { cachedAt: { gte: staleThreshold } } }),
    prisma.card.count({ where: { imageCachedAt: { not: null } } }),
  ]);

  return {
    totalCards,
    freshCards,
    staleCards: totalCards - freshCards,
    cardsWithCachedImages,
  };
}
```

---

## Phase 4: Image Cache Service

### New File: `src/services/image-cache.ts`

```typescript
import { prisma } from '@/lib/prisma';
import { uploadToR2, existsInR2, getR2PublicUrl } from '@/lib/r2-client';
import { getCard } from './card-cache';
import pLimit from 'p-limit';

export type ImageSize = 'small' | 'normal' | 'large';
export type ImageFace = 'front' | 'back';

const IMAGE_FETCH_TIMEOUT_MS = 15000;

/**
 * Get the R2 key for a card image
 */
function getImageKey(scryfallId: string, size: ImageSize, face: ImageFace): string {
  const folder = face === 'back' ? 'cards-back' : 'cards';
  return `${folder}/${size}/${scryfallId}.jpg`;
}

/**
 * Get the database field name for cached image URL
 */
function getCachedImageField(size: ImageSize, face: ImageFace): string {
  const sizeCapitalized = size.charAt(0).toUpperCase() + size.slice(1);
  return face === 'back'
    ? `cachedBackImage${sizeCapitalized}`
    : `cachedImage${sizeCapitalized}`;
}

/**
 * Fetch image with timeout
 */
async function fetchImageWithTimeout(url: string): Promise<ArrayBuffer> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), IMAGE_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    return response.arrayBuffer();
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

/**
 * Get cached image URL, or cache it if not exists
 */
export async function getCardImageUrl(
  scryfallId: string,
  size: ImageSize = 'normal',
  face: ImageFace = 'front'
): Promise<string | null> {
  // 1. Get card from cache
  const card = await getCard(scryfallId);
  if (!card) return null;

  // 2. Check if already cached in R2
  const cacheField = getCachedImageField(size, face);
  const cachedUrl = (card as any)[cacheField];

  if (cachedUrl) {
    return cachedUrl;
  }

  // 3. Get Scryfall image URL
  const imageUris = face === 'back'
    ? card.backFaceImageUris as Record<string, string> | null
    : card.imageUris as Record<string, string> | null;

  if (!imageUris || !imageUris[size]) {
    return null;
  }

  // 4. Fetch from Scryfall and upload to R2
  try {
    const imageBuffer = await fetchImageWithTimeout(imageUris[size]);
    const r2Key = getImageKey(scryfallId, size, face);
    const publicUrl = await uploadToR2(r2Key, imageBuffer, 'image/jpeg');

    // 5. Update database with cached URL
    await prisma.card.update({
      where: { scryfallId },
      data: {
        [cacheField]: publicUrl,
        imageCachedAt: new Date(),
      },
    });

    return publicUrl;
  } catch (error) {
    console.error(`Failed to cache image for ${scryfallId}:`, error);
    // Return Scryfall URL as fallback
    return imageUris[size];
  }
}

/**
 * Batch cache images for multiple cards (for PDF generation)
 */
export async function batchCacheImages(
  scryfallIds: string[],
  size: ImageSize = 'large',
  onProgress?: (current: number, total: number) => void
): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  const limit = pLimit(3); // Max 3 concurrent uploads

  let completed = 0;
  const total = scryfallIds.length;

  await Promise.all(
    scryfallIds.map(id =>
      limit(async () => {
        const url = await getCardImageUrl(id, size, 'front');
        if (url) {
          results.set(id, url);
        }
        completed++;
        onProgress?.(completed, total);
      })
    )
  );

  return results;
}

/**
 * Check if card images are cached
 */
export async function areImagesCached(
  scryfallIds: string[],
  size: ImageSize = 'normal'
): Promise<Map<string, boolean>> {
  const cards = await prisma.card.findMany({
    where: { scryfallId: { in: scryfallIds } },
    select: {
      scryfallId: true,
      cachedImageSmall: true,
      cachedImageNormal: true,
      cachedImageLarge: true,
    },
  });

  const results = new Map<string, boolean>();
  const field = `cachedImage${size.charAt(0).toUpperCase() + size.slice(1)}`;

  for (const card of cards) {
    results.set(card.scryfallId, !!(card as any)[field]);
  }

  // Mark missing cards as not cached
  for (const id of scryfallIds) {
    if (!results.has(id)) {
      results.set(id, false);
    }
  }

  return results;
}
```

---

## Phase 5: Image Proxy API Route

### New File: `src/app/api/images/[scryfallId]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getCardImageUrl, type ImageSize, type ImageFace } from '@/services/image-cache';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ scryfallId: string }> }
) {
  const { scryfallId } = await params;
  const searchParams = request.nextUrl.searchParams;

  const size = (searchParams.get('size') || 'normal') as ImageSize;
  const face = (searchParams.get('face') || 'front') as ImageFace;

  // Validate size parameter
  if (!['small', 'normal', 'large'].includes(size)) {
    return NextResponse.json(
      { error: 'Invalid size parameter' },
      { status: 400 }
    );
  }

  // Validate face parameter
  if (!['front', 'back'].includes(face)) {
    return NextResponse.json(
      { error: 'Invalid face parameter' },
      { status: 400 }
    );
  }

  const imageUrl = await getCardImageUrl(scryfallId, size, face);

  if (!imageUrl) {
    return NextResponse.json(
      { error: 'Card or image not found' },
      { status: 404 }
    );
  }

  // Redirect to cached image URL (R2 or Scryfall fallback)
  return NextResponse.redirect(imageUrl);
}
```

---

## Phase 6: Update PDF Generator

### Changes to `src/lib/pdf-generator.ts`

```typescript
// Add import
import { getCardImageUrl, batchCacheImages } from '@/services/image-cache';

// Update prepareCardsForPdf function to use cached images
async function prepareCardsForPdf(
  commander: PrismaCard | null,
  cards: DeckCardWithCard[],
  options: PdfExportOptions,
  onProgress: (progress: PdfGenerationProgress) => void
): Promise<CardForPdf[]> {
  // ... existing card collection logic ...

  // Pre-cache all images before generating PDF
  const allScryfallIds = cardsToProcess.map(c => c.card.scryfallId);

  onProgress({
    phase: 'loading',
    current: 0,
    total: allScryfallIds.length,
    message: 'Caching card images...',
  });

  // Batch cache images (uploads to R2 if not cached)
  const cachedUrls = await batchCacheImages(
    allScryfallIds,
    'large',
    (current, total) => {
      onProgress({
        phase: 'loading',
        current,
        total,
        message: `Caching images: ${current}/${total}`,
      });
    }
  );

  // Build result using cached URLs
  // ... rest of function uses cachedUrls.get(scryfallId) instead of Scryfall URLs
}
```

---

## Phase 7 (Optional): Redis Quick Lookup

> **When to add**: If PostgreSQL becomes a bottleneck for cache lookups

### Redis Setup

```env
# Add to .env.local
REDIS_URL=redis://localhost:6379
# Or Redis Cloud: redis://default:password@host:port
```

### New File: `src/lib/redis-client.ts`

```typescript
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

/**
 * Redis key structure:
 * card:{scryfallId} -> { cachedAt: timestamp, imageCached: boolean }
 */

export async function getCardCacheState(scryfallId: string): Promise<{
  exists: boolean;
  imageCached: boolean;
  cachedAt: number | null;
} | null> {
  const data = await redis.hgetall(`card:${scryfallId}`);
  if (!data || Object.keys(data).length === 0) {
    return null;
  }
  return {
    exists: true,
    imageCached: data.imageCached === 'true',
    cachedAt: data.cachedAt ? parseInt(data.cachedAt) : null,
  };
}

export async function setCardCacheState(
  scryfallId: string,
  imageCached: boolean
): Promise<void> {
  await redis.hset(`card:${scryfallId}`, {
    cachedAt: Date.now().toString(),
    imageCached: imageCached.toString(),
  });
  // Set TTL of 31 days (slightly longer than stale threshold)
  await redis.expire(`card:${scryfallId}`, 31 * 24 * 60 * 60);
}

export async function batchGetCardCacheState(
  scryfallIds: string[]
): Promise<Map<string, boolean>> {
  const pipeline = redis.pipeline();
  for (const id of scryfallIds) {
    pipeline.exists(`card:${id}`);
  }
  const results = await pipeline.exec();

  const map = new Map<string, boolean>();
  results?.forEach((result, index) => {
    map.set(scryfallIds[index], result[1] === 1);
  });
  return map;
}
```

### Integration with Card Cache Service

```typescript
// In card-cache.ts, add Redis check before PostgreSQL

export async function getCard(scryfallId: string): Promise<PrismaCard | null> {
  // 1. Quick Redis check (optional, if Redis is configured)
  if (process.env.REDIS_URL) {
    const redisState = await getCardCacheState(scryfallId);
    if (redisState && !isStaleTimestamp(redisState.cachedAt)) {
      // Card exists and is fresh, proceed to PostgreSQL
    } else if (!redisState) {
      // Not in cache at all, skip PostgreSQL and go to Scryfall
      // ... fetch from Scryfall, update both Redis and PostgreSQL
    }
  }

  // 2. PostgreSQL check
  // ... existing logic
}
```

---

## File Structure Summary

```
src/
├── lib/
│   ├── r2-client.ts              # NEW: Cloudflare R2 client
│   ├── redis-client.ts           # NEW (optional): Redis client
│   ├── pdf-generator.ts          # UPDATE: Use cached images
│   └── prisma.ts                 # EXISTING
├── services/
│   ├── scryfall.ts               # EXISTING: Scryfall API (used by cache)
│   ├── card-cache.ts             # NEW: Card metadata caching
│   └── image-cache.ts            # NEW: Image caching to R2
├── app/api/
│   ├── cards/
│   │   ├── route.ts              # UPDATE: Use cache service
│   │   └── [scryfallId]/
│   │       └── route.ts          # UPDATE: Use cache service
│   └── images/
│       └── [scryfallId]/
│           └── route.ts          # NEW: Image proxy endpoint
└── types/
    └── pdf.types.ts              # EXISTING
```

---

## Dependencies

```bash
# Required
docker exec edh-builder-app pnpm add @aws-sdk/client-s3 p-limit

# Optional (for Redis)
docker exec edh-builder-app pnpm add ioredis
docker exec edh-builder-app pnpm add -D @types/ioredis
```

---

## Environment Variables Summary

```env
# Required for R2
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=edh-builder-images
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev

# Optional for Redis
REDIS_URL=redis://localhost:6379
```

---

## Implementation Checklist

- [ ] **Phase 1**: Database migration (add caching fields)
- [ ] **Phase 2**: Set up Cloudflare account and R2 bucket
- [ ] **Phase 3**: Implement card cache service
- [ ] **Phase 4**: Implement image cache service
- [ ] **Phase 5**: Create image proxy API route
- [ ] **Phase 6**: Update PDF generator to use cached images
- [ ] **Phase 7** (optional): Add Redis for quick lookups
- [ ] **Testing**: Test with various deck sizes
- [ ] **Monitoring**: Add cache hit/miss logging

---

## Cost Estimation

| Component | Free Tier | Paid (if exceeded) |
|-----------|-----------|-------------------|
| Cloudflare R2 | 10GB storage, 10M reads/month | $0.015/GB/month |
| Redis Cloud | 30MB | $5/month for 250MB |
| PostgreSQL | Existing | Existing |

**Typical usage (5,000 unique cards):**
- Storage: ~2GB images = **FREE**
- Reads: Well under 10M/month = **FREE**

---

## Future Enhancements

1. **Background refresh job**: Refresh stale cards during off-peak hours
2. **Search result caching**: Cache popular search queries
3. **Bulk data import**: Monthly import of Scryfall bulk data for new sets
4. **Image CDN**: Use Cloudflare CDN in front of R2 for faster delivery
5. **Analytics**: Track cache hit rates and popular cards
