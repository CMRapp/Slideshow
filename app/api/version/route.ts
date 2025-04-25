import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const version = {
      version: process.env.NEXT_PUBLIC_APP_VERSION || '2.0.0',
      buildDate: new Date().toISOString(),
      environment: process.env.NODE_ENV
    };

    return NextResponse.json(version);
  } catch (error) {
    console.error('Error in version API:', error);
    return NextResponse.json(
      { error: 'Failed to get version information' },
      { status: 500 }
    );
  }
} 