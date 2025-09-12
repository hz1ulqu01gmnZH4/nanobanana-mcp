import fetch from 'node-fetch';
import { Jimp } from 'jimp';
import { ImageProvider, ImageGenerationArgs, GenerationResult, ImageInput } from '../types.js';
import { parseAspectRatio, generateBlankImageSync, getAspectRatioPrompt } from '../utils/aspect-ratio.js';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const GEMINI_MODEL = 'google/gemini-2.5-flash-image-preview';

export class OpenRouterProvider implements ImageProvider {
  name = 'OpenRouter API';
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async generateImage(args: ImageGenerationArgs): Promise<GenerationResult> {
    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY environment variable is not set');
    }

    try {
      // Parse aspect ratio if provided
      const aspectRatioConfig = parseAspectRatio(args.aspect_ratio);
      
      // Build message content
      const content: any[] = [
        {
          type: 'text',
          text: this.buildPrompt(args, aspectRatioConfig)
        }
      ];

      // Add reference images if provided
      if (args.images && args.images.length > 0) {
        for (const image of args.images) {
          if (image.base64 || image.url) {
            const imageUrl = image.base64 
              ? `data:${image.mimeType || 'image/png'};base64,${image.base64.replace(/^data:.*?;base64,/, '')}`
              : image.url;
            
            content.push({
              type: 'image_url',
              image_url: {
                url: imageUrl!
              }
            });
          }
        }
      }

      // Add blank image AFTER reference images for aspect ratio control
      // According to Zenn article: original image + blank image + prompt
      // The blank image (last image) determines the output aspect ratio
      if (aspectRatioConfig) {
        const blankImage = await this.generateLargeBlankImage(aspectRatioConfig);
        content.push({
          type: 'image_url',
          image_url: {
            url: `data:image/png;base64,${blankImage}`
          }
        });
      }

      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/nanobanana-mcp',
          'X-Title': 'Nano Banana MCP Server',
        },
        body: JSON.stringify({
          model: GEMINI_MODEL,
          messages: [
            {
              role: 'user',
              content: content
            }
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json() as any;
      const message = data.choices[0].message;
      
      // Extract images from response
      const images = [];
      
      // Check for images in message.images array (OpenRouter format)
      if (message.images && message.images.length > 0) {
        for (const img of message.images) {
          if (img.image_url && img.image_url.url) {
            const url = img.image_url.url;
            if (url.startsWith('data:')) {
              images.push({
                type: 'base64' as const,
                data: url,
                format: url.substring(11, url.indexOf(';')) || 'png'
              });
            } else {
              images.push({
                type: 'url' as const,
                url: url
              });
            }
          }
        }
      }
      
      // Fallback: check if content contains image data
      if (images.length === 0 && message.content) {
        if (message.content.startsWith('data:image')) {
          images.push({
            type: 'base64' as const,
            data: message.content,
            format: message.content.substring(11, message.content.indexOf(';')) || 'png'
          });
        } else if (message.content.includes('http')) {
          const urlMatch = message.content.match(/https?:\/\/[^\s]+/);
          if (urlMatch) {
            images.push({
              type: 'url' as const,
              url: urlMatch[0]
            });
          }
        }
      }

      return {
        success: true,
        provider: 'OpenRouter',
        model: GEMINI_MODEL,
        prompt: args.prompt,
        images: images,
        message: message.content || 'Image generated successfully',
        usage: data.usage ? {
          input_tokens: data.usage.prompt_tokens,
          output_tokens: data.usage.completion_tokens,
          tokens: data.usage.total_tokens
        } : undefined
      };
    } catch (error: any) {
      return {
        success: false,
        provider: 'OpenRouter',
        model: GEMINI_MODEL,
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

  private async generateLargeBlankImage(config: any): Promise<string> {
    try {
      // Create a blank white image with the actual target dimensions
      const image = new Jimp({ 
        width: config.width, 
        height: config.height, 
        color: 0xFFFFFFFF 
      });
      
      // Add subtle pattern to ensure it's recognized as valid image
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
      return generateBlankImageSync(config);
    }
  }

  getModelInfo(): string {
    return `Gemini 2.5 Flash Image Preview via OpenRouter
• Access through OpenRouter API
• Same Nano Banana capabilities
• Unified billing through OpenRouter
• Support for multiple reference images
• Advanced scenario-based generation`;
  }
}