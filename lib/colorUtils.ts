// Default gradient colors
const DEFAULT_GRADIENT = 'linear-gradient(to right, rgb(255, 215, 0), rgb(255, 69, 0))';

export function getGlobalGradient(): string {
  return DEFAULT_GRADIENT;
}

export function createGradientFromColors(colors: string[]): string {
  return DEFAULT_GRADIENT;
}

// These functions are kept for backward compatibility but return default values
export async function initializeGlobalGradient() {
  return DEFAULT_GRADIENT;
}

export async function extractColorsFromImage(imagePath: string): Promise<string[]> {
  return ['rgb(255, 215, 0)', 'rgb(255, 69, 0)'];
} 