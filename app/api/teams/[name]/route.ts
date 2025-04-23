import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

type Props = {
  params: {
    name: string;
  };
};

export async function DELETE(
  request: Request,
  { params }: Props
) {
  try {
    const { name } = params;
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