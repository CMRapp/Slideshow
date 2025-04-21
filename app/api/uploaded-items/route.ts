import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const team = searchParams.get('team');
  let connection;

  if (!team) {
    return NextResponse.json(
      { error: 'Team parameter is required' },
      { status: 400 }
    );
  }

  try {
    connection = await pool.getConnection();
    const [items] = await connection.query(
      'SELECT * FROM uploaded_items WHERE team_name = ? ORDER BY item_number',
      [team]
    );

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching uploaded items:', error);
    return NextResponse.json(
      { error: 'Database error occurred' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
} 