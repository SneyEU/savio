/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEFAULT_AI_PROVIDER?: 'ollama' | 'openai-compatible' | 'offline';
  readonly VITE_OLLAMA_URL?: string;
  readonly VITE_OLLAMA_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
