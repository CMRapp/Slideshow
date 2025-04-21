import { NextResponse } from 'next/server';
import getPool from '@/lib/db';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(request: Request) {
  let connection;
  try {
    console.log('Starting media API request...');
    const { searchParams } = new URL(request.url);
    const team = searchParams.get('team');
    console.log('Team parameter:', team);

    try {
      const pool = await getPool();
      connection = await pool.getConnection();
      console.log('Database connection established successfully');
    } catch (error) {
      console.error('Failed to get database connection:', error);
      return NextResponse.json(
        { 
          error: 'Database connection failed',
          details: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        },
        { status: 500 }
      );
    }

    // First, check if the uploaded_items table exists
    const [tables] = await connection.query("SHOW TABLES");
    const tableExists = Array.isArray(tables) && 
      tables.some((table: any) => table.Tables_in_slideshow === 'uploaded_items');

    if (!tableExists) {
      console.error('uploaded_items table does not exist');
      return NextResponse.json(
        { 
          error: 'Database table not found',
          details: 'The uploaded_items table does not exist. Please run the database initialization script.',
          suggestion: 'Try restarting the application to initialize the database.'
        },
        { status: 500 }
      );
    }

    // Check table structure
    try {
      const [columns] = await connection.query("SHOW COLUMNS FROM uploaded_items");
      console.log('uploaded_items table structure:', columns);
    } catch (error) {
      console.error('Error checking uploaded_items table:', error);
    }

    // Try to get a sample row to verify the table has data
    try {
      const [rows] = await connection.query("SELECT * FROM uploaded_items LIMIT 1");
      console.log('Sample row from uploaded_items:', rows);
    } catch (error) {
      console.error('Error fetching sample row:', error);
    }

    // Build the query
    let query = `
      SELECT 
        id,
        team as team_name,
        item_type,
        item_number,
        file_path,
        created_at,
        CASE 
          WHEN item_type = 'photo' THEN 'image/jpeg'
          WHEN item_type = 'video' THEN 'video/mp4'
          ELSE 'application/octet-stream'
        END as file_type,
        NULL as thumbnail_path
      FROM uploaded_items
    `;
    const params = [];

    if (team) {
      query += ' WHERE team = ?';
      params.push(team);
    }

    query += ' ORDER BY team, item_type, item_number';
    console.log('Executing main query:', query, 'with params:', params);

    try {
      const [rows] = await connection.query(query, params);
      console.log('Main query executed successfully, rows:', rows);

      if (!Array.isArray(rows)) {
        console.error('Query did not return an array:', rows);
        return NextResponse.json(
          { 
            error: 'Invalid query result',
            details: 'Expected an array of media items',
            received: typeof rows
          },
          { status: 500 }
        );
      }

      // Process the media items to ensure proper file paths
      const mediaItems = rows.map(item => {
        // Ensure the file path is properly formatted for web access
        const filePath = item.file_path.startsWith('/') ? item.file_path : `/${item.file_path}`;
        
        // Verify the file exists
        const fullPath = join(process.cwd(), 'public', item.file_path);
        const exists = existsSync(fullPath);
        console.log(`File ${item.file_path} exists:`, exists);
        
        return {
          ...item,
          file_path: filePath,
          exists: exists
        };
      });

      console.log('Processed media items:', mediaItems);
      return NextResponse.json({ mediaItems });
    } catch (error) {
      console.error('Main query execution failed:', error);
      const errorDetails = error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: (error as any).code,
        errno: (error as any).errno,
        sqlState: (error as any).sqlState,
        sqlMessage: (error as any).sqlMessage
      } : {
        message: 'Unknown error',
        error: error
      };
      
      return NextResponse.json(
        { 
          error: 'Query execution failed',
          details: errorDetails
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error in media API:', error);
    const errorDetails = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : {
      message: 'Unknown error',
      error: error
    };
    
    return NextResponse.json(
      { 
        error: 'Unexpected error occurred',
        details: errorDetails
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      try {
        connection.release();
        console.log('Database connection released successfully');
      } catch (error) {
        console.error('Error releasing connection:', error);
      }
    }
  }
} 