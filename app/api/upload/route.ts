import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

interface UploadedItem {
  id: number;
  file_name: string;
  file_type: string;
  file_path: string;
  team: string;
  created_at: string;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const team = formData.get('teamName') as string;
    const file = formData.get('file') as File;

    if (!team || !file) {
      return NextResponse.json(
        { error: 'Team name and file are required' },
        { status: 400 }
      );
    }

    const fileName = file.name;
    const fileType = file.type;
    const filePath = `/uploads/${team}/${fileName}`;

    // Save file to database
    const result = await pool.query(
      'INSERT INTO uploaded_items (file_name, file_type, file_path, team) VALUES ($1, $2, $3, $4) RETURNING *',
      [fileName, fileType, filePath, team]
    );

    const uploadedItem: UploadedItem = result.rows[0];

    return NextResponse.json({ success: true, item: uploadedItem });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
} 