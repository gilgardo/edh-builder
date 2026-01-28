import { DisplayCard } from '@/types/cards';
import type {
  ScryfallCard,
  ScryfallSearchResponse,
  ScryfallAutocompleteResponse,
  ScryfallError,
} from '@/types/scryfall.types';
import { isScryfallError } from '@/types/scryfall.types';

const SCRYFALL_API_BASE = 'https://api.scryfall.com';
const RATE_LIMIT_MS = 100; // Scryfall requires 100ms between requests

let lastRequestTime = 0;

/**
 * Rate-limited fetch for Scryfall API
 */
async function scryfallFetch<T>(url: string): Promise<T | ScryfallError> {
  // Enforce rate limiting
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < RATE_LIMIT_MS) {
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_MS - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  const data = await response.json();

  if (!response.ok || isScryfallError(data)) {
    return data as ScryfallError;
  }

  return data as T;
}

export interface SearchFilters {
  query?: string;
  colors?: string[];
  colorIdentity?: string[];
  type?: string;
  cmc?: number;
  cmcOperator?: 'eq' | 'lt' | 'lte' | 'gt' | 'gte';
  rarity?: string;
  set?: string;
  isCommander?: boolean;
  isLegal?: boolean;
  page?: number;
}

/**
 * Build Scryfall search query string from filters
 */
function buildSearchQuery(filters: SearchFilters): string {
  const parts: string[] = [];

  if (filters.query) {
    parts.push(filters.query);
  }

  if (filters.colors && filters.colors.length > 0) {
    parts.push(`c:${filters.colors.join('')}`);
  }

  if (filters.colorIdentity && filters.colorIdentity.length > 0) {
    parts.push(`id<=${filters.colorIdentity.join('')}`);
  }

  if (filters.type) {
    parts.push(`t:${filters.type}`);
  }

  if (filters.cmc !== undefined) {
    const op = filters.cmcOperator ?? 'eq';
    const opMap = { eq: '=', lt: '<', lte: '<=', gt: '>', gte: '>=' };
    parts.push(`cmc${opMap[op]}${filters.cmc}`);
  }

  if (filters.rarity) {
    parts.push(`r:${filters.rarity}`);
  }

  if (filters.set) {
    parts.push(`s:${filters.set}`);
  }

  if (filters.isCommander) {
    parts.push('is:commander');
  }

  if (filters.isLegal !== false) {
    parts.push('f:commander');
  }

  return parts.join(' ');
}

/**
 * Search for cards using Scryfall
 */
export async function searchCards(
  filters: SearchFilters
): Promise<{ cards: ScryfallCard[]; total: number; hasMore: boolean; error?: string }> {
  const query = buildSearchQuery(filters);

  if (!query.trim()) {
    return { cards: [], total: 0, hasMore: false };
  }

  const params = new URLSearchParams({
    q: query,
    unique: 'cards',
    order: 'name',
    dir: 'asc',
  });

  if (filters.page && filters.page > 1) {
    params.set('page', filters.page.toString());
  }

  const url = `${SCRYFALL_API_BASE}/cards/search?${params}`;
  const result = await scryfallFetch<ScryfallSearchResponse>(url);

  if (isScryfallError(result)) {
    if (result.code === 'not_found') {
      return { cards: [], total: 0, hasMore: false };
    }
    return { cards: [], total: 0, hasMore: false, error: result.details };
  }

  return {
    cards: result.data,
    total: result.total_cards,
    hasMore: result.has_more,
  };
}

/**
 * Get a single card by Scryfall ID
 */
export async function getCard(scryfallId: string): Promise<ScryfallCard | null> {
  const url = `${SCRYFALL_API_BASE}/cards/${scryfallId}`;
  const result = await scryfallFetch<ScryfallCard>(url);

  if (isScryfallError(result)) {
    return null;
  }

  return result;
}

/**
 * Get a single card by name (exact match)
 */
export async function getCardByName(name: string, fuzzy = false): Promise<ScryfallCard | null> {
  const params = new URLSearchParams({
    [fuzzy ? 'fuzzy' : 'exact']: name,
  });

  const url = `${SCRYFALL_API_BASE}/cards/named?${params}`;
  const result = await scryfallFetch<ScryfallCard>(url);

  if (isScryfallError(result)) {
    return null;
  }

  return result;
}

/**
 * Autocomplete card names
 */
