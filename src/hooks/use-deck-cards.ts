'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CardCategory } from '@/schemas/deck.schema';
import type { ScryfallCard } from '@/types/scryfall.types';

interface AddCardData {
  deckId: string;
  scryfallCard: ScryfallCard;
  quantity?: number;
  category?: CardCategory;
}

interface RemoveCardData {
  deckId: string;
  cardId: string;
}

async function addCardToDeck({ deckId, scryfallCard, quantity = 1, category = 'MAIN' }: AddCardData) {
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

async function removeCardFromDeck({ deckId, cardId }: RemoveCardData) {
  const response = await fetch(`/api/decks/${deckId}/cards`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cardId }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error ?? 'Failed to remove card');
  }
  return response.json();
}

export function useAddCardToDeck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addCardToDeck,
    onSuccess: (_, { deckId }) => {
      queryClient.invalidateQueries({ queryKey: ['deck', deckId] });
    },
  });
}

export function useRemoveCardFromDeck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeCardFromDeck,
    onSuccess: (_, { deckId }) => {
      queryClient.invalidateQueries({ queryKey: ['deck', deckId] });
    },
  });
}
