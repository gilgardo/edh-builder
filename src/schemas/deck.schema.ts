import { z } from 'zod';

export const ColorIdentitySchema = z.enum(['W', 'U', 'B', 'R', 'G']);

export const DeckFormatSchema = z.enum(['COMMANDER', 'BRAWL', 'OATHBREAKER']);

export const CardCategorySchema = z.enum(['MAIN', 'COMMANDER', 'SIDEBOARD', 'CONSIDERING']);

export const CreateDeckSchema = z.object({
  name: z
    .string()
    .min(1, 'Deck name is required')
    .max(100, 'Deck name must be 100 characters or less'),
  description: z.string().max(2000, 'Description must be 2000 characters or less').optional(),
  format: DeckFormatSchema.default('COMMANDER'),
  isPublic: z.boolean().default(false),
  commanderId: z.string().cuid().optional(),
  partnerId: z.string().cuid().optional(),
});

export const UpdateDeckSchema = CreateDeckSchema.partial();

// Schema for Scryfall card data (subset needed for syncing)
export const ScryfallCardSchema = z.object({
  id: z.string(),
  oracle_id: z.string(),
  name: z.string(),
  mana_cost: z.string().optional(),
  cmc: z.number(),
  type_line: z.string(),
  oracle_text: z.string().optional(),
  colors: z.array(z.string()).optional(),
  color_identity: z.array(z.string()),
  power: z.string().optional(),
  toughness: z.string().optional(),
  loyalty: z.string().optional(),
  legalities: z.object({
    commander: z.string(),
  }).passthrough(),
  image_uris: z.object({
    small: z.string(),
    normal: z.string(),
    large: z.string(),
    png: z.string(),
    art_crop: z.string(),
    border_crop: z.string(),
  }).optional(),
  card_faces: z.array(z.object({
    image_uris: z.object({
      small: z.string(),
      normal: z.string(),
      large: z.string(),
      png: z.string(),
      art_crop: z.string(),
      border_crop: z.string(),
    }).optional(),
  }).passthrough()).optional(),
  set: z.string(),
  set_name: z.string(),
  rarity: z.string(),
  prices: z.object({
    usd: z.string().nullable().optional(),
    tix: z.string().nullable().optional(),
  }).passthrough(),
  // Additional required fields from ScryfallCard type
  uri: z.string(),
  scryfall_uri: z.string(),
  layout: z.string(),
  keywords: z.array(z.string()).optional(),
  artist: z.string().optional(),
  released_at: z.string().optional(),
});

export const AddCardToDeckSchema = z.object({
  scryfallCard: ScryfallCardSchema,
  quantity: z.number().int().min(1).max(99).default(1),
  category: CardCategorySchema.default('MAIN'),
});

export const RemoveCardFromDeckSchema = z.object({
  cardId: z.string().cuid(),
});

export const DeckFiltersSchema = z.object({
  search: z.string().optional(),
  colorIdentity: z.array(ColorIdentitySchema).optional(),
  format: DeckFormatSchema.optional(),
  isPublic: z.boolean().optional(),
  userId: z.string().cuid().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

// Type exports
export type ColorIdentity = z.infer<typeof ColorIdentitySchema>;
export type DeckFormat = z.infer<typeof DeckFormatSchema>;
export type CardCategory = z.infer<typeof CardCategorySchema>;
export type CreateDeck = z.infer<typeof CreateDeckSchema>;
export type UpdateDeck = z.infer<typeof UpdateDeckSchema>;
export type AddCardToDeck = z.infer<typeof AddCardToDeckSchema>;
export type RemoveCardFromDeck = z.infer<typeof RemoveCardFromDeckSchema>;
export type DeckFilters = z.infer<typeof DeckFiltersSchema>;
