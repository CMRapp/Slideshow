import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
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

// Create a proper Zod schema from the validation schemas
const teamSchema = z.object({
  name: validationSchemas.team.name,
  description: validationSchemas.team.description,
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamName = searchParams.get('name');

    if (teamName) {
      const result = await executeQuery<Team>(
        'SELECT * FROM teams WHERE name = $1',
        [teamName]
      );
      return NextResponse.json(result.rows[0] || null);
    }

    const result = await executeQuery<Team>('SELECT * FROM teams ORDER BY name');
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

    // Check for existing team name
    const { rows: existingTeams } = await executeQuery<Team>(
      'SELECT id FROM teams WHERE name = $1',
      [validatedData.name]
    );

    if (existingTeams.length > 0) {
      return NextResponse.json(
        { error: 'Team name already exists' },
        { status: 409 }
      );
    }

    // Create new team
    const { rows: newTeam } = await executeQuery<Team>(
      'INSERT INTO teams (name, description) VALUES ($1, $2) RETURNING *',
      [validatedData.name, validatedData.description]
    );

    return NextResponse.json(newTeam[0]);
  } catch (error) {
    console.error('Error creating team:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid team data', details: error.errors },
        { status: 400 }
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

    // First, get the team_id
    const { rows: teamRows } = await executeQuery<Team>(
      'SELECT id FROM teams WHERE name = $1',
      [teamName]
    );

    if (teamRows.length === 0) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    const teamId = teamRows[0].id;

    // Delete the team (this will cascade delete all associated items)
    await executeQuery(
      'DELETE FROM teams WHERE id = $1',
      [teamId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting team:', error);
    return NextResponse.json(
      { error: 'Failed to delete team' },
      { status: 500 }
    );
  }
} 