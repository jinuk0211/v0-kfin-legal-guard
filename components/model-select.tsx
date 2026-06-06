"use client"

import { LLM_MODELS, PROVIDER_LABELS, type LlmProvider } from "@/lib/models"

interface ModelSelectProps {
  value: string
  onChange: (id: string) => void
  className?: string
}

// Group catalog models by provider so the dropdown shows Claude/Gemini sections.
const PROVIDERS = Array.from(new Set(LLM_MODELS.map((m) => m.provider))) as LlmProvider[]

export function ModelSelect({ value, onChange, className }: ModelSelectProps) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-muted-foreground">
        분석 모델
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
      >
        {PROVIDERS.map((provider) => (
          <optgroup key={provider} label={PROVIDER_LABELS[provider]}>
            {LLM_MODELS.filter((m) => m.provider === provider).map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  )
}
