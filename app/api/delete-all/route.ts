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

    // Delete all data from tables
    await client.query('TRUNCATE TABLE uploaded_items CASCADE');
    await client.query('TRUNCATE TABLE teams CASCADE');
    await client.query('TRUNCATE TABLE settings CASCADE');

    await client.query('COMMIT');

    return NextResponse.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting all data:', error);
    return NextResponse.json(
      { error: 'Failed to delete all data' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
} 