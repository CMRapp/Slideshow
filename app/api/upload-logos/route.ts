import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { put } from '@vercel/blob';

export async function POST(request: Request) {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const session = cookieStore.get('session');

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

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
      const blob = await put('logos/riders-wm.png', mainLogo, {
        access: 'public',
        addRandomSuffix: false,
        token: process.env.BLOB_READ_WRITE_TOKEN,
        contentType: mainLogo.type,
      });
      uploadPromises.push(blob);
    }

    if (sideLogoVertical) {
      const blob = await put('logos/side-logo-vertical.png', sideLogoVertical, {
        access: 'public',
        addRandomSuffix: false,
        token: process.env.BLOB_READ_WRITE_TOKEN,
        contentType: sideLogoVertical.type,
      });
      uploadPromises.push(blob);
    }

    if (sideLogoHorizontal) {
      const blob = await put('logos/side-logo-horiz.png', sideLogoHorizontal, {
        access: 'public',
        addRandomSuffix: false,
        token: process.env.BLOB_READ_WRITE_TOKEN,
        contentType: sideLogoHorizontal.type,
      });
      uploadPromises.push(blob);
    }

    await Promise.all(uploadPromises);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error uploading logos:', error);
    return NextResponse.json(
      { error: 'Failed to upload logos', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 