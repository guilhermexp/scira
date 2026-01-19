import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher(['/lookout(.*)', '/xql(.*)', '/settings(.*)']);

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/search(.*)',
  '/new(.*)',
  '/api/payments/webhooks(.*)',
  '/api/auth/polar/webhooks(.*)',
  '/api/auth/dodopayments/webhooks(.*)',
  '/api/raycast(.*)',
  '/(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;

  console.log('Pathname: ', pathname);

  // Allow public API routes
  if (
    pathname === '/api/search' ||
    pathname.startsWith('/new') ||
    pathname.startsWith('/api/search') ||
    pathname.startsWith('/api/payments/webhooks') ||
    pathname.startsWith('/api/auth/polar/webhooks') ||
    pathname.startsWith('/api/auth/dodopayments/webhooks') ||
    pathname.startsWith('/api/raycast')
  ) {
    return NextResponse.next();
  }

  // Protect specific routes
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
