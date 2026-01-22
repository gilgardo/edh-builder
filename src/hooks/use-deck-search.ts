import { useQuery } from '@tanstack/react-query';
import type { DeckSearchResult } from '@/components/cards/card-search-input';

/**
 * Hook to search decks by query string
 * Only triggers search when query is at least 3 characters
 */
export function useDeckSearch(query: string) {
  return useQuery({
    queryKey: ['decks-search', query],
    queryFn: async () => {
      const res = await fetch(`/api/decks?search=${encodeURIComponent(query)}&limit=4`);
      if (!res.ok) throw new Error('Failed to search decks');
      const data = await res.json();
      return data.decks as DeckSearchResult[];
    },
    enabled: query.length >= 3,
    staleTime: 5 * 60 * 1000,
  });
}
