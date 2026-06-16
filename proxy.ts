import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

const authRoutes = ['/sign-in', '/sign-up'];
const protectedRoutes = ['/', '/settings', '/searches'];

function redirectToSignIn(request: NextRequest) {
  const signInUrl = new URL('/sign-in', request.url);
  signInUrl.searchParams.set('redirectTo', request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(signInUrl);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/new')) {
    return NextResponse.next();
  }

  // /api/payments/webhooks is a webhook endpoint that should be accessible without authentication
  if (pathname.startsWith('/api/payments/webhooks')) {
    return NextResponse.next();
  }

  // /api/auth/polar/webhooks
  if (pathname.startsWith('/api/auth/polar/webhooks')) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/auth/dodopayments/webhooks')) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/raycast')) {
    return NextResponse.next();
  }

  // Better Auth endpoints must remain public so users can log in/out.
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(request);

  // Allow /settings as a real page; still protect it behind auth
  if (pathname === '/settings') {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
    return NextResponse.next();
  }

  // If user is authenticated but trying to access auth routes
  if (sessionCookie && authRoutes.some((route) => pathname.startsWith(route))) {
    console.log('Redirecting to home');
    console.log('Session cookie: ', sessionCookie);
    return NextResponse.redirect(new URL('/', request.url));
  }

  const requiresAuth =
    pathname === '/' ||
    pathname.startsWith('/api/search') ||
    protectedRoutes.some((route) => route !== '/' && pathname.startsWith(route));

  if (!sessionCookie && requiresAuth) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    return redirectToSignIn(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
