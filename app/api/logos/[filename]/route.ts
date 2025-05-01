import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

type Props = {
  params: { filename: string }
}

export async function GET(
  request: Request,
  { params }: Props
) {
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

    const filename = params.filename;
    const validFilenames = ['riders-wm.png', 'side-logo-vertical.png', 'side-logo-horiz.png'];

    if (!validFilenames.includes(filename)) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      );
    }

    const response = await fetch(`https://public.blob.vercel-storage.com/logos/${filename}`, {
      headers: {
        'Authorization': `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch logo');
    }

    const blob = await response.blob();
    const headers = new Headers();
    headers.set('Content-Type', blob.type);
    headers.set('Cache-Control', 'public, max-age=31536000');

    return new NextResponse(blob, { headers });
  } catch (error) {
    console.error('Error serving logo:', error);
    return NextResponse.json(
      { error: 'Failed to serve logo' },
      { status: 500 }
    );
  }
} 