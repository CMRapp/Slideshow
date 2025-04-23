import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(
  request: NextRequest,
  context: { params: { team: string; filename: string } }
) {
  try {
    const { team, filename } = context.params;

    // Get the file from the database
    const result = await pool.query(
      'SELECT file_data, mime_type FROM media_items WHERE team_id = (SELECT id FROM teams WHERE name = $1) AND file_name = $2',
      [team, filename]
    );

    if (result.rows.length === 0) {
      return new NextResponse('File not found', { 
        status: 404,
        headers: {
          'Content-Type': 'text/plain',
        }
      });
    }

    const { file_data, mime_type } = result.rows[0];

    if (!file_data || !mime_type) {
      return new NextResponse('Invalid file data', { 
        status: 500,
        headers: {
          'Content-Type': 'text/plain',
        }
      });
    }

    // Create a new Uint8Array from the buffer
    const uint8Array = new Uint8Array(file_data);

    // Return the file with appropriate headers
    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': mime_type,
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': uint8Array.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return new NextResponse('Error serving file', { 
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      }
    });
  }
} 