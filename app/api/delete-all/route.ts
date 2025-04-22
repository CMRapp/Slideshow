import { NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import { join } from 'path';
import getPool from '@/lib/db';

export async function POST() {
  const pool = await getPool();
  let client;
  try {
    client = await pool.connect();
    
    // Get all file paths before deleting
    const result = await client.query('SELECT file_path FROM uploaded_items');
    
    // Delete all records
    await client.query('DELETE FROM uploaded_items');
    
    return NextResponse.json({ 
      success: true,
      message: 'All media items deleted successfully',
      deletedCount: result.rows.length
    });
  } catch (error) {
    console.error('Error deleting media items:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete media items',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
} 