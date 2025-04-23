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

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      'DELETE FROM teams WHERE name = $1 RETURNING *',
      [name]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
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
        details: errorDetails
      },
      { status: 500 }
    );
  }
} 