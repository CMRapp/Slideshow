import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

interface DatabaseItem {
  id: number;
  file_name: string;
  file_path: string;
  team_name: string;
  mime_type: string;
}

interface MigrationSuccess {
  id: number;
  oldPath: string;
  newPath: string;
}

interface MigrationFailure {
  id: number;
  path: string;
  error: string;
}

interface MigrationResults {
  success: MigrationSuccess[];
  failed: MigrationFailure[];
}

export async function GET() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Get all items with old path format
    const items = await client.query<DatabaseItem>(`
      SELECT 
        ui.id,
        ui.file_name,
        ui.file_path,
        t.name as team_name,
        ui.mime_type
      FROM uploaded_items ui
      INNER JOIN teams t ON t.id = ui.team_id
      WHERE ui.file_path LIKE '/api/files/%'
    `);

    console.log('Found items to migrate:', items.rows.length);

    const results: MigrationResults = {
      success: [],
      failed: []
    };

    // Process each item
    for (const item of items.rows) {
      try {
        // Generate the new Vercel Blob URL
        const blobUrl = `https://slideshow-store.public.blob.vercel-storage.com/${item.team_name}/${item.file_name}`;
        
        // Update the record
        await client.query(
          `UPDATE uploaded_items 
           SET file_path = $1
           WHERE id = $2
           RETURNING *`,
          [blobUrl, item.id]
        );

        results.success.push({
          id: item.id,
          oldPath: item.file_path,
          newPath: blobUrl
        });

        console.log(`Migrated item ${item.id}: ${item.file_path} -> ${blobUrl}`);
      } catch (err) {
        console.error(`Failed to migrate item ${item.id}:`, err);
        results.failed.push({
          id: item.id,
          path: item.file_path,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    await client.query('COMMIT');

    return NextResponse.json({
      totalProcessed: items.rows.length,
      successful: results.success.length,
      failed: results.failed.length,
      details: results
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Failed to migrate file paths' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
} 