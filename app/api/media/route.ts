import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const result = await pool.query(
      `SELECT 
        t.name as team_name,
        COUNT(CASE WHEN ui.item_type = 'photo' THEN 1 END) as photo_count,
        COUNT(CASE WHEN ui.item_type = 'video' THEN 1 END) as video_count,
        MAX(ui.created_at) as last_upload
      FROM teams t
      LEFT JOIN uploaded_items ui ON t.id = ui.team_id
      GROUP BY t.id, t.name`
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching media statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media statistics' },
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
       FROM uploaded_items
       WHERE team_id = $1 AND item_type = $2`,
      [teamId, type]
    );

    const itemNumber = itemNumberResult.rows[0].next_number;

    // Insert the new media item
    const result = await pool.query(
      `INSERT INTO uploaded_items (
        team_id, item_type, item_number, file_name,
        file_path, file_size, mime_type, upload_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        teamId,
        type,
        itemNumber,
        file.name,
        `/api/files/${teamName}/${file.name}`,
        file.size,
        file.type,
        'pending'
      ]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error uploading media:', error);
    return NextResponse.json(
      { error: 'Failed to upload media' },
      { status: 500 }
    );
  }
} 