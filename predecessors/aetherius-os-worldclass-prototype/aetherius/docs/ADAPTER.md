# Model Adapter (model_adapter/index.ts)

This adapter provides a single `generate(prompt, backend)` interface for the front-end to call any LLM backend.
It is intentionally minimal and **safe** (contains no secrets).

## Backends supported (stubs)
- `local` - calls a local inference server at REACT_APP_LOCAL_MODEL_URL (default http://localhost:8000).
- `huggingface` - placeholder to call Hugging Face Inference API (recommended to proxy server-side).
- `gemini` - placeholder to call Gemini (Google); **do not** put API keys in client code — always proxy server-side.

## Recommended deployment pattern
1. Implement server-side proxy endpoints for any cloud LLM (Gemini/HuggingFace) to keep API keys secret.
2. The front-end uses the adapter with `backend` set to `local` in development.
3. To switch to production cloud models, configure environment variables locally (do NOT commit them).

## Example (React)
```ts
import { generate } from "../model_adapter";

const out = await generate("Hello world", "local");
```

## Notes
- This is a stub. Replace the Gemini and HuggingFace branches with secure server-side calls.
- I will scan the repository for direct Gemini/OpenAI calls and provide patches to route them through this adapter.