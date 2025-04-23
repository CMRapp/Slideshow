import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    const result = await pool.query(
      'SELECT name FROM teams ORDER BY name ASC'
    );

    return NextResponse.json(result.rows.map(row => row.name));
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      );
    }

    await pool.query(
      'INSERT INTO teams (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
      [name]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving team:', error);
    return NextResponse.json(
      { error: 'Failed to save team' },
      { status: 500 }
    );
  }
} 