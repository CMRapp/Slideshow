import { NextResponse } from 'next/server';
import getPool from '@/lib/db';

export async function GET() {
  let connection;
  try {
    const pool = await getPool();
    connection = await pool.getConnection();
    console.log('Connected to database for teams query');

    // Check if teams table exists
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'teams'"
    );
    
    if (!Array.isArray(tables) || tables.length === 0) {
      console.log('Teams table does not exist');
      return NextResponse.json({ error: 'Teams table does not exist' }, { status: 500 });
    }

    // Get all teams
    const [teams] = await connection.query(
      'SELECT name FROM teams ORDER BY name ASC'
    );

    // If no teams exist, insert default teams
    if (!Array.isArray(teams) || teams.length === 0) {
      console.log('No teams found, inserting default teams');
      const defaultTeams = ['Team A', 'Team B', 'Team C'];
      await connection.query(
        'INSERT IGNORE INTO teams (name) VALUES ?',
        [defaultTeams.map(name => [name])]
      );
      
      // Fetch teams again after inserting defaults
      const [updatedTeams] = await connection.query(
        'SELECT name FROM teams ORDER BY name ASC'
      );
      
      return NextResponse.json(updatedTeams.map((team: any) => team.name));
    }

    return NextResponse.json(teams.map((team: any) => team.name));
  } catch (error) {
    console.error('Error in teams API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch teams',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
} 