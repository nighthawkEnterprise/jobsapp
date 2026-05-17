import { NextResponse } from 'next/server';

// Temporary mock for prototype: Bypass actual Auth0
export async function proxy(request: Request) {
  const url = new URL(request.url);

  if (url.pathname.startsWith('/auth/login')) {
    // Fake login: Set a cookie and redirect to dashboard
    const response = NextResponse.redirect(new URL('/dashboard', request.url));
    response.cookies.set('mock_auth_session', 'true', { path: '/' });
    return response;
  }

  if (url.pathname.startsWith('/auth/logout')) {
    // Fake logout: Clear the cookie and redirect to home
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.delete('mock_auth_session');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
