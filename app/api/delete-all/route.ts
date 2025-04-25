import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

interface PostgresError extends Error {
  code?: string;
  detail?: string;
  hint?: string;
  position?: string;
}

interface TableRow {
  tablename: string;
}

export async function DELETE() {
  const client = await pool.connect();
  try {
    console.log('Starting database reset process...');
    await client.query('BEGIN');

    try {
      // Get list of all tables except settings
      console.log('Fetching table list...');
      const tablesResult = await client.query<TableRow>(`
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
          WHEN key = 'allowed_image_types' THEN 'image/jpeg,image/png,gif'
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
      const pgError = innerError as PostgresError;
      console.error('Error during reset process:', {
        error: pgError,
        message: pgError.message,
        stack: pgError.stack,
        code: pgError.code,
        detail: pgError.detail,
        hint: pgError.hint,
        position: pgError.position
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
    const pgError = error as PostgresError;
    console.error('Final error handler:', {
      error: pgError,
      message: pgError.message,
      stack: pgError.stack,
      code: pgError.code,
      detail: pgError.detail,
      hint: pgError.hint,
      position: pgError.position
    });

    return NextResponse.json(
      { 
        error: 'Failed to reset database',
        details: pgError.message,
        code: pgError.code
      },
      { status: 500 }
    );
  } finally {
    // Ensure triggers are re-enabled even if an error occurred
    try {
      await client.query('SET session_replication_role = DEFAULT');
      console.log('Ensured triggers are re-enabled');
    } catch (error) {
      const pgError = error as PostgresError;
      console.error('Error re-enabling triggers:', pgError);
    }

    try {
      client.release();
      console.log('Client released successfully');
    } catch (error) {
      const pgError = error as PostgresError;
      console.error('Error releasing client:', pgError);
    }
  }
} 