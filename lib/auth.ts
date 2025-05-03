import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { z } from 'zod';

// JWT Configuration
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
const JWT_ALGORITHM = 'HS256';

// File Upload Configuration
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_MIME_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif'],
  videos: ['video/mp4', 'video/webm'],
  logos: ['image/svg+xml', 'image/png', 'image/jpeg']
};

// Simple in-memory rate limiting (for development)
// In production, consider using Vercel KV or similar
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// JWT Payload Type
interface JWTPayload {
  sub: string;
  role: 'admin' | 'user';
  exp?: number;
  iat?: number;
  [key: string]: unknown; // Allow additional properties
}

// JWT Token Generation
export async function generateToken(payload: JWTPayload): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
  return token;
}

// JWT Token Verification
export async function verifyToken(token: string): Promise<JWTPayload> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as JWTPayload;
  } catch {
    throw new Error('Invalid token');
  }
}

// Simple rate limiting check
export async function checkRateLimit(request: Request): Promise<boolean> {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const now = Date.now();
  const windowMs = 10000; // 10 seconds
  const maxRequests = 10;

  // Clean up old entries
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.resetTime < now) {
      rateLimitMap.delete(key);
    }
  }

  const entry = rateLimitMap.get(ip);
  if (!entry) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count += 1;
  return true;
}

// Session Management
interface Session {
  authenticated: boolean;
  user?: JWTPayload;
}

export async function getSession(): Promise<Session> {
  const cookieStore = await cookies();
  const session = cookieStore.get('session');
  
  if (!session) {
    return { authenticated: false };
  }

  try {
    const user = await verifyToken(session.value);
    return { authenticated: true, user };
  } catch {
    return { authenticated: false };
  }
}

// Input Validation Schema
export const validationSchemas = {
  team: {
    name: z.string().min(3).max(50),
    description: z.string().max(500).optional(),
  },
  media: {
    file: z.instanceof(File),
    teamId: z.number(),
    itemType: z.enum(['photo', 'video']),
    itemNumber: z.number().min(1),
  },
  settings: {
    key: z.string(),
    value: z.string(),
    description: z.string().optional(),
  }
}; 