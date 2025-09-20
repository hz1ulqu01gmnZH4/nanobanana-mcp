#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { GeminiProvider } from './providers/gemini-provider.js';
import { OpenRouterProvider } from './providers/openrouter-provider.js';
import { ImageGenerationArgs, GenerationResult, ImageProvider } from './types.js';
import { saveImages, formatImageSize } from './utils.js';

class NanoBananaMCPServer {
  private server: Server;
  private geminiProvider: GeminiProvider;
  private openRouterProvider: OpenRouterProvider;

  constructor() {
    this.server = new Server(
      {
        name: 'nanobanana-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.geminiProvider = new GeminiProvider();
    this.openRouterProvider = new OpenRouterProvider();

    // Log provider availability
    console.error('Nano Banana MCP Server - Provider Status:');
    console.error(`• Gemini Direct API: ${this.geminiProvider.isAvailable() ? '✓ Available' : '✗ Not configured (set GEMINI_API_KEY)'}`);
    console.error(`• OpenRouter API: ${this.openRouterProvider.isAvailable() ? '✓ Available' : '✗ Not configured (set OPENROUTER_API_KEY)'}`);
    
    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'generate_image',
          description: 'Generate images using Nano Banana (Gemini 2.5 Flash Image Preview). Supports text-to-image and image-to-image generation with multiple reference images.',
          inputSchema: {
            type: 'object',
            properties: {
              prompt: {
                type: 'string',
                description: 'Text description of the image to generate. Be specific and detailed for best results.',
              },
              images: {
                type: 'array',
                description: 'Reference images for image-to-image generation or style transfer. Supports URLs, file paths, or base64 data.',
                items: {
                  type: 'object',
                  properties: {
                    path: {
                      type: 'string',
                      description: 'Local file path to the reference image (e.g., ./images/photo.jpg)',
                    },
                    url: {
                      type: 'string',
                      description: 'URL of the reference image',
                    },
                    base64: {
                      type: 'string',
                      description: 'Base64-encoded image data',
                    },
                    mimeType: {
                      type: 'string',
                      description: 'MIME type of the image (e.g., image/png, image/jpeg)',
                    },
                    description: {
                      type: 'string',
                      description: 'Optional description of what this reference image represents',
                    },
                  },
                },
              },
              provider: {
                type: 'string',
                enum: ['gemini', 'openrouter', 'auto'],
                description: 'API provider to use. "auto" selects the first available provider.',
                default: 'auto',
              },
              scenario: {
                type: 'string',
                enum: [
                  'text-to-image',
                  'style-transfer',
                  'character-design',
                  'pose-modification',
                  'background-expansion',
                  'multi-reference',
                  'cross-view',
                  'ar-overlay',
                  'photo-enhancement'
                ],
                description: 'Predefined scenario for optimized prompting',
              },
              aspect_ratio: {
                type: 'string',
                description: 'Desired aspect ratio (e.g., "1:1", "16:9", "9:16", "square", "landscape", "portrait")',
              },
              negative_prompt: {
                type: 'string',
                description: 'Elements to avoid in the generated image',
              },
              sample_count: {
                type: 'integer',
                description: 'Number of image variations to generate (model may not always follow exact count)',
                minimum: 1,
                maximum: 4,
              },
              save_to_file: {
                type: 'boolean',
                description: 'Save generated images to local files',
                default: false,
              },
              filename: {
                type: 'string',
                description: 'Base filename for saved images (without extension). Files will be saved to ./generated_images/ in the client\'s working directory',
              },
              show_full_response: {
                type: 'boolean',
                description: 'Include full base64 data in response (default: false for concise output)',
                default: false,
              },
            },
            required: ['prompt'],
          },
        },
        {
          name: 'list_providers',
          description: 'List available API providers and their status',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'list_scenarios',
          description: 'List available generation scenarios with descriptions',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'generate_image':
          return await this.handleGenerateImage(args as unknown as ImageGenerationArgs);
        case 'list_providers':
          return await this.handleListProviders();
        case 'list_scenarios':
          return await this.handleListScenarios();
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private async handleGenerateImage(args: ImageGenerationArgs) {
    // Select provider
    const provider = this.selectProvider(args.provider);
    if (!provider) {
      throw new Error('No image generation provider is available. Please set either GEMINI_API_KEY or OPENROUTER_API_KEY environment variable.');
    }

    // Generate image
    const result = await provider.generateImage(args);

    // Save images if requested
    if (args.save_to_file && result.success && result.images && result.images.length > 0) {
      const savedFiles = await saveImages(result.images, args.filename || 'nanobanana');
      result.saved_files = savedFiles;
    }

    // Format response
    const response = this.formatResponse(result, args.show_full_response);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }

  private selectProvider(preference?: string): ImageProvider | null {
    if (preference === 'gemini' && this.geminiProvider.isAvailable()) {
      return this.geminiProvider;
    }
    if (preference === 'openrouter' && this.openRouterProvider.isAvailable()) {
      return this.openRouterProvider;
    }
    if (preference === 'auto' || !preference) {
      if (this.geminiProvider.isAvailable()) {
        return this.geminiProvider;
      }
      if (this.openRouterProvider.isAvailable()) {
        return this.openRouterProvider;
      }
    }
    return null;
  }

  private formatResponse(result: GenerationResult, showFull: boolean = false): any {
    const response: any = {
      success: result.success,
      provider: result.provider,
      model: result.model,
      prompt: result.prompt,
    };

    if (result.enhanced_prompt) {
      response.enhanced_prompt = result.enhanced_prompt;
    }

    if (result.message) {
      response.message = result.message;
    }

    if (result.error) {
      response.error = result.error;
    }

    if (result.images && result.images.length > 0) {
      response.images = result.images.map((img, index) => {
        if (img.type === 'base64' && img.data) {
          if (showFull) {
            return {
              index: index + 1,
              type: 'base64',
              data: img.data,
              size: formatImageSize(img.data),
              format: img.format || 'unknown'
            };
          } else {
            return {
              index: index + 1,
              type: 'base64',
              size: formatImageSize(img.data),
              format: img.format || 'unknown',
              preview: img.data.substring(0, 100) + '...'
            };
          }
        } else if (img.type === 'url' && img.url) {
          return {
            index: index + 1,
            type: 'url',
            url: img.url
          };
        }
        return img;
      });
      response.image_count = result.images.length;
    }

    if (result.saved_files && result.saved_files.length > 0) {
      response.saved_files = result.saved_files;
    }

    if (result.usage) {
      response.usage = result.usage;
    }

    return response;
  }

  private async handleListProviders() {
    const providers = [
      {
        name: 'Gemini Direct API',
        available: this.geminiProvider.isAvailable(),
        env_var: 'GEMINI_API_KEY',
        description: this.geminiProvider.getModelInfo()
      },
      {
        name: 'OpenRouter API',
        available: this.openRouterProvider.isAvailable(),
        env_var: 'OPENROUTER_API_KEY',
        description: this.openRouterProvider.getModelInfo()
      }
    ];

    const text = `Available Providers:
${providers.map(p => `
${p.available ? '✓' : '✗'} ${p.name}
   Environment Variable: ${p.env_var}
   Status: ${p.available ? 'Configured' : 'Not configured'}
   
   ${p.description}
`).join('\n')}

To use a provider, set the corresponding environment variable in your Claude Desktop configuration.`;

    return {
      content: [
        {
          type: 'text',
          text: text,
        },
      ],
    };
  }

  private async handleListScenarios() {
    const scenarios = [
      {
        name: 'text-to-image',
        description: 'Generate an image from text description only',
        example: 'A futuristic city at sunset with flying cars'
      },
      {
        name: 'style-transfer',
        description: 'Apply the artistic style of reference image(s) to new content',
        example: 'Apply Van Gogh\'s Starry Night style to a photo of a modern city'
      },
      {
        name: 'character-design',
        description: 'Create character sheets with multiple views and poses',
        example: 'Design a cyberpunk warrior character with front, side, and back views'
      },
      {
        name: 'pose-modification',
        description: 'Change the pose of a subject while maintaining appearance',
        example: 'Make the person in this photo appear to be jumping'
      },
      {
        name: 'background-expansion',
        description: 'Expand or replace backgrounds while keeping the main subject',
        example: 'Extend the background to show more of the landscape'
      },
      {
        name: 'multi-reference',
        description: 'Combine elements from multiple reference images',
        example: 'Combine the clothing from image 1 with the pose from image 2'
      },
      {
        name: 'cross-view',
        description: 'Generate different viewing angles or perspectives',
        example: 'Show this object from a bird\'s eye view'
      },
      {
        name: 'ar-overlay',
        description: 'Add augmented reality information overlays',
        example: 'Add holographic UI elements to this scene'
      },
      {
        name: 'photo-enhancement',
        description: 'Enhance and improve photo quality',
        example: 'Enhance the lighting and colors in this photo'
      }
    ];

    const text = `Available Generation Scenarios:
${scenarios.map(s => `
• ${s.name}
  ${s.description}
  Example: "${s.example}"
`).join('\n')}

Use the 'scenario' parameter when generating images to automatically optimize the prompt for your use case.

Tips for Nano Banana (Gemini 2.5 Flash Image Preview):
1. The last reference image determines the final aspect ratio
2. Use a blank white image as the second reference to help with background expansion
3. Be specific and detailed in your prompts for best results
4. Multiple reference images can be combined for complex transformations`;

    return {
      content: [
        {
          type: 'text',
          text: text,
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Nano Banana MCP Server running on stdio');
  }
}

const server = new NanoBananaMCPServer();
server.run().catch(console.error);