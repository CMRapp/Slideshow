import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { pool } from '@/app/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { teamName: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { teamName } = params;
    
    // Fetch media items for the team
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT 
          m.id,
          m.item_type as type,
          m.file_path as url,
          m.file_path as thumbnailUrl
        FROM media_items m
        JOIN teams t ON m.team_id = t.id
        WHERE t.name = $1
        ORDER BY m.item_type, m.item_number`,
        [teamName]
      );

      return NextResponse.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching team media:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 