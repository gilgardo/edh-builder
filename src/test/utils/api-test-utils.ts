/**
 * API testing utilities
 *
 * Helpers for creating NextRequest objects and testing API routes
 */

import { NextRequest } from 'next/server';

/**
 * Create a NextRequest for testing API routes
 */
export function createNextRequest(
  url: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    body?: unknown;
    headers?: Record<string, string>;
    searchParams?: Record<string, string>;
  } = {}
): NextRequest {
  const { method = 'GET', body, headers = {}, searchParams = {} } = options;

  // Build URL with search params
  const baseUrl = url.startsWith('http') ? url : `http://localhost:3000${url}`;
  const urlObj = new URL(baseUrl);

  for (const [key, value] of Object.entries(searchParams)) {
    urlObj.searchParams.set(key, value);
  }

  // Create request init with proper typing for NextRequest
  const init = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body && method !== 'GET' ? JSON.stringify(body) : undefined,
  };

  return new NextRequest(urlObj, init);
}

/**
 * Parse JSON response from NextResponse
 */
export async function parseJsonResponse<T = unknown>(
  response: Response
): Promise<{ status: number; data: T }> {
  const data = (await response.json()) as T;
  return {
    status: response.status,
    data,
  };
}

/**
 * Create a GET request with query params
 */
export function createGetRequest(
  path: string,
  params?: Record<string, string>
): NextRequest {
  return createNextRequest(path, {
    method: 'GET',
    searchParams: params,
  });
}

/**
 * Create a POST request with body
 */
export function createPostRequest(path: string, body: unknown): NextRequest {
  return createNextRequest(path, {
    method: 'POST',
    body,
  });
}

/**
 * Create a PUT request with body
 */
export function createPutRequest(path: string, body: unknown): NextRequest {
  return createNextRequest(path, {
    method: 'PUT',
    body,
  });
}

/**
 * Create a DELETE request
 */
export function createDeleteRequest(path: string): NextRequest {
  return createNextRequest(path, {
    method: 'DELETE',
  });
}

/**
 * Helper type for API error responses
 */
export interface ApiErrorResponse {
  error: string;
  details?: unknown;
  code?: string;
}

/**
 * Helper type for paginated responses
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
