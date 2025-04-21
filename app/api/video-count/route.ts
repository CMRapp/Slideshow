import { NextResponse } from 'next/server';
import getPool from '@/lib/db';

export async function GET() {
  let connection;
  try {
    const pool = await getPool();
    connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT value FROM settings WHERE `key` = ?',
      ['video_count']
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ count: 0 });
    }

    return NextResponse.json({ count: parseInt(rows[0].value) || 0 });
  } catch (error) {
    console.error('Error fetching video count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video count', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

export async function POST(request: Request) {
  let connection;
  try {
    const body = await request.json();
    const { count } = body;

    if (typeof count !== 'number' || count < 0) {
      return NextResponse.json(
        { error: 'Count must be a non-negative number' },
        { status: 400 }
      );
    }

    const pool = await getPool();
    connection = await pool.getConnection();
    await connection.query(
      'INSERT INTO settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?',
      ['video_count', count.toString(), count.toString()]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving video count:', error);
    return NextResponse.json(
      { error: 'Failed to save video count', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
} 