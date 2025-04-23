import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    const result = await pool.query(
      'SELECT name FROM teams ORDER BY name'
    );
    
    const teams = result.rows.map(row => row.name);
    return NextResponse.json(teams);
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
    const { teamName } = await request.json();

    if (!teamName) {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Delete team and all associated items (cascade delete)
      await client.query(
        'DELETE FROM teams WHERE name = $1',
        [teamName]
      );

      await client.query('COMMIT');
      return NextResponse.json({ success: true });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting team:', error);
    return NextResponse.json(
      { error: 'Failed to delete team' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamName = searchParams.get('name');

    if (!teamName) {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      // Start a transaction
      await client.query('BEGIN');

      // First, get the team_id
      const teamResult = await client.query(
        'SELECT id FROM teams WHERE name = $1',
        [teamName]
      );

      if (teamResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Team not found' },
          { status: 404 }
        );
      }

      const teamId = teamResult.rows[0].id;

      // Delete all associated items (this will cascade delete from uploaded_items and media_items)
      await client.query(
        'DELETE FROM teams WHERE id = $1',
        [teamId]
      );

      // Commit the transaction
      await client.query('COMMIT');

      return NextResponse.json(
        { message: 'Team and all associated items deleted successfully' },
        { status: 200 }
      );
    } catch (error) {
      // Rollback the transaction on error
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting team:', error);
    return NextResponse.json(
      { error: 'Failed to delete team' },
      { status: 500 }
    );
  }
} 