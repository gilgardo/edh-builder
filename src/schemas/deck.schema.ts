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

export const AddCardToDeckSchema = z.object({
  cardId: z.string().cuid(),
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
