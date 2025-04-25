import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { rm } from 'fs/promises';
import path from 'path';

export async function DELETE() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get all uploaded files with team names
    const result = await client.query(`
      SELECT ui.file_name, t.name as team_name 
      FROM uploaded_items ui 
      JOIN teams t ON ui.team_id = t.id
    `);
    
    // Delete files from disk
    for (const row of result.rows) {
      const filePath = path.join(process.cwd(), 'uploads', row.team_name, row.file_name);
      try {
        await rm(filePath, { force: true });
        console.log(`Deleted file: ${filePath}`);
      } catch (error) {
        console.error(`Error deleting file ${filePath}:`, error);
        // Continue with other files even if one fails
      }
    }

    // Delete uploads directory for each team
    const teams = await client.query('SELECT name FROM teams');
    for (const team of teams.rows) {
      const teamDir = path.join(process.cwd(), 'uploads', team.name);
      try {
        await rm(teamDir, { recursive: true, force: true });
        console.log(`Deleted team directory: ${teamDir}`);
      } catch (error) {
        console.error(`Error deleting team directory ${teamDir}:`, error);
        // Continue with other directories even if one fails
      }
    }

    // Delete all data from tables in correct order
    await client.query('TRUNCATE TABLE uploaded_items');
    await client.query('TRUNCATE TABLE teams CASCADE');
    
    // Reset settings to default values
    await client.query(`
      UPDATE settings 
      SET value = CASE 
        WHEN key = 'photo_count' THEN '0'
        WHEN key = 'video_count' THEN '0'
        ELSE value 
      END
    `);

    await client.query('COMMIT');

    return NextResponse.json({ 
      success: true,
      message: 'Database reset successful. All data has been cleared.'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error resetting database:', error);
    return NextResponse.json(
      { 
        error: 'Failed to reset database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
} 