# Vantage AI Engine

## Overview

The Vantage AI Engine is an optional component that adds in-browser AI/ML capabilities to enhance detection and scoring.

**Status**: Currently a stub/placeholder. Contributions welcome!

## Planned Features

### 1. Small Language Models (SLMs)

Use compact models that run entirely in the browser:

- **WebLLM**: Run Llama-based models via WebGPU
- **Transformers.js**: ONNX-based inference
- **Custom Models**: Fine-tuned on UX patterns

### 2. Pattern Recognition

- Behavioral anomaly detection
- Session flow analysis
- Contextual understanding

### 3. Backend Options

```typescript
import { createEngine } from "@vantage-ai/engine";

const engine = createEngine({
  backend: "onnx",  // or "webllm" | "transformers"
  modelPath: "/models/vantage-ux-v1.onnx",
  devicePreference: "gpu"
});

await engine.init();

const enhancedScore = await engine.analyze(signal);
```

## Performance Considerations

- **Model Size**: Target < 100MB for initial load
- **Inference Time**: < 100ms for real-time feedback
- **GPU Acceleration**: WebGPU when available
- **Lazy Loading**: Only load when needed

## Privacy

- All inference happens in-browser
- No data sent to servers
- Models can be self-hosted
- User can opt-out of AI mode

## Contribution Ideas

1. Integrate Transformers.js for text classification
2. Add ONNX Runtime Web support
3. Create pre-trained models for common patterns
4. Benchmark different backends
5. Add model compression techniques

See `CONTRIBUTING.md` for details.
