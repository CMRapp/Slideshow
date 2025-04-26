import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        t.name as team_name,
        COUNT(CASE WHEN ui.mime_type LIKE 'image/%' THEN 1 END) as photo_count,
        COUNT(CASE WHEN ui.mime_type LIKE 'video/%' THEN 1 END) as video_count
      FROM teams t
      LEFT JOIN uploaded_items ui ON t.id = ui.team_id
      WHERE ui.upload_status = 'completed'
      AND ui.file_path IS NOT NULL
      GROUP BY t.name
      ORDER BY t.name
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching team stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team stats' },
      { status: 500 }
    );
  }
} 