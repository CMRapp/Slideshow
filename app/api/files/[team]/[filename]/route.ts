import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: { team: string; filename: string } }
): Promise<NextResponse> {
  const { team, filename } = context.params;

  try {
    // First check if the team exists
    const teamResult = await pool.query(
      'SELECT id FROM teams WHERE name = $1',
      [team]
    );

    if (teamResult.rows.length === 0) {
      console.error(`Team not found: ${team}`);
      return new NextResponse('Team not found', { 
        status: 404,
        headers: {
          'Content-Type': 'text/plain',
        }
      });
    }

    const teamId = teamResult.rows[0].id;

    // Get the file from the database
    const result = await pool.query(
      'SELECT file_data, mime_type FROM media_items WHERE team_id = $1 AND file_name = $2',
      [teamId, filename]
    );

    if (result.rows.length === 0) {
      console.error(`File not found: ${filename} for team: ${team}`);
      return new NextResponse('File not found', { 
        status: 404,
        headers: {
          'Content-Type': 'text/plain',
        }
      });
    }

    const { file_data, mime_type } = result.rows[0];

    if (!file_data || !mime_type) {
      console.error(`Invalid file data for: ${filename} in team: ${team}`);
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
    return new NextResponse('Internal server error', { 
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      }
    });
  }
} 