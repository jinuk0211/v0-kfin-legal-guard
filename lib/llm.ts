import Anthropic from "@anthropic-ai/sdk"
import { GoogleGenAI } from "@google/genai"
import { resolveModel } from "./models"

// ──────────────────────────────────────────────────────────────────────────
// Single provider-routing entry point for every analyzer (insurance/card/loan).
// Callers pass a system prompt, a user prompt, and a catalog model id; this
// returns the raw text response. JSON cleaning/parsing/normalization stays in
// each domain client — this layer only owns "prompt + model -> text".
// ──────────────────────────────────────────────────────────────────────────

// Anthropic reads ANTHROPIC_API_KEY from env.
const anthropic = new Anthropic()

// Gemini headroom: 2.5 models spend part of the output budget on internal
// "thinking", so give JSON responses extra room to avoid truncation.
const GEMINI_MAX_OUTPUT = 8192

let genai: GoogleGenAI | null = null
function getGenAI(): GoogleGenAI {
  if (!genai) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY가 설정되지 않았습니다. Gemini 모델을 사용하려면 .env.local에 키를 추가하세요."
      )
    }
    genai = new GoogleGenAI({ apiKey })
  }
  return genai
}

export interface CompletionParams {
  system: string
  user: string
  modelId?: string
  maxTokens?: number
}

export async function runCompletion({
  system,
  user,
  modelId,
  maxTokens = 4000,
}: CompletionParams): Promise<string> {
  const model = resolveModel(modelId)

  if (model.provider === "anthropic") {
    const message = await anthropic.messages.create({
      model: model.apiModel,
      max_tokens: maxTokens,
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: user }],
    })
    const textBlock = message.content.find((block) => block.type === "text")
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from AI")
    }
    return textBlock.text
  }

  // Google Gemini — request JSON directly so the existing parsers stay intact.
  const ai = getGenAI()
  const response = await ai.models.generateContent({
    model: model.apiModel,
    contents: user,
    config: {
      systemInstruction: system,
      maxOutputTokens: Math.max(maxTokens, GEMINI_MAX_OUTPUT),
      responseMimeType: "application/json",
    },
  })
  const text = response.text
  if (!text) {
    throw new Error("No text response from AI")
  }
  return text
}
