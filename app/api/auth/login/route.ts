import { NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { pool } from '@/lib/db';

// In a real application, these would be stored securely and not hardcoded
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      'SELECT value FROM settings WHERE key = $1',
      ['admin_password']
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Admin password not set' },
        { status: 500 }
      );
    }

    const isPasswordValid = await compare(password, result.rows[0].value);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 