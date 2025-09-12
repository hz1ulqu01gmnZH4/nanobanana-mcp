// Aspect ratio utilities for Nano Banana
// Based on the insight that the last image determines the output aspect ratio

export interface AspectRatioConfig {
  width: number;
  height: number;
  name: string;
}

// Common aspect ratios with their dimensions
export const ASPECT_RATIOS: Record<string, AspectRatioConfig> = {
  '1:1': { width: 1024, height: 1024, name: 'square' },
  'square': { width: 1024, height: 1024, name: 'square' },
  '16:9': { width: 1024, height: 576, name: 'landscape' },
  'landscape': { width: 1024, height: 576, name: 'landscape' },
  '9:16': { width: 576, height: 1024, name: 'portrait' },
  'portrait': { width: 576, height: 1024, name: 'portrait' },
  '4:3': { width: 1024, height: 768, name: '4:3' },
  '3:4': { width: 768, height: 1024, name: '3:4' },
  '16:10': { width: 1024, height: 640, name: 'widescreen' },
  'widescreen': { width: 1024, height: 640, name: 'widescreen' },
  '21:9': { width: 1024, height: 439, name: 'ultrawide' },
  'ultrawide': { width: 1024, height: 439, name: 'ultrawide' },
  '2:1': { width: 1024, height: 512, name: 'panoramic' },
  'panoramic': { width: 1024, height: 512, name: 'panoramic' },
};

/**
 * Parse aspect ratio string and return config
 */
export function parseAspectRatio(ratio?: string): AspectRatioConfig | null {
  if (!ratio) return null;
  
  // Check predefined ratios
  const normalized = ratio.toLowerCase().trim();
  if (ASPECT_RATIOS[normalized]) {
    return ASPECT_RATIOS[normalized];
  }
  
  // Try to parse custom ratio like "16:9"
  const match = ratio.match(/^(\d+):(\d+)$/);
  if (match) {
    const width = parseInt(match[1]);
    const height = parseInt(match[2]);
    
    // Calculate dimensions keeping max dimension at 1024
    const aspectRatio = width / height;
    let finalWidth, finalHeight;
    
    if (aspectRatio >= 1) {
      // Landscape or square
      finalWidth = 1024;
      finalHeight = Math.round(1024 / aspectRatio);
    } else {
      // Portrait
      finalHeight = 1024;
      finalWidth = Math.round(1024 * aspectRatio);
    }
    
    return {
      width: finalWidth,
      height: finalHeight,
      name: ratio
    };
  }
  
  return null;
}


/**
 * Generate a blank image for aspect ratio control
 * These are larger white rectangles to be accepted by the API
 */
export function generateBlankImageSync(config: AspectRatioConfig): string {
  // Pre-generated white images with different aspect ratios
  // These are larger than before to avoid "invalid image" errors
  const blankImages: Record<string, string> = {
    // 100x100 white square (1:1)
    'square': 'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAaklEQVR42u3QMQEAAAjAoNm/tCU8HAAA4NMCriwAAysLzMAKAysLzMAKAysLzMAKAysLzMAKAysLzMAKAysLzMAKAysLzMAKAysLzMAKAysLzMAKAysLzMAKAysLzMAKAysLzMAKAysL+FoBTL0F3UMHQMAAAAAASUVORK5CYII=',
    // 160x90 white rectangle (16:9) 
    'landscape': 'iVBORw0KGgoAAAANSUhEUgAAAKAAAABaCAIAAACOuu7MAAAAaklEQVR42u3QIQEAAAjAoNm/tDP8DwAAAAAAAAAAfKTBOjgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMBbAdW1BN0ZvW8UAAAAAElFTkSuQmCC',
    // 90x160 white rectangle (9:16)
    'portrait': 'iVBORw0KGgoAAAANSUhEUgAAAFoAAACgCAIAAAAaBO6CAAAAaklEQVR42u3QMQEAAAjAoNm/tBf8DgAAAAAAAAAAAAAAAAAAfFSHDgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP7VAaxDBbwC3cFJNbQKAAAAAElFTkSuQmCC',
    // 160x100 white rectangle (16:10)
    'widescreen': 'iVBORw0KGgoAAAANSUhEUgAAAKAAAABkCAIAAACO3jADAAAAaklEQVR42u3QIQEAAAjAoNm/tDP8DwAAAAAAAAAAAADfaTAOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAN4CoP0E3T6XVXsAAAAASUVORK5CYII=',
    // Default to square
    'default': 'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAaklEQVR42u3QMQEAAAjAoNm/tCU8HAAA4NMCriwAAysLzMAKAysLzMAKAysLzMAKAysLzMAKAysLzMAKAysLzMAKAysLzMAKAysLzMAKAysLzMAKAysLzMAKAysLzMAKAysLzMAKAysL+FoBTL0F3UMHQMAAAAAASUVORK5CYII='
  };
  
  // Choose the best matching blank image based on aspect ratio
  const aspectRatio = config.width / config.height;
  let imageKey = 'default';
  
  if (config.name === 'square' || Math.abs(aspectRatio - 1) < 0.1) {
    imageKey = 'square';
  } else if (config.name === 'landscape' || (aspectRatio > 1.5 && aspectRatio < 2)) {
    imageKey = 'landscape';
  } else if (config.name === 'portrait' || aspectRatio < 0.7) {
    imageKey = 'portrait';
  } else if (config.name === 'widescreen' || (aspectRatio > 1.4 && aspectRatio < 1.7)) {
    imageKey = 'widescreen';
  } else if (aspectRatio > 1) {
    imageKey = 'landscape';
  } else {
    imageKey = 'portrait';
  }
  
  return blankImages[imageKey] || blankImages['default'];
}

/**
 * Create a description for the aspect ratio to include in the prompt
 */
export function getAspectRatioPrompt(config: AspectRatioConfig): string {
  const descriptions: Record<string, string> = {
    'square': 'square format (1:1 aspect ratio)',
    'landscape': 'landscape orientation (16:9 aspect ratio)',
    'portrait': 'portrait orientation (9:16 aspect ratio)',
    'widescreen': 'widescreen format (16:10 aspect ratio)',
    'ultrawide': 'ultrawide format (21:9 aspect ratio)',
    'panoramic': 'panoramic format (2:1 aspect ratio)',
  };
  
  return descriptions[config.name] || `${config.width}x${config.height} aspect ratio`;
}