export async function autocompleteCardName(query: string): Promise<string[]> {
  if (query.length < 2) {
    return [];
  }

  const params = new URLSearchParams({ q: query });
  const url = `${SCRYFALL_API_BASE}/cards/autocomplete?${params}`;
  const result = await scryfallFetch<ScryfallAutocompleteResponse>(url);

  if (isScryfallError(result)) {
    return [];
  }

  return result.data;
}

/**
 * Get a random card (optionally with filters)
 */
export async function getRandomCard(filters?: SearchFilters): Promise<ScryfallCard | null> {
  let url = `${SCRYFALL_API_BASE}/cards/random`;

  if (filters) {
    const query = buildSearchQuery(filters);
    if (query) {
      url += `?q=${encodeURIComponent(query)}`;
    }
  }

  const result = await scryfallFetch<ScryfallCard>(url);

  if (isScryfallError(result)) {
    return null;
  }

  return result;
}

/**
 * Search for valid commanders
 */
export async function searchCommanders(
  query: string,
  colorIdentity?: string[]
): Promise<ScryfallCard[]> {
  const filters: SearchFilters = {
    query,
    isCommander: true,
    isLegal: true,
  };

  if (colorIdentity && colorIdentity.length > 0) {
    filters.colorIdentity = colorIdentity;
  }

  const result = await searchCards(filters);
  return result.cards;
}

/**
 * Get card image URL with fallback for double-faced cards
 */
export function getCardImageUrl(
  card: ScryfallCard | DisplayCard,
  size: 'small' | 'normal' | 'large' | 'png' = 'normal'
): string {
  // Handle DisplayCard (camelCase imageUris)
  if ('imageUris' in card && card.imageUris) {
    const uris = card.imageUris as Record<string, string>;
    return uris[size] ?? uris.normal ?? 'https://cards.scryfall.io/normal/back.jpg';
  }

  // Handle ScryfallCard (snake_case image_uris)
  if ('image_uris' in card && card.image_uris) {
    return card.image_uris[size];
  }

  // Double-faced cards - use the front face (ScryfallCard only)
  if ('card_faces' in card && card.card_faces?.[0]?.image_uris) {
    return card.card_faces[0].image_uris[size];
  }

  // Fallback to Scryfall's default card back
  return 'https://cards.scryfall.io/normal/back.jpg';
}

/**
 * Get mana cost string, handling double-faced cards
 */
export function getCardManaCost(card: ScryfallCard): string | undefined {
  if (card.mana_cost) {
    return card.mana_cost;
  }

  if (card.card_faces && card.card_faces[0]?.mana_cost) {
    return card.card_faces[0].mana_cost;
  }

  return undefined;
}

/**
 * Get all printings of a card by oracle_id
 */
export async function getCardPrintings(
  oracleId: string
): Promise<{ cards: ScryfallCard[]; error?: string }> {
  const params = new URLSearchParams({
    q: `oracle_id:${oracleId}`,
    unique: 'prints',
    order: 'released',
    dir: 'desc',
  });

  const url = `${SCRYFALL_API_BASE}/cards/search?${params}`;
  const result = await scryfallFetch<ScryfallSearchResponse>(url);

  if (isScryfallError(result)) {
    return { cards: [], error: result.details };
  }

  return { cards: result.data };
}

interface ScryfallCollectionResponse {
  object: 'list';
  not_found: Array<{ id?: string; name?: string }>;
  data: ScryfallCard[];
}

/**
 * Fetch multiple cards by Scryfall IDs in a single request
 * Scryfall accepts up to 75 identifiers per request
 */
export async function getCardsByIds(
  scryfallIds: string[]
): Promise<Map<string, ScryfallCard>> {
  const results = new Map<string, ScryfallCard>();

  if (scryfallIds.length === 0) {
    return results;
  }

  // Scryfall collection endpoint accepts max 75 cards per request
  const BATCH_SIZE = 75;
  const batches: string[][] = [];

  for (let i = 0; i < scryfallIds.length; i += BATCH_SIZE) {
    batches.push(scryfallIds.slice(i, i + BATCH_SIZE));
  }

  for (const batch of batches) {
    // Rate limit between batches
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < RATE_LIMIT_MS) {
      await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_MS - timeSinceLastRequest));
    }
    lastRequestTime = Date.now();

    const identifiers = batch.map((id) => ({ id }));

    const response = await fetch(`${SCRYFALL_API_BASE}/cards/collection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ identifiers }),
    });

    if (!response.ok) {
      console.error('Scryfall collection fetch failed:', response.status);
      continue;
    }

    const data: ScryfallCollectionResponse = await response.json();

    for (const card of data.data) {
      results.set(card.id, card);
    }
  }

  return results;
}
