// ──────────────────────────────────────────────────────────────────────────
// LLM model catalog (client + server safe — no SDK imports here).
// Drives the per-page "분석 모델" dropdown and the server-side provider routing
// in lib/llm.ts. Add an entry here to expose a new model in every analyzer.
// ──────────────────────────────────────────────────────────────────────────

export type LlmProvider = "anthropic" | "google"

export interface LlmModel {
  // Stable id sent in the request body and used in the cache key.
  id: string
  // Dropdown label.
  label: string
  provider: LlmProvider
  // Actual model id passed to the provider SDK.
  apiModel: string
}

export const PROVIDER_LABELS: Record<LlmProvider, string> = {
  anthropic: "Claude (Anthropic)",
  google: "Gemini (Google)",
}

export const LLM_MODELS: LlmModel[] = [
  // Default — keeps the previously hardcoded behavior unchanged.
  { id: "claude-sonnet-4", label: "Claude Sonnet 4", provider: "anthropic", apiModel: "claude-sonnet-4-20250514" },
  { id: "claude-opus-4-8", label: "Claude Opus 4.8", provider: "anthropic", apiModel: "claude-opus-4-8" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", provider: "google", apiModel: "gemini-2.5-pro" },
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", provider: "google", apiModel: "gemini-2.5-flash" },
]

export const DEFAULT_MODEL_ID = "claude-sonnet-4"

/** Resolve a request model id to a catalog entry, falling back to the default. */
export function resolveModel(modelId?: string): LlmModel {
  return (
    LLM_MODELS.find((m) => m.id === modelId) ??
    LLM_MODELS.find((m) => m.id === DEFAULT_MODEL_ID) ??
    LLM_MODELS[0]
  )
}
