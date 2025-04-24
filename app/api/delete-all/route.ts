import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { rm } from 'fs/promises';
import path from 'path';

export async function DELETE() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get all uploaded files
    const result = await client.query('SELECT filename, team FROM uploaded_items');
    
    // Delete files from disk
    for (const row of result.rows) {
      const filePath = path.join(process.cwd(), 'public', 'uploads', row.team, row.filename);
      try {
        await rm(filePath, { force: true });
      } catch (error) {
        console.error(`Error deleting file ${filePath}:`, error);
      }
    }

    // Delete uploads directory
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    try {
      await rm(uploadsDir, { recursive: true, force: true });
    } catch (error) {
      console.error('Error deleting uploads directory:', error);
    }

    // Delete all data from tables while preserving structure
    await client.query('TRUNCATE TABLE uploaded_items CASCADE');
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
      message: 'Database reset successful. All data has been cleared while preserving table structure.'
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