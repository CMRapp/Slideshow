import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    const packageJsonPath = join(process.cwd(), 'package.json');
    console.log('Reading package.json from:', packageJsonPath);
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    console.log('Package.json contents:', packageJson);
    return NextResponse.json({ version: packageJson.version });
  } catch (error) {
    console.error('Error reading package.json:', error);
    return NextResponse.json({ version: 'unknown' });
  }
} 