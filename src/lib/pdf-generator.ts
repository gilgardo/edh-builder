import jsPDF from 'jspdf';
import type { Card as PrismaCard } from '@prisma/client';
import type {
  PdfExportOptions,
  CardForPdf,
  PdfGenerationProgress,
  DeckCardWithCard,
} from '@/types/pdf.types';
import {
  A4_WIDTH_MM,
  A4_HEIGHT_MM,
  MTG_CARD_WIDTH_MM,
  MTG_CARD_HEIGHT_MM,
  CARDS_PER_ROW,
  CARDS_PER_PAGE,
  MARGIN_X_MM,
  MARGIN_Y_MM,
} from '@/types/pdf.types';
import { batchCacheImagesWithBackFaces } from '@/services/image-cache';

interface ImageUris {
  small?: string;
  normal?: string;
  large?: string;
  png?: string;
}

/**
 * Get the best quality image URL from image URIs
 * Prefers large for good print quality without being too large
 */
function getBestImageUrl(imageUris: ImageUris | undefined): string | null {
  if (!imageUris) return null;
  // Prefer large for print quality, fallback to normal
  return imageUris.large ?? imageUris.normal ?? imageUris.png ?? null;
}

/**
 * Timeout in ms for image fetch operations
 */
const IMAGE_FETCH_TIMEOUT_MS = 15000;

/**
 * Load an image and convert to base64 data URL for jsPDF
 * Includes timeout and proper error handling
 */
async function loadImageAsBase64(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), IMAGE_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

/**
 * Prepare cards for PDF export, handling duplicates and double-faced cards
 * Uses cached images from R2 when available for faster generation
 */
