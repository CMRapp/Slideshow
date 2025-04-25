import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { uploadToBlob } from '@/lib/blob';

export async function POST(request: Request) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('Upload: Starting new upload process');
    
    const formData = await request.formData();
    const teamName = formData.get('team') as string;
    const file = formData.get('file') as File;
    const itemType = formData.get('itemType') as string;
    const itemNumber = formData.get('itemNumber') as string;

    console.log('Upload: Received form data:', {
      teamName,
      fileName: file?.name,
      itemType,
      itemNumber,
      fileType: file?.type,
      fileSize: file?.size
    });

    if (!teamName || !file || !itemType) {
      console.error('Upload: Missing required fields:', { teamName, file, itemType });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Upload: Uploading to Vercel Blob:', { teamName, fileName: file.name });
    const uploadResult = await uploadToBlob(file, teamName);
    
    if (!uploadResult.success) {
      console.error('Upload: Blob upload failed:', uploadResult.error);
      return NextResponse.json(
        { error: 'Failed to upload file to storage' },
        { status: 500 }
      );
    }
    console.log('Upload: Blob upload successful:', uploadResult.url);

    // Get team_id
    const teamResult = await client.query(
      'SELECT id FROM teams WHERE name = $1',
      [teamName]
    );
    console.log('Upload: Team query result:', teamResult.rows);

    if (teamResult.rows.length === 0) {
      console.error('Upload: Team not found:', teamName);
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    const teamId = teamResult.rows[0].id;

    console.log('Upload: Inserting into database:', {
      teamId,
      itemType,
      itemNumber,
      fileName: file.name,
      url: uploadResult.url
    });

    // Insert with Blob Store URL
    const result = await client.query(
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
        uploadResult.url,
        file.size,
        file.type,
        'completed'
      ]
    );

    await client.query('COMMIT');
    console.log('Upload: Database insert successful:', result.rows[0]);

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Upload: Error during upload process:', error);
    return NextResponse.json(
      { error: 'Failed to upload media' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
} 