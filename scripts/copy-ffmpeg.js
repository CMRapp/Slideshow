const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Create public directory if it doesn't exist
const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

// Copy FFmpeg core files
const ffmpegCorePath = path.join(process.cwd(), 'node_modules', '@ffmpeg', 'core', 'dist');
const filesToCopy = ['ffmpeg-core.js', 'ffmpeg-core.wasm'];

filesToCopy.forEach(file => {
  const sourcePath = path.join(ffmpegCorePath, file);
  const destPath = path.join(publicDir, file);
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`Copied ${file} to public directory`);
  } else {
    console.error(`Could not find ${file} at ${sourcePath}`);
  }
}); 