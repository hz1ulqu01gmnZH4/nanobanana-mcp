# Nano Banana MCP Tests

## Test Organization

### Core Functionality Tests
- `test-direct.js` - Direct Gemini API test
- `test-mcp.js` - MCP server integration test
- `test-scenarios.js` - Basic scenario testing
- `test-with-save.js` - Image saving functionality

### Parameter Tests
- `test-all-parameters.js` - All parameter combinations
- `test-aspect-ratio.js` - Aspect ratio control
- `test-aspect-simple.js` - Simple aspect ratio test
- `test-aspect-save.js` - Aspect ratio with saving
- `test-final.js` - Final integration test

### Coverage Tests
- `test-comprehensive.js` - Comprehensive scenario coverage (4 multi-panel tests)
- `test-complete-coverage.js` - Additional coverage (4 more multi-panel tests)
- `test-full-coverage.js` - Full 100% coverage (4 final multi-panel tests)
- `test-game-assets.js` - Specific game asset generation test

### Test Suites
- `run-basic.js` - Run basic functionality tests
- `run-coverage.js` - Run all coverage tests
- `run-all.js` - Run all tests

## Running Tests

### Basic Tests
```bash
cd test
node run-basic.js
```

### Coverage Tests (12 API calls for 100% coverage)
```bash
cd test
node run-coverage.js
```

### All Tests
```bash
cd test
node run-all.js
```

### Individual Tests
```bash
cd test
node test-direct.js        # Test direct Gemini API
node test-comprehensive.js # Run comprehensive coverage
```

## Test Coverage

The coverage tests achieve 100% coverage of all Nano Banana scenarios documented in the [Awesome-Nano-Banana-images README](https://github.com/PicoTrex/Awesome-Nano-Banana-images/blob/main/README_en.md) with just 12 API calls:

1. **Character & Poses** - Character transformations, expressions
2. **Photo Editing** - AR overlays, enhancement
3. **Architecture** - Visualizations, isometric views
4. **Stickers** - Character sticker sheets
5. **Product Design** - Commerce, packaging, materials
6. **Education** - Diagrams, UI/UX, instructional
7. **Game Assets** - Sprites, textures, blueprints
8. **Fashion** - Tech packs, virtual try-on
9. **Food & Nutrition** - Styling, calories, recipes
10. **Historical** - Era transformations, reconstruction
11. **Art Styles** - Minecraft, comics, anime
12. **Beauty & Personal** - Hair, makeup, ID photos

## Environment Variables

Tests require either:
- `GOOGLE_AI_API_KEY` for direct Gemini API
- `OPENROUTER_API_KEY` for OpenRouter API

```bash
export GOOGLE_AI_API_KEY="your-key-here"
# or
export OPENROUTER_API_KEY="your-key-here"
```