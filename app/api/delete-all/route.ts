import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { rm } from 'fs/promises';
import path from 'path';

export async function DELETE() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get all uploaded files with team names before deleting data
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

    // Get list of all tables
    const tablesResult = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename NOT IN ('settings')
    `);

    // Disable triggers temporarily to avoid foreign key constraint issues
    await client.query('SET session_replication_role = replica');

    // Truncate all tables except settings
    for (const table of tablesResult.rows) {
      await client.query(`TRUNCATE TABLE ${table.tablename} CASCADE`);
      console.log(`Truncated table: ${table.tablename}`);
    }

    // Re-enable triggers
    await client.query('SET session_replication_role = DEFAULT');
    
    // Reset settings to default values
    await client.query(`
      UPDATE settings 
      SET value = CASE 
        WHEN key = 'photo_count' THEN '0'
        WHEN key = 'video_count' THEN '0'
        WHEN key = 'max_file_size' THEN '10485760'
        WHEN key = 'allowed_image_types' THEN 'image/jpeg,image/png,image/gif'
        WHEN key = 'allowed_video_types' THEN 'video/mp4,video/webm,video/quicktime,video/hevc'
        ELSE value 
      END
    `);

    await client.query('COMMIT');

    return NextResponse.json({ 
      success: true,
      message: 'Database reset successful. All data has been cleared while preserving structure.'
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
    // Ensure triggers are re-enabled even if an error occurred
    try {
      await client.query('SET session_replication_role = DEFAULT');
    } catch (error) {
      console.error('Error re-enabling triggers:', error);
    }
    client.release();
  }
} 