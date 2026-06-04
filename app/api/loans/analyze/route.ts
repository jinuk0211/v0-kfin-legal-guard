import { NextRequest, NextResponse } from "next/server"
import { loanAnalysisRequestSchema } from "@/lib/loan-schemas"
import { analyzeLoan } from "@/lib/loan-anthropic"

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

    const { contractText } = parseResult.data

    // Loans are live-only: no precomputed reports. Require contract text.
    if (!contractText || contractText.trim().length < 100) {
      return NextResponse.json(
        { error: "약관 내용이 너무 짧습니다 (100자 이상)" },
        { status: 400 }
      )
    }

    const report = await analyzeLoan(contractText)
    return NextResponse.json({ status: "success", report })
  } catch (error) {
    console.error("[loans/analyze] Error:", error)
    const message = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
