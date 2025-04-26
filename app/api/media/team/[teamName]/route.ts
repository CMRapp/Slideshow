import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { teamName: string } }) {
    const { teamName } = params;

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
