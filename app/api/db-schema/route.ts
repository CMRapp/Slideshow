import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    const client = await pool.connect();
    
    try {
      // Get all tables
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);

      const tables = tablesResult.rows.map(row => row.table_name);
      
      // Get columns for each table
      const schema = {};
      for (const table of tables) {
        const columnsResult = await client.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_schema = 'public'
          AND table_name = $1
          ORDER BY ordinal_position
        `, [table]);
        
        schema[table] = columnsResult.rows;
      }

      // Get indexes
      const indexesResult = await client.query(`
        SELECT 
          tablename,
          indexname,
          indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
      `);

      return NextResponse.json({
        tables,
        schema,
        indexes: indexesResult.rows
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error analyzing database schema:', error);
    return NextResponse.json(
      { error: 'Failed to analyze database schema', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 