import { NextResponse } from 'next/server';
import { clients } from '@/app/lib/sse-clients';

export async function GET() {
  const encoder = new TextEncoder();
  const customReadable = new ReadableStream({
    start(controller) {
      // Add this client to the set
      clients.add(controller);

      // Keep the connection alive
      const keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(':\n\n'));
      }, 30000);

      // Clean up on close
      return () => {
        clearInterval(keepAlive);
        clients.delete(controller);
      };
    },
  });

  return new NextResponse(customReadable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
} 