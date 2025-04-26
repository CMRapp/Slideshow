import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const teamName = searchParams.get('teamName');

    if (!teamName) {
        return new NextResponse(JSON.stringify({ error: 'Team name is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    return new NextResponse(JSON.stringify({ message: `You have requested information for the team: ${teamName}` }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}
