import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: { name: string } }
) {
  const { name } = params;

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
