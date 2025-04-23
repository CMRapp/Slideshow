import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    const result = await pool.query(
      'SELECT value FROM settings WHERE key = $1',
      ['video_count']
    );

    const count = result.rows[0]?.value || '0';
    return NextResponse.json({ count: parseInt(count) });
  } catch (error) {
    console.error('Error fetching video count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video count', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { count } = await request.json();

    if (typeof count !== 'number') {
      return NextResponse.json(
        { error: 'Count must be a number' },
        { status: 400 }
      );
    }

    await pool.query(
      `INSERT INTO settings (key, value)
       VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = $2`,
      ['video_count', count.toString()]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving video count:', error);
    return NextResponse.json(
      { error: 'Failed to save video count', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 