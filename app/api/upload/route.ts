import { NextResponse } from 'next/server';
import { executeQuery, withTransaction } from '@/lib/db';
import { uploadToBlob } from '@/lib/blob';
import { validationSchemas, MAX_FILE_SIZE, ALLOWED_MIME_TYPES } from '@/lib/auth';
import { z } from 'zod';

// Validation schema for upload
const uploadSchema = z.object({
  team: z.string().min(1),
  file: z.instanceof(File),
  itemType: z.enum(['photo', 'video']),
  itemNumber: z.number().min(1),
});

export async function POST(request: Request) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const formData = await request.formData();
    const teamName = formData.get('team') as string;
    const file = formData.get('file') as File;
    const itemType = formData.get('itemType') as string;
    const itemNumber = parseInt(formData.get('itemNumber') as string);

    // Validate input
    try {
      uploadSchema.parse({
        team: teamName,
        file,
        itemType,
        itemNumber,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid input', details: error.errors },
          { status: 400 }
        );
      }
      throw error;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds limit' },
        { status: 400 }
      );
    }

    // Validate MIME type
    const allowedTypes = itemType === 'photo' ? ALLOWED_MIME_TYPES.images : ALLOWED_MIME_TYPES.videos;
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      );
    }

    // Get team_id
    const { rows: teamRows } = await executeQuery<{ id: number }>(
      'SELECT id FROM teams WHERE name = $1',
      [teamName],
      client
    );

    if (teamRows.length === 0) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    const teamId = teamRows[0].id;

    // Check if item number is already used
    const { rows: existingRows } = await executeQuery<{ id: number }>(
      'SELECT id FROM media_items WHERE team_id = $1 AND item_type = $2 AND item_number = $3',
      [teamId, itemType, itemNumber],
      client
    );

    if (existingRows.length > 0) {
      return NextResponse.json(
        { error: 'Item number already exists for this team' },
        { status: 409 }
      );
    }

    // Upload to blob storage
    const uploadResult = await uploadToBlob(file, teamName);
    if (!uploadResult.success) {
      throw new Error('Failed to upload file to storage');
    }

    // Save to database
    await executeQuery(
      `INSERT INTO media_items 
       (team_id, item_type, item_number, file_name, file_path, file_size, mime_type, is_processed)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        teamId,
        itemType,
        itemNumber,
        file.name,
        uploadResult.url,
        file.size,
        file.type,
        false,
      ],
      client
    );

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      url: uploadResult.url,
      message: 'File uploaded successfully',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Upload failed:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
} 