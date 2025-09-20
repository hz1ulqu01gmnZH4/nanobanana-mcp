import fetch from 'node-fetch';
import { Jimp } from 'jimp';
import { ImageProvider, ImageGenerationArgs, GenerationResult, ImageInput } from '../types.js';
import { parseAspectRatio, generateBlankImageSync, getAspectRatioPrompt } from '../utils/aspect-ratio.js';
import { readImageFileAsBase64 } from '../utils.js';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent';

export class GeminiProvider implements ImageProvider {
  name = 'Gemini Direct API';
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async generateImage(args: ImageGenerationArgs): Promise<GenerationResult> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }

    try {
      // Parse aspect ratio if provided
      const aspectRatioConfig = parseAspectRatio(args.aspect_ratio);
      
      const parts: any[] = [
        { text: this.buildPrompt(args, aspectRatioConfig) }
      ];

      // Add reference images if provided
      if (args.images && args.images.length > 0) {
        for (const image of args.images) {
          if (image.base64) {
            parts.push({
              inline_data: {
                mime_type: image.mimeType || 'image/png',
                data: image.base64.replace(/^data:.*?;base64,/, '')
              }
            });
          } else if (image.path) {
            // Read local file and convert to base64
            const imageData = await readImageFileAsBase64(image.path);
            parts.push({
              inline_data: {
                mime_type: image.mimeType || imageData.mimeType,
                data: imageData.base64
              }
            });
          } else if (image.url) {
            // Fetch and convert URL to base64
            const imageData = await this.fetchImageAsBase64(image.url);
            parts.push({
              inline_data: {
                mime_type: imageData.mimeType,
                data: imageData.base64
              }
            });
          }
        }
      }

      // Add blank image AFTER reference images for aspect ratio control
      // According to Zenn article: original image + blank image + prompt
      // The blank image (last image) determines the output aspect ratio
      if (aspectRatioConfig) {
        // Generate a larger blank image that matches target dimensions
        const blankImage = await this.generateLargeBlankImage(aspectRatioConfig);
        parts.push({
          inline_data: {
            mime_type: 'image/png',
            data: blankImage
          }
        });
      }

      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'x-goog-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: parts
          }]
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json() as any;
      
      // Extract generated images from response - loop through ALL candidates and parts
      const images = [];
      if (data.candidates && Array.isArray(data.candidates)) {
        for (const candidate of data.candidates) {
          if (candidate.content && candidate.content.parts) {
            for (const part of candidate.content.parts) {
              if (part.inline_data) {
                images.push({
                  type: 'base64' as const,
                  data: `data:${part.inline_data.mime_type || 'image/png'};base64,${part.inline_data.data}`,
                  format: part.inline_data.mime_type?.split('/')[1] || 'png'
                });
              }
            }
          }
        }
      }

      return {
        success: true,
        provider: 'Gemini Direct',
        model: 'gemini-2.5-flash-image-preview',
        prompt: args.prompt,
        images: images,
        message: 'Image generated successfully',
        usage: data.usageMetadata ? {
          input_tokens: data.usageMetadata.promptTokenCount,
          output_tokens: data.usageMetadata.candidatesTokenCount,
          tokens: data.usageMetadata.totalTokenCount
        } : undefined
      };
    } catch (error: any) {
      return {
        success: false,
        provider: 'Gemini Direct',
        model: 'gemini-2.5-flash-image-preview',
        prompt: args.prompt,
        error: error.message
      };
    }
  }

  private buildPrompt(args: ImageGenerationArgs, aspectRatioConfig?: any): string {
    let prompt = args.prompt;

    // Add scenario-specific enhancements
    if (args.scenario) {
      prompt = this.enhancePromptForScenario(prompt, args.scenario);
    }

    // Add aspect ratio instruction if specified
    // When using blank image technique, also instruct to fill the canvas
    if (aspectRatioConfig) {
      prompt += ` Generate the image to fill the entire ${getAspectRatioPrompt(aspectRatioConfig)} canvas provided by the blank image.`;
    }

    // Add negative prompt if specified
    if (args.negative_prompt) {
      prompt += ` Avoid: ${args.negative_prompt}.`;
    }

    // Add sample count if specified
    if (args.sample_count && args.sample_count > 1) {
      prompt = `Generate ${args.sample_count} variations of: ${prompt}`;
    }

    return prompt;
  }

  private enhancePromptForScenario(prompt: string, scenario: string): string {
    const enhancements: Record<string, string> = {
      'style-transfer': 'Apply the artistic style from the reference image(s) to: ',
      'character-design': 'Create a character design sheet showing multiple views and poses for: ',
      'pose-modification': 'Modify the pose of the subject while maintaining their appearance: ',
      'background-expansion': 'Expand or modify the background while keeping the main subject: ',
      'multi-reference': 'Combine elements from all reference images to create: ',
      'cross-view': 'Generate different viewing angles or perspectives of: ',
      'ar-overlay': 'Add augmented reality information overlays to: ',
      'photo-enhancement': 'Enhance and improve the quality of: '
    };

    return (enhancements[scenario] || '') + prompt;
  }

  private async fetchImageAsBase64(url: string): Promise<{ base64: string; mimeType: string }> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image from URL: ${url}`);
    }
    
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const mimeType = response.headers.get('content-type') || 'image/png';
    
    return { base64, mimeType };
  }

  private async generateLargeBlankImage(config: any): Promise<string> {
    try {
      // Create a blank white image with the actual target dimensions
      // This is the key: the image should be the exact size we want
      const image = new Jimp({ 
        width: config.width, 
        height: config.height, 
        color: 0xFFFFFFFF 
      });
      
      // Add subtle pattern to ensure it's recognized as valid image
      // Add a very light gray border
      const borderColor = 0xFAFAFAFF;
      for (let x = 0; x < config.width; x++) {
        image.setPixelColor(borderColor, x, 0);
        image.setPixelColor(borderColor, x, config.height - 1);
      }
      for (let y = 0; y < config.height; y++) {
        image.setPixelColor(borderColor, 0, y);
        image.setPixelColor(borderColor, config.width - 1, y);
      }
      
      const buffer = await image.getBuffer('image/png');
      return buffer.toString('base64');
    } catch (error) {
      console.error('Error generating large blank image:', error);
      // Fallback to pre-generated blank
      return generateBlankImageSync(config);
    }
  }

  getModelInfo(): string {
    return `Gemini 2.5 Flash Image Preview (Nano Banana)
• Direct Google API access
• Advanced image generation with reference image support
• Multi-modal understanding
• Aspect ratio control through natural language
• Style transfer and image manipulation capabilities`;
  }
}