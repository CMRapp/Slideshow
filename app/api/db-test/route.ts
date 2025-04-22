import { NextResponse } from 'next/server';
import getPool from '@/lib/db';

export async function GET() {
  try {
    const pool = await getPool();
    
    // Test basic connection
    const connection = await pool.query('SELECT 1 as test');
    
    // Get database information
    const dbInfo = await pool.query(`
      SELECT 
        current_database() as current_database,
        version() as postgres_version,
        current_user as current_user_name
    `);

    // Check if media_items table exists and get its structure
    const tables = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'media_items'
      ) as exists
    `);

    let tableStructure = [];
    if (tables.rows[0].exists) {
      const structure = await pool.query(`
        SELECT 
          column_name, 
          data_type, 
          is_nullable
        FROM information_schema.columns
        WHERE table_name = 'media_items'
      `);
      tableStructure = structure.rows;
    }

    // Get environment variables (without sensitive data)
    const envInfo = {
      dbHost: process.env.DB_HOST,
      dbName: process.env.DB_NAME,
      dbUser: process.env.DB_USER,
      // Don't expose password in response
      hasDbPassword: !!process.env.DB_PASSWORD,
    };

    return NextResponse.json({
      status: 'success',
      connection: {
        test: connection.rows[0].test === 1 ? 'success' : 'failed',
        details: dbInfo.rows[0]
      },
      tables: {
        media_items: tables.rows[0].exists ? 'exists' : 'not found',
        structure: tableStructure
      },
      environment: envInfo
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Database test failed' },
      { status: 500 }
    );
  }
} 