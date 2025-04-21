import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of protected routes
const protectedRoutes = ['/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is protected
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    const authToken = request.cookies.get('auth-token');

    // If no auth token, redirect to admin page for authentication
    if (!authToken) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    // TODO: Validate the auth token here
    // For now, we'll just check if it exists
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*'
  ]
}; 