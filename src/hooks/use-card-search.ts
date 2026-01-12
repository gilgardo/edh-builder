'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useReducer } from 'react';
import type { ScryfallCard } from '@/types/scryfall.types';

export enum CmcOperator {
  eq = 'eq',
  lt = 'lt',
  lte = 'lte',
  gt = 'gt',
  gte = 'gte',
}

interface SearchParams {
  query?: string;
  colors: string[];
  colorIdentity?: string[];
  type?: string;
  cmc?: number;
  cmcOperator: CmcOperator;
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
  if (params.colorIdentity?.length)
    searchParams.set('colorIdentity', params.colorIdentity.join(''));
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
  if (query.length < 3) return [];

  const response = await fetch(`/api/cards?q=${encodeURIComponent(query)}&autocomplete=true`);
  if (!response.ok) return [];

  const data = await response.json();
  return data.suggestions ?? [];
}

export function useCardSearch(params: SearchParams, enabled = true) {
  const queryKey = useMemo(() => ['cards', 'search', params], [params]);

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
export const baseSearchParams: SearchParams = {
  query: '',
  colors: [],
  colorIdentity: [],
  type: '',
  cmc: undefined,
  cmcOperator: CmcOperator.eq,
  rarity: '',
  isCommander: false,
  page: 1,
};

type SearchAction =
  | { type: 'setQuery'; query: string }
  | { type: 'setBaseParams'; baseParams: { colorIdentity: string[]; isCommander: boolean } }
  | { type: 'setColors'; colors: string[] }
  | { type: 'toggleColor'; color: string }
  | { type: 'setType'; cardType: string }
  | { type: 'setCmc'; cmcSearch: { cmc?: number; cmcOperator: CmcOperator } }
  | { type: 'setPage'; page: number }
  | { type: 'reset' };

const searchReducer = (state: SearchParams, action: SearchAction): SearchParams => {
  switch (action.type) {
    case 'setQuery':
      return { ...state, query: action.query, page: 1 };

    case 'setBaseParams':
      return { ...state, ...action.baseParams };

    case 'setColors':
      return { ...state, colors: action.colors, page: 1 };

    case 'toggleColor':
      const colors = state.colors;
      const newColors = colors.includes(action.color)
        ? colors.filter((c) => c !== action.color)
        : [...colors, action.color];
      return { ...state, colors: newColors };

    case 'setType':
      return { ...state, type: action.cardType, page: 1 };

    case 'setCmc':
      return { ...state, ...action.cmcSearch, page: 1 };

    case 'setPage':
      return { ...state, page: action.page };

    case 'reset':
      return baseSearchParams;

    default:
      return state;
  }
};

export function useCardSearchState() {
  const [searchParams, dispatch] = useReducer(searchReducer, baseSearchParams);

  return {
    params: searchParams,
    dispatch,
  };
}
