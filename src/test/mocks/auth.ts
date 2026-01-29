import { vi, beforeEach } from 'vitest';

export interface MockUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

export interface MockSession {
  user: MockUser;
  expires: string;
}

// Default mock session (using CUID-format ID for schema validation)
export const defaultMockUser: MockUser = {
  id: 'clh0000000000000user0001',
  name: 'Test User',
  email: 'test@example.com',
  image: null,
};

export const defaultMockSession: MockSession = {
  user: defaultMockUser,
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

// Store current mock session (can be modified per test)
let currentSession: MockSession | null = defaultMockSession;

// Mock the auth function
export const authMock = vi.fn(async () => currentSession);

vi.mock('@/lib/auth', () => ({
  auth: authMock,
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

// Helper functions to control auth state in tests
export function setMockSession(session: MockSession | null) {
  currentSession = session;
  authMock.mockResolvedValue(session);
}

export function setAuthenticated(user: Partial<MockUser> = {}) {
  const session: MockSession = {
    user: { ...defaultMockUser, ...user },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
  setMockSession(session);
  return session;
}

export function setUnauthenticated() {
  setMockSession(null);
}

// Reset to default authenticated state before each test
beforeEach(() => {
  setAuthenticated();
});
