import { NextResponse } from 'next/server';
import getPool from '@/lib/db';

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

export async function POST(request: Request) {
  let connection;
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

    const pool = await getPool();
    connection = await pool.getConnection();
    console.log('Database connection established');
    
    try {
      // Start transaction
      await connection.beginTransaction();
      console.log('Transaction started');

      // Check if team already exists
      const [existingTeams] = await connection.query(
        'SELECT id FROM teams WHERE name = ?',
        [normalizedTeamName]
      );

      console.log('Existing teams check:', existingTeams);

      if (Array.isArray(existingTeams) && existingTeams.length > 0) {
        await connection.rollback();
        return NextResponse.json(
          { error: 'Team name already exists' },
          { status: 409 }
        );
      }

      // Insert the team name into the teams table
      const [result] = await connection.query(
        'INSERT INTO teams (name) VALUES (?)',
        [normalizedTeamName]
      );
      
      console.log('Team insert result:', result);

      // Commit transaction
      await connection.commit();
      console.log('Transaction committed');

      return NextResponse.json({ 
        success: true,
        teamName: normalizedTeamName
      });
    } catch (error) {
      // Rollback transaction on error
      await connection.rollback();
      console.error('Database error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any).code,
        sqlState: (error as any).sqlState,
        sqlMessage: (error as any).sqlMessage,
        stack: error instanceof Error ? error.stack : undefined
      });

      if ((error as any).code === 'ER_DUP_ENTRY') {
        return NextResponse.json(
          { error: 'Team name already exists' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: 'Database error occurred', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    } finally {
      if (connection) {
        connection.release();
        console.log('Database connection released');
      }
    }
  } catch (error) {
    console.error('Error saving team name:', error);
    return NextResponse.json(
      { error: 'Failed to save team name', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 