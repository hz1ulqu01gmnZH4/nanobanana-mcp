// Generate actual blank images with proper dimensions
import { Jimp } from 'jimp';

/**
 * Generate a proper blank image with actual dimensions
 * The Zenn article suggests the last image determines aspect ratio
 * So we need a real image with the target dimensions
 */
export async function generateProperBlankImage(width: number, height: number): Promise<string> {
  try {
    // Create white image with actual target dimensions
    const image = new Jimp({ width, height, color: 0xFFFFFFFF });
    
    // Add a very subtle gradient or pattern to make it a "valid" image
    // Some APIs reject pure white images as invalid
    for (let y = 0; y < height; y += 50) {
      for (let x = 0; x < width; x += 50) {
        // Add very subtle gray dots
        const color = 0xFEFEFEFF; // Almost white
        image.setPixelColor(color, x, y);
      }
    }
    
    // Convert to base64
    const buffer = await image.getBuffer('image/png');
    return buffer.toString('base64');
  } catch (error) {
    console.error('Error generating blank image:', error);
    throw error;
  }
}

/**
 * Generate a canvas-like image for aspect ratio control
 * This creates a more substantial image that won't be rejected
 */
export async function generateCanvasImage(width: number, height: number): Promise<string> {
  try {
    // Create off-white image with target dimensions
    const image = new Jimp({ width, height, color: 0xFAFAFAFF });
    
    // Add border to make it look like a canvas
    const borderColor = 0xF0F0F0FF;
    const borderWidth = 2;
    
    // Top and bottom borders
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < borderWidth; y++) {
        image.setPixelColor(borderColor, x, y);
        image.setPixelColor(borderColor, x, height - 1 - y);
      }
    }
    
    // Left and right borders
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < borderWidth; x++) {
        image.setPixelColor(borderColor, x, y);
        image.setPixelColor(borderColor, width - 1 - x, y);
      }
    }
    
    // Add center crosshair for validity
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const crossColor = 0xFCFCFCFF; // Very subtle
    
    // Horizontal line
    for (let x = centerX - 20; x < centerX + 20; x++) {
      if (x >= 0 && x < width) {
        image.setPixelColor(crossColor, x, centerY);
      }
    }
    
    // Vertical line
    for (let y = centerY - 20; y < centerY + 20; y++) {
      if (y >= 0 && y < height) {
        image.setPixelColor(crossColor, centerX, y);
      }
    }
    
    // Convert to base64
    const buffer = await image.getBuffer('image/png');
    return buffer.toString('base64');
  } catch (error) {
    console.error('Error generating canvas image:', error);
    throw error;
  }
}