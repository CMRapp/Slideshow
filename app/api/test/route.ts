import { NextResponse } from 'next/server';
import getPool from '@/lib/db';

export async function GET() {
  const pool = await getPool();
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Get all tables
    const [tables] = await connection.query('SHOW TABLES');
    console.log('All tables:', tables);
    
    // Get uploaded_items table structure
    const [structure] = await connection.query('DESCRIBE uploaded_items');
    console.log('uploaded_items structure:', structure);
    
    // Get sample data
    const [rows] = await connection.query('SELECT * FROM uploaded_items LIMIT 5');
    console.log('Sample data:', rows);
    
    return NextResponse.json({
      tables,
      structure,
      sampleData: rows
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
  } finally {
    if (connection) {
      connection.release();
    }
  }
} 