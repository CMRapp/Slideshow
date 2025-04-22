import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    // Get photo count from settings
    const result = await pool.query(
      "SELECT value FROM settings WHERE key = 'photo_count'"
    );

    const count = result.rows[0]?.value || '0';

    return NextResponse.json({ count: parseInt(count, 10) });
  } catch (error) {
    console.error('Error fetching photo count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch photo count' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { count } = await request.json();

  if (typeof count !== 'number' || count < 0) {
    return NextResponse.json(
      { error: 'Invalid count value' },
      { status: 400 }
    );
  }

  try {
    // Update photo count in settings
    await pool.query(
      "INSERT INTO settings (key, value) VALUES ('photo_count', $1) ON CONFLICT (key) DO UPDATE SET value = $1",
      [count.toString()]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating photo count:', error);
    return NextResponse.json(
      { error: 'Failed to update photo count' },
      { status: 500 }
    );
  }
} 