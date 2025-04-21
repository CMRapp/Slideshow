import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync, mkdir } from 'fs';
import sharp from 'sharp';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      );
    }

    // Create backgrounds directory if it doesn't exist
    const backgroundsDir = join(process.cwd(), 'public', 'backgrounds');
    if (!existsSync(backgroundsDir)) {
      await mkdir(backgroundsDir, { recursive: true });
    }

    // Process and save the image
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Process image with sharp
    const processedBuffer = await sharp(buffer)
      .resize(1920, 1080, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Save the processed image
    const filename = 'background.jpg';
    const filePath = join(backgroundsDir, filename);
    await writeFile(filePath, processedBuffer);

    return NextResponse.json({
      success: true,
      filePath: `/backgrounds/${filename}`
    });
  } catch (error) {
    console.error('Error uploading background:', error);
    return NextResponse.json(
      { error: 'Failed to upload background image' },
      { status: 500 }
    );
  }
} 