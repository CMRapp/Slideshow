import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { MAX_FILE_SIZE, ALLOWED_MIME_TYPES } from '@/lib/auth';
import { z } from 'zod';

// Validation schema for upload
const uploadSchema = z.object({
  teamName: z.string().min(3).max(50),
  file: z.instanceof(File),
  itemType: z.enum(['photo', 'video']),
  itemNumber: z.number().min(1),
});

interface Team {
  id: number;
  name: string;
}

interface MediaItem {
  id: number;
  team_id: number;
  item_type: 'photo' | 'video';
  item_number: number;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const teamName = formData.get('teamName') as string;
    const file = formData.get('file') as File;
    const itemType = formData.get('itemType') as 'photo' | 'video';
    const itemNumber = parseInt(formData.get('itemNumber') as string);

    // Validate input
    const validatedData = uploadSchema.parse({
      teamName,
      file,
      itemType,
      itemNumber,
    });

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds limit' },
        { status: 400 }
      );
    }

    // Check MIME type
    const allowedTypes = itemType === 'photo' ? ALLOWED_MIME_TYPES.images : ALLOWED_MIME_TYPES.videos;
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      );
    }

    // Get team ID
    const { rows: teamRows } = await executeQuery<Team>(
      'SELECT id FROM teams WHERE name = $1',
      [validatedData.teamName]
    );

    if (teamRows.length === 0) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    const teamId = teamRows[0].id;

    // Check if item number already exists
    const { rows: existingRows } = await executeQuery<MediaItem>(
      'SELECT id FROM media WHERE team_id = $1 AND item_type = $2 AND item_number = $3',
      [teamId, validatedData.itemType, validatedData.itemNumber]
    );

    if (existingRows.length > 0) {
      return NextResponse.json(
        { error: 'Item number already exists for this team' },
        { status: 409 }
      );
    }

    // Generate file path
    const filePath = `${teamId}/${validatedData.itemType}/${validatedData.itemNumber}.${file.type.split('/')[1]}`;

    // Save to database
    await executeQuery(
      'INSERT INTO media (team_id, item_type, item_number, file_path, mime_type, file_size) VALUES ($1, $2, $3, $4, $5, $6)',
      [
        teamId,
        validatedData.itemType,
        validatedData.itemNumber,
        filePath,
        file.type,
        file.size,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error uploading file:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
} 