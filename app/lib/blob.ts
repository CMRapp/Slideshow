import { put } from '@vercel/blob';

export async function uploadToBlob(file: File, teamName: string) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error('BLOB_READ_WRITE_TOKEN is not configured');
    }

    // Sanitize the file name to prevent path traversal
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${teamName}/${sanitizedFileName}`;
    
    console.log('Uploading to Vercel Blob:', {
      fileName,
      fileSize: file.size,
      fileType: file.type
    });

    const blob = await put(fileName, file, {
      access: 'public',
      addRandomSuffix: true,
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    console.log('Blob upload successful:', blob.url);

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