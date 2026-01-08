'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Deck, Card } from '@prisma/client';

export type DeckListItem = Deck & {
  user: { id: string; name: string | null; image: string | null };
  commander: { id: string; name: string; scryfallId: string; imageUris: { normal?: string; art_crop?: string } | null } | null;
  _count: { cards: number };
  favorites: { id: string }[];
};

interface DecksResponse {
  decks: DeckListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface DecksFilters {
  search?: string;
  colorIdentity?: string[];
  format?: 'COMMANDER' | 'BRAWL' | 'OATHBREAKER';
  isPublic?: boolean;
  userId?: string;
  page?: number;
  limit?: number;
}

async function fetchDecks(filters: DecksFilters): Promise<DecksResponse> {
  const params = new URLSearchParams();

  if (filters.search) params.set('search', filters.search);
  if (filters.colorIdentity?.length) params.set('colorIdentity', filters.colorIdentity.join(','));
  if (filters.format) params.set('format', filters.format);
  if (filters.isPublic !== undefined) params.set('isPublic', filters.isPublic.toString());
  if (filters.userId) params.set('userId', filters.userId);
  if (filters.page) params.set('page', filters.page.toString());
  if (filters.limit) params.set('limit', filters.limit.toString());

  const response = await fetch(`/api/decks?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch decks');
  }
  return response.json();
}

interface CreateDeckData {
  name: string;
  description?: string;
  format?: 'COMMANDER' | 'BRAWL' | 'OATHBREAKER';
  isPublic?: boolean;
  commanderId?: string;
  partnerId?: string;
}

async function createDeck(data: CreateDeckData): Promise<{ deck: Deck & { commander: Card | null } }> {
  const response = await fetch('/api/decks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error ?? 'Failed to create deck');
  }
  return response.json();
}

export function useDecks(filters: DecksFilters = {}) {
  return useQuery({
    queryKey: ['decks', filters],
    queryFn: () => fetchDecks(filters),
    staleTime: 60 * 1000, // 1 minute
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateDeck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDeck,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decks'] });
    },
  });
}
