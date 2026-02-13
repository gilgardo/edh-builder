import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicRoutes = ['/', '/login', '/register', '/about'];
const publicPrefixes = ['/api/auth', '/decks/public'];

const isPublic = (path: string) =>
  publicRoutes.includes(path) || publicPrefixes.some((p) => path.startsWith(p));

export function proxy(request: NextRequest) {
  const token =
    request.cookies.get('authjs.session-token') ??
    request.cookies.get('__Secure-authjs.session-token');

  if (!token && !isPublic(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/login', request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
