import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import type { NextRequest } from 'next/server';

export async function DELETE(
  request: NextRequest,
  context: { params: { name: string } }
) {
  const { name } = context.params;

  if (!name) {
    return NextResponse.json(
      { error: 'Team name is required' },
      { status: 400 }
    );
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query(
      'DELETE FROM teams WHERE name = $1 RETURNING *',
      [name]
    );

    await client.query('COMMIT');

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: `Team "${name}" not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, deletedTeam: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting team:', error);
    return NextResponse.json(
      { error: 'Failed to delete team' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
