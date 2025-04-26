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
      // Get list of tables with their foreign key dependencies
      console.log('Fetching table list...');
      const tablesResult = await client.query<TableRow>(`
        SELECT DISTINCT tc.table_name as tablename
        FROM information_schema.table_constraints tc
        LEFT JOIN information_schema.constraint_column_usage ccu 
          ON tc.constraint_name = ccu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
          AND tc.table_name != 'settings'
        UNION
        SELECT table_name as tablename
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
          AND table_name != 'settings'
        ORDER BY tablename DESC;
      `);

      console.log('Tables to truncate:', tablesResult.rows.map(r => r.tablename));

      // Truncate tables in the correct order
      for (const table of tablesResult.rows) {
        console.log(`Truncating table: ${table.tablename}`);
        await client.query(`DELETE FROM "${table.tablename}"`);
    }

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
    try {
    client.release();
      console.log('Client released successfully');
    } catch (error) {
      const pgError = error as PostgresError;
      console.error('Error releasing client:', pgError);
    }
  }
} 