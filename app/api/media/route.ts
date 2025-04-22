import { NextResponse } from 'next/server';
import getPool from '@/lib/db';

interface MediaItem {
  id: number;
  file_name: string;
  file_type: string;
  file_path: string;
  item_number: number;
  item_type: string;
  team: string;
  created_at: string;
}

interface UploadedItem {
  id: number;
  file_name: string;
  file_type: string;
  file_path: string;
  team: string;
  created_at: string;
}

interface MediaResponse {
  media: MediaItem[];
  total: number;
}

interface DatabaseError extends Error {
  code?: string;
  errno?: number;
  sqlState?: string;
  sqlMessage?: string;
}

interface TableInfo {
  Tables_in_slideshow: string;
}

export async function GET(request: Request) {
  let connection;
  try {
    console.log('Starting media API request...');
    const { searchParams } = new URL(request.url);
    const team = searchParams.get('team');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;
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
      tables.some((table: TableInfo) => table.Tables_in_slideshow === 'uploaded_items');

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
        m.id,
        m.file_name,
        m.file_type,
        m.file_path,
        m.item_number,
        m.item_type,
        m.team,
        m.created_at,
        CASE 
          WHEN u.file_path IS NOT NULL THEN true
          ELSE false
        END as exists
      FROM media_items m
      LEFT JOIN uploaded_items u ON m.file_path = u.file_path
    `;
    const queryParams: string[] = [];
    let paramCount = 1;

    if (team) {
      query += ` WHERE m.team = $${paramCount}`;
      queryParams.push(team);
      paramCount++;
    }

    query += ` ORDER BY m.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    queryParams.push(limit.toString(), offset.toString());

    console.log('Executing main query:', query, 'with params:', queryParams);

    try {
      const result = await connection.query(query, queryParams);
      console.log('Main query executed successfully, rows:', result.rows);

      if (!Array.isArray(result.rows)) {
        console.error('Query did not return an array:', result.rows);
        return NextResponse.json(
          { 
            error: 'Invalid query result',
            details: 'Expected an array of media items',
            received: typeof result.rows
          },
          { status: 500 }
        );
      }

      const countResult = await connection.query(
        'SELECT COUNT(*) FROM media_items' + (team ? ' WHERE team = $1' : ''),
        team ? [team] : []
      );

      const response: MediaResponse = {
        media: result.rows,
        total: parseInt(countResult.rows[0].count)
      };

      return NextResponse.json(response);
    } catch (error) {
      console.error('Main query execution failed:', error);
      const errorDetails = error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: (error as DatabaseError).code,
        errno: (error as DatabaseError).errno,
        sqlState: (error as DatabaseError).sqlState,
        sqlMessage: (error as DatabaseError).sqlMessage
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

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const team = formData.get('teamName') as string;
    const file = formData.get('file') as File;

    if (!team || !file) {
      return NextResponse.json(
        { error: 'Team name and file are required' },
        { status: 400 }
      );
    }

    const fileName = file.name;
    const fileType = file.type;
    const filePath = `/uploads/${team}/${fileName}`;

    // Save file to database
    const result = await getPool().query(
      'INSERT INTO uploaded_items (file_name, file_type, file_path, team) VALUES ($1, $2, $3, $4) RETURNING *',
      [fileName, fileType, filePath, team]
    );

    const uploadedItem: UploadedItem = result.rows[0];

    return NextResponse.json({ success: true, item: uploadedItem });
  } catch (error) {
    console.error('Error uploading media:', error);
    return NextResponse.json(
      { error: 'Failed to upload media' },
      { status: 500 }
    );
  }
} 