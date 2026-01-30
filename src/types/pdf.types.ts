/**
 * PDF Export Types
 */

import type { DeckCard, Card as PrismaCard } from '@prisma/client';

/**
 * Deck card with full card data included
 */
export type DeckCardWithCard = DeckCard & { card: PrismaCard };

export interface PdfExportOptions {
  /** Include commander in export (default: true) */
  includeCommander: boolean;
  /** Include main deck cards (default: true) */
  includeMainDeck: boolean;
  /** Include sideboard cards (default: false) */
  includeSideboard: boolean;
  /** Include considering cards (default: false) */
  includeConsidering: boolean;
  /** Print multiple copies for cards with quantity > 1 (default: true) */
  duplicateMultiples: boolean;
  /** Show card names below each card (default: false) */
  showCardNames: boolean;
}

export const DEFAULT_PDF_OPTIONS: PdfExportOptions = {
  includeCommander: true,
  includeMainDeck: true,
  includeSideboard: false,
  includeConsidering: false,
  duplicateMultiples: true,
  showCardNames: false,
};

export interface CardForPdf {
  name: string;
  imageUrl: string;
  isBackFace?: boolean;
}

export interface PdfGenerationProgress {
  phase: 'loading' | 'generating' | 'complete' | 'error';
  current: number;
  total: number;
  message: string;
}

/**
 * A4 dimensions in mm
 */
export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;

/**
 * Standard MTG card dimensions in mm
 */
export const MTG_CARD_WIDTH_MM = 63;
export const MTG_CARD_HEIGHT_MM = 88;

/**
 * Grid configuration for 3x3 layout
 */
export const CARDS_PER_ROW = 3;
export const CARDS_PER_COLUMN = 3;
export const CARDS_PER_PAGE = CARDS_PER_ROW * CARDS_PER_COLUMN;

/**
 * Calculate margins for centering the grid on A4
 */
export const GRID_WIDTH_MM = CARDS_PER_ROW * MTG_CARD_WIDTH_MM;
export const GRID_HEIGHT_MM = CARDS_PER_COLUMN * MTG_CARD_HEIGHT_MM;
export const MARGIN_X_MM = (A4_WIDTH_MM - GRID_WIDTH_MM) / 2;
export const MARGIN_Y_MM = (A4_HEIGHT_MM - GRID_HEIGHT_MM) / 2;
