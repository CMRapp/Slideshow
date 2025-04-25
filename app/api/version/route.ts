import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    const packageJsonPath = join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    
    const version = {
      version: packageJson.version || '2.0.0',
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