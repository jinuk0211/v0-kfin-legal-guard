import { NextRequest, NextResponse } from "next/server"
import { loanAnalysisRequestSchema } from "@/lib/loan-schemas"
import { analyzeLoan } from "@/lib/loan-anthropic"
import { analysisCacheKey, getCachedReport, saveCachedReport } from "@/lib/db/analysis-cache"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const parseResult = loanAnalysisRequestSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || "Invalid request body" },
        { status: 400 }
      )
    }

    const { contractText, model } = parseResult.data

    // Loans are live-only: no precomputed reports. Require contract text.
    if (!contractText || contractText.trim().length < 100) {
      return NextResponse.json(
        { error: "약관 내용이 너무 짧습니다 (100자 이상)" },
        { status: 400 }
      )
    }

    // 대출은 프로필 비의존 → 문서 해시만으로 캐시. 같은 문서는 LLM 재호출 없이 재사용.
    const cacheKey = analysisCacheKey("loan", contractText, model ?? "")
    const cached = await getCachedReport(cacheKey)
    if (cached) {
      return NextResponse.json({ status: "success", report: cached, cached: true })
    }

    const report = await analyzeLoan(contractText, model)
    await saveCachedReport(cacheKey, report)
    return NextResponse.json({ status: "success", report })
  } catch (error) {
    console.error("[loans/analyze] Error:", error)
    const message = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
