import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

interface MediaItem {
  id: number;
  team_name: string;
  item_number: number;
  item_type: string;
  file_name: string;
  created_at: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const team = searchParams.get('team');
  const type = searchParams.get('type');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const offset = (page - 1) * limit;

  try {
    // Build the base query
    let query = `
      SELECT 
        m.id,
        t.name as team_name,
        m.item_number,
        m.item_type,
        m.file_name,
        m.created_at
      FROM media_items m
      JOIN teams t ON m.team_id = t.id
      WHERE 1=1
    `;
    const queryParams = [];

    // Add filters
    if (team) {
      query += ' AND t.name = $' + (queryParams.length + 1);
      queryParams.push(team);
    }
    if (type) {
      query += ' AND m.item_type = $' + (queryParams.length + 1);
      queryParams.push(type);
    }

    // Add ordering and pagination
    query += ' ORDER BY m.item_number ASC LIMIT $' + (queryParams.length + 1) + ' OFFSET $' + (queryParams.length + 2);
    queryParams.push(limit, offset);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM media_items m
      JOIN teams t ON m.team_id = t.id
      WHERE 1=1
      ${team ? ' AND t.name = $1' : ''}
      ${type ? ' AND m.item_type = $' + (team ? '2' : '1') : ''}
    `;
    const countParams = [];
    if (team) countParams.push(team);
    if (type) countParams.push(type);

    const [mediaResult, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, countParams)
    ]);

    return NextResponse.json({
      items: mediaResult.rows as MediaItem[],
      total: parseInt(countResult.rows[0].total),
      page,
      limit
    });
  } catch (error) {
    console.error('Error fetching media:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const teamName = formData.get('team') as string;
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!teamName || !file || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // First get the team_id
    const teamResult = await pool.query(
      'SELECT id FROM teams WHERE name = $1',
      [teamName]
    );

    if (teamResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    const teamId = teamResult.rows[0].id;

    // Get the next item number for this team and type
    const itemNumberResult = await pool.query(
      `SELECT COALESCE(MAX(item_number), 0) + 1 as next_number
       FROM media_items
       WHERE team_id = $1 AND item_type = $2`,
      [teamId, type]
    );

    const itemNumber = itemNumberResult.rows[0].next_number;

    // Insert the new media item
    const result = await pool.query(
      `INSERT INTO media_items (team_id, item_number, item_type, file_name)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [teamId, itemNumber, type, file.name]
    );

    return NextResponse.json(result.rows[0] as MediaItem);
  } catch (error) {
    console.error('Error uploading media:', error);
    return NextResponse.json(
      { error: 'Failed to upload media', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 