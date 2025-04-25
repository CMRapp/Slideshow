import { put, list, del } from '@vercel/blob';

export async function uploadToBlob(file: File, teamName: string) {
  try {
    const fileName = `${teamName}/${file.name}`;
    
    const blob = await put(fileName, file, {
      access: 'public',
      addRandomSuffix: true,
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    return {
      url: blob.url,
      success: true
    };
  } catch (error) {
    console.error('Error uploading to blob store:', error);
    return {
      success: false,
      error: 'Failed to upload file'
    };
  }
}

export async function deleteFromBlob(url: string) {
  try {
    await del(url, {
      token: process.env.BLOB_READ_WRITE_TOKEN
    });
    return { success: true };
  } catch (error) {
    console.error('Error deleting from blob store:', error);
    return {
      success: false,
      error: 'Failed to delete file'
    };
  }
}

export async function listBlobs() {
  try {
    const blobs = await list({
      token: process.env.BLOB_READ_WRITE_TOKEN
    });
    return {
      success: true,
      blobs: blobs.blobs
    };
  } catch (error) {
    console.error('Error listing blobs:', error);
    return {
      success: false,
      error: 'Failed to list files'
    };
  }
} 