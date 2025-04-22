import { NextResponse } from 'next/server';
import getPool from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const team = searchParams.get('team');

  if (!team) {
    return NextResponse.json(
      { error: 'Team parameter is required' },
      { status: 400 }
    );
  }

  const pool = await getPool();
  let client;
  try {
    client = await pool.connect();

    // Get media items for the team
    const result = await client.query(
      'SELECT * FROM media_items WHERE team = $1 ORDER BY item_number ASC',
      [team]
    );

    return NextResponse.json({
      media: result.rows
    });
  } catch (error) {
    console.error('Error fetching team media:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team media' },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
} 