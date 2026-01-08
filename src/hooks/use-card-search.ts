'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import type { ScryfallCard } from '@/types/scryfall.types';

interface SearchParams {
  query?: string;
  colors?: string[];
  colorIdentity?: string[];
  type?: string;
  cmc?: number;
  cmcOperator?: 'eq' | 'lt' | 'lte' | 'gt' | 'gte';
  rarity?: string;
  isCommander?: boolean;
  page?: number;
}

interface SearchResult {
  cards: ScryfallCard[];
  total: number;
  hasMore: boolean;
  page: number;
}

async function searchCards(params: SearchParams): Promise<SearchResult> {
  const searchParams = new URLSearchParams();

  if (params.query) searchParams.set('q', params.query);
  if (params.colors?.length) searchParams.set('colors', params.colors.join(''));
  if (params.colorIdentity?.length) searchParams.set('colorIdentity', params.colorIdentity.join(''));
  if (params.type) searchParams.set('type', params.type);
  if (params.cmc !== undefined) searchParams.set('cmc', params.cmc.toString());
  if (params.cmcOperator) searchParams.set('cmcOp', params.cmcOperator);
  if (params.rarity) searchParams.set('rarity', params.rarity);
  if (params.isCommander) searchParams.set('isCommander', 'true');
  if (params.page) searchParams.set('page', params.page.toString());

  const response = await fetch(`/api/cards?${searchParams}`);
  if (!response.ok) {
    throw new Error('Failed to search cards');
  }

  return response.json();
}

async function autocompleteCards(query: string): Promise<string[]> {
  if (query.length < 2) return [];

  const response = await fetch(`/api/cards?q=${encodeURIComponent(query)}&autocomplete=true`);
  if (!response.ok) return [];

  const data = await response.json();
  return data.suggestions ?? [];
}

export function useCardSearch(params: SearchParams, enabled = true) {
  const queryKey = useMemo(
    () => ['cards', 'search', params],
    [params]
  );

  return useQuery({
    queryKey,
    queryFn: () => searchCards(params),
    enabled: enabled && (!!params.query || !!params.type || !!params.colors?.length),
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: (previousData) => previousData,
  });
}

export function useCardAutocomplete(query: string) {
  return useQuery({
    queryKey: ['cards', 'autocomplete', query],
    queryFn: () => autocompleteCards(query),
    enabled: query.length >= 2,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useCardSearchState() {
  const [query, setQuery] = useState('');
  const [colors, setColors] = useState<string[]>([]);
  const [colorIdentity, setColorIdentity] = useState<string[]>([]);
  const [type, setType] = useState('');
  const [cmc, setCmc] = useState<number | undefined>(undefined);
  const [cmcOperator, setCmcOperator] = useState<'eq' | 'lt' | 'lte' | 'gt' | 'gte'>('eq');
  const [rarity, setRarity] = useState('');
  const [isCommander, setIsCommander] = useState(false);
  const [page, setPage] = useState(1);

  const params = useMemo<SearchParams>(
    () => ({
      query: query || undefined,
      colors: colors.length ? colors : undefined,
      colorIdentity: colorIdentity.length ? colorIdentity : undefined,
      type: type || undefined,
      cmc,
      cmcOperator,
      rarity: rarity || undefined,
      isCommander: isCommander || undefined,
      page,
    }),
    [query, colors, colorIdentity, type, cmc, cmcOperator, rarity, isCommander, page]
  );

  const resetFilters = () => {
    setQuery('');
    setColors([]);
    setColorIdentity([]);
    setType('');
    setCmc(undefined);
    setRarity('');
    setIsCommander(false);
    setPage(1);
  };

  return {
    params,
    query,
    setQuery,
    colors,
    setColors,
    colorIdentity,
    setColorIdentity,
    type,
    setType,
    cmc,
    setCmc,
    cmcOperator,
    setCmcOperator,
    rarity,
    setRarity,
    isCommander,
    setIsCommander,
    page,
    setPage,
    resetFilters,
  };
}
