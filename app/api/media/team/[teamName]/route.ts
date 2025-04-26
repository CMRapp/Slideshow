import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@lib/db';
import { MediaItem, DatabaseError } from '../../../../types/database';
import { AppError, handleDatabaseError, handleAppError } from '@utils/error-handling';

export async function GET(
  request: NextRequest,
  { params }: { params: { teamName: string } }
) {
  const client = await pool.connect();
  try {
    const { teamName } = params;
    
    const result = await client.query<MediaItem>(
      `SELECT m.* 
       FROM media_items m
       JOIN teams t ON m.team_id = t.id
       WHERE t.name = $1
       ORDER BY m.item_number ASC`,
      [teamName]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(handleAppError(error), { status: error.statusCode });
    }
    return NextResponse.json(handleDatabaseError(error), { status: 500 });
  } finally {
    client.release();
  }
}
