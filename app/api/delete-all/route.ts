import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { rm } from 'fs/promises';
import path from 'path';

export async function DELETE() {
  const client = await pool.connect();
  try {
    console.log('Starting database reset process...');
    await client.query('BEGIN');

    try {
      // Get all uploaded files with team names before deleting data
      console.log('Fetching uploaded files...');
      const result = await client.query(`
        SELECT ui.file_name, t.name as team_name 
        FROM uploaded_items ui 
        JOIN teams t ON ui.team_id = t.id
      `);
      console.log(`Found ${result.rows.length} files to delete`);
    
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
      console.log('Fetching teams...');
      const teams = await client.query('SELECT name FROM teams');
      console.log(`Found ${teams.rows.length} team directories to delete`);
      
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
      console.log('Fetching table list...');
      const tablesResult = await client.query(`
        SELECT tablename 
        FROM pg_catalog.pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT IN ('settings')
      `);
      console.log('Tables to truncate:', tablesResult.rows.map(r => r.tablename));

      // Disable triggers temporarily to avoid foreign key constraint issues
      console.log('Disabling triggers...');
      await client.query('SET session_replication_role = replica');

      // Truncate all tables except settings
      for (const table of tablesResult.rows) {
        console.log(`Truncating table: ${table.tablename}`);
        await client.query(`TRUNCATE TABLE "${table.tablename}" CASCADE`);
      }

      // Re-enable triggers
      console.log('Re-enabling triggers...');
      await client.query('SET session_replication_role = DEFAULT');
    
      // Reset settings to default values
      console.log('Resetting settings...');
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
      console.log('Database reset completed successfully');

      return NextResponse.json({ 
        success: true,
        message: 'Database reset successful. All data has been cleared while preserving structure.'
      });
    } catch (innerError) {
      // Log the specific error that occurred during the reset process
      console.error('Error during reset process:', {
        error: innerError,
        message: innerError instanceof Error ? innerError.message : 'Unknown error',
        stack: innerError instanceof Error ? innerError.stack : undefined,
        code: (innerError as any)?.code,
        detail: (innerError as any)?.detail,
        hint: (innerError as any)?.hint,
        position: (innerError as any)?.position
      });

      // Attempt to rollback
      try {
        await client.query('ROLLBACK');
        console.log('Successfully rolled back transaction');
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
      }

      throw innerError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error('Final error handler:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      code: (error as any)?.code,
      detail: (error as any)?.detail,
      hint: (error as any)?.hint,
      position: (error as any)?.position
    });

    return NextResponse.json(
      { 
        error: 'Failed to reset database',
        details: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any)?.code
      },
      { status: 500 }
    );
  } finally {
    // Ensure triggers are re-enabled even if an error occurred
    try {
      await client.query('SET session_replication_role = DEFAULT');
      console.log('Ensured triggers are re-enabled');
    } catch (error) {
      console.error('Error re-enabling triggers:', error);
    }

    try {
      client.release();
      console.log('Client released successfully');
    } catch (error) {
      console.error('Error releasing client:', error);
    }
  }
} 