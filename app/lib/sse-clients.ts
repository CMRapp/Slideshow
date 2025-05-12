// Keep track of connected clients
export const clients = new Set<ReadableStreamDefaultController>();

// Function to notify all clients of a new upload
export function notifyClients() {
  clients.forEach(client => {
    client.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'upload' })}\n\n`));
  });
} 