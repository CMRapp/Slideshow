import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

interface Team {
  id: number;
  name: string;
  created_at: string;
}

interface ErrorDetails {
  message: string;
  stack?: string;
  name?: string;
  code?: string;
  errno?: number;
  sqlState?: string;
  sqlMessage?: string;
}

export async function GET() {
  try {
    const result = await pool.query('SELECT * FROM teams ORDER BY name');
    const teams: Team[] = result.rows;

    return NextResponse.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
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
        error: 'Failed to fetch teams',
        details: errorDetails
      },
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

    const result = await pool.query(
      'INSERT INTO teams (name) VALUES ($1) RETURNING *',
      [name]
    );

    const team: Team = result.rows[0];

    return NextResponse.json(team);
  } catch (error) {
    console.error('Error creating team:', error);
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
        error: 'Failed to create team',
        details: errorDetails
      },
      { status: 500 }
    );
  }
} 