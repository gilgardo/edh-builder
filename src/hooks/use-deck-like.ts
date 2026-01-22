'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

interface LikeResponse {
  liked: boolean;
  likeCount: number;
}

async function likeDeck(deckId: string): Promise<LikeResponse> {
  const response = await fetch(`/api/decks/${deckId}/like`, {
    method: 'POST',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error ?? 'Failed to like deck');
  }
  return response.json();
}

async function unlikeDeck(deckId: string): Promise<LikeResponse> {
  const response = await fetch(`/api/decks/${deckId}/like`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error ?? 'Failed to unlike deck');
  }
  return response.json();
}

export function useLikeDeck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: likeDeck,
    onSuccess: (_data, deckId) => {
      queryClient.invalidateQueries({ queryKey: ['deck', deckId] });
      queryClient.invalidateQueries({ queryKey: ['decks'] });
    },
  });
}

export function useUnlikeDeck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unlikeDeck,
    onSuccess: (_data, deckId) => {
      queryClient.invalidateQueries({ queryKey: ['deck', deckId] });
      queryClient.invalidateQueries({ queryKey: ['decks'] });
    },
  });
}

export function useToggleDeckLike() {
  const likeMutation = useLikeDeck();
  const unlikeMutation = useUnlikeDeck();

  const toggle = async (deckId: string, isCurrentlyLiked: boolean) => {
    if (isCurrentlyLiked) {
      return unlikeMutation.mutateAsync(deckId);
    }
    return likeMutation.mutateAsync(deckId);
  };

  return {
    toggle,
    isPending: likeMutation.isPending || unlikeMutation.isPending,
  };
}
