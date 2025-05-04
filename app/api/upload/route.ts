import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { MAX_FILE_SIZE, ALLOWED_MIME_TYPES } from '@/lib/auth';
import { z } from 'zod';
import { uploadToBlob } from '@/lib/blob';

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
  item_type: string;
  item_number: number;
}

export async function POST(request: Request) {
  try {
    console.log('Starting file upload process...');
    
    const formData = await request.formData();
    const teamName = formData.get('teamName') as string;
    const file = formData.get('file') as File;
    const itemType = formData.get('itemType') as 'photo' | 'video';
    const itemNumber = parseInt(formData.get('itemNumber') as string);

    console.log('Received upload request:', {
      teamName,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      itemType,
      itemNumber
    });

    // Validate input
    const validatedData = uploadSchema.parse({
      teamName,
      file,
      itemType,
      itemNumber,
    });

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      console.error('File size exceeds limit:', {
        fileSize: file.size,
        maxSize: MAX_FILE_SIZE
      });
      return NextResponse.json(
        { error: `File size exceeds limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    // Check MIME type
    const allowedTypes = itemType === 'photo' ? ALLOWED_MIME_TYPES.images : ALLOWED_MIME_TYPES.videos;
    if (!allowedTypes.includes(file.type)) {
      console.error('Invalid file type:', {
        fileType: file.type,
        allowedTypes
      });
      return NextResponse.json(
        { error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Get team ID
    console.log('Fetching team ID for:', teamName);
    const { rows: teamRows } = await executeQuery<Team>(
      'SELECT id FROM teams WHERE name = $1',
      [validatedData.teamName]
    );

    if (teamRows.length === 0) {
      console.error('Team not found:', teamName);
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    const teamId = teamRows[0].id;
    console.log('Found team ID:', teamId);

    // Check if item number already exists
    console.log('Checking for existing item:', { teamId, itemType, itemNumber });
    const { rows: existingRows } = await executeQuery<MediaItem>(
      'SELECT id FROM uploaded_items WHERE team_id = $1 AND item_type = $2 AND item_number = $3',
      [teamId, validatedData.itemType, validatedData.itemNumber]
    );

    if (existingRows.length > 0) {
      console.error('Item number already exists:', { teamId, itemType, itemNumber });
      return NextResponse.json(
        { error: 'Item number already exists for this team' },
        { status: 409 }
      );
    }

    // Upload to Vercel Blob
    console.log('Uploading to Vercel Blob...');
    const blobResult = await uploadToBlob(file, teamName);
    if (!blobResult.success) {
      console.error('Blob upload failed:', blobResult.error);
      return NextResponse.json(
        { error: 'Failed to upload file to storage' },
        { status: 500 }
      );
    }

    // Save to database
    console.log('Saving to database...');
    await executeQuery(
      'INSERT INTO uploaded_items (team_id, item_type, item_number, file_path, mime_type, file_size, upload_status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [
        teamId,
        validatedData.itemType,
        validatedData.itemNumber,
        blobResult.url,
        file.type,
        file.size,
        'completed'
      ]
    );

    console.log('Upload completed successfully');
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
      { error: 'Failed to upload file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 