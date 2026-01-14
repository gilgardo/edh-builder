'use client';

import { useReducer } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ScryfallCard } from '@/types/scryfall.types';

/* ============================================================
   Types
============================================================ */

export enum CmcOperator {
  eq = 'eq',
  lt = 'lt',
  lte = 'lte',
  gt = 'gt',
  gte = 'gte',
}

interface SearchParams {
  query: string;
  colors: string[];
  colorIdentity: string[];
  type?: string;
  cmc?: number;
  cmcOperator: CmcOperator;
  rarity?: string;
  isCommander: boolean;
  page: number;
}

interface SearchResult {
  cards: ScryfallCard[];
  total: number;
  hasMore: boolean;
  page: number;
}

type UseCardSearchOptions = Partial<
  Pick<SearchParams, 'colorIdentity' | 'isCommander' | 'rarity' | 'type' | 'query'>
>;

/* ============================================================
   API
============================================================ */

async function searchCards(params: SearchParams): Promise<SearchResult> {
  const searchParams = new URLSearchParams();

  if (params.query) searchParams.set('q', params.query);
  if (params.colors.length) searchParams.set('colors', params.colors.join(''));
  if (params.colorIdentity.length) searchParams.set('colorIdentity', params.colorIdentity.join(''));
  if (params.type) searchParams.set('type', params.type);
  if (params.cmc !== undefined) searchParams.set('cmc', params.cmc.toString());
  if (params.cmcOperator) searchParams.set('cmcOp', params.cmcOperator);
  if (params.rarity) searchParams.set('rarity', params.rarity);
  if (params.isCommander) searchParams.set('isCommander', 'true');
  searchParams.set('page', params.page.toString());

  const response = await fetch(`/api/cards?${searchParams}`);
  if (!response.ok) throw new Error('Failed to search cards');

  return response.json();
}

/* ============================================================
   State
============================================================ */

const baseSearchParams: SearchParams = {
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
  | { type: 'toggleColor'; color: string }
  | { type: 'setType'; cardType: string }
  | { type: 'setCmc'; cmc?: number; cmcOperator: CmcOperator }
  | { type: 'setRarity'; rarity: string }
  | { type: 'setPage'; page: number }
  | { type: 'reset' };

function reducer(state: SearchParams, action: SearchAction): SearchParams {
  switch (action.type) {
    case 'setQuery':
      return { ...state, query: action.query, page: 1 };

    case 'toggleColor': {
      const exists = state.colors.includes(action.color);
      const colors = exists
        ? state.colors.filter((c) => c !== action.color)
        : [...state.colors, action.color];

      return { ...state, colors, page: 1 };
    }

    case 'setType':
      return { ...state, type: action.cardType, page: 1 };

    case 'setCmc':
      return { ...state, cmc: action.cmc, cmcOperator: action.cmcOperator, page: 1 };

    case 'setRarity':
      return { ...state, rarity: action.rarity, page: 1 };

    case 'setPage':
      return { ...state, page: action.page };

    case 'reset':
      return baseSearchParams;

    default:
      return state;
  }
}

/* ============================================================
   Hook
============================================================ */

export function useCardSearch(options: UseCardSearchOptions = {}, enabled = true) {
  const [params, dispatch] = useReducer(reducer, baseSearchParams);

  // Merge user-controlled state with external options
  // External options (colorIdentity, isCommander) take precedence
  const mergedParams = { ...params, ...options };

  const query = useQuery({
    queryKey: ['cards', 'search', mergedParams],
    queryFn: () => searchCards(mergedParams),
    enabled: enabled && mergedParams.query.length >= 3,
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  return {
    /* React Query */
    ...query,

    /* Data shortcuts */
    cards: query.data?.cards ?? [],
    total: query.data?.total ?? 0,
    hasMore: query.data?.hasMore ?? false,
    page: mergedParams.page,

    /* State */
    params: mergedParams,

    /* Actions */
    setQuery: (query: string) => dispatch({ type: 'setQuery', query }),

    toggleColor: (color: string) => dispatch({ type: 'toggleColor', color }),

    setType: (type: string) => dispatch({ type: 'setType', cardType: type }),

    setCmc: (cmc?: number, op: CmcOperator = CmcOperator.eq) =>
      dispatch({ type: 'setCmc', cmc, cmcOperator: op }),

    setRarity: (rarity: string) => dispatch({ type: 'setRarity', rarity }),

    nextPage: () => dispatch({ type: 'setPage', page: params.page + 1 }),

    prevPage: () => dispatch({ type: 'setPage', page: Math.max(1, params.page - 1) }),

    reset: () => dispatch({ type: 'reset' }),
  };
}
