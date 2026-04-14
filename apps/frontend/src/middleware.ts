/**
 * Next.js middleware — guards protected routes.
 * Redirects unauthenticated users to /auth/login unless they have
 * the guest-mode flag set in localStorage (carried via a cookie).
 *
 * Protected routes: /profile, /scores
 * Auth routes: /auth/login, /auth/register (skip if already authenticated)
 */

import { type NextRequest, NextResponse } from 'next/server';

/** Routes that require authentication or guest mode confirmation. */
const PROTECTED_PATHS = ['/profile', '/scores'];

/** Auth routes — redirect away if already have a session. */
const AUTH_PATHS = ['/auth/login', '/auth/register'];

/**
 * Middleware function evaluated for every matching request.
 * Reads a `unravel-auth` cookie written by the auth store's persist layer
 * and a `unravel-guest` cookie for guest mode.
 *
 * @param request - Incoming Next.js request
 * @returns NextResponse (redirect or pass-through)
 */
export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Read persisted auth state from Zustand's localStorage persist (cookie mirror)
  const authCookie = request.cookies.get('unravel-auth')?.value;
  const guestCookie = request.cookies.get('unravel-guest')?.value;

  let isAuthenticated = false;
  if (authCookie) {
    try {
      const parsed = JSON.parse(authCookie) as { state?: { isAuthenticated?: boolean } };
      isAuthenticated = parsed?.state?.isAuthenticated === true;
    } catch {
      isAuthenticated = false;
    }
  }

  const isGuest = guestCookie === 'true';

  // Redirect unauthenticated, non-guest users away from protected routes
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (isProtected && !isAuthenticated && !isGuest) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));
  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

/** Configure which paths the middleware runs on. */
export const config = {
  matcher: ['/profile/:path*', '/scores/:path*', '/auth/:path*'],
};
