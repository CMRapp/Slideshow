import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    // Get all tables
    const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('All tables:', tables.rows);
    
    // Get uploaded_items table structure
    const structure = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'uploaded_items'
    `);
    console.log('uploaded_items structure:', structure.rows);
    
    // Get sample data
    const sampleData = await pool.query('SELECT * FROM uploaded_items LIMIT 5');
    console.log('Sample data:', sampleData.rows);
    
    return NextResponse.json({
      tables: tables.rows,
      structure: structure.rows,
      sampleData: sampleData.rows
    });
  } catch (error) {
    console.error('Test route error:', error);
    return NextResponse.json(
      { 
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 