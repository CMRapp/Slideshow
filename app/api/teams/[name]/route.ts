import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

interface ErrorDetails {
  message: string;
  stack?: string;
  name?: string;
  code?: string;
  errno?: number;
  sqlState?: string;
  sqlMessage?: string;
}

export async function DELETE(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const { name } = params;

    if (!name) {
      return NextResponse.json(
        { error: 'Team name is required', success: false },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Delete team and all associated items (cascade delete)
      const result = await client.query(
        'DELETE FROM teams WHERE name = $1 RETURNING *',
        [name]
      );

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Team not found', success: false },
          { status: 404 }
        );
      }

      await client.query('COMMIT');
      return NextResponse.json({ 
        success: true,
        message: 'Team deleted successfully',
        team: result.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting team:', error);
    const errorDetails: ErrorDetails = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: (error as NodeJS.ErrnoException).code,
      errno: (error as NodeJS.ErrnoException).errno,
      sqlState: (error as { sqlState?: string }).sqlState,
      sqlMessage: (error as { sqlMessage?: string }).sqlMessage
    } : {
      message: 'Unknown error'
    };
    
    return NextResponse.json(
      { 
        error: 'Failed to delete team',
        success: false,
        details: errorDetails
      },
      { status: 500 }
    );
  }
} 