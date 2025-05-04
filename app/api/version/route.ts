import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    version: '3.1.0',
    buildDate: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
} 