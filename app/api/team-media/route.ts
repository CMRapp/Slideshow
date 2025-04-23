import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const team = searchParams.get('team');

    if (!team) {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `SELECT 
        mi.id,
        mi.team,
        mi.item_number,
        mi.type,
        mi.filename,
        mi.created_at,
        '/uploads/' || mi.team || '/' || mi.filename as file_path
       FROM media_items mi
       WHERE mi.team = $1
       ORDER BY mi.item_number ASC`,
      [team]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching team media:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team media' },
      { status: 500 }
    );
  }
} 