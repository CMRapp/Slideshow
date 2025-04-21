import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    // Test basic connection
    const [connection] = await pool.query('SELECT 1 as test');
    
    // Get database information
    const [dbInfo] = await pool.query(`
      SELECT 
        DATABASE() as current_database,
        VERSION() as mysql_version,
        CURRENT_USER() as current_user_name
    `);

    // Check if media_items table exists and get its structure
    const [tables] = await pool.query(`
      SHOW TABLES LIKE 'media_items'
    `);

    let tableStructure = [];
    if (tables.length > 0) {
      const [structure] = await pool.query('DESCRIBE media_items');
      tableStructure = structure;
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
        test: connection[0].test === 1 ? 'success' : 'failed',
        details: dbInfo[0]
      },
      tables: {
        media_items: tables.length > 0 ? 'exists' : 'not found',
        structure: tableStructure
      },
      environment: envInfo
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Failed to connect to database',
        error: error instanceof Error ? error.message : 'Unknown error',
        // Include environment info for debugging (without sensitive data)
        environment: {
          dbHost: process.env.DB_HOST,
          dbName: process.env.DB_NAME,
          dbUser: process.env.DB_USER,
          hasDbPassword: !!process.env.DB_PASSWORD,
        }
      },
      { status: 500 }
    );
  }
} 