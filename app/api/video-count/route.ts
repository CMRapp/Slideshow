import { NextResponse } from 'next/server';
import getPool from '@/lib/db';

export async function GET() {
  const pool = await getPool();
  let client;
  try {
    client = await pool.connect();

    // Get video count from settings
    const result = await client.query(
      "SELECT value FROM settings WHERE key = 'video_count'"
    );

    const count = result.rows[0]?.value || '0';

    return NextResponse.json({ count: parseInt(count, 10) });
  } catch (error) {
    console.error('Error fetching video count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video count' },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
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

  const pool = await getPool();
  let client;
  try {
    client = await pool.connect();

    // Update video count in settings
    await client.query(
      "INSERT INTO settings (key, value) VALUES ('video_count', $1) ON CONFLICT (key) DO UPDATE SET value = $1",
      [count.toString()]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating video count:', error);
    return NextResponse.json(
      { error: 'Failed to update video count' },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
} 