async function prepareCardsForPdf(
  commander: PrismaCard | null,
  cards: DeckCardWithCard[],
  options: PdfExportOptions,
  onProgress: (progress: PdfGenerationProgress) => void
): Promise<CardForPdf[]> {
  const result: CardForPdf[] = [];

  // Collect all cards to process
  const cardsToProcess: Array<{ card: PrismaCard; quantity: number }> = [];

  // Add commander
  if (options.includeCommander && commander) {
    cardsToProcess.push({ card: commander, quantity: 1 });
  }

  // Add deck cards based on options
  for (const deckCard of cards) {
    const category = deckCard.category;

    if (category === 'MAIN' && options.includeMainDeck) {
      cardsToProcess.push({
        card: deckCard.card,
        quantity: options.duplicateMultiples ? deckCard.quantity : 1,
      });
    } else if (category === 'SIDEBOARD' && options.includeSideboard) {
      cardsToProcess.push({
        card: deckCard.card,
        quantity: options.duplicateMultiples ? deckCard.quantity : 1,
      });
    } else if (category === 'CONSIDERING' && options.includeConsidering) {
      cardsToProcess.push({
        card: deckCard.card,
        quantity: options.duplicateMultiples ? deckCard.quantity : 1,
      });
    }
  }

  if (cardsToProcess.length === 0) {
    return [];
  }

  // Collect unique Scryfall IDs for batch caching
  const uniqueScryfallIds = [...new Set(cardsToProcess.map((c) => c.card.scryfallId))];

  onProgress({
    phase: 'loading',
    current: 0,
    total: uniqueScryfallIds.length,
    message: 'Caching card images...',
  });

  // Batch cache all images (uploads to R2 if not cached)
  // This is much faster than fetching one-by-one from Scryfall
  const cachedImages = await batchCacheImagesWithBackFaces(
    uniqueScryfallIds,
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
  onProgress({
    phase: 'loading',
    current: 0,
    total: cardsToProcess.length,
    message: 'Preparing cards for PDF...',
  });

  let processedCount = 0;
  for (const { card, quantity } of cardsToProcess) {
    const scryfallId = card.scryfallId;
    const cached = cachedImages.get(scryfallId);

    if (!cached) {
      // Fallback to database imageUris if caching failed
      const imageUris = card.imageUris as ImageUris | null;
      const imageUrl = getBestImageUrl(imageUris ?? undefined);
      if (imageUrl) {
        for (let i = 0; i < quantity; i++) {
          result.push({
            name: card.name,
            imageUrl,
            isBackFace: false,
          });
        }
      }
    } else {
      // Add front face copies
      for (let i = 0; i < quantity; i++) {
        result.push({
          name: card.name,
          imageUrl: cached.front,
          isBackFace: false,
        });

        // Add back face if it's a DFC
        if (cached.back) {
          // For DFCs, extract back face name from card name (e.g., "Front // Back")
          const nameParts = card.name.split(' // ');
          const backName = nameParts.length > 1 ? nameParts[1] : `${card.name} (back)`;
          result.push({
            name: backName ?? card.name,
            imageUrl: cached.back,
            isBackFace: true,
          });
        }
      }
    }

    processedCount++;
    onProgress({
      phase: 'loading',
      current: processedCount,
      total: cardsToProcess.length,
      message: `Preparing: ${card.name}`,
    });
  }

  return result;
}

/**
 * Generate a PDF document with the given cards
 */
export async function generateDeckPdf(
  deckName: string,
  commander: PrismaCard | null,
  cards: DeckCardWithCard[],
  options: PdfExportOptions,
  onProgress: (progress: PdfGenerationProgress) => void
): Promise<Blob> {
  // Prepare cards (handles DFCs and duplicates)
  const cardsForPdf = await prepareCardsForPdf(commander, cards, options, onProgress);

  if (cardsForPdf.length === 0) {
    throw new Error('No cards to export');
  }

  onProgress({
    phase: 'generating',
    current: 0,
    total: cardsForPdf.length,
    message: 'Generating PDF...',
  });

  // Create PDF document (A4 portrait)
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Load and place each card
  for (let i = 0; i < cardsForPdf.length; i++) {
    const card = cardsForPdf[i];
    if (!card) continue;

    const pageIndex = Math.floor(i / CARDS_PER_PAGE);
    const positionOnPage = i % CARDS_PER_PAGE;

    // Add new page if needed (not for first page)
    if (positionOnPage === 0 && pageIndex > 0) {
      pdf.addPage();
    }

    // Calculate position in grid
    const col = positionOnPage % CARDS_PER_ROW;
    const row = Math.floor(positionOnPage / CARDS_PER_ROW);
    const x = MARGIN_X_MM + col * MTG_CARD_WIDTH_MM;
    const y = MARGIN_Y_MM + row * MTG_CARD_HEIGHT_MM;

    try {
      // Load image as base64
      const imageData = await loadImageAsBase64(card.imageUrl);

      // Add image to PDF
      pdf.addImage(
        imageData,
        'JPEG',
        x,
        y,
        MTG_CARD_WIDTH_MM,
        MTG_CARD_HEIGHT_MM
      );

      // Optionally add card name below
      if (options.showCardNames) {
        const nameY = y + MTG_CARD_HEIGHT_MM + 2;
        if (nameY < A4_HEIGHT_MM - 5) {
          pdf.setFontSize(6);
          pdf.setTextColor(100, 100, 100);
          const displayName = card.isBackFace ? `${card.name} (back)` : card.name;
          pdf.text(displayName, x + MTG_CARD_WIDTH_MM / 2, nameY, { align: 'center' });
        }
      }
    } catch (error) {
      console.error(`Failed to load image for ${card.name}:`, error);
      // Draw placeholder rectangle for failed images
      pdf.setDrawColor(200, 200, 200);
      pdf.setFillColor(240, 240, 240);
      pdf.rect(x, y, MTG_CARD_WIDTH_MM, MTG_CARD_HEIGHT_MM, 'FD');
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(card.name, x + MTG_CARD_WIDTH_MM / 2, y + MTG_CARD_HEIGHT_MM / 2, {
        align: 'center',
      });
    }

    onProgress({
      phase: 'generating',
      current: i + 1,
      total: cardsForPdf.length,
      message: `Adding card ${i + 1}/${cardsForPdf.length}: ${card.name}`,
    });
  }

  // Add page numbers
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      `${deckName} - Page ${i} of ${pageCount}`,
      A4_WIDTH_MM / 2,
      A4_HEIGHT_MM - 5,
      { align: 'center' }
    );
  }

  onProgress({
    phase: 'complete',
    current: cardsForPdf.length,
    total: cardsForPdf.length,
    message: 'PDF generated successfully!',
  });

  // Return as Blob
  return pdf.output('blob');
}

/**
 * Calculate estimated page count for export options
 */
export function calculateEstimatedPages(
  commander: PrismaCard | null,
  cards: DeckCardWithCard[],
  options: PdfExportOptions
): { pages: number; totalCards: number } {
  let totalCards = 0;

  if (options.includeCommander && commander) {
    // Assume commander might be DFC (+1)
    totalCards += 2;
  }

  for (const deckCard of cards) {
    const category = deckCard.category;
    const qty = options.duplicateMultiples ? deckCard.quantity : 1;

    if (category === 'MAIN' && options.includeMainDeck) {
      // Assume some cards might be DFCs (+50% estimate)
      totalCards += qty;
    } else if (category === 'SIDEBOARD' && options.includeSideboard) {
      totalCards += qty;
    } else if (category === 'CONSIDERING' && options.includeConsidering) {
      totalCards += qty;
    }
  }

  const pages = Math.ceil(totalCards / CARDS_PER_PAGE);
  return { pages, totalCards };
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
