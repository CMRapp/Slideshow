import { createCanvas, loadImage } from 'canvas';
import { join } from 'path';

let globalGradient: string | null = null;

export async function initializeGlobalGradient() {
  if (globalGradient) return globalGradient;
  
  try {
    const imagePath = join(process.cwd(), 'public', 'side-logo-horiz.png');
    const colors = await extractColorsFromImage(imagePath);
    globalGradient = createGradientFromColors(colors);
    return globalGradient;
  } catch (error) {
    console.error('Error initializing global gradient:', error);
    return null;
  }
}

export async function extractColorsFromImage(imagePath: string): Promise<string[]> {
  try {
    const image = await loadImage(imagePath);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    
    // Draw image on canvas
    ctx.drawImage(image, 0, 0);
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, image.width, image.height);
    const pixels = imageData.data;
    
    // Create a color frequency map
    const colorMap = new Map<string, number>();
    
    // Sample every 10th pixel for performance
    for (let i = 0; i < pixels.length; i += 40) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];
      
      // Skip transparent pixels and near-black colors
      if (a < 128 || (r < 30 && g < 30 && b < 30)) continue;
      
      const color = `rgb(${r},${g},${b})`;
      colorMap.set(color, (colorMap.get(color) || 0) + 1);
    }
    
    // Sort colors by frequency and get top 3
    const sortedColors = Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([color]) => color);
    
    // If we don't have enough colors, add some vibrant fallbacks
    if (sortedColors.length < 2) {
      sortedColors.push('rgb(255, 215, 0)'); // Gold
      sortedColors.push('rgb(255, 69, 0)');  // Red-Orange
    }
    
    return sortedColors;
  } catch (error) {
    console.error('Error extracting colors:', error);
    return ['rgb(255, 215, 0)', 'rgb(255, 69, 0)']; // Fallback to gold and red-orange
  }
}

export function createGradientFromColors(colors: string[]): string {
  if (colors.length === 1) {
    return colors[0];
  }
  
  const gradientStops = colors.map((color, index) => {
    const position = (index / (colors.length - 1)) * 100;
    return `${color} ${position}%`;
  }).join(', ');
  
  return `linear-gradient(to right, ${gradientStops})`;
}

export function getGlobalGradient(): string {
  return globalGradient || 'linear-gradient(to right, rgb(255, 215, 0), rgb(255, 69, 0))';
} 