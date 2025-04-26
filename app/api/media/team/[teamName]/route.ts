import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Pool } from '@neondatabase/serverless';

// Initialize connection pool once
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function GET(
  request: Request,
  context: { params: { teamName: string } }
): Promise<Response> {
  const { teamName } = context.params;

  if (!teamName) {
    return NextResponse.json({ error: 'Missing team name.' }, { status: 400 });
  }

  const cookieStore = cookies();
  const session = cookieStore.get('session');

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const decodedTeamName = decodeURIComponent(teamName);

  try {
    const result = await pool.query(
      'SELECT * FROM media_items WHERE team_name = $1 ORDER BY created_at DESC',
      [decodedTeamName]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Team not found or no media items.' }, { status: 404 });
    }

    return NextResponse.json({ mediaItems: result.rows });
  } catch (error) {
    console.error('Error fetching team media:', error);
    return NextResponse.json({ error: 'Failed to fetch media items' }, { status: 500 });
  }
}
