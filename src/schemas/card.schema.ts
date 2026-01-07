import { z } from 'zod';

export const CardRaritySchema = z.enum([
  'common',
  'uncommon',
  'rare',
  'mythic',
  'special',
  'bonus',
]);

export const CardSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(175).default(20),
  colors: z.array(z.enum(['W', 'U', 'B', 'R', 'G', 'C'])).optional(),
  colorIdentity: z.array(z.enum(['W', 'U', 'B', 'R', 'G'])).optional(),
  type: z.string().optional(),
  rarity: CardRaritySchema.optional(),
  setCode: z.string().optional(),
  legalCommander: z.boolean().optional(),
});

export const CardFiltersSchema = z.object({
  name: z.string().optional(),
  typeLine: z.string().optional(),
  colors: z.array(z.enum(['W', 'U', 'B', 'R', 'G', 'C'])).optional(),
  colorIdentity: z.array(z.enum(['W', 'U', 'B', 'R', 'G'])).optional(),
  minCmc: z.number().min(0).optional(),
  maxCmc: z.number().min(0).optional(),
  rarity: CardRaritySchema.optional(),
  setCode: z.string().optional(),
  isLegalCommander: z.boolean().optional(),
});

// Type exports
export type CardRarity = z.infer<typeof CardRaritySchema>;
export type CardSearch = z.infer<typeof CardSearchSchema>;
export type CardFilters = z.infer<typeof CardFiltersSchema>;
