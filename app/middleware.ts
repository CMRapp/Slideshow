import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, checkRateLimit } from '@/lib/auth';

// List of allowed origins
const allowedOrigins = [
  'http://localhost:3000',
  'https://*.vercel.app',
  process.env.NEXT_PUBLIC_APP_URL || ''
].filter(Boolean);

// List of public routes that don't require authentication
const publicRoutes = [
  '/api/login',
  '/api/version',
  '/api/health'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle CORS
  const origin = request.headers.get('origin') || '';
  if (allowedOrigins.includes(origin)) {
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    return response;
  }

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  // Skip authentication for public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Handle API authentication
  if (pathname.startsWith('/api/')) {
    // Check rate limiting
    const isRateLimited = await checkRateLimit(request);
    if (!isRateLimited) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests' }),
        { status: 429 }
      );
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return new NextResponse(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401 }
      );
    }

    try {
      const token = authHeader.split(' ')[1];
      await verifyToken(token);
    } catch (error) {
      console.error('Auth verification failed:', error);
      return new NextResponse(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 