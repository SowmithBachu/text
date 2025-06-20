import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Only protect API routes that need authentication
const isProtectedApiRoute = createRouteMatcher([
  '/api/images(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedApiRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!.*\\..*|_next).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
}; 