'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Deck, DeckCard, Card } from '@prisma/client';

type DeckWithRelations = Deck & {
  user: { id: string; name: string | null; image: string | null };
  commander: Card | null;
  partner: Card | null;
  cards: (DeckCard & { card: Card })[];
  tags: { tag: { id: string; name: string } }[];
  favorites: { id: string }[];
};

interface DeckResponse {
  deck: DeckWithRelations;
  isLiked: boolean;
}

async function fetchDeck(deckId: string): Promise<DeckResponse> {
  const response = await fetch(`/api/decks/${deckId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch deck');
  }
  return response.json();
}

async function updateDeck(
  deckId: string,
  data: Partial<{ name: string; description: string; isPublic: boolean }>
): Promise<{ deck: DeckWithRelations }> {
  const response = await fetch(`/api/decks/${deckId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update deck');
  }
  return response.json();
}

async function deleteDeck(deckId: string): Promise<void> {
  const response = await fetch(`/api/decks/${deckId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete deck');
  }
}

export function useDeck(deckId: string | undefined) {
  return useQuery({
    queryKey: ['deck', deckId],
    queryFn: () => fetchDeck(deckId!),
    enabled: !!deckId,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useUpdateDeck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ deckId, data }: { deckId: string; data: Parameters<typeof updateDeck>[1] }) =>
      updateDeck(deckId, data),
    onSuccess: (_, { deckId }) => {
      queryClient.invalidateQueries({ queryKey: ['deck', deckId] });
      queryClient.invalidateQueries({ queryKey: ['decks'] });
    },
  });
}

export function useDeleteDeck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDeck,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decks'] });
    },
  });
}
