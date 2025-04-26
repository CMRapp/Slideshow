import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { Team, DatabaseError } from '@/types/database';
import { AppError, handleDatabaseError, handleAppError, validateRequiredFields } from '@/utils/error-handling';

export async function GET(
  request: Request,
  { params }: { params: { name: string } }
) {
  const client = await pool.connect();
  try {
    const { name } = params;
    validateRequiredFields({ name }, ['name']);

    const result = await client.query<Team>(
      'SELECT * FROM teams WHERE name = $1',
      [name]
    );

    if (result.rows.length === 0) {
      throw new AppError('Team not found', 404, 'TEAM_NOT_FOUND');
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(handleAppError(error), { status: error.statusCode });
    }
    return NextResponse.json(handleDatabaseError(error), { status: 500 });
  } finally {
    client.release();
  }
}

export async function POST(
  request: Request,
  { params }: { params: { name: string } }
) {
  const client = await pool.connect();
  try {
    const { name } = params;
    validateRequiredFields({ name }, ['name']);

    const result = await client.query<Team>(
      'INSERT INTO teams (name) VALUES ($1) RETURNING *',
      [name]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    const dbError = error as DatabaseError;
    if (dbError.code === '23505') { // Unique violation
      throw new AppError('Team name already exists', 409, 'TEAM_EXISTS');
    }
    return NextResponse.json(handleDatabaseError(error), { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { name: string } }
) {
  const client = await pool.connect();
  try {
    const { name } = params;
    validateRequiredFields({ name }, ['name']);

    const result = await client.query<Team>(
      'DELETE FROM teams WHERE name = $1 RETURNING *',
      [name]
    );

    if (result.rows.length === 0) {
      throw new AppError('Team not found', 404, 'TEAM_NOT_FOUND');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(handleAppError(error), { status: error.statusCode });
    }
    return NextResponse.json(handleDatabaseError(error), { status: 500 });
  } finally {
    client.release();
  }
} 