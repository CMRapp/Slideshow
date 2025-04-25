import { put } from '@vercel/blob';

const BLOB_STORE_URL = 'https://public.blob.vercel-storage.com';

export async function uploadToBlob(file: File, teamName: string) {
  try {
    const blob = await put(file.name, file, {
      access: 'public',
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    // Return the correct URL format
    const url = `${BLOB_STORE_URL}/${teamName}/${file.name}`;
    
    return {
      success: true,
      url
    };
  } catch (error) {
    console.error('Failed to upload to blob store:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload file'
    };
  }
} 