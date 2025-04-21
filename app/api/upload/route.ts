import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import getPool from '@/lib/db';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Allowed file types and their MIME types
const ALLOWED_FILE_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'video/mp4': '.mp4',
  'video/webm': '.webm'
};

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Sanitize filename to prevent directory traversal and special characters
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9-_.]/g, '') // Remove special characters
    .replace(/\.{2,}/g, '.') // Replace multiple dots with single dot
    .replace(/^\.+/, '') // Remove leading dots
    .replace(/\.+$/, ''); // Remove trailing dots
}

// Sanitize team name
function sanitizeTeamName(name: string): string {
  return name
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/[&<>"']/g, '') // Remove special characters
    .substring(0, 100); // Limit length
}

function normalizeTeamName(name: string): string {
  // Remove 'team' (case insensitive) from the beginning or end
  let normalized = name.replace(/^team\s+/i, '').replace(/\s+team$/i, '');
  
  // Convert to standard case (first letter of each word capitalized)
  normalized = normalized
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return normalized;
}

export async function POST(request: Request) {
  let connection;
  try {
    const formData = await request.formData();
    console.log('Received form data:', {
      team: formData.get('team'),
      itemNumber: formData.get('itemNumber'),
      itemType: formData.get('itemType'),
      file: formData.get('file')
    });

    const team = formData.get('team') as string;
    const itemNumber = formData.get('itemNumber') as string;
    const itemType = formData.get('itemType') as string;
    const file = formData.get('file') as File;

    if (!team || !itemNumber || !itemType || !file) {
      console.error('Missing required fields:', { team, itemNumber, itemType, file });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate item number
    const parsedItemNumber = parseInt(itemNumber, 10);
    if (isNaN(parsedItemNumber) || parsedItemNumber < 1) {
      console.error('Invalid item number:', itemNumber);
      return NextResponse.json(
        { error: 'Invalid item number' },
        { status: 400 }
      );
    }

    // Validate item type
    if (!['photo', 'video'].includes(itemType)) {
      console.error('Invalid item type:', itemType);
      return NextResponse.json(
        { error: 'Invalid item type' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES[file.type as keyof typeof ALLOWED_FILE_TYPES]) {
      console.error('Invalid file type:', file.type);
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      console.error('File too large:', file.size);
      return NextResponse.json(
        { error: 'File too large' },
        { status: 400 }
      );
    }

    const pool = await getPool();
    connection = await pool.getConnection();
    console.log('Database connection established');

    // Check if this item has already been uploaded
    const [existingItems] = await connection.query(
      'SELECT * FROM uploaded_items WHERE team = ? AND item_number = ? AND item_type = ?',
      [team, parsedItemNumber, itemType]
    );

    if (Array.isArray(existingItems) && existingItems.length > 0) {
      console.error('Item already uploaded:', { team, parsedItemNumber, itemType });
      return NextResponse.json(
        { error: 'This item has already been uploaded' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      console.log('Creating uploads directory:', uploadsDir);
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const fileExt = ALLOWED_FILE_TYPES[file.type as keyof typeof ALLOWED_FILE_TYPES];
    const filename = `${team}_${itemType}_${parsedItemNumber}${fileExt}`;
    const filePath = join(uploadsDir, filename);
    console.log('Saving file to:', filePath);

    // Save the file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Process image if it's a photo
    if (itemType === 'photo') {
      console.log('Processing photo with sharp');
      const processedBuffer = await sharp(buffer)
        .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();
      await writeFile(filePath, processedBuffer);
    } else {
      await writeFile(filePath, buffer);
    }

    // Record the uploaded item
    console.log('Recording uploaded item in database');
    await connection.query(
      'INSERT INTO uploaded_items (team, item_type, item_number, file_path) VALUES (?, ?, ?, ?)',
      [team, itemType, parsedItemNumber, `/uploads/${filename}`]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Upload error:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
        errno: (error as any).errno,
        sqlState: (error as any).sqlState,
        sqlMessage: (error as any).sqlMessage
      });
    }
    return NextResponse.json(
      { error: 'Failed to upload file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
      console.log('Database connection released');
    }
  }
} 