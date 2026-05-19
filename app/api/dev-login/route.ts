import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available' }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const returnTo = searchParams.get('returnTo') ?? '/dashboard';
  const res = NextResponse.redirect(new URL(returnTo, req.url));
  res.cookies.set('mock_auth_session', 'true', { path: '/', httpOnly: true });
  return res;
}

export async function DELETE(req: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available' }, { status: 403 });
  }
  const res = NextResponse.redirect(new URL('/', req.url));
  res.cookies.delete('mock_auth_session');
  return res;
}
