import * as fs from 'fs/promises';
import * as path from 'path';
import fetch from 'node-fetch';

export async function saveImages(images: any[], baseFilename: string): Promise<string[]> {
  const savedFiles: string[] = [];
  // For MCP servers, files should be saved relative to where the client is running
  // Using current directory without process.cwd() to respect client's context
  const outputDir = 'generated_images';
  await fs.mkdir(outputDir, { recursive: true });

  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    try {
      let buffer: Buffer;
      let ext = 'png';

      if (image.type === 'base64' && image.data) {
        const base64Data = image.data.replace(/^data:.*?;base64,/, '');
        buffer = Buffer.from(base64Data, 'base64');
        if (image.format) {
          ext = image.format;
        } else if (image.data.startsWith('data:')) {
          const mimeMatch = image.data.match(/data:image\/(.*?);/);
          if (mimeMatch) {
            ext = mimeMatch[1] === 'jpeg' ? 'jpg' : mimeMatch[1];
          }
        }
      } else if (image.type === 'url' && image.url) {
        const response = await fetch(image.url);
        if (!response.ok) {
          throw new Error(`Failed to fetch image from URL: ${image.url}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
        const contentType = response.headers.get('content-type');
        if (contentType) {
          ext = contentType.split('/')[1] || 'png';
          if (ext === 'jpeg') ext = 'jpg';
        }
      } else {
        continue;
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const safeBase = sanitizeFilename(baseFilename || 'generated_image');
      const filename = images.length > 1 
        ? `${safeBase}_${timestamp}_${i + 1}.${ext}`
        : `${safeBase}_${timestamp}.${ext}`;
      const filepath = path.join(outputDir, filename);

      await fs.writeFile(filepath, buffer);
      savedFiles.push(filepath);
      console.error(`Saved image to: ${filepath}`);
    } catch (err) {
      console.error(`Failed to save image #${i + 1}:`, err);
    }
  }

  return savedFiles;
}

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-z0-9_\-]+/gi, '_').slice(0, 64);
}

export function formatImageSize(data: string): string {
  return `${Math.round(data.length / 1024)}KB`;
}