import { NextResponse } from 'next/server';
import { executeQuery, withTransaction } from '@/lib/db';
import { validationSchemas } from '@/lib/auth';
import { z } from 'zod';

// Type definitions
interface Team {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Validation schemas
const teamSchema = validationSchemas.team;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamName = searchParams.get('name');

    if (teamName) {
      const result = await executeQuery(
        'SELECT * FROM teams WHERE name = $1',
        [teamName]
      );
      return NextResponse.json(result.rows[0] || null);
    }

    const result = await executeQuery('SELECT * FROM teams ORDER BY name');
    return NextResponse.json(result.rows);
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
    const data = await request.json();
    
    // Validate team data
    const validatedData = teamSchema.parse(data);

    await withTransaction(async (client) => {
      // Check for existing team name
      const { rows } = await executeQuery<{ id: number }>(
        'SELECT id FROM teams WHERE name = $1',
        [validatedData.name],
        client
      );

      if (rows.length > 0) {
        throw new Error('Team name already exists');
      }

      // Create new team
      await executeQuery(
        'INSERT INTO teams (name, description) VALUES ($1, $2)',
        [validatedData.name, validatedData.description],
        client
      );
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating team:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid team data', details: error.errors },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === 'Team name already exists') {
      return NextResponse.json(
        { error: 'Team name already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create team' },
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

    await withTransaction(async (client) => {
      // First, get the team_id
      const { rows } = await executeQuery<{ id: number }>(
        'SELECT id FROM teams WHERE name = $1',
        [teamName],
        client
      );

      if (rows.length === 0) {
        throw new Error('Team not found');
      }

      const teamId = rows[0].id;

      // Delete the team (this will cascade delete all associated items)
      await executeQuery(
        'DELETE FROM teams WHERE id = $1',
        [teamId],
        client
      );
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting team:', error);
    
    if (error instanceof Error && error.message === 'Team not found') {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete team' },
      { status: 500 }
    );
  }
} 