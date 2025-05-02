import { jwtVerify } from 'jose';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { cookies } from 'next/headers';
import { z } from 'zod';

// JWT Configuration
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
const JWT_ALGORITHM = 'HS256';

// Rate Limiting Configuration
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

// File Upload Configuration
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_MIME_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif'],
  videos: ['video/mp4', 'video/webm'],
  logos: ['image/svg+xml', 'image/png', 'image/jpeg']
};

// JWT Token Generation
export async function generateToken(payload: any): Promise<string> {
  const token = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
  return token;
}

// JWT Token Verification
export async function verifyToken(token: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

// Rate Limiting Check
export async function checkRateLimit(request: Request): Promise<boolean> {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const { success } = await ratelimit.limit(ip);
  return success;
}

// Session Management
export async function getSession(): Promise<{ authenticated: boolean; user?: any }> {
  const cookieStore = cookies();
  const session = cookieStore.get('session');
  
  if (!session) {
    return { authenticated: false };
  }

  try {
    const user = await verifyToken(session.value);
    return { authenticated: true, user };
  } catch (error) {
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