import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    // Get all items regardless of status
    const allItems = await pool.query(`
      SELECT 
        ui.id,
        t.name as team_name,
        ui.mime_type as file_type,
        ui.file_path,
        ui.file_name,
        ui.item_type,
        ui.item_number,
        ui.upload_status,
        ui.created_at
      FROM uploaded_items ui
      LEFT JOIN teams t ON t.id = ui.team_id
      ORDER BY ui.created_at DESC
      LIMIT 10
    `);

    // Get counts by status
    const statusCounts = await pool.query(`
      SELECT 
        upload_status,
        COUNT(*) as count,
        COUNT(CASE WHEN file_path IS NOT NULL THEN 1 END) as with_path,
        COUNT(CASE WHEN file_path IS NULL THEN 1 END) as without_path
      FROM uploaded_items
      GROUP BY upload_status
    `);

    // Get counts by type
    const typeCounts = await pool.query(`
      SELECT 
        item_type,
        COUNT(*) as count
      FROM uploaded_items
      GROUP BY item_type
    `);

    return NextResponse.json({
      recentItems: allItems.rows,
      statusCounts: statusCounts.rows,
      typeCounts: typeCounts.rows,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch debug information' },
      { status: 500 }
    );
  }
} 