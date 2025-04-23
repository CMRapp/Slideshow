import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

type RouteParams = {
  team: string;
  filename: string;
};

export async function GET(
  request: NextRequest,
  { params }: { params: RouteParams }
): Promise<NextResponse> {
  try {
    const { team, filename } = params;

    // Get the file from the database
    const result = await pool.query(
      'SELECT file_data, mime_type FROM media_items WHERE team_id = (SELECT id FROM teams WHERE name = $1) AND file_name = $2',
      [team, filename]
    );

    if (result.rows.length === 0) {
      return new NextResponse('File not found', { status: 404 });
    }

    const { file_data, mime_type } = result.rows[0];

    // Return the file with appropriate headers
    return new NextResponse(file_data, {
      headers: {
        'Content-Type': mime_type,
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return new NextResponse('Error serving file', { status: 500 });
  }
} 