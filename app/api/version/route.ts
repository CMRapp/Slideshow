import { NextResponse } from 'next/server';
import pkg from '../../../package.json';

export async function GET() {
  return NextResponse.json({
    version: pkg.version,
    buildDate: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
} 