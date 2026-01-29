'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ImportPreview, CardResolution } from '@/schemas/import.schema';
import type { ScryfallCard } from '@/types/scryfall.types';
import type { CardCategory } from '@/schemas/deck.schema';

// ============================================
// Types
// ============================================

interface MoxfieldImportResult extends ImportPreview {
  description?: string;
  authorUsername?: string;
}

type TextImportResult = ImportPreview;

interface ImportProgress {
  current: number;
  total: number;
  currentCardName: string;
  status: 'idle' | 'importing' | 'completed' | 'error';
  errors: Array<{ name: string; error: string }>;
}

interface ImportDeckOptions {
  deckId: string;
  cards: CardResolution[];
  onProgress?: (progress: ImportProgress) => void;
}

// ============================================
// API Functions
// ============================================

async function fetchMoxfieldDeck(url: string): Promise<MoxfieldImportResult> {
  const response = await fetch('/api/import/moxfield', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error ?? 'Failed to fetch Moxfield deck');
  }

  return response.json();
}

async function parseTextDeckList(text: string): Promise<TextImportResult> {
  const response = await fetch('/api/import/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error ?? 'Failed to parse deck list');
  }

  return response.json();
}

async function addCardToDeck(
  deckId: string,
  scryfallCard: ScryfallCard,
  quantity: number,
  category: CardCategory
) {
  const response = await fetch(`/api/decks/${deckId}/cards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scryfallCard, quantity, category }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error ?? 'Failed to add card');
  }

  return response.json();
}

// Rate-limited card import with progress
async function importCardsWithProgress(options: ImportDeckOptions): Promise<{
  imported: number;
  errors: Array<{ name: string; error: string }>;
}> {
  const { deckId, cards, onProgress } = options;
  const resolvedCards = cards.filter((c) => c.resolved && c.scryfallCard);
  const errors: Array<{ name: string; error: string }> = [];
  let imported = 0;

  const progress: ImportProgress = {
    current: 0,
    total: resolvedCards.length,
    currentCardName: '',
    status: 'importing',
    errors: [],
  };

  onProgress?.(progress);

  for (const card of resolvedCards) {
    progress.currentCardName = card.name;
    progress.current = imported;
    onProgress?.(progress);

    try {
      await addCardToDeck(deckId, card.scryfallCard as ScryfallCard, card.quantity, card.category);
      imported++;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push({ name: card.name, error: errorMessage });
      progress.errors = errors;
    }

    // Rate limit: 100ms between requests
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  progress.status = errors.length > 0 ? 'error' : 'completed';
  progress.current = imported;
  onProgress?.(progress);

  return { imported, errors };
}

// ============================================
// Hooks
// ============================================

/**
 * Hook to fetch and preview a deck from Moxfield
 */
export function useMoxfieldImport() {
  return useMutation({
    mutationFn: fetchMoxfieldDeck,
  });
}

/**
 * Hook to parse and preview a text deck list
 */
export function useTextImport() {
  return useMutation({
    mutationFn: parseTextDeckList,
  });
}

/**
 * Hook to import cards into an existing deck with progress tracking
 */
export function useImportDeck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: importCardsWithProgress,
    onSuccess: (_, { deckId }) => {
      queryClient.invalidateQueries({ queryKey: ['deck', deckId] });
      queryClient.invalidateQueries({ queryKey: ['decks'] });
    },
  });
}

// ============================================
// Utility functions
// ============================================

/**
 * Get list of resolved cards from import preview
 */
export function getResolvedCards(preview: ImportPreview): CardResolution[] {
  const resolved: CardResolution[] = [];

  // Add commander if resolved
  if (preview.commander?.resolved && preview.commander.scryfallCard) {
    resolved.push(preview.commander);
  }

  // Add resolved cards (excluding commander to avoid duplicates)
  for (const card of preview.cards) {
    if (card.resolved && card.scryfallCard && card.category !== 'COMMANDER') {
      resolved.push(card);
    }
  }

  return resolved;
}

/**
 * Get list of unresolved card names from import preview
 */
export function getUnresolvedCards(preview: ImportPreview): CardResolution[] {
  const unresolved: CardResolution[] = [];

  if (preview.commander && !preview.commander.resolved) {
    unresolved.push(preview.commander);
  }

  for (const card of preview.cards) {
    if (!card.resolved) {
      unresolved.push(card);
    }
  }

  return unresolved;
}
