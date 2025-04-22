import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function DELETE() {
  try {
    // Delete all media items from the database
    await pool.query('DELETE FROM media_items');
    await pool.query('DELETE FROM uploaded_items');
    await pool.query('DELETE FROM photos');
    await pool.query('DELETE FROM videos');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting all media:', error);
    return NextResponse.json(
      { error: 'Failed to delete media' },
      { status: 500 }
    );
  }
} 