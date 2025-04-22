import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import getPool from '@/lib/db';
import fs from 'fs';
import path from 'path';

// Allowed file types and their MIME types
const ALLOWED_FILE_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
  'video/hevc': '.hevc'
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
  const pool = await getPool();
  let client;
  try {
    client = await pool.connect();
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const teamName = formData.get('teamName') as string;

    if (!file || !teamName) {
      return NextResponse.json(
        { error: 'File and team name are required' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;
    const filePath = join(process.cwd(), 'public', 'uploads', filename);

    // Save file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Save to database
    const result = await client.query(
      'INSERT INTO uploaded_items (file_name, file_type, file_path, item_number, item_type, team) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [
        file.name,
        file.type,
        `/uploads/${filename}`,
        1, // Default item number
        file.type.startsWith('image/') ? 'photo' : 'video',
        teamName
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      fileId: result.rows[0].id
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
} 