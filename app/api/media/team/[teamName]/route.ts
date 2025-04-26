import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@lib/db';
import { MediaItem } from '../../../../types/database';
import { AppError, handleDatabaseError, handleAppError } from '@utils/error-handling';

type RouteContext = {
  params: {
    teamName: string;
  };
};

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const client = await pool.connect();
  try {
    const { teamName } = context.params;
    
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
