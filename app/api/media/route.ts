import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { uploadToBlob } from '@/lib/blob';

export async function GET() {
  try {
    console.log('Fetching media items from database...');
    
    // First, let's check what's in the uploaded_items table
    const checkQuery = await pool.query(
      `SELECT COUNT(*) as total, 
              COUNT(CASE WHEN upload_status = 'completed' THEN 1 END) as completed,
              COUNT(CASE WHEN file_path IS NOT NULL THEN 1 END) as with_path
       FROM uploaded_items`
    );
    console.log('Database stats:', checkQuery.rows[0]);
    
    const result = await pool.query(
      `SELECT 
        ui.id,
        t.name as team_name,
        ui.mime_type as file_type,
        ui.file_path,
        ui.file_name,
        ui.item_type,
        ui.item_number,
        ui.upload_status
      FROM teams t
      INNER JOIN uploaded_items ui ON t.id = ui.team_id
      WHERE ui.upload_status = 'completed'
      AND ui.file_path IS NOT NULL
      ORDER BY t.name, ui.item_type, ui.item_number`
    );

    console.log('Database query result:', {
      totalRows: result.rows.length,
      firstRow: result.rows[0],
      allRows: result.rows
    });

    if (!result.rows.length) {
      console.log('No media items found in database');
      return NextResponse.json({ mediaItems: [] });
    }

    // Process and validate each media item
    const processedItems = result.rows.map(item => {
      // If it's an old path format, convert to Vercel Blob URL
      if (item.file_path.startsWith('/api/files/')) {
        const pathParts = item.file_path.split('/');
        const teamName = pathParts[3];
        const fileName = pathParts[4];
        item.file_path = `https://slideshow-store.public.blob.vercel-storage.com/${teamName}/${fileName}`;
      }
      return item;
    });

    // Validate URLs
    const validMediaItems = processedItems.filter(item => {
      const isValid = item.file_path && (
        item.file_path.startsWith('https://') || 
        item.file_path.startsWith('http://')
      );
      
      if (!isValid) {
        console.warn('Invalid file path found:', {
          id: item.id,
          team_name: item.team_name,
          file_path: item.file_path,
          upload_status: item.upload_status
        });
      }
      
      return isValid;
    });

    console.log('Valid media items:', {
      count: validMediaItems.length,
      items: validMediaItems
    });
    
    return NextResponse.json({ mediaItems: validMediaItems });
  } catch (error) {
    console.error('Error fetching media items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media items' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const formData = await request.formData();
    const teamName = formData.get('team') as string;
    const file = formData.get('file') as File;
    const itemType = formData.get('itemType') as string;

    if (!teamName || !file || !itemType) {
      console.error('Missing required fields:', { teamName, file, itemType });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Uploading to Vercel Blob:', { teamName, fileName: file.name, itemType });
    const uploadResult = await uploadToBlob(file, teamName);
    if (!uploadResult.success) {
      console.error('Blob upload failed:', uploadResult.error);
      return NextResponse.json(
        { error: 'Failed to upload file to storage' },
        { status: 500 }
      );
    }
    console.log('Blob upload successful:', uploadResult.url);

    // Get team_id
    const teamResult = await client.query(
      'SELECT id FROM teams WHERE name = $1',
      [teamName]
    );

    if (teamResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    const teamId = teamResult.rows[0].id;

    // Get next item number
    const itemNumberResult = await client.query(
      `SELECT COALESCE(MAX(item_number), 0) + 1 as next_number
       FROM uploaded_items
       WHERE team_id = $1 AND item_type = $2`,
      [teamId, itemType]
    );

    const itemNumber = itemNumberResult.rows[0].next_number;

    console.log('Inserting into database:', {
      teamId,
      itemType,
      itemNumber,
      fileName: file.name,
      url: uploadResult.url
    });

    // Insert with Blob Store URL
    const result = await client.query(
      `INSERT INTO uploaded_items (
        team_id, item_type, item_number, file_name,
        file_path, file_size, mime_type, upload_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        teamId,
        itemType,
        itemNumber,
        file.name,
        uploadResult.url,
        file.size,
        file.type,
        'completed'
      ]
    );

    await client.query('COMMIT');
    console.log('Database insert successful:', result.rows[0]);

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error uploading media:', error);
    return NextResponse.json(
      { error: 'Failed to upload media' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
} 