import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

// Sanitize team name
function sanitizeTeamName(name: string): string {
  return name
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/[&<>"']/g, '') // Remove special characters
    .substring(0, 100); // Limit length
}

function normalizeTeamName(name: string): string {
  // Remove 'team' (case insensitive) from the beginning or end
  let normalized = name.replace(/^team\s+/i, '').replace(/\s+team$/i, '');
  
  // Convert to standard case (first letter of each word capitalized)
  normalized = normalized
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return normalized;
}

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

export async function POST(request: Request) {
  try {
    const { teamName } = await request.json();

    if (!teamName) {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      );
    }

    // Sanitize and normalize the team name
    const sanitizedTeamName = sanitizeTeamName(teamName);
    const normalizedTeamName = normalizeTeamName(sanitizedTeamName);

    console.log('Processing team name:', {
      original: teamName,
      sanitized: sanitizedTeamName,
      normalized: normalizedTeamName
    });

    const result = await pool.query(
      'INSERT INTO teams (name) VALUES ($1) RETURNING *',
      [normalizedTeamName]
    );

    const team: Team = result.rows[0];

    return NextResponse.json({ success: true, team });
  } catch (error) {
    console.error('Error saving team name:', error);
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
        error: 'Failed to save team name',
        details: errorDetails
      },
      { status: 500 }
    );
  }
} 