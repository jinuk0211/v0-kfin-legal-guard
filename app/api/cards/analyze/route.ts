import { NextRequest, NextResponse } from "next/server"
import { cardAnalysisRequestSchema } from "@/lib/card-schemas"
import { getCardReport } from "@/lib/card-precomputed"
import { analyzeCard } from "@/lib/card-anthropic"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const parseResult = cardAnalysisRequestSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || "Invalid request body" },
        { status: 400 }
      )
    }

    const { contractText, product, personaId } = parseResult.data

    // 1) Serve a precomputed harness run when the product resolves.
    const precomputed = getCardReport(product, personaId)
    if (precomputed) {
      return NextResponse.json({ status: "success", report: precomputed })
    }

    // 2) Fall back to a live LLM analysis (requires contract text).
    if (!contractText || contractText.trim().length < 100) {
      return NextResponse.json(
        { error: "약관 내용이 너무 짧습니다 (100자 이상)" },
        { status: 400 }
      )
    }

    const persona = personaId ? { id: personaId, risk_flags: [] } : undefined
    const report = await analyzeCard(contractText, persona)
    return NextResponse.json({ status: "success", report })
  } catch (error) {
    console.error("[cards/analyze] Error:", error)
    const message = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
