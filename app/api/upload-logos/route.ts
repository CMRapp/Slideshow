import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

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
      const path = join(process.cwd(), 'public', 'riders-wm.png');
      uploadPromises.push(writeFile(path, buffer));
    }

    if (sideLogoVertical) {
      const bytes = await sideLogoVertical.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const path = join(process.cwd(), 'public', 'side-logo-vertical.png');
      uploadPromises.push(writeFile(path, buffer));
    }

    if (sideLogoHorizontal) {
      const bytes = await sideLogoHorizontal.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const path = join(process.cwd(), 'public', 'side-logo-horiz.png');
      uploadPromises.push(writeFile(path, buffer));
    }

    await Promise.all(uploadPromises);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error uploading logos:', error);
    return NextResponse.json(
      { error: 'Failed to upload logos' },
      { status: 500 }
    );
  }
} 