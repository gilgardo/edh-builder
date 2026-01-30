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

interface ImageUris {
  small?: string;
  normal?: string;
  large?: string;
  png?: string;
}

interface CardFace {
  name: string;
  image_uris?: ImageUris;
}

interface ScryfallCardData {
  layout: string;
  card_faces?: CardFace[];
  image_uris?: ImageUris;
}

/**
 * Layouts that have double-faced cards requiring both sides to be printed
 */
const DOUBLE_FACED_LAYOUTS = [
  'transform',
  'modal_dfc',
  'reversible_card',
  'double_faced_token',
];

/**
 * Fetch card data from Scryfall to get full card info including faces
 */
async function fetchScryfallCard(scryfallId: string): Promise<ScryfallCardData | null> {
  try {
    const response = await fetch(`https://api.scryfall.com/cards/${scryfallId}`);
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

/**
 * Check if a card is double-faced and needs both sides printed
 */
function isDoubleFacedCard(layout: string): boolean {
  return DOUBLE_FACED_LAYOUTS.includes(layout);
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
 * Delay between Scryfall API requests to respect rate limits (10 req/sec)
 */
const SCRYFALL_REQUEST_DELAY_MS = 100;

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

  // Calculate total images to load (accounting for potential DFCs and quantities)
  let totalImages = cardsToProcess.reduce((sum, c) => sum + c.quantity, 0);
  // DFCs will add extra images, but we'll estimate this as we go
  let loadedImages = 0;

  onProgress({
    phase: 'loading',
    current: 0,
    total: totalImages,
    message: 'Loading card images...',
  });

  // Process each card
  for (const { card, quantity } of cardsToProcess) {
    const scryfallId = card.scryfallId;
    const cardImages: CardForPdf[] = [];

    // Fetch full card data from Scryfall to check for double-faced
    const scryfallData = await fetchScryfallCard(scryfallId);

    if (scryfallData && isDoubleFacedCard(scryfallData.layout) && scryfallData.card_faces) {
      // Double-faced card - get both faces
      const cardFaces = scryfallData.card_faces;
      for (let faceIndex = 0; faceIndex < cardFaces.length; faceIndex++) {
        const face = cardFaces[faceIndex];
        if (face) {
          const imageUrl = getBestImageUrl(face.image_uris);
          if (imageUrl) {
            cardImages.push({
              name: face.name,
              imageUrl,
              isBackFace: faceIndex > 0,
            });
          }
        }
      }
      // Update total for the extra face
      totalImages += quantity; // Each DFC adds one extra image per copy
    } else {
      // Single-faced card
      const imageUris = card.imageUris as ImageUris | null;
      const imageUrl = getBestImageUrl(imageUris ?? undefined) ??
        (scryfallData ? getBestImageUrl(scryfallData.image_uris) : null);

      if (imageUrl) {
        cardImages.push({
          name: card.name,
          imageUrl,
          isBackFace: false,
        });
      }
    }

    // Add copies based on quantity
    for (let i = 0; i < quantity; i++) {
      for (const cardImage of cardImages) {
        result.push(cardImage);
        loadedImages++;
        onProgress({
          phase: 'loading',
          current: loadedImages,
          total: totalImages,
          message: `Loading: ${cardImage.name}${cardImage.isBackFace ? ' (back)' : ''}`,
        });
      }
    }

    // Delay to respect Scryfall rate limits (10 req/sec)
    await new Promise(resolve => setTimeout(resolve, SCRYFALL_REQUEST_DELAY_MS));
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
