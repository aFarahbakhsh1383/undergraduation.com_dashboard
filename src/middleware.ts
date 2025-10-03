import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  console.log("middleware")
  const { nextUrl, cookies } = req;
  const isLoggedIn = Boolean(cookies.get('ug_auth')?.value);
  console.log("isLoggedIn_mi",isLoggedIn)
  const pathname = nextUrl.pathname;

  // Allow public assets and API
  const isPublicAsset = pathname.startsWith('/_next') || pathname.startsWith('/static') || pathname.startsWith('/favicon') || /\.[^/]+$/.test(pathname);
  const isApi = pathname.startsWith('/api');
  if (isPublicAsset || isApi) return NextResponse.next();

  // Allow login route when logged out; redirect to dashboard if logged in
  if (pathname === '/login') {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.next();
  }

  // For all other routes, require login
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|static|favicon).*)'],
};
