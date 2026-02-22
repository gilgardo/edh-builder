import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicRoutes = ['/', '/login', '/register', '/about'];
const publicPrefixes = ['/api/auth', '/api/health', '/api/images', '/api/cards', '/api/decks'];
const authRoutes = ['/login', '/register'];

// Allows /decks (browse) and /decks/[deckId] (view), but not /decks/new or /decks/[id]/edit
const publicDeckPath = /^\/decks(\/(?!new\b)[^/]+)?$/;

const isPublic = (path: string) =>
  publicRoutes.includes(path) ||
  publicPrefixes.some((p) => path.startsWith(p)) ||
  publicDeckPath.test(path);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token =
    request.cookies.get('authjs.session-token') ??
    request.cookies.get('__Secure-authjs.session-token');

  // Authenticated users should not land on login/register
  if (token && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/decks', request.nextUrl));
  }

  // Unauthenticated users can only access public routes
  if (!token && !isPublic(pathname)) {
    return NextResponse.redirect(new URL('/login', request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
