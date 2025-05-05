import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

const BLOB_STORE_URL = 'https://public.blob.vercel-storage.com';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamName = searchParams.get('team');

    if (!teamName) {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `SELECT 
        ui.id,
        ui.item_type as type,
        ui.item_number as number,
        ui.file_path as url,
        ui.mime_type
       FROM uploaded_items ui
       JOIN teams t ON ui.team_id = t.id
       WHERE t.name = $1
       AND ui.upload_status = 'completed'
       AND ui.file_path IS NOT NULL
       ORDER BY ui.item_type, ui.item_number`,
      [teamName]
    );

    // Process URLs to ensure they're in the correct format
    const processedItems = result.rows.map(item => {
      // If it's an old path format, convert to Vercel Blob URL
      if (item.url.startsWith('/api/files/')) {
        const pathParts = item.url.split('/');
        const fileName = pathParts[4];
        item.url = `${BLOB_STORE_URL}/${teamName}/${fileName}`;
      }
      
      // If it's the old blob store URL, update to new format
      if (item.url.includes('slideshow-store.public.blob.vercel-storage.com')) {
        const url = new URL(item.url);
        const pathParts = url.pathname.split('/');
        const fileName = pathParts[2];
        item.url = `${BLOB_STORE_URL}/${teamName}/${fileName}`;
      }
      
      return {
        id: item.id,
        type: item.type,
        number: item.number,
        url: item.url
      };
    });

    return NextResponse.json(processedItems);
  } catch (error) {
    console.error('Error fetching team items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team items' },
      { status: 500 }
    );
  }
} 