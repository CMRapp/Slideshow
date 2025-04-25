export async function getToken(): Promise<string> {
  // Get the token from environment variable
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  
  if (!token) {
    throw new Error('BLOB_READ_WRITE_TOKEN environment variable is not set');
  }

  return token;
} 