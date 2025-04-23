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

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', team);
    console.log('Creating upload directory:', uploadDir);
    
    try {
      await new Promise<void>((resolve, reject) => {
        mkdir(uploadDir, { recursive: true }, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    } catch (error) {
      console.error('Failed to create upload directory:', error);
      throw new Error('Failed to create upload directory');
    }

    // Save file to disk
    const fileName = file.name;
    const filePath = path.join(uploadDir, fileName);
    console.log('Saving file to:', filePath);
    
    try {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);
      console.log('File saved successfully');
    } catch (error) {
      console.error('Failed to save file:', error);
      throw new Error('Failed to save file to disk');
    }

    // Get team ID
    console.log('Getting team ID for:', team);
    const teamResult = await pool.query('SELECT id FROM teams WHERE name = $1', [team]);
    if (teamResult.rows.length === 0) {
      console.error('Team not found:', team);
      throw new Error('Team not found');
    }
    const teamId = teamResult.rows[0].id;
    console.log('Found team ID:', teamId);

    // Save file info to database
    console.log('Saving to uploaded_items table');
    try {
      await pool.query(
        `INSERT INTO uploaded_items (
          team_id, item_type, item_number, file_name, 
          file_path, file_size, mime_type, upload_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          teamId,
          itemType,
          parseInt(itemNumber),
          fileName,
          `/uploads/${team}/${fileName}`,
          file.size,
          file.type,
          'pending'
        ]
      );
      console.log('Saved to uploaded_items successfully');
    } catch (error) {
      console.error('Failed to save to uploaded_items:', error);
      throw new Error('Failed to save file info to database');
    }

    // Update media_items table
    console.log('Saving to media_items table');
    try {
      await pool.query(
        `INSERT INTO media_items (
          team_id, item_type, item_number, file_name, 
          file_path, file_size, mime_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          teamId,
          itemType,
          parseInt(itemNumber),
          fileName,
          `/uploads/${team}/${fileName}`,
          file.size,
          file.type
        ]
      );
      console.log('Saved to media_items successfully');
    } catch (error) {
      console.error('Failed to save to media_items:', error);
      throw new Error('Failed to update media items');
    }

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
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload file. Please try again.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 