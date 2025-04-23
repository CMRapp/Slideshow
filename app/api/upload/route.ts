import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { mkdir } from 'fs';
import path from 'path';
import { pool } from '@/lib/db';

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
      'INSERT INTO uploaded_items (filename, team) VALUES ($1, $2)',
      [fileName, team]
    );

    // Update media_items table
    const mediaType = file.type.startsWith('image/') ? 'photo' : 'video';
    const itemNumber = await pool.query(
      'SELECT COALESCE(MAX(item_number), 0) + 1 as next_number FROM media_items WHERE team = $1',
      [team]
    );
    
    await pool.query(
      'INSERT INTO media_items (team, item_number, type, filename) VALUES ($1, $2, $3, $4)',
      [team, itemNumber.rows[0].next_number, mediaType, fileName]
    );

    return NextResponse.json({ 
      success: true, 
      item: {
        filename: fileName,
        team: team,
        type: mediaType,
        path: `/uploads/${team}/${fileName}`
      }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
} 