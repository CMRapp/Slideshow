import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT 
        ui.id,
        t.name as team_name,
        ui.mime_type as file_type,
        ui.file_path,
        ui.file_name,
        ui.item_type,
        ui.item_number
      FROM teams t
      LEFT JOIN uploaded_items ui ON t.id = ui.team_id
      WHERE ui.upload_status = 'completed'
      AND ui.file_path IS NOT NULL
      ORDER BY t.name, ui.item_type, ui.item_number`
    );

    // Process the file paths to ensure they're valid URLs
    const processedItems = result.rows.map(item => ({
      ...item,
      file_path: item.file_path // Vercel Blob URLs are already absolute
    }));

    return NextResponse.json({ mediaItems: processedItems });
  } catch (error) {
    console.error('Error fetching media items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media items' },
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