import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { mkdir } from 'fs';
import path from 'path';
import { pool } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const team = formData.get('team') as string;
    const file = formData.get('file') as File;
    const itemType = formData.get('itemType') as string;
    const itemNumber = formData.get('itemNumber') as string;

    if (!team || !file || !itemType || !itemNumber) {
      return NextResponse.json(
        { error: 'Team name, file, item type, and item number are required' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', team);
    await new Promise<void>((resolve, reject) => {
      mkdir(uploadDir, { recursive: true }, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Save file to disk
    const fileName = file.name;
    const filePath = path.join(uploadDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Save file info to database
    await pool.query(
      'INSERT INTO uploaded_items (team_id, item_type, item_number, file_name, file_path, file_size, mime_type, upload_status) VALUES ((SELECT id FROM teams WHERE name = $1), $2, $3, $4, $5, $6, $7, $8)',
      [team, itemType, parseInt(itemNumber), fileName, `/uploads/${team}/${fileName}`, buffer.length, file.type, 'pending']
    );

    // Update media_items table
    await pool.query(
      'INSERT INTO media_items (team_id, item_type, item_number, file_name, file_path, file_size, mime_type) VALUES ((SELECT id FROM teams WHERE name = $1), $2, $3, $4, $5, $6, $7)',
      [team, itemType, parseInt(itemNumber), fileName, `/uploads/${team}/${fileName}`, buffer.length, file.type]
    );

    return NextResponse.json({ 
      success: true, 
      item: {
        filename: fileName,
        team: team,
        type: itemType,
        path: `/uploads/${team}/${fileName}`
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file. Please try again.' },
      { status: 500 }
    );
  }
} 