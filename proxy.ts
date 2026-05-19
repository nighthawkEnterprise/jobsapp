import { auth0 } from "@/lib/auth0";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

  // Handle logout locally — clears cookies then does Auth0 SSO logout so both
  // the app session and the Auth0 session are terminated.
  if (pathname === '/auth/logout') {
    const clearCookies = (response: NextResponse) => {
      response.cookies.delete('appSession');
      for (let i = 0; i < 5; i++) response.cookies.delete(`appSession.${i}`);
      response.cookies.delete('mock_auth_session');
      return response;
    };

    // Mock dev sessions don't have an Auth0 SSO session to terminate.
    if (request.cookies.has('mock_auth_session')) {
      return clearCookies(NextResponse.redirect(new URL('/', request.url)));
    }

    const domain   = process.env.AUTH0_DOMAIN ?? '';
    const clientId = process.env.AUTH0_CLIENT_ID ?? '';
    const baseUrl  = process.env.APP_BASE_URL ?? new URL('/', request.url).href;
    if (!domain) {
      return clearCookies(NextResponse.redirect(new URL('/', request.url)));
    }

    const auth0LogoutUrl =
      `https://${domain}/v2/logout?client_id=${clientId}&returnTo=${encodeURIComponent(baseUrl)}`;
    return clearCookies(NextResponse.redirect(auth0LogoutUrl));
  }

  // Always let Auth0 handle its own routes first
  const authResponse = await auth0.middleware(request);
  if (pathname.startsWith('/auth/') || pathname.startsWith('/api/auth/')) {
    return authResponse;
  }

  // Check if this route needs a session
  const isProtected = PROTECTED.some(
    p => pathname === p || pathname.startsWith(p + '/')
  );
  if (!isProtected) return authResponse;

  // Dev mode: mock cookie stands in for a real session
  const isDev = process.env.NODE_ENV === 'development';
  const allCookieNames = [...request.cookies.getAll().map(c => c.name)];
  if (isDev) console.log('[proxy] cookies on', pathname, ':', allCookieNames);
  const hasSession = isDev
    ? request.cookies.has('mock_auth_session') || request.cookies.has('appSession') || request.cookies.has('appSession.0')
    : request.cookies.has('appSession') || request.cookies.has('appSession.0');

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
