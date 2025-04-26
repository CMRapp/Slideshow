import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Pool } from '@neondatabase/serverless';

// Create connection pool with Neon configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export async function GET(
  request: NextRequest,
  { params }: { params: { teamName: string } }
) {
  try {
    // Check authentication
    const cookieStore = cookies();
    const session = cookieStore.get('session');

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { teamName } = params;
    const decodedTeamName = decodeURIComponent(teamName);

    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM media_items WHERE team_name = $1 ORDER BY created_at DESC',
        [decodedTeamName]
      );

      return NextResponse.json({ mediaItems: result.rows });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching team media:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 