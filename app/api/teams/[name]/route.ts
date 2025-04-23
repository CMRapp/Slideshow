import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function DELETE(
  request: Request,
  context: { params: { name: string } }
) {
  try {
    const { name } = context.params;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Delete team and all associated items (cascade delete)
      await client.query(
        'DELETE FROM teams WHERE name = $1',
        [name]
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