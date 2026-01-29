import { z } from 'zod';

/**
 * Moxfield URL or deck ID validation
 */
export const MoxfieldUrlSchema = z
  .string()
  .min(1, 'Please enter a Moxfield URL or deck ID')
  .refine(
    (value) => {
      const trimmed = value.trim();
      // Accept Moxfield URLs
      if (trimmed.includes('moxfield.com/decks/')) {
        return true;
      }
      // Accept deck IDs (alphanumeric with underscores/dashes, min 6 chars)
      if (/^[a-zA-Z0-9_-]{6,}$/.test(trimmed)) {
        return true;
      }
      return false;
    },
    {
      message: 'Please enter a valid Moxfield URL (e.g., https://moxfield.com/decks/abc123)',
    }
  );

/**
 * Text-based deck list import
 */
export const TextImportSchema = z
  .string()
  .min(10, 'Deck list is too short')
  .max(50000, 'Deck list is too long (max 50,000 characters)')
  .refine(
    (value) => {
      // Must have at least a few lines that look like cards
      const lines = value.split(/\r?\n/).filter((l) => l.trim());
      const cardLines = lines.filter((line) => {
        const trimmed = line.trim();
        // Skip comments and headers
        if (trimmed.startsWith('//') || trimmed.startsWith('#')) return false;
        if (trimmed.endsWith(':')) return false;
        // Should have some text content
        return trimmed.length > 2;
      });
      return cardLines.length >= 1;
    },
    {
      message: 'Could not find any valid card entries in the deck list',
    }
  );

/**
 * Parsed card from text import
 */
export const ParsedCardSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
  category: z.string().optional(),
  scryfallId: z.string().optional(),
  scryfallCard: z.any().optional(), // Full Scryfall card data when resolved
  error: z.string().optional(), // Error message if card couldn't be resolved
});

/**
 * Basic land quantities for quick-add after commander selection
 */
export const BasicLandSchema = z.object({
  plains: z.number().int().min(0).max(40).default(0),
  island: z.number().int().min(0).max(40).default(0),
  swamp: z.number().int().min(0).max(40).default(0),
  mountain: z.number().int().min(0).max(40).default(0),
  forest: z.number().int().min(0).max(40).default(0),
  wastes: z.number().int().min(0).max(40).default(0),
});

/**
 * Import request to parse endpoint
 */
export const ParseImportRequestSchema = z.object({
  text: TextImportSchema,
});

/**
 * Import request to moxfield endpoint
 */
export const MoxfieldImportRequestSchema = z.object({
  url: MoxfieldUrlSchema,
});
export const MoxfieldCategoryEnum = z.enum(['COMMANDER', 'MAIN', 'SIDEBOARD', 'CONSIDERING']);
/**
 * Card resolution result
 */
export const CardResolutionSchema = z.object({
  name: z.string(),
  quantity: z.number().int().min(1),
  category: MoxfieldCategoryEnum,
  resolved: z.boolean(),
  scryfallId: z.string().optional(),
  scryfallCard: z.any().optional(),
  error: z.string().optional(),
  suggestions: z.array(z.string()).optional(),
});

/**
 * Import preview result
 */
export const ImportPreviewSchema = z.object({
  deckName: z.string().optional(),
  commander: CardResolutionSchema.optional(),
  cards: z.array(CardResolutionSchema),
  totalCards: z.number().int(),
  resolvedCount: z.number().int(),
  unresolvedCount: z.number().int(),
  warnings: z.array(z.string()),
  source: z.enum(['moxfield', 'text']),
});

// Type exports
export type MoxfieldUrl = z.infer<typeof MoxfieldUrlSchema>;
export type TextImport = z.infer<typeof TextImportSchema>;
export type ParsedCard = z.infer<typeof ParsedCardSchema>;
export type BasicLands = z.infer<typeof BasicLandSchema>;
export type ParseImportRequest = z.infer<typeof ParseImportRequestSchema>;
export type MoxfieldImportRequest = z.infer<typeof MoxfieldImportRequestSchema>;
export type CardResolution = z.infer<typeof CardResolutionSchema>;
export type ImportPreview = z.infer<typeof ImportPreviewSchema>;
