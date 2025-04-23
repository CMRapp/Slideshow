import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const team = searchParams.get('team');

  if (!team) {
    return NextResponse.json(
      { error: 'Team parameter is required' },
      { status: 400 }
    );
  }

  try {
    // First check if the table exists
    const tableExists = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'uploaded_items'
      )`
    );

    if (!tableExists.rows[0].exists) {
      return NextResponse.json(
        { error: 'Uploaded items table does not exist' },
        { status: 500 }
      );
    }

    const result = await pool.query(
      `SELECT 
        item_type,
        item_number,
        team,
        file_path
      FROM uploaded_items 
      WHERE team = $1 
      ORDER BY item_number`,
      [team]
    );

    return NextResponse.json({ items: result.rows });
  } catch (error) {
    console.error('Error fetching uploaded items:', error);
    return NextResponse.json(
      { error: 'Database error occurred', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 