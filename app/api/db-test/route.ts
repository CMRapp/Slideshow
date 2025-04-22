import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    // Test the database connection
    const result = await pool.query('SELECT NOW() as current_time');
    const currentTime = result.rows[0].current_time;

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      currentTime
    });
  } catch (error) {
    console.error('Database connection test failed:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Database connection test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 