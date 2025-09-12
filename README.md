# Nano Banana MCP Server

MCP (Model Context Protocol) server for Nano Banana (Gemini 2.5 Flash Image Preview) - supporting both direct Gemini API and OpenRouter access for advanced image generation.

## Features

- **Dual Provider Support**: Use either Google Gemini API directly or access via OpenRouter
- **Text-to-Image Generation**: Create images from detailed text descriptions
- **Image-to-Image Generation**: Transform existing images with text prompts
- **Multi-Reference Support**: Combine multiple reference images for complex transformations
- **Scenario-Based Generation**: Optimized prompts for specific use cases
- **Aspect Ratio Control**: Natural language control over image dimensions
- **File Saving**: Option to save generated images locally

## Installation

```bash
npm install
npm run build
```

## Configuration

### For Claude Desktop

Add to your Claude Desktop configuration file:

#### Using Gemini API directly:
```json
{
  "mcpServers": {
    "nanobanana": {
      "command": "node",
      "args": ["/path/to/nanobanana-mcp/dist/index.js"],
      "env": {
        "GEMINI_API_KEY": "your-gemini-api-key"
      }
    }
  }
}
```

#### Using OpenRouter:
```json
{
  "mcpServers": {
    "nanobanana": {
      "command": "node",
      "args": ["/path/to/nanobanana-mcp/dist/index.js"],
      "env": {
        "OPENROUTER_API_KEY": "your-openrouter-api-key"
      }
    }
  }
}
```

#### Using both providers:
```json
{
  "mcpServers": {
    "nanobanana": {
      "command": "node",
      "args": ["/path/to/nanobanana-mcp/dist/index.js"],
      "env": {
        "GEMINI_API_KEY": "your-gemini-api-key",
        "OPENROUTER_API_KEY": "your-openrouter-api-key"
      }
    }
  }
}
```

## Getting API Keys

### Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create a project or use existing one
3. Click "Get API key" to generate your key

### OpenRouter API Key
1. Visit [OpenRouter](https://openrouter.ai/)
2. Sign up or log in
3. Generate an API key from your dashboard

## Usage Examples

### Basic Text-to-Image
```javascript
generate_image({
  prompt: "A cyberpunk city at night with neon lights and flying cars"
})
```

### Style Transfer with Reference Image
```javascript
generate_image({
  prompt: "Apply this artistic style to a photo of a mountain",
  images: [{
    url: "https://example.com/style-reference.jpg"
  }],
  scenario: "style-transfer"
})
```

### Character Design
```javascript
generate_image({
  prompt: "A steampunk inventor character",
  scenario: "character-design",
  aspect_ratio: "16:9"
})
```

### Multi-Reference Combination
```javascript
generate_image({
  prompt: "Combine the clothing style from the first image with the pose from the second",
  images: [
    { url: "https://example.com/clothing.jpg" },
    { url: "https://example.com/pose.jpg" }
  ],
  scenario: "multi-reference"
})
```

### With File Saving
```javascript
generate_image({
  prompt: "A serene Japanese garden in autumn",
  save_to_file: true,
  filename: "japanese_garden",
  aspect_ratio: "landscape"
})
```

## Available Scenarios

- `text-to-image`: Generate from text only
- `style-transfer`: Apply artistic styles
- `character-design`: Create character sheets
- `pose-modification`: Change poses while maintaining appearance
- `background-expansion`: Extend or modify backgrounds
- `multi-reference`: Combine multiple image elements
- `cross-view`: Generate different viewing angles
- `ar-overlay`: Add AR information overlays
- `photo-enhancement`: Improve photo quality

## Tips for Best Results

1. **Aspect Ratio Control**: When `aspect_ratio` parameter is used, a blank canvas image is automatically added as the last image to control output dimensions (based on Zenn article technique)
2. **How It Works**: The model generates content to fill the blank canvas dimensions
3. **Supported Ratios**: square (1:1), landscape (16:9), portrait (9:16), widescreen (16:10), and custom ratios like 4:3
4. **Reference Images**: When using reference images with aspect ratio control, they are placed before the blank canvas
5. **Detailed Prompts**: Be specific and descriptive for best results

## API Parameters

### generate_image

| Parameter | Type | Description | How it works |
|-----------|------|-------------|--------------|
| `prompt` | string | **Required**. Image description | Sent directly to API |
| `images` | array | Reference images (url or base64), max 3 | Sent as inline_data to API |
| `provider` | string | 'gemini', 'openrouter', or 'auto' | Routes to selected API |
| `scenario` | string | Predefined generation scenario | Enhances prompt with context |
| `aspect_ratio` | string | '1:1', '16:9', '9:16', 'square', 'landscape', 'portrait' | Added to prompt as natural language |
| `negative_prompt` | string | Elements to avoid in the image | Added to prompt as "Avoid: ..." |
| `sample_count` | integer | Number of variations (1-4) | Added to prompt as "Generate N variations" |
| `save_to_file` | boolean | Save generated images locally | Saves to ./generated_images/ |
| `filename` | string | Base filename for saved images | Used for local file naming |
| `show_full_response` | boolean | Include full base64 data in response | Controls response verbosity |

**Note:** The Gemini 2.5 Flash Image Preview model uses natural language processing to interpret styling, composition, and generation instructions rather than structured API parameters.

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run in development
npm run dev
```

## License

MIT

## Credits

Based on Nano Banana (Gemini 2.5 Flash Image Preview) capabilities as documented in:
- [Awesome Nano Banana Images](https://github.com/PicoTrex/Awesome-Nano-Banana-images)
- [Google Gemini API Documentation](https://ai.google.dev/gemini-api/docs/image-generation)