import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { put } from '@vercel/blob';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const team = formData.get('team') as string;
    const file = formData.get('file') as File;
    const itemType = formData.get('itemType') as string;
    const itemNumber = formData.get('itemNumber') as string;

    console.log('Received upload request:', {
      team,
      itemType,
      itemNumber,
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size
    });

    if (!team || !file || !itemType || !itemNumber) {
      console.error('Missing required fields:', {
        team: !!team,
        file: !!file,
        itemType: !!itemType,
        itemNumber: !!itemNumber
      });
      return NextResponse.json(
        { error: 'Team name, file, item type, and item number are required' },
        { status: 400 }
      );
    }

    // Get team ID
    console.log('Getting team ID for:', team);
    const teamResult = await pool.query('SELECT id FROM teams WHERE name = $1', [team]);
    if (teamResult.rows.length === 0) {
      console.error('Team not found:', team);
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }
    const teamId = teamResult.rows[0].id;
    console.log('Found team ID:', teamId);

    // Upload file to Vercel Blob
    const blob = await put(`${team}/${file.name}`, file, {
      access: 'public',
    });

    // Insert into database
    const result = await pool.query(
      `INSERT INTO uploaded_items (
        team_id, item_type, item_number, file_name,
        file_path, file_size, mime_type, upload_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        teamId,
        itemType,
        parseInt(itemNumber),
        file.name,
        blob.url,
        file.size,
        file.type,
        'completed'
      ]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
} 