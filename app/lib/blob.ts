import { put } from '@vercel/blob';

export async function uploadToBlob(file: File, teamName: string) {
  try {
    const blob = await put(`${teamName}/${file.name}`, file, {
      access: 'public',
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    return {
      success: true,
      url: blob.url
    };
  } catch (error) {
    console.error('Failed to upload to blob store:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload file'
    };
  }
} 