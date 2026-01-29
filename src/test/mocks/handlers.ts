/**
 * MSW Request Handlers
 *
 * Intercepts HTTP requests for testing external API interactions
 */

import { http, HttpResponse } from 'msw';
import { moxfieldDecks, nonExistentDeckIds, privateDeckIds } from './moxfield';
import { createCollectionResponse, createAutocompleteResponse, getScryfallCardByName } from './scryfall';

const MOXFIELD_API_BASE = 'https://api2.moxfield.com/v2';
const SCRYFALL_API_BASE = 'https://api.scryfall.com';

export const handlers = [
  // Moxfield deck fetch
  http.get(`${MOXFIELD_API_BASE}/decks/all/:deckId`, ({ params }) => {
    const deckId = params.deckId as string;

    // Check for non-existent decks
    if (nonExistentDeckIds.includes(deckId)) {
      return new HttpResponse(null, { status: 404 });
    }

    // Check for private decks
    if (privateDeckIds.includes(deckId)) {
      return new HttpResponse(null, { status: 403 });
    }

    // Return deck if it exists
    const deck = moxfieldDecks[deckId];
    if (deck) {
      return HttpResponse.json(deck);
    }

    // Default: not found
    return new HttpResponse(null, { status: 404 });
  }),

  // Scryfall card collection lookup (supports both name and id identifiers)
  http.post(`${SCRYFALL_API_BASE}/cards/collection`, async ({ request }) => {
    const body = (await request.json()) as { identifiers: Array<{ name?: string; id?: string }> };
    const response = createCollectionResponse(body.identifiers);
    return HttpResponse.json(response);
  }),

  // Scryfall autocomplete
  http.get(`${SCRYFALL_API_BASE}/cards/autocomplete`, ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';

    // Simple mock: return suggestions based on query prefix
    const allCardNames = [
      'Sol Ring',
      'Lightning Bolt',
      'Kenrith, the Returned King',
      'Counterspell',
      'Island',
    ];

    const suggestions = allCardNames.filter((name) =>
      name.toLowerCase().includes(query.toLowerCase())
    );

    return HttpResponse.json(createAutocompleteResponse(query, suggestions));
  }),

  // Scryfall fetch card by ID
  http.get(`${SCRYFALL_API_BASE}/cards/:id`, ({ params }) => {
    const id = params.id as string;

    // For simplicity, just return sol ring if the ID matches UUID format
    if (id.includes('-')) {
      return HttpResponse.json(getScryfallCardByName('sol ring'));
    }

    return new HttpResponse(null, { status: 404 });
  }),
];

// Helper to add custom handlers for specific tests
export function createMoxfieldDeckHandler(deckId: string, response: object, status = 200) {
  return http.get(`${MOXFIELD_API_BASE}/decks/all/${deckId}`, () => {
    if (status !== 200) {
      return new HttpResponse(null, { status });
    }
    return HttpResponse.json(response);
  });
}

export function createScryfallCollectionHandler(
  responseFn: (identifiers: Array<{ name?: string; id?: string }>) => {
    data: object[];
    not_found: Array<{ name?: string; id?: string }>;
  }
) {
  return http.post(`${SCRYFALL_API_BASE}/cards/collection`, async ({ request }) => {
    const body = (await request.json()) as { identifiers: Array<{ name?: string; id?: string }> };
    return HttpResponse.json(responseFn(body.identifiers));
  });
}
