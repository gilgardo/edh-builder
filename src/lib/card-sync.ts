import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { ScryfallCard } from '@/types/scryfall.types';

// CardRarity enum values from Prisma schema
type CardRarity = 'common' | 'uncommon' | 'rare' | 'mythic' | 'special' | 'bonus';

/**
 * Maps Scryfall rarity string to Prisma CardRarity enum
 */
function mapRarity(rarity: string): CardRarity {
  const rarityMap: Record<string, CardRarity> = {
    common: 'common',
    uncommon: 'uncommon',
    rare: 'rare',
    mythic: 'mythic',
    special: 'special',
    bonus: 'bonus',
  };
  return rarityMap[rarity] ?? 'common';
}

/**
 * Syncs a Scryfall card to the local database.
 * Uses upsert to create if not exists or update if exists.
 *
 * @param card - The Scryfall card data
 * @returns The synced card from the database
 */
export async function syncCardFromScryfall(card: ScryfallCard) {
  // Handle double-faced cards - get image from first face if no main image
  const imageUris = card.image_uris ?? card.card_faces?.[0]?.image_uris ?? null;

  // Determine if card is legal as commander
  const isLegalCommander =
    card.legalities.commander === 'legal' &&
    card.type_line.includes('Legendary') &&
    (card.type_line.includes('Creature') ||
      (card.type_line.includes('Planeswalker') &&
        (card.oracle_text?.includes('can be your commander') ?? false)));

  const cardData = {
    oracleId: card.oracle_id,
    name: card.name,
    manaCost: card.mana_cost ?? null,
    cmc: card.cmc,
    typeLine: card.type_line,
    oracleText: card.oracle_text ?? null,
    colors: card.colors?.join(',') ?? null,
    colorIdentity: card.color_identity.join(','),
    power: card.power ?? null,
    toughness: card.toughness ?? null,
    loyalty: card.loyalty ?? null,
    isLegalCommander,
    imageUris: imageUris ? (imageUris as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
    setCode: card.set,
    setName: card.set_name,
    rarity: mapRarity(card.rarity),
    priceUsd: card.prices.usd ? parseFloat(card.prices.usd) : null,
    priceTix: card.prices.tix ? parseFloat(card.prices.tix) : null,
  };

  return prisma.card.upsert({
    where: { scryfallId: card.id },
    update: cardData,
    create: {
      scryfallId: card.id,
      ...cardData,
    },
  });
}
