import { NextResponse } from 'next/server';
import { compare, hash } from 'bcryptjs';
import { pool } from '@/lib/db';

// Environment variables for admin credentials
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    // Check if admin password exists in database
    const result = await pool.query(
      'SELECT value FROM settings WHERE key = $1',
      ['admin_password']
    );

    if (result.rows.length === 0) {
      // If no admin password exists, create it using the environment variable
      const hashedPassword = await hash(ADMIN_PASSWORD, 10);
      await pool.query(
        'INSERT INTO settings (key, value) VALUES ($1, $2)',
        ['admin_password', hashedPassword]
      );
    }

    // Get the stored password (either newly created or existing)
    const storedPassword = result.rows[0]?.value || ADMIN_PASSWORD;
    const isPasswordValid = await compare(password, storedPassword);

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