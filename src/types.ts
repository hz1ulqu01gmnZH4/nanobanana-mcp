export interface ImageInput {
  url?: string;
  base64?: string;
  mimeType?: string;
  description?: string;
}

export interface ImageGenerationArgs {
  prompt: string;
  images?: ImageInput[];
  provider?: 'gemini' | 'openrouter' | 'auto';
  scenario?: ScenarioType;
  aspect_ratio?: string;
  negative_prompt?: string;
  save_to_file?: boolean;
  filename?: string;
  show_full_response?: boolean;
  sample_count?: number;
}

export type ScenarioType = 
  | 'text-to-image'
  | 'style-transfer'
  | 'character-design'
  | 'pose-modification'
  | 'background-expansion'
  | 'multi-reference'
  | 'cross-view'
  | 'ar-overlay'
  | 'photo-enhancement';

export interface GenerationResult {
  success: boolean;
  provider: string;
  model: string;
  prompt: string;
  enhanced_prompt?: string;
  message?: string;
  images?: GeneratedImage[];
  saved_files?: string[];
  usage?: {
    tokens?: number;
    input_tokens?: number;
    output_tokens?: number;
  };
  error?: string;
}

export interface GeneratedImage {
  type: 'base64' | 'url';
  data?: string;
  url?: string;
  size?: string;
  format?: string;
}

export interface ImageProvider {
  name: string;
  isAvailable(): boolean;
  generateImage(args: ImageGenerationArgs): Promise<GenerationResult>;
  getModelInfo(): string;
}