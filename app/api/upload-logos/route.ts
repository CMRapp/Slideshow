import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import sharp from 'sharp';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const mainLogo = formData.get('mainLogo') as File;
    const sideLogoVertical = formData.get('sideLogoVertical') as File;
    const sideLogoHorizontal = formData.get('sideLogoHorizontal') as File;

    if (!mainLogo && !sideLogoVertical && !sideLogoHorizontal) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    const uploadPromises = [];

    if (mainLogo) {
      const bytes = await mainLogo.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Process main logo
      const processedBuffer = await sharp(buffer)
        .resize(60, null, { withoutEnlargement: true })
        .toBuffer();

      const path = join(process.cwd(), 'public', 'riders-wm.png');
      uploadPromises.push(writeFile(path, processedBuffer));
    }

    if (sideLogoVertical) {
      const bytes = await sideLogoVertical.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Process vertical side logo
      const processedBuffer = await sharp(buffer)
        .resize(60, null, { withoutEnlargement: true })
        .toBuffer();

      const path = join(process.cwd(), 'public', 'side-logo-vertical.png');
      uploadPromises.push(writeFile(path, processedBuffer));
    }

    if (sideLogoHorizontal) {
      const bytes = await sideLogoHorizontal.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Process horizontal side logo
      const processedBuffer = await sharp(buffer)
        .resize(null, 60, { withoutEnlargement: true })
        .toBuffer();

      const path = join(process.cwd(), 'public', 'side-logo-horiz.png');
      uploadPromises.push(writeFile(path, processedBuffer));
    }

    await Promise.all(uploadPromises);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error uploading logos:', error);
    return NextResponse.json(
      { error: 'Error uploading logos' },
      { status: 500 }
    );
  }
} 