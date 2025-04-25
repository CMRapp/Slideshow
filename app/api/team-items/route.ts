import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamName = searchParams.get('team');

    if (!teamName) {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `SELECT item_type, item_number 
       FROM uploaded_items ui
       JOIN teams t ON ui.team_id = t.id
       WHERE t.name = $1`,
      [teamName]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching team items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team items' },
      { status: 500 }
    );
  }
} 