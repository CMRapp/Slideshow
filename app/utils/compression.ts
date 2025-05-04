import imageCompression from 'browser-image-compression';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

const MAX_IMAGE_SIZE_MB = 4;

export async function compressImage(file: File, onProgress?: (progress: number) => void): Promise<File> {
  const options = {
    maxSizeMB: MAX_IMAGE_SIZE_MB,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: file.type,
    onProgress: (percentage: number) => {
      if (onProgress) {
        onProgress(percentage);
      }
    }
  };

  try {
    const compressedBlob = await imageCompression(file, options);
    return new File([compressedBlob], file.name, { type: file.type });
  } catch (error) {
    console.error('Error compressing image:', error);
    throw new Error('Failed to compress image');
  }
}

export async function compressVideo(file: File, onProgress?: (progress: number) => void): Promise<File> {
  const ffmpeg = new FFmpeg();
  
  try {
    await ffmpeg.load();
    
    // Set up progress callback
    ffmpeg.on('progress', ({ progress }) => {
      if (onProgress) {
        onProgress(progress * 100);
      }
    });
    
    // Write the input file to FFmpeg's virtual file system
    ffmpeg.writeFile('input.mp4', await fetchFile(file));
    
    // Run FFmpeg command to compress the video
    // -crf 28: Constant Rate Factor (18-28 is a good range, higher means more compression)
    // -preset faster: Faster encoding with reasonable compression
    // -vf scale=-2:720: Scale to 720p maintaining aspect ratio
    await ffmpeg.exec([
      '-i', 'input.mp4',
      '-c:v', 'libx264',
      '-crf', '28',
      '-preset', 'faster',
      '-vf', 'scale=-2:720',
      '-c:a', 'aac',
      '-b:a', '128k',
      'output.mp4'
    ]);
    
    // Read the compressed file from FFmpeg's virtual file system
    const data = await ffmpeg.readFile('output.mp4');
    
    // Clean up
    await ffmpeg.deleteFile('input.mp4');
    await ffmpeg.deleteFile('output.mp4');
    
    // Create a new File object from the compressed data
    return new File([data], file.name, { type: 'video/mp4' });
  } catch (error) {
    console.error('Error compressing video:', error);
    throw new Error('Failed to compress video');
  } finally {
    ffmpeg.terminate();
  }
}

export async function compressFile(file: File, onProgress?: (progress: number) => void): Promise<File> {
  if (file.type.startsWith('image/')) {
    return compressImage(file, onProgress);
  } else if (file.type.startsWith('video/')) {
    return compressVideo(file, onProgress);
  }
  throw new Error('Unsupported file type');
} 