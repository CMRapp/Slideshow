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
    const result = await pool.query(
      `SELECT 
        item_type,
        item_number,
        team
      FROM uploaded_items 
      WHERE team = $1 
      ORDER BY item_number`,
      [team]
    );

    return NextResponse.json({ items: result.rows });
  } catch (error) {
    console.error('Error fetching uploaded items:', error);
    return NextResponse.json(
      { error: 'Database error occurred' },
      { status: 500 }
    );
  }
} 