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
    // Get team ID
    const teamResult = await pool.query('SELECT id FROM teams WHERE name = $1', [team]);
    if (teamResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }
    const teamId = teamResult.rows[0].id;

    // Get all media items for the team
    const result = await pool.query(
      `SELECT 
        item_type,
        item_number,
        file_name,
        file_path,
        file_size,
        mime_type,
        upload_status
      FROM uploaded_items 
      WHERE team_id = $1 
      ORDER BY item_type, item_number`,
      [teamId]
    );

    return NextResponse.json({ items: result.rows });
  } catch (error) {
    console.error('Error fetching team media:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team media' },
      { status: 500 }
    );
  }
} 