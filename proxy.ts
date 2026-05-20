import { auth0 } from "@/lib/auth0";
import { NextRequest, NextResponse } from "next/server";

const PROTECTED = [
  '/dashboard',
  '/relevant-jobs',
  '/resumes',
  '/settings',
  '/stories',
  '/export',
  '/job',
  '/onboarding',
  '/profile',
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always let Auth0 handle its own routes first (login, callback, logout, profile)
  const authResponse = await auth0.middleware(request);
  if (pathname.startsWith('/auth/') || pathname.startsWith('/api/auth/')) {
    return authResponse;
  }

  // Check if this route needs a session
  const isProtected = PROTECTED.some(
    p => pathname === p || pathname.startsWith(p + '/')
  );
  if (!isProtected) return authResponse;

  // SDK default cookie is __session (chunked as __session.0, __session.1, …)
  const isDev = process.env.NODE_ENV === 'development';
  const allCookieNames = [...request.cookies.getAll().map(c => c.name)];
  if (isDev) console.log('[proxy] cookies on', pathname, ':', allCookieNames);
  const hasSession = isDev
    ? request.cookies.has('mock_auth_session') || request.cookies.has('__session') || request.cookies.has('__session.0')
    : request.cookies.has('__session') || request.cookies.has('__session.0');

  if (!hasSession) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return authResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
