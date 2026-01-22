'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { DeckReviewWithUser } from '@/types/social.types';
import type { CreateReviewInput, UpdateReviewInput } from '@/schemas/social.schema';

interface ReviewsResponse {
  reviews: DeckReviewWithUser[];
  total: number;
  page: number;
  limit: number;
  averageRating: number | null;
}

async function fetchDeckReviews(deckId: string, page = 1, limit = 10): Promise<ReviewsResponse> {
  const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
  const response = await fetch(`/api/decks/${deckId}/reviews?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch reviews');
  }
  return response.json();
}

async function createReview(params: { deckId: string; data: CreateReviewInput }): Promise<DeckReviewWithUser> {
  const response = await fetch(`/api/decks/${params.deckId}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params.data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error ?? 'Failed to create review');
  }
  return response.json();
}

async function updateReview(params: {
  deckId: string;
  reviewId: string;
  data: UpdateReviewInput;
}): Promise<DeckReviewWithUser> {
  const response = await fetch(`/api/decks/${params.deckId}/reviews/${params.reviewId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params.data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error ?? 'Failed to update review');
  }
  return response.json();
}

async function deleteReview(params: { deckId: string; reviewId: string }): Promise<void> {
  const response = await fetch(`/api/decks/${params.deckId}/reviews/${params.reviewId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error ?? 'Failed to delete review');
  }
}

export function useDeckReviews(deckId: string, page = 1, limit = 10) {
  return useQuery({
    queryKey: ['reviews', deckId, page, limit],
    queryFn: () => fetchDeckReviews(deckId, page, limit),
    staleTime: 60 * 1000,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createReview,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.deckId] });
      queryClient.invalidateQueries({ queryKey: ['deck', variables.deckId] });
    },
  });
}

export function useUpdateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateReview,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.deckId] });
    },
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteReview,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.deckId] });
      queryClient.invalidateQueries({ queryKey: ['deck', variables.deckId] });
    },
  });
}
