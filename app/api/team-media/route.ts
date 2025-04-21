import { NextResponse } from 'next/server';
import getPool from '@/lib/db';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(request: Request) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const team = searchParams.get('team');

    if (!team) {
      return NextResponse.json(
        { error: 'Team parameter is required' },
        { status: 400 }
      );
    }

    console.log('Fetching media for team:', team);
    const pool = await getPool();
    connection = await pool.getConnection();
    console.log('Database connection established');

    const [rows] = await connection.query(`
      SELECT 
        ui.id,
        ui.team,
        ui.item_type,
        ui.item_number,
        ui.file_path,
        ui.created_at
      FROM uploaded_items ui
      WHERE ui.team = ?
      ORDER BY ui.item_type, ui.item_number
    `, [team]);

    console.log('Query results:', rows);
    
    // Process the media items to ensure proper file paths
    const media = Array.isArray(rows) ? rows.map(item => {
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
    }) : [];

    console.log('Processed media items:', media);
    return NextResponse.json({ media });
  } catch (error) {
    console.error('Error fetching team media:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return NextResponse.json(
      { 
        error: 'Failed to fetch team media',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
      console.log('Database connection released');
    }
  }
} 