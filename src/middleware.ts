import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

const publicRoutes = ['/', '/login', '/register', '/about'];
const publicPrefixes = ['/api/auth', '/decks/public'];

const isPublic = (path: string) =>
  publicRoutes.includes(path) || publicPrefixes.some((route) => path.startsWith(route));

export default auth((req) => {
  if (!req.auth && !isPublic(req.nextUrl.pathname))
